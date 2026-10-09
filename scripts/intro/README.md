# The opening titles

Six shots, each a poster-style still animated by Higgsfield DoP, stitched with crossfades.

1. Stills: `public/intro/*.png`, generated with `recraft/v4.1/text-to-image` at 16:9 using the
   style string in `scripts/art/assets.json` (prompts are in the git history of this folder).
2. Clips: `higgsfield-ai/dop/standard` with `{ prompt, image_url }`, where `image_url` is a public
   URL of the still (the raw GitHub URL of the committed file works). About four minutes a clip.
   The prompt starts "Animate this flat screen-printed poster illustration, keeping every shape,
   colour and the paper grain exactly as drawn…" and then names one gentle motion per shot.
3. Stitch: `scripts/intro/stitch.sh` → `public/intro/intro.mp4` (720p, h264, no audio).

`src/game/Intro.tsx` times the captions off the same SHOT and XFADE numbers.
