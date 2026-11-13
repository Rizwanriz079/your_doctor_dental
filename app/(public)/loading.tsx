import { Skeleton } from "@/components/ui/misc";

export default function PublicLoading() {
  return (
    <div role="status" aria-label="Loading page" className="pb-20">
      <div className="bg-gradient-to-b from-sky-soft to-white pb-12 pt-12">
        <div className="container-page max-w-3xl space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
        </div>
      </div>
      <div className="container-page card-grid mt-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-3xl ring-1 ring-line">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="space-y-3 p-6">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
