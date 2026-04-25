import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  style?: React.CSSProperties;
}

/** Fade + rise + spring-settle text reveal. */
export const TextReveal: React.FC<Props> = ({
  children,
  delay = 0,
  duration = 24,
  yOffset = 28,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;

  const opacity = interpolate(t, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const settle = spring({
    frame: t,
    fps,
    config: {damping: 18, mass: 0.6, stiffness: 120},
    durationInFrames: duration,
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - settle) * yOffset}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
