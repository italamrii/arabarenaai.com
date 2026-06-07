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
  const headingId = `compare-step-${step}-title`;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby={headingId}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent"
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <h2 id={headingId} className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h2>
          {optional ? (
            <span className="text-xs text-muted-foreground">(اختياري)</span>
          ) : null}
        </div>
      </div>
      <div className="ps-0 sm:ps-10">{children}</div>
    </section>
  );
}
