import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {C, FONT, LV, W} from '../design/tokens';
import {Logo} from '../components/Logo';
import {SubScoreBars} from '../components/SubScoreBars';
import {BrowserChrome} from '../lovable/BrowserChrome';
import {LovableShell} from '../lovable/LovableShell';
import {LovableDashboard} from '../lovable/LovableDashboard';
import {LovableProductDetail} from '../lovable/LovableProductDetail';
import {LovableWhatIf} from '../lovable/LovableWhatIf';

loadInter('normal', {weights: ['400', '500', '600', '700', '900'], subsets: ['latin']});
loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});

export type PitchMode = 'vc' | 'full' | 'loop';

type NarrativeMode = Exclude<PitchMode, 'loop'>;

const OVERLAP = 36;

const BRAND = {
  wordmark: 'FlowDesk',
  accentWord: 'Desk',
  descriptor: 'ASSET-MANAGER RESEARCH ROUTER',
};

const NARRATIVE_SCENES = {
  // VC cut: 90.0s exact. 7 scenes × frames - 6×36 overlap = 2700 frames @ 30fps.
  vc: {
    problem: 270,
    thesis: 180,
    retrieve: 360,
    match: 540,
    score: 660,
    evolve: 510,
    close: 396,
  },
  full: {
    problem: 330,
    thesis: 240,
    retrieve: 570,
    match: 540,
    score: 660,
    evolve: 510,
    close: 360,
  },
} as const;

type NarrativeSceneKey = keyof (typeof NARRATIVE_SCENES)['vc'];

const getNarrativeDuration = (mode: NarrativeMode): number => {
  const durations = Object.values(NARRATIVE_SCENES[mode]) as number[];
  return durations.reduce((sum, value) => sum + value, 0) - OVERLAP * (durations.length - 1);
};

export const INVESTOR_PITCH_DURATIONS = {
  vc: getNarrativeDuration('vc'),
  full: getNarrativeDuration('full'),
  loop: 600,
} as const;

interface TimelineScene {
  key: NarrativeSceneKey;
  from: number;
  durationInFrames: number;
}

