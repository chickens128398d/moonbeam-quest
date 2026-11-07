# Moonbeam Quest — The Pie Party Update

A sunny pixel-art unicorn dungeon adventure made for Jamie. Built with HTML, CSS, and JavaScript, without libraries, downloads, ads, trackers, or remote assets.

## Play locally

Open `index.html`, or run `python3 -m http.server 8000` and visit http://localhost:8000.

## What's new

- Six large randomized 31 × 21 tile mazes (1,240 × 840 world pixels), plus a spacious thunder boss arena. A smooth camera follows you as you explore.
- A corner minimap reveals explored passages, nearby discovered storms, your position, your camera view, and the unlocked rainbow exit or boss pie.
- A friendly **Good job!** screen counts the rooms you completed. Your best run stays on this browser when local storage is available.
- Beat room 7 and collect the boss pie to unlock a playable, endless party room: rainbow decorations, confetti everywhere, unlimited pie, flying wings, and glitter poop!
- An analog touch joystick and large action button work in portrait and landscape. Rotation preserves your position and dungeon layout.

## Procedural audio

Turn **SOUND ON** in the toolbar to hear an original music-box score with bell harmonics, arpeggios, soft chords, and bass. Exploration has a gentle arrangement; the thunder boss adds a minor progression and a heartbeat rhythm; the pie party gets a faster, sparkling dance arrangement. Music and layered effects are synthesized entirely with the Web Audio API in `audio.js`. No audio files or network access are needed.

Each magic upgrade has a distinct rising spell sound. Storms rumble, hits pop, defeated enemies shimmer, and room clears and upgrades play little fanfares. The party adds jump, landing, glitter, and pie-pickup sounds. Sound defaults off, fades out when muted or paused, and resumes with the game. A master compressor and effect throttling keep busy battles controlled.

## Controls

- **Desktop:** WASD / arrows to move; hold Space to shoot. In the party room, hold Space to jump, fly, and poop glitter. Release to land.
- **Mobile:** drag the joystick to move; hold SHOOT for magic. The button becomes FLY in the party room. Use both thumbs together.
- Magic automatically aims at the nearest storm in sight. Walls block magic and enemy bolts.
- Clear all storms, then walk through the rainbow door on the right. Explore using the corner minimap.
- Each new room restores 100 health. Storms deal 3 damage; the boss deals 10. Brief protection follows each hit.
- Rooms 1–6 contain 6, 7, 8, 9, 10, and 11 storms. Room 7 contains the thunder boss.
- Rainbow deals 3 damage; room 3 unlocks Moonbeam (5); room 5 unlocks Sunshine (10).
- Collect pies after landing in the party room. They never run out! Your pie counter appears in the toolbar.
- P / Escape or the pause button pauses either the dungeon or party. Restart from the pause screen. Switching away pauses automatically.
- Sound is optional and off by default. Everything runs locally, including offline after downloading the four site files.

## Verification

With Node.js installed, run `node tests/game.test.cjs` and `node tests/audio.test.cjs`. The dependency-free simulation checks all seven rooms with actual projectiles, connected randomized mazes and walkable exits, scrolling and discovery, resizing, joystick cancellation, mobile flight, upgrades, health, room counts, saved best runs, the party transition, endless pie, Space flight, glitter, pause, replay, and rendering calls.

The audio checks cover all score arrangements and effects, scheduler lifecycle, envelopes, effect throttling, voice cleanup, mute, pause/resume, rapid toggling, and browsers without Web Audio.

## GitHub Pages

Push the files to a GitHub repository. In **Settings → Pages**, choose **Deploy from a branch**, your branch, and **/ (root)**. Relative paths work without a build step.
