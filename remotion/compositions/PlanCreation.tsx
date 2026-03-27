import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { HookScene } from '../components/HookScene';
import { CtaScene } from '../components/CtaScene';
import { SceneContainer } from '../components/SceneContainer';
import { AnimatedVideo } from '../components/AnimatedVideo';
import { GradientBackground } from '../components/GradientBackground';
import { TextOverlay } from '../components/TextOverlay';
import { theme } from '../styles/theme';

const VIDEO_PLAN = staticFile('remotion/videos/plan-creation.webm');

export const PlanCreation: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook: 0-2秒 */}
      <SceneContainer startFrame={0} endFrame={60}>
        <HookScene
          title="旅行プランを簡単に作成"
          subtitle="ランダム生成もワンタップ"
          gradient={theme.gradients.dark}
        />
      </SceneContainer>

      {/* Problem: 2-4秒 */}
      <SceneContainer startFrame={60} endFrame={120}>
        <GradientBackground colors={theme.gradients.hero}>
          <TextOverlay
            text={'旅行プランを立てるのが面倒...\nもっと手軽に計画したい'}
            fontSize={52}
            animation="fadeUp"
          />
        </GradientBackground>
      </SceneContainer>

      {/* Solution Demo: 4-12秒 */}
      <SceneContainer startFrame={120} endFrame={360}>
        <AnimatedVideo
          src={VIDEO_PLAN}
          playbackRate={1.0}
        />
      </SceneContainer>

      {/* CTA: 12-15秒 */}
      <SceneContainer startFrame={360} endFrame={450}>
        <CtaScene
          text="あなたの京都旅、今すぐ計画しよう"
          buttonText="プランを作成する"
          gradient={theme.gradients.dark}
        />
      </SceneContainer>
    </AbsoluteFill>
  );
};