export const InvestorPitch: React.FC<{mode?: PitchMode}> = ({mode = 'vc'}) => {
  if (mode === 'loop') {
    return <LoopPitch />;
  }

  const timeline = buildTimeline(mode);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        color: C.textPrimary,
        fontFamily: FONT.sans,
        overflow: 'hidden',
      }}
    >
      <AnimatedBackdrop />
      {timeline.map((scene) => (
        <Sequence key={scene.key} from={scene.from} durationInFrames={scene.durationInFrames} layout="none">
          <SceneRenderer scene={scene.key} mode={mode} durationInFrames={scene.durationInFrames} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const buildTimeline = (mode: NarrativeMode): TimelineScene[] => {
  const entries = Object.entries(NARRATIVE_SCENES[mode]) as Array<[NarrativeSceneKey, number]>;
  let cursor = 0;

  return entries.map(([key, durationInFrames], index) => {
    const scene = {key, from: cursor, durationInFrames};
    cursor += durationInFrames - (index === entries.length - 1 ? 0 : OVERLAP);
    return scene;
  });
};

const SceneRenderer: React.FC<{
  scene: NarrativeSceneKey;
  mode: NarrativeMode;
  durationInFrames: number;
}> = ({scene, mode, durationInFrames}) => {
  switch (scene) {
    case 'problem':
      return <ProblemScene durationInFrames={durationInFrames} mode={mode} />;
    case 'thesis':
      return <ThesisScene durationInFrames={durationInFrames} />;
    case 'retrieve':
      return <RetrieveScene durationInFrames={durationInFrames} mode={mode} />;
    case 'match':
      return <MatchScene durationInFrames={durationInFrames} mode={mode} />;
    case 'score':
      return <ScoreScene durationInFrames={durationInFrames} mode={mode} />;
    case 'evolve':
      return <EvolveScene durationInFrames={durationInFrames} mode={mode} />;
    case 'close':
      return <CloseScene durationInFrames={durationInFrames} />;
    default:
      return null;
  }
};

const AnimatedBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = frame / (fps * 5);
  const offsetX = Math.sin(drift * 0.7) * 22;
  const offsetY = Math.cos(drift * 0.5) * 18;
  const pulse = 0.65 + Math.sin(frame / (fps * 0.85)) * 0.14;

  return (
    <>
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at 16% 16%, rgba(96, 165, 250, 0.18), transparent 30%),
            radial-gradient(circle at 82% 20%, rgba(229, 180, 92, 0.14), transparent 34%),
            radial-gradient(circle at 54% 82%, rgba(52, 211, 153, 0.08), transparent 32%),
            linear-gradient(180deg, ${C.bgMid} 0%, ${C.bg} 55%, #070B16 100%)
          `,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.28,
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          backgroundImage: `
            linear-gradient(${C.border} 1px, transparent 1px),
            linear-gradient(90deg, ${C.border} 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          maskImage:
            'radial-gradient(circle at 50% 40%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.18) 76%, transparent 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 48%, transparent 50%, transparent 100%)',
          backgroundSize: '100% 12px',
        }}
      />
      <AbsoluteFill style={{justifyContent: 'flex-end', paddingBottom: 56, opacity: 0.3}}>
        <div
          style={{
            height: 150,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '0 80px',
          }}
        >
          {Array.from({length: 26}).map((_, index) => {
            const base = 18 + ((index * 19) % 92);
            const wave = Math.sin(frame / 16 + index * 0.32) * 18;
            return (
              <div
                key={index}
                style={{
                  width: 18,
                  height: base + wave,
                  borderRadius: 999,
                  background:
                    index % 4 === 0
                      ? `linear-gradient(180deg, ${C.accentSoft}, transparent)`
                      : `linear-gradient(180deg, ${C.info}, transparent)`,
                  opacity: pulse,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </>
  );
};

const SceneShell: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
  padding?: string;
}> = ({durationInFrames, children, padding = '84px'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = spring({
    frame,
    fps,
    config: {damping: 18, mass: 0.8, stiffness: 110},
    durationInFrames: 28,
  });
  const outro = interpolate(frame, [durationInFrames - 28, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.9, 0.4, 1),
  });
  const opacity = Math.min(intro, outro);
  const translateY = interpolate(opacity, [0, 1], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        padding,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const ProblemScene: React.FC<{durationInFrames: number; mode: NarrativeMode}> = ({
  durationInFrames,
  mode,
}) => {
  const frame = useCurrentFrame();
  const compact = mode === 'vc';
  const floatingCards = [
    {label: 'BNP weekly note', meta: 'PDF · 08:11', accent: C.info, top: 90, left: 24, shift: -110},
    {label: 'SocGen chat', meta: 'Bloomberg · 08:19', accent: C.warning, top: 190, left: 60, shift: -70},
    {label: 'Goldman matrix', meta: 'Email · 08:27', accent: C.electric, top: 310, left: 0, shift: -125},
    {label: 'RBC call recap', meta: 'Transcript · 08:34', accent: C.success, top: 116, right: 30, shift: 110},
    {label: 'Citi trade idea', meta: 'Email · 08:41', accent: C.accent, top: 262, right: 46, shift: 92},
  ];

  return (
    <SceneShell durationInFrames={durationInFrames}>
      <div style={{position: 'absolute', top: 36, left: 84}}>
        <Eyebrow text="The Research Firehose" />
      </div>
      <div style={{position: 'absolute', top: 36, right: 84}}>
        <TopBadge label="MON 08:47 · RESEARCH INBOX" accent={C.success} />
      </div>

      {floatingCards.map((card, index) => {
        const local = frame - index * 8;
        const opacity = interpolate(local, [0, 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const translateX = interpolate(local, [0, 24], [card.shift, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.18, 1, 0.35, 1),
        });
        const rotate = card.shift < 0 ? -3 + index * 0.7 : 2 - index * 0.5;

        return (
          <div
            key={card.label}
            style={{
              position: 'absolute',
              top: card.top,
              left: card.left,
              right: card.right,
              width: 286,
              opacity,
              transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
            }}
          >
            <GlassPanel
              style={{
                padding: '16px 18px',
                borderLeft: `3px solid ${card.accent}`,
                borderRadius: 24,
              }}
            >
              <div style={{fontSize: 18, fontWeight: W.bold, lineHeight: 1.15}}>{card.label}</div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  color: C.textMuted,
                  letterSpacing: 1.6,
                }}
              >
                {card.meta}
              </div>
            </GlassPanel>
          </div>
        );
      })}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: compact ? '1.1fr 0.9fr' : '1fr 0.85fr',
          gap: 44,
          alignItems: 'center',
          paddingTop: 60,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: compact ? 26 : 28,
              letterSpacing: 6,
              color: C.accent,
              textTransform: 'uppercase',
            }}
          >
            emails · pdfs · bloomberg
          </div>
          <div
            style={{
              fontSize: compact ? 200 : 216,
              fontWeight: W.black,
              letterSpacing: -12,
              lineHeight: 0.9,
              textShadow: `0 0 54px ${C.accentGlow}`,
            }}
          >
            300-400
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: compact ? 32 : 34,
              color: C.textSecondary,
              letterSpacing: 8,
              textTransform: 'uppercase',
            }}
          >
            inputs / week
          </div>
          <div
            style={{
              fontSize: compact ? 96 : 108,
              fontWeight: W.black,
              letterSpacing: -4,
              lineHeight: 1,
              color: C.accent,
              textShadow: `0 0 48px ${C.accentGlow}`,
            }}
          >
            Filtering is.
          </div>
        </div>

        <GlassPanel
          style={{
            padding: compact ? '36px 36px 34px 36px' : '42px 42px 38px 42px',
            borderRadius: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.32)',
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 18,
              letterSpacing: 4,
              color: C.textMuted,
              textTransform: 'uppercase',
            }}
          >
            what matters
          </div>
          <div
            style={{
              fontSize: compact ? 162 : 178,
              fontWeight: W.black,
              lineHeight: 0.9,
              letterSpacing: -9,
              color: C.success,
              textShadow: '0 0 54px rgba(52, 211, 153, 0.2)',
            }}
          >
            &lt;5%
          </div>
          <div style={{fontSize: 34, fontWeight: W.bold, letterSpacing: -1}}>actionable</div>
          <MetricStrip label="Morning triage" value="2-3h / fund" accent={C.blocker} />
          <MetricStrip label="Sources" value="20+ sellers" accent={C.info} />
          <MetricStrip label="Decision state" value="thread by thread" accent={C.warning} />
        </GlassPanel>
      </div>
    </SceneShell>
  );
};

const ThesisScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  return (
    <SceneShell durationInFrames={durationInFrames}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 24,
        }}
      >
        <Logo size={164} wordmark={BRAND.wordmark} accentWord={BRAND.accentWord} />
        <div
          style={{
            fontSize: 92,
            fontWeight: W.black,
            letterSpacing: -3.8,
            lineHeight: 0.98,
            maxWidth: 1460,
          }}
        >
          Retrieve. Match. Recommend.
        </div>
        <div
          style={{
            fontSize: 34,
            color: C.textSecondary,
            lineHeight: 1.2,
            letterSpacing: -0.4,
          }}
        >
          Built for the desk.
        </div>
      </div>
    </SceneShell>
  );
};

