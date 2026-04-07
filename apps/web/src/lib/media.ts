import { NextRequest } from 'next/server';
import {
  isRenderableImageUrl,
  normalizeAttachment,
  normalizeAttachments,
  resolveMediaUrl,
  resolveMediaUrls,
  type MediaAttachmentLike,
} from '../../../../shared/media';
import { isSafeHttpUrl } from '@/lib/security';

function cleanBaseUrl(raw?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

export function getMediaBaseUrl(req?: NextRequest) {
  const envBase = cleanBaseUrl(process.env.MEDIA_PUBLIC_BASE_URL);
  if (envBase) return envBase;

  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {}
  }

  const nextAuthBase = cleanBaseUrl(process.env.NEXTAUTH_URL);
  if (nextAuthBase) return nextAuthBase;

  const vercelUrl = cleanBaseUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }

  return null;
}

export function normalizeResponseMediaUrl(raw: unknown, req?: NextRequest) {
  return resolveMediaUrl(raw, getMediaBaseUrl(req));
}

export function normalizeResponseMediaUrls(values: unknown, req?: NextRequest) {
  return resolveMediaUrls(values, getMediaBaseUrl(req));
}

export function normalizeResponseAttachment<T extends MediaAttachmentLike>(attachment: T, req?: NextRequest) {
  return normalizeAttachment(attachment, getMediaBaseUrl(req));
}

export function normalizeResponseAttachments<T extends MediaAttachmentLike>(attachments: unknown, req?: NextRequest) {
  return normalizeAttachments<T>(attachments, getMediaBaseUrl(req));
}

export function normalizeStoredMediaUrl(raw: unknown, req?: NextRequest) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/uploads/')) {
    const canonicalBase = cleanBaseUrl(process.env.MEDIA_PUBLIC_BASE_URL);
    if (!canonicalBase) return trimmed;
    const resolved = `${canonicalBase}${trimmed}`;
    return isSafeHttpUrl(resolved) ? resolved : null;
  }

  const resolved = resolveMediaUrl(trimmed, getMediaBaseUrl(req));
  if (!resolved || resolved.startsWith('data:') || resolved.startsWith('blob:')) return null;
  return isSafeHttpUrl(resolved) ? resolved : null;
}

export function normalizeStoredMediaUrls(values: unknown, req?: NextRequest) {
  if (!Array.isArray(values)) return [];

  const normalized = values
    .map((value) => normalizeStoredMediaUrl(value, req))
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)];
}

export function normalizeStoredAttachments<T extends MediaAttachmentLike>(attachments: unknown, req?: NextRequest) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') return null;
      const normalizedUrl = normalizeStoredMediaUrl((attachment as T).url, req);
      if (!normalizedUrl) return null;
      return {
        ...(attachment as T),
        url: normalizedUrl,
      };
    })
    .filter((attachment): attachment is T => Boolean(attachment));
}

export { isRenderableImageUrl };
