import { Card, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-11 w-72 max-w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-3 p-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-2 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
