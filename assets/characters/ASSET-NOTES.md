# Community art adapted for dsh-pet

These three characters were selected by the user from **fywdy/chatgpt-chibi-pets**:

| DSH asset root | Upstream source ID | Default animation |
|---|---|---|
| companion-silver | chatgpt-white-dragon-chibi-v5 | idle |
| companion-orange | claude-orange-scholar-chibi-v3 | **review**, explicitly selected by the user |
| companion-tide | deepseek-whale-maid-chibi-v4 | idle |

Art and derived PNG/WebM previews retain **CC BY-NC 4.0**, attribution and the upstream unofficial-fan-art/no-association notice. Upstream scripts/JSON retain their **MIT** license. This project’s adapter code is MIT under CODE-LICENSE.md; that code license does not relicense the art. Original master sheets, pet metadata, LICENSE, LICENSE-MIT, NOTICE and SPEC must be retained under the project's `assets/upstream` with their original contents. Source: <https://github.com/fywdy/chatgpt-chibi-pets>.

## Exact source mapping

The nine standard rows (0–8) are retained as `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, and `review`. `care.webm` is a byte-for-byte copy of `waving.webm` for silver/tide and of `review.webm` for orange to preserve the selected proportions. Orange also retains `source-idle.webm` as an alias of its unmodified source idle clip. The selected orange configuration uses `animations.idle = ["review"]`; all six orange balance fallback slots also use review, and the first preview image uses review frame 0.

Only the columns listed in the upstream SPEC are animated. Idle uses columns 0–5; its neutral gaze at (0,6), and the 16 gaze directions in rows 9–10, are retained in the original master and are **not** treated as sequential animations.

| Action | Logical source frames | Per-frame duration (ms) | Total (ms) |
|---|---:|---|---:|
| idle | 6 | 280,110,110,140,140,320 | 1100 |
| running-right / running-left | 8 each | 120 × 7, 220 | 1060 |
| waving (silver/tide care) | 4 | 140 × 3, 280 | 700 |
| jumping | 5 | 140 × 4, 280 | 840 |
| failed | 8 | 140 × 7, 240 | 1220 |
| waiting | 6 | 150 × 5, 260 | 1010 |
| running | 6 | 120 × 5, 220 | 820 |
| review (orange care) | 6 | 150 × 5, 280 | 1030 |

The encoder uses a 10 ms common time base (100 fps) by repeating source frames for their required hold. There is no interpolation, timing smoothing, retiming or frame reordering. All frames receive the same uniform LANCZOS scale, **192×208 → 288×312**, and placement **x=176, y=24** on a transparent 640×360 canvas. No per-frame bounding-box alignment, non-uniform stretch, anatomy correction, trimming or repainting is applied.

VP9 uses `yuva420p`, lossless VP9 coding after YUV 4:2:0 conversion, `auto-alt-ref=0`, and one encoder/filter thread. Encoding and explicit libvpx verification are serial. To regenerate with already installed tools:

```sh
PYTHON=/path/to/python3 node scripts/generate-pet-pack.mjs --source-root /path/to/codex-native --orange-idle review
```

Add `--capture-preview` with an existing `PLAYWRIGHT_MODULE` to also regenerate desktop/mobile preview PNGs. The HTML template is kept in `scripts/preview-pet-packs.html` and copied by the adapter, so controls remain reproducible.

Build-time tools are Python/Pillow, ffmpeg/libvpx-vp9 and ffprobe. The plugin gains no runtime dependency. The scripts install nothing. Verify browser decoding with an existing Playwright installation:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-fywdy-pet-packs.mjs
```

## DSH direction and action rules

Both upstream `client/pet.ts` and `runtime/electron-helper/sprite.js` start with facing=left, render facing=right with `scaleX(-1)`, and derive movement direction from facing. Therefore **only running-left is registered as a spatial movement**. DSH mirrors that clip when facing right. The original running-right clip remains available in a `noMirror` source-preview category and is not registered as a spatial movement, so it cannot cause reverse-facing travel. There is no invented turn animation (`turn=[]`). Drag uses waiting. Work status slots are `[review,running,review,waiting,jumping,failed]`.

Instances remain fixed with idle weight 100, model whispers/work-state bubbles/balance disabled by default. The companion's care endpoint can explicitly play care. Every original action remains accessible in the menu; default idle does not randomly enter an orange flattened source pose.

## Known source-art limitations

The **orange master itself** contains pronounced scale/proportion discontinuities: idle and jumping are broad and flattened, failed is much smaller, while waiting/running/review are taller. For example, first-frame nontransparent bounding boxes are idle **166×109**, jumping **172×113**, failed **98×82**, and review **106×190**. The selected review default avoids the flattened resting pose; source actions remain inspectable rather than silently altered.

Some source contours look abruptly bounded. Per-cell alpha bounding-box checks find no alpha directly on the outer 192×208 cell edges in the 171 used frames. This narrow check **does not establish that the source drawings are visually free of clipping or pre-cropping**, and no such claim is made. The adaptation preserves the provided source art.

`qa/fywdy/*-source-metrics.json` records all used-frame bounds. Timing reports check decoded frame counts, exact total durations, alpha at every logical source-frame boundary, and stable decoded RGBA throughout each required hold. Chromium checks cover first and midpoint alpha. This validates local adaptation, not a real DSH desktop-host interaction or Safari support.

## Host compatibility finding

Real DSH host loading found that upstream `src/host/config.ts` rejects `workStatusTexts: []` and warns before falling back. The adapter and all three configs now omit that field and inherit the valid upstream texts. `workStatusEnabled` remains false, so this does not enable automatic work-state speech.

## Orange interaction correction

The source jumping and failed poses, like source idle, are visibly flattened. The shipped orange click pool now uses care (an exact review alias); success/error work-state fallbacks use care/review. Waving is also broader than review, so it remains available for manual preview rather than changing proportions on every click. None of these automatic paths chooses the flattened source poses. Original videos and master pixels remain unchanged and available in the explicitly labelled source preview category. This changes action selection without stretching the character or silently altering source art.
