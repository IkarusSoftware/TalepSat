import { describe, expect, it } from 'vitest';
import {
  isRenderableImageUrl,
  normalizeAttachment,
  normalizeAttachments,
  resolveMediaUrl,
  resolveMediaUrls,
} from './media';

describe('shared/media', () => {
  it('resolves relative upload paths with a base url', () => {
    expect(resolveMediaUrl('/uploads/photo.png', 'https://app.talepsat.com')).toBe('https://app.talepsat.com/uploads/photo.png');
  });

  it('keeps absolute urls as-is', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.jpg', 'https://app.talepsat.com')).toBe('https://cdn.example.com/a.jpg');
  });

  it('filters unsupported values and de-duplicates media arrays', () => {
    expect(resolveMediaUrls([
      '/uploads/a.png',
      '/uploads/a.png',
      '',
      null,
      'notaurl',
    ], 'https://app.talepsat.com')).toEqual(['https://app.talepsat.com/uploads/a.png']);
  });

  it('detects image urls but rejects non-image attachments in galleries', () => {
    expect(isRenderableImageUrl('/uploads/pic.webp', 'https://app.talepsat.com')).toBe(true);
    expect(isRenderableImageUrl('/uploads/spec.pdf', 'https://app.talepsat.com')).toBe(false);
  });

  it('normalizes single attachments and drops invalid ones', () => {
    expect(normalizeAttachment({ url: '/uploads/file.pdf', name: 'file.pdf' }, 'https://app.talepsat.com')).toEqual({
      url: 'https://app.talepsat.com/uploads/file.pdf',
      name: 'file.pdf',
    });

    expect(normalizeAttachment({ url: 'notaurl', name: 'bad' }, 'https://app.talepsat.com')).toBeNull();
  });

  it('normalizes attachment arrays safely', () => {
    expect(normalizeAttachments([
      { url: '/uploads/a.pdf', name: 'a.pdf' },
      { url: 'https://cdn.example.com/b.pdf', name: 'b.pdf' },
      { url: '' },
    ], 'https://app.talepsat.com')).toEqual([
      { url: 'https://app.talepsat.com/uploads/a.pdf', name: 'a.pdf' },
      { url: 'https://cdn.example.com/b.pdf', name: 'b.pdf' },
    ]);
  });
});
