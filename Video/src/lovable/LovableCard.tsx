import {LV} from '../design/tokens';

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number | string;
  elevated?: boolean;
}

export const LovableCard: React.FC<Props> = ({children, style, padding = 16, elevated = false}) => (
  <div
    style={{
      background: LV.card,
      border: `1px solid ${LV.border}`,
      borderRadius: LV.radius,
      boxShadow: elevated ? LV.shadowElev : LV.shadowCard,
      padding,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {children}
  </div>
);

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  iconPath?: string;
  iconColor?: string;
}

export const LovableCardHeader: React.FC<HeaderProps> = ({title, subtitle, right, iconPath, iconColor}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        {iconPath ? (
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor ?? LV.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={iconPath} />
          </svg>
        ) : null}
        <span style={{fontSize: 13, fontWeight: 600, color: LV.textPrimary, letterSpacing: -0.1}}>
          {title}
        </span>
      </div>
      {subtitle ? (
        <span style={{fontSize: 11, color: LV.textMuted, lineHeight: 1.4}}>{subtitle}</span>
      ) : null}
    </div>
    {right ? <div>{right}</div> : null}
  </div>
);
