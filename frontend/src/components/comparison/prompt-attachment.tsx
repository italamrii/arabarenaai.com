"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-context";
import { ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/attachment-capabilities";
import type { UploadResult } from "@/lib/api/types";

interface PromptAttachmentProps {
  attachment: UploadResult | null;
  uploading: boolean;
  error: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return mimeType.replace("image/", "").toUpperCase();
  return mimeType;
}

export function PromptAttachment({
  attachment,
  uploading,
  error,
  onSelectFile,
  onRemove,
}: PromptAttachmentProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!ACCEPTED_ATTACHMENT_TYPES.includes(mime as (typeof ACCEPTED_ATTACHMENT_TYPES)[number])) {
      setLocalError(t.compare.attachment.invalidType);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setLocalError(t.compare.attachment.tooLarge);
      return;
    }
    onSelectFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !!attachment}
          aria-label={t.compare.attachment.attach}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
          {t.compare.attachment.attach}
        </Button>
        {uploading ? (
          <span className="text-xs text-muted-foreground">{t.compare.attachment.uploading}</span>
        ) : null}
      </div>

      {attachment ? (
        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60">
            {attachment.mime_type === "application/pdf" ? (
              <FileText className="h-4 w-4 text-accent" />
            ) : (
              <ImageIcon className="h-4 w-4 text-accent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" dir="ltr">
              {attachment.filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {fileTypeLabel(attachment.mime_type)} · {formatFileSize(attachment.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t.compare.attachment.remove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {displayError ? (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
