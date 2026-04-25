import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';
import {LovableCard, LovableCardHeader} from './LovableCard';

interface Props {
  startFrame?: number;
}

interface Slider {
  label: string;
  baseline: string;
  fromValue: number;
  toValue: number;
  unit: string;
  min: number;
  max: number;
  dragStart: number;
  dragDuration: number;
}

const SLIDERS: Slider[] = [
  {label: 'Max tenor', baseline: '5y', fromValue: 5, toValue: 7, unit: 'y', min: 1, max: 10, dragStart: 18, dragDuration: 28},
  {label: 'Min target yield', baseline: '4.0%', fromValue: 4.0, toValue: 3.5, unit: '%', min: 0, max: 12, dragStart: 60, dragDuration: 28},
  {label: 'Max barrier risk', baseline: '60%', fromValue: 60, toValue: 70, unit: '%', min: 30, max: 100, dragStart: 110, dragDuration: 28},
];

const DELTAS = [
  {title: 'Helios Autocall', issuer: 'Bank Helios · 7y · EUR', before: 0, after: 78, reason: 'Tenor relaxed → now eligible'},
  {title: 'Deutsche structured', issuer: 'Deutsche Bank · 6y · EUR', before: 0, after: 72, reason: 'Yield band widened → enters band'},
  {title: 'Barclays barrier note', issuer: 'Barclays · 5y · GBP', before: 0, after: 68, reason: 'Barrier ceiling lifted → passes'},
];

export const LovableWhatIf: React.FC<Props> = ({startFrame = 0}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;

  const headerOp = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{flex: 1, padding: '22px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{opacity: headerOp}}>
        <span
          style={{
            fontSize: 10,
            color: LV.textMuted,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Recommendations
        </span>
        <h1
          style={{
            margin: '4px 0 2px 0',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: -0.6,
            color: LV.textPrimary,
          }}
        >
          What-if mandate
        </h1>
        <p style={{margin: 0, fontSize: 12, color: LV.textMuted}}>
          Temporarily relax constraints to surface near-misses without changing your mandate.
        </p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, flex: 1, minHeight: 0}}>
        {/* What-If panel */}
        <LovableCard padding={20} style={{gap: 16, minHeight: 0}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <SparklesIcon />
              <span style={{fontSize: 13, fontWeight: 600, color: LV.textPrimary}}>What-if mandate</span>
            </div>
            <ToggleSwitch on />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, rowGap: 18}}>
            {SLIDERS.map((s) => (
              <SliderRow key={s.label} slider={s} startFrame={startFrame} />
            ))}
            <div
              style={{
                gridColumn: '1 / 3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: LV.surface,
                border: `1px solid ${LV.border}`,
                borderRadius: 8,
              }}
            >
              <div>
                <span style={{fontSize: 11, fontWeight: 600, color: LV.textPrimary, display: 'block'}}>
                  Require capital protection
                </span>
                <span style={{fontSize: 10, color: LV.textMuted}}>Mandate baseline: yes</span>
              </div>
              <ProtectionToggle startFrame={startFrame} />
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '12px 14px',
              background: LV.primarySoft,
              borderRadius: 8,
              border: `1px solid ${LV.primary}55`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <SparklesIcon />
            <UnlockCounter startFrame={startFrame} />
          </div>
        </LovableCard>

        {/* Updated recommendations */}
        <LovableCard padding={18} style={{gap: 12, minHeight: 0}}>
          <LovableCardHeader
            title="Now eligible"
            subtitle="Products that pass under the relaxed constraints, with their explainable score."
            iconPath="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.5 5.7 21l2.3-7.3-6-4.5h7.6z"
            iconColor={LV.primary}
          />
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {DELTAS.map((d, i) => (
              <DeltaRow key={d.title} delta={d} startFrame={startFrame + 110 + i * 22} />
            ))}
          </div>
        </LovableCard>
      </div>
    </div>
  );
};