const RetrieveScene: React.FC<{durationInFrames: number; mode: NarrativeMode}> = ({
  durationInFrames,
  mode,
}) => {
  const compact = mode === 'vc';

  return (
    <SceneShell durationInFrames={durationInFrames} padding={compact ? '74px 78px' : '82px 88px'}>
      <HeaderBlock
        eyebrow="Retrieve"
        title="Six channels. One structured record."
        subtitle="Emails. PDFs. Bloomberg. Calls. → validated product."
        right={<div style={{display: 'flex', gap: 12}}><StatPill label="channels" value="6" accent={C.info} /><StatPill label="queue" value="1" accent={C.success} /></div>}
      />

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: compact ? '1.02fr 260px 1fr' : '1.05fr 280px 1fr',
          gap: 22,
          marginTop: 34,
        }}
      >
        <GlassPanel style={{padding: '22px', display: 'flex', flexDirection: 'column', gap: 14}}>
          <AppPanelHeader eyebrow="Channels" title="Inbox" meta="12 messages · 4 unread" />
          <div style={{display: 'flex', gap: 8}}>
            <MiniTab text="All" active accent={C.info} />
            <MiniTab text="Unread" accent={C.textMuted} />
            <MiniTab text="Read" accent={C.textMuted} />
          </div>
          <InboxFeedCard label="BNP weekly credit" source="Email" preview="3 defensive-income ideas extracted" accent={C.info} />
          <InboxFeedCard label="SocGen sales chat" source="Bloomberg" preview="1 switch idea surfaced" accent={C.warning} />
          <InboxFeedCard label="RBC call transcript" source="Transcript" preview="Bank capital structure nuance captured" accent={C.success} />
          <GlassPanel
            style={{
              marginTop: 'auto',
              padding: '16px 18px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.accent,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              extracted preview
            </div>
            <div style={{marginTop: 10, fontSize: 26, fontWeight: W.bold, letterSpacing: -0.7}}>
              Helios Autocall
            </div>
            <div style={{marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              <RuleChip text="EUR" accent={C.info} />
              <RuleChip text="5y tenor" accent={C.electric} />
              <RuleChip text="6.20% coupon" accent={C.success} />
            </div>
          </GlassPanel>
        </GlassPanel>

        <GlassPanel style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: 12}}>
          <AppPanelHeader eyebrow="Agent rail" title="Process" meta="read · extract · validate" />
          <AgentStep label="Read" accent={C.info} detail="Merge all channels" value={1} />
          <AgentStep label="Extract" accent={C.electric} detail="Parse trade ideas" value={0.86} />
          <AgentStep label="Validate" accent={C.success} detail="Normalize product fields" value={0.94} />
          <GlassPanel
            style={{
              marginTop: 'auto',
              padding: '16px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                letterSpacing: 2,
                color: C.accent,
                textTransform: 'uppercase',
              }}
            >
              outcome
            </div>
            <div style={{marginTop: 8, fontSize: 24, fontWeight: W.bold, letterSpacing: -0.6}}>
              One structured product record.
            </div>
          </GlassPanel>
        </GlassPanel>

        <GlassPanel style={{padding: '22px', display: 'flex', flexDirection: 'column', gap: 16}}>
          <AppPanelHeader eyebrow="Structured output" title="Product record" meta="Validated facts, ready for matching" />
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
            <FactCard label="Issuer" value="Bank Helios" />
            <FactCard label="Type" value="Autocallable" />
            <FactCard label="Currency" value="EUR" />
            <FactCard label="Tenor" value="5 years" />
            <FactCard label="Coupon" value="6.20%" />
            <FactCard label="Barrier" value="60%" />
            <FactCard label="Protection" value="No" accent={C.warning} />
            <FactCard label="Rating" value="A" accent={C.success} />
          </div>
          <GlassPanel
            style={{
              padding: '18px 20px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.04)',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.textMuted,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              extracted json
            </div>
            <div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8}}>
              <JsonLine keyName="issuer" value='"Bank Helios"' accent={C.info} />
              <JsonLine keyName="product_type" value='"autocallable"' accent={C.electric} />
              <JsonLine keyName="coupon" value="0.062" accent={C.success} />
              <JsonLine keyName="capital_protection" value="false" accent={C.warning} />
            </div>
          </GlassPanel>
        </GlassPanel>
      </div>
    </SceneShell>
  );
};

