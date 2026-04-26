/**
 * Draft email & IC memo generators for Webi negotiation workflow.
 *
 * generateCounterOfferEmail — produces a realistic plain-text counter-proposal
 *   email from an AM to a bank sales desk.
 *
 * generateICNote — produces a formatted Investment Committee memorandum.
 */

import type { Product } from "@/types/product";
import type { AssetManagerProfile } from "@/types/assetManager";
import type { Recommendation } from "@/types/recommendation";
import type { NegoRec } from "@/lib/negotiation";

// ─── helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function randomInt(min: number, max: number): number {
  // deterministic-ish seed from Math.random (no crypto needed for email draft)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTime(): string {
  const h = randomInt(8, 17);
  const m = randomInt(0, 59);
  return `${pad2(h)}:${pad2(m)}`;
}

function random4Digits(): string {
  return randomInt(1000, 9999).toString();
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function tomorrowDate(): string {
  const d = new Date(2026, 3, 26); // today: 26 April 2026
  d.setDate(d.getDate() + 1);
  return fmtDate(d);
}

function todayStr(): string {
  return "25 April 2026";
}

function todayYYYYMMDD(): string {
  return "20260426";
}

/** Derive a sender address from the AM name. */
function amEmail(am: AssetManagerProfile): string {
  const local = am.name.toLowerCase().replace(/\s+/g, ".");
  return `${local}@carmignac.com`;
}

/** Extract the first plausible email from source_reference, or fall back to a
 *  bank-derived default. */
function bankEmail(p: Product): string {
  if (p.source_reference) {
    const match = p.source_reference.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    if (match) return match[0];
  }
  // derive issuer slug
  const slug = p.issuer
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
  return `sales@${slug}.com`;
}

/** Humanise a snake_case type string. */
function humanize(s: string | null | undefined): string {
  if (!s) return "Structured Product";
  return s.replace(/_/g, " ");
}

// ─── Counter-offer email ───────────────────────────────────────────────────────

export function generateCounterOfferEmail(
  p: Product,
  am: AssetManagerProfile,
  negoRecs: NegoRec[],
  netBps: number,
): string {
  const productName = p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`;
  const from = amEmail(am);
  const to = bankEmail(p);
  const date = `${todayStr()}, ${randomTime()} CET`;

  // Build adjustments block
  const adjustmentsLines: string[] = [];
  negoRecs.forEach((r, i) => {
    adjustmentsLines.push(`${i + 1}. ${r.param}: ${r.from} → ${r.to} (${r.costLabel})`);
    adjustmentsLines.push(`   Rationale: ${r.rationale}`);
    if (i < negoRecs.length - 1) adjustmentsLines.push("");
  });

  const netSign = netBps > 0 ? "+" : "";
  const netLine = `Net cost impact of requested adjustments: ${netSign}${netBps} bps`;

  const netComment =
    netBps > 0
      ? "We believe this pricing is achievable given current spread environment and your origination capacity."
      : netBps < 0
      ? "We acknowledge the cost to your desk and are prepared to discuss a compromise on timing."
      : "We consider these adjustments broadly cost-neutral and expect them to be straightforward to accommodate.";

  const aum = (am.aum_eur_m / 1000).toFixed(2);

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Date: ${date}`,
    `Subject: RE: ${productName} — Counter-proposal Carmignac Credit Fund A`,
    ``,
    `Dear ${p.issuer} Sales Team,`,
    ``,
    `Thank you for sending through the ${productName} proposal earlier today.`,
    ``,
    `We have reviewed it against our investment mandate (Carmignac Credit Fund A — EUR ${aum}B AUM, UCITS Article 8 SFDR) and find the credit story compelling. However, ${negoRecs.length} adjustment${negoRecs.length !== 1 ? "s" : ""} ${negoRecs.length !== 1 ? "are" : "is"} required before we can proceed to approval.`,
    ``,
    `REQUESTED ADJUSTMENTS`,
    `──────────────────────────────────────────────────`,
    ...adjustmentsLines,
    `──────────────────────────────────────────────────`,
    `${netLine}`,
    ``,
    netComment,
    ``,
    `Please confirm by EOD ${tomorrowDate()} whether these terms can be accommodated. We are ready to proceed to internal approval within 24h of confirmation.`,
    ``,
    `Best regards,`,
    ``,
    `${am.name}`,
    `Portfolio Manager — ${am.firm}`,
    `AUM EUR ${aum}B | UCITS Article 8 SFDR`,
    `Tel: +33 1 42 86 ${random4Digits()}`,
  ];

  return lines.join("\n");
}

