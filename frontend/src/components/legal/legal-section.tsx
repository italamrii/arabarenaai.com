import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LegalSectionProps {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

export function LegalSection({ title, paragraphs, items }: LegalSectionProps) {
  return (
    <Card className="border-border/80 bg-card/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {paragraphs?.map((paragraph) => (
          <p key={paragraph} className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
        {items && items.length > 0 ? (
          <ul className="space-y-2.5" role="list">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground leading-relaxed"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
