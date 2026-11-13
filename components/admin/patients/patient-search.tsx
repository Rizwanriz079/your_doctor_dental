"use client";

import { ArrowUpDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function PatientSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center" aria-busy={pending}>
      <label className="relative flex h-10 min-w-0 flex-1 items-center rounded-xl bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-300 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 size-4 text-body" aria-hidden />
        <span className="sr-only">Search patients</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or email"
          className="h-full w-full min-w-0 bg-transparent pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none"
        />
      </label>
      <label className="relative flex h-10 items-center gap-2 rounded-xl bg-white pl-3 pr-2 text-sm ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-300">
        <ArrowUpDown className="size-4 text-body" aria-hidden />
        <span className="sr-only">Sort patients</span>
        <select
          value={params.get("sort") ?? "recent"}
          onChange={(e) => update({ sort: e.target.value === "recent" ? null : e.target.value })}
          className="h-full cursor-pointer appearance-none bg-transparent pr-1 font-medium text-navy-800 focus:outline-none"
        >
          <option value="recent">Most recent booking</option>
          <option value="registered">Newest registered</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
  );
}
