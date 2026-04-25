import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT, W} from '../design/tokens';
import {TextReveal} from '../components/TextReveal';

/** Hook scene: 0–420 frames (14 s).
 *
 * Beat 1 (0–22):   clock badge fades in (sets the "Monday morning" frame)
 * Beat 2 (20–80):  punchy problem-first headline
 * Beat 3 (90–230): counter snaps to 237 — "structured-product offers"
 * Beat 4 (250–340): three pain pills: 6 channels · 14 issuers · before 9 AM
 * Beat 5 (390–420): gentle fade-out (Reveal handles the pivot, no closing line)
 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [390, 420], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fadeOut, padding: 120}}>
      <ClockBadge />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 32,
          textAlign: 'center',
        }}
      >
        {/* Headline — problem-first */}
        <TextReveal
          delay={20}
          duration={28}
          style={{
            fontSize: 76,
            fontWeight: W.bold,
            letterSpacing: -2,
            maxWidth: 1500,
            lineHeight: 1.08,
          }}
        >
          Every asset manager ranks 200+ offers a week —{' '}
          <span style={{color: C.accent}}>by hand</span>.
        </TextReveal>

        {/* Counter */}
        <Counter delay={90} target={237} />

        {/* Pain pills */}
        <div style={{display: 'flex', gap: 18, marginTop: 18}}>
          {['6 channels', '14 issuers', 'all before 9 AM'].map((t, i) => (
            <PainPill key={t} text={t} delay={250 + i * 14} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ClockBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 80,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        padding: '12px 22px',
        fontFamily: FONT.mono,
        fontSize: 18,
        color: C.textSecondary,
        letterSpacing: 1,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: C.success,
          boxShadow: `0 0 12px ${C.success}`,
        }}
      />
      MON · 08:47
    </div>
  );
};

const Counter: React.FC<{delay: number; target: number}> = ({delay, target}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const progress = spring({
    frame: t,
    fps,
    config: {damping: 22, mass: 0.8, stiffness: 100},
    durationInFrames: 50,
  });
  const opacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const value = Math.round(target * progress);
  return (
    <div
      style={{
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        marginTop: 16,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 220,
          fontWeight: W.bold,
          color: C.accent,
          lineHeight: 1,
          textShadow: `0 0 60px ${C.accentGlow}`,
          letterSpacing: -6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: W.medium,
          color: C.textSecondary,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        Structured-product offers · this week
      </div>
    </div>
  );
};

const PainPill: React.FC<{text: string; delay: number}> = ({text, delay}) => {
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
    config: {damping: 18, mass: 0.6, stiffness: 140},
    durationInFrames: 24,
  });
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - settle) * 24}px)`,
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: '14px 26px',
        borderRadius: 999,
        fontSize: 22,
        fontWeight: W.semibold,
        color: C.textPrimary,
      }}
    >
      {text}
    </div>
  );
};
