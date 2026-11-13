"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { duration, easeOut } from "@/lib/motion";
import type { GalleryImage } from "@/lib/types";
import { cn, mediaUrl } from "@/lib/utils";

export function Gallery({ images }: { images: GalleryImage[] }) {
  const items = images.filter((i) => i.path).map((i) => ({ ...i, src: mediaUrl(i.path)! }));
  const [index, setIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
  }, []);
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") {
        // Keep focus inside the three lightbox controls.
        const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-lightbox] button"));
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [index, close, step]);

  if (items.length === 0) return null;
  const current = index === null ? null : items[index];

  return (
    <>
      <Stagger className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 md:grid-cols-4">
        {items.map((img, i) => (
          <StaggerItem
            key={img.path}
            className={cn("relative min-w-0", i % 5 === 0 && "row-span-2 md:col-span-2", i % 5 === 3 && "md:col-span-2")}
          >
            <button
              type="button"
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setIndex(i);
              }}
              className="group relative block h-full w-full overflow-hidden rounded-2xl bg-muted"
              aria-label={`Open image: ${img.alt || "clinic photo"}`}
            >
              <Image
                src={img.src}
                alt={img.alt || "Clinic photo"}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />
              <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/85 text-navy-800 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                <Expand className="size-4" />
              </span>
            </button>
          </StaggerItem>
        ))}
      </Stagger>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {current && (
              <motion.div
                data-lightbox
                role="dialog"
                aria-modal="true"
                aria-label={`Image ${index! + 1} of ${items.length}`}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-900/90 p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.normal }}
                onClick={(e) => e.target === e.currentTarget && close()}
              >
                <motion.figure
                  key={current.path}
                  className="relative flex max-h-full w-full max-w-5xl flex-col items-center"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: duration.normal, ease: easeOut }}
                >
                  <div className="relative aspect-[4/3] max-h-[78dvh] w-full">
                    <Image src={current.src} alt={current.alt || "Clinic photo"} fill sizes="90vw" className="object-contain" />
                  </div>
                  {current.alt && <figcaption className="mt-3 text-center text-sm text-navy-100">{current.alt}</figcaption>}
                </motion.figure>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                  aria-label="Close image"
                >
                  <X className="size-5" aria-hidden />
                </button>
                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="size-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      aria-label="Next image"
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
