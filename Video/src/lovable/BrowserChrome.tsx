import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {LV} from '../design/tokens';

interface Props {
  url: string;
  title?: string;
  enterFrame?: number;
  exitFrame?: number;
  totalFrames: number;
  children: React.ReactNode;
}

/**
 * Mac-style browser window framing the Lovable product UI.
 * Animates a scale+opacity entry from the cinematic backdrop and an
 * optional dissolve out. Communicates "this is the actual web app."
 */
export const BrowserChrome: React.FC<Props> = ({
  url,
  title = 'FlowDesk · Asset Manager Copilot',
  enterFrame = 0,
  exitFrame,
  totalFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({
    frame: frame - enterFrame,
    fps,
    config: {damping: 22, mass: 0.9, stiffness: 90},
    durationInFrames: 32,
  });
  const enterOpacity = interpolate(frame - enterFrame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = exitFrame
    ? interpolate(frame, [exitFrame, totalFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const scale = 0.86 + enter * 0.14;
  const opacity = Math.min(enterOpacity, exit);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 1640,
          height: 880,
          background: LV.bgChrome,
          borderRadius: 18,
          border: `1px solid ${LV.border}`,
          boxShadow: '0 60px 140px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChromeBar url={url} title={title} />
        <div style={{flex: 1, background: LV.bg, display: 'flex', overflow: 'hidden'}}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

const ChromeBar: React.FC<{url: string; title: string}> = ({url, title}) => (
  <div
    style={{
      height: 56,
      borderBottom: `1px solid ${LV.border}`,
      background: LV.bgChrome,
      display: 'grid',
      gridTemplateColumns: '160px 1fr 160px',
      alignItems: 'center',
      padding: '0 18px',
      gap: 12,
    }}
  >
    <div style={{display: 'flex', gap: 9}}>
      <Dot color="#FF5F57" />
      <Dot color="#FEBC2E" />
      <Dot color="#28C840" />
    </div>
    <div
      style={{
        background: LV.surface,
        border: `1px solid ${LV.border}`,
        borderRadius: 999,
        padding: '7px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <LockGlyph />
      <span
        style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 13,
          color: LV.textSecondary,
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {url}
      </span>
    </div>
    <div
      style={{
        fontSize: 12,
        color: LV.textFaint,
        textAlign: 'right',
        letterSpacing: 0.4,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {title}
    </div>
  </div>
);

const Dot: React.FC<{color: string}> = ({color}) => (
  <div style={{width: 13, height: 13, borderRadius: 999, background: color}} />
);

const LockGlyph: React.FC = () => (
  <svg width={11} height={13} viewBox="0 0 11 13" fill="none" stroke={LV.textMuted} strokeWidth={1.4}>
    <rect x="1.5" y="5.5" width="8" height="6.5" rx="1" />
    <path d="M3 5.5V3.5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);