const MatchScene: React.FC<{durationInFrames: number; mode: NarrativeMode}> = ({
  durationInFrames,
}) => {
  // Live product moment #1: zoom into the actual FlowDesk dashboard.
  // KPIs animate, score histogram bars grow, top recommendations slide in,
  // last beat highlights the SocGen row that we'll click into next.
  return (
    <LovableSceneFrame
      durationInFrames={durationInFrames}
      url="app.flowdesk.io/dashboard"
      title="Dashboard · Atlas Multi-Asset Fund"
      activeNav="dashboard"
      eyebrow="Live · Match"
      caption="237 offers in. 22 pass your mandate."
      enterAnimation
    >
      <LovableDashboard startFrame={10} highlightTopRow />
    </LovableSceneFrame>
  );
};

const ScoreScene: React.FC<{durationInFrames: number; mode: NarrativeMode}> = ({
  durationInFrames,
}) => {
  // Live product moment #2: click into the top recommendation.
  // The radar chart fills in spoke-by-spoke — the "why it surfaced" hero.
  return (
    <LovableSceneFrame
      durationInFrames={durationInFrames}
      url="app.flowdesk.io/products/socgen-senior-switch"
      title="SocGen senior switch · Score 94"
      activeNav="recommendations"
      eyebrow="Live · Score"
      caption="Every recommendation is explainable. The radar shows why."
    >
      <LovableProductDetail startFrame={4} />
    </LovableSceneFrame>
  );
};

const EvolveScene: React.FC<{durationInFrames: number; mode: NarrativeMode}> = ({
  durationInFrames,
}) => {
  // Live product moment #3: the desk relaxes constraints to surface
  // near-misses. Sliders auto-drag; new matches unlock; the chrome
  // dissolves out at the end to hand off to the cinematic close.
  return (
    <LovableSceneFrame
      durationInFrames={durationInFrames}
      url="app.flowdesk.io/recommendations"
      title="What-if mandate · 3 unlock"
      activeNav="recommendations"
      eyebrow="Live · Evolve"
      caption="Relax a constraint. The feed reacts in real time."
      exitAnimation
    >
      <LovableWhatIf startFrame={4} />
    </LovableSceneFrame>
  );
};

/**
 * Reusable shell for the three "live product" scenes. Renders the
 * cinematic SceneShell wrapper, an eyebrow caption above the browser
 * window, and the BrowserChrome+LovableShell containing the page.
 */
