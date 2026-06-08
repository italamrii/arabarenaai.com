export type AttachmentSupportLevel = "images" | "files" | "none";

const PROVIDER_ATTACHMENT_SUPPORT: Record<string, { image: boolean; pdf: boolean }> = {
  openai: { image: true, pdf: false },
  anthropic: { image: true, pdf: true },
  google: { image: true, pdf: true },
  xai: { image: false, pdf: false },
  deepseek: { image: false, pdf: false },
  qwen: { image: true, pdf: false },
  allam: { image: false, pdf: false },
};

export function providerAttachmentSupport(providerKey: string): AttachmentSupportLevel {
  const caps = PROVIDER_ATTACHMENT_SUPPORT[providerKey];
  if (!caps) return "none";
  if (caps.pdf) return "files";
  if (caps.image) return "images";
  return "none";
}

export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
