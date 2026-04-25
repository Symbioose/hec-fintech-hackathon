import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';

interface Axis {
  label: string;
  value: number; // 0..1 — the product's score on this axis
}

interface Props {
  axes?: Axis[];
  size?: number;
  delay?: number;
}

const DEFAULT_AXES: Axis[] = [
  {label: 'Constraints', value: 1.0},
  {label: 'Yield fit', value: 0.92},
  {label: 'Exposure fit', value: 0.84},
  {label: 'Market fit', value: 0.74},
  {label: 'Liquidity', value: 0.66},
];

const RINGS = [0.25, 0.5, 0.75, 1.0];

/**
 * Animated SVG radar chart — pentagon for 5 mandate-fit dimensions.
 * The dashed "mandate ideal" pentagon fades in first; then the
 * indigo-filled "this product" polygon morphs in spoke-by-spoke.
 *
 * Hero visualization for the Score scene. Frame budget:
 *  - 0–14:   ideal pentagon + axes fade in
 *  - 14–60:  product polygon morphs in (8f per spoke, 6f stagger)
 */
export const LovableRadar: React.FC<Props> = ({axes = DEFAULT_AXES, size = 380, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.35;
  const n = axes.length;

  const angle = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / n;

  const idealOpacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const idealPoints = axes
    .map((_, i) => {
      const a = angle(i);
      return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
    })
    .join(' ');

  // Product polygon — each axis interpolates 0 → value over 8 frames, 6f stagger
  const animatedPoints = axes.map((ax, i) => {
    const local = t - (14 + i * 6);
    const grow = spring({
      frame: local,
      fps,
      config: {damping: 22, mass: 0.8, stiffness: 110},
      durationInFrames: 18,
    });
    const v = ax.value * grow;
    const a = angle(i);
    return {x: cx + R * v * Math.cos(a), y: cy + R * v * Math.sin(a), v, animated: grow};
  });
  const productPoints = animatedPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const productOpacity = interpolate(t, [12, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Ring grid (gray) */}
      {RINGS.map((r, i) => {
        const ringOpacity = interpolate(t, [i * 2, 12 + i * 2], [0, 0.5], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const points = axes
          .map((_, axIdx) => {
            const a = angle(axIdx);
            return `${cx + R * r * Math.cos(a)},${cy + R * r * Math.sin(a)}`;
          })
          .join(' ');
        return (
          <polygon
            key={r}
            points={points}
            fill="none"
            stroke={LV.border}
            strokeWidth={1}
            opacity={ringOpacity}
          />
        );
      })}

      {/* Spokes */}
      {axes.map((_, i) => {
        const a = angle(i);
        const x2 = cx + R * Math.cos(a);
        const y2 = cy + R * Math.sin(a);
        const spokeOp = interpolate(t, [2 + i, 12 + i], [0, 0.4], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={LV.border}
            strokeWidth={1}
            opacity={spokeOp}
          />
        );
      })}

      {/* Ideal mandate (dashed) */}
      <polygon
        points={idealPoints}
        fill={LV.textMuted}
        fillOpacity={0.04}
        stroke={LV.textMuted}
        strokeWidth={1.2}
        strokeDasharray="4 3"
        opacity={idealOpacity * 0.85}
      />

      {/* Product polygon (animated) */}
      <polygon
        points={productPoints}
        fill={LV.primary}
        fillOpacity={0.32}
        stroke={LV.primary}
        strokeWidth={2.2}
        opacity={productOpacity}
        style={{filter: `drop-shadow(0 0 14px ${LV.primary}66)`}}
      />

      {/* Vertex dots */}
      {animatedPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.6}
          fill={LV.primaryGlow}
          opacity={p.animated * productOpacity}
        />
      ))}

      {/* Axis labels */}
      {axes.map((ax, i) => {
        const a = angle(i);
        const labelR = R + 30;
        const x = cx + labelR * Math.cos(a);
        const y = cy + labelR * Math.sin(a);
        const opacity = interpolate(t, [4 + i, 18 + i], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const dx = Math.abs(Math.cos(a)) < 0.15 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        const dy = Math.sin(a) > 0.4 ? '0.9em' : Math.sin(a) < -0.4 ? '0' : '0.35em';
        const score = Math.round(ax.value * 100);
        const scoreOp = interpolate(t, [22 + i * 6, 32 + i * 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <g key={ax.label} opacity={opacity}>
            <text
              x={x}
              y={y}
              textAnchor={dx as 'start' | 'middle' | 'end'}
              dy={dy}
              fontSize={11}
              fontWeight={600}
              fill={LV.textSecondary}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {ax.label}
            </text>
            <text
              x={x}
              y={y}
              textAnchor={dx as 'start' | 'middle' | 'end'}
              dy={Math.sin(a) > 0.4 ? '2.0em' : Math.sin(a) < -0.4 ? '-1.0em' : '1.4em'}
              fontSize={10}
              fontWeight={700}
              fill={LV.primary}
              fontFamily="ui-monospace, Menlo, monospace"
              opacity={scoreOp}
            >
              {score}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill={LV.textFaint} opacity={idealOpacity} />
    </svg>
  );
};
