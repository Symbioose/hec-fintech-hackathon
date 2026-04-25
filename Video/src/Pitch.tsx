import {AbsoluteFill, Sequence} from 'remotion';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {C, FONT} from './design/tokens';
import {Hook} from './scenes/Hook';
import {Reveal} from './scenes/Reveal';
import {BeforeAfter} from './scenes/BeforeAfter';
import {HowItWorks} from './scenes/HowItWorks';
import {Differentiators} from './scenes/Differentiators';
import {GoToMarket} from './scenes/GoToMarket';

loadInter('normal', {weights: ['400', '500', '600', '700', '900'], subsets: ['latin']});
loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});

export const Pitch: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, ${C.bgMid} 0%, ${C.bg} 60%)`,
        fontFamily: FONT.sans,
        color: C.textPrimary,
        overflow: 'hidden',
      }}
    >
      {/* subtle grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(${C.border} 1px, transparent 1px),
            linear-gradient(90deg, ${C.border} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.35,
          maskImage:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 80%)',
        }}
      />

      <Sequence from={0} durationInFrames={420} layout="none">
        <Hook />
      </Sequence>
      <Sequence from={420} durationInFrames={360} layout="none">
        <Reveal />
      </Sequence>
      <Sequence from={780} durationInFrames={180} layout="none">
        <BeforeAfter />
      </Sequence>
      <Sequence from={960} durationInFrames={630} layout="none">
        <HowItWorks />
      </Sequence>
      <Sequence from={1590} durationInFrames={360} layout="none">
        <Differentiators />
      </Sequence>
      <Sequence from={1950} durationInFrames={390} layout="none">
        <GoToMarket />
      </Sequence>
    </AbsoluteFill>
  );
};
