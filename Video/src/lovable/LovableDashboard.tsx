import {interpolate, useCurrentFrame} from 'remotion';
import {LV} from '../design/tokens';
import {LovableCard, LovableCardHeader} from './LovableCard';
import {LovableStatCard} from './LovableStatCard';
import {LovableScoreHistogram} from './LovableScoreHistogram';
import {LovableTopRecs} from './LovableTopRecs';

interface Props {
  /** Frame at which the dashboard starts animating in (relative to scene start). */
  startFrame?: number;
  highlightTopRow?: boolean;
}

export const LovableDashboard: React.FC<Props> = ({startFrame = 0, highlightTopRow = false}) => {
  const frame = useCurrentFrame();
  const t = frame - startFrame;

  const headerOpacity = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerLift = interpolate(t, [0, 14], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{flex: 1, padding: '26px 32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 18}}>
      <div style={{opacity: headerOpacity, transform: `translateY(${headerLift}px)`}}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 600,
            color: LV.textMuted,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          Overview
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
          Welcome, Marie
        </h1>
        <p style={{margin: 0, fontSize: 12, color: LV.textMuted}}>
          Today&apos;s view across your catalog, mandate fit and incoming bank flows.
        </p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14}}>
        <LovableStatCard
          delay={startFrame + 8}
          label="Products"
          value="237"
          countTo={237}
          hint="In your catalog"
          iconPath="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7"
          accent={LV.primary}
        />
        <LovableStatCard
          delay={startFrame + 16}
          label="Match your mandate"
          value="22"
          countTo={22}
          hint="Pass all hard filters"
          iconPath="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.5 5.7 21l2.3-7.3-6-4.5h7.6z"
          accent={LV.success}
        />
        <LovableStatCard
          delay={startFrame + 24}
          label="New offers (7d)"
          value="38"
          countTo={38}
          hint="Ingested this week"
          iconPath="M12 6v12M6 12h12"
          accent={LV.accent}
        />
        <LovableStatCard
          delay={startFrame + 32}
          label="Avg match score"
          value="71"
          countTo={71}
          hint="Across your catalog"
          iconPath="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5"
          accent={LV.warning}
        />
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 14, flex: 1, minHeight: 0}}>
        <LovableCard padding={18} style={{gap: 14}}>
          <LovableCardHeader
            title="Score distribution"
            subtitle="Matched products across the 0–100 scale."
            iconPath="M3 17l6-6 4 4 8-8"
            iconColor={LV.primary}
          />
          <LovableScoreHistogram delay={startFrame + 36} height={210} />
        </LovableCard>

        <LovableCard padding={18} style={{gap: 14, minHeight: 0}}>
          <LovableCardHeader
            title="Top recommendations"
            subtitle="Ranked by your mandate fit"
            iconPath="M12 2l2.4 7.2H22l-6 4.5 2.3 7.3L12 16.5 5.7 21l2.3-7.3-6-4.5h7.6z"
            iconColor={LV.primary}
            right={
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: LV.primary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View all →
              </span>
            }
          />
          <LovableTopRecs delay={startFrame + 48} highlightIndex={highlightTopRow ? 0 : undefined} />
        </LovableCard>
      </div>
    </div>
  );
};
