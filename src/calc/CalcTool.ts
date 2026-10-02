import { createShapeId, StateNode, type Editor, type TLShapeId } from 'tldraw'
import type { CalcShape } from './CalcShapeUtil'

/** Drop a calculator block on the page and put the cursor in it. */
export function insertCalc(editor: Editor, x: number, y: number, text = ''): TLShapeId {
  const id = createShapeId()
  editor.markHistoryStoppingPoint('insert calculator')
  editor.createShape<CalcShape>({ id, type: 'calc', x, y, props: { text } })
  editor.select(id)
  return id
}

export class CalcTool extends StateNode {
  static override id = 'calc'

  override onEnter() {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onPointerUp() {
    const { x, y } = this.editor.inputs.currentPagePoint
    const id = insertCalc(this.editor, x, y - 24)
    this.editor.setEditingShape(id)
    this.editor.setCurrentTool('select.editing_shape')
  }

  override onCancel() {
    this.editor.setCurrentTool('select')
  }
}
