import React from 'react';
import { Composition } from 'remotion';
import { DiscoverPage } from './compositions/DiscoverPage';
import { SightDetail } from './compositions/SightDetail';
import { FavoritesManagement } from './compositions/FavoritesManagement';
import { PlanCreation } from './compositions/PlanCreation';
import { theme } from './styles/theme';

const { width, height, fps, durationInFrames } = theme.video;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DiscoverPage"
        component={DiscoverPage}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="SightDetail"
        component={SightDetail}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="FavoritesManagement"
        component={FavoritesManagement}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="PlanCreation"
        component={PlanCreation}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
    </>
  );
};
