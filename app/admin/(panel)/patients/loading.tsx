import { Card, Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading patients">
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-6 h-4 w-96 max-w-full" />
      <Card className="bg-muted/50 p-3 sm:p-5">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <Skeleton className="size-9" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-32 md:block" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
