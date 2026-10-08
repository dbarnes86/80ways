#!/usr/bin/env node
/**
 * Generate the game's art with Higgsfield and write it to public/art/, plus a manifest the app
 * reads (src/game/artManifest.json) so generated images replace the SVG fallbacks automatically.
 *
 *   HF_KEY=key_id:key_secret node scripts/art/generate.mjs           # missing assets only
 *   HF_KEY=... node scripts/art/generate.mjs --force ship coin       # regenerate named ones
 *
 * In a Claude Code cloud session with Higgsfield connected, HF_KEY isn't needed: the network proxy
 * adds the credentials.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'public/art');
const manifestPath = path.join(root, 'src/game/artManifest.json');
const spec = JSON.parse(await fs.readFile(path.join(root, 'scripts/art/assets.json'), 'utf8'));

const API = 'https://api.higgsfield.ai';
const headers = { 'Content-Type': 'application/json' };
if (process.env.HF_KEY) headers.Authorization = `Key ${process.env.HF_KEY}`;

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

async function exists(p) {
  return fs.access(p).then(() => true, () => false);
}

async function generate(asset) {
  const submit = await fetch(`${API}/${spec.model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: `${asset.prompt}. ${spec.style}`, resolution: '2K', aspect_ratio: asset.aspect }),
  });
  const job = await submit.json();
  if (!submit.ok) throw new Error(`${asset.name}: ${submit.status} ${JSON.stringify(job)}`);

  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(job.status_url, { headers });
    const status = await res.json();
    if (status.status === 'completed') {
      const url = status.images?.[0]?.url;
      if (!url) throw new Error(`${asset.name}: completed without an image`);
      const img = await fetch(url);
      const file = path.join(outDir, `${asset.name}.png`);
      await fs.writeFile(file, Buffer.from(await img.arrayBuffer()));
      return file;
    }
    if (['failed', 'nsfw', 'canceled'].includes(status.status)) throw new Error(`${asset.name}: ${status.status}`);
  }
  throw new Error(`${asset.name}: timed out`);
}

await fs.mkdir(outDir, { recursive: true });
const todo = [];
for (const asset of spec.assets) {
  if (only.length && !only.includes(asset.name)) continue;
  if (!force && (await exists(path.join(outDir, `${asset.name}.png`)))) continue;
  todo.push(asset);
}
console.log(`Generating ${todo.length} asset(s)…`);

// A few at a time: quick, without tripping rate limits.
const failures = [];
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
const files = (await fs.readdir(outDir)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort();
await fs.writeFile(manifestPath, JSON.stringify(files, null, 2) + '\n');
console.log(`Manifest: ${files.length} image(s). ${failures.length ? `Failed: ${failures.join(', ')}` : 'All done.'}`);
process.exit(failures.length ? 1 : 0);
