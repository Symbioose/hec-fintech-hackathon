import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, W} from '../design/tokens';
import {SectionLabel} from '../components/SectionLabel';
import {SubScoreBars} from '../components/SubScoreBars';
import {TextReveal} from '../components/TextReveal';

/** HowItWorks scene: 630 frames (21 s).
 *
 *  0– 60: Intro — eyebrow + headline
 *  60–156: Stage 1 — INGEST  (3.2 s)
 * 150–246: Stage 2 — EXTRACT (3.2 s)
 * 240–336: Stage 3 — MATCH   (3.2 s)
 * 330–486: Stage 4 — SCORE   (5.2 s, keystone)
 * 480–576: Stage 5 — EXPLAIN (3.2 s)
 * 576–630: outro
 */
export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{padding: 120}}>
      <Intro hide={frame >= 66} />
      <Stage start={60} end={156}>
        <Ingest />
      </Stage>
      <Stage start={150} end={246}>
        <Extract />
      </Stage>
      <Stage start={240} end={336}>
        <Match />
      </Stage>
      <Stage start={330} end={486}>
        <Score />
      </Stage>
      <Stage start={480} end={576}>
        <Explain />
      </Stage>
    </AbsoluteFill>
  );
};

const Stage: React.FC<{start: number; end: number; children: React.ReactNode}> = ({
  start,
  end,
  children,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [start, start + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [end - 14, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frame < start - 5 || frame > end + 5) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn * fadeOut,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Intro: React.FC<{hide: boolean}> = ({hide}) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [50, 66], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (hide && fadeOut === 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        padding: 120,
        textAlign: 'center',
      }}
    >
      <SectionLabel text="How it works" delay={2} />
      <TextReveal
        delay={14}
        duration={22}
        style={{
          fontSize: 88,
          fontWeight: W.bold,
          letterSpacing: -2,
          lineHeight: 1.05,
          maxWidth: 1300,
        }}
      >
        Five stages. <span style={{color: C.accent}}>One copilot.</span>
      </TextReveal>
    </AbsoluteFill>
  );
};

// ---------------- shared building blocks ----------------------------------

const StageHeader: React.FC<{number: string; name: string; tagline: string; color?: string}> = ({
  number,
  name,
  tagline,
  color = C.accent,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 18,
        fontFamily: FONT.mono,
        color,
      }}
    >
      <span style={{fontSize: 32, fontWeight: W.medium, letterSpacing: 4}}>{number}</span>
      <span style={{fontSize: 32, fontWeight: W.bold, letterSpacing: 6}}>{name}</span>
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: W.semibold,
        color: C.textPrimary,
        textAlign: 'center',
        maxWidth: 1100,
        lineHeight: 1.3,
      }}
    >
      {tagline}
    </div>
  </div>
);

const ChannelChip: React.FC<{label: string; accent?: string; delay: number}> = ({
  label,
  accent = C.info,
  delay,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = spring({
    frame: t,
    fps,
    config: {damping: 18, mass: 0.6, stiffness: 130},
    durationInFrames: 22,
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - settle) * 14}px)`,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${accent}`,
        padding: '14px 22px',
        borderRadius: 12,
        fontSize: 22,
        fontWeight: W.semibold,
        color: C.textPrimary,
        minWidth: 220,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: accent,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
      {label}
    </div>
  );
};

// ---------------- Stage 1: Ingest -----------------------------------------

const Ingest: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 64,
    }}
  >
    <StageHeader
      number="01"
      name="INGEST"
      tagline="Your inbox isn't a queue. → Six channels, one stream."
      color={C.info}
    />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, auto)',
        gap: 18,
        fontFamily: FONT.sans,
      }}
    >
      <ChannelChip label="Gmail" accent={C.blocker} delay={20} />
      <ChannelChip label="Outlook" accent={C.info} delay={26} />
      <ChannelChip label="Bloomberg chat" accent={C.warning} delay={32} />
      <ChannelChip label="Term-sheet PDFs" accent={C.electric} delay={38} />
      <ChannelChip label="Whisper transcripts" accent={C.success} delay={44} />
      <ChannelChip label="Manual uploads" accent={C.accent} delay={50} />
    </div>
  </div>
);

