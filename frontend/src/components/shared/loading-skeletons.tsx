import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ComparePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      {Array.from({ length: 3 }).map((_, step) => (
        <div key={step} className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="ps-10">
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <div className="border-b border-border p-5 flex gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
