import React from 'react';
import { Sequence } from 'remotion';

interface SceneContainerProps {
  startFrame: number;
  endFrame: number;
  children: React.ReactNode;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  startFrame,
  endFrame,
  children,
}) => {
  return (
    <Sequence from={startFrame} durationInFrames={endFrame - startFrame}>
      {children}
    </Sequence>
  );
};
