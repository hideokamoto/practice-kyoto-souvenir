import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from '../styles/animations';

interface CtaSceneProps {
  text: string;
  buttonText?: string;
  url?: string;
  gradient: readonly string[] | string[];
}

export const CtaScene: React.FC<CtaSceneProps> = ({
  text,
  buttonText = '今すぐ試す',
  url,
  gradient,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textSpring = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const buttonSpring = spring({
    frame: frame - 15,
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const urlSpring = spring({
    frame: frame - 25,
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
        gap: 40,
      }}
    >
      {/* CTA Text */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: 'white',
          textAlign: 'center',
          opacity: textSpring,
          transform: `scale(${textSpring})`,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {text}
      </div>

      {/* Button */}
      <div
        style={{
          padding: '20px 60px',
          backgroundColor: 'white',
          borderRadius: 50,
          fontSize: 32,
          fontWeight: 700,
          color: String(gradient[0]),
          opacity: Math.max(0, buttonSpring),
          transform: `translateY(${(1 - Math.max(0, buttonSpring)) * 30}px)`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        }}
      >
        {buttonText}
      </div>

      {/* URL */}
      {url && (
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.8)',
            opacity: Math.max(0, urlSpring),
            transform: `translateY(${(1 - Math.max(0, urlSpring)) * 20}px)`,
          }}
        >
          {url}
        </div>
      )}
    </AbsoluteFill>
  );
};
