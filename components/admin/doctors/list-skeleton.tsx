import { Card, Skeleton } from "@/components/ui/misc";

/** Shared loading placeholder for admin list pages (header, filters, rows). */
export function ListSkeleton({ rows = 8, withFilters = true }: { rows?: number; withFilters?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className="rounded-3xl bg-muted p-3 sm:p-4">
        {withFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Skeleton className="h-10 w-72 max-w-full rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        )}
        <Card className="divide-y divide-line shadow-none">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="size-10 shrink-0" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="hidden h-4 w-28 md:block" />
              <Skeleton className="hidden h-4 w-32 lg:block" />
              <Skeleton className="ml-auto h-6 w-20 rounded-full" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function FormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
      {Array.from({ length: sections }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-4 p-6">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </Card>
      ))}
    </div>
  );
}
