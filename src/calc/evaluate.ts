import { all, create } from 'mathjs'

const math = create(all, {})
const limitedEvaluate = math.evaluate.bind(math)

// Lock down the parts of mathjs that could reach outside a plain calculation.
// Expressions are parsed by mathjs; nothing here ever touches eval().
const disabled = (name: string) => () => {
  throw new Error(`${name} is disabled`)
}
math.import(
  {
    import: disabled('import'),
    createUnit: disabled('createUnit'),
    evaluate: disabled('evaluate'),
    parse: disabled('parse'),
    simplify: disabled('simplify'),
    derivative: disabled('derivative'),
    resolve: disabled('resolve'),
    reviver: disabled('reviver'),
  },
  { override: true },
)

export interface CalcRow {
  /** Formatted result, or null when the line has nothing to show. */
  result: string | null
  error: boolean
}

const MAX_LINE_LENGTH = 500

/** Turn the symbols people actually type or paste into what the parser expects. */
function normalize(line: string): string {
  return line
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√\s*(\d+(?:\.\d+)?|[A-Za-z_]\w*)/g, 'sqrt($1)')
    .replace(/=\s*$/, '')
    .trim()
}

function isComment(line: string): boolean {
  return line.startsWith('#') || line.startsWith('//')
}

/** 2280000 -> 2,280,000. Leaves the decimals and any exponent form alone. */
function group(digits: string): string {
  if (/e/i.test(digits)) return digits
  const [whole, fraction] = digits.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

function format(value: unknown): string | null {
  if (value === undefined || value === null || typeof value === 'function') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value)
    return group(math.format(value, { precision: 10, lowerExp: -9, upperExp: 15 }))
  }
  return math.format(value, { precision: 10 })
}

/** Evaluate a block line by line. Variables assigned on one line are visible below it. */
export function evaluateLines(text: string): CalcRow[] {
  const scope: Record<string, unknown> = {}
  return text.split('\n').map((raw) => {
    const line = normalize(raw)
    if (!line || isComment(line)) return { result: null, error: false }
    if (line.length > MAX_LINE_LENGTH) return { result: null, error: true }
    try {
      return { result: format(limitedEvaluate(line, scope)), error: false }
    } catch {
      return { result: null, error: true }
    }
  })
}

const OPERATOR = /[+\-*/^%×÷√]|\b[a-z]+\(/i

/**
 * Decide whether a piece of ordinary text is really a calculation.
 * Returns the answer when it is, null otherwise. Deliberately strict: every
 * line has to evaluate, and there has to be an actual operation in it, so
 * notes like "Chapter 3" or "x = 5" are left alone.
 */
export function detectMath(text: string): string | null {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length === 0 || lines.length > 12) return null
  if (!lines.some((l) => /\d/.test(l) && OPERATOR.test(l))) return null
  const rows = evaluateLines(lines.join('\n'))
  if (rows.some((r) => r.error)) return null
  return rows[rows.length - 1].result
}
