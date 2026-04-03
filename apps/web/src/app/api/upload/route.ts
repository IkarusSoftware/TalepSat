import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { getApiSession } from '@/lib/api-session';
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const FILE_RULES: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/octet-stream'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/octet-stream',
  ],
  txt: ['text/plain', 'application/octet-stream'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  rar: ['application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

async function hasKnownSafeSignature(file: File, extension: string) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (['jpg', 'jpeg'].includes(extension)) {
    return bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  if (extension === 'png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (extension === 'gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }

  if (extension === 'webp') {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }

  if (extension === 'pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  if (['docx', 'xlsx', 'zip'].includes(extension)) {
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  if (extension === 'rar') {
    return bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21;
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({
      key: `upload:${session.userId}:${getClientIp(req)}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit, 'Kisa surede cok fazla dosya yukleme istegi gonderildi.');
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: 'Form verisi okunamadi' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];
    if (!files.length) {
      return NextResponse.json({ error: 'Dosya bulunamadi' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `En fazla ${MAX_FILES} dosya yukleyebilirsin` }, { status: 400 });
    }

    for (const file of files) {
      if (!(file instanceof File) || !file.name || file.size <= 0) {
        return NextResponse.json({ error: 'Gecersiz dosya' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `${file.name} dosyasi 5MB limitini asiyor` }, { status: 400 });
      }

      const extension = getFileExtension(file.name);
      const allowedTypes = FILE_RULES[extension];
      if (!allowedTypes) {
        return NextResponse.json({ error: `${file.name} desteklenmeyen dosya turunde` }, { status: 400 });
      }

      const normalizedType = (file.type || 'application/octet-stream').toLowerCase();
      if (!allowedTypes.includes(normalizedType)) {
        return NextResponse.json({ error: `${file.name} izin verilmeyen bir dosya tipiyle yuklenmeye calisildi` }, { status: 400 });
      }

      const signatureValid = await hasKnownSafeSignature(file, extension);
      if (!signatureValid) {
        return NextResponse.json({ error: `${file.name} dosyasinin icerigi dogrulanamadi` }, { status: 400 });
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      const extension = getFileExtension(file.name) || 'bin';
      const filename = `uploads/${randomUUID()}.${extension}`;

      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      });

      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ error: 'Dosya yukleme hatasi' }, { status: 500 });
  }
}
