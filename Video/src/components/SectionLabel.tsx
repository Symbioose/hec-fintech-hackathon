import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, W} from '../design/tokens';

interface Props {
  text: string;
  delay?: number;
  color?: string;
}

/** Small uppercase eyebrow label with an animated underline accent. */
export const SectionLabel: React.FC<Props> = ({
  text,
  delay = 0,
  color = C.accent,
}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  const lineWidth = interpolate(t, [0, 18], [0, 64], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{width: lineWidth, height: 2, background: color, borderRadius: 1}} />
      <span
        style={{
          fontSize: 22,
          fontWeight: W.semibold,
          color,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {text}
      </span>
    </div>
  );
};
