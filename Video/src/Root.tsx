import {Composition} from 'remotion';
import {Pitch} from './Pitch';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Pitch"
      component={Pitch}
      durationInFrames={2340}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
