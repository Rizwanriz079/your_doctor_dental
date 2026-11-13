import { Card, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading patient">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="space-y-3 p-6">
          <Skeleton className="size-14" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </Card>
        <Card className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </Card>
      </div>
    </div>
  );
}
