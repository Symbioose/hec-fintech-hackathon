import {interpolate, useCurrentFrame} from 'remotion';
import {LV} from '../design/tokens';
import {LovableCard, LovableCardHeader} from './LovableCard';
import {LovableRadar} from './LovableRadar';
import {LovableProductTypeBadge} from './LovableProductTypeBadge';

interface Props {
  startFrame?: number;
}

const PRODUCT = {
  name: 'SocGen senior switch',
  issuer: 'Société Générale',
  type: 'autocallable',
  isin: 'XS2647183052',
  currency: 'EUR',
  tenor: '5y',
  coupon: '6.20%',
  barrier: '60%',
  rating: 'A',
  protection: 'No',
  score: 94,
};

const REASONS = [
  {kind: 'positive' as const, text: 'Issuer is allowed and preferred (banks).'},
  {kind: 'positive' as const, text: 'Yield clears the desk hurdle by 220 bps.'},
  {kind: 'positive' as const, text: 'Tenor sits inside the 5y mandate cap.'},
  {kind: 'info' as const, text: 'Aligns with the constructive-banks house view.'},
  {kind: 'warning' as const, text: 'Subordinated exposure trending warm.'},
];

const MARKET_VIEWS = [
  {state: 'aligned', title: 'Constructive on European banks', author: 'Credit desk'},
  {state: 'aligned', title: 'Add duration into 5y EUR', author: 'Macro desk'},
];

export const LovableProductDetail: React.FC<Props> = ({startFrame = 0}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;

  const headerOp = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerLift = interpolate(t, [0, 14], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{flex: 1, padding: '22px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* Breadcrumb / header */}
      <div style={{opacity: headerOp, transform: `translateY(${headerLift}px)`}}>
        <span
          style={{
            fontSize: 10,
            color: LV.textMuted,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Recommendations / {PRODUCT.issuer}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 6,
            gap: 14,
          }}
        >
          <div style={{display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0}}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.7,
                color: LV.textPrimary,
                whiteSpace: 'nowrap',
              }}
            >
              {PRODUCT.name}
            </h1>
            <LovableProductTypeBadge type={PRODUCT.type} size="md" />
            <span style={{fontSize: 12, color: LV.textMuted, fontFamily: 'ui-monospace, Menlo, monospace'}}>
              ISIN {PRODUCT.isin}
            </span>
          </div>
          <ScoreBadge score={PRODUCT.score} delay={startFrame + 12} />
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0}}>
        {/* Radar (hero) */}
        <LovableCard padding={18} style={{gap: 12, alignItems: 'center', justifyContent: 'flex-start'}}>
          <div style={{alignSelf: 'flex-start', width: '100%'}}>
            <LovableCardHeader
              title="Why it surfaced"
              subtitle="Mandate ideal vs. this product, scored across five dimensions."
              iconPath="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"
              iconColor={LV.primary}
            />
          </div>
          <div style={{display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <LovableRadar size={360} delay={startFrame + 16} />
          </div>
          <div style={{display: 'flex', gap: 16, fontSize: 11, color: LV.textMuted}}>
            <LegendDot color={LV.primary} label="This product" />
            <LegendDot color={LV.textMuted} label="Mandate ideal" dashed />
          </div>
        </LovableCard>

        {/* Reasons + JSON + Views */}
        <div style={{display: 'grid', gridTemplateRows: '1fr auto auto', gap: 14, minHeight: 0}}>
          <LovableCard padding={18} style={{gap: 12, minHeight: 0}}>
            <LovableCardHeader
              title="Pass reasons"
              subtitle="Explainable score: every accept/reject is justified."
              iconPath="M9 12l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              iconColor={LV.success}
            />
            <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
              {REASONS.map((r, i) => (
                <ReasonRow key={r.text} reason={r} delay={startFrame + 20 + i * 6} />
              ))}
            </div>
          </LovableCard>

          <LovableCard padding={16} style={{gap: 8}}>
            <LovableCardHeader
              title="Extracted facts"
              iconPath="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              iconColor={LV.accent}
            />
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4}}>
              <FactCell label="Currency" value={PRODUCT.currency} delay={startFrame + 26} />
              <FactCell label="Tenor" value={PRODUCT.tenor} delay={startFrame + 30} />
              <FactCell label="Coupon" value={PRODUCT.coupon} delay={startFrame + 34} accent={LV.success} />
              <FactCell label="Barrier" value={PRODUCT.barrier} delay={startFrame + 38} />
              <FactCell label="Rating" value={PRODUCT.rating} delay={startFrame + 42} accent={LV.success} />
              <FactCell label="Protection" value={PRODUCT.protection} delay={startFrame + 46} accent={LV.warning} />
              <FactCell label="Issuer" value="SG" delay={startFrame + 50} />
              <FactCell label="Region" value="EUR" delay={startFrame + 54} />
            </div>
          </LovableCard>

          <LovableCard padding={16} style={{gap: 8}}>
            <LovableCardHeader
              title="House view alignment"
              iconPath="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5"
              iconColor={LV.info}
            />
            <div style={{display: 'flex', gap: 8}}>
              {MARKET_VIEWS.map((mv, i) => (
                <ViewChip key={mv.title} title={mv.title} author={mv.author} delay={startFrame + 32 + i * 8} />
              ))}
            </div>
          </LovableCard>
        </div>
      </div>
    </div>
  );
};

