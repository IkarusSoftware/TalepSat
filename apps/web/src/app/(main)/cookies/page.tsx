export const metadata = {
  title: 'Çerez Politikası | TalepSat',
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/50 dark:border-dark-border p-8 md:p-12">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
          Çerez Politikası
        </h1>
        <p className="text-body-md text-neutral-400 mb-10">
          Son güncelleme: 1 Mart 2026
        </p>

        <div className="space-y-8">

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              1. Çerez Nedir?
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Çerezler (cookies), web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Bu
              dosyalar, platformumuzu her ziyaret ettiğinizde sizi tanımlamamızı ve deneyiminizi kişiselleştirmemizi
              sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              2. Kullandığımız Çerez Türleri
            </h2>

            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mb-3">
              2.1 Zorunlu Çerezler
            </h3>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Platformun temel işlevlerini yerine getirmek için gereklidir. Bu çerezler olmadan oturum açma,
              güvenlik gibi temel özellikler çalışmaz. Bu çerezleri devre dışı bırakamazsınız.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-body-md border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-dark-border">
                    <th className="text-left py-2 pr-4 font-semibold text-neutral-700 dark:text-dark-textPrimary">Çerez Adı</th>
                    <th className="text-left py-2 pr-4 font-semibold text-neutral-700 dark:text-dark-textPrimary">Amaç</th>
                    <th className="text-left py-2 font-semibold text-neutral-700 dark:text-dark-textPrimary">Süre</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-600 dark:text-dark-textSecondary">
                  <tr className="border-b border-neutral-100 dark:border-dark-border">
                    <td className="py-2 pr-4 font-mono text-body-sm">authjs.session-token</td>
                    <td className="py-2 pr-4">Oturum yönetimi</td>
                    <td className="py-2">30 gün</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-dark-border">
                    <td className="py-2 pr-4 font-mono text-body-sm">authjs.csrf-token</td>
                    <td className="py-2 pr-4">CSRF koruması</td>
                    <td className="py-2">Oturum</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mt-6 mb-3">
              2.2 Tercih Çerezleri
            </h3>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Dil, tema (aydınlık/karanlık mod) ve diğer tercihlerinizi hatırlamak için kullanılır.
            </p>

            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mt-6 mb-3">
              2.3 Analitik Çerezler
            </h3>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Platformumuzun nasıl kullanıldığını anlamamıza yardımcı olur. Bu veriler toplu halde işlenir ve
              kişisel kimliğinizi açığa çıkarmaz.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              3. Çerez Yönetimi
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Zorunlu çerezleri devre dışı
              bırakmanız, platformun bazı işlevlerinin çalışmamasına neden olabilir. Tarayıcınıza özgü talimatlar
              için tarayıcı destek sayfasını ziyaret edin.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              4. Üçüncü Taraf Çerezleri
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Bazı üçüncü taraf hizmetleri (ödeme altyapısı, analitik araçlar) kendi çerezlerini kullanabilir.
              Bu çerezler ilgili üçüncü tarafların gizlilik politikalarına tabidir.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              5. İletişim
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Çerez politikamıza ilişkin sorularınız için{' '}
              <a href="mailto:destek@talepsat.com" className="text-accent hover:underline">
                destek@talepsat.com
              </a>{' '}
              adresine yazabilirsiniz.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
