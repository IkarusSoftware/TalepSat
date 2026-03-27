import Link from 'next/link';

const footerLinks = {
  Platform: [
    { href: '/explore', label: 'İlanları Keşfet' },
    { href: '/create', label: 'İlan Oluştur' },
    { href: '/pricing', label: 'Satıcı Paketleri' },
    { href: '/how-it-works', label: 'Nasıl Çalışır?' },
  ],
  Şirket: [
    { href: '/about', label: 'Hakkımızda' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Kariyer' },
    { href: '/contact', label: 'İletişim' },
  ],
  Destek: [
    { href: '/faq', label: 'Sıkça Sorulan Sorular' },
    { href: '/seller-center', label: 'Satıcı Merkezi' },
    { href: '/safety', label: 'Güvenlik Merkezi' },
    { href: '/help', label: 'Yardım' },
  ],
  Yasal: [
    { href: '/terms', label: 'Kullanım Şartları' },
    { href: '/privacy', label: 'Gizlilik Politikası' },
    { href: '/cookies', label: 'Çerez Politikası' },
    { href: '/kvkk', label: 'KVKK Aydınlatma Metni' },
  ],
};

interface FooterProps {
  siteName?: string;
}

export function Footer({ siteName = 'TalepSat' }: FooterProps) {
  return (
    <footer className="bg-neutral-900 dark:bg-dark-bg text-neutral-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {siteName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-lg font-bold text-white">{siteName}</span>
            </div>
            <p className="text-body-md text-neutral-500 leading-relaxed">
              Türkiye&apos;nin ilk talep odaklı ticaret platformu.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-body-md font-semibold text-white mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-md text-neutral-500 hover:text-white transition-colors duration-fast"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-neutral-600">
            &copy; {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-body-sm text-neutral-600">
              SSL ile korunan güvenli bağlantı
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
