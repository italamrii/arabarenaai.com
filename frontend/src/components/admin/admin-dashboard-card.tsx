import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminDashboardCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  skeletonLines?: number;
}

export function AdminDashboardCard({
  title,
  children,
  loading = false,
  className,
  skeletonLines = 1,
}: AdminDashboardCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: skeletonLines }).map((_, index) => (
              <Skeleton key={index} className={cn("h-4", index === 0 ? "w-3/4" : "w-1/2")} />
            ))}
          </div>
        ) : (
          <div>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
