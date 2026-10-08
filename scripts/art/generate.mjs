#!/usr/bin/env node
/**
 * Generate the game's art with Higgsfield and write it to public/art/, plus a manifest the app
 * reads (src/game/artManifest.json) so generated images replace the SVG fallbacks automatically.
 *
 *   HF_KEY=key_id:key_secret node scripts/art/generate.mjs           # missing assets only
 *   HF_KEY=... node scripts/art/generate.mjs --force ship coin       # regenerate named ones
 *   node scripts/art/generate.mjs --optimize-only                    # redo cut-outs from scripts/art/raw
 *
 * In a Claude Code cloud session with Higgsfield connected, HF_KEY isn't needed: the network proxy
 * adds the credentials. Node's fetch skips the proxy unless told, so run it as:
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt \
 *     HF_MODEL=higgsfield-ai/soul/standard node scripts/art/generate.mjs --force …
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from './optimize.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'public/art');
// Full-size originals, kept out of git; only the optimised WebPs ship.
const rawDir = path.join(root, 'scripts/art/raw');
const manifestPath = path.join(root, 'src/game/artManifest.json');
const spec = JSON.parse(await fs.readFile(path.join(root, 'scripts/art/assets.json'), 'utf8'));

const API = process.env.HF_API ?? 'https://api.higgsfield.ai';
const headers = { 'Content-Type': 'application/json' };
if (process.env.HF_KEY) headers.Authorization = `Key ${process.env.HF_KEY}`;

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

async function exists(p) {
  return fs.access(p).then(() => true, () => false);
}

/**
 * Model names change; try these in order and keep the first the account accepts. Each has its own
 * input shape. Force one with HF_MODEL=<name> (it gets the generic shape).
 */
const MODELS = [
  { id: 'flux-pro/kontext/max/text-to-image', body: (prompt, aspect) => ({ prompt, aspect_ratio: aspect, safety_tolerance: 2 }) },
  { id: 'bytedance/seedream/v4/text-to-image', body: (prompt, aspect) => ({ prompt, aspect_ratio: aspect, resolution: '2K' }) },
  { id: 'higgsfield-ai/soul/standard', body: (prompt, aspect) => ({ prompt, aspect_ratio: aspect }) },
];
// An asset can name the model that suits it ("model" in assets.json), e.g. Recraft for chests.
let chosen = process.env.HF_MODEL ? { id: process.env.HF_MODEL, body: (prompt, aspect) => ({ prompt, aspect_ratio: aspect }) } : null;

async function submitJob(asset) {
  const prompt = `${asset.prompt}. ${spec.style}`;
  const own = asset.model && { id: asset.model, body: (p, aspect) => ({ prompt: p, aspect_ratio: aspect }) };
  const candidates = own ? [own] : chosen ? [chosen] : MODELS;
  for (const model of candidates) {
    const res = await fetch(`${API}/${model.id}`, { method: 'POST', headers, body: JSON.stringify(model.body(prompt, asset.aspect)) });
    const job = await res.json().catch(() => ({}));
    if (res.status === 404 && !chosen && !own) continue; // not on this account; try the next
    if (!res.ok) throw new Error(`${asset.name}: ${model.id} ${res.status} ${JSON.stringify(job)}`);
    if (!chosen && !own) {
      chosen = model;
      console.log(`Using model ${model.id}`);
    }
    return job;
  }
  throw new Error(`${asset.name}: none of the models were found (${MODELS.map((m) => m.id).join(', ')}). Set HF_MODEL to one your account has.`);
}

async function generate(asset) {
  const job = await submitJob(asset);

  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(job.status_url, { headers });
    const status = await res.json();
    if (status.status === 'completed') {
      const url = status.images?.[0]?.url ?? status.jobs?.[0]?.results?.raw?.url ?? status.results?.raw?.url;
      if (!url) throw new Error(`${asset.name}: completed without an image`);
      const img = await fetch(url);
      const raw = path.join(rawDir, `${asset.name}.png`);
      await fs.writeFile(raw, Buffer.from(await img.arrayBuffer()));
      const file = path.join(outDir, `${asset.name}.webp`);
      await optimize(raw, file, asset.name);
      return file;
    }
    if (['failed', 'nsfw', 'canceled'].includes(status.status)) throw new Error(`${asset.name}: ${status.status}`);
  }
  throw new Error(`${asset.name}: timed out`);
}

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(rawDir, { recursive: true });

// --optimize-only: re-run the cut-out and resize on originals already downloaded.
if (args.includes('--optimize-only')) {
  for (const f of (await fs.readdir(rawDir)).filter((f) => f.endsWith('.png'))) {
    const name = f.replace(/\.png$/, '');
    await optimize(path.join(rawDir, f), path.join(outDir, `${name}.webp`), name);
    console.log(`✓ ${name}`);
  }
}
const todo = [];

for (const asset of spec.assets) {
  if (only.length && !only.includes(asset.name)) continue;
  if (args.includes('--optimize-only')) break;
  if (!force && (await exists(path.join(outDir, `${asset.name}.webp`)))) continue;
  todo.push(asset);
}
console.log(`Generating ${todo.length} asset(s)…`);

// A few at a time: quick, without tripping rate limits.
const failures = [];
// The first asset finds a working model on its own, so the rest don't all probe at once.
if (todo.length && !chosen) {
  const a = todo.shift();
  await generate(a).then(
    (f) => console.log(`✓ ${a.name} → ${path.relative(root, f)}`),
    (e) => {
      failures.push(a.name);
      console.error(`✗ ${e.message}`);
    },
  );
  if (!chosen) {
    console.error('Stopping: no working model yet, so the rest would fail the same way.');
    process.exit(1);
  }
}
for (let i = 0; i < todo.length; i += 4) {
  await Promise.all(
    todo.slice(i, i + 4).map((a) =>
      generate(a).then(
        (f) => console.log(`✓ ${a.name} → ${path.relative(root, f)}`),
        (e) => {
          failures.push(a.name);
          console.error(`✗ ${e.message}`);
        },
      ),
    ),
  );
}

// The manifest lists every image present, so the app only uses art that exists.
const skip = new Set(spec.skip ?? []);
const files = (await fs.readdir(outDir))
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.replace(/\.webp$/, ''))
  .filter((n) => !skip.has(n))
  .sort();
await fs.writeFile(manifestPath, JSON.stringify(files, null, 2) + '\n');
console.log(`Manifest: ${files.length} image(s). ${failures.length ? `Failed: ${failures.join(', ')}` : 'All done.'}`);
process.exit(failures.length ? 1 : 0);
