import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-2xl bg-bg-surface border border-border-default p-6">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-12 w-full mb-4 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-bg-surface border border-border-default p-5">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
