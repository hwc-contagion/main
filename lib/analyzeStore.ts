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

let store: AnalyzeState = { ...defaultState }

export function getAnalyzeState(): AnalyzeState { return store }
export function saveAnalyzeState(s: Partial<AnalyzeState>) { store = { ...store, ...s } }
