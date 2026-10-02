import { useEditor, useValue } from 'tldraw'

const SPACING = 24

/** Dot-grid paper that pans and zooms with the camera. Purely visual: nothing snaps to it. */
export function Paper() {
  const editor = useEditor()
  const { x, y, z } = useValue('camera', () => editor.getCamera(), [editor])
  // Keep the dots a readable distance apart however far out you zoom.
  let step = SPACING * z
  while (step < 14) step *= 2
  return (
    <div
      className="sp-paper"
      style={{ backgroundSize: `${step}px ${step}px`, backgroundPosition: `${x * z}px ${y * z}px` }}
    />
  )
}
