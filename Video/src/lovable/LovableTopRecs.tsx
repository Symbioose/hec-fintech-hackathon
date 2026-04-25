import {interpolate, useCurrentFrame} from 'remotion';
import {LV} from '../design/tokens';
import {LovableScoreBar} from './LovableScoreBar';
import {LovableProductTypeBadge} from './LovableProductTypeBadge';

interface Rec {
  id: string;
  name: string;
  issuer: string;
  type: string;
  coupon: string;
  tenor: string;
  score: number;
}

interface Props {
  recs?: Rec[];
  delay?: number;
  highlightIndex?: number;
}

const DEFAULT_RECS: Rec[] = [
  {
    id: 'sg-eu-banks-2029',
    name: 'SocGen senior switch',
    issuer: 'Société Générale',
    type: 'autocallable',
    coupon: '6.20%',
    tenor: '5y',
    score: 94,
  },
  {
    id: 'unicredit-sub-2028',
    name: 'UniCredit subordinated',
    issuer: 'UniCredit',
    type: 'reverse_convertible',
    coupon: '5.80%',
    tenor: '4y',
    score: 89,
  },
  {
    id: 'bnp-cap-2030',
    name: 'BNP capital protected',
    issuer: 'BNP Paribas',
    type: 'capital_protected_note',
    coupon: '4.10%',
    tenor: '6y',
    score: 82,
  },
  {
    id: 'ing-fixed-2029',
    name: 'ING senior fixed',
    issuer: 'ING Group',
    type: 'fixed_rate_note',
    coupon: '4.65%',
    tenor: '5y',
    score: 76,
  },
  {
    id: 'rbc-fl-2027',
    name: 'RBC floating SOFR+',
    issuer: 'RBC Capital',
    type: 'floating_rate_note',
    coupon: '5.10%',
    tenor: '3y',
    score: 71,
  },
];

export const LovableTopRecs: React.FC<Props> = ({recs = DEFAULT_RECS, delay = 0, highlightIndex}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      {recs.map((rec, i) => {
        const t = frame - (delay + i * 6);
        const opacity = interpolate(t, [0, 14], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const slide = interpolate(t, [0, 14], [12, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const isHighlight = highlightIndex === i;
        const hilightT = highlightIndex != null ? frame - (delay + 36 + i * 4) : -100;
        const hilightAmt = isHighlight
          ? interpolate(hilightT, [0, 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 0;
        return (
          <div
            key={rec.id}
            style={{
              opacity,
              transform: `translateX(${slide}px)`,
              padding: '10px 12px',
              background: LV.surface,
              border: `1px solid ${isHighlight ? `${LV.primary}88` : LV.border}`,
              boxShadow: isHighlight ? `0 0 0 ${hilightAmt * 3}px ${LV.primarySoft}` : 'none',
              borderRadius: 8,
              display: 'grid',
              gridTemplateColumns: '1fr auto 138px',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0}}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: LV.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {rec.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: LV.textMuted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {rec.issuer} · coupon {rec.coupon} · {rec.tenor}
              </span>
            </div>
            <LovableProductTypeBadge type={rec.type} />
            <LovableScoreBar value={rec.score} delay={delay + 12 + i * 6} />
          </div>
        );
      })}
    </div>
  );
};
