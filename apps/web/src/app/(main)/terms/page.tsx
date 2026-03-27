export const metadata = {
  title: 'Kullanım Şartları | TalepSat',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/50 dark:border-dark-border p-8 md:p-12">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
          Kullanım Şartları
        </h1>
        <p className="text-body-md text-neutral-400 mb-10">
          Son güncelleme: 1 Mart 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              1. Genel Hükümler
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Bu Kullanım Şartları (&ldquo;Şartlar&rdquo;), TalepSat platformunu (&ldquo;Platform&rdquo;) kullanan tüm kullanıcılar
              için geçerlidir. Platforma erişim sağlayarak veya hesap oluşturarak bu şartları kabul etmiş sayılırsınız.
              Bu şartları kabul etmiyorsanız lütfen platformu kullanmayınız.
            </p>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed mt-4">
              TalepSat, alıcılar ile satıcıları bir araya getiren ters açık artırma modeliyle çalışan bir pazar yeri
              platformudur. Platform üzerinden gerçekleştirilen tüm işlemler kullanıcıların kendi sorumluluğundadır.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              2. Hesap Oluşturma ve Güvenlik
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Platform&apos;u kullanmak için geçerli bir e-posta adresi ile kayıt olmanız gerekmektedir. Hesabınızın
              güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız ve üçüncü şahısların hesabınıza erişimine
              izin vermeyiniz.
            </p>
            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mt-6 mb-3">
              2.1 Hesap Gereksinimleri
            </h3>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary">
              <li>18 yaşından büyük olmanız gerekmektedir.</li>
              <li>Gerçek ve doğru bilgiler sağlamalısınız.</li>
              <li>Her kullanıcı yalnızca bir hesap oluşturabilir.</li>
              <li>Hesap bilgilerinizi güncel tutmakla yükümlüsünüz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              3. İlan Oluşturma Kuralları
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Alıcılar, satın almak istedikleri ürün veya hizmetlere ilişkin ilan oluşturabilir. İlanlar aşağıdaki
              kurallara uygun olmalıdır:
            </p>
            <h3 className="text-h3 font-semibold text-neutral-800 dark:text-dark-textPrimary mt-6 mb-3">
              3.1 Yasaklı İçerikler
            </h3>
            <ul className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary">
              <li>Yasadışı ürün veya hizmetlere ilişkin ilanlar</li>
              <li>Yanıltıcı veya aldatıcı içerikler</li>
              <li>Telif hakkı ihlali içeren materyaller</li>
              <li>Uygunsuz, hakaret içeren veya ayrımcı ifadeler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              4. Teklif ve İşlem Süreci
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Satıcılar, aktif ilanlara teklif verebilir. Alıcı bir teklifi kabul ettiğinde, taraflar arasında bağlayıcı
              bir anlaşma oluşur. TalepSat, taraflar arasındaki anlaşmazlıklarda arabulucu olmayı amaçlar; ancak
              anlaşmazlıkların çözümünden doğrudan sorumlu değildir.
            </p>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed mt-4">
              Platform üzerinden gerçekleştirilen ödeme işlemlerinde hizmet bedeli alınabilir. Güncel ücret
              bilgisi için Fiyatlandırma sayfamızı inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              5. Sorumluluk Sınırlaması
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              TalepSat, kullanıcılar arasındaki işlemlerden kaynaklanan zararlar için sorumlu tutulamaz. Platform,
              &ldquo;olduğu gibi&rdquo; sunulmaktadır. Hizmetin kesintisiz veya hatasız çalışacağı garanti edilmemektedir.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              6. Şartların Değiştirilmesi
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              TalepSat, bu şartları istediği zaman değiştirme hakkını saklı tutar. Önemli değişiklikler e-posta
              yoluyla bildirilecektir. Değişikliklerden sonra platformu kullanmaya devam etmeniz, güncel şartları
              kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
              7. İletişim
            </h2>
            <p className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed">
              Bu şartlarla ilgili sorularınız için{' '}
              <a href="mailto:destek@talepsat.com" className="text-accent hover:underline">
                destek@talepsat.com
              </a>{' '}
              adresinden bize ulaşabilirsiniz.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
