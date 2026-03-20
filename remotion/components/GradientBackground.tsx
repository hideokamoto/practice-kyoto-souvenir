import React from 'react';
import { AbsoluteFill } from 'remotion';

interface GradientBackgroundProps {
  colors: readonly string[] | string[];
  direction?: string;
  children: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  colors,
  direction = '135deg',
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${direction}, ${colors.join(', ')})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
