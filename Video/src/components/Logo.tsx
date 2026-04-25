import {C, FONT, W} from '../design/tokens';

interface Props {
  size?: number;
  showWordmark?: boolean;
}

/** StructuredMatch logo: gold rounded square with an S-curve, plus wordmark. */
export const Logo: React.FC<Props> = ({size = 96, showWordmark = true}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.24,
        fontFamily: FONT.sans,
      }}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span
          style={{
            fontSize: size * 0.78,
            fontWeight: W.bold,
            letterSpacing: -size * 0.02,
            color: C.textPrimary,
            lineHeight: 1,
          }}
        >
          Structured<span style={{color: C.accent}}>Match</span>
        </span>
      )}
    </div>
  );
};

const LogoMark: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size * 0.22,
      background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
      boxShadow: `0 0 ${size * 0.4}px ${C.accentGlow}`,
    }}
  >
    <svg
      width={size * 0.58}
      height={size * 0.58}
      viewBox="0 0 100 100"
      fill="none"
      stroke={C.bg}
      strokeWidth={14}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 22 28 Q 50 28, 50 50 T 78 72" />
    </svg>
  </div>
);
