/**
 * Turn a raw generated image (subject on a plain background, ~1.5k px, ~1 MB) into what the app ships: the
 * black background cut away to real transparency, cropped to the subject, sized for how big it's
 * shown, and saved as WebP (tens of KB).
 *
 * The cut-out flood-fills from the image edges through pixels close to the border colour, so dark parts inside the
 * subject (a black coat, a hat) stay solid; only background connected to the border goes.
 */
import sharp from 'sharp';

/** Longest side in pixels: about 2x the largest size each kind is drawn at. */
export function maxSizeFor(name) {
  if (name === 'ship') return 640;
  if (name === 'coin' || name.startsWith('orb-')) return 192;
  if (name.startsWith('chest-')) return 400;
  if (name.startsWith('stamp-')) return 400;
  return 512; // portraits, avatars
}

const DARK = 28; // this close to the border colour counts as background
const SOFT = 56; // between DARK and SOFT, edge pixels fade instead of cutting hard

export async function optimize(inputPath, outputPath, name) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Most come back on black, a few on white: key off whatever the border actually is.
  const border = [];
  for (let x = 0; x < w; x += 4) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 4) border.push(y * w, y * w + w - 1);
  const ref = [0, 1, 2].map((c) => {
    const v = border.map((i) => data[i * 4 + c]).sort((a, b) => a - b);
    return v[v.length >> 1];
  });
  // Distance from the background colour (0 = background).
  const px = (i) => Math.max(Math.abs(data[i * 4] - ref[0]), Math.abs(data[i * 4 + 1] - ref[1]), Math.abs(data[i * 4 + 2] - ref[2]));

  // Flood fill the background from every edge pixel.
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || px(i) >= SOFT) continue;
    bg[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) {
      const v = px(i);
      // Background goes fully clear; the dim halo around the subject fades out smoothly.
      data[i * 4 + 3] = v <= DARK ? 0 : Math.round(((v - DARK) / (SOFT - DARK)) * 255);
    }
    if (data[i * 4 + 3] > 16) {
      const x = i % w;
      const y = (i - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) throw new Error(`${name}: nothing left after removing the background`);

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const max = maxSizeFor(name);
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width: Math.min(w, maxX + pad) - left, height: Math.min(h, maxY + pad) - top })
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(outputPath);
}
