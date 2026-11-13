import { Card, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading appointment">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-6 h-8 w-72 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-4 p-6">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="space-y-3 p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </Card>
      </div>
    </div>
  );
}
