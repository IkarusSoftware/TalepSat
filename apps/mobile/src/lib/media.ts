import {
  isRenderableImageUrl,
  normalizeAttachment,
  normalizeAttachments,
  resolveMediaUrl,
  resolveMediaUrls,
  type MediaAttachmentLike,
} from '../../../../shared/media';
import { API_URL } from './constants';

function getMobileMediaBaseUrl() {
  return API_URL;
}

function getApiOrigin() {
  try {
    return new URL(getMobileMediaBaseUrl());
  } catch {
    return null;
  }
}

function shouldRewriteToApiOrigin(url: URL) {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
}

function alignMediaUrlToApiOrigin(url: string) {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return url;

  try {
    const parsed = new URL(url);
    if (!shouldRewriteToApiOrigin(parsed)) return url;

    parsed.protocol = apiOrigin.protocol;
    parsed.hostname = apiOrigin.hostname;
    parsed.port = apiOrigin.port;
    return parsed.toString();
  } catch {
    return url;
  }
}

export function resolveAppMediaUrl(raw: unknown) {
  const resolved = resolveMediaUrl(raw, getMobileMediaBaseUrl());
  return resolved ? alignMediaUrlToApiOrigin(resolved) : null;
}

export function resolveAppMediaUrls(values: unknown) {
  return resolveMediaUrls(values, getMobileMediaBaseUrl()).map((value) => alignMediaUrlToApiOrigin(value));
}

export function isRenderableAppImageUrl(raw: unknown) {
  return isRenderableImageUrl(raw, getMobileMediaBaseUrl());
}

export function normalizeAppAttachment<T extends MediaAttachmentLike>(attachment: T) {
  return normalizeAttachment(attachment, getMobileMediaBaseUrl());
}

export function normalizeAppAttachments<T extends MediaAttachmentLike>(attachments: unknown) {
  return normalizeAttachments<T>(attachments, getMobileMediaBaseUrl());
}
