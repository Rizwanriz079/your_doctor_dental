"use client";

import { motion, MotionConfig, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { duration, easeOut, stagger as staggerToken } from "@/lib/motion";

/** Global motion settings: honour the OS "reduce motion" preference everywhere. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: duration.medium, ease: easeOut }}>{children}</MotionConfig>;
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
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: duration.medium, ease: easeOut, delay }}
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
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
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
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: duration.medium, ease: easeOut } },
      }}
      {...(props as object)}
    >
      {children}
    </Comp>
  );
}