// ---------------- Stage 2: Extract ----------------------------------------

const Extract: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const arrowGrow = spring({
    frame: frame - 24,
    fps,
    config: {damping: 22, mass: 0.6, stiffness: 90},
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 48,
      }}
    >
      <StageHeader
        number="02"
        name="EXTRACT"
        tagline="Stop re-typing term sheets. → Validated JSON in 200 ms."
        color={C.electric}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          fontFamily: FONT.sans,
        }}
      >
        <RawEmailCard />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            transform: `scaleX(${arrowGrow})`,
            transformOrigin: 'left center',
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              color: C.electric,
              letterSpacing: 2,
            }}
          >
            GEMINI
          </div>
          <div
            style={{
              width: 80,
              height: 4,
              background: `linear-gradient(90deg, ${C.electric}, ${C.accent})`,
              borderRadius: 999,
              boxShadow: `0 0 12px ${C.electric}`,
            }}
          />
        </div>
        <JsonCard />
      </div>
    </div>
  );
};

const RawEmailCard: React.FC = () => (
  <div
    style={{
      width: 480,
      padding: 28,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      fontFamily: FONT.mono,
      fontSize: 13,
      lineHeight: 1.7,
      color: C.textMuted,
    }}
  >
    <div style={{color: C.textSecondary, marginBottom: 8, fontFamily: FONT.sans, fontSize: 14}}>
      ✉ helios.sales@bank · Mon 08:47
    </div>
    <div>EUR 5Y Autocall on EuroStoxx 50</div>
    <div>6.20% conditional cpn, qtrly trigger 100%</div>
    <div>60% European barrier, no protection</div>
    <div>Issuer A-rated. Notional ≥ EUR 1m.</div>
    <div style={{marginTop: 10, color: C.textFaint}}>—— —— —— ——</div>
  </div>
);

const JsonCard: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = [
    {k: 'issuer', v: '"Bank Helios"'},
    {k: 'product_type', v: '"autocallable"'},
    {k: 'currency', v: '"EUR"'},
    {k: 'tenor_years', v: '5'},
    {k: 'coupon', v: '0.062'},
    {k: 'barrier', v: '0.60'},
    {k: 'capital_protection', v: 'false'},
    {k: 'issuer_rating', v: '"A"'},
  ];
  return (
    <div
      style={{
        width: 460,
        padding: 28,
        background: C.surface,
        border: `1px solid ${C.electric}`,
        borderRadius: 14,
        fontFamily: FONT.mono,
        fontSize: 16,
        lineHeight: 1.7,
        color: C.textPrimary,
        boxShadow: `0 0 30px rgba(167, 139, 250, 0.18)`,
      }}
    >
      <div style={{color: C.textMuted, fontSize: 13, marginBottom: 8}}>{`{`}</div>
      {lines.map((line, i) => {
        const t = frame - (40 + i * 4);
        const opacity = interpolate(t, [0, 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div key={line.k} style={{opacity, paddingLeft: 18, display: 'flex', gap: 8}}>
            <span style={{color: C.info}}>{`"${line.k}"`}</span>
            <span style={{color: C.textMuted}}>:</span>
            <span style={{color: C.success}}>{line.v}</span>
            <span style={{color: C.textMuted}}>,</span>
          </div>
        );
      })}
      <div style={{color: C.textMuted, fontSize: 13, marginTop: 8}}>{`}`}</div>
    </div>
  );
};

// ---------------- Stage 3: Match ------------------------------------------

const Match: React.FC = () => {
  const checks = [
    {label: 'Currency in mandate', detail: 'EUR ✓ EUR', ok: true},
    {label: 'Tenor under cap', detail: '5y ≤ 6y', ok: true},
    {label: 'Issuer rating', detail: 'A ≥ A-', ok: true},
    {label: 'Capital protection', detail: 'required, missing', ok: false},
    {label: 'Underlying type allowed', detail: 'equity_index', ok: true},
    {label: 'No forbidden underlyings', detail: 'EuroStoxx 50', ok: true},
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 48,
      }}
    >
      <StageHeader
        number="03"
        name="MATCH"
        tagline="Skip the manual mandate checks. → Six filters, every offer."
        color={C.success}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          width: 1100,
          fontFamily: FONT.sans,
        }}
      >
        {checks.map((c, i) => (
          <CheckRow key={c.label} {...c} delay={20 + i * 9} />
        ))}
      </div>
    </div>
  );
};

