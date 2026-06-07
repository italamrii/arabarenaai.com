"use client";

import { Check, X } from "lucide-react";

import type { Model } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ar } from "@/i18n/ar";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  anthropic: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  google: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  deepseek: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
  qwen: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
  xai: "from-slate-400/20 to-slate-400/5 border-slate-400/30",
  allam: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
};

interface ModelPickerProps {
  models: Model[];
  selectedIds: string[];
  min?: number;
  max?: number;
  onChange: (ids: string[]) => void;
}

export function ModelPicker({ models, selectedIds, min = 2, max = 10, onChange }: ModelPickerProps) {
  const available = models.filter((m) => !m.is_placeholder);

  const toggle = (model: Model) => {
    if (model.is_placeholder) return;
    if (selectedIds.includes(model.id)) {
      onChange(selectedIds.filter((id) => id !== model.id));
    } else if (selectedIds.length < max) {
      onChange([...selectedIds, model.id]);
    }
  };

  const selectPopular = () => {
    const popular = available.slice(0, Math.min(4, max));
    onChange(popular.map((m) => m.id));
  };

  const clearSelection = () => onChange([]);

  const grouped = models.reduce<Record<string, Model[]>>((acc, model) => {
    const key = model.provider.key;
    if (!acc[key]) acc[key] = [];
    acc[key].push(model);
    return acc;
  }, {});

  const isReady = selectedIds.length >= min;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{ar.compare.modelsHint}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={selectPopular}>
            {ar.compare.selectPopular}
          </Button>
          {selectedIds.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
              {ar.compare.clearSelection}
            </Button>
          )}
          <Badge
            variant={isReady ? "default" : "secondary"}
            className={cn("tabular-nums", isReady && "bg-accent/20 text-accent border-accent/30")}
          >
            {selectedIds.length} / {max}
          </Badge>
        </div>
      </div>

      {Object.entries(grouped).map(([providerKey, providerModels]) => {
        const colorClass = PROVIDER_COLORS[providerKey] ?? "from-muted/40 to-muted/10 border-border";

        return (
          <div key={providerKey} className="space-y-2.5">
            <p className="section-label">{providerModels[0]?.provider.name_ar ?? providerKey}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {providerModels.map((model) => {
                const selected = selectedIds.includes(model.id);
                const atMax = !selected && selectedIds.length >= max;
                const disabled = model.is_placeholder || atMax;

                return (
                  <button
                    key={model.id}
                    type="button"
                    disabled={disabled && !model.is_placeholder}
                    onClick={() => toggle(model)}
                    aria-pressed={selected}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl border p-3.5 text-start transition-all duration-200",
                      "bg-gradient-to-br",
                      model.is_placeholder && "opacity-45 cursor-not-allowed border-border/40 from-transparent",
                      !model.is_placeholder && !selected && !disabled && [
                        colorClass,
                        "hover:scale-[1.01] hover:border-accent/50",
                      ],
                      !model.is_placeholder && selected && [
                        "border-accent bg-accent/15 ring-1 ring-accent/40 glow-accent scale-[1.01]",
                      ],
                      atMax && !selected && "opacity-35 cursor-not-allowed",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                        selected ? "bg-accent text-accent-foreground" : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {selected ? <Check className="h-4 w-4" /> : model.name_ar.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{model.name_ar}</p>
                      {model.is_placeholder && (
                        <Badge variant="disabled" className="mt-1 text-[10px]">
                          {ar.compare.comingSoon}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
