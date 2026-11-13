/** Animation tokens (spec §17.1). Durations in seconds for Motion. */
export const duration = {
  fast: 0.15,
  normal: 0.25,
  medium: 0.4,
  slow: 0.6,
} as const;

export const stagger = 0.09;

/** Smooth ease-out for entrances, gentle ease-in-out for state changes. */
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: duration.medium, ease: easeOut } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.medium, ease: easeOut } },
};
