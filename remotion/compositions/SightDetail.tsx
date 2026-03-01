import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { HookScene } from '../components/HookScene';
import { CtaScene } from '../components/CtaScene';
import { SceneContainer } from '../components/SceneContainer';
import { AnimatedVideo } from '../components/AnimatedVideo';
import { GradientBackground } from '../components/GradientBackground';
import { TextOverlay } from '../components/TextOverlay';
import { theme } from '../styles/theme';

const VIDEO_SIGHT = staticFile('remotion/videos/sight-detail.webm');

export const SightDetail: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook: 0-2秒 */}
      <SceneContainer startFrame={0} endFrame={60}>
        <HookScene
          title="お気に入りの場所を見つけよう"
          subtitle="観光地の詳細情報がすぐ分かる"
          gradient={theme.gradients.autumn}
        />
      </SceneContainer>

      {/* Problem: 2-4秒 */}
      <SceneContainer startFrame={60} endFrame={120}>
        <GradientBackground colors={theme.gradients.hero}>
          <TextOverlay
            text={'ガイドブックを何冊も見比べるのは\nもう終わりにしませんか？'}
            fontSize={52}
            animation="fadeUp"
          />
        </GradientBackground>
      </SceneContainer>

      {/* Solution Demo: 4-12秒 */}
      <SceneContainer startFrame={120} endFrame={360}>
        <AnimatedVideo
          src={VIDEO_SIGHT}
          playbackRate={1.0}
        />
      </SceneContainer>

      {/* CTA: 12-15秒 */}
      <SceneContainer startFrame={360} endFrame={450}>
        <CtaScene
          text="京都の観光地を今すぐチェック"
          buttonText="無料で始める"
          gradient={theme.gradients.autumn}
        />
      </SceneContainer>
    </AbsoluteFill>
  );
};
