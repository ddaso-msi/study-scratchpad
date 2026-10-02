import { useEffect, useRef } from 'react'
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  stopEventPropagation,
  useEditor,
  useIsEditing,
  type Editor,
  type TLBaseShape,
  type TLResizeInfo,
} from 'tldraw'
import { evaluateLines } from './evaluate'

/** `w` is only set once the block has been dragged to a width; unset or 0 means fit the content. */
export type CalcShape = TLBaseShape<'calc', { text: string; w?: number }>

// The block sizes itself to its content, so these have to match calc-block in index.css.
const FONT_SIZE = 18
const CHAR_WIDTH = FONT_SIZE * 0.6 // tldraw_mono (IBM Plex Mono) advance width
const LINE_HEIGHT = 28
const PAD_X = 14
const PAD_Y = 10
const GAP = 28
const MIN_EXPR_CHARS = 12
const MAX_AUTO_EXPR_CHARS = 40 // longer lines wrap rather than stretching the block

type Layout = ReturnType<typeof measure>
const layouts = new WeakMap<CalcShape['props'], Layout>()

/** Props objects are immutable, so each version of a block is only measured once. */
function layout(editor: Editor, props: CalcShape['props']): Layout {
  let result = layouts.get(props)
  if (!result) layouts.set(props, (result = measure(editor, props)))
  return result
}

function measure(editor: Editor, { text, w }: CalcShape['props']) {
  const lines = text.split('\n')
  const rows = evaluateLines(text)
  const resultChars = Math.max(0, ...rows.map((r) => (r.result ? r.result.length + 2 : r.error ? 1 : 0)))
  const resultWidth = Math.ceil(resultChars * CHAR_WIDTH)
  const chrome = PAD_X * 2 + (resultWidth ? GAP + resultWidth : 0)

  const longest = Math.max(...lines.map((l) => l.length + 1))
  const exprChars = !w
    ? Math.min(MAX_AUTO_EXPR_CHARS, Math.max(MIN_EXPR_CHARS, longest))
    : Math.max(MIN_EXPR_CHARS, Math.floor((w - chrome) / CHAR_WIDTH))
  const exprWidth = Math.ceil(exprChars * CHAR_WIDTH)

  // Long lines wrap at word boundaries. Ask the browser how tall each one ends up, using the
  // same wrapping rules as .calc-expr, so results stay level with the line they belong to.
  const heights = lines.map((line) => {
    if (line.length < exprChars) return LINE_HEIGHT
    const { h } = editor.textMeasure.measureText(line, {
      fontFamily: 'var(--tl-font-mono)',
      fontStyle: 'normal',
      fontWeight: 'normal',
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT / FONT_SIZE,
      maxWidth: exprWidth,
      padding: '0px',
    })
    return Math.max(1, Math.round(h / LINE_HEIGHT)) * LINE_HEIGHT
  })

  return {
    lines,
    rows,
    heights,
    exprWidth,
    w: chrome + exprWidth,
    h: PAD_Y * 2 + heights.reduce((a, b) => a + b, 0),
  }
}

function CalcBlock({ shape }: { shape: CalcShape }) {
  const editor = useEditor()
  const isEditing = useIsEditing(shape.id)
  const { lines, rows, heights, exprWidth, w, h } = layout(editor, shape.props)
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
            <div key={i} className={row.error ? 'calc-error' : undefined} style={{ height: heights[i] }}>
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

  // Only the width is draggable; the height follows from how the lines wrap.
  override onResize(_shape: CalcShape, info: TLResizeInfo<CalcShape>) {
    const start = layout(this.editor, info.initialShape.props).w
    const w = Math.max(160, start * Math.abs(info.scaleX))
    const left = info.handle.includes('left')
    return { x: left ? info.initialShape.x + start - w : info.initialShape.x, y: info.initialShape.y, props: { w } }
  }

  /** Double-clicking a side handle goes back to fitting the content. */
  override onDoubleClickEdge(shape: CalcShape) {
    return { id: shape.id, type: 'calc' as const, props: { w: 0 } }
  }

  override hideRotateHandle() {
    return true
  }

  override getGeometry(shape: CalcShape) {
    const { w, h } = layout(this.editor, shape.props)
    return new Rectangle2d({ width: w, height: h, isFilled: true })
  }

  override onEditEnd(shape: CalcShape) {
    if (!shape.props.text.trim()) this.editor.deleteShape(shape.id)
  }

  override component(shape: CalcShape) {
    return <CalcBlock shape={shape} />
  }

  override indicator(shape: CalcShape) {
    const { w, h } = layout(this.editor, shape.props)
    return <rect width={w} height={h} />
  }
}
