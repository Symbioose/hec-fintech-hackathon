import {Composition} from 'remotion';
import {LegacyPitch, LEGACY_PITCH_DURATION_IN_FRAMES} from './LegacyPitch';
import {Pitch, PITCH_DURATION_IN_FRAMES, PITCH_FULL_DURATION_IN_FRAMES, PITCH_LOOP_DURATION_IN_FRAMES, PitchFull, PitchLoop} from './Pitch';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Pitch"
        component={Pitch}
        durationInFrames={PITCH_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PitchFull"
        component={PitchFull}
        durationInFrames={PITCH_FULL_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PitchLoop"
        component={PitchLoop}
        durationInFrames={PITCH_LOOP_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PitchLegacy"
        component={LegacyPitch}
        durationInFrames={LEGACY_PITCH_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