const LovableSceneFrame: React.FC<{
  durationInFrames: number;
  url: string;
  title: string;
  activeNav: 'dashboard' | 'recommendations' | 'products' | 'inbox' | 'mandate' | 'market' | 'watchlist';
  eyebrow: string;
  caption: string;
  enterAnimation?: boolean;
  exitAnimation?: boolean;
  children: React.ReactNode;
}> = ({
  durationInFrames,
  url,
  title,
  activeNav,
  eyebrow,
  caption,
  enterAnimation = false,
  exitAnimation = false,
  children,
}) => {
  return (
    <SceneShell durationInFrames={durationInFrames} padding="0">
      <BrowserChrome
        url={url}
        title={title}
        enterFrame={enterAnimation ? 0 : -120}
        exitFrame={exitAnimation ? durationInFrames - 30 : undefined}
        totalFrames={durationInFrames}
      >
        <LovableShell active={activeNav}>{children}</LovableShell>
      </BrowserChrome>
      <SceneCaption eyebrow={eyebrow} caption={caption} />
    </SceneShell>
  );
};

const SceneCaption: React.FC<{eyebrow: string; caption: string}> = ({eyebrow, caption}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 36,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 16px',
          background: 'rgba(11, 15, 31, 0.78)',
          border: `1px solid ${C.borderStrong}`,
          borderRadius: 999,
          backdropFilter: 'blur(12px)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT.mono,
            fontSize: 11,
            color: LV.primaryGlow,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: W.semibold,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: LV.primaryGlow,
              boxShadow: `0 0 10px ${LV.primaryGlow}`,
            }}
          />
          {eyebrow}
        </span>
        <span style={{width: 1, height: 14, background: C.borderStrong}} />
        <span style={{fontSize: 14, fontWeight: W.semibold, color: C.textPrimary, letterSpacing: -0.2}}>
          {caption}
        </span>
      </div>
    </div>
  );
};

const CloseScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const marketOp = interpolate(frame, [120, 156], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const marketLift = interpolate(frame, [120, 156], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <SceneShell durationInFrames={durationInFrames}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 26,
        }}
      >
        <Logo size={188} wordmark={BRAND.wordmark} accentWord={BRAND.accentWord} />
        <div
          style={{
            fontSize: 92,
            fontWeight: W.black,
            letterSpacing: -3.8,
            lineHeight: 0.96,
            maxWidth: 1520,
          }}
        >
          From research firehose to <span style={{color: C.accent}}>investable feed</span>.
        </div>
        <div
          style={{
            fontSize: 34,
            color: C.textSecondary,
            letterSpacing: -0.4,
          }}
        >
          Retrieve. Match. Recommend.
        </div>
        <div
          style={{
            opacity: marketOp,
            transform: `translateY(${marketLift}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 4,
            padding: '14px 22px',
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 999,
            background: 'rgba(229, 180, 92, 0.06)',
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              letterSpacing: 4,
              color: C.textMuted,
              textTransform: 'uppercase',
            }}
          >
            Addressable market
          </span>
          <span style={{width: 1, height: 18, background: C.borderStrong}} />
          <span
            style={{
              fontSize: 28,
              fontWeight: W.black,
              color: C.accent,
              letterSpacing: -0.4,
              fontFamily: FONT.mono,
            }}
          >
            €34T
          </span>
          <span style={{fontSize: 18, color: C.textSecondary, letterSpacing: -0.2}}>
            European asset management
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT.mono,
            fontSize: 18,
            letterSpacing: 5,
            color: C.textMuted,
            textTransform: 'uppercase',
          }}
        >
          {BRAND.descriptor}
        </div>
      </div>
    </SceneShell>
  );
};

const LoopPitch: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        color: C.textPrimary,
        fontFamily: FONT.sans,
        overflow: 'hidden',
      }}
    >
      <AnimatedBackdrop />
      <AbsoluteFill style={{padding: '72px 76px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Logo size={114} wordmark={BRAND.wordmark} accentWord={BRAND.accentWord} />
          <TopBadge label="SILENT LOOP · VC EVENT MODE" accent={C.accent} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '0.86fr 1.14fr',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            <Eyebrow text="FlowDesk in 20 seconds" accent={C.info} />
            <div
              style={{
                fontSize: 170,
                fontWeight: W.black,
                letterSpacing: -10,
                lineHeight: 0.9,
                textShadow: `0 0 48px ${C.accentGlow}`,
              }}
            >
              300-400
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 24,
                letterSpacing: 6,
                color: C.textSecondary,
                textTransform: 'uppercase',
              }}
            >
              inputs / week
            </div>
            <div
              style={{
                fontSize: 62,
                fontWeight: W.black,
                letterSpacing: -2.8,
                lineHeight: 1,
                maxWidth: 700,
              }}
            >
              Retrieve. Match. Recommend.
            </div>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              <Tag text="Less noise" accent={C.success} />
              <Tag text="Better fit" accent={C.accent} />
            </div>
          </div>

          <GlassPanel style={{padding: '24px 26px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 18}}>
            <AppPanelHeader eyebrow="Live board" title="What the desk sees" meta="One merged research workflow" />
            <div style={{display: 'grid', gridTemplateColumns: '250px 1fr', gap: 18}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <MiniSourceCard label="Email" accent={C.info} />
                <MiniSourceCard label="PDF" accent={C.electric} />
                <MiniSourceCard label="Bloomberg" accent={C.warning} />
                <MiniSourceCard label="Transcript" accent={C.success} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <MiniRecRow title="SocGen senior switch" state="eligible" fit="94" accent={C.success} />
                <MiniRecRow title="UniCredit subordinated" state="eligible" fit="89" accent={C.success} />
                <MiniRecRow title="Total SA" state="rejected" fit="ESG" accent={C.blocker} />
              </div>
            </div>
            <GlassPanel
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    color: C.textMuted,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  final score
                </div>
                <div style={{marginTop: 8, fontSize: 34, fontWeight: W.bold, letterSpacing: -1}}>
                  investable in one glance
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 92,
                  fontWeight: W.bold,
                  lineHeight: 1,
                  letterSpacing: -4,
                  color: C.accent,
                  textShadow: `0 0 36px ${C.accentGlow}`,
                }}
              >
                94
              </div>
            </GlassPanel>
          </GlassPanel>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: C.textMuted,
            fontFamily: FONT.mono,
            fontSize: 18,
            letterSpacing: 4,
          }}
        >
          <span>{BRAND.descriptor}</span>
          <span>QUEUE 100% · RANK 89%</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HeaderBlock: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}> = ({eyebrow, title, subtitle, right}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
      <Eyebrow text={eyebrow} accent={C.info} />
      <div
        style={{
          fontSize: 74,
          fontWeight: W.black,
          letterSpacing: -3,
          lineHeight: 1,
          maxWidth: 1080,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          color: C.textSecondary,
          lineHeight: 1.34,
          maxWidth: 1020,
        }}
      >
        {subtitle}
      </div>
    </div>
    {right ? <div style={{flexShrink: 0}}>{right}</div> : null}
  </div>
);

const Eyebrow: React.FC<{text: string; accent?: string}> = ({text, accent = C.accent}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <div style={{width: 64, height: 2, borderRadius: 999, background: accent}} />
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 22,
        fontWeight: W.semibold,
        color: accent,
        letterSpacing: 5,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  </div>
);

const GlassPanel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: 'linear-gradient(180deg, rgba(24, 32, 58, 0.82), rgba(14, 20, 37, 0.9))',
      border: `1px solid ${C.border}`,
      borderRadius: 26,
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.24)',
      ...style,
    }}
  >
    {children}
  </div>
);

const TopBadge: React.FC<{label: string; accent: string}> = ({label, accent}) => (
  <GlassPanel
    style={{
      padding: '12px 18px',
      borderRadius: 999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div
      style={{
        width: 9,
        height: 9,
        borderRadius: 999,
        background: accent,
        boxShadow: `0 0 12px ${accent}`,
      }}
    />
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 15,
        color: C.textSecondary,
        letterSpacing: 2.1,
      }}
    >
      {label}
    </div>
  </GlassPanel>
);

const Tag: React.FC<{text: string; accent: string}> = ({text, accent}) => (
  <div
    style={{
      padding: '10px 16px',
      borderRadius: 999,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.04)',
      fontFamily: FONT.mono,
      fontSize: 14,
      fontWeight: W.semibold,
      color: accent,
      letterSpacing: 2,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

const StatPill: React.FC<{label: string; value: string; accent: string}> = ({label, value, accent}) => (
  <GlassPanel
    style={{
      padding: '14px 16px 12px 16px',
      minWidth: 116,
      borderRadius: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 12,
        color: C.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 34,
        fontWeight: W.bold,
        lineHeight: 1,
        color: accent,
      }}
    >
      {value}
    </div>
  </GlassPanel>
);

const MetricStrip: React.FC<{label: string; value: string; accent: string}> = ({
  label,
  value,
  accent,
}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${C.border}`,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 16,
      alignItems: 'center',
    }}
  >
    <span style={{fontSize: 20, color: C.textSecondary}}>{label}</span>
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 20,
        fontWeight: W.bold,
        color: accent,
        letterSpacing: 1.2,
      }}
    >
      {value}
    </span>
  </div>
);

