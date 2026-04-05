/**
 * company-aliases.ts
 *
 * Maps every known alias (ticker, full name, abbreviation, common variant)
 * to the canonical company name stored in Neo4j.
 *
 * Lookup is case-insensitive.
 */

// [alias, canonicalNeo4jName]
const ALIASES: Array<[string, string]> = [
  // ── Apple ──────────────────────────────────────────────────────────────────
  ["aapl", "Apple"],
  ["apple inc", "Apple"],
  ["apple inc.", "Apple"],
  ["apple computer", "Apple"],

  // ── TSMC ───────────────────────────────────────────────────────────────────
  ["tsm", "TSMC"],
  ["taiwan semiconductor", "TSMC"],
  ["taiwan semiconductor manufacturing", "TSMC"],
  ["taiwan semiconductor manufacturing company", "TSMC"],
  ["taiwan semiconductor manufacturing co", "TSMC"],
  ["taiwan semiconductor manufacturing co.", "TSMC"],

  // ── Samsung ────────────────────────────────────────────────────────────────
  ["ssnlf", "Samsung"],
  ["samsung electronics", "Samsung"],
  ["samsung electronics co", "Samsung"],
  ["samsung electronics company", "Samsung"],

  // ── Nvidia ─────────────────────────────────────────────────────────────────
  ["nvda", "Nvidia"],
  ["nvidia", "Nvidia"],
  ["nvidia corporation", "Nvidia"],

  // ── Qualcomm ───────────────────────────────────────────────────────────────
  ["qcom", "Qualcomm"],
  ["qualcomm incorporated", "Qualcomm"],
  ["qualcomm inc", "Qualcomm"],
  ["qualcomm inc.", "Qualcomm"],

  // ── Broadcom ───────────────────────────────────────────────────────────────
  ["avgo", "Broadcom"],
  ["broadcom inc", "Broadcom"],
  ["broadcom inc.", "Broadcom"],
  ["broadcom limited", "Broadcom"],

  // ── ASML ───────────────────────────────────────────────────────────────────
  ["asml holding", "ASML"],
  ["asml holding nv", "ASML"],

  // ── Cirrus Logic (CRUS) ────────────────────────────────────────────────────
  ["cirrus logic", "CRUS"],
  ["cirrus logic inc", "CRUS"],
  ["cirrus logic inc.", "CRUS"],

  // ── Skyworks (SWKS) ────────────────────────────────────────────────────────
  ["skyworks", "SWKS"],
  ["skyworks solutions", "SWKS"],
  ["skyworks solutions inc", "SWKS"],
  ["skyworks solutions inc.", "SWKS"],

  // ── Qorvo (QRVO) ──────────────────────────────────────────────────────────
  ["qorvo", "QRVO"],
  ["qorvo inc", "QRVO"],
  ["qorvo inc.", "QRVO"],

  // ── Amkor (AMKR) ──────────────────────────────────────────────────────────
  ["amkor", "AMKR"],
  ["amkor technology", "AMKR"],
  ["amkor technology inc", "AMKR"],
  ["amkor technology inc.", "AMKR"],

  // ── Lam Research (LRCX) ───────────────────────────────────────────────────
  ["lam research", "LRCX"],
  ["lam research corporation", "LRCX"],
  ["lam research corp", "LRCX"],

  // ── Entegris (ENTG) ───────────────────────────────────────────────────────
  ["entegris", "ENTG"],
  ["entegris inc", "ENTG"],
  ["entegris inc.", "ENTG"],

  // ── Applied Materials ──────────────────────────────────────────────────────
  ["amat", "Applied Materials"],
  ["applied materials inc", "Applied Materials"],
  ["applied materials inc.", "Applied Materials"],
  ["applied materials corporation", "Applied Materials"],

  // ── GlobalFoundries ────────────────────────────────────────────────────────
  ["gfs", "GLOBALFOUNDRIES"],
  ["globalfoundries", "GLOBALFOUNDRIES"],
  ["globalfoundries inc", "GLOBALFOUNDRIES"],
  ["global foundries", "GLOBALFOUNDRIES"],

  // ── Boeing ─────────────────────────────────────────────────────────────────
  ["ba", "Boeing"],
  ["the boeing company", "Boeing"],
  ["boeing company", "Boeing"],
  ["boeing co", "Boeing"],

  // ── Airbus ─────────────────────────────────────────────────────────────────
  ["eadsy", "Airbus"],
  ["airbus se", "Airbus"],
  ["airbus group", "Airbus"],

  // ── RTX / Raytheon ─────────────────────────────────────────────────────────
  ["rtx corporation", "RTX"],
  ["raytheon", "RTX"],
  ["raytheon technologies", "RTX"],
  ["raytheon technologies corporation", "RTX"],

  // ── Spirit AeroSystems ─────────────────────────────────────────────────────
  ["spr", "Spirit AeroSystems"],
  ["spirit aerosystems", "Spirit AeroSystems"],
  ["spirit aerosystems holdings", "Spirit AeroSystems"],

  // ── Ducommun (DCO) ─────────────────────────────────────────────────────────
  ["ducommun", "DCO"],
  ["ducommun incorporated", "DCO"],

  // ── Amazon ─────────────────────────────────────────────────────────────────
  ["amzn", "Amazon"],
  ["amazon.com", "Amazon"],
  ["amazon.com inc", "Amazon"],
  ["amazon.com inc.", "Amazon"],

  // ── Meta ───────────────────────────────────────────────────────────────────
  ["meta", "Meta"],
  ["meta platforms", "Meta"],
  ["meta platforms inc", "Meta"],
  ["facebook", "Meta"],
  ["fb", "Meta"],

  // ── Google / Alphabet ──────────────────────────────────────────────────────
  ["googl", "Google"],
  ["goog", "Google"],
  ["alphabet", "Google"],
  ["alphabet inc", "Google"],
  ["alphabet inc.", "Google"],
  ["google llc", "Google"],
  ["google inc", "Google"],

  // ── Ford ───────────────────────────────────────────────────────────────────
  ["f", "Ford"],
  ["ford motor", "Ford"],
  ["ford motor company", "Ford"],
  ["ford motor co", "Ford"],

  // ── GM ─────────────────────────────────────────────────────────────────────
  ["gm", "GM"],
  ["general motors", "GM"],
  ["general motors company", "GM"],
  ["general motors co", "GM"],
  ["gmc", "GM"],

  // ── Stellantis ─────────────────────────────────────────────────────────────
  ["stla", "Stellantis"],
  ["stellantis nv", "Stellantis"],

  // ── Volkswagen ─────────────────────────────────────────────────────────────
  ["vow", "Volkswagen"],
  ["vwagy", "Volkswagen"],
  ["volkswagen ag", "Volkswagen"],
  ["vw", "Volkswagen"],

  // ── BorgWarner (BWA) ──────────────────────────────────────────────────────
  ["borgwarner", "BWA"],
  ["borgwarner inc", "BWA"],
  ["borgwarner inc.", "BWA"],

  // ── Aptiv (APTV) ──────────────────────────────────────────────────────────
  ["aptiv", "APTV"],
  ["aptiv plc", "APTV"],

  // ── Autoliv (ALV) ─────────────────────────────────────────────────────────
  ["alv", "Autoliv"],
  ["autoliv inc", "Autoliv"],
  ["autoliv inc.", "Autoliv"],

  // ── Celestica (CLS) ───────────────────────────────────────────────────────
  ["celestica", "CLS"],
  ["celestica inc", "CLS"],
  ["celestica inc.", "CLS"],

  // ── LG Energy Solution ─────────────────────────────────────────────────────
  ["lges", "LG Energy Solution"],
  ["lg energy", "LG Energy Solution"],
  ["lg energy solution co", "LG Energy Solution"],

  // ── UPS ────────────────────────────────────────────────────────────────────
  ["united parcel service", "UPS"],
  ["united parcel service inc", "UPS"],

  // ── FedEx ──────────────────────────────────────────────────────────────────
  ["fdx", "FedEx"],
  ["fedex corporation", "FedEx"],
  ["fedex corp", "FedEx"],

  // ── IBM ────────────────────────────────────────────────────────────────────
  ["ibm", "IBM"],
  ["international business machines", "IBM"],
  ["international business machines corporation", "IBM"],

  // ── Dell ───────────────────────────────────────────────────────────────────
  ["dell", "Dell"],
  ["dell technologies", "Dell"],
  ["dell technologies inc", "Dell"],
  ["dell inc", "Dell"],

  // ── HPE ────────────────────────────────────────────────────────────────────
  ["hpe", "HPE"],
  ["hewlett packard enterprise", "HPE"],
  ["hewlett-packard enterprise", "HPE"],
  ["hewlett packard enterprise company", "HPE"],

  // ── Honeywell ──────────────────────────────────────────────────────────────
  ["hon", "Honeywell"],
  ["honeywell international", "Honeywell"],
  ["honeywell international inc", "Honeywell"],
  ["honeywell inc", "Honeywell"],

  // ── Ciena ──────────────────────────────────────────────────────────────────
  ["cien", "Ciena"],
  ["ciena corporation", "Ciena"],

  // ── Lam Research (second entry for plain name) ────────────────────────────
  ["lam research corp", "LRCX"],

  // ── Toyota ─────────────────────────────────────────────────────────────────
  ["tm", "Toyota"],
  ["toyota motor", "Toyota"],
  ["toyota motor corporation", "Toyota"],
  ["toyota motor corp", "Toyota"],

  // ── BYD ────────────────────────────────────────────────────────────────────
  ["byddf", "BYD"],
  ["byd company", "BYD"],
  ["byd co", "BYD"],
  ["byd auto", "BYD"],

  // ── Huawei ─────────────────────────────────────────────────────────────────
  ["huawei technologies", "Huawei"],
  ["huawei technologies co", "Huawei"],

  // ── Tesla ──────────────────────────────────────────────────────────────────
  ["tsla", "Tesla"],
  ["tesla inc", "Tesla"],
  ["tesla, inc", "Tesla"],
  ["tesla inc.", "Tesla"],
  ["tesla motors", "Tesla"],
  ["tesla motor", "Tesla"],

  // ── ON Semiconductor ───────────────────────────────────────────────────────
  ["on", "ON Semiconductor"],
  ["onsemi", "ON Semiconductor"],
  ["on semiconductor corporation", "ON Semiconductor"],

  // ── Wolfspeed ──────────────────────────────────────────────────────────────
  ["wolf", "Wolfspeed"],
  ["wolfspeed inc", "Wolfspeed"],
  ["wolfspeed, inc", "Wolfspeed"],
  ["cree", "Wolfspeed"],  // former name

  // ── Monolithic Power ───────────────────────────────────────────────────────
  ["mpwr", "Monolithic Power"],
  ["monolithic power systems", "Monolithic Power"],
  ["monolithic power systems inc", "Monolithic Power"],

  // ── Albemarle ──────────────────────────────────────────────────────────────
  ["alb", "Albemarle"],
  ["albemarle corporation", "Albemarle"],
  ["albemarle corp", "Albemarle"],

  // ── TE Connectivity ────────────────────────────────────────────────────────
  ["tel", "TE Connectivity"],
  ["te connectivity", "TE Connectivity"],
  ["te connectivity ltd", "TE Connectivity"],
  ["tyco electronics", "TE Connectivity"],

  // ── NXP Semiconductors ─────────────────────────────────────────────────────
  ["nxpi", "NXP Semiconductors"],
  ["nxp", "NXP Semiconductors"],
  ["nxp semiconductors", "NXP Semiconductors"],
  ["nxp semiconductors nv", "NXP Semiconductors"],

  // ── Super Micro Computer ───────────────────────────────────────────────────
  ["smci", "Super Micro"],
  ["supermicro", "Super Micro"],
  ["super micro computer", "Super Micro"],
  ["super micro computer inc", "Super Micro"],

  // ── Arista Networks ────────────────────────────────────────────────────────
  ["anet", "Arista Networks"],
  ["arista networks inc", "Arista Networks"],

  // ── Hexcel ─────────────────────────────────────────────────────────────────
  ["hxl", "Hexcel"],
  ["hexcel corporation", "Hexcel"],

  // ── Triumph Group ──────────────────────────────────────────────────────────
  ["tgi", "Triumph Group"],
  ["triumph group inc", "Triumph Group"],

  // ── Microchip Technology ───────────────────────────────────────────────────
  ["mchp", "Microchip Technology"],
  ["microchip technology incorporated", "Microchip Technology"],
  ["microchip technology inc", "Microchip Technology"],

  // ── Analog Devices ─────────────────────────────────────────────────────────
  ["adi", "Analog Devices"],
  ["analog devices inc", "Analog Devices"],
  ["analog devices, inc", "Analog Devices"],

  // ── Marvell Technology ─────────────────────────────────────────────────────
  ["mrvl", "Marvell Technology"],
  ["marvell technology inc", "Marvell Technology"],
  ["marvell technology group", "Marvell Technology"],

  // ── Microsoft ──────────────────────────────────────────────────────────────
  ["msft", "Microsoft"],
  ["microsoft corporation", "Microsoft"],
  ["microsoft corp", "Microsoft"],

  // ── BMW ────────────────────────────────────────────────────────────────────
  ["bmw", "BMW"],
  ["bayerische motoren werke", "BMW"],
  ["bmw ag", "BMW"],

  // ── Xiaomi ─────────────────────────────────────────────────────────────────
  ["xiacf", "Xiaomi"],
  ["xiaomi corporation", "Xiaomi"],

  // ── Geely ──────────────────────────────────────────────────────────────────
  ["geely automobile", "Geely"],
  ["geely auto", "Geely"],
  ["geely holding", "Geely"],
];

// Build lookup map (lowercase alias → canonical)
const ALIAS_MAP = new Map<string, string>(
  ALIASES.map(([alias, canonical]) => [alias.toLowerCase(), canonical])
);

// All canonical names, lowercased → canonical (for case-insensitive fallback)
const CANONICAL_NAMES = Array.from(new Set(ALIASES.map(([, c]) => c)))
const CANONICAL_MAP = new Map<string, string>(
  CANONICAL_NAMES.map(name => [name.toLowerCase(), name])
)

/**
 * Resolve a user-supplied company name/ticker to the canonical Neo4j node name.
 * 1. Exact alias match (case-insensitive)
 * 2. Case-insensitive match against canonical names
 * 3. Return input trimmed unchanged
 */
export function resolveCompany(input: string): string {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  return ALIAS_MAP.get(lower) ?? CANONICAL_MAP.get(lower) ?? trimmed
}
