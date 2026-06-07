interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={className}>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight animate-slide-up">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl animate-slide-up">
          {subtitle}
        </p>
      )}
    </div>
  );
}
