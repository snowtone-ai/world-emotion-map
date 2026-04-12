/**
 * FIPS 10-4 → ISO 3166-1 alpha-2 country code mapping.
 *
 * GDELT GKG V2 uses FIPS 10-4 codes in the V2_LOCATIONS field.
 * Mapbox GL JS expects ISO 3166-1 alpha-2 codes to match country features.
 *
 * Only entries where FIPS ≠ ISO are listed.
 * Codes that are identical in both systems (US, FR, IN, etc.) need no mapping.
 */
export const FIPS_TO_ISO: Readonly<Record<string, string>> = {
  // Europe
  UK: "GB", // United Kingdom
  GM: "DE", // Germany
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
  RS: "RU", // Russia (ISO RS = Serbia, but FIPS RS = Russia)
  AU: "AT", // Austria  (ISO AU = Australia; GDELT Australia = FIPS AS)
  SZ: "CH", // Switzerland (ISO SZ = Eswatini; GDELT Eswatini = FIPS WZ)
  IC: "IS", // Iceland
  OS: "AT", // Austria alt spelling in some GDELT variants

  // Asia
  JA: "JP", // Japan
  KS: "KR", // South Korea
  RP: "PH", // Philippines
  VM: "VN", // Vietnam
  TU: "TR", // Turkey
  CH: "CN", // China (ISO CH = Switzerland; handled above via SZ→CH)
  LE: "LB", // Lebanon
  IZ: "IQ", // Iraq
  KU: "KW", // Kuwait
  CE: "LK", // Sri Lanka
  CB: "KH", // Cambodia
  BM: "MM", // Myanmar
  AJ: "AZ", // Azerbaijan
  GG: "GE", // Georgia (country)
  TI: "TJ", // Tajikistan
  TX: "TM", // Turkmenistan
  KG: "KG", // Kyrgyzstan (same, but just in case)
  UZ: "UZ", // Uzbekistan (same)
  WE: "PS", // West Bank (Palestinian territories)
  GZ: "PS", // Gaza Strip (Palestinian territories)

  // Africa
  SF: "ZA", // South Africa
  ZI: "ZW", // Zimbabwe
  SU: "SD", // Sudan
  IV: "CI", // Ivory Coast / Côte d'Ivoire
  UV: "BF", // Burkina Faso (FIPS UV, ISO BF)
  RW: "RW", // Rwanda (same)
  OD: "SO", // Somalia alt in some GDELT variants
  WZ: "SZ", // Eswatini/Swaziland

  // Americas
  RQ: "PR", // Puerto Rico
  VQ: "VI", // U.S. Virgin Islands
  TB: "TT", // Trinidad and Tobago
  BB: "BB", // Barbados (same)
  JM: "JM", // Jamaica (same)
  HO: "HN", // Honduras
  NU: "NI", // Nicaragua alt
  CS: "CR", // Costa Rica
  PM: "PA", // Panama

  // Oceania
  AS: "AU", // Australia (FIPS AS, ISO AU)
  PP: "PG", // Papua New Guinea
  WS: "WS", // Samoa (same)
  TV: "TV", // Tuvalu (same)
} as const;

/**
 * Normalizes a country code from FIPS to ISO.
 * Returns the ISO code if a mapping exists, otherwise returns the input unchanged.
 */
export function normalizeCountryCode(code: string): string {
  return FIPS_TO_ISO[code] ?? code;
}
