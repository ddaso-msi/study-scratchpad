import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DefaultStylePanel, GeoShapeGeoStyle, useEditor, useToasts, useTools, useValue } from 'tldraw'
import { exportJson, exportPdf, exportPng, importJson, newScratchpad } from '../lib/files'
import { icons } from './icons'

type Tool = { id: string; label: string; key: string; icon: ReactNode; shape?: boolean }

const TOOLS: Tool[] = [
  { id: 'select', label: 'Select', key: 'V', icon: icons.select },
  { id: 'text', label: 'Text', key: 'T', icon: icons.text },
  { id: 'draw', label: 'Pen', key: 'D', icon: icons.pen },
  { id: 'eraser', label: 'Eraser', key: 'E', icon: icons.eraser },
  { id: 'rectangle', label: 'Rectangle', key: 'R', icon: icons.rectangle, shape: true },
  { id: 'ellipse', label: 'Circle', key: 'O', icon: icons.ellipse, shape: true },
  { id: 'line', label: 'Line', key: 'L', icon: icons.line, shape: true },
  { id: 'arrow', label: 'Arrow', key: 'A', icon: icons.arrow, shape: true },
  { id: 'calc', label: 'Calculator', key: 'C', icon: icons.calc },
]

function Button(props: {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick(): void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="sp-button"
      title={props.shortcut ? `${props.label} (${props.shortcut})` : props.label}
      aria-label={props.label}
      aria-pressed={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

function Menu(props: {
  label: string
  icon: ReactNode
  active?: boolean
  items: { label: string; icon?: ReactNode; hint?: string; run(): void }[]
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <Button label={props.label} active={open || props.active} onClick={() => setOpen((v) => !v)}>
        {props.icon}
      </Button>
      {open && (
        <div className="sp-menu" role="menu">
          {props.items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.run()
              }}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {item.hint && <span className="text-[var(--sp-muted)]">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Phones: the colour / size panel would cover a third of the page, so it sits behind a button.
const COMPACT = '(max-width: 640px)'

const UNSTYLED_TOOLS = new Set(['select', 'eraser', 'hand', 'calc', 'zoom', 'laser'])

function useIsCompact() {
  const [compact, setCompact] = useState(() => matchMedia(COMPACT).matches)
  useEffect(() => {
    const query = matchMedia(COMPACT)
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return compact
}

export function Toolbar() {
  const editor = useEditor()
  const tools = useTools()
  const { addToast } = useToasts()
  const fileInput = useRef<HTMLInputElement>(null)

  const active = useValue(
    'active tool',
    () => {
      const id = editor.getCurrentToolId()
      return id === 'geo' ? editor.getStyleForNextShape(GeoShapeGeoStyle) : id
    },
    [editor],
  )
  // Colour and pen size only matter while there is something for them to apply to.
  const hasStyles = useValue(
    'styles relevant',
    () => !UNSTYLED_TOOLS.has(editor.getCurrentToolId()) || editor.getSelectedShapeIds().length > 0,
    [editor],
  )
  const compact = useIsCompact()
  const [stylesOpen, setStylesOpen] = useState(false)
  const showStyles = hasStyles && (!compact || stylesOpen)

  const canUndo = useValue('can undo', () => editor.getCanUndo(), [editor])
  const canRedo = useValue('can redo', () => editor.getCanRedo(), [editor])

  const attempt = (what: string, task: () => Promise<void>) =>
    task().catch((error) => {
      console.error(error)
      addToast({ title: `Couldn't ${what}`, severity: 'error' })
    })

  const pick = (tool: Tool) => tools[tool.id]?.onSelect('toolbar')
  const toolButton = (tool: Tool) => (
    <Button key={tool.id} label={tool.label} shortcut={tool.key} active={active === tool.id} onClick={() => pick(tool)}>
      {tool.icon}
    </Button>
  )
  // On a phone the four shapes fold into one button so the tools fit on a single row.
  const shapes = TOOLS.filter((tool) => tool.shape)

  return (
    <>
      {showStyles && (
        <div className="sp-styles">
          <DefaultStylePanel />
        </div>
      )}
      <div className="sp-toolbar" role="toolbar" aria-label="Tools">
        {TOOLS.filter((tool) => !compact || !tool.shape).map(toolButton)}
        {compact && (
          <Menu
            label="Shapes"
            icon={shapes.find((tool) => tool.id === active)?.icon ?? icons.rectangle}
            active={shapes.some((tool) => tool.id === active)}
            items={shapes.map((tool) => ({ label: tool.label, icon: tool.icon, run: () => pick(tool) }))}
          />
        )}
        <Button label="Image" shortcut="⌘U" onClick={() => tools.asset?.onSelect('toolbar')}>
          {icons.image}
        </Button>
        {compact && (
          <Button
            label="Colour and size"
            active={stylesOpen}
            disabled={!hasStyles}
            onClick={() => setStylesOpen((v) => !v)}
          >
            {icons.style}
          </Button>
        )}
        <span className="sp-divider" />
        <Button label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={() => editor.undo()}>
          {icons.undo}
        </Button>
        <Button label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={() => editor.redo()}>
          {icons.redo}
        </Button>
        <span className="sp-divider" />
        <Menu
          label="Export"
          icon={icons.export}
          items={[
            {
              label: 'PNG image',
              run: () => attempt('export the PNG', () => exportPng(editor)),
            },
            {
              label: 'PDF document',
              run: () => attempt('export the PDF', () => exportPdf(editor)),
            },
          ]}
        />
        <Menu
          label="Scratchpad"
          icon={icons.more}
          items={[
            {
              label: 'New scratchpad',
              hint: 'undoable',
              run: () => newScratchpad(editor),
            },
            { label: 'Open file…', run: () => fileInput.current?.click() },
            {
              label: 'Save as file',
              hint: '.json',
              run: () => attempt('save the file', () => exportJson(editor)),
            },
          ]}
        />
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) attempt('open that file', () => importJson(editor, file))
          }}
        />
      </div>
    </>
  )
}
