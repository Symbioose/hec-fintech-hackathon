import type { AssetManagerProfile } from "@/types/assetManager";

export const ASSET_MANAGERS: AssetManagerProfile[] = [
  {
    id: "AM-02",
    name: "François Martin",
    firm: "Carmignac Credit Fund A",
    avatarColor: "primary",
    strategy: "balanced_income",
    risk_appetite: "medium",

    /* ── Currency & tenor ─────────────────────────────────────────────── */
    allowed_currencies: ["EUR"],
    max_tenor_years: 5,

    /* ── Credit quality ───────────────────────────────────────────────── */
    min_issuer_rating: "BBB-",          // Investment Grade only (BBB- floor, worst-of S&P/Moody's)
    preferred_issuers: [
      "BNP Paribas SA",
      "Société Générale SA",
      "ING Groep NV",
      "Crédit Agricole SA",
      "HSBC Holdings PLC",
      "Barclays PLC",
    ],
    excluded_issuers: [],               // ESG handled via forbidden_underlyings

    /* ── Asset class ──────────────────────────────────────────────────── */
    allowed_underlying_types: ["credit", "rates"],
    forbidden_underlyings: [
      "TotalEnergies SE",               // ESG — fossil fuels
      "Glencore PLC",                   // ESG — thermal coal
      "BP PLC",                         // ESG — fossil fuels
      "Shell PLC",                      // ESG — fossil fuels
      "Equinor ASA",                    // ESG — fossil fuels
      "Anglo American PLC",             // ESG — mining
    ],

    /* ── Capital / protection ─────────────────────────────────────────── */
    requires_capital_protection: false,
    max_barrier_risk: null,

    /* ── Yield & risk ─────────────────────────────────────────────────── */
    target_yield_min: 0.03,             // 3.00% minimum coupon / yield
    liquidity_need: "high",             // UCITS — daily liquidity required

    /* ── ESG ──────────────────────────────────────────────────────────── */
    esg_constraints: [
      "article_8_ucits",                // SFDR Article 8 classification
      "no_fossil_fuels",                // Excludes all fossil fuel producers
      "no_controversial_weapons",       // Cluster munitions, anti-personnel mines
      "no_tobacco",                     // Tobacco manufacturers excluded
      "sfdr_pai_mandatory",             // Must report Principal Adverse Impact
      "min_msci_esg_score_bbb",         // Minimum MSCI ESG corporate rating BBB
    ],

    /* ── Exposures ────────────────────────────────────────────────────── */
    current_exposures: {
      credit: 0.45,                     // 45% IG corporate credit
      rates: 0.30,                      // 30% sovereign / quasi-sovereign
      multi_asset: 0.15,               // 15% diversified
      equity_index: 0.05,
      single_stock: 0.05,
    },

    aum_eur_m: 1_240,
    description: [
      "UCITS Article 8 SFDR | AUM EUR 1.24B | EUR only | Max tenor 5Y",
      "IG credit (BBB- min, S&P worst-of) | Senior Preferred / Unsecured only — no Sub/Tier2/AT1",
      "ESG: excludes fossil fuels, thermal coal, controversial weapons, tobacco",
      "Geography: EEA + UK only | Max single issuer 10% AUM | Daily liquidity (UCITS)",
      "PM views: constructif bancaires européennes · bearish pétrole · préférence duration < 3Y",
    ].join("\n"),
  },

  /* ── Secondary profiles (used in other contexts) ────────────────────── */
  {
    id: "AM-01",
    name: "Sarah Chen",
    firm: "BlueBridge Capital",
    avatarColor: "accent",
    strategy: "yield_enhancement",
    risk_appetite: "medium_high",
    allowed_currencies: ["EUR", "USD"],
    max_tenor_years: 6,
    min_issuer_rating: "BBB",
    preferred_issuers: ["Deutsche Bank AG", "UBS AG"],
    excluded_issuers: [],
    allowed_underlying_types: ["credit", "equity_index", "single_stock"],
    forbidden_underlyings: [],
    requires_capital_protection: false,
    max_barrier_risk: 0.55,
    target_yield_min: 0.05,
    liquidity_need: "medium",
    esg_constraints: [],
    current_exposures: { credit: 0.4, equity_index: 0.35, single_stock: 0.15, rates: 0.1, multi_asset: 0 },
    aum_eur_m: 680,
    description: "Yield-enhancement mandate. EUR & USD. Sub-eligible accounts. No ESG screen.",
  },
  {
    id: "AM-03",
    name: "Laura Deschamps",
    firm: "Caisse Piliers Gestion",
    avatarColor: "success",
    strategy: "defensive_income",
    risk_appetite: "low",
    allowed_currencies: ["EUR"],
    max_tenor_years: 4,
    min_issuer_rating: "A-",
    preferred_issuers: ["BNP Paribas SA", "Crédit Agricole SA"],
    excluded_issuers: [],
    allowed_underlying_types: ["credit", "rates"],
    forbidden_underlyings: ["TotalEnergies SE", "Glencore PLC", "BP PLC", "Shell PLC", "Equinor ASA"],
    requires_capital_protection: false,
    max_barrier_risk: null,
    target_yield_min: 0.025,
    liquidity_need: "high",
    esg_constraints: ["article_8_ucits", "no_fossil_fuels", "no_controversial_weapons"],
    current_exposures: { credit: 0.7, rates: 0.25, equity_index: 0.05, single_stock: 0, multi_asset: 0 },
    aum_eur_m: 2_100,
    description: "Conservative insurance mandate. A- minimum. EUR only. Duration < 4Y. UCITS Article 8.",
  },
  {
    id: "AM-04",
    name: "Magnus Lindqvist",
    firm: "Nordlys Wealth Family Office",
    avatarColor: "secondary",
    strategy: "defensive_income",
    risk_appetite: "low",

    /* ── Currency & tenor ─────────────────────────────────────────────── */
    allowed_currencies: ["EUR"],
    max_tenor_years: 3,

    /* ── Credit quality ───────────────────────────────────────────────── */
    min_issuer_rating: "A-",
    preferred_issuers: ["ING Groep NV", "BNP Paribas SA"],
    excluded_issuers: [],

    /* ── Asset class ──────────────────────────────────────────────────── */
    allowed_underlying_types: ["credit", "rates"],
    forbidden_underlyings: [],

    /* ── Capital / protection ─────────────────────────────────────────── */
    requires_capital_protection: false,
    max_barrier_risk: null,

    /* ── Yield & risk ─────────────────────────────────────────────────── */
    target_yield_min: 0.02,             // 2.00% minimum yield
    liquidity_need: "medium",

    /* ── ESG ──────────────────────────────────────────────────────────── */
    esg_constraints: [],                // No formal ESG screen, very conservative by nature

    /* ── Exposures ────────────────────────────────────────────────────── */
    current_exposures: {
      credit: 0.55,                     // 55% high-grade corporate credit
      rates: 0.40,                      // 40% sovereign / covered bonds
      multi_asset: 0.05,
      equity_index: 0,
      single_stock: 0,
    },

    aum_eur_m: 340,
    description: [
      "Nordic family office | AUM EUR 340M | EUR only | Max tenor 3Y",
      "High-grade credit (A- min) | Senior secured / Senior Preferred only",
      "No formal ESG screen but extremely conservative issuer selection",
      "Preferred issuers: ING Groep NV, BNP Paribas SA | Low risk appetite",
      "Focus: capital preservation + defensive income above 2% threshold",
    ].join("\n"),
  },
  {
    id: "AM-05",
    name: "Sophie Renard",
    firm: "Atelier Patrimoine MFO",
    avatarColor: "warning",
    strategy: "yield_enhancement",
    risk_appetite: "medium_high",

    /* ── Currency & tenor ─────────────────────────────────────────────── */
    allowed_currencies: ["EUR", "USD"],
    max_tenor_years: 5,

    /* ── Credit quality ───────────────────────────────────────────────── */
    min_issuer_rating: "BBB",
    preferred_issuers: [],
    excluded_issuers: [],

    /* ── Asset class ──────────────────────────────────────────────────── */
    allowed_underlying_types: ["credit", "equity_index", "single_stock"],
    forbidden_underlyings: [],

    /* ── Capital / protection ─────────────────────────────────────────── */
    requires_capital_protection: false,
    max_barrier_risk: 0.6,

    /* ── Yield & risk ─────────────────────────────────────────────────── */
    target_yield_min: 0.045,            // 4.50% minimum yield
    liquidity_need: "medium",

    /* ── ESG ──────────────────────────────────────────────────────────── */
    esg_constraints: [],                // No ESG constraints across client sleeves

    /* ── Exposures ────────────────────────────────────────────────────── */
    current_exposures: {
      credit: 0.30,                     // 30% IG/HY corporate credit
      equity_index: 0.35,               // 35% index-linked structured products
      single_stock: 0.20,               // 20% single-stock autocalls
      rates: 0.10,
      multi_asset: 0.05,
    },

    aum_eur_m: 520,
    description: [
      "French multi-family office | AUM EUR 520M | EUR & USD | Max tenor 5Y",
      "BBB minimum issuer rating | Multiple client sleeves — yield is primary objective",
      "Eligible for equity-linked structures, autocalls, barrier products (barrier ≤ 60%)",
      "No ESG screen | Sub-eligible for IG-rated tranches | Medium-high risk tolerance",
      "Target: 4.5%+ net yield across sleeves | Broad underlying universe incl. single stocks",
    ].join("\n"),
  },
];
