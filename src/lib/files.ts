import { getSnapshot, loadSnapshot, type Editor, type TLAsset, type TLStoreSnapshot } from 'tldraw'

const FILE_TAG = 'study-scratchpad'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  return new Date().toISOString().slice(0, 10)
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function renderPage(editor: Editor, scale: number) {
  const ids = [...editor.getCurrentPageShapeIds()]
  if (ids.length === 0) return null
  return editor.toImage(ids, { format: 'png', background: true, padding: 48, scale })
}

export async function exportPng(editor: Editor) {
  const image = await renderPage(editor, 2)
  if (image) download(image.blob, `scratchpad-${stamp()}.png`)
}

export async function exportPdf(editor: Editor) {
  const image = await renderPage(editor, 2)
  if (!image) return
  const { jsPDF } = await import('jspdf')
  // One page, sized to the drawing, so the layout survives exactly. PDF pages top out at 14400pt.
  const fit = Math.min(1, 14400 / Math.max(image.width, image.height))
  const w = image.width * fit
  const h = image.height * fit
  const pdf = new jsPDF({ unit: 'pt', format: [w, h], orientation: w > h ? 'landscape' : 'portrait' })
  pdf.addImage(await toDataUrl(image.blob), 'PNG', 0, 0, w, h)
  pdf.save(`scratchpad-${stamp()}.pdf`)
}

/** Images live in IndexedDB, so inline them or the file would be useless on another machine. */
async function inlineAssets(editor: Editor, snapshot: TLStoreSnapshot): Promise<TLStoreSnapshot> {
  const store = { ...snapshot.store } as Record<string, unknown>
  for (const [id, record] of Object.entries(store)) {
    const asset = record as TLAsset
    if (asset.typeName !== 'asset' || !asset.props.src?.startsWith('asset:')) continue
    const url = await editor.resolveAssetUrl(asset.id, { shouldResolveToOriginal: true })
    if (!url) continue
    const src = await toDataUrl(await (await fetch(url)).blob())
    store[id] = { ...asset, props: { ...asset.props, src } }
  }
  return { ...snapshot, store } as TLStoreSnapshot
}

export async function exportJson(editor: Editor) {
  const document = await inlineAssets(editor, getSnapshot(editor.store).document)
  const file = { app: FILE_TAG, version: 1, document }
  download(new Blob([JSON.stringify(file)], { type: 'application/json' }), `scratchpad-${stamp()}.json`)
}

export async function importJson(editor: Editor, file: File) {
  const parsed = JSON.parse(await file.text())
  if (parsed?.app !== FILE_TAG || !parsed.document) throw new Error('Not a Study Scratchpad file')
  editor.markHistoryStoppingPoint('open scratchpad')
  loadSnapshot(editor.store, { document: parsed.document })
  editor.zoomToFit({ animation: { duration: 0 } })
  if (editor.getZoomLevel() > 1) editor.resetZoom()
}

/** Clears the page. It goes through history, so undo brings everything back. */
export function newScratchpad(editor: Editor) {
  editor.markHistoryStoppingPoint('new scratchpad')
  editor.deleteShapes([...editor.getCurrentPageShapeIds()])
  editor.setCamera({ x: 0, y: 0, z: 1 })
}