const AppPanelHeader: React.FC<{eyebrow: string; title: string; meta: string}> = ({
  eyebrow,
  title,
  meta,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 12,
        color: C.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      {eyebrow}
    </div>
    <div style={{fontSize: 28, fontWeight: W.bold, letterSpacing: -0.8, lineHeight: 1.05}}>{title}</div>
    <div style={{fontSize: 16, color: C.textMuted, lineHeight: 1.32}}>{meta}</div>
  </div>
);

const MiniTab: React.FC<{text: string; active?: boolean; accent: string}> = ({
  text,
  active = false,
  accent,
}) => (
  <div
    style={{
      padding: '8px 12px',
      borderRadius: 999,
      border: `1px solid ${active ? accent : C.border}`,
      background: active ? 'rgba(96,165,250,0.09)' : 'rgba(255,255,255,0.03)',
      fontFamily: FONT.mono,
      fontSize: 12,
      color: active ? accent : C.textMuted,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

const InboxFeedCard: React.FC<{
  label: string;
  source: string;
  preview: string;
  accent: string;
}> = ({label, source, preview, accent}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accent}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12}}>
      <span style={{fontSize: 20, fontWeight: W.bold, lineHeight: 1.15}}>{label}</span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          color: accent,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
        }}
      >
        {source}
      </span>
    </div>
    <span style={{fontSize: 16, color: C.textMuted, lineHeight: 1.3}}>{preview}</span>
  </div>
);

