export type MediaAttachmentLike = {
  url: string;
  name?: string;
  type?: string;
  size?: number;
};

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.webp']);

function normalizeBaseUrl(baseUrl?: string | null) {
  if (typeof baseUrl !== 'string') return null;
  const trimmed = baseUrl.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

function normalizeRawUrl(raw: unknown) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveMediaUrl(raw: unknown, baseUrl?: string | null) {
  const value = normalizeRawUrl(raw);
  if (!value) return null;

  if (
    value.startsWith('data:')
    || value.startsWith('blob:')
    || /^https?:\/\//i.test(value)
  ) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    return normalizedBase ? `${normalizedBase}${value}` : null;
  }

  return null;
}

export function resolveMediaUrls(values: unknown, baseUrl?: string | null) {
  if (!Array.isArray(values)) return [];

  const resolved = values
    .map((value) => resolveMediaUrl(value, baseUrl))
    .filter((value): value is string => Boolean(value));

  return [...new Set(resolved)];
}

export function isRenderableImageUrl(raw: unknown, baseUrl?: string | null) {
  const resolved = resolveMediaUrl(raw, baseUrl);
  if (!resolved) return false;
  if (resolved.startsWith('data:image/')) return true;
  if (resolved.startsWith('blob:')) return true;

  try {
    const parsed = resolved.startsWith('http')
      ? new URL(resolved)
      : new URL(resolved, normalizeBaseUrl(baseUrl) || 'http://localhost');
    const pathname = parsed.pathname.toLowerCase();
    return [...IMAGE_EXTENSIONS].some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}

export function normalizeAttachment<T extends MediaAttachmentLike>(attachment: T, baseUrl?: string | null) {
  if (!attachment || typeof attachment !== 'object') return null;
  const url = resolveMediaUrl(attachment.url, baseUrl);
  if (!url) return null;
  return { ...attachment, url };
}

export function normalizeAttachments<T extends MediaAttachmentLike>(attachments: unknown, baseUrl?: string | null) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((attachment) => (
      attachment && typeof attachment === 'object'
        ? normalizeAttachment(attachment as T, baseUrl)
        : null
    ))
    .filter((attachment): attachment is T => Boolean(attachment));
}