const CheckRow: React.FC<{
  label: string;
  detail: string;
  ok: boolean;
  delay: number;
}> = ({label, detail, ok, delay}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slide = interpolate(t, [0, 22], [-16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slide}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 22px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${ok ? C.success : C.blocker}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: ok ? C.success : C.blocker,
          color: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: W.bold,
          fontSize: 22,
          fontFamily: FONT.mono,
        }}
      >
        {ok ? '✓' : '✗'}
      </div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{fontSize: 19, fontWeight: W.semibold, color: C.textPrimary}}>{label}</div>
        <div style={{fontSize: 15, color: C.textMuted, fontFamily: FONT.mono}}>{detail}</div>
      </div>
    </div>
  );
};

// ---------------- Stage 4: Score ------------------------------------------

const Score: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - 30;
  const progress = spring({
    frame: t,
    fps,
    config: {damping: 22, mass: 1, stiffness: 90},
    durationInFrames: 50,
  });
  const final = Math.round(86 * progress);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 50,
      }}
    >
      <StageHeader
        number="04"
        name="SCORE"
        tagline="Gut-feel ranking doesn't scale. → 0–100, five sub-scores."
        color={C.accent}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 90,
          fontFamily: FONT.sans,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 240,
              fontWeight: W.bold,
              color: C.accent,
              letterSpacing: -8,
              lineHeight: 1,
              textShadow: `0 0 60px ${C.accentGlow}`,
            }}
          >
            {final}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: W.medium,
              color: C.textSecondary,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            Final score
          </div>
        </div>
        <SubScoreBars
          delay={20}
          staggerPerBar={6}
          width={520}
          bars={[
            {label: 'Semantic', value: 0.82},
            {label: 'Constraints', value: 1.0},
            {label: 'Yield fit', value: 0.92},
            {label: 'Exposure fit', value: 0.92},
            {label: 'Market fit', value: 0.6},
          ]}
        />
      </div>
    </div>
  );
};

// ---------------- Stage 5: Explain ----------------------------------------

const Explain: React.FC = () => {
  const bullets = [
    {kind: 'positive' as const, text: 'Bank Helios is a preferred issuer for this mandate.'},
    {kind: 'positive' as const, text: 'Coupon of 6.20% meets target yield of 5.00%.'},
    {
      kind: 'warning' as const,
      text: 'Barrier at 60% is more aggressive than mandate floor (70%).',
    },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 48,
      }}
    >
      <StageHeader
        number="05"
        name="EXPLAIN"
        tagline="'Trust me' isn't an audit trail. → Every score explained."
        color={C.warning}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          width: 1100,
          fontFamily: FONT.sans,
        }}
      >
        {bullets.map((b, i) => (
          <RationaleBullet key={i} {...b} delay={20 + i * 14} />
        ))}
      </div>
    </div>
  );
};

const RationaleBullet: React.FC<{
  kind: 'positive' | 'warning' | 'blocker';
  text: string;
  delay: number;
}> = ({kind, text, delay}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slide = interpolate(t, [0, 24], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const palette = {
    positive: {accent: C.success, glyph: '✓'},
    warning: {accent: C.warning, glyph: '!'},
    blocker: {accent: C.blocker, glyph: '✗'},
  }[kind];
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slide}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '22px 28px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${palette.accent}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: palette.accent,
          color: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: W.bold,
          fontSize: 24,
          fontFamily: FONT.mono,
        }}
      >
        {palette.glyph}
      </div>
      <div style={{fontSize: 24, fontWeight: W.medium, color: C.textPrimary}}>{text}</div>
    </div>
  );
};
