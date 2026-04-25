import {InvestorPitch, INVESTOR_PITCH_DURATIONS} from './investor/InvestorPitch';

export const PITCH_DURATION_IN_FRAMES = INVESTOR_PITCH_DURATIONS.vc;
export const PITCH_FULL_DURATION_IN_FRAMES = INVESTOR_PITCH_DURATIONS.full;
export const PITCH_LOOP_DURATION_IN_FRAMES = INVESTOR_PITCH_DURATIONS.loop;

export const Pitch: React.FC = () => {
  return <InvestorPitch mode="vc" />;
};

export const PitchFull: React.FC = () => {
  return <InvestorPitch mode="full" />;
};

export const PitchLoop: React.FC = () => {
  return <InvestorPitch mode="loop" />;
};
