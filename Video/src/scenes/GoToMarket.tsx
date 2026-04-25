import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, W} from '../design/tokens';
import {Logo} from '../components/Logo';
import {SectionLabel} from '../components/SectionLabel';
import {TextReveal} from '../components/TextReveal';

/** GoToMarket scene: 390 frames (13 s).
 *
 *  0– 50: eyebrow + headline (who it's for)
 *  50–230: three customer-segment cards (delays 50, 95, 140)
 * 230–390: closing slam — Logo + tagline
 */
export const GoToMarket: React.FC = () => {
  const frame = useCurrentFrame();
  const cardsOut = interpolate(frame, [200, 230], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const showClose = frame >= 230;

  return (
    <AbsoluteFill style={{padding: 120}}>
      {/* Customer segments */}
      <AbsoluteFill
        style={{
          padding: 120,
          opacity: cardsOut,
          display: 'flex',
          flexDirection: 'column',
          gap: 60,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
          <SectionLabel text="Who it's for" delay={2} />
          <TextReveal
            delay={12}
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
            Built today, for desks that buy <span style={{color: C.accent}}>tomorrow morning</span>.
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
          <Segment
            delay={50}
            title="Asset managers"
            metric="€50B+ AUM"
            line="Multi-mandate desks running yield-enhancement, defensive-income, ESG income side-by-side."
          />
          <Segment
            delay={95}
            title="Private banks"
            metric="UHNW desks"
            line="Coverage teams who need a justified ranking they can show a client in 60 seconds."
          />
          <Segment
            delay={140}
            title="Family offices"
            metric="Single-mandate"
            line="One mandate, one inbox, no patience for sales noise. Backend says yes, the team executes."
          />
        </div>
      </AbsoluteFill>

      {/* Closing slam */}
      {showClose && <Closing />}
    </AbsoluteFill>
  );
};

const Segment: React.FC<{
  delay: number;
  title: string;
  metric: string;
  line: string;
}> = ({delay, title, metric, line}) => {
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
    config: {damping: 18, mass: 0.7, stiffness: 110},
    durationInFrames: 28,
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - settle) * 28}px)`,
        height: 380,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 100% 0%, ${C.accentGlow} 0%, transparent 45%)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 14,
          letterSpacing: 4,
          color: C.accent,
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        {metric}
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: W.bold,
          color: C.textPrimary,
          letterSpacing: -1,
          lineHeight: 1.05,
          zIndex: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 21,
          color: C.textSecondary,
          lineHeight: 1.5,
          marginTop: 'auto',
          zIndex: 1,
        }}
      >
        {line}
      </div>
    </div>
  );
};

const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - 230;
  const settle = spring({
    frame: t,
    fps,
    config: {damping: 14, mass: 0.8, stiffness: 90},
    durationInFrames: 32,
  });
  const opacity = interpolate(t, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tagOpacity = interpolate(t, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 36,
        padding: 120,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${0.85 + settle * 0.15})`,
        }}
      >
        <Logo size={200} />
      </div>
      <div style={{opacity: tagOpacity, textAlign: 'center'}}>
        <div
          style={{
            fontSize: 48,
            fontWeight: W.bold,
            letterSpacing: -1,
            color: C.textPrimary,
            lineHeight: 1.15,
          }}
        >
          From inbox to <span style={{color: C.accent}}>investable</span>.
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            fontWeight: W.medium,
            color: C.textMuted,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Try the demo · structuredmatch.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};
