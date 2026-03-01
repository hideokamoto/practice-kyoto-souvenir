import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { HookScene } from '../components/HookScene';
import { CtaScene } from '../components/CtaScene';
import { SceneContainer } from '../components/SceneContainer';
import { AnimatedVideo } from '../components/AnimatedVideo';
import { GradientBackground } from '../components/GradientBackground';
import { TextOverlay } from '../components/TextOverlay';
import { theme } from '../styles/theme';

const VIDEO_DISCOVER = staticFile('remotion/videos/discover.webm');

export const DiscoverPage: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook: 0-2秒 - アプリ紹介 */}
      <SceneContainer startFrame={0} endFrame={60}>
        <HookScene
          title="京都の魅力を、再発見しよう"
          subtitle="きょう再見 - あなただけの京都ガイド"
          gradient={theme.gradients.primary}
        />
      </SceneContainer>

      {/* Problem: 2-4秒 - 課題提示 */}
      <SceneContainer startFrame={60} endFrame={120}>
        <GradientBackground colors={theme.gradients.hero}>
          <TextOverlay
            text={'京都の観光地、多すぎて\nどこに行けばいいか分からない...'}
            fontSize={52}
            animation="fadeUp"
          />
        </GradientBackground>
      </SceneContainer>

      {/* Solution Demo: 4-12秒 - Playwrightの録画を再生 */}
      <SceneContainer startFrame={120} endFrame={360}>
        <AnimatedVideo
          src={VIDEO_DISCOVER}
          playbackRate={1.2}
        />
      </SceneContainer>

      {/* CTA: 12-15秒 */}
      <SceneContainer startFrame={360} endFrame={450}>
        <CtaScene
          text="あなたにぴったりの京都を見つけよう"
          buttonText="きょう再見を使ってみる"
          gradient={theme.gradients.primary}
        />
      </SceneContainer>
    </AbsoluteFill>
  );
};
