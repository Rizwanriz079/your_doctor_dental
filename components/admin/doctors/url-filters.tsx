"use client";

import { Filter, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type SelectFilter = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  /** Label shown for the empty value. */
  allLabel?: string;
};

/**
 * Search + filter controls that keep their state in the URL, so lists are server-rendered,
 * shareable and survive refresh. Changing any filter resets pagination.
 */
export function UrlFilters({
  searchPlaceholder = "Search…",
  selects = [],
  className,
}: {
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  function push(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) push({ q: q.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(params.get("q")) || selects.some((s) => params.get(s.name));

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)} aria-busy={pending}>
      <div className="relative min-w-0 sm:w-72">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-body" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {selects.map((s) => (
          <label
            key={s.name}
            className="relative inline-flex h-10 items-center rounded-full border border-line bg-white pl-9 pr-2 text-sm text-navy-800 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 hover:border-navy-100"
          >
            <Filter className="pointer-events-none absolute left-3.5 size-3.5 text-body" aria-hidden />
            <span className="sr-only">{s.label}</span>
            <select
              value={params.get(s.name) ?? ""}
              onChange={(e) => push({ [s.name]: e.target.value || null })}
              className="h-full max-w-[12rem] cursor-pointer appearance-none bg-transparent pr-5 font-medium focus:outline-none"
            >
              <option value="">{s.allLabel ?? s.label}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-3 text-xs text-body">
              ▾
            </span>
          </label>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              push(Object.fromEntries([["q", null], ...selects.map((s) => [s.name, null])]));
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-body transition-colors hover:bg-muted hover:text-navy-800"
          >
            <X className="size-4" aria-hidden />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
