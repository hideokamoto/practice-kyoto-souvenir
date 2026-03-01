export const SPRING_CONFIGS = {
  bouncy:  { damping: 12, stiffness: 200, mass: 0.5 },
  smooth:  { damping: 20, stiffness: 120, mass: 0.8 },
  gentle:  { damping: 30, stiffness: 80, mass: 1 },
  snappy:  { damping: 15, stiffness: 300, mass: 0.3, overshootClamping: true },
} as const;
