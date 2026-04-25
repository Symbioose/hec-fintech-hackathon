import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, W} from '../design/tokens';

/** BeforeAfter scene: 180 frames (6 s).
 *
 * Crystallises the value prop with a side-by-side BEFORE/AFTER snapshot.
 *
 *  0–24: section labels + vertical divider
 * 24–96: 5 BEFORE rows slide in from the left, staggered
 * 60–132: 5 AFTER rows slide in from the right, staggered (overlaps for energy)
 * 132–156: closing tagline
 * 156–180: gentle fade-out
 */
export const BeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [156, 180], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        padding: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 120,
          width: '100%',
          maxWidth: 1640,
          alignItems: 'start',
        }}
      >
        <Divider />
        <Column side="before" />
        <Column side="after" />
      </div>

      <Tagline />
    </AbsoluteFill>
  );
};

const Divider: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 1,
        background: `linear-gradient(180deg, transparent 0%, ${C.borderStrong} 30%, ${C.borderStrong} 70%, transparent 100%)`,
        transform: `translateX(-50%) scaleY(${grow})`,
        transformOrigin: 'top center',
      }}
    />
  );
};

const ROWS = {
  before: [
    {text: '237 offers in inbox', emphasis: '237'},
    {text: '6 inbox channels', emphasis: '6'},
    {text: '3-hour morning triage', emphasis: '3-hour'},
    {text: 'spreadsheet rankings', emphasis: 'spreadsheet'},
    {text: '"trust the desk"', emphasis: '"trust"'},
  ],
  after: [
    {text: '6 ranked recommendations', emphasis: '6 ranked'},
    {text: 'one merged stream', emphasis: 'one'},
    {text: '30-second decision', emphasis: '30-second'},
    {text: '0–100 with 5 sub-scores', emphasis: '0–100'},
    {text: 'every score explained', emphasis: 'every'},
  ],
} as const;

const Column: React.FC<{side: 'before' | 'after'}> = ({side}) => {
  const frame = useCurrentFrame();
  const isBefore = side === 'before';
  const accent = isBefore ? C.blocker : C.accent;
  const labelOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rows = ROWS[side];
  const rowStartDelay = isBefore ? 24 : 60;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: isBefore ? 'flex-end' : 'flex-start',
        textAlign: isBefore ? 'right' : 'left',
        fontFamily: FONT.sans,
      }}
    >
      <div
        style={{
          opacity: labelOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 18,
            fontWeight: W.semibold,
            letterSpacing: 6,
            color: accent,
            textTransform: 'uppercase',
          }}
        >
          {isBefore ? 'Before' : 'After'}
        </span>
        <div
          style={{width: 56, height: 2, background: accent, borderRadius: 1, opacity: 0.7}}
        />
      </div>

      {rows.map((row, i) => (
        <Row
          key={row.text}
          text={row.text}
          emphasis={row.emphasis}
          accent={accent}
          isBefore={isBefore}
          delay={rowStartDelay + i * 14}
        />
      ))}
    </div>
  );
};

const Row: React.FC<{
  text: string;
  emphasis: string;
  accent: string;
  isBefore: boolean;
  delay: number;
}> = ({text, emphasis, accent, isBefore, delay}) => {
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
    config: {damping: 18, mass: 0.6, stiffness: 130},
    durationInFrames: 24,
  });
  const slideFrom = (1 - settle) * (isBefore ? -32 : 32);

  // Render the emphasis substring in the accent colour, the rest muted/primary.
  const idx = text.indexOf(emphasis);
  const before = idx >= 0 ? text.slice(0, idx) : text;
  const match = idx >= 0 ? emphasis : '';
  const after = idx >= 0 ? text.slice(idx + emphasis.length) : '';

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${slideFrom}px)`,
        fontSize: 36,
        fontWeight: W.semibold,
        color: isBefore ? C.textMuted : C.textPrimary,
        lineHeight: 1.2,
        letterSpacing: -0.5,
        textDecoration: isBefore ? 'line-through' : 'none',
        textDecorationColor: isBefore ? `${C.blocker}99` : undefined,
        textDecorationThickness: isBefore ? 2 : undefined,
      }}
    >
      {before}
      <span style={{color: accent, fontWeight: W.bold}}>{match}</span>
      {after}
    </div>
  );
};

const Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - 132;
  const opacity = interpolate(t, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity,
        marginTop: 80,
        fontSize: 38,
        fontWeight: W.medium,
        color: C.textSecondary,
        letterSpacing: -0.5,
        textAlign: 'center',
      }}
    >
      From inbox to <span style={{color: C.accent, fontWeight: W.bold}}>investable</span>
      . In one click.
    </div>
  );
};
