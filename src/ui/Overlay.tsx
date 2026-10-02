import { renderPlaintextFromRichText, useEditor, useValue, type TLTextShape } from 'tldraw'
import { insertCalc } from '../calc/CalcTool'
import { detectMath } from '../calc/evaluate'

/**
 * Smart math: when the text you're on is a calculation, a small "= answer" tag
 * appears beside it. Ignore it and nothing happens; click it and the text
 * becomes a live calculator block.
 */
function SmartMath() {
  const editor = useEditor()

  const hit = useValue(
    'smart math',
    () => {
      const id = editor.getEditingShapeId() ?? editor.getOnlySelectedShapeId()
      const shape = id && editor.getShape(id)
      if (!shape || !editor.isShapeOfType<TLTextShape>(shape, 'text')) return null
      if (editor.isIn('select.translating') || editor.isIn('select.resizing')) return null
      const text = renderPlaintextFromRichText(editor, shape.props.richText).trim()
      const answer = detectMath(text)
      const bounds = editor.getShapePageBounds(shape)
      if (answer === null || !bounds) return null
      const at = editor.pageToViewport({ x: bounds.maxX, y: bounds.midY })
      return { id: shape.id, text, answer, left: at.x, top: at.y, x: bounds.x, y: bounds.y }
    },
    [editor],
  )

  if (!hit) return null

  return (
    <button
      type="button"
      className="sp-smart-math"
      style={{ left: hit.left + 14, top: hit.top }}
      title="Turn into a calculator block"
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        editor.complete()
        insertCalc(editor, hit.x, hit.y, hit.text)
        editor.deleteShape(hit.id)
      }}
    >
      = {hit.answer}
    </button>
  )
}

function EmptyHint() {
  const editor = useEditor()
  const isEmpty = useValue(
    'is empty',
    () => editor.getCurrentPageShapeIds().size === 0 && editor.getCurrentToolId() === 'select',
    [editor],
  )
  if (!isEmpty) return null
  return (
    <div className="sp-hint">
      Double-click anywhere to write.
      <span>
        <kbd>D</kbd> draw · <kbd>C</kbd> calculate · <kbd>A</kbd> arrow · paste an image
      </span>
    </div>
  )
}

export function Overlay() {
  return (
    <>
      <EmptyHint />
      <SmartMath />
    </>
  )
}
