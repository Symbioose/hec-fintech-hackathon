import type { MarketView } from "@/types/marketView";

// Market views extracted from bank research — 25 April 2026.
// Reflects the PM's own conviction + sell-side consensus.

export const MARKET_VIEWS: MarketView[] = [
  {
    id: "MV-1",
    date: "2026-04-25",
    region: "Europe",
    asset_class: "credit",
    rates_view: "stable",
    equity_view: "neutral",
    volatility_view: "low",
    credit_spread_view: "tightening",
    text: "European bank senior spreads outperform YTD — constructif. iTraxx Main at 68bps (-2bps WoW). Basel IV delay + solid NII trajectory = further tightening potential. Overweight financials senior preferred.",
    author: "François Martin — PM view",
  },
  {
    id: "MV-2",
    date: "2026-04-25",
    region: "Europe",
    asset_class: "credit",
    rates_view: "down",
    equity_view: "neutral",
    volatility_view: "low",
    credit_spread_view: "stable",
    text: "Duration: rester court. Préférence < 3 ans — ECB on hold, courbe plate. SocGen 2027 (0.7y) + ING 2029 (2.9y) offrent le meilleur carry par unité de duration risque.",
    author: "François Martin — PM view",
  },
  {
    id: "MV-3",
    date: "2026-04-25",
    region: "Europe",
    asset_class: "credit",
    credit_spread_view: "widening",
    text: "Bearish énergie fossile. TotalEnergies -18bps YTD sur price pressure + sorties ESG Article 8. Oil $71/bbl (-8% MTD). Pas de catalyste de resserrement visible. Exclusion maintenue — ESG + vue fondamentale alignées.",
    author: "François Martin — PM view",
  },
  {
    id: "MV-4",
    date: "2026-04-25",
    region: "Europe",
    asset_class: "credit",
    rates_view: "stable",
    equity_view: "neutral",
    volatility_view: "medium",
    credit_spread_view: "stable",
    text: "Autos: neutre → upgrade watchlist. VW a widened 48bps YTD mais nouveau plan stratégique CEO + cost reduction EUR 5B. Bottom potentiel à BBB-. Duration 2.5y confortable. Conviction MEDIUM — patience requise.",
    author: "Goldman Sachs Credit Strategy",
  },
  {
    id: "MV-5",
    date: "2026-04-24",
    region: "Europe",
    asset_class: "rates",
    rates_view: "stable",
    credit_spread_view: "stable",
    text: "ECB minutes confirm rates on hold Q2. Eurozone PMI 52.4 (vs 51.1 expected). Bund 10y at 2.31%. Front-end stable — carry over duration justified for IG credit mandates.",
    author: "BNP CIB Macro Research",
  },
];
