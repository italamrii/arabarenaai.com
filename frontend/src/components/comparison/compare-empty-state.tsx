import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

interface CompareEmptyStateProps {
  title: string;
  description?: string;
  variant?: "default" | "error";
}

export function CompareEmptyState({
  title,
  description,
  variant = "default",
}: CompareEmptyStateProps) {
  const Icon = variant === "error" ? AlertCircle : Inbox;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-10 text-center",
        variant === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/70 bg-muted/20 text-muted-foreground",
      )}
    >
      <Icon className="h-8 w-8 opacity-70" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs sm:text-sm leading-relaxed">{description}</p> : null}
      </div>
    </div>
  );
}