const ScoreBadge: React.FC<{score: number; delay: number}> = ({score, delay}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const grow = interpolate(t, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const num = Math.round(score * grow);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '8px 14px',
        background: LV.primarySoft,
        border: `1px solid ${LV.primary}55`,
        borderRadius: 999,
        boxShadow: `0 0 24px ${LV.primary}33`,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: LV.primary,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        Score
      </span>
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: LV.primary,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          letterSpacing: -0.6,
        }}
      >
        {num}
      </span>
    </div>
  );
};

const ReasonRow: React.FC<{
  reason: {kind: 'positive' | 'warning' | 'info'; text: string};
  delay: number;
}> = ({reason, delay}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slide = interpolate(t, [0, 14], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const colors = {
    positive: {dot: LV.success, glyph: 'M5 13l4 4L19 7'},
    warning: {dot: LV.warning, glyph: 'M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z'},
    info: {dot: LV.info, glyph: 'M12 16v-4m0-4h.01'},
  } as const;
  const c = colors[reason.kind];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: LV.surface,
        border: `1px solid ${LV.border}`,
        borderLeft: `3px solid ${c.dot}`,
        borderRadius: 6,
        opacity,
        transform: `translateX(${slide}px)`,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth={2.4}>
        <path d={c.glyph} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{fontSize: 12, color: LV.textSecondary, lineHeight: 1.35}}>{reason.text}</span>
    </div>
  );
};

const FactCell: React.FC<{label: string; value: string; delay: number; accent?: string}> = ({
  label,
  value,
  delay,
  accent = LV.textPrimary,
}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        background: LV.surface,
        border: `1px solid ${LV.border}`,
        borderRadius: 6,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: LV.textMuted,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span style={{fontSize: 14, fontWeight: 600, color: accent, fontVariantNumeric: 'tabular-nums'}}>
        {value}
      </span>
    </div>
  );
};

const ViewChip: React.FC<{title: string; author: string; delay: number}> = ({title, author, delay}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        flex: 1,
        background: LV.surface,
        border: `1px solid ${LV.border}`,
        borderRadius: 8,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        opacity,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: LV.success,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            background: LV.successSoft,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          Aligned
        </span>
      </div>
      <span style={{fontSize: 12, color: LV.textPrimary, fontWeight: 600, lineHeight: 1.3}}>{title}</span>
      <span style={{fontSize: 10, color: LV.textMuted}}>— {author}</span>
    </div>
  );
};

const LegendDot: React.FC<{color: string; label: string; dashed?: boolean}> = ({color, label, dashed}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
    <div
      style={{
        width: 14,
        height: 2,
        background: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
          : color,
        borderRadius: 1,
      }}
    />
    <span>{label}</span>
  </div>
);
