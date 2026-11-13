import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-8 h-4 w-80 max-w-full" />
      <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-wrap gap-3">
          <Skeleton className="h-11 w-64 max-w-full" />
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-36" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line py-4">
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
