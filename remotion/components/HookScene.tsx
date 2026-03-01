import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from '../styles/animations';

interface HookSceneProps {
  title: string;
  subtitle?: string;
  gradient: readonly string[] | string[];
}

export const HookScene: React.FC<HookSceneProps> = ({
  title,
  subtitle,
  gradient,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const subtitleSpring = spring({
    frame: frame - 10,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${[...gradient].join(', ')})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      {/* App Logo / Name */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: 'white',
          marginBottom: 20,
          opacity: titleSpring,
          transform: `scale(${titleSpring})`,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        きょう再見
      </div>

      {/* Main Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.3,
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 50}px)`,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.9)',
            marginTop: 24,
            textAlign: 'center',
            opacity: Math.max(0, subtitleSpring),
            transform: `translateY(${(1 - Math.max(0, subtitleSpring)) * 30}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
