import { prisma } from '@/lib/prisma';
import { Wrench } from 'lucide-react';

export default async function MaintenancePage() {
  let message = 'Sitemiz şu an bakımda. Lütfen daha sonra tekrar deneyin.';
  let siteName = 'TalepSat';

  try {
    const [msgSetting, nameSetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: 'maintenance_message' } }),
      prisma.siteSetting.findUnique({ where: { key: 'site_name' } }),
    ]);
    if (msgSetting?.value)  message  = msgSetting.value;
    if (nameSetting?.value) siteName = nameSetting.value;
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Wrench size={36} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
          Bakım Yapılıyor
        </h1>

        {/* Message */}
        <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed mb-8">
          {message}
        </p>

        {/* Site name */}
        <p className="text-sm text-neutral-400 font-medium">{siteName}</p>
      </div>
    </div>
  );
}
