export type LegalDocumentSlug = 'terms' | 'privacy' | 'kvkk' | 'cookies';

type ParagraphBlock = {
  type: 'paragraph';
  text: string;
};

type ListBlock = {
  type: 'list';
  items: string[];
};

type TableBlock = {
  type: 'table';
  headers: string[];
  rows: string[][];
};

type ContactBlock = {
  type: 'contact';
  items: Array<{
    label: string;
    value: string;
    href?: string;
  }>;
};

export type LegalBlock = ParagraphBlock | ListBlock | TableBlock | ContactBlock;

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  metaLines: string[];
  sections: LegalSection[];
};

export const legalDocuments: Record<LegalDocumentSlug, LegalDocument> = {
  terms: {
    slug: 'terms',
    title: 'Kullanım Şartları',
    metaLines: ['Son güncelleme: 1 Mart 2026'],
    sections: [
      {
        title: '1. Genel Hükümler',
        blocks: [
          {
            type: 'paragraph',
            text: 'Bu Kullanım Şartları ("Şartlar"), TalepSat platformunu ("Platform") kullanan tüm kullanıcılar için geçerlidir. Platforma erişim sağlayarak veya hesap oluşturarak bu şartları kabul etmiş sayılırsınız. Bu şartları kabul etmiyorsanız lütfen platformu kullanmayınız.',
          },
          {
            type: 'paragraph',
            text: 'TalepSat, alıcılar ile satıcıları bir araya getiren ters açık artırma modeliyle çalışan bir pazar yeri platformudur. Platform üzerinden gerçekleştirilen tüm işlemler kullanıcıların kendi sorumluluğundadır.',
          },
        ],
      },
      {
        title: '2. Hesap Oluşturma ve Güvenlik',
        blocks: [
          {
            type: 'paragraph',
            text: "Platform'u kullanmak için geçerli bir e-posta adresi ile kayıt olmanız gerekmektedir. Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız ve üçüncü şahısların hesabınıza erişimine izin vermeyiniz.",
          },
          {
            type: 'paragraph',
            text: '2.1 Hesap Gereksinimleri',
          },
          {
            type: 'list',
            items: [
              '18 yaşından büyük olmanız gerekmektedir.',
              'Gerçek ve doğru bilgiler sağlamalısınız.',
              'Her kullanıcı yalnızca bir hesap oluşturabilir.',
              'Hesap bilgilerinizi güncel tutmakla yükümlüsünüz.',
            ],
          },
        ],
      },
      {
        title: '3. İlan Oluşturma Kuralları',
        blocks: [
          {
            type: 'paragraph',
            text: 'Alıcılar, satın almak istedikleri ürün veya hizmetlere ilişkin ilan oluşturabilir. İlanlar aşağıdaki kurallara uygun olmalıdır:',
          },
          {
            type: 'paragraph',
            text: '3.1 Yasaklı İçerikler',
          },
          {
            type: 'list',
            items: [
              'Yasadışı ürün veya hizmetlere ilişkin ilanlar',
              'Yanıltıcı veya aldatıcı içerikler',
              'Telif hakkı ihlali içeren materyaller',
              'Uygunsuz, hakaret içeren veya ayrımcı ifadeler',
            ],
          },
        ],
      },
      {
        title: '4. Teklif ve İşlem Süreci',
        blocks: [
          {
            type: 'paragraph',
            text: 'Satıcılar, aktif ilanlara teklif verebilir. Alıcı bir teklifi kabul ettiğinde, taraflar arasında bağlayıcı bir anlaşma oluşur. TalepSat, taraflar arasındaki anlaşmazlıklarda arabulucu olmayı amaçlar; ancak anlaşmazlıkların çözümünden doğrudan sorumlu değildir.',
          },
          {
            type: 'paragraph',
            text: 'Platform üzerinden gerçekleştirilen ödeme işlemlerinde hizmet bedeli alınabilir. Güncel ücret bilgisi için Fiyatlandırma sayfamızı inceleyebilirsiniz.',
          },
        ],
      },
      {
        title: '5. Sorumluluk Sınırlaması',
        blocks: [
          {
            type: 'paragraph',
            text: 'TalepSat, kullanıcılar arasındaki işlemlerden kaynaklanan zararlar için sorumlu tutulamaz. Platform, "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz veya hatasız çalışacağı garanti edilmemektedir.',
          },
        ],
      },
      {
        title: '6. Şartların Değiştirilmesi',
        blocks: [
          {
            type: 'paragraph',
            text: 'TalepSat, bu şartları istediği zaman değiştirme hakkını saklı tutar. Önemli değişiklikler e-posta yoluyla bildirilecektir. Değişikliklerden sonra platformu kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.',
          },
        ],
      },
      {
        title: '7. İletişim',
        blocks: [
          {
            type: 'paragraph',
            text: 'Bu şartlarla ilgili sorularınız için aşağıdaki adresten bize ulaşabilirsiniz:',
          },
          {
            type: 'contact',
            items: [
              {
                label: 'E-posta',
                value: 'destek@talepsat.com',
                href: 'mailto:destek@talepsat.com',
              },
            ],
          },
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Gizlilik Politikası',
    metaLines: ['Son güncelleme: 1 Mart 2026'],
    sections: [
      {
        title: '1. Giriş',
        blocks: [
          {
            type: 'paragraph',
            text: 'TalepSat olarak kişisel verilerinizin gizliliğini ve güvenliğini ciddiye alıyoruz. Bu Gizlilik Politikası, platformumuzda hangi verileri topladığımızı, bu verileri nasıl kullandığımızı ve haklarınızı açıklamaktadır.',
          },
        ],
      },
      {
        title: '2. Topladığımız Veriler',
        blocks: [
          {
            type: 'paragraph',
            text: '2.1 Doğrudan Sağladığınız Veriler',
          },
          {
            type: 'list',
            items: [
              'Ad ve soyad',
              'E-posta adresi',
              'Telefon numarası (isteğe bağlı)',
              'Şehir bilgisi',
              'Şirket adı ve vergi numarası (isteğe bağlı)',
              'Profil fotoğrafı (isteğe bağlı)',
            ],
          },
          {
            type: 'paragraph',
            text: '2.2 Otomatik Toplanan Veriler',
          },
          {
            type: 'list',
            items: [
              'IP adresi ve konum bilgisi',
              'Tarayıcı türü ve sürümü',
              'Platform kullanım verileri ve gezinme geçmişi',
              'Çerez verileri (bkz. Çerez Politikası)',
            ],
          },
        ],
      },
      {
        title: '3. Verilerin Kullanım Amaçları',
        blocks: [
          {
            type: 'paragraph',
            text: 'Topladığımız verileri aşağıdaki amaçlarla kullanmaktayız:',
          },
          {
            type: 'list',
            items: [
              'Platform hizmetlerinin sunulması ve geliştirilmesi',
              'Kimlik doğrulama ve güvenlik',
              'Kullanıcı desteği sağlanması',
              'Yasal yükümlülüklerin yerine getirilmesi',
              'Hizmet iyileştirme ve analiz çalışmaları',
              'İzin verilmesi halinde pazarlama iletişimi',
            ],
          },
        ],
      },
      {
        title: '4. Verilerin Paylaşımı',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmıyoruz:',
          },
          {
            type: 'list',
            items: [
              'Açık rızanızın bulunması',
              'Yasal zorunluluklar',
              'Platform altyapısını sağlayan hizmet sağlayıcılarımız',
              'Ödeme işlemcileri (şifreli ve güvenli iletim ile)',
            ],
          },
        ],
      },
      {
        title: '5. Veri Güvenliği',
        blocks: [
          {
            type: 'paragraph',
            text: 'Verilerinizi yetkisiz erişim, değiştirme, ifşa veya imhadan korumak için endüstri standardı güvenlik önlemleri uyguluyoruz. SSL şifreleme, güvenli sunucu altyapısı ve düzenli güvenlik denetimleri yürütmekteyiz.',
          },
        ],
      },
      {
        title: '6. Haklarınız',
        blocks: [
          {
            type: 'paragraph',
            text: 'KVKK kapsamındaki haklarınızı kullanmak için lütfen KVKK Aydınlatma Metni sayfamızı inceleyin veya aşağıdaki e-posta adresine başvurun:',
          },
          {
            type: 'contact',
            items: [
              {
                label: 'E-posta',
                value: 'kvkk@talepsat.com',
                href: 'mailto:kvkk@talepsat.com',
              },
            ],
          },
        ],
      },
    ],
  },
  kvkk: {
    slug: 'kvkk',
    title: 'KVKK Aydınlatma Metni',
    metaLines: [
      '6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında',
      'Son güncelleme: 1 Mart 2026',
    ],
    sections: [
      {
        title: '1. Veri Sorumlusu',
        blocks: [
          {
            type: 'paragraph',
            text: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla TalepSat Teknoloji A.Ş. ("Şirket") tarafından aşağıda açıklanan kapsamda işlenecektir.',
          },
        ],
      },
      {
        title: '2. İşlenen Kişisel Veriler',
        blocks: [
          {
            type: 'paragraph',
            text: 'Şirketimiz tarafından aşağıdaki kişisel veri kategorileri işlenmektedir:',
          },
          {
            type: 'list',
            items: [
              'Kimlik Verileri: Ad, soyad',
              'İletişim Verileri: E-posta adresi, telefon numarası, şehir',
              'İşlem Güvenliği Verileri: IP adresi, şifrelenmiş parola',
              'Müşteri İşlem Verileri: İlan ve teklif geçmişi, mesajlaşma kayıtları',
              'Görsel Veriler: Profil fotoğrafı (isteğe bağlı)',
              'Finansal Veriler: Ödeme geçmişi (ödeme işlemcisi üzerinden)',
            ],
          },
        ],
      },
      {
        title: '3. Kişisel Verilerin İşlenme Amaçları',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:',
          },
          {
            type: 'list',
            items: [
              'Üyelik işlemlerinin gerçekleştirilmesi ve hesap yönetimi',
              'Platform hizmetlerinin sunulması ve geliştirilmesi',
              'Kullanıcı güvenliğinin sağlanması ve doğrulanması',
              'Hukuki yükümlülüklerin yerine getirilmesi',
              'Müşteri destek hizmetlerinin sunulması',
              'Platformun teknik işleyişinin sağlanması',
              'İstatistiksel analizler ve raporlama',
            ],
          },
        ],
      },
      {
        title: '4. Kişisel Verilerin Aktarılması',
        blocks: [
          {
            type: 'paragraph',
            text: "Kişisel verileriniz, KVKK'nın 8. ve 9. maddeleri kapsamında aşağıdaki taraflara aktarılabilir:",
          },
          {
            type: 'list',
            items: [
              'Hizmet alınan altyapı ve bulut hizmeti sağlayıcıları',
              'Ödeme işlemlerini gerçekleştiren finans kuruluşları',
              'Yetkili kamu kurum ve kuruluşları (yasal zorunluluk halinde)',
              'Denetim ve danışmanlık hizmeti sağlayıcıları',
            ],
          },
        ],
      },
      {
        title: '5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kişisel verileriniz; platform kayıt formu, kullanım sırasında oluşturulan veriler ve çerezler aracılığıyla elektronik ortamda toplanmaktadır. İşleme faaliyetlerinin hukuki dayanakları şunlardır:',
          },
          {
            type: 'list',
            items: [
              "Sözleşmenin kurulması veya ifası (KVKK m. 5/2-c)",
              "Veri sorumlusunun hukuki yükümlülüğü (KVKK m. 5/2-ç)",
              "İlgili kişinin açık rızası (KVKK m. 5/1)",
              "Meşru menfaat (KVKK m. 5/2-f)",
            ],
          },
        ],
      },
      {
        title: '6. KVKK Kapsamındaki Haklarınız',
        blocks: [
          {
            type: 'paragraph',
            text: "KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:",
          },
          {
            type: 'list',
            items: [
              'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
              'Kişisel verilerinize ilişkin bilgi talep etme',
              'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
              'Yurt içi veya yurt dışındaki aktarıldığı üçüncü kişileri öğrenme',
              'Eksik veya yanlış işlenmiş verilerin düzeltilmesini talep etme',
              "KVKK m. 7'de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini talep etme",
              'Verilerinizin aktarıldığı üçüncü kişilere yukarıdaki işlemlerin bildirilmesini isteme',
              'Münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
              'Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme',
            ],
          },
        ],
      },
      {
        title: '7. Başvuru Yöntemi',
        blocks: [
          {
            type: 'paragraph',
            text: 'Yukarıdaki haklarınızı kullanmak amacıyla başvurularınızı aşağıdaki kanallar üzerinden iletebilirsiniz:',
          },
          {
            type: 'contact',
            items: [
              {
                label: 'E-posta',
                value: 'kvkk@talepsat.com',
                href: 'mailto:kvkk@talepsat.com',
              },
              {
                label: 'Posta',
                value: 'TalepSat Teknoloji A.Ş., [Adres], İstanbul, Türkiye',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Başvurularınız en geç 30 gün içinde sonuçlandırılacaktır. Talebin niteliğine göre ücretsiz olarak yerine getirilecek; ancak ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.',
          },
        ],
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Çerez Politikası',
    metaLines: ['Son güncelleme: 1 Mart 2026'],
    sections: [
      {
        title: '1. Çerez Nedir?',
        blocks: [
          {
            type: 'paragraph',
            text: 'Çerezler (cookies), web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Bu dosyalar, platformumuzu her ziyaret ettiğinizde sizi tanımlamamızı ve deneyiminizi kişiselleştirmemizi sağlar.',
          },
        ],
      },
      {
        title: '2. Kullandığımız Çerez Türleri',
        blocks: [
          {
            type: 'paragraph',
            text: '2.1 Zorunlu Çerezler',
          },
          {
            type: 'paragraph',
            text: 'Platformun temel işlevlerini yerine getirmek için gereklidir. Bu çerezler olmadan oturum açma, güvenlik gibi temel özellikler çalışmaz. Bu çerezleri devre dışı bırakamazsınız.',
          },
          {
            type: 'table',
            headers: ['Çerez Adı', 'Amaç', 'Süre'],
            rows: [
              ['authjs.session-token', 'Oturum yönetimi', '30 gün'],
              ['authjs.csrf-token', 'CSRF koruması', 'Oturum'],
            ],
          },
          {
            type: 'paragraph',
            text: '2.2 Tercih Çerezleri',
          },
          {
            type: 'paragraph',
            text: 'Dil, tema (aydınlık/karanlık mod) ve diğer tercihlerinizi hatırlamak için kullanılır.',
          },
          {
            type: 'paragraph',
            text: '2.3 Analitik Çerezler',
          },
          {
            type: 'paragraph',
            text: 'Platformumuzun nasıl kullanıldığını anlamamıza yardımcı olur. Bu veriler toplu halde işlenir ve kişisel kimliğinizi açığa çıkarmaz.',
          },
        ],
      },
      {
        title: '3. Çerez Yönetimi',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Zorunlu çerezleri devre dışı bırakmanız, platformun bazı işlevlerinin çalışmamasına neden olabilir. Tarayıcınıza özgü talimatlar için tarayıcı destek sayfasını ziyaret edin.',
          },
        ],
      },
      {
        title: '4. Üçüncü Taraf Çerezleri',
        blocks: [
          {
            type: 'paragraph',
            text: 'Bazı üçüncü taraf hizmetleri (ödeme altyapısı, analitik araçlar) kendi çerezlerini kullanabilir. Bu çerezler ilgili üçüncü tarafların gizlilik politikalarına tabidir.',
          },
        ],
      },
      {
        title: '5. İletişim',
        blocks: [
          {
            type: 'paragraph',
            text: 'Çerez politikamıza ilişkin sorularınız için aşağıdaki adrese yazabilirsiniz:',
          },
          {
            type: 'contact',
            items: [
              {
                label: 'E-posta',
                value: 'destek@talepsat.com',
                href: 'mailto:destek@talepsat.com',
              },
            ],
          },
        ],
      },
    ],
  },
};

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  return legalDocuments[slug];
}
