import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, W} from '../design/tokens';
import {SectionLabel} from '../components/SectionLabel';
import {TextReveal} from '../components/TextReveal';

/** Differentiators scene: 360 frames (12 s).
 *
 *  0– 60: eyebrow + headline
 *  60–230: three pillar cards staggered in (delays 60, 110, 160)
 * 230–330: hold all visible
 * 330–360: fade-out
 */
export const Differentiators: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [330, 360], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 70,
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <SectionLabel text="Why it works" delay={2} />
        <TextReveal
          delay={14}
          duration={22}
          style={{
            fontSize: 64,
            fontWeight: W.bold,
            letterSpacing: -2,
            textAlign: 'center',
            maxWidth: 1500,
            lineHeight: 1.1,
          }}
        >
          Three reasons it <span style={{color: C.accent}}>actually works</span> in production.
        </TextReveal>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 32,
          flex: 1,
          alignItems: 'center',
        }}
      >
        <Pillar
          delay={60}
          accent={C.success}
          number="01"
          title="Mandate-aware"
          body="Currency, tenor, rating, ESG, exclusions — every screen happens before scoring. No noise reaches your inbox."
          tag="6 hard filters"
        />
        <Pillar
          delay={110}
          accent={C.electric}
          number="02"
          title="100% explainable"
          body="Every score breaks into five sub-scores plus rationale bullets — positive factors, risks, blockers. No black box."
          tag="audit-ready"
        />
        <Pillar
          delay={160}
          accent={C.accent}
          number="03"
          title="Plugged in"
          body="Gmail, Outlook, Bloomberg chat, term-sheet PDFs, call transcripts — one ingestion path covers them all."
          tag="6 channels day one"
        />
      </div>
    </AbsoluteFill>
  );
};

const Pillar: React.FC<{
  delay: number;
  accent: string;
  number: string;
  title: string;
  body: string;
  tag: string;
}> = ({delay, accent, number, title, body, tag}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = spring({
    frame: t,
    fps,
    config: {damping: 18, mass: 0.7, stiffness: 100},
    durationInFrames: 30,
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - settle) * 32}px)`,
        height: 480,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 18,
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        boxShadow: `0 30px 60px rgba(0, 0, 0, 0.35)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 24,
            fontWeight: W.semibold,
            color: accent,
            letterSpacing: 4,
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 13,
            color: C.textMuted,
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            padding: '6px 14px',
            letterSpacing: 1,
          }}
        >
          {tag}
        </span>
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: W.bold,
          color: C.textPrimary,
          letterSpacing: -1,
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: W.regular,
          color: C.textSecondary,
          lineHeight: 1.5,
          marginTop: 'auto',
        }}
      >
        {body}
      </div>
    </div>
  );
};
