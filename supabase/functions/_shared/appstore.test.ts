// @vitest-environment node
import { describe, expect, it, beforeAll } from 'vitest'
import { webcrypto } from 'node:crypto'
import * as x509 from '@peculiar/x509'
import { CompactSign, importPKCS8, exportPKCS8 } from 'jose'
import { appleEntitlement, verifyAppleJWS } from './appstore'

x509.cryptoProvider.set(webcrypto as unknown as Crypto)
const alg = { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' } as const
const DAY = 86_400_000

interface Chain { x5c: string[]; leafKey: CryptoKey; rootSha: string }

async function makeChain(opts: { oids?: boolean } = {}): Promise<Chain> {
  const now = Date.now()
  const keys = await Promise.all([0, 1, 2].map(() => webcrypto.subtle.generateKey(alg, true, ['sign', 'verify']) as Promise<CryptoKeyPair>))
  const [rootK, intK, leafK] = keys
  const marker = (oid: string) => new x509.Extension(oid, false, new Uint8Array([5, 0]))
  const root = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01', name: 'CN=Test Root', notBefore: new Date(now - DAY), notAfter: new Date(now + 365 * DAY), keys: rootK, signingAlgorithm: alg,
    extensions: [new x509.BasicConstraintsExtension(true, undefined, true)],
  })
  const inter = await x509.X509CertificateGenerator.create({
    serialNumber: '02', subject: 'CN=Test WWDR', issuer: root.subject, notBefore: new Date(now - DAY), notAfter: new Date(now + 365 * DAY),
    signingKey: rootK.privateKey, publicKey: intK.publicKey, signingAlgorithm: alg,
    extensions: [new x509.BasicConstraintsExtension(true, 0, true), ...(opts.oids === false ? [] : [marker('1.2.840.113635.100.6.2.1')])],
  })
  const leaf = await x509.X509CertificateGenerator.create({
    serialNumber: '03', subject: 'CN=Test Signing', issuer: inter.subject, notBefore: new Date(now - DAY), notAfter: new Date(now + 365 * DAY),
    signingKey: intK.privateKey, publicKey: leafK.publicKey, signingAlgorithm: alg,
    extensions: opts.oids === false ? [] : [marker('1.2.840.113635.100.6.11.1')],
  })
  const b64 = (c: x509.X509Certificate) => Buffer.from(c.rawData).toString('base64')
  const rootSha = Buffer.from(await root.getThumbprint('SHA-256')).toString('hex')
  return { x5c: [b64(leaf), b64(inter), b64(root)], leafKey: leafK.privateKey, rootSha }
}

async function sign(chain: Chain, payload: object, key = chain.leafKey) {
  const pk = await importPKCS8(await exportPKCS8(key), 'ES256')
  return new CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: 'ES256', x5c: chain.x5c })
    .sign(pk)
}

describe('verifyAppleJWS', () => {
  let chain: Chain
  beforeAll(async () => {
    chain = await makeChain()
  })

  it('accepts a payload signed by a valid chain with the pinned root', async () => {
    const jws = await sign(chain, { productId: 'p', transactionId: '1' })
    await expect(verifyAppleJWS(jws, { rootSha256: chain.rootSha })).resolves.toMatchObject({ productId: 'p' })
  })

  it('rejects the right chain against the real Apple root pin', async () => {
    const jws = await sign(chain, { productId: 'p' })
    await expect(verifyAppleJWS(jws)).rejects.toThrow('root is not Apple Root CA - G3')
  })

  it('rejects a payload signed by a key that is not the leaf', async () => {
    const other = (await webcrypto.subtle.generateKey(alg, true, ['sign', 'verify'])) as CryptoKeyPair
    const jws = await sign(chain, { productId: 'p' }, other.privateKey)
    await expect(verifyAppleJWS(jws, { rootSha256: chain.rootSha })).rejects.toThrow()
  })

  it('rejects a chain without Apple marker OIDs', async () => {
    const bare = await makeChain({ oids: false })
    const jws = await sign(bare, { productId: 'p' })
    await expect(verifyAppleJWS(jws, { rootSha256: bare.rootSha })).rejects.toThrow('leaf is not an App Store signing certificate')
  })

  it('rejects a broken chain', async () => {
    const other = await makeChain()
    const jws = await sign({ ...chain, x5c: [chain.x5c[0], other.x5c[1], chain.x5c[2]] }, { productId: 'p' })
    await expect(verifyAppleJWS(jws, { rootSha256: chain.rootSha })).rejects.toThrow('certificate chain does not verify')
  })
})

describe('appleEntitlement', () => {
  const now = new Date('2026-10-08T12:00:00Z')
  const base = { transactionId: 't', originalTransactionId: 'o', bundleId: 'b', productId: 'p' }

  it('is a member until the subscription expires', () => {
    expect(appleEntitlement({ ...base, expiresDate: now.getTime() + DAY }, { autoRenewStatus: 1 }, now)).toMatchObject({
      tier: 'member', billing_status: 'active', cancel_at_period_end: false, source: 'app_store',
    })
    expect(appleEntitlement({ ...base, expiresDate: now.getTime() - 1 }, null, now)).toMatchObject({ tier: 'free', billing_status: 'expired', current_period_end: null })
  })

  it('keeps access during the billing grace period', () => {
    const out = appleEntitlement({ ...base, expiresDate: now.getTime() - DAY }, { gracePeriodExpiresDate: now.getTime() + DAY, isInBillingRetryPeriod: true }, now)
    expect(out).toMatchObject({ tier: 'member', billing_status: 'past_due' })
  })

  it('drops access immediately on refund', () => {
    expect(appleEntitlement({ ...base, expiresDate: now.getTime() + DAY, revocationDate: now.getTime() }, null, now)).toMatchObject({ tier: 'free', billing_status: 'revoked' })
  })

  it('flags a cancelled auto-renew', () => {
    expect(appleEntitlement({ ...base, expiresDate: now.getTime() + DAY }, { autoRenewStatus: 0 }, now).cancel_at_period_end).toBe(true)
  })
})