const SliderRow: React.FC<{slider: Slider; startFrame: number}> = ({slider}) => {
  const frame = useCurrentFrame();
  const value = interpolate(
    frame,
    [slider.dragStart, slider.dragStart + slider.dragDuration],
    [slider.fromValue, slider.toValue],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    }
  );
  const display =
    slider.unit === '%' && slider.label.includes('yield')
      ? `${value.toFixed(1)}${slider.unit}`
      : `${Math.round(value)}${slider.unit}`;
  const pct = (value - slider.min) / (slider.max - slider.min);
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isMoving =
    frame >= slider.dragStart && frame <= slider.dragStart + slider.dragDuration;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 8, opacity: fadeIn}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontSize: 11, color: LV.textMuted, fontWeight: 500}}>{slider.label}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isMoving ? LV.primaryGlow : LV.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -0.2,
          }}
        >
          {display}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 6,
          background: LV.surfaceMuted,
          border: `1px solid ${LV.border}`,
          borderRadius: 999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct * 100}%`,
            background: LV.gradientPrimary,
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pct * 100}%`,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: 'white',
            border: `2px solid ${LV.primary}`,
            transform: 'translate(-50%, -50%)',
            boxShadow: isMoving
              ? `0 0 0 6px ${LV.primary}33, 0 4px 10px rgba(0,0,0,0.35)`
              : '0 2px 6px rgba(0,0,0,0.25)',
            transition: 'box-shadow 120ms ease',
          }}
        />
      </div>
      <span style={{fontSize: 9, color: LV.textFaint}}>Mandate baseline: {slider.baseline}</span>
    </div>
  );
};

const ProtectionToggle: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();
  const flip = frame > startFrame + 90;
  const knob = interpolate(frame, [startFrame + 88, startFrame + 100], [2, 18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        width: 38,
        height: 22,
        borderRadius: 999,
        background: flip ? LV.primary : LV.surfaceMuted,
        border: `1px solid ${flip ? LV.primary : LV.border}`,
        position: 'relative',
        transition: 'background 200ms ease',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          background: 'white',
          position: 'absolute',
          top: 2,
          left: knob,
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
};

const ToggleSwitch: React.FC<{on: boolean}> = ({on}) => (
  <div
    style={{
      width: 38,
      height: 22,
      borderRadius: 999,
      background: on ? LV.primary : LV.surfaceMuted,
      border: `1px solid ${on ? LV.primary : LV.border}`,
      position: 'relative',
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        background: 'white',
        position: 'absolute',
        top: 2,
        left: on ? 18 : 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
  </div>
);

const UnlockCounter: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;
  const count = interpolate(t, [100, 150], [0, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const display = Math.round(count);
  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: 6}}>
      <span style={{fontSize: 11, color: LV.textPrimary, fontWeight: 500}}>Effect</span>
      <span style={{fontSize: 11, color: LV.textMuted}}>·</span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: LV.primaryGlow,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: -0.4,
        }}
      >
        +{display}
      </span>
      <span style={{fontSize: 12, color: LV.textPrimary, fontWeight: 600}}>
        product{display === 1 ? '' : 's'} unlock
      </span>
    </div>
  );
};

const DeltaRow: React.FC<{
  delta: {title: string; issuer: string; before: number; after: number; reason: string};
  startFrame: number;
}> = ({delta, startFrame}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;
  const opacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slide = interpolate(t, [0, 18], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const grow = spring({
    frame: t - 8,
    fps: 30,
    config: {damping: 22, mass: 0.8, stiffness: 110},
    durationInFrames: 22,
  });
  const num = Math.round(delta.after * grow);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        background: LV.surface,
        border: `1px solid ${LV.border}`,
        borderLeft: `3px solid ${LV.primary}`,
        borderRadius: 8,
        opacity,
        transform: `translateY(${slide}px)`,
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0}}>
        <span style={{fontSize: 13, fontWeight: 600, color: LV.textPrimary, letterSpacing: -0.2}}>
          {delta.title}
        </span>
        <span style={{fontSize: 11, color: LV.textMuted}}>{delta.issuer}</span>
        <span style={{fontSize: 10.5, color: LV.primaryGlow, fontWeight: 500, marginTop: 2}}>
          {delta.reason}
        </span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums'}}>
        <span style={{fontSize: 14, color: LV.textFaint, textDecoration: 'line-through'}}>—</span>
        <span style={{fontSize: 12, color: LV.primary}}>→</span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: LV.primary,
            letterSpacing: -0.4,
          }}
        >
          {num}
        </span>
      </div>
    </div>
  );
};

const SparklesIcon: React.FC = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={LV.primary} strokeWidth={2}>
    <path
      d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"
      strokeLinecap="round"
    />
  </svg>
);
