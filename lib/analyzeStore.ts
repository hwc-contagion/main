export interface AffectedCompany {
  company: string
  exposure: number
  hop: number
}

export interface Edge {
  from: string
  to: string
  rel_type: string
  weight: number
}

export interface Results {
  shock_company: string
  shock_pct: number
  affected: AffectedCompany[]
  edges: Edge[]
}

interface AnalyzeState {
  mode: 'manual' | 'natural'
  company: string
  shockPct: number
  prompt: string
  parsedCompany: string | null
  parsedPct: number | null
  reasoning: string | null
  results: Results | null
  narrative: string | null
  deepNarrative: string | null
}

const STORAGE_KEY = 'tremor_analyze'

const defaultState: AnalyzeState = {
  mode: 'manual',
  company: '',
  shockPct: 0,
  prompt: '',
  parsedCompany: null,
  parsedPct: null,
  reasoning: null,
  results: null,
  narrative: null,
  deepNarrative: null,
}

function load(): AnalyzeState {
  if (typeof window === 'undefined') return { ...defaultState }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState }
  } catch { return { ...defaultState } }
}

let store: AnalyzeState = load()

export function getAnalyzeState(): AnalyzeState { return store }

export function saveAnalyzeState(s: Partial<AnalyzeState>) {
  store = { ...store, ...s }
  if (typeof window !== 'undefined') {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
  }
}
