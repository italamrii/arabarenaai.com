"use client";

import { Loader2, Wand2 } from "lucide-react";

import type { Category } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName } from "@/lib/i18n/display";

interface CategoryPickerProps {
  categories: Category[];
  selectedKey: string | null;
  autoDetect: boolean;
  detecting?: boolean;
  onSelect: (key: string) => void;
  onAutoDetectChange: (enabled: boolean) => void;
}

export function CategoryPicker({
  categories,
  selectedKey,
  autoDetect,
  detecting,
  onSelect,
  onAutoDetectChange,
}: CategoryPickerProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Wand2 className="h-4 w-4 text-accent" />
          <div>
            <Label htmlFor="auto-detect" className="text-sm font-medium cursor-pointer">
              {t.compare.autoDetect}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{t.compare.autoDetectHint}</p>
          </div>
        </div>
        <Switch id="auto-detect" checked={autoDetect} onCheckedChange={onAutoDetectChange} />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            disabled={autoDetect && detecting}
            onClick={() => onSelect(cat.key)}
            className={cn(
              "px-3.5 py-2 rounded-lg text-sm border transition-all duration-200",
              selectedKey === cat.key
                ? "border-accent bg-accent/15 text-accent font-medium shadow-sm shadow-accent/10"
                : "border-border/80 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground",
              autoDetect && !detecting && "opacity-70",
              autoDetect && detecting && "opacity-50 cursor-wait",
            )}
          >
            {localizedName(cat, locale)}
          </button>
        ))}
        {detecting && (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t.compare.detectingCategory}
          </span>
        )}
      </div>
    </div>
  );
}
