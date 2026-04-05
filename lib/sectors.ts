export const COMPANY_SECTOR: Record<string, string> = {
  Apple:                  'Consumer Tech',
  TSMC:                   'Semiconductors',
  ASML:                   'Semiconductors',
  Qualcomm:               'Semiconductors',
  Broadcom:               'Semiconductors',
  Samsung:                'Semiconductors',
  Nvidia:                 'Semiconductors',
  CRUS:                   'Semiconductors',
  SWKS:                   'Semiconductors',
  QRVO:                   'Semiconductors',
  AMKR:                   'Semiconductors',
  LRCX:                   'Semiconductors',
  ENTG:                   'Semiconductors',
  GlobalFoundries:        'Semiconductors',
  ADI:                    'Semiconductors',
  MCHP:                   'Semiconductors',
  'NXP Semiconductors':   'Semiconductors',
  'Analog Devices':       'Semiconductors',
  'Microchip Technology': 'Semiconductors',
  'Marvell Technology':   'Semiconductors',
  'Monolithic Power':     'Semiconductors',
  'Texas Instruments':    'Semiconductors',
  'ON Semiconductor':     'Semiconductors',
  Wolfspeed:              'Semiconductors',
  'Applied Materials':    'Semiconductors',
  'Lam Research':         'Semiconductors',
  Boeing:                 'Aerospace',
  'Spirit AeroSystems':   'Aerospace',
  Airbus:                 'Aerospace',
  RTX:                    'Aerospace',
  DCO:                    'Aerospace',
  HXL:                    'Aerospace',
  'Lockheed Martin':      'Aerospace',
  'General Dynamics':     'Aerospace',
  Textron:                'Aerospace',
  GKN:                    'Aerospace',
  'Triumph Group':        'Aerospace',
  GE:                     'Industrials',
  Honeywell:              'Industrials',
  Albemarle:              'Industrials',
  'TE Connectivity':      'Industrials',
  Amazon:                 'E-commerce',
  Meta:                   'E-commerce',
  Google:                 'E-commerce',
  Microsoft:              'E-commerce',
  UPS:                    'Logistics',
  FedEx:                  'Logistics',
  Tesla:                  'Automotive',
  Ford:                   'Automotive',
  GM:                     'Automotive',
  'LG Energy Solution':   'Automotive',
  Volkswagen:             'Automotive',
  Stellantis:             'Automotive',
  Autoliv:                'Automotive',
  BWA:                    'Automotive',
  APTV:                   'Automotive',
  Panasonic:              'Automotive',
  CATL:                   'Automotive',
  'Samsung SDI':          'Automotive',
  Toyota:                 'Automotive',
  BYD:                    'Automotive',
  CLS:                    'Tech',
  IBM:                    'Tech',
  Dell:                   'Tech',
  HPE:                    'Tech',
  'Super Micro':          'Tech',
  'Arista Networks':      'Tech',
}

export const SECTOR_COLORS: Record<string, string> = {
  'Consumer Tech': '#f472b6',  // pink
  Semiconductors:  '#a78bfa',  // violet
  Aerospace:       '#38bdf8',  // sky blue
  'E-commerce':    '#facc15',  // yellow
  Logistics:       '#34d399',  // emerald
  Automotive:      '#f87171',  // red
  Tech:            '#fb923c',  // orange
  Industrials:     '#a3e635',  // lime
}

export const SECTOR_ORDER = [
  'Consumer Tech', 'Semiconductors', 'Aerospace',
  'E-commerce', 'Logistics', 'Automotive', 'Tech', 'Industrials',
]

export function sectorColor(company: string): string {
  const s = COMPANY_SECTOR[company]
  return s ? (SECTOR_COLORS[s] ?? '') : ''
}

export function sectorBadge(company: string): { sector: string; color: string } | null {
  const sector = COMPANY_SECTOR[company]
  if (!sector) return null
  return { sector, color: SECTOR_COLORS[sector] ?? '#71717a' }
}
