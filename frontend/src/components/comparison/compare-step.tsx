"use client";

import { cn } from "@/lib/utils";

interface CompareStepProps {
  step: number;
  title: string;
  children: React.ReactNode;
  className?: string;
  optional?: boolean;
}

export function CompareStep({ step, title, children, className, optional }: CompareStepProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {step}
        </span>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {optional && (
            <span className="text-xs text-muted-foreground">(اختياري)</span>
          )}
        </div>
      </div>
      <div className="ps-10">{children}</div>
    </section>
  );
}