const AgentStep: React.FC<{label: string; detail: string; accent: string; value: number}> = ({
  label,
  detail,
  accent,
  value,
}) => (
  <div
    style={{
      padding: '16px',
      borderRadius: 18,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 14px ${accent}`,
          }}
        />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 18,
            fontWeight: W.bold,
            letterSpacing: 2.2,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          color: accent,
          letterSpacing: 1.4,
        }}
      >
        {`${Math.round(value * 100)}%`}
      </span>
    </div>
    <span style={{fontSize: 18, color: C.textSecondary, lineHeight: 1.3}}>{detail}</span>
    <MiniTrack value={value} accent={accent} />
  </div>
);

const FactCard: React.FC<{label: string; value: string; accent?: string}> = ({label, value, accent}) => (
  <div
    style={{
      padding: '14px 16px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        color: C.textMuted,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div style={{fontSize: 20, fontWeight: W.bold, lineHeight: 1.15, color: accent ?? C.textPrimary}}>
      {value}
    </div>
  </div>
);

const JsonLine: React.FC<{keyName: string; value: string; accent: string}> = ({keyName, value, accent}) => (
  <div style={{display: 'flex', gap: 10, fontFamily: FONT.mono, fontSize: 15}}>
    <span style={{color: C.info}}>{`"${keyName}"`}</span>
    <span style={{color: C.textMuted}}>:</span>
    <span style={{color: accent}}>{value}</span>
  </div>
);

const RuleChip: React.FC<{text: string; accent: string}> = ({text, accent}) => (
  <div
    style={{
      padding: '8px 11px',
      borderRadius: 999,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.04)',
      fontFamily: FONT.mono,
      fontSize: 11,
      color: accent,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

const ExposureRow: React.FC<{label: string; value: number; accent: string}> = ({label, value, accent}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
    <div style={{display: 'flex', justifyContent: 'space-between', gap: 16}}>
      <span style={{fontSize: 18, color: C.textSecondary}}>{label}</span>
      <span style={{fontFamily: FONT.mono, fontSize: 18, color: C.textPrimary}}>{`${Math.round(value * 100)}%`}</span>
    </div>
    <MiniTrack value={value} accent={accent} />
  </div>
);

const CheckRow: React.FC<{label: string; detail: string; ok: boolean}> = ({label, detail, ok}) => {
  const accent = ok ? C.success : C.blocker;

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: accent,
          color: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.mono,
          fontWeight: W.bold,
          fontSize: 20,
        }}
      >
        {ok ? '✓' : '✕'}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
        <span style={{fontSize: 18, fontWeight: W.bold, lineHeight: 1.15}}>{label}</span>
        <span style={{fontSize: 15, color: C.textMuted, lineHeight: 1.3}}>{detail}</span>
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{
  title: string;
  subtitle: string;
  score: number;
  bullets: Array<{accent: string; text: string}>;
}> = ({title, subtitle, score, bullets}) => (
  <div
    style={{
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.045)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
        <span style={{fontSize: 26, fontWeight: W.bold, lineHeight: 1.1}}>{title}</span>
        <span style={{fontSize: 17, color: C.textMuted}}>{subtitle}</span>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 40,
          fontWeight: W.bold,
          lineHeight: 1,
          letterSpacing: -2,
          color: C.accent,
        }}
      >
        {score}
      </div>
    </div>
    <MiniTrack value={score / 100} accent={C.accent} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
      {bullets.map((bullet) => (
        <ReasonRow key={bullet.text} accent={bullet.accent} text={bullet.text} />
      ))}
    </div>
  </div>
);

const MiniStatCard: React.FC<{label: string; value: string; accent: string}> = ({label, value, accent}) => (
  <div
    style={{
      padding: '14px 16px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        color: C.textMuted,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 30,
        fontWeight: W.bold,
        lineHeight: 1,
        color: accent,
      }}
    >
      {value}
    </div>
  </div>
);

const MiniChartPanel: React.FC<{
  title: string;
  bars: Array<{label: string; value: number; accent: string}>;
}> = ({title, bars}) => {
  const max = Math.max(...bars.map((bar) => bar.value));

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: C.textMuted,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      {bars.map((bar) => (
        <div key={bar.label} style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 14}}>
            <span style={{color: C.textSecondary}}>{bar.label}</span>
            <span style={{fontFamily: FONT.mono, color: C.textPrimary}}>{bar.value}</span>
          </div>
          <MiniTrack value={bar.value / max} accent={bar.accent} />
        </div>
      ))}
    </div>
  );
};

const ReasonRow: React.FC<{accent: string; text: string}> = ({accent, text}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: accent,
        boxShadow: `0 0 12px ${accent}`,
      }}
    />
    <span style={{fontSize: 16, color: C.textSecondary, lineHeight: 1.3}}>{text}</span>
  </div>
);

const ToggleRow: React.FC<{label: string; from: string; to: string; accent: string}> = ({
  label,
  from,
  to,
  accent,
}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto',
      gap: 10,
      alignItems: 'center',
    }}
  >
    <span style={{fontSize: 18, fontWeight: W.bold}}>{label}</span>
    <span style={{fontFamily: FONT.mono, fontSize: 14, color: C.textMuted}}>{from}</span>
    <span style={{fontFamily: FONT.mono, fontSize: 14, color: accent}}>→</span>
    <span style={{fontFamily: FONT.mono, fontSize: 14, color: accent}}>{to}</span>
  </div>
);

const MarketViewCard: React.FC<{title: string; note: string; accent: string}> = ({
  title,
  note,
  accent,
}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accent}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <span style={{fontSize: 22, fontWeight: W.bold, lineHeight: 1.15}}>{title}</span>
    <span style={{fontSize: 16, color: C.textMuted, lineHeight: 1.3}}>{note}</span>
  </div>
);

const ScoreDeltaCard: React.FC<{
  title: string;
  before: number;
  after: number;
  accent: string;
  note: string;
}> = ({title, before, after, accent, note}) => (
  <div
    style={{
      padding: '18px 20px',
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      background: 'rgba(255,255,255,0.045)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16}}>
      <span style={{fontSize: 24, fontWeight: W.bold, lineHeight: 1.1}}>{title}</span>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.mono}}>
        <span style={{fontSize: 20, color: C.textMuted}}>{before}</span>
        <span style={{fontSize: 18, color: accent}}>→</span>
        <span style={{fontSize: 28, fontWeight: W.bold, color: accent}}>{after}</span>
      </div>
    </div>
    <MiniTrack value={after / 100} accent={accent} />
    <span style={{fontSize: 16, color: C.textMuted, lineHeight: 1.3}}>{note}</span>
  </div>
);

const MiniSourceCard: React.FC<{label: string; accent: string}> = ({label, accent}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accent}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <span style={{fontSize: 20, fontWeight: W.bold}}>{label}</span>
    <span style={{fontFamily: FONT.mono, fontSize: 13, color: C.textMuted}}>queued into one stream</span>
  </div>
);

const MiniRecRow: React.FC<{title: string; state: string; fit: string; accent: string}> = ({
  title,
  state,
  fit,
  accent,
}) => (
  <div
    style={{
      padding: '16px 18px',
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accent}`,
      background: 'rgba(255,255,255,0.04)',
      display: 'grid',
      gridTemplateColumns: '1.3fr 0.7fr 0.3fr',
      gap: 12,
      alignItems: 'center',
    }}
  >
    <span style={{fontSize: 20, fontWeight: W.bold}}>{title}</span>
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 14,
        color: accent,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
      }}
    >
      {state}
    </span>
    <span style={{fontFamily: FONT.mono, fontSize: 22, fontWeight: W.bold, textAlign: 'right'}}>{fit}</span>
  </div>
);

const MiniTrack: React.FC<{value: number; accent: string}> = ({value, accent}) => (
  <div
    style={{
      height: 8,
      borderRadius: 999,
      background: C.surfaceElev,
      overflow: 'hidden',
      boxShadow: `inset 0 0 0 1px ${C.border}`,
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        height: '100%',
        borderRadius: 999,
        background: `linear-gradient(90deg, ${accent}, ${C.accentSoft})`,
      }}
    />
  </div>
);
