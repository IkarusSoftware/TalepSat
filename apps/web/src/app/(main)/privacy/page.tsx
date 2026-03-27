export const metadata = {
  title: 'Gizlilik Politikası | TalepSat',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/50 dark:border-dark-border p-8 md:p-12">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
          Gizlilik Politikası
        </h1>
        <p className="text-body-md text-neutral-400 mb-10">
          Son güncelleme: 1 Mart 2026
        </p>

        <div className="space-y-8">

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              1. Giriş
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              TalepSat olarak kişisel verilerinizin gizliliğini ve güvenliğini ciddiye alıyoruz. Bu Gizlilik Politikası,
              platformumuzda hangi verileri topladığımızı, bu verileri nasıl kullandığımızı ve haklarınızı açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              2. Topladığımız Veriler
            </h2>
            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mb-3">
              2.1 Doğrudan Sağladığınız Veriler
            </h3>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary">
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Telefon numarası (isteğe bağlı)</li>
              <li>Şehir bilgisi</li>
              <li>Şirket adı ve vergi numarası (isteğe bağlı)</li>
              <li>Profil fotoğrafı (isteğe bağlı)</li>
            </ul>
            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mt-6 mb-3">
              2.2 Otomatik Toplanan Veriler
            </h3>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary">
              <li>IP adresi ve konum bilgisi</li>
              <li>Tarayıcı türü ve sürümü</li>
              <li>Platform kullanım verileri ve gezinme geçmişi</li>
              <li>Çerez verileri (bkz. Çerez Politikası)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              3. Verilerin Kullanım Amaçları
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Topladığımız verileri aşağıdaki amaçlarla kullanmaktayız:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary mt-4">
              <li>Platform hizmetlerinin sunulması ve geliştirilmesi</li>
              <li>Kimlik doğrulama ve güvenlik</li>
              <li>Kullanıcı desteği sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Hizmet iyileştirme ve analiz çalışmaları</li>
              <li>İzin verilmesi halinde pazarlama iletişimi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              4. Verilerin Paylaşımı
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmıyoruz:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary mt-4">
              <li>Açık rızanızın bulunması</li>
              <li>Yasal zorunluluklar</li>
              <li>Platform altyapısını sağlayan hizmet sağlayıcılarımız</li>
              <li>Ödeme işlemcileri (şifreli ve güvenli iletim ile)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              5. Veri Güvenliği
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Verilerinizi yetkisiz erişim, değiştirme, ifşa veya imhadan korumak için endüstri standardı güvenlik
              önlemleri uyguluyoruz. SSL şifreleme, güvenli sunucu altyapısı ve düzenli güvenlik denetimleri
              yürütmekteyiz.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              6. Haklarınız
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              KVKK kapsamındaki haklarınızı kullanmak için lütfen KVKK Aydınlatma Metni sayfamızı inceleyin veya
              {' '}
              <a href="mailto:kvkk@talepsat.com" className="text-accent hover:underline">
                kvkk@talepsat.com
              </a>{' '}
              adresine başvurun.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
