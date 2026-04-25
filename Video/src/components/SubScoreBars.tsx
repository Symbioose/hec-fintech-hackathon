import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, W} from '../design/tokens';

interface Sub {
  label: string;
  value: number; // 0..1
}

interface Props {
  delay?: number;
  staggerPerBar?: number;
  bars?: Sub[];
  width?: number;
  barHeight?: number;
}

const DEFAULT_BARS: Sub[] = [
  {label: 'Semantic', value: 0.84},
  {label: 'Constraints', value: 1.0},
  {label: 'Yield fit', value: 0.7},
  {label: 'Exposure fit', value: 0.92},
  {label: 'Market fit', value: 0.6},
];

export const SubScoreBars: React.FC<Props> = ({
  delay = 0,
  staggerPerBar = 5,
  bars = DEFAULT_BARS,
  width = 520,
  barHeight = 12,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: FONT.sans,
      }}
    >
      {bars.map((b, i) => {
        const t = frame - (delay + i * staggerPerBar);
        const opacity = interpolate(t, [0, 14], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const fill = spring({
          frame: t,
          fps,
          config: {damping: 22, mass: 0.8, stiffness: 110},
          durationInFrames: 28,
        });
        const widthPct = `${b.value * fill * 100}%`;
        return (
          <div key={b.label} style={{opacity, width}}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 18,
                fontWeight: W.medium,
                color: C.textSecondary,
              }}
            >
              <span>{b.label}</span>
              <span
                style={{fontFamily: FONT.mono, color: C.textPrimary}}
              >{`${Math.round(b.value * fill * 100)}`}</span>
            </div>
            <div
              style={{
                height: barHeight,
                borderRadius: barHeight / 2,
                background: C.surfaceElev,
                overflow: 'hidden',
                boxShadow: `inset 0 0 0 1px ${C.border}`,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: widthPct,
                  background: `linear-gradient(90deg, ${C.accent}, ${C.accentSoft})`,
                  borderRadius: barHeight / 2,
                  boxShadow: `0 0 12px ${C.accentGlow}`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
