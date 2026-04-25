import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';

interface Bucket {
  label: string;
  count: number;
  isHigh: boolean;
}

interface Props {
  buckets?: Bucket[];
  delay?: number;
  height?: number;
}

const DEFAULT_BUCKETS: Bucket[] = [
  {label: '0–20', count: 1, isHigh: false},
  {label: '20–40', count: 3, isHigh: false},
  {label: '40–60', count: 5, isHigh: false},
  {label: '60–80', count: 8, isHigh: true},
  {label: '80–100', count: 5, isHigh: true},
];

export const LovableScoreHistogram: React.FC<Props> = ({
  buckets = DEFAULT_BUCKETS,
  delay = 0,
  height = 170,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(...buckets.map((b) => b.count));
  const yLabels = [0, Math.ceil(max / 2), max];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 10, height}}>
      <div style={{flex: 1, display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10}}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            justifyContent: 'space-between',
            paddingBottom: 18,
            paddingTop: 4,
          }}
        >
          {yLabels.map((y) => (
            <span
              key={y}
              style={{fontSize: 9, color: LV.textFaint, fontVariantNumeric: 'tabular-nums', textAlign: 'right'}}
            >
              {y}
            </span>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
            gap: 14,
            alignItems: 'end',
            paddingBottom: 18,
            borderLeft: `1px solid ${LV.border}`,
            borderBottom: `1px solid ${LV.border}`,
            paddingLeft: 8,
          }}
        >
          {[0.33, 0.66].map((p) => (
            <div
              key={p}
              style={{
                position: 'absolute',
                left: 8,
                right: 0,
                bottom: 18 + (height - 36) * p,
                height: 1,
                background: LV.border,
                opacity: 0.5,
              }}
            />
          ))}
          {buckets.map((b, i) => {
            const t = frame - (delay + i * 4);
            const grow = spring({
              frame: t,
              fps,
              config: {damping: 22, mass: 0.8, stiffness: 110},
              durationInFrames: 24,
            });
            const pct = (b.count / max) * grow;
            const opacity = interpolate(t, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const color = b.isHigh ? LV.primary : LV.textFaint;
            return (
              <div
                key={b.label}
                style={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  opacity,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: LV.textSecondary,
                    fontVariantNumeric: 'tabular-nums',
                    marginBottom: 4,
                    opacity: pct > 0.4 ? 1 : 0,
                  }}
                >
                  {Math.round(b.count * grow)}
                </span>
                <div
                  style={{
                    width: '70%',
                    maxWidth: 56,
                    height: `${pct * 100}%`,
                    minHeight: 2,
                    background: b.isHigh ? LV.gradientPrimary : color,
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    boxShadow: b.isHigh ? `0 0 18px ${LV.primary}55` : 'none',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    fontSize: 10,
                    color: LV.textMuted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
