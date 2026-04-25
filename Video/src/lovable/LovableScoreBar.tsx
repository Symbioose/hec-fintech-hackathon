import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';

interface Props {
  value: number;
  delay?: number;
  showValue?: boolean;
  width?: number | string;
  height?: number;
}

const colorFor = (score: number) => {
  if (score >= 70) return LV.scoreHigh;
  if (score >= 50) return LV.scoreMed;
  return LV.scoreLow;
};

export const LovableScoreBar: React.FC<Props> = ({
  value,
  delay = 0,
  showValue = true,
  width = '100%',
  height = 6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const fill = spring({frame: t, fps, config: {damping: 22, mass: 0.8, stiffness: 110}, durationInFrames: 24});
  const num = Math.round(value * fill);
  const color = colorFor(value);
  const opacity = interpolate(t, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity, width}}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: height,
          background: LV.surfaceMuted,
          overflow: 'hidden',
          border: `1px solid ${LV.border}`,
        }}
      >
        <div
          style={{
            width: `${Math.min(100, (value * fill) / 100 * 100)}%`,
            height: '100%',
            background: color,
            borderRadius: height,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      {showValue ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color,
            minWidth: 22,
            textAlign: 'right',
          }}
        >
          {num}
        </span>
      ) : null}
    </div>
  );
};
