import type { Product } from "@/types/product";

// ─── Real credit products from bank research notes — 25 April 2026 ───────────
// Sources: BNP CIB Weekly, Goldman European Credit, SocGen Morning Note,
//          Citi Relative Value Matrix, SocGen Sales Call Transcript.
//
// Fund context: Carmignac Credit Fund A — IG EUR Senior only, ESG Article 8.
// Expected: 5 MATCH / 3 NEAR-MISS / 4 REJECT (2 ESG, 1 seniority, 1 HY)

export const PRODUCTS: Product[] = [
  /* ── ✅ ELIGIBLE: BNP Paribas SA Senior Preferred 2028 ─────────────── */
  {
    id: "P-BNP-2028",
    issuer: "BNP Paribas SA",
    product_name: "BNP Paribas SA Senior Preferred 2028",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_250_000,
    tenor_years: 1.9,
    maturity_date: "2028-03-15",
    issue_date: "2023-03-15",
    coupon: 0.03125,
    coupon_type: "fixed",
    underlying: ["BNP Paribas SA"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB+",
    liquidity: "high",
    risk_level: "low",
    source_type: "email",
    source_reference: "BNP CIB Credit Weekly — 25 Apr 2026",
    raw_text: `From: jean-charles.dupont@bnpparibas.com
To: francois.martin@carmignac.com
Subject: BNP Paribas CIB — European Credit Weekly 25 April 2026

IDEA #1 — BUY BNP PARIBAS SA SENIOR PREFERRED 2028
ISIN: FR0013421286
Seniority: Senior Preferred (unsecured)
Coupon: 3.125% fixed annual
Maturity: 15 March 2028 | Duration: 1.9 years
Rating: BBB+ / A2 (S&P / Moody's)
Issue size: EUR 1,250M
Current ASW: +91bps vs 3y EUR Mid-Swap
Price: 100.42

Recommendation: BUY — target spread +78bps, stop-loss +100bps

BNP Paribas senior preferred screens attractive vs European bank peer group.
Post-Q1 spread widening of +12bps appears overdone given solid CET1 ratio of 13.2%.
Management confirmed full-year guidance at April 22 investor day.
Conviction: HIGH. Catalyst: Q1 earnings beat April 29.`,
    ingested_at: "2026-04-25T09:14:00Z",
  },

  /* ── ✅ ELIGIBLE: Société Générale SA Senior Preferred 2027 ──────────── */
  {
    id: "P-SGN-2027",
    issuer: "Société Générale SA",
    product_name: "Société Générale SA Senior Preferred 2027",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_500_000,
    tenor_years: 0.7,
    maturity_date: "2027-01-08",
    issue_date: "2023-01-08",
    coupon: 0.0375,
    coupon_type: "fixed",
    underlying: ["Société Générale SA"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB",
    liquidity: "high",
    risk_level: "low",
    source_type: "email",
    source_reference: "SocGen CIB Morning Note — 25 Apr 2026",
    raw_text: `Société Générale CIB — Morning Note
25 avril 2026, 08:15 CET
Thomas Gautier | Céline Marchand | Fixed Income Sales, Paris

IDEA #1 — BUY SOCIÉTÉ GÉNÉRALE SA SENIOR PREFERRED 2027
ISIN: FR0014003J41
Seniority: Senior Preferred
Coupon: 3.750% fixed annual
Maturity: 08 January 2027 | Duration: 0.7 years
Rating: BBB / Baa1 (S&P / Moody's)
Issue size: EUR 1,500M
Current ASW: +88bps vs 2y EUR Mid-Swap | Price: 101.34

Recommendation: BUY — short duration carry, target +76bps

SocGen 2027 offers compelling short-dated carry with minimal duration risk (0.7y).
Management exceeded Q4 2025 capital targets (CET1 13.6% vs 13% guidance).
Spread differential vs BNP 2028 represents tactical value at current levels.
Conviction: HIGH. Clean ESG profile, no fossil fuel exposure.`,
    ingested_at: "2026-04-25T08:47:00Z",
  },

  /* ── ✅ ELIGIBLE: ING Groep NV Senior Preferred 2029 ────────────────── */
  {
    id: "P-ING-2029",
    issuer: "ING Groep NV",
    product_name: "ING Groep NV Senior Preferred 2029",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_000_000,
    tenor_years: 2.9,
    maturity_date: "2029-03-27",
    issue_date: "2024-03-27",
    coupon: 0.03375,
    coupon_type: "fixed",
    underlying: ["ING Groep NV"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "A-",
    liquidity: "high",
    risk_level: "low",
    source_type: "chat",
    source_reference: "SocGen Sales Call — 09:31 CET 25 Apr 2026",
    raw_text: `[SocGen Sales Call Transcript — 25 Apr 2026 09:31 CET]
Thomas Gautier (SocGen): François, ING senior preferred 2029, ISIN XS2198765432,
traite à +82bps contre le swap 4 ans. Cheap versus BNP même maturité à +91,
alors qu'ING est noté A- contre BBB+ pour BNP — différentiel de 9bps difficile
à justifier. Q1 solides : NIM +12bps QoQ, CET1 15.2%.

François Martin (Carmignac): Target ?
Thomas: +70bps — 12bps de compression. Stop à +92. Prix 100.87.
François: Duration me convient. Envoie la note écrite.

ISIN: XS2198765432 | Seniority: Senior Preferred
Coupon: 3.375% | Maturity: 27 March 2029 | Duration: 2.9y
Rating: A- / A3 | ASW: +82bps | Price: 100.87
No ESG concerns. No subordination risk. High liquidity (EUR 1bn issue).`,
    ingested_at: "2026-04-25T11:02:00Z",
  },

  /* ── ✅ ELIGIBLE: Volkswagen AG Senior Unsecured 2028 ───────────────── */
  {
    id: "P-VW-2028",
    issuer: "Volkswagen AG",
    product_name: "Volkswagen AG Senior Unsecured 2028",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 2_000_000,
    tenor_years: 2.5,
    maturity_date: "2028-10-19",
    issue_date: "2023-10-19",
    coupon: 0.0325,
    coupon_type: "fixed",
    underlying: ["Volkswagen AG"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB-",
    liquidity: "high",
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "Goldman Sachs European Credit Views — 25 Apr 2026",
    raw_text: `Goldman Sachs Fixed Income Research — European Credit Sector Views
25 April 2026 | Sarah Chen CFA | Pierre Moreau

IDEA #3 — BUY VOLKSWAGEN AG SENIOR 2028
ISIN: DE000A3H3FE6
Seniority: Senior Unsecured
Coupon: 3.250% fixed annual
Maturity: 19 October 2028 | Duration: 2.5 years
Rating: BBB- / Baa3 (S&P / Moody's) — at investment grade floor
Issue size: EUR 2,000M
Current ASW: +142bps vs 3y EUR Mid-Swap | Price: 98.34

Recommendation: BUY — distressed value in autos, target +115bps

VW has widened 48bps YTD on EV transition uncertainty and Cariad software division
restructuring costs (EUR 2.4B one-off Q4 2025). Bottom confirmed: new CEO plan
April 10, EUR 5B cost reduction on track. Rating floor at BBB- given strategic
importance to German economy. Duration 2.5Y within most IG mandates.
Conviction: MEDIUM. Stop-loss at +160bps.`,
    ingested_at: "2026-04-25T10:28:00Z",
  },

  /* ── ◇ NEAR-MISS: Orange SA Senior Unsecured 2029 ──────────────────── */
  {
    id: "P-ORA-2029",
    issuer: "Orange SA",
    product_name: "Orange SA Senior Unsecured 2029",
    product_type: "range_accrual",  // non-standard type → lower semantic score
    currency: "EUR",
    notional: null,
    tenor_years: 3.4,
    maturity_date: "2029-09-18",
    issue_date: "2023-09-18",
    coupon: 0.035,
    coupon_type: "fixed",
    underlying: ["Orange SA"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB+",
    liquidity: "high",
    risk_level: "medium",
    source_type: "email",
    source_reference: "BNP CIB Credit Weekly — 25 Apr 2026",
    raw_text: `BNP Paribas CIB — European Credit Weekly 25 April 2026

IDEA #3 — UNDERWEIGHT ORANGE SA SENIOR 2029
ISIN: FR0013512366
Seniority: Senior Unsecured
Coupon: 3.500% fixed annual
Maturity: 18 September 2029 | Duration: 3.4 years
Rating: BBB+ / Baa1
Current ASW: +78bps vs 4y EUR Mid-Swap

Recommendation: UNDERWEIGHT — spread too tight vs sector

Orange screens expensive vs European telecom peers (+8bps through VEON, +12bps
through Telecom Italia same duration). Limited upside catalyst. We prefer rotating
into BNP Paribas 2028 for better carry per unit of duration risk.
Reduce exposure on any spread tightening below +75bps.

NOTE: This is an UNDERWEIGHT recommendation — not a buy idea.`,
    ingested_at: "2026-04-25T08:15:00Z",
  },

  /* ── ✅ ELIGIBLE: ING Groep NV Senior Preferred 2028 ────────────────── */
  {
    id: "P-ING-2028",
    issuer: "ING Groep NV",
    product_name: "ING Groep NV Senior Preferred 2028",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_250_000,
    tenor_years: 2.5,
    maturity_date: "2028-10-15",
    issue_date: "2023-10-15",
    coupon: 0.0325,
    coupon_type: "fixed",
    underlying: ["ING Groep NV"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "A-",
    liquidity: "high",
    risk_level: "low",
    source_type: "email",
    source_reference: "SocGen CIB Morning Note — 25 Apr 2026",
    raw_text: `Société Générale CIB — Morning Note 25 April 2026

IDEA #3 — BUY ING GROEP NV SENIOR PREFERRED 2028
ISIN: XS2198123456
Seniority: Senior Preferred
Coupon: 3.250% fixed annual
Maturity: 15 October 2028 | Duration: 2.5 years
Rating: A- / A3 (S&P / Moody's)
Issue size: EUR 1,250M
Current ASW: +79bps vs 3y EUR Mid-Swap | Price: 101.12

Recommendation: BUY — quality carry in banks

ING 2028 complements the SocGen 2027 idea for accounts looking to extend
duration slightly. Clean credit — no ESG concerns, no sub risk.
Strong Q1 beat (CET1 15.2%, NIM +12bps). We like building a barbell
of SocGen 2027 (short) + ING 2028 (medium) vs selling Orange 2029.
Conviction: HIGH. Suitable for most IG senior mandates.`,
    ingested_at: "2026-04-25T08:47:00Z",
  },

  /* ── ◇ NEAR-MISS: ING Groep NV Floating Rate Note 2028 — FRN vs Fixed ──
     Score ~74: floating_rate_note lowers semantic (0.55 vs 0.80), coupon 2.90%
     just below 3% mandate floor. Gap = 10bps coupon + wrong coupon type.
     Negotiation → REQUEST fixed coupon version at 3.25%. ──────────────── */
  {
    id: "P-ING-FRN-2028",
    issuer: "ING Groep NV",
    product_name: "ING Groep NV FRN Senior Preferred 2028",
    product_type: "floating_rate_note",
    currency: "EUR",
    notional: 1_000_000,
    tenor_years: 2.0,
    maturity_date: "2028-04-28",
    issue_date: "2026-04-28",
    coupon: 0.029,
    coupon_type: "floating",
    underlying: ["ING Groep NV"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "A-",
    liquidity: "high",
    risk_level: "low",
    source_type: "chat",
    source_reference: "ING Sales — Bloomberg MSG 09:45 CET 25 Apr 2026",
    raw_text: `[Bloomberg MSG — 25 Apr 2026 09:45 CET]
From: Lucas.Brouwer@ing.com | ING Wholesale Banking, Amsterdam
To: Francois.Martin@carmignac.com

François bonjour,

Nouvelle émission ING ce matin — FRN Senior Preferred 2028, 2 ans.

INDICATIF — à confirmer avant 11h00
ISIN: XS2399011223 (provisional)
Seniority: Senior Preferred (unsecured)
Structure: Floating Rate — EURIBOR 3M + 25bps
Effective coupon (swap-adjusted): ~2.90% p.a.
Maturity: 28 April 2028 | Duration: 2.0 years
Rating: A- / A3 (S&P / Moody's)
Issue size: EUR 1,000M (benchmark)
Re-offer price: 100.00 | ASW: +28bps vs 2y Mid-Swap

ING Q1 2026 très solide — CET1 15.4% (+30bps QoQ), NIM stable à 1.52%.
La FRN offre une protection naturelle contre une remontée des taux courts.
EUR 1bn issue — liquidité quotidienne garantie, éligible UCITS.

Ticket minimum: EUR 100k. Livre fermé 11h.
Tu es intéressé ?

Lucas Brouwer | Senior Rates & Credit Sales | ING Wholesale Banking`,
    ingested_at: "2026-04-25T09:52:00Z",
  },

  /* ── ◇ NEAR-MISS: Barclays PLC Callable Senior Preferred 2029 ───────────
     Score ~76: fixed_rate_note preferred issuer but risk_level medium_high
     (callable structure) reduces marketFit to 0.70. Coupon 2.75% = 25bps
     below mandate floor. Negotiation → REQUEST +25bps to 3.00%. ───────── */
  {
    id: "P-BAR-2029",
    issuer: "Barclays PLC",
    product_name: "Barclays PLC Callable Senior Preferred 2029",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_000_000,
    tenor_years: 3.0,
    maturity_date: "2029-04-25",
    issue_date: "2026-04-25",
    coupon: 0.0275,
    coupon_type: "fixed",
    underlying: ["Barclays PLC"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB",
    liquidity: "high",
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "Citi Credit Sales — 25 Apr 2026",
    raw_text: `From: oliver.whitfield@citi.com
To: francois.martin@carmignac.com
Date: 25 Apr 2026, 10:55 CET
Subject: Barclays PLC Senior Preferred Callable 2029 — New Issue

Dear François,

Please find below details on the Barclays PLC Senior Preferred callable note launching this morning.

BARCLAYS PLC SENIOR PREFERRED CALLABLE 2029
ISIN: XS2399087654 (provisional)
Seniority: Senior Preferred (unsecured)
Structure: Fixed-to-Call — 2.750% fixed until first call date
First Call: 25 April 2028 (NC2) | Final Maturity: 25 April 2029
Rating: BBB / Baa2 (S&P / Moody's)
Issue size: EUR 1,000M
Guidance: MS+145bps | Price: 100.00

The callable structure gives Barclays refinancing flexibility post Basel IV
capital recalibration. CET1 14.3%, well above regulatory requirements.
Q1 2026 revenues in line with guidance.

Extension risk: if not called in April 2028, coupon steps up to MS+165bps.
Note: callable structure implies higher effective duration risk vs bullet.
Verify mandate capacity for callable / call-extension risk.

Kind regards,
Oliver Whitfield | European IG Credit Sales, Citi London`,
    ingested_at: "2026-04-25T11:08:00Z",
  },

  /* ── ◇ NEAR-MISS: BNP Paribas SA Phoenix Autocall 2029 — Equity Underlying
     Score ~74: autocall on EuroStoxx50 — equity_index underlying NOT in
     mandate allowed_underlying_types (credit, rates only). Halves semantic.
     High coupon 5.20% but structural mismatch requires full counter-proposal.
     Negotiation → COUNTER to fixed-rate credit note equivalent at ~4.20%. ─ */
  {
    id: "P-BNP-PHX-2029",
    issuer: "BNP Paribas SA",
    product_name: "BNP Phoenix Autocall EuroStoxx50 2029",
    product_type: "autocallable",
    currency: "EUR",
    notional: 1_000_000,
    tenor_years: 3.0,
    maturity_date: "2029-04-25",
    issue_date: "2026-04-25",
    coupon: 0.052,
    coupon_type: "memory",
    underlying: ["EuroStoxx 50 Index"],
    underlying_type: "equity_index",
    barrier: 0.6,
    protection_level: null,
    capital_protection: false,
    autocall: true,
    issuer_rating: "BBB+",
    liquidity: "high",
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "BNP Structured Products Desk — 25 Apr 2026",
    raw_text: `From: alexandre.petit@bnpparibas.com
To: francois.martin@carmignac.com
Date: 25 Apr 2026, 13:10 CET
Subject: BNP SP Desk — Phoenix Memory Autocall EuroStoxx50 | 5.20% | 3Y

François,

Notre desk produits structurés propose le Phoenix Memory Autocall suivant, très demandé ce trimestre :

BNP PHOENIX MEMORY AUTOCALL — EUROSTOXX 50 — 3 ANS
Émetteur: BNP Paribas SA | Rating: A (émetteur) / BBB+ (produit)
Sous-jacent: EuroStoxx 50 (SX5E Index)
Barrière coupon: 60% du spot initial (observation trimestrielle)
Barrière capital: 60% du spot initial (observation finale uniquement)
Coupon mémoire: 5.20% p.a. (trimestriel) — récupérable si barrière franchie
Rappel automatique: trimestriel dès 100% du spot initial
Maturité: 3 ans | Protection capital: aucune sous 60%
Notionnel: EUR 1,000,000

POINTS FORTS:
→ Coupon mémoire 5.20% vs 4.80% sur structure vanilla — prime +40bps
→ Rappel probable T+3 ou T+6 dans notre scénario central (vol SX5E 15%)
→ Risque en capital limité aux scénarios de choc > -40%

Ce produit est particulièrement adapté aux gérants souhaitant du rendement
avec une exposition actions maîtrisée. Popularité très forte en avril 2026.

Alexandre Petit | BNP Paribas CIB — Structured Products Sales, Paris
Tel: +33 1 42 98 XX XX`,
    ingested_at: "2026-04-25T13:15:00Z",
  },

  /* ── ❌ REJECT: TotalEnergies SE Senior Unsecured 2028 — ESG ─────────── */
  {
    id: "P-TOT-2028",
    issuer: "TotalEnergies SE",
    product_name: "TotalEnergies SE Senior Unsecured 2028",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_000_000,
    tenor_years: 2.2,
    maturity_date: "2028-06-22",
    issue_date: "2023-06-22",
    coupon: 0.02875,
    coupon_type: "fixed",
    underlying: ["TotalEnergies SE"],       // ← ESG exclusion triggers hard fail
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "A-",
    liquidity: "high",
    risk_level: "low",
    source_type: "email",
    source_reference: "BNP CIB Credit Weekly — 25 Apr 2026",
    raw_text: `BNP Paribas CIB — European Credit Weekly 25 April 2026

IDEA #2 — BUY TOTAL ENERGIES SE SENIOR UNSECURED 2028
ISIN: FR0013424977
Seniority: Senior Unsecured
Coupon: 2.875% fixed annual
Maturity: 22 June 2028 | Duration: 2.2 years
Rating: A- / A2 (S&P / Moody's)
Issue size: EUR 1,000M
Current ASW: +95bps vs 3y EUR Mid-Swap | Price: 99.18

Recommendation: BUY — tactical entry, target spread +78bps

TotalEnergies has widened 18bps YTD on oil price weakness and ESG exclusion
flows from Article 8/9 funds. Fundamentals remain solid: leverage 0.7x,
FCF positive at $8.2B last year.

⚠️  NOTE: TotalEnergies is on ESG exclusion lists for all Article 8 UCITS funds
due to fossil fuel / oil & gas exposure. Check mandate ESG eligibility before
executing. This idea is NOT suitable for ESG-restricted mandates.`,
    ingested_at: "2026-04-25T09:14:00Z",
  },

  /* ── ❌ REJECT: Glencore PLC Senior Unsecured 2030 — ESG ────────────── */
  {
    id: "P-GLEN-2030",
    issuer: "Glencore PLC",
    product_name: "Glencore PLC Senior Unsecured 2030",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 1_380_000,
    tenor_years: 4.1,
    maturity_date: "2030-05-14",
    issue_date: "2024-05-14",
    coupon: 0.04125,
    coupon_type: "fixed",
    underlying: ["Glencore PLC"],           // ← ESG exclusion triggers hard fail
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BBB",
    liquidity: "medium",
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "BNP CIB Credit Weekly — 25 Apr 2026",
    raw_text: `BNP Paribas CIB — European Credit Weekly 25 April 2026

IDEA #4 — BUY GLENCORE PLC SENIOR UNSECURED 2030
ISIN: XS2234567891
Seniority: Senior Unsecured
Coupon: 4.125% fixed annual
Maturity: 14 May 2030 | Duration: 4.1 years
Rating: BBB / Baa2 — negative outlook
Issue size: USD 1,500M (~EUR 1,380M)
Current ASW: +118bps vs 5y EUR Mid-Swap | Price: 98.76

Recommendation: BUY — value in diversified mining, target +98bps

Glencore screens 28bps wide vs diversified mining peers. Recent divestiture of
Australian coal assets removes key ESG concern for some mandates.
FCF generation robust ($4.1B LTM). Stop at +135bps.

⚠️  NOTE: Glencore remains on ESG exclusion lists for most Article 8 UCITS funds
due to residual thermal coal operations and mining exposure.
NOT eligible for ESG-restricted mandates.`,
    ingested_at: "2026-04-25T09:14:00Z",
  },

  /* ── ❌ REJECT: Deutsche Bank AG Tier 2 Sub 2030 — Seniority ─────────── */
  {
    id: "P-DBK-T2-2030",
    issuer: "Deutsche Bank AG",
    product_name: "Deutsche Bank AG Tier 2 Subordinated 2030",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 500_000,
    tenor_years: 3.8,
    maturity_date: "2030-02-12",
    issue_date: "2020-02-12",
    coupon: 0.045,
    coupon_type: "fixed",
    underlying: ["Deutsche Bank AG"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BB+",                   // Sub instrument rated below senior — triggers IG floor fail
    liquidity: "medium",
    risk_level: "medium_high",
    source_type: "email",
    source_reference: "SocGen CIB Morning Note — 25 Apr 2026",
    raw_text: `Société Générale CIB — Morning Note 25 April 2026

IDEA #2 — PASS DEUTSCHE BANK AG TIER 2 SUBORDINATED 2030
ISIN: DE000DB7WGP3
Seniority: ⚠️  SUBORDINATED — Tier 2 regulatory capital (NOT Senior)
Coupon: 4.500% fixed | First call: Feb 2025 (non-called, now bullet)
Maturity: 12 February 2030 | Duration: 3.8 years
Sub instrument rating: BBB- / Baa3 | Senior rating: BBB / Baa2
Issue size: EUR 500M
Current ASW: +162bps vs 5y EUR Mid-Swap | Price: 99.45

Recommendation: BUY — for accounts with sub / Tier2 capacity ONLY

DB Tier2 screens 22bps cheap vs peer Tier2 basket. CET1 improved to 13.8%.
Post non-call, bond now bullet to 2030 — extension risk eliminated.

⚠️  IMPORTANT: SUBORDINATED INSTRUMENT — Tier 2 regulatory capital.
Senior-only mandates: NOT ELIGIBLE. Verify seniority constraints before trading.`,
    ingested_at: "2026-04-25T08:47:00Z",
  },

  /* ── ❌ REJECT: Deutsche Lufthansa AG Senior 2028 — High Yield ────────── */
  {
    id: "P-LH-2028",
    issuer: "Deutsche Lufthansa AG",
    product_name: "Deutsche Lufthansa AG Senior Unsecured 2028",
    product_type: "fixed_rate_note",
    currency: "EUR",
    notional: 750_000,
    tenor_years: 1.8,
    maturity_date: "2028-02-24",
    issue_date: "2024-02-24",
    coupon: 0.0475,
    coupon_type: "fixed",
    underlying: ["Deutsche Lufthansa AG"],
    underlying_type: "credit",
    barrier: null,
    protection_level: null,
    capital_protection: false,
    autocall: false,
    issuer_rating: "BB+",                   // HIGH YIELD — triggers min BBB- hard fail
    liquidity: "medium",
    risk_level: "high",
    source_type: "email",
    source_reference: "Goldman Sachs European Credit Views — 25 Apr 2026",
    raw_text: `Goldman Sachs Fixed Income Research — European Credit Sector Views
25 April 2026 | Sarah Chen CFA

IDEA #2 — HIGH YIELD: BUY LUFTHANSA AG SENIOR 2028
ISIN: DE000A289XP1
Seniority: Senior Unsecured
Coupon: 4.750% fixed annual
Maturity: 24 February 2028 | Duration: 1.8 years
Rating: BB+ / Ba1 (S&P / Moody's) — ⚠️  HIGH YIELD / CROSSOVER
Issue size: EUR 750M
Current ASW: +195bps vs 3y EUR Mid-Swap | Price: 101.23

Recommendation: BUY — rising stars upgrade candidate (HIGH YIELD ELIGIBLE ONLY)

Lufthansa is our top crossover idea for 2026. S&P upgrade to BBB- expected
within 9-12 months. Strong FCF recovery EUR 2.8B, leverage 2.1x vs 3.4x peak.
Load factor 87% (pre-COVID record).

⚠️  IMPORTANT: HIGH YIELD instrument (BB+ rated).
Eligible ONLY for mandates with explicit HY/crossover allocation.
NOT suitable for investment grade-only mandates.`,
    ingested_at: "2026-04-25T14:22:00Z",
  },
];
