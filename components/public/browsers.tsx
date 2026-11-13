"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { DoctorWithServices, Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DoctorCard, ServiceCard } from "./cards";

function FilterBar({
  query,
  setQuery,
  placeholder,
  options,
  active,
  setActive,
  label,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
  options: string[];
  active: string;
  setActive: (v: string) => void;
  label: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label={label} className="-mx-1 flex flex-wrap gap-2 px-1">
        {["All", ...options].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setActive(opt)}
            aria-pressed={active === opt}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
              active === opt ? "bg-navy-800 text-white" : "bg-white text-navy-700 ring-1 ring-line hover:bg-muted",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <label className="relative block w-full lg:max-w-xs">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-body" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </label>
    </div>
  );
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matches found"
      description="Try a different search term or category."
      action={
        <Button variant="secondary" onClick={onReset}>
          Clear filters
        </Button>
      }
    />
  );
}

export function ServicesBrowser({ services, currency }: { services: Service[]; currency: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category))).sort(), [services]);
  const filtered = services.filter(
    (s) =>
      (category === "All" || s.category === category) &&
      `${s.name} ${s.short_description} ${s.category}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const showFilters = services.length > 6 || categories.length > 1;
  return (
    <>
      {showFilters && (
        <FilterBar
          query={query}
          setQuery={setQuery}
          placeholder="Search services"
          options={categories}
          active={category}
          setActive={setCategory}
          label="Filter services by category"
        />
      )}
      <p className="sr-only" aria-live="polite">
        {filtered.length} services shown
      </p>
      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map((s) => (
            <div key={s.id} className="min-w-0">
              <ServiceCard service={s} currency={currency} />
            </div>
          ))}
        </div>
      ) : (
        <NoResults
          onReset={() => {
            setQuery("");
            setCategory("All");
          }}
        />
      )}
    </>
  );
}

export function DoctorsBrowser({ doctors }: { doctors: DoctorWithServices[] }) {
  const [query, setQuery] = useState("");
  const [spec, setSpec] = useState("All");
  const specs = useMemo(() => Array.from(new Set(doctors.map((d) => d.specialization))).sort(), [doctors]);
  const filtered = doctors.filter(
    (d) =>
      (spec === "All" || d.specialization === spec) &&
      `${d.full_name} ${d.specialization} ${d.services.map((s) => s.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      {doctors.length > 3 && (
        <FilterBar
          query={query}
          setQuery={setQuery}
          placeholder="Search by name or treatment"
          options={specs}
          active={spec}
          setActive={setSpec}
          label="Filter doctors by specialization"
        />
      )}
      <p className="sr-only" aria-live="polite">
        {filtered.length} doctors shown
      </p>
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d) => (
            <div key={d.id} className="min-w-0">
              <DoctorCard doctor={d} />
            </div>
          ))}
        </div>
      ) : (
        <NoResults
          onReset={() => {
            setQuery("");
            setSpec("All");
          }}
        />
      )}
    </>
  );
}
