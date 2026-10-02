import { useEffect, useMemo, useRef } from 'react'
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  stopEventPropagation,
  useEditor,
  useIsEditing,
  type TLBaseShape,
} from 'tldraw'
import { evaluateLines } from './evaluate'

export type CalcShape = TLBaseShape<'calc', { text: string }>

// The block sizes itself to its content, so these have to match calc-block in index.css.
const FONT_SIZE = 18
const CHAR_WIDTH = FONT_SIZE * 0.6 // tldraw_mono (IBM Plex Mono) advance width
const LINE_HEIGHT = 28
const PAD_X = 14
const PAD_Y = 10
const GAP = 28
const MIN_EXPR_CHARS = 12

function layout(text: string) {
  const lines = text.split('\n')
  const rows = evaluateLines(text)
  const exprChars = Math.max(MIN_EXPR_CHARS, ...lines.map((l) => l.length + 1))
  const resultChars = Math.max(0, ...rows.map((r) => (r.result ? r.result.length + 2 : r.error ? 1 : 0)))
  const exprWidth = Math.ceil(exprChars * CHAR_WIDTH)
  const resultWidth = Math.ceil(resultChars * CHAR_WIDTH)
  return {
    lines,
    rows,
    exprWidth,
    w: PAD_X * 2 + exprWidth + (resultWidth ? GAP + resultWidth : 0),
    h: PAD_Y * 2 + lines.length * LINE_HEIGHT,
  }
}

function CalcBlock({ shape }: { shape: CalcShape }) {
  const editor = useEditor()
  const isEditing = useIsEditing(shape.id)
  const { lines, rows, exprWidth, w, h } = useMemo(() => layout(shape.props.text), [shape.props.text])
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = input.current
    if (!isEditing || !el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [isEditing])

  return (
    <HTMLContainer style={{ width: w, height: h, pointerEvents: isEditing ? 'all' : undefined }}>
      <div className="calc-block" data-editing={isEditing}>
        <div className="calc-expr" style={{ width: exprWidth }}>
          {isEditing ? (
            <textarea
              ref={input}
              value={shape.props.text}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
              placeholder="125 * 37"
              onChange={(e) =>
                editor.updateShape<CalcShape>({ id: shape.id, type: 'calc', props: { text: e.target.value } })
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
                  e.preventDefault()
                  editor.complete()
                }
                e.stopPropagation()
              }}
              onPointerDown={stopEventPropagation}
              onTouchStart={stopEventPropagation}
            />
          ) : (
            lines.map((line, i) => <div key={i}>{line || ' '}</div>)
          )}
        </div>
        <div className="calc-results">
          {rows.map((row, i) => (
            <div key={i} className={row.error ? 'calc-error' : undefined}>
              {row.result !== null ? `= ${row.result}` : row.error ? '?' : ' '}
            </div>
          ))}
        </div>
      </div>
    </HTMLContainer>
  )
}

export class CalcShapeUtil extends ShapeUtil<CalcShape> {
  static override type = 'calc' as const

  override getDefaultProps(): CalcShape['props'] {
    return { text: '' }
  }

  override canEdit() {
    return true
  }

  override canResize() {
    return false
  }

  override hideRotateHandle() {
    return true
  }

  override getGeometry(shape: CalcShape) {
    const { w, h } = layout(shape.props.text)
    return new Rectangle2d({ width: w, height: h, isFilled: true })
  }

  override onEditEnd(shape: CalcShape) {
    if (!shape.props.text.trim()) this.editor.deleteShape(shape.id)
  }

  override component(shape: CalcShape) {
    return <CalcBlock shape={shape} />
  }

  override indicator(shape: CalcShape) {
    const { w, h } = layout(shape.props.text)
    return <rect width={w} height={h} />
  }
}
