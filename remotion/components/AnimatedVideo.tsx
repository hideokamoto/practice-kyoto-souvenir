import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SPRING_CONFIGS } from '../styles/animations';

interface AnimatedVideoProps {
  src: string;
  playbackRate?: number;
}

export const AnimatedVideo: React.FC<AnimatedVideoProps> = ({
  src,
  playbackRate = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f4',
      }}
    >
      <div
        style={{
          width: '90%',
          height: '85%',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          opacity: scaleIn,
          transform: `scale(${0.9 + scaleIn * 0.1})`,
        }}
      >
        <OffthreadVideo
          src={src}
          playbackRate={playbackRate}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
