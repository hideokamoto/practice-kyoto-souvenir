export const theme = {
  colors: {
    primary: '#dc2626',     // 京都の赤（鳥居・紅葉）
    secondary: '#b91c1c',
    accent: '#f59e0b',      // 金閣寺の金
    dark: '#1c1917',
    light: '#fafaf9',
    text: '#292524',
    textLight: '#78716c',
  },
  gradients: {
    primary: ['#dc2626', '#b91c1c', '#991b1b'],
    hero: ['#fef2f2', '#ffffff', '#fffbeb'],
    dark: ['#1c1917', '#292524', '#44403c'],
    kyoto: ['#dc2626', '#f59e0b', '#059669'],
    autumn: ['#dc2626', '#ea580c', '#f59e0b'],
  },
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 450, // 15秒
  },
} as const;
