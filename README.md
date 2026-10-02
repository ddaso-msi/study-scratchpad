# Study Scratchpad

A blank sheet of paper that can calculate. Text, handwriting, shapes, images and
live calculator blocks on one infinite canvas. No account, no setup; everything
saves in the browser.

```bash
npm install
npm run dev
```

## How it's put together

- **Canvas**: [tldraw](https://tldraw.dev) 3.x supplies the infinite canvas, pen, shapes, text,
  images, undo/redo and local persistence (IndexedDB, via `persistenceKey`).
- **Calculator blocks** (`src/calc`): a custom tldraw shape. Each line is evaluated by
  [mathjs](https://mathjs.org) with a shared scope, so variables carry down the block.
  Nothing is ever passed to `eval()`.
- **Smart math** (`src/ui/Overlay.tsx`): when a text block is a calculation, a small
  `= answer` tag appears beside it. Clicking it turns the text into a calculator block.
- **Export** (`src/lib/files.ts`): PNG, single-page PDF (jsPDF), and a `.json` file with
  images inlined so it opens on another machine.

## Shortcuts

`V` select · `T` text · `D` pen · `E` eraser · `R` rectangle · `O` circle · `L` line ·
`A` arrow · `C` calculator · `⌘U` image · space-drag or middle-drag to pan · scroll/pinch to zoom.
In text: `# ` heading, `- ` bullet list, `⌘B` / `⌘I`.

## Licence note

tldraw is pinned to 3.x on purpose. From 4.0 the SDK needs a licence key to run in
production; 3.x may be deployed as long as the "Made with tldraw" watermark stays.
Check tldraw's current terms before shipping commercially.
