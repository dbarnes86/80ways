# The opening titles

Four shots, each a poster-style still animated by Higgsfield (Kling 2.6 Pro, Wan 2.7 as backup), each fading in from black with its own line of the story.

1. Stills: `public/intro/*.webp` (the PNG originals are only needed while animating), generated with `recraft/v4.1/text-to-image` at 16:9 using the
   style string in `scripts/art/assets.json` (prompts are in the git history of this folder).
2. Clips: `kling-video/v2.6/pro/image-to-video` (or `wan/v2.7/image-to-video`) with `{ prompt, image_url }`, where `image_url` is a public
   URL of the still (the raw GitHub URL of the committed file works). Two to five minutes a clip. Subjects are drawn in profile so they can cross the frame; the prompt names the direction ("from left to right and out of shot on the right"). DoP was tried first and drifts too much.
   The prompt starts "Animate this flat screen-printed poster illustration, keeping every shape,
   colour and the paper grain exactly as drawn…" and then names one gentle motion per shot.
3. Stitch: `scripts/intro/stitch.sh` → `public/intro/intro.mp4` (540p, h264, 24 fps, no audio). Keep every clip at the same frame rate: Wan is 30 fps, Kling 24, and mixing them stutters.

`src/game/Intro.tsx` times the captions off the same SHOT number and holds the copy for each shot.
