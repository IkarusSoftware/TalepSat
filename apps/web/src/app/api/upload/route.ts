import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-session';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/octet-stream',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Form verisi okunamadı' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    for (const file of files) {
      if (!(file instanceof File) || !file.name || file.size === 0) {
        return NextResponse.json({ error: 'Geçersiz dosya' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} dosyası 5MB limitini aşıyor` },
          { status: 400 }
        );
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const filename = `uploads/${randomUUID()}.${ext}`;

      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      });

      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ error: 'Dosya yükleme hatası' }, { status: 500 });
  }
}
