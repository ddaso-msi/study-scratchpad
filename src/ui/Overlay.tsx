import { useEffect } from 'react'
import { renderPlaintextFromRichText, useEditor, useValue, type TLTextShape } from 'tldraw'
import { insertCalc } from '../calc/CalcTool'
import { detectMath } from '../calc/evaluate'

/**
 * Smart math: when the text you're on is a calculation, a small "= answer" tag
 * appears beside it. Ignore it and nothing happens; click it or press Tab and
 * the text becomes a live calculator block.
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

  const convert = () => {
    if (!hit) return
    const wasEditing = editor.getEditingShapeId() === hit.id
    editor.complete()
    const id = insertCalc(editor, hit.x, hit.y, hit.text)
    editor.deleteShape(hit.id)
    // Mid-thought? Keep the cursor in the block so the next line can follow straight away.
    if (wasEditing) {
      editor.setEditingShape(id)
      editor.setCurrentTool('select.editing_shape')
    }
  }

  // Capture phase, so Tab reaches us before the text editor treats it as an indent.
  const active = hit !== null
  useEffect(() => {
    if (!active) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      e.stopPropagation()
      convert()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  if (!hit) return null

  return (
    <button
      type="button"
      className="sp-smart-math"
      style={{ left: hit.left + 14, top: hit.top }}
      title="Turn into a calculator block (Tab)"
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        convert()
      }}
    >
      = {hit.answer}
      <kbd>tab</kbd>
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
      <span className="sp-fine-pointer">Double-click anywhere to write.</span>
      <span className="sp-coarse-pointer">Double-tap anywhere to write.</span>
      <small className="sp-fine-pointer">
        <kbd>D</kbd> draw · <kbd>C</kbd> calculate · <kbd>A</kbd> arrow · paste an image
      </small>
      <small className="sp-coarse-pointer">Pick the pen to draw, or the calculator to work something out.</small>
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
