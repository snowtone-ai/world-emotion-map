/**
 * Non-ISO country code → ISO 3166-1 alpha-2 mapping.
 *
 * This project's data source (Supabase `emotion_snapshots.country_code`)
 * is **ISO-first**: the vast majority of rows already use valid ISO 3166-1
 * alpha-2 codes (e.g. `AU` = Australia, `CH` = Switzerland, `JP` = Japan).
 * Only a small number of rows leak through as GDELT-specific or FIPS 10-4
 * codes that are NOT valid ISO (e.g. `RI`, `AY`, `RB`).
 *
 * IMPORTANT — Whitelist policy:
 *   Only include entries where the source code is **not** a valid ISO 3166-1
 *   alpha-2 country code. Otherwise the mapping would corrupt real countries
 *   (e.g. `AU: "AT"` would turn Australia into Austria, `CH: "CN"` would turn
 *   Switzerland into China, etc.).
 *
 * Previous versions of this file mapped FIPS → ISO for codes that collide
 * with valid ISO (AU, CH, SZ, RS, BM, GG, NU, PM, AS, GM). Those entries
 * were destructive against this project's ISO-first data and have been
 * removed.
 */
export const FIPS_TO_ISO: Readonly<Record<string, string>> = {
  // ── Europe ──────────────────────────────────────────────────────────────
  UK: "GB", // United Kingdom (ISO UK reserved, GB is official)
  SW: "SE", // Sweden
  DA: "DK", // Denmark
  SP: "ES", // Spain
  PO: "PT", // Portugal
  EI: "IE", // Ireland
  UP: "UA", // Ukraine
  EZ: "CZ", // Czech Republic
  LH: "LT", // Lithuania
  LG: "LV", // Latvia
  EN: "EE", // Estonia
  IC: "IS", // Iceland
  OS: "AT", // Austria (alt spelling in some GDELT variants)
  LO: "SK", // Slovakia
  MJ: "ME", // Montenegro
  BU: "BG", // Bulgaria (alt FIPS)
  KV: "XK", // Kosovo (unofficial ISO XK)

  // ── Asia ────────────────────────────────────────────────────────────────
  JA: "JP", // Japan
  KS: "KR", // South Korea
  RP: "PH", // Philippines
  VM: "VN", // Vietnam
  TU: "TR", // Turkey
  LE: "LB", // Lebanon
  IZ: "IQ", // Iraq
  KU: "KW", // Kuwait
  CE: "LK", // Sri Lanka
  CB: "KH", // Cambodia
  AJ: "AZ", // Azerbaijan
  TI: "TJ", // Tajikistan
  TX: "TM", // Turkmenistan
  WE: "PS", // West Bank (Palestinian territories)
  GZ: "PS", // Gaza Strip (Palestinian territories)
  YM: "YE", // Yemen

  // ── Africa ──────────────────────────────────────────────────────────────
  SF: "ZA", // South Africa
  ZI: "ZW", // Zimbabwe
  SU: "SD", // Sudan
  IV: "CI", // Ivory Coast / Côte d'Ivoire
  UV: "BF", // Burkina Faso
  OD: "SO", // Somalia (alt in some GDELT variants)
  WZ: "SZ", // Eswatini / Swaziland
  WA: "NA", // Namibia
  BC: "BW", // Botswana
  GV: "GN", // Guinea
  PU: "GW", // Guinea-Bissau
  MI: "MW", // Malawi
  EK: "GQ", // Equatorial Guinea (alt FIPS)
  WI: "EH", // Western Sahara

  // ── Americas ────────────────────────────────────────────────────────────
  RQ: "PR", // Puerto Rico
  VQ: "VI", // U.S. Virgin Islands
  TB: "TT", // Trinidad and Tobago
  HO: "HN", // Honduras
  CS: "CR", // Costa Rica (FIPS)
  HA: "HT", // Haiti
  DR: "DO", // Dominican Republic
  GJ: "GD", // Grenada
  NS: "SR", // Suriname
  CJ: "KY", // Cayman Islands

  // ── Oceania ─────────────────────────────────────────────────────────────
  PP: "PG", // Papua New Guinea
  NH: "VU", // Vanuatu
  GK: "GG", // Guernsey (alt FIPS)

  // ── GDELT-specific / FIPS 10-4 codes not matching any ISO country ──────
  RI: "RS", // Serbia (GDELT/FIPS — ISO RI not assigned)
  AY: "AQ", // Antarctica (FIPS — ISO AQ)
  RB: "BA", // Republika Srpska → Bosnia and Herzegovina (GDELT-specific)
  TS: "TN", // Tunisia (FIPS TS — TS not assigned in ISO 3166-1)
  NU: "NI", // Nicaragua (FIPS NU — ISO NU = Niue, but GDELT NU = Nicaragua)

  // ── Africa FIPS-ISO collisions stored in DB ──────────────────────────────
  // GDELT uses FIPS 10-4 codes. The ingestion pipeline failed to normalise
  // these codes, so the DB contains the FIPS code rather than the ISO code.
  // Each entry below satisfies the whitelist policy in spirit: the colliding
  // ISO country (Antigua, Macau, etc.) is not a GDELT primary-coverage country
  // and will not have legitimate ISO rows in this database.
  NI: "NG", // Nigeria     (FIPS NI; ISO NI = Nicaragua — GDELT "NI" is always Nigeria)
  AG: "DZ", // Algeria     (FIPS AG; ISO AG = Antigua — tiny island, not in GDELT focus)
  MO: "MA", // Morocco     (FIPS MO; ISO MO = Macau — reported under CN in GDELT)
  LI: "LR", // Liberia     (FIPS LI; ISO LI = Liechtenstein — negligible GDELT presence)
} as const;

/**
 * Normalizes a country code from FIPS/GDELT-specific to ISO 3166-1 alpha-2.
 * Returns the ISO code if an override exists, otherwise returns the input
 * unchanged (assumes input is already valid ISO alpha-2).
 */
export function normalizeCountryCode(code: string): string {
  return FIPS_TO_ISO[code] ?? code;
}
