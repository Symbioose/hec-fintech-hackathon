import {LV} from '../design/tokens';

interface Props {
  type: string;
  size?: 'sm' | 'md';
}

const COLORS: Record<string, {bg: string; text: string}> = {
  autocallable: {bg: LV.primarySoft, text: LV.primary},
  reverse_convertible: {bg: LV.accentSoft, text: LV.accent},
  capital_protected_note: {bg: LV.successSoft, text: LV.success},
  credit_linked_note: {bg: LV.warningSoft, text: LV.warning},
  fixed_rate_note: {bg: LV.infoSoft, text: LV.info},
  floating_rate_note: {bg: LV.infoSoft, text: LV.info},
  range_accrual: {bg: LV.destructiveSoft, text: LV.destructive},
};

const humanize = (type: string): string =>
  type
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

export const LovableProductTypeBadge: React.FC<Props> = ({type, size = 'sm'}) => {
  const palette = COLORS[type] ?? {bg: LV.primarySoft, text: LV.primary};
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 8px' : '5px 11px',
        borderRadius: 6,
        background: palette.bg,
        color: palette.text,
        fontSize: size === 'sm' ? 10 : 11,
        fontWeight: 600,
        letterSpacing: 0.1,
      }}
    >
      {humanize(type)}
    </span>
  );
};
