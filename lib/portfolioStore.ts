export interface Holding {
  id: string
  company: string
  weight: string
}

const STORAGE_KEY = 'tremor_portfolio'
let _idCounter = 100

function load(): Holding[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Holding[]) : []
  } catch { return [] }
}

let _holdings: Holding[] = load()

export function getHoldings(): Holding[] { return _holdings }

export function setHoldings(h: Holding[]): void {
  _holdings = h
  if (typeof window !== 'undefined') {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h)) } catch { /* ignore */ }
  }
}

export function hasHoldings(): boolean {
  return _holdings.some(h => h.company.trim() && (parseFloat(h.weight) || 0) > 0)
}

export function nextHoldingId(): string { return String(++_idCounter) }
