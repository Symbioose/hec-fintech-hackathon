import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT, W} from '../design/tokens';
import {Logo} from '../components/Logo';
import {TextReveal} from '../components/TextReveal';

/** Reveal scene: 360 frames (12 s).
 *
 *   20:  logo zooms in
 *  100:  subtitle "An asset-manager copilot for buying structured products"
 *  180:  BIG tagline slam: "From inbox to investable. In one click."
 *  320+: gentle fade-out
 */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoSpring = spring({
    frame: frame - 20,
    fps,
    config: {damping: 14, mass: 0.7, stiffness: 110},
    durationInFrames: 30,
  });
  const logoOpacity = interpolate(frame, [20, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [320, 360], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        padding: 120,
        textAlign: 'center',
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${0.6 + logoSpring * 0.4})`,
        }}
      >
        <Logo size={160} />
      </div>

      {/* Subtitle */}
      {frame >= 100 && (
        <TextReveal
          delay={100}
          duration={24}
          style={{
            fontSize: 32,
            fontWeight: W.medium,
            color: C.textSecondary,
            letterSpacing: 0.5,
            maxWidth: 1200,
            lineHeight: 1.35,
          }}
        >
          An asset-manager copilot for buying structured products.
        </TextReveal>
      )}

      {/* Slam tagline */}
      {frame >= 180 && (
        <div style={{marginTop: 60}}>
          <SlamTagline delay={180} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const SlamTagline: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const opacity = interpolate(t, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slam = spring({
    frame: t,
    fps,
    config: {damping: 12, mass: 1, stiffness: 90},
    durationInFrames: 32,
  });
  const scale = 1.1 - slam * 0.1; // settle from 1.1 to 1.0

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        fontFamily: FONT.sans,
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: W.bold,
          letterSpacing: -3,
          lineHeight: 1.05,
          color: C.textPrimary,
        }}
      >
        From inbox to <span style={{color: C.accent}}>investable</span>.
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 56,
          fontWeight: W.semibold,
          color: C.textSecondary,
          letterSpacing: -1,
        }}
      >
        In one click.
      </div>
    </div>
  );
};
