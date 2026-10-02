import { defaultAddFontsFromNode, Tldraw, type TLComponents, type TLTextOptions, type TLUiOverrides } from 'tldraw'
import { CalcShapeUtil } from './calc/CalcShapeUtil'
import { CalcTool } from './calc/CalcTool'
import { guardUnsavedChanges } from './lib/unloadGuard'
import { Overlay } from './ui/Overlay'
import { Paper } from './ui/Paper'
import { Toolbar } from './ui/Toolbar'

const shapeUtils = [CalcShapeUtil]
const tools = [CalcTool]

// Everything that isn't the page or the one toolbar is switched off.
const components: TLComponents = {
  Background: Paper,
  InFrontOfTheCanvas: Overlay,
  TopPanel: Toolbar,
  StylePanel: null, // rendered by Toolbar, under the toolbar, at every screen width
  Toolbar: null,
  MenuPanel: null,
  MainMenu: null,
  PageMenu: null,
  NavigationPanel: null,
  Minimap: null,
  HelpMenu: null,
  ActionsMenu: null,
  QuickActions: null,
  SharePanel: null,
  DebugPanel: null,
  DebugMenu: null,
}

// Headings render bold, but tldraw only preloads the bold face for explicit bold marks. Without
// this, a heading is measured before its font arrives and wraps once it does.
const textOptions: TLTextOptions = {
  addFontsFromNode(node, state, addFont) {
    if (node.type.name === 'heading') state = { ...state, weight: 'bold' }
    return defaultAddFontsFromNode(node, state, addFont)
  },
}

const overrides: TLUiOverrides = {
  tools(editor, tools) {
    tools.calc = {
      id: 'calc',
      label: 'Calculator',
      icon: 'plus',
      kbd: 'c',
      onSelect: () => editor.setCurrentTool('calc'),
    }
    return tools
  },
}

export default function App() {
  return (
    <div className="fixed inset-0">
      <Tldraw
        persistenceKey="study-scratchpad"
        shapeUtils={shapeUtils}
        tools={tools}
        components={components}
        overrides={overrides}
        textOptions={textOptions}
        onMount={guardUnsavedChanges}
        autoFocus
      />
    </div>
  )
}
