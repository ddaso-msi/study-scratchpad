import { getSnapshot, loadSnapshot, type Editor } from 'tldraw'

const KEY = 'study-scratchpad:unsaved'
const RECENT_MS = 10_000

/**
 * tldraw saves to IndexedDB on a short delay, and IndexedDB can't be flushed
 * synchronously, so whatever you did in the last moment before a refresh could
 * be lost. localStorage *is* synchronous: if the page closes with fresh edits,
 * park the document there and pick it up on the next load.
 */
export function guardUnsavedChanges(editor: Editor) {
  // Once restored, the parked copy is only dropped after IndexedDB has had time to catch up.
  let forget: ReturnType<typeof setTimeout> | undefined
  const drop = () => localStorage.removeItem(KEY)
  try {
    const parked = localStorage.getItem(KEY)
    if (parked) {
      loadSnapshot(editor.store, { document: JSON.parse(parked) })
      forget = setTimeout(drop, 3000)
    }
  } catch (error) {
    console.error('Could not restore unsaved changes', error)
    drop()
  }

  let lastEdit = 0
  // Side effects run synchronously with the edit; store.listen waits for the next frame.
  const touch = () => void (lastEdit = Date.now())
  const stops = [
    editor.sideEffects.registerAfterCreateHandler('shape', touch),
    editor.sideEffects.registerAfterChangeHandler('shape', touch),
    editor.sideEffects.registerAfterDeleteHandler('shape', touch),
  ]

  const park = () => {
    if (Date.now() - lastEdit > RECENT_MS) return
    try {
      localStorage.setItem(KEY, JSON.stringify(getSnapshot(editor.store).document))
    } catch {
      // Over quota: fall back to whatever IndexedDB already has.
    }
  }
  // Coming back from the back/forward cache means nothing was lost, so the parked copy is stale.
  const resume = (e: PageTransitionEvent) => e.persisted && drop()
  window.addEventListener('pagehide', park)
  window.addEventListener('pageshow', resume)

  return () => {
    stops.forEach((stop) => stop())
    clearTimeout(forget)
    window.removeEventListener('pagehide', park)
    window.removeEventListener('pageshow', resume)
  }
}
