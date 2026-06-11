/* ─────────────────────────────────────────────────────────────────────────────
 * Country flags
 *
 * Resolves a country (by English name or ISO-3166-1 alpha-2 code) to a circular
 * flag served from the BTL media CDN — the bundled HatScripts `circle-flags` set
 * mirrored to `${cdnBase}/flags/<iso2>.svg`. These replace the provider
 * (api-football) country crests everywhere a country is shown: the player
 * nationality chip, country search cards/mentions, national-team imagery.
 *
 * The football data stores country NAMES ("Argentina", "Korea Republic"), not
 * codes, so the map is keyed by a normalised name. The four UK home nations use
 * circle-flags' subdivision codes (gb-eng / gb-sct / gb-wls / gb-nir). Render-only:
 * the consumer passes the runtime CDN base (the entity-imagery manifest's
 * `cdnBase`), since the DS does not know it at build time.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Normalise a country name/code for lookup: lowercase, strip diacritics + punctuation. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Normalised English country name → circle-flags code. Aliases share a code. */
export const COUNTRY_ISO2: Readonly<Record<string, string>> = {
  // UEFA
  albania: 'al',
  andorra: 'ad',
  armenia: 'am',
  austria: 'at',
  azerbaijan: 'az',
  belarus: 'by',
  belgium: 'be',
  'bosnia and herzegovina': 'ba',
  bulgaria: 'bg',
  croatia: 'hr',
  cyprus: 'cy',
  'czech republic': 'cz',
  czechia: 'cz',
  denmark: 'dk',
  england: 'gb-eng',
  estonia: 'ee',
  'faroe islands': 'fo',
  finland: 'fi',
  france: 'fr',
  georgia: 'ge',
  germany: 'de',
  gibraltar: 'gi',
  greece: 'gr',
  hungary: 'hu',
  iceland: 'is',
  israel: 'il',
  italy: 'it',
  kazakhstan: 'kz',
  kosovo: 'xk',
  latvia: 'lv',
  liechtenstein: 'li',
  lithuania: 'lt',
  luxembourg: 'lu',
  malta: 'mt',
  moldova: 'md',
  montenegro: 'me',
  netherlands: 'nl',
  'north macedonia': 'mk',
  macedonia: 'mk',
  'northern ireland': 'gb-nir',
  norway: 'no',
  poland: 'pl',
  portugal: 'pt',
  'republic of ireland': 'ie',
  ireland: 'ie',
  romania: 'ro',
  russia: 'ru',
  'san marino': 'sm',
  scotland: 'gb-sct',
  serbia: 'rs',
  slovakia: 'sk',
  slovenia: 'si',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  turkey: 'tr',
  turkiye: 'tr',
  ukraine: 'ua',
  wales: 'gb-wls',
  // CONMEBOL
  argentina: 'ar',
  bolivia: 'bo',
  brazil: 'br',
  chile: 'cl',
  colombia: 'co',
  ecuador: 'ec',
  paraguay: 'py',
  peru: 'pe',
  uruguay: 'uy',
  venezuela: 've',
  // CONCACAF
  canada: 'ca',
  'costa rica': 'cr',
  cuba: 'cu',
  curacao: 'cw',
  'el salvador': 'sv',
  guatemala: 'gt',
  haiti: 'ht',
  honduras: 'hn',
  jamaica: 'jm',
  mexico: 'mx',
  panama: 'pa',
  'trinidad and tobago': 'tt',
  'united states': 'us',
  usa: 'us',
  'united states of america': 'us',
  // CAF
  algeria: 'dz',
  angola: 'ao',
  benin: 'bj',
  'burkina faso': 'bf',
  burundi: 'bi',
  cameroon: 'cm',
  'cape verde': 'cv',
  'cabo verde': 'cv',
  'central african republic': 'cf',
  chad: 'td',
  comoros: 'km',
  congo: 'cg',
  'dr congo': 'cd',
  'democratic republic of the congo': 'cd',
  'congo dr': 'cd',
  'ivory coast': 'ci',
  'cote d ivoire': 'ci',
  egypt: 'eg',
  'equatorial guinea': 'gq',
  eritrea: 'er',
  ethiopia: 'et',
  gabon: 'ga',
  gambia: 'gm',
  ghana: 'gh',
  guinea: 'gn',
  'guinea bissau': 'gw',
  kenya: 'ke',
  lesotho: 'ls',
  liberia: 'lr',
  libya: 'ly',
  madagascar: 'mg',
  malawi: 'mw',
  mali: 'ml',
  mauritania: 'mr',
  mauritius: 'mu',
  morocco: 'ma',
  mozambique: 'mz',
  namibia: 'na',
  niger: 'ne',
  nigeria: 'ng',
  rwanda: 'rw',
  senegal: 'sn',
  'sierra leone': 'sl',
  'south africa': 'za',
  'south sudan': 'ss',
  sudan: 'sd',
  tanzania: 'tz',
  togo: 'tg',
  tunisia: 'tn',
  uganda: 'ug',
  zambia: 'zm',
  zimbabwe: 'zw',
  // AFC
  afghanistan: 'af',
  australia: 'au',
  bahrain: 'bh',
  bangladesh: 'bd',
  cambodia: 'kh',
  china: 'cn',
  'china pr': 'cn',
  'hong kong': 'hk',
  india: 'in',
  indonesia: 'id',
  iran: 'ir',
  'ir iran': 'ir',
  iraq: 'iq',
  japan: 'jp',
  jordan: 'jo',
  kuwait: 'kw',
  kyrgyzstan: 'kg',
  lebanon: 'lb',
  malaysia: 'my',
  myanmar: 'mm',
  nepal: 'np',
  'north korea': 'kp',
  'korea dpr': 'kp',
  oman: 'om',
  palestine: 'ps',
  pakistan: 'pk',
  philippines: 'ph',
  qatar: 'qa',
  'saudi arabia': 'sa',
  singapore: 'sg',
  'south korea': 'kr',
  'korea republic': 'kr',
  'sri lanka': 'lk',
  syria: 'sy',
  tajikistan: 'tj',
  thailand: 'th',
  turkmenistan: 'tm',
  'united arab emirates': 'ae',
  uae: 'ae',
  uzbekistan: 'uz',
  vietnam: 'vn',
  yemen: 'ye',
  // OFC
  fiji: 'fj',
  'new zealand': 'nz',
  'papua new guinea': 'pg',
};

