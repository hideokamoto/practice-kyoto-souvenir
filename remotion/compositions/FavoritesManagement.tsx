import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { HookScene } from '../components/HookScene';
import { CtaScene } from '../components/CtaScene';
import { SceneContainer } from '../components/SceneContainer';
import { AnimatedVideo } from '../components/AnimatedVideo';
import { GradientBackground } from '../components/GradientBackground';
import { TextOverlay } from '../components/TextOverlay';
import { theme } from '../styles/theme';

const VIDEO_FAVORITES = staticFile('remotion/videos/favorites.webm');

export const FavoritesManagement: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook: 0-2秒 */}
      <SceneContainer startFrame={0} endFrame={60}>
        <HookScene
          title="気になる場所をお気に入り登録"
          subtitle="あとで見返すのも簡単"
          gradient={theme.gradients.kyoto}
        />
      </SceneContainer>

      {/* Problem: 2-4秒 */}
      <SceneContainer startFrame={60} endFrame={120}>
        <GradientBackground colors={theme.gradients.hero}>
          <TextOverlay
            text={'「あの場所どこだっけ？」\nそんな経験ありませんか？'}
            fontSize={52}
            animation="fadeUp"
          />
        </GradientBackground>
      </SceneContainer>

      {/* Solution Demo: 4-12秒 */}
      <SceneContainer startFrame={120} endFrame={360}>
        <AnimatedVideo
          src={VIDEO_FAVORITES}
          playbackRate={1.2}
        />
      </SceneContainer>

      {/* CTA: 12-15秒 */}
      <SceneContainer startFrame={360} endFrame={450}>
        <CtaScene
          text="お気に入りで京都旅を便利に"
          buttonText="きょう再見を試す"
          gradient={theme.gradients.kyoto}
        />
      </SceneContainer>
    </AbsoluteFill>
  );
};