// ─── IC Memorandum ─────────────────────────────────────────────────────────────

export function generateICNote(
  p: Product,
  am: AssetManagerProfile,
  rec: Recommendation,
  checks: Array<{ label: string; value: string; status: "pass" | "warn" | "fail" }>,
  fitReasons: string[],
  risks: string[],
  failChecks: string[],
  negoRecs: NegoRec[],
): string {
  const productName = p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`;
  const tenorStr = p.tenor_years != null ? `${p.tenor_years}` : "N/A";
  const couponStr =
    p.coupon != null ? `${(p.coupon * 100).toFixed(2)}` : "N/A";

  // Recommendation status
  let status: "APPROVE" | "CONDITIONAL" | "REJECT";
  if (rec.hard_fail) {
    status = "REJECT";
  } else if (negoRecs.some((r) => r.priority === "CRITICAL")) {
    status = "CONDITIONAL";
  } else {
    status = "APPROVE";
  }

  const passCount = checks.filter((c) => c.status === "pass").length;

  // Executive summary
  const execSummary = buildExecSummary(p, am, fitReasons, status);

  // Checks display
  const checksLines = checks.map((c) => {
    const icon = c.status === "pass" ? "✓" : c.status === "warn" ? "⚠" : "✗";
    return `  [${icon}] ${c.label}: ${c.value}`;
  });

  // Footer conditional
  let footerBlock = "";
  if (status === "CONDITIONAL") {
    footerBlock =
      `NEGOTIATION REQUIRED — ${negoRecs.length} adjustment${negoRecs.length !== 1 ? "s" : ""} to reach mandate compliance. See attached counter-proposal.`;
  } else if (status === "REJECT") {
    footerBlock =
      "MANDATE BREACH — Product violates hard constraints. Do not proceed.";
  }

  const docRef = `IC-${random4Digits()}-${todayYYYYMMDD()}`;

  const lines: string[] = [
    `INVESTMENT COMMITTEE MEMORANDUM`,
    `${am.firm} | ${todayStr()}`,
    `═══════════════════════════════════════════════════════════════════`,
    ``,
    `PRODUCT:     ${productName}`,
    `ISSUER:      ${p.issuer} | ${p.issuer_rating ?? "N/A"} (S&P)`,
    `STRUCTURE:   ${humanize(p.product_type)} | ${p.currency} | ${tenorStr}Y | ${couponStr}% p.a.`,
    `SENIORITY:   Senior Preferred (unsecured)`,
    `SOURCE:      ${p.source_reference ?? "N/A"}`,
    ``,
    `RECOMMENDATION:  ${status}`,
    `MATCH SCORE:     ${rec.score}/100  |  COMPLIANCE: ${passCount}/${checks.length}`,
    ``,
    `───────────────────────────────────────────────────────────────────`,
    `EXECUTIVE SUMMARY`,
    execSummary,
    ``,
    `───────────────────────────────────────────────────────────────────`,
    `KEY INVESTMENT RATIONALE`,
    ...fitReasons.map((r) => `  + ${r}`),
    ``,
    `───────────────────────────────────────────────────────────────────`,
    `RISK FACTORS`,
    ...risks.map((r) => `  ! ${r}`),
    ...failChecks.map((r) => `  BLOCKED: ${r}`),
    ``,
    `───────────────────────────────────────────────────────────────────`,
    `MANDATE COMPLIANCE SUMMARY`,
    ...checksLines,
    ``,
    `───────────────────────────────────────────────────────────────────`,
  ];

  if (footerBlock) {
    lines.push(footerBlock);
    lines.push(``);
  }

  lines.push(`PREPARED BY: ${am.name} | ${am.firm}`);
  lines.push(`DATE: ${todayStr()} | DOCUMENT REF: ${docRef}`);

  return lines.join("\n");
}

// ─── PDF export ────────────────────────────────────────────────────────────────

/**
 * Opens a styled print popup and triggers window.print() → browser PDF dialog.
 * No external library required — works everywhere.
 */
export function printICNote(
  icNoteText: string,
  productName: string,
  amFirm: string,
  recommendation: "APPROVE" | "CONDITIONAL" | "REJECT",
): void {
  const recColor =
    recommendation === "APPROVE"
      ? "#16a34a"
      : recommendation === "CONDITIONAL"
      ? "#d97706"
      : "#dc2626";

  const recBg =
    recommendation === "APPROVE"
      ? "#f0fdf4"
      : recommendation === "CONDITIONAL"
      ? "#fffbeb"
      : "#fef2f2";

  // Escape HTML special chars
  const escaped = icNoteText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight section headers
  const highlighted = escaped
    .replace(/^(═+)$/gm, `<span style="color:#888">$1</span>`)
    .replace(/^(─+)$/gm, `<span style="color:#ccc">$1</span>`)
    .replace(/^\s*(\[✓\].*)/gm, `<span style="color:#16a34a">$1</span>`)
    .replace(/^\s*(\[⚠\].*)/gm, `<span style="color:#d97706">$1</span>`)
    .replace(/^\s*(\[✗\].*)/gm, `<span style="color:#dc2626">$1</span>`)
    .replace(/^\s*(\+\s.+)/gm, `<span style="color:#15803d">$1</span>`)
    .replace(/^\s*(!\s.+)/gm, `<span style="color:#b45309">$1</span>`)
    .replace(/^\s*(BLOCKED:.+)/gm, `<span style="color:#dc2626">$1</span>`)
    .replace(
      /^(INVESTMENT COMMITTEE MEMORANDUM)$/gm,
      `<span style="font-size:15px;font-weight:700;letter-spacing:0.04em">$1</span>`,
    )
    .replace(
      /^(EXECUTIVE SUMMARY|KEY INVESTMENT RATIONALE|RISK FACTORS|MANDATE COMPLIANCE SUMMARY|RECOMMENDATION:.+|MATCH SCORE:.+)$/gm,
      `<strong>$1</strong>`,
    );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IC Note — ${productName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
    @page { size: A4; margin: 18mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 9.5pt;
      line-height: 1.75;
      color: #111;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 10px;
      border-bottom: 2px solid #111;
      margin-bottom: 16px;
    }
    .header-firm { font-size: 11pt; font-weight: 700; letter-spacing: 0.04em; }
    .header-sub { font-size: 8pt; color: #666; margin-top: 2px; }
    .rec-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: ${recColor};
      background: ${recBg};
      border: 1.5px solid ${recColor};
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
      font-size: 7.5pt;
      color: #999;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-firm">WEBI · ${amFirm.toUpperCase()}</div>
      <div class="header-sub">Investment Committee Document · Confidential</div>
    </div>
    <div class="rec-badge">${recommendation}</div>
  </div>
  <pre>${highlighted}</pre>
  <div class="footer">
    <span>WEBI — Structured Products Copilot</span>
    <span>Generated ${new Date().toLocaleString("en-GB")}</span>
  </div>
</body>
</html>`;

  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  // Give fonts time to load before printing
  setTimeout(() => {
    popup.print();
    popup.close();
  }, 600);
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function buildExecSummary(
  p: Product,
  am: AssetManagerProfile,
  fitReasons: string[],
  status: "APPROVE" | "CONDITIONAL" | "REJECT",
): string {
  const productName = p.product_name ?? `${p.issuer} ${humanize(p.product_type)}`;
  const couponStr =
    p.coupon != null ? ` offering a ${(p.coupon * 100).toFixed(2)}% coupon` : "";
  const issuerStr = p.issuer_rating ? ` (rated ${p.issuer_rating} by S&P)` : "";

  const opener = `The ${productName}${couponStr} issued by ${p.issuer}${issuerStr} has been reviewed against the ${am.firm} mandate.`;

  const middlePart =
    fitReasons.length > 0
      ? `The structure presents a compelling case: ${fitReasons.slice(0, 2).join("; ")}.`
      : `The product aligns with the ${am.strategy.replace(/_/g, " ")} strategy of the fund.`;

  const closingPart =
    status === "APPROVE"
      ? "The committee is invited to approve allocation subject to standard post-trade documentation."
      : status === "CONDITIONAL"
      ? "Conditional approval is recommended pending resolution of the identified mandate constraints via negotiation."
      : "The product fails hard mandate constraints and cannot be approved without structural changes.";

  return `  ${opener}\n  ${middlePart}\n  ${closingPart}`;
}