/** Resolve a country name or ISO-2/subdivision code to a circle-flags code. */
export function countryIso2(nameOrCode: string | undefined | null): string | undefined {
  if (!nameOrCode) return undefined;
  const raw = nameOrCode.trim();
  // Already a code (2 letters, or a gb-xxx subdivision)?
  if (/^[a-z]{2}$/i.test(raw)) return raw.toLowerCase();
  if (/^gb-(eng|sct|wls|nir)$/i.test(raw)) return raw.toLowerCase();
  return COUNTRY_ISO2[normalise(raw)];
}

/**
 * URL of a country's circular flag on the media CDN, or undefined if the country
 * is unknown. `cdnBase` is the runtime media base (the entity-imagery manifest's
 * `cdnBase`, e.g. https://cdn.breakingthelines.dev/media).
 */
export function countryFlagUrl(
  nameOrCode: string | undefined | null,
  cdnBase: string
): string | undefined {
  const iso2 = countryIso2(nameOrCode);
  if (!iso2) return undefined;
  return `${cdnBase.replace(/\/+$/, '')}/flags/${iso2}.svg`;
}

/**
 * Football (FIFA/IOC) three-letter country codes, keyed by the same normalised
 * names as COUNTRY_ISO2. Used for the compact nationality chip ("BRA", "ENG").
 * These are the football codes, not ISO-3166-1 alpha-3 (Netherlands is NED not
 * NLD, Germany GER not DEU, Portugal POR not PRT); the four UK home nations get
 * their own codes (ENG / SCO / WAL / NIR).
 */
