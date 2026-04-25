import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  iconPath: string;
  delay?: number;
  accent?: string;
  /** If value is a number, animate counter from 0 → value. */
  countTo?: number;
}

export const LovableStatCard: React.FC<Props> = ({
  label,
  value,
  hint,
  iconPath,
  delay = 0,
  accent = LV.primary,
  countTo,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - delay;
  const enter = spring({frame: t, fps, config: {damping: 22, mass: 0.8, stiffness: 100}, durationInFrames: 24});
  const opacity = interpolate(t, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lift = (1 - enter) * 16;
  const display = countTo != null ? Math.round(countTo * enter).toString() : String(value);

  return (
    <div
      style={{
        background: LV.card,
        border: `1px solid ${LV.border}`,
        borderRadius: LV.radius,
        boxShadow: LV.shadowCard,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: 11, fontWeight: 500, color: LV.textMuted, letterSpacing: 0.1}}>{label}</span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `${accent}26`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d={iconPath} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <span
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: LV.textPrimary,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: -0.6,
          lineHeight: 1,
        }}
      >
        {display}
      </span>
      {hint ? <span style={{fontSize: 11, color: LV.textFaint, lineHeight: 1.3}}>{hint}</span> : null}
    </div>
  );
};
