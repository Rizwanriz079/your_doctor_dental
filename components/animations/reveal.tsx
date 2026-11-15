"use client";

import { motion, MotionConfig, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { MotionPreferences, useMotionPreferences } from "./motion-preferences";
import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { duration, easeOut, stagger as staggerToken } from "@/lib/motion";

/** Global motion settings: honour the OS "reduce motion" preference everywhere. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionPreferences><MotionSettings>{children}</MotionSettings></MotionPreferences>;
}

function MotionSettings({ children }: { children: ReactNode }) {
  const { paused } = useMotionPreferences();
  return <MotionConfig reducedMotion={paused ? "always" : "user"} transition={{ duration: paused ? 0 : duration.medium, ease: easeOut }}>{children}</MotionConfig>;
}

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  x?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * One consistent section reveal: fade + small rise, triggered once when 15% visible.
 * Under reduced motion the content is rendered in place with no movement.
 */
export function Reveal({ children, delay = 0, y = 18, x = 0, as = "div", ...props }: RevealProps) {
  const reduce = useSafeReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={reduce ? false : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0 : duration.slow, ease: easeOut, delay: reduce ? 0 : delay }}
      {...props}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers its <StaggerItem> children into view once. */
export function Stagger({
  children,
  className,
  gap = staggerToken,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & { gap?: number; as?: "div" | "ul" }) {
  const reduce = useSafeReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : gap } } }}
      {...(props as object)}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & { as?: "div" | "li" }) {
  const reduce = useSafeReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 18 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : duration.slow, ease: easeOut } },
      }}
      {...(props as object)}
    >
      {children}
    </Comp>
  );
}