export const COUNTRY_CODE3: Readonly<Record<string, string>> = {
  // UEFA
  albania: 'ALB', andorra: 'AND', armenia: 'ARM', austria: 'AUT', azerbaijan: 'AZE',
  belarus: 'BLR', belgium: 'BEL', 'bosnia and herzegovina': 'BIH', bulgaria: 'BUL',
  croatia: 'CRO', cyprus: 'CYP', 'czech republic': 'CZE', czechia: 'CZE', denmark: 'DEN',
  england: 'ENG', estonia: 'EST', 'faroe islands': 'FRO', finland: 'FIN', france: 'FRA',
  georgia: 'GEO', germany: 'GER', gibraltar: 'GIB', greece: 'GRE', hungary: 'HUN',
  iceland: 'ISL', israel: 'ISR', italy: 'ITA', kazakhstan: 'KAZ', kosovo: 'KVX',
  latvia: 'LVA', liechtenstein: 'LIE', lithuania: 'LTU', luxembourg: 'LUX', malta: 'MLT',
  moldova: 'MDA', montenegro: 'MNE', netherlands: 'NED', 'north macedonia': 'MKD',
  macedonia: 'MKD', 'northern ireland': 'NIR', norway: 'NOR', poland: 'POL',
  portugal: 'POR', 'republic of ireland': 'IRL', ireland: 'IRL', romania: 'ROU',
  russia: 'RUS', 'san marino': 'SMR', scotland: 'SCO', serbia: 'SRB', slovakia: 'SVK',
  slovenia: 'SVN', spain: 'ESP', sweden: 'SWE', switzerland: 'SUI', turkey: 'TUR',
  turkiye: 'TUR', ukraine: 'UKR', wales: 'WAL',
  // CONMEBOL
  argentina: 'ARG', bolivia: 'BOL', brazil: 'BRA', chile: 'CHI', colombia: 'COL',
  ecuador: 'ECU', paraguay: 'PAR', peru: 'PER', uruguay: 'URU', venezuela: 'VEN',
  // CONCACAF
  canada: 'CAN', 'costa rica': 'CRC', cuba: 'CUB', curacao: 'CUW', 'el salvador': 'SLV',
  guatemala: 'GUA', haiti: 'HAI', honduras: 'HON', jamaica: 'JAM', mexico: 'MEX',
  panama: 'PAN', 'trinidad and tobago': 'TRI', 'united states': 'USA', usa: 'USA',
  'united states of america': 'USA',
  // CAF
  algeria: 'ALG', angola: 'ANG', benin: 'BEN', 'burkina faso': 'BFA', burundi: 'BDI',
  cameroon: 'CMR', 'cape verde': 'CPV', 'cabo verde': 'CPV', 'central african republic': 'CTA',
  chad: 'CHA', comoros: 'COM', congo: 'CGO', 'dr congo': 'COD',
  'democratic republic of the congo': 'COD', 'congo dr': 'COD', 'ivory coast': 'CIV',
  "cote d ivoire": 'CIV', egypt: 'EGY', 'equatorial guinea': 'EQG', eritrea: 'ERI',
  ethiopia: 'ETH', gabon: 'GAB', gambia: 'GAM', ghana: 'GHA', guinea: 'GUI',
  'guinea bissau': 'GNB', kenya: 'KEN', lesotho: 'LES', liberia: 'LBR', libya: 'LBY',
  madagascar: 'MAD', malawi: 'MWI', mali: 'MLI', mauritania: 'MTN', mauritius: 'MRI',
  morocco: 'MAR', mozambique: 'MOZ', namibia: 'NAM', niger: 'NIG', nigeria: 'NGA',
  rwanda: 'RWA', senegal: 'SEN', 'sierra leone': 'SLE', 'south africa': 'RSA',
  'south sudan': 'SSD', sudan: 'SDN', tanzania: 'TAN', togo: 'TOG', tunisia: 'TUN',
  uganda: 'UGA', zambia: 'ZAM', zimbabwe: 'ZIM',
  // AFC
  afghanistan: 'AFG', australia: 'AUS', bahrain: 'BHR', bangladesh: 'BAN', cambodia: 'CAM',
  china: 'CHN', 'china pr': 'CHN', 'hong kong': 'HKG', india: 'IND', indonesia: 'IDN',
  iran: 'IRN', 'ir iran': 'IRN', iraq: 'IRQ', japan: 'JPN', jordan: 'JOR', kuwait: 'KUW',
  kyrgyzstan: 'KGZ', lebanon: 'LBN', malaysia: 'MAS', myanmar: 'MYA', nepal: 'NEP',
  'north korea': 'PRK', 'korea dpr': 'PRK', oman: 'OMA', palestine: 'PLE', pakistan: 'PAK',
  philippines: 'PHI', qatar: 'QAT', 'saudi arabia': 'KSA', singapore: 'SGP',
  'south korea': 'KOR', 'korea republic': 'KOR', 'sri lanka': 'SRI', syria: 'SYR',
  tajikistan: 'TJK', thailand: 'THA', turkmenistan: 'TKM', 'united arab emirates': 'UAE',
  uae: 'UAE', uzbekistan: 'UZB', vietnam: 'VIE', yemen: 'YEM',
  // OFC
  fiji: 'FIJ', 'new zealand': 'NZL', 'papua new guinea': 'PNG',
};

/**
 * Resolve a country name (or 3-letter code) to its football three-letter code,
 * e.g. "Brazil" -> "BRA", "England" -> "ENG". Returns the upper-cased input when
 * it is already a 3-letter code, or undefined when unknown (caller falls back to
 * the full name).
 */
export function countryCode3(nameOrCode: string | undefined | null): string | undefined {
  if (!nameOrCode) return undefined;
  const raw = nameOrCode.trim();
  if (/^[a-z]{3}$/i.test(raw)) return raw.toUpperCase();
  return COUNTRY_CODE3[normalise(raw)];
}
