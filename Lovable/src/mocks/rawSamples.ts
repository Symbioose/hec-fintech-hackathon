// Real bank research messages used to simulate inbox ingestion.
// Sources: BNP CIB Weekly, Goldman Credit Views, SocGen Morning Note,
//          Citi RV Matrix, SocGen Sales Call — all dated 25 April 2026.

export interface RawSample {
  id: string;
  label: string;
  source_type: "email" | "chat" | "pdf" | "call";
  source_reference: string;
  raw_text: string;
}

export const RAW_SAMPLES: RawSample[] = [
  {
    id: "S-BNP",
    label: "Email — BNP CIB Credit Weekly",
    source_type: "email",
    source_reference: "jean-charles.dupont@bnpparibas.com",
    raw_text: `From: jean-charles.dupont@bnpparibas.com
To: francois.martin@carmignac.com
Date: 25 Apr 2026, 09:14 CET
Subject: BNP Paribas CIB — European Credit Weekly 25 April 2026

Dear François,

Please find our weekly European credit trade ideas below.

IDEA #1 — BUY BNP PARIBAS SA SENIOR PREFERRED 2028
ISIN: FR0013421286 | Coupon: 3.125% | Maturity: 15 Mar 2028 | Rating: BBB+
ASW: +91bps | Duration: 1.9Y | Price: 100.42
Rec: BUY — target +78bps. High conviction. Q1 earnings catalyst April 29.

IDEA #2 — BUY TOTALENERGIES SE SENIOR UNSECURED 2028
ISIN: FR0013424977 | Coupon: 2.875% | Maturity: 22 Jun 2028 | Rating: A-
ASW: +95bps | Duration: 2.2Y | Price: 99.18
⚠️ NOTE: On ESG exclusion lists for Article 8 UCITS funds — verify mandate.

IDEA #3 — UNDERWEIGHT ORANGE SA SENIOR 2029
ISIN: FR0013512366 | Coupon: 3.500% | Maturity: 18 Sep 2029 | Rating: BBB+
ASW: +78bps | Duration: 3.4Y
Rec: UNDERWEIGHT — screens expensive vs telecom peers.

IDEA #4 — BUY GLENCORE PLC SENIOR UNSECURED 2030
ISIN: XS2234567891 | Coupon: 4.125% | Maturity: 14 May 2030 | Rating: BBB
ASW: +118bps | Duration: 4.1Y | Price: 98.76
⚠️ NOTE: ESG restricted — thermal coal exposure. Check mandate eligibility.

Best regards,
Jean-Charles Dupont, CFA — BNP Paribas CIB Fixed Income Research, Paris`,
  },
  {
    id: "S-GS",
    label: "Email — Goldman Sachs European Credit",
    source_type: "email",
    source_reference: "sarah.chen@gs.com",
    raw_text: `From: sarah.chen@gs.com
To: francois.martin@carmignac.com
Date: 25 Apr 2026, 08:30 CET
Subject: GS European Credit Sector Views — April Update

Dear François,

Our European credit sector allocation and trade ideas for this week:

OVERWEIGHT: Financials (banks senior), Healthcare, Utilities
UNDERWEIGHT: Energy, Real Estate

IDEA #1 — BUY ING GROEP NV SENIOR PREFERRED 2029
ISIN: XS2198765432 | Coupon: 3.375% | Maturity: 27 Mar 2029 | Rating: A-
ASW: +82bps | Duration: 2.9Y | Price: 100.87
Rec: BUY — high quality carry. 9bps cheap vs SocGen. Q1 beat.
No ESG concerns. No subordination risk. Conviction: HIGH.

IDEA #2 — HIGH YIELD BUY LUFTHANSA AG SENIOR 2028
ISIN: DE000A289XP1 | Coupon: 4.750% | Maturity: 24 Feb 2028 | Rating: BB+
ASW: +195bps | Duration: 1.8Y | Price: 101.23
⚠️ HIGH YIELD ONLY — BB+ rated. NOT for IG-only mandates.
Rising stars candidate — BBB- upgrade expected H2 2026.

IDEA #3 — BUY VOLKSWAGEN AG SENIOR 2028
ISIN: DE000A3H3FE6 | Coupon: 3.250% | Maturity: 19 Oct 2028 | Rating: BBB-
ASW: +142bps | Duration: 2.5Y | Price: 98.34
Rec: BUY — distressed value. Target +115bps. Stop at +160bps. Conviction: MEDIUM.

Sarah Chen, CFA — Goldman Sachs Fixed Income Research, London`,
  },
  {
    id: "S-SGN",
    label: "Email — SocGen Morning Note",
    source_type: "email",
    source_reference: "thomas.gautier@sgcib.com",
    raw_text: `From: thomas.gautier@sgcib.com
To: francois.martin@carmignac.com
Date: 25 Apr 2026, 08:15 CET
Subject: SocGen CIB — European Credit Morning Note 25 April 2026

Bonjour François,

Nos idées du matin :

IDEA #1 — BUY SOCIÉTÉ GÉNÉRALE SA SENIOR PREFERRED 2027
ISIN: FR0014003J41 | Coupon: 3.750% | Maturity: 08 Jan 2027 | Rating: BBB
ASW: +88bps | Duration: 0.7Y | Price: 101.34
Rec: BUY — short duration carry. Target +76bps. CET1 13.6%. ESG clean.

IDEA #2 — PASS DEUTSCHE BANK AG TIER 2 SUB 2030 (SUB ELIGIBLE ONLY)
ISIN: DE000DB7WGP3 | Coupon: 4.500% | Maturity: 12 Feb 2030 | Rating: BBB- sub
ASW: +162bps | Duration: 3.8Y
⚠️ SUBORDINATED — Tier 2 regulatory capital. Senior-only mandates: NOT ELIGIBLE.

IDEA #3 — BUY ING GROEP NV SENIOR PREFERRED 2028
ISIN: XS2198123456 | Coupon: 3.250% | Maturity: 15 Oct 2028 | Rating: A-
ASW: +79bps | Duration: 2.5Y | Price: 101.12
Rec: BUY — quality carry. No ESG issues. Conviction: HIGH.

Thomas Gautier — SocGen CIB Fixed Income Sales, Paris`,
  },
  {
    id: "S-CITI-CSV",
    label: "PDF — Citi Relative Value Matrix",
    source_type: "pdf",
    source_reference: "Citi EUR Credit RV Matrix 25 Apr 2026",
    raw_text: `CITIGROUP GLOBAL MARKETS — EUROPEAN CREDIT RELATIVE VALUE MATRIX
Date: April 25 2026 | Maximilian Weber / Ana Rodrigues | EUR IG Credit Sales

ISSUER                  ISIN            SENIORITY         COUPON  MAT      DUR   RATING  ASW    REC
BNP Paribas SA          FR0013421286    Senior Preferred  3.125%  15/3/28  1.9y  BBB+    +91    BUY
Société Générale SA     FR0014003J41    Senior Preferred  3.750%  8/1/27   0.7y  BBB     +88    BUY
ING Groep NV            XS2198765432    Senior Preferred  3.375%  27/3/29  2.9y  A-      +82    BUY
Deutsche Bank AG        DE000DB7WGP3    Tier 2 SUB        4.500%  12/2/30  3.8y  BBB-sub +162   BUY (SUB ONLY)
TotalEnergies SE        FR0013424977    Senior Unsecured  2.875%  22/6/28  2.2y  A-      +95    BUY (NON-ESG ONLY)
Glencore PLC            XS2234567891    Senior Unsecured  4.125%  14/5/30  4.1y  BBB     +118   BUY (NON-ESG ONLY)
Volkswagen AG           DE000A3H3FE6    Senior Unsecured  3.250%  19/10/28 2.5y  BBB-    +142   BUY
Lufthansa AG            DE000A289XP1    Senior Unsecured  4.750%  24/2/28  1.8y  BB+     +195   BUY (HY ONLY)

Portfolio note for EUR IG Article 8 mandate:
ELIGIBLE: BNP 2028 / SocGen 2027 / ING 2029 / VW 2028
EXCLUDED (ESG): TotalEnergies / Glencore (fossil fuels)
EXCLUDED (Seniority): Deutsche Bank Tier2
EXCLUDED (Rating): Lufthansa (BB+, High Yield)`,
  },
  {
    id: "S-SGN-CALL",
    label: "Call — SocGen Sales ING pitch",
    source_type: "call",
    source_reference: "SocGen Sales Call Transcript 09:31 CET 25/04/26",
    raw_text: `[Transcription — SocGen CIB | 25 avril 2026 09:31 CET]
Thomas Gautier (SocGen Fixed Income Sales):
François, bonjour. ING senior preferred 2029, XS2198765432, +82bps contre
le swap 4 ans. Cheap vs BNP même maturité à +91bps — ING noté A- contre BBB+
pour BNP, le différentiel de 9bps est difficile à justifier.
Q1 solides : NIM +12bps, CET1 15.2%. Target +70bps, stop +92bps.
Clean ESG, senior preferred, aucune subordination, taille EUR 1bn.
Prix 100.87. Duration 2.9 ans.

François Martin (Carmignac): Envoie la note écrite, je regarde.
Thomas: Dans la seconde. Aussi sur VW — ils ont touché le fond selon nous.
François: VW je suis déjà dessus, merci Thomas.`,
  },
];
