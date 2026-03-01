import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from '../styles/animations';

interface TextOverlayProps {
  text: string;
  fontSize?: number;
  color?: string;
  animation?: 'fadeUp' | 'fadeIn' | 'scaleIn';
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  fontSize = 56,
  color = '#292524',
  animation = 'fadeUp',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const getTransform = () => {
    switch (animation) {
      case 'fadeUp':
        return `translateY(${(1 - progress) * 40}px)`;
      case 'scaleIn':
        return `scale(${0.8 + progress * 0.2})`;
      case 'fadeIn':
      default:
        return 'none';
    }
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 700,
          color,
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: progress,
          transform: getTransform(),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
