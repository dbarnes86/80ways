/**
 * App Store (StoreKit 2) verification and entitlement rules.
 *
 * Apple signs transactions and server notifications as JWS with an x5c certificate chain.
 * We trust a payload only if:
 *   1. every certificate is in date and signed by the next one in the chain,
 *   2. the leaf and intermediate carry Apple's marker OIDs (as Apple's own library checks),
 *   3. the root is Apple Root CA - G3, pinned by SHA-256 fingerprint,
 *   4. the JWS signature verifies with the leaf's key.
 * Pure WebCrypto (jose + @peculiar/x509) so it runs the same in Deno and Node.
 */
import { compactVerify, decodeProtectedHeader, importX509 } from 'jose'
import { X509Certificate } from '@peculiar/x509'
import type { EntitlementFields } from './billing.ts'

/** SHA-256 of Apple Root CA - G3, lower-case hex without separators. */
export const APPLE_ROOT_CA_G3_SHA256 = '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179'
const OID_LEAF = '1.2.840.113635.100.6.11.1'
const OID_INTERMEDIATE = '1.2.840.113635.100.6.2.1'

export class AppleVerificationError extends Error {}

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export interface VerifyOptions {
  /** Override for tests only. */
  rootSha256?: string
  /** Override for tests only. */
  requireAppleOids?: boolean
  now?: Date
}

export async function verifyAppleJWS<T = Record<string, unknown>>(jws: string, opts: VerifyOptions = {}): Promise<T> {
  const header = decodeProtectedHeader(jws)
  const x5c = header.x5c
  if (header.alg !== 'ES256' || !Array.isArray(x5c) || x5c.length < 3) {
    throw new AppleVerificationError('JWS is not signed with an Apple certificate chain')
  }

  const certs = x5c.map((b64) => new X509Certificate(b64))
  const now = opts.now ?? new Date()
  for (const c of certs) {
    if (now < c.notBefore || now > c.notAfter) throw new AppleVerificationError('certificate out of date')
  }
  for (let i = 0; i < certs.length - 1; i++) {
    const ok = await certs[i].verify({ publicKey: await certs[i + 1].publicKey.export(), signatureOnly: true })
    if (!ok) throw new AppleVerificationError('certificate chain does not verify')
  }

  const root = certs[certs.length - 1]
  const rootSha = toHex(await root.getThumbprint('SHA-256'))
  if (rootSha !== (opts.rootSha256 ?? APPLE_ROOT_CA_G3_SHA256)) throw new AppleVerificationError('root is not Apple Root CA - G3')

  if (opts.requireAppleOids ?? true) {
    if (!certs[0].getExtension(OID_LEAF)) throw new AppleVerificationError('leaf is not an App Store signing certificate')
    if (!certs[1].getExtension(OID_INTERMEDIATE)) throw new AppleVerificationError('intermediate is not Apple WWDR')
  }

  const pem = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`
  const key = await importX509(pem, 'ES256')
  const { payload } = await compactVerify(jws, key)
  return JSON.parse(new TextDecoder().decode(payload)) as T
}

/** The fields of a decoded StoreKit 2 transaction that we use. */
export interface AppleTransaction {
  transactionId: string
  originalTransactionId: string
  bundleId: string
  productId: string
  appAccountToken?: string
  expiresDate?: number
  revocationDate?: number
  environment?: 'Sandbox' | 'Production' | 'Xcode'
  type?: string
}

export interface AppleRenewalInfo {
  autoRenewStatus?: 0 | 1
  isInBillingRetryPeriod?: boolean
  gracePeriodExpiresDate?: number
}

/** The entitlement a verified subscription transaction implies right now. */
export function appleEntitlement(tx: AppleTransaction, renewal: AppleRenewalInfo | null, now: Date = new Date()): EntitlementFields {
  const graceUntil = renewal?.gracePeriodExpiresDate ?? 0
  const expires = tx.expiresDate ?? 0
  const revoked = !!tx.revocationDate
  const inGrace = !revoked && graceUntil > now.getTime()
  const active = !revoked && (expires > now.getTime() || inGrace)

  let billing_status: string
  if (revoked) billing_status = 'revoked'
  else if (inGrace || renewal?.isInBillingRetryPeriod) billing_status = 'past_due'
  else billing_status = active ? 'active' : 'expired'

  return {
    tier: active ? 'member' : 'free',
    source: 'app_store',
    billing_status,
    cancel_at_period_end: renewal ? renewal.autoRenewStatus === 0 : false,
    current_period_end: active && expires ? new Date(expires).toISOString() : null,
  }
}
