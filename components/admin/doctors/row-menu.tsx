"use client";

import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type RowMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "danger";
  hidden?: boolean;
};

/** Small accessible "more actions" menu (Escape / outside click closes, arrow keys move). */
export function RowMenu({ items, label = "More actions" }: { items: RowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const els = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
        const idx = els.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === "ArrowDown" ? (idx + 1) % els.length : (idx - 1 + els.length) % els.length;
        els[next]?.focus();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-lg text-body transition-colors hover:bg-muted hover:text-navy-800"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: duration.fast, ease: easeOut }}
            className="absolute right-0 top-full z-40 mt-1 w-56 origin-top-right rounded-xl border border-line bg-white p-1.5 shadow-lift"
          >
            {visible.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none",
                  item.tone === "danger"
                    ? "text-danger-700 hover:bg-danger-50 focus:bg-danger-50"
                    : "text-navy-800 hover:bg-muted focus:bg-muted",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
