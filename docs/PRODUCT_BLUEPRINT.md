# TalepSat — Reverse Marketplace Platform Blueprint

> **Versiyon:** 1.0
> **Tarih:** 2026-03-25
> **Platform DNA:** Demand-Driven Reverse Marketplace

---

## 1. ÜRÜNÜN NET KONUMLANDIRMASI

### Platform Tanımı

TalepSat, klasik marketplace modelini tersine çeviren bir **talep odaklı ticaret platformu**dur. Geleneksel e-ticarette satıcı ürün listeler ve alıcı seçer. TalepSat'ta ise **alıcı ihtiyacını ilan olarak açar, satıcılar bu talebe teklif verir, alıcı en uygun teklifi seçer.** Bu model, özellikle B2B toptan alımlarda, niş ürün taleplerinde ve fiyat rekabetinin alıcı lehine çalışması gereken segmentlerde güçlü bir değer üretir.

### Pazardaki Farkı

| Klasik Marketplace | TalepSat (Reverse Marketplace) |
|---|---|
| Satıcı ürün koyar, alıcı bulur | Alıcı talep açar, satıcı bulur |
| Fiyatı satıcı belirler | Fiyat rekabeti satıcılar arasında oluşur |
| Alıcı arar, karşılaştırır, yorulur | Alıcı oturur, teklifler gelir |
| Satıcı stok riski taşır | Satıcı yalnızca gerçek talebe yanıt verir |
| Ürün odaklı keşif | İhtiyaç odaklı eşleşme |
| Sepete ekle → satın al | İlan aç → teklif al → seç → anlaş |

### Ana Değer Önerisi

**Alıcıya:** "İhtiyacını yaz, satıcılar sana gelsin. En iyi fiyatı, en güvenilir satıcıdan al."
**Satıcıya:** "Gerçek müşteri taleplerini gör, zaman kaybetmeden teklif ver, satışını garanti et."
**Platforma:** Gerçek talep-verisi üzerinden çalışan, düşük iade oranı ve yüksek conversion sağlayan sürdürülebilir ticaret modeli.

---

## 2. TEKNOLOJİ ÖNERİSİ

### Neden Bu Stack?

Karar kriterleri: web + mobil arasında **maksimum kod paylaşımı**, **premium UI/UX** kapasitesi, **hız**, **ölçeklenebilirlik** ve .NET backend ile sorunsuz entegrasyon.

### Seçilen Stack

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| **Web Frontend** | **Next.js 15 (App Router)** + React 19 + TypeScript | SSR/SSG ile SEO desteği (landing, ilan sayfaları), React Server Components ile performans, App Router ile layout sistemi, middleware ile auth/role yönetimi |
| **Mobil Frontend** | **Expo (SDK 52+)** + React Native + TypeScript | React ekosistemini paylaşır, OTA update, push notification, EAS Build ile CI/CD, NativeWind ile Tailwind syntax |
| **Shared UI Package** | **Monorepo (Turborepo)** + shared component library | Web ve mobil arasında design tokens, tipler, validasyon şemaları, API client, util fonksiyonları paylaşılır |
| **Styling (Web)** | **Tailwind CSS 4** + CSS Variables | Utility-first, design token desteği, dark mode, JIT, küçük bundle |
| **Styling (Mobil)** | **NativeWind 4** | Tailwind syntax'ını React Native'de kullanır, web ile aynı class isimleri |
| **State Management** | **Zustand** + Context (auth/theme) | Minimal boilerplate, TypeScript dostu, selector bazlı re-render, devtools desteği |
| **Server State / API** | **TanStack Query v5** | Cache, stale-while-revalidate, optimistic updates, infinite scroll, offline desteği |
| **Form Yönetimi** | **React Hook Form** + **Zod** | Performanslı (uncontrolled), schema-first validation, web ve mobil'de aynı Zod şemaları |
| **Animasyon (Web)** | **Framer Motion 12** | Declarative, layout animations, AnimatePresence, gesture desteği |
| **Animasyon (Mobil)** | **React Native Reanimated 3** + Moti | 60fps native thread animasyonları, Moti ile Framer Motion benzeri API |
| **Gerçek Zamanlı** | **SignalR** (.NET tarafı) + WebSocket client | Canlı teklif bildirimleri, mesajlaşma, ilan güncellemeleri |
| **Push Notification** | **Expo Notifications** + Firebase FCM | Cross-platform push, scheduled notifications |
| **Offline/Cache** | TanStack Query cache + **MMKV** (mobil) | Hızlı persisted cache, offline-first ilan taslakları |
| **API Client** | Shared **fetch wrapper** + Zod response validation | Type-safe API calls, interceptors, token refresh |
| **Monorepo Tooling** | **Turborepo** + pnpm workspaces | Paralel build, cache, dependency management |
| **Backend** | **.NET 8+** (Clean Architecture) | Kullanıcının tercihi, SignalR native desteği |

### Monorepo Yapısı

```
talepsat/
├── apps/
│   ├── web/          → Next.js 15 web uygulaması
│   └── mobile/       → Expo React Native uygulaması
├── packages/
│   ├── ui/           → Shared component library (Radix + custom)
│   ├── tokens/       → Design tokens (renk, spacing, tipografi)
│   ├── schemas/      → Zod validation şemaları
│   ├── api-client/   → Shared API client + types
│   └── utils/        → Ortak utility fonksiyonları
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### Neden Bu Stack En Doğru Seçim?

1. **Kod paylaşımı:** Zod şemaları, API tipleri, utility fonksiyonları, design tokenları web ve mobilde ortaktır. Aynı iş mantığını iki kez yazmak yok.
2. **SEO:** Next.js SSR/SSG ile ilan sayfaları ve landing page Google'da indexlenir. Reverse marketplace'te organik trafik kritiktir çünkü alıcılar "toptan X satın al" gibi aramalar yapar.
3. **Premium UX:** Framer Motion (web) ve Reanimated (mobil) ile brief'teki tüm animasyon gereksinimleri karşılanır.
4. **Geliştirme hızı:** Turborepo paralel build, hot reload, shared types ile ekip verimliliği maksimum.
5. **Ölçeklenebilirlik:** Next.js edge runtime, React Server Components, TanStack Query cache stratejileri ile yüksek trafik yönetimi.
6. **.NET uyumu:** REST + SignalR WebSocket. TanStack Query ile .NET API'leri type-safe consume edilir.

---

## 3. ÜRÜN MİMARİSİ

### Ana Modüller

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLATFORM CORE                            │
├──────────┬──────────┬──────────┬──────────┬─────────┬──────────┤
│  İlan    │  Teklif  │  Kullanıcı│ Abonelik │ Mesaj   │ Bildirim │
│  Sistemi │  Sistemi │  & Auth   │ Sistemi  │ Sistemi │ Sistemi  │
├──────────┼──────────┼──────────┼──────────┼─────────┼──────────┤
│  Ödeme   │  Güven & │  Admin   │ Moderasyon│Analitik │ Kampanya │
│  Escrow  │  Doğrulama│  Panel  │  Panel   │ & Rapor │ Sistemi  │
└──────────┴──────────┴──────────┴──────────┴─────────┴──────────┘
```

### 3.1 Alıcı Akışı

```
Kayıt/Giriş → Profil Tamamlama → İlan Oluştur (5 adım) → Yayınla
    → Teklifler Gelmeye Başlar (push + in-app bildirim)
    → Teklifleri İncele & Karşılaştır
    → Satıcı Profili İncele (güven skorunu kontrol et)
    → Teklifi Kabul Et veya Karşı Teklif Gönder
    → Escrow'a Ödeme Yap (opsiyonel, yüksek tutarlar için)
    → Teslimat/Hizmet Tamamlanır
    → Satıcıyı Değerlendir (yıldız + yorum)
    → Escrow Serbest Bırakılır
```

**Kritik UX Noktaları:**
- İlk ilan oluşturma deneyimi **onboarding wizard** ile yönlendirilmeli
- "Henüz teklif gelmedi" durumunda **güven veren bekleme ekranı** + tahmini süre gösterilmeli
- Teklif geldiğinde **anlık push + ses + badge** ile kullanıcı bilgilendirilmeli
- Karşılaştırma ekranı **decision-making UX** olarak çok güçlü olmalı

### 3.2 Satıcı Akışı

```
Kayıt/Giriş → Satıcı Profili Oluştur → Doğrulama Adımları
    → Abonelik Paketi Seç (zorunlu)
    → İlanları Keşfet (kategori/filtre/konum bazlı)
    → İlan Detayına Git → Teklif Ver (modal/slide-over)
    → Teklif Durumunu Takip Et (bekliyor/kabul/red)
    → Kabul Edilirse → Sipariş Sürecine Geç
    → Teslimat/Hizmet Tamamla
    → Alıcıdan Değerlendirme Al
    → Dashboard'da Performans Metriklerini Takip Et
```

**Kritik UX Noktaları:**
- Satıcı onboarding'de **kalan kota** ve **paket limitleri** her zaman görünür olmalı
- Teklif verirken "Bu ay X teklif hakkınız kaldı" uyarısı
- Teklif kabul edildiğinde **celebration animation** + next steps guide
- Kota dolduğunda **upgrade CTA** ile yumuşak upsell

### 3.3 Abonelik Sistemi (Detaylı → Bkz. Bölüm 5)

### 3.4 Admin Paneli

**Dashboard:**
- Günlük/haftalık/aylık yeni ilan sayısı, teklif sayısı, tamamlanan işlem
- Aktif kullanıcı (DAU/MAU), conversion rate (ilan → teklif → kabul)
- Gelir (abonelik + komisyon), MRR, churn rate
- Moderasyon kuyruğu özeti

**Yönetim Modülleri:**
- Kullanıcı yönetimi (ban, suspend, verify, role değiştir)
- İlan yönetimi (onay, red, düzenleme, kaldırma)
- Teklif yönetimi (şüpheli teklif inceleme)
- Abonelik yönetimi (manuel plan değişikliği, kota ayarları)
- Kategori yönetimi (CRUD, sıralama, ikon atama)
- Anlaşmazlık yönetimi (dispute queue)
- Rapor ve analitik (dışa aktarılabilir)
- Platform ayarları (komisyon oranı, limit değerleri, feature flags)

### 3.5 Moderasyon Paneli

- **İlan moderasyonu:** Otomatik (ML-based metin/görsel tarama) + manuel kuyruk
- **Teklif moderasyonu:** Spam/sahte teklif algılama, fiyat anomali tespiti
- **Kullanıcı raporları:** Şikayet kuyruğu, kullanıcı bazlı geçmiş
- **İçerik filtresi:** Yasaklı kelime listesi, hassas içerik tespiti
- **Fraud skorlama:** Her teklif ve ilan için risk skoru (IP, davranış, fiyat analizi)
- **Aksiyonlar:** Uyar, askıya al, kalıcı ban, içerik kaldır

### 3.6 Bildirim Sistemi

| Olay | Push | In-App | Email | SMS |
|---|---|---|---|---|
| Yeni teklif geldi | ✅ | ✅ | ✅ | ❌ |
| Teklif kabul edildi | ✅ | ✅ | ✅ | ✅ |
| Teklif reddedildi | ❌ | ✅ | ✅ | ❌ |
| Karşı teklif geldi | ✅ | ✅ | ✅ | ❌ |
| İlan süresi dolmak üzere | ✅ | ✅ | ✅ | ❌ |
| İlan süresi doldu | ❌ | ✅ | ✅ | ❌ |
| Yeni mesaj | ✅ | ✅ | ❌ | ❌ |
| Ödeme onaylandı | ✅ | ✅ | ✅ | ✅ |
| Doğrulama tamamlandı | ❌ | ✅ | ✅ | ❌ |
| Abonelik yenileme hatırlatması | ✅ | ✅ | ✅ | ❌ |
| Kota %80'e ulaştı | ❌ | ✅ | ✅ | ❌ |
| Platform haberleri | ❌ | ✅ | ✅ | ❌ |

**Bildirim tercihleri** kullanıcı tarafından kanal bazında özelleştirilebilir olmalı.

### 3.7 Mesajlaşma Sistemi

- **İlan bazlı thread:** Her ilan + satıcı kombinasyonu ayrı bir konuşma thread'i
- **Gerçek zamanlı:** SignalR WebSocket ile anlık mesajlaşma
- **Dosya paylaşımı:** Görsel, PDF, doküman gönderebilme
- **Okundu bilgisi:** Mesajın okunduğu bilgisi
- **Spam koruması:** İlk mesajda iletişim bilgisi paylaşımını engelleme (telefon, email regex tespiti)
- **Arşiv:** Tamamlanan işlemlerin mesajları arşive taşınır
- **Hızlı yanıtlar:** Satıcılar için hazır mesaj şablonları

### 3.8 Güven & Doğrulama Sistemi

**Doğrulama Seviyeleri (Progressive Trust):**

| Seviye | Gereksinimler | Kazanım |
|---|---|---|
| **Seviye 1 — Temel** | Email + telefon doğrulaması | Platforma erişim |
| **Seviye 2 — Kimlik** | TC kimlik / pasaport doğrulama | "Kimliği Doğrulanmış" badge'i |
| **Seviye 3 — Adres** | Adres doğrulama (fatura/resmi evrak) | "Adresi Doğrulanmış" badge'i |
| **Seviye 4 — Ticari** | Vergi levhası / ticaret sicil | "Resmi Satıcı" gold badge'i |
| **Seviye 5 — Premium** | Platform tarafından yerinde doğrulama (yüksek hacim satıcılar) | "Premium Satıcı" platinum badge'i |

**Güven Skoru Algoritması:**
- Doğrulama seviyesi (%30)
- Tamamlanan işlem sayısı (%25)
- Ortalama değerlendirme puanı (%20)
- Yanıt süresi ortalaması (%10)
- Hesap yaşı (%10)
- İptal/anlaşmazlık oranı (%5, negatif etki)

---

## 4. EK ÖZELLİK ÖNERİLERİ

### 🔴 Olmazsa Olmaz (MVP)

1. **Escrow Ödeme Sistemi:** Yüksek tutarlı işlemlerde (eşik değer üstü) alıcı parayı platforma yatırır, satıcı teslimatı tamamladığında serbest bırakılır. Bu olmadan güven sağlanamaz.

2. **Karşı Teklif (Counter-Offer) Sistemi:** Alıcı gelen teklifi doğrudan kabul/ret etmek yerine karşı teklif gönderebilmeli. Satıcı da revize edebilmeli. Maksimum 3 tur negotiation.

3. **İlan Süresi & Yenileme:** Her ilan varsayılan 7/14/30 gün süreli. Süre dolduğunda otomatik kapatılır, alıcıya yenileme bildirimi gider. Yenilemede teklifler korunur.

4. **Teklif Revizyon Hakkı:** Satıcı, teklifi kabul edilmeden önce 1 kez revize edebilmeli (fiyat düşürme, süre güncelleme). Revize geçmişi görünür olmalı.

5. **Kategori Bazlı Dinamik Form Alanları:** "Mobilya" kategorisinde malzeme/renk/ölçü, "Elektronik"te marka/model/garanti gibi kategoriye özel alan setleri.

6. **Çoklu Görsel & Doküman Yükleme:** İlanlarda min 1, max 10 görsel + teknik şartname PDF/DOC yüklenebilmeli. Drag & drop + sıralama.

7. **Fraud Detection — Temel:** Aynı IP'den çoklu hesap, anormal teklif paterni (aynı satıcı her ilana teklif), fiyat manipülasyonu (çok düşük → trust kazanıp dolandırma).

8. **Anlaşmazlık (Dispute) Yönetimi:** Alıcı veya satıcı anlaşmazlık açabilir. Platform moderatörü inceleyip karar verir. Escrow varsa para dondurulur.

### 🟢 Growth Özellikleri

9. **Referral (Davet) Sistemi:** "Arkadaşını davet et, ilk başarılı işlemde ikisine de kredi" mantığı. Satıcı davet ederse +5 teklif hakkı, alıcı davet ederse ilan öne çıkarma hakkı.

10. **Akıllı Teklif Önerileri (AI):** Satıcıya, ilan detaylarına ve geçmiş benzer ilanlara bakarak "Bu ilan için önerilen fiyat aralığı: X-Y TL" bilgisi. Alıcıya da "Bu kategoride ortalama teklif: Z TL" bilgisi.

11. **Canlı Talep Akışı (Live Feed):** Ana sayfada gerçek zamanlı akan yeni ilanlar. "Az önce Ankara'dan 1000 adet tişört talebi açıldı" gibi. FOMO + platform canlılığı hissi.

12. **Teklif Sıralama Algoritması:** Default sıralama = güven skoru × fiyat uygunluğu × yanıt hızı. Alıcı isterse sadece fiyata, sadece güvene göre sıralayabilir.

13. **Favori İlanlar & Favori Satıcılar:** Satıcı ilanlara, alıcı satıcılara favori ekleyebilir. Favori satıcı yeni ilan açtığında bildirim.

14. **SEO-Optimized İlan Sayfaları:** Her ilan public URL'ye sahip, SSR ile render, schema.org structured data, Open Graph meta tags. "toptan sandalye satın al" gibi long-tail keyword'lerde organik trafik.

15. **Onboarding Akışı:** Yeni kullanıcı ilk girişte rol seçer (alıcı/satıcı/ikisi de). 3 adımlık interaktif tour ile platformun mantığını öğrenir. İlk ilan veya ilk teklif için guided deneyim.

### 🔵 Premium Özellikler

16. **Kurumsal Alıcı RFQ Akışı:** Büyük firmalar için Request for Quotation formatı: teknik şartname yükleme, çoklu lot halinde talep, NDA gerektiren kapalı ilan, yalnızca davetli satıcılara açık ilanlar.

17. **Yapay Zeka Destekli İlan Oluşturma:** Alıcı kısa bir metin yazar veya referans görsel yükler, AI ilan başlığını, detaylarını ve kategori önerisini otomatik doldurur.

18. **Satıcı Performans Dashboard'u:** Teklif kabul oranı, ortalama yanıt süresi, müşteri memnuniyeti trendi, kategori bazlı performans, rakip karşılaştırma (anonim).

19. **Teklif Görünürlük Boost:** Satıcı, teklifini "öne çıkar" yapabilir (ücretli). Öne çıkan teklif, listenin başında ve renkli border ile gösterilir.

20. **İhale Modu (Auction-Style Closing):** Alıcı isterse ilanını "ihale modunda" açar: son 1 saatte yeni teklif gelirse süre 15 dakika uzar. En iyi fiyatı garanti eder.

### 🟡 Operasyonel Özellikler

21. **Otomatik Kota Yönetimi & Aşım Politikası:** Satıcı kota limitine ulaştığında: teklif butonu devre dışı, "Limitiniz doldu, yükseltin" CTA, opsiyonel per-teklif satın alma (Basic: 5 TL/teklif, Plus: 3 TL/teklif).

22. **Kampanya & Promosyon Motoru:** Admin panelden "İlk ay %50 indirimli abonelik", "Bu hafta ücretsiz 3 öne çıkarma" gibi kampanyalar tanımlayabilir. Otomatik başla/bitir tarihleri.

23. **Analitik & Raporlama:** Alıcı: ilan performansı (görüntülenme, teklif sayısı, conversion). Satıcı: teklif başarı oranı, kategori performansı. Admin: platform-wide metrikler, cohort analizi.

24. **Multi-Language & Multi-Currency Altyapısı:** V2 için hazırlık: i18n altyapısı (next-intl), para birimi seçimi, lokasyon bazlı adaptasyon.

25. **Webhook & API Entegrasyonu:** Kurumsal satıcılar için: yeni ilan webhook'u, otomatik teklif API'si, ERP entegrasyonu. Bu, büyük satıcıların platformu programatik kullanmasını sağlar.

26. **Rate Limiting & Anti-Spam:** Teklif verme hız limiti (aynı satıcı dakikada max 3 teklif), ilan açma limiti (günde max 10 ilan), captcha (şüpheli davranışta), mesaj spam koruması.

27. **Gelişmiş Push Notification Senaryoları:**
    - "İlanınıza 5 dakikadır teklif gelmedi, başlığı güncellemek ister misiniz?"
    - "Favori satıcınız yeni bir teklifte bulundu"
    - "Kota limitinizin %80'ine ulaştınız"
    - "Teklifiniz 2 gündür bekliyor, fiyat güncellemek ister misiniz?"
    - Re-engagement: "3 gündür giriş yapmadınız, X yeni ilan sizi bekliyor"

28. **Boş Durum (Empty State) Tasarımları:** Her ekran için özel empty state: illustration + açıklama + CTA. Örn: "Henüz teklif almadınız → İlan başlığınızı daha açıklayıcı yapın (ipucu)" veya "Bu kategoride ilan yok → Bildirim kur, yeni ilan gelince haberdar ol."

---

## 5. ABONELİK SİSTEMİNİN PROFESYONELLEŞTİRİLMESİ

### Paket Yapısı

| Özellik | Basic | Plus | Pro | Enterprise |
|---|---|---|---|---|
| **Aylık Fiyat** | ₺299 | ₺799 | ₺1.499 | Özel Teklif |
| **Teklif Hakkı / Ay** | 20 | 100 | Sınırsız | Sınırsız |
| **Satış Limiti / Ay** | 5 | 30 | Sınırsız | Sınırsız |
| **Kota Aşım Ücreti** | 15 TL/teklif | 8 TL/teklif | — | — |
| **Teklif Öne Çıkarma** | ❌ | 3/ay ücretsiz | 10/ay ücretsiz | Sınırsız |
| **Ek Öne Çıkarma Fiyatı** | 25 TL | 15 TL | 10 TL | — |
| **Görsel Kalitesi** | Standart (max 2MB) | Standart (max 2MB) | HD (max 10MB) | HD + Video |
| **AI Teklif Önerisi** | ❌ | Temel | Gelişmiş | Gelişmiş + Custom |
| **Müşteri Temsilcisi** | ❌ | Paylaşımlı | Özel | Dedicated Account Mgr |
| **Performans Raporu** | Temel | Detaylı | Gelişmiş + Export | Custom Dashboard |
| **API Erişimi** | ❌ | ❌ | Read-only | Full CRUD |
| **Doğrulama Önceliği** | Normal kuyruk | Hızlı kuyruk | Anında | Anında + Yerinde |
| **Profil Badge** | — | "Plus Satıcı" (silver) | "Pro Satıcı" (gold) | "Kurumsal" (platinum) |
| **Komisyon Oranı** | %5 | %3.5 | %2 | Özel anlaşma |
| **Çoklu Kullanıcı** | 1 kullanıcı | 1 kullanıcı | 3 kullanıcı | Sınırsız |
| **İhale Moduna Teklif** | ❌ | ✅ | ✅ | ✅ |
| **Kapalı İlanlara Erişim** | ❌ | ❌ | ✅ | ✅ |

### Komisyon Modeli

- Platform, **başarılı her işlemden** komisyon alır (sepet tutarı üzerinden)
- Komisyon oranı abonelik paketine göre azalır (yukarıdaki tablo)
- **Minimum komisyon:** 10 TL (küçük işlemlerde)
- **Maksimum komisyon:** 5.000 TL (çok büyük işlemlerde tavan)
- Komisyon, escrow'dan otomatik kesilir veya fatura bazlı tahsil edilir

### Abonelik Aşımı Politikası

1. Kota %80'e ulaştığında → in-app + email bildirim
2. Kota %100'e ulaştığında → teklif butonu "Yükselt" CTA'sına dönüşür
3. Per-teklif satın alma seçeneği sunulur (paket bazlı fiyatlarla)
4. Yıllık abonelikte %20 indirim + 2 ay hediye
5. Abonelik iptalinde: mevcut teklifler korunur, yeni teklif verilemez, aktif siparişler tamamlanır

### Upsell Stratejisi

- Dashboard'da "Bu ay X potansiyel ilana teklif veremediniz → Plus'a yükselt"
- Teklif verirken "Pro üyelerde bu teklif %40 daha görünür olur"
- Başarılı satış sonrası "Bu ay limitinize yaklaştınız, yükseltme fırsatı"

---

## 6. UI/UX STRATEJİSİ

### Genel Tasarım Dili

**Konsept:** "Confident Minimalism" — az element, çok etki. Her pixel'in bir amacı var. Sıkışık veya karmaşık görünen hiçbir ekran yok. Kullanıcı her an nerede olduğunu ve ne yapması gerektiğini biliyor.

**Kimlik:** Güvenilir bir fintech uygulamasının netliği + modern bir marketplace'in sıcaklığı. Ne soğuk kurumsal, ne de renkli-kaotik. Tam ortada, profesyonel ama insani.

### Renk Sistemi

```
Primary:        #1B2B4B (Deep Navy)       → Ana marka rengi, başlıklar, CTA
Primary Light:  #2D4A7A                    → Hover states, secondary actions
Accent:         #E8683A (Warm Coral)       → Ana CTA, önemli aksiyonlar, badge'ler
Accent Light:   #FCEEE8                    → Accent arka planlar
Success:        #1A8754                    → Onay, başarılı işlemler
Warning:        #D4940A                    → Uyarılar, kota yaklaşımı
Error:          #C93B3B                    → Hatalar, silinemez aksiyonlar
Neutral 50:     #FAFAF8                    → Sayfa arka planı (warm white)
Neutral 100:    #F3F2EF                    → Kart arka planları
Neutral 200:    #E5E3DE                    → Divider, border
Neutral 300:    #C8C5BD                    → Placeholder text
Neutral 500:    #7A7668                    → Secondary text
Neutral 700:    #3D3A33                    → Body text
Neutral 900:    #1A1815                    → Heading text

Dark Mode:
Background:     #141413
Surface:        #1E1E1C
Surface Raised: #282826
Border:         #333330
Text Primary:   #F0EFEB
Text Secondary: #9A9790
```

### Tipografi

```
Font Family:    "Plus Jakarta Sans" (Google Fonts, ücretsiz, geometric)
Fallback:       system-ui, -apple-system, sans-serif

Scale:
Display:        48px / 56px line-height / Bold (800)      → Hero başlıkları
H1:             36px / 44px / Bold (700)                   → Sayfa başlıkları
H2:             28px / 36px / SemiBold (600)               → Bölüm başlıkları
H3:             22px / 30px / SemiBold (600)               → Kart başlıkları
H4:             18px / 26px / Medium (500)                 → Alt başlıklar
Body L:         16px / 24px / Regular (400)                → Ana metin
Body M:         14px / 20px / Regular (400)                → Kart içerikleri
Body S:         12px / 16px / Regular (400)                → Etiketler, caption
```

### Spacing Sistemi

```
Base: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

Kullanım:
- İç padding (kart): 24px
- Kart arası boşluk: 16-24px
- Bölüm arası boşluk: 64-96px
- Sayfa kenar boşlukları: 24px (mobil), 48-80px (desktop)
- İnput iç padding: 12px 16px
```

### Border Radius

```
Small:    6px   → Badge, chip, tag
Medium:   8px   → Input, küçük butonlar
Large:    12px  → Kartlar, modal
XLarge:   16px  → Büyük kartlar, hero elemanları
Pill:     9999px → CTA butonları (opsiyonel), avatar
```

### Elevation / Shadow

```
Shadow SM:   0 1px 2px rgba(0,0,0,0.05)               → Default kart
Shadow MD:   0 4px 12px rgba(0,0,0,0.08)               → Hover state
Shadow LG:   0 8px 24px rgba(0,0,0,0.12)               → Modal, dropdown
Shadow XL:   0 16px 48px rgba(0,0,0,0.16)              → Dialog overlay
```

### Motion Design Prensipleri

```
Duration:
Fast:       150ms   → Buton hover, toggle
Normal:     250ms   → Kart hover, tooltip
Moderate:   350ms   → Modal giriş, slide-over
Slow:       500ms   → Sayfa geçişi (max bu!)

Easing:
Default:    cubic-bezier(0.25, 0.1, 0.25, 1)     → Çoğu animasyon
Enter:      cubic-bezier(0, 0, 0.2, 1)            → Elemanlar sahneye girerken
Exit:       cubic-bezier(0.4, 0, 1, 1)            → Elemanlar sahneden çıkarken
Spring:     type: "spring", stiffness: 300, damping: 25 → Fiziksel his (buton press)

Kurallar:
- Staggered animation: kartlar arası 50ms delay
- Scroll-triggered: viewport'a girdiğinde fade-up (IntersectionObserver)
- Reduced motion: prefers-reduced-motion respect edilecek
- Loading → Content: skeleton → fade-in (opacity 0→1, y: 8→0)
```

### Desktop vs Mobil Davranışları

| Element | Desktop | Mobil |
|---|---|---|
| Navigation | Sticky top header | Bottom tab bar |
| Grid | 3-4 kolon | 1 kolon (full-width) |
| Teklif verme | Slide-over panel (sağdan) | Bottom sheet (full) |
| Karşılaştırma | Yan yana tablo | Swipe cards |
| Filtreler | Sidebar (collapsible) | Bottom sheet modal |
| Mesajlar | Split view (sol liste, sağ chat) | Tek ekran, push-navigate |
| Dashboard | Multi-column grid | Stacked cards |
| İlan oluşturma | Multi-step with sidebar progress | Full-screen steps |

---

## 7. SAYFA BAZLI TASARIM KURGUSU

### 7.1 Landing Page

**Amaç:** Platformun ne olduğunu 3 saniyede anlatmak, güven vermek, CTA'ya yönlendirmek.

**İçerik Blokları (yukarıdan aşağıya):**

1. **Hero Section**
   - Büyük başlık: "İhtiyacını Yaz, Satıcılar Yarışsın"
   - Alt metin: "Türkiye'nin ilk talep odaklı ticaret platformu. İlanını aç, teklifler gelsin, en uygununu seç."
   - Primary CTA: "İlan Oluştur" (accent renk, büyük, pill)
   - Secondary CTA: "Nasıl Çalışır?" (outline, scroll-to)
   - Sağ tarafta veya arkada: abstract illustration veya mockup (gerçek ekran görüntüsü)
   - Hafif gradient arka plan (primary → transparent)

2. **Nasıl Çalışır? (3 Adım)**
   - Step 1: "İlanını Aç" — ikon + kısa açıklama
   - Step 2: "Teklifler Gelsin" — ikon + kısa açıklama
   - Step 3: "En Uygununu Seç" — ikon + kısa açıklama
   - Horizontal layout (desktop), vertical (mobil)
   - Numbered circles + connecting line

3. **Canlı Talep Akışı**
   - Gerçek zamanlı toast-style bildirimler
   - "İstanbul'dan 500 adet ofis sandalyesi talep edildi — 3 dakika önce"
   - Otomatik scroll, fade-in/out animasyonu
   - Hem social proof hem platform canlılığı

4. **Kategori Navigasyonu**
   - 8-12 ana kategori, icon kartları
   - Hover: scale(1.03) + shadow-md
   - Monochrome icon seti (Phosphor Icons veya Lucide)

5. **İstatistik Bandı**
   - "12.450+ Aktif İlan" / "45.000+ Başarılı İşlem" / "8.900+ Doğrulanmış Satıcı"
   - Count-up animasyonu (scroll-triggered)
   - Warm gray arka plan bandı

6. **Öne Çıkan İlanlar**
   - 3-4 kart grid
   - Her kart: kategori badge, başlık, bütçe aralığı, teklif sayısı, konum, zaman
   - "Tümünü Gör" link

7. **Satıcılara Özel Bölüm**
   - "Satıcı mısın? Gerçek müşterilere ulaş."
   - Değer önerisi: gerçek talep, hazır müşteri, esnek abonelik
   - CTA: "Satıcı Olarak Kaydol"
   - Farklı arka plan rengi (hafif primary tint)

8. **Güven Bandı**
   - Güvenlik sertifikaları, ödeme güvenliği, doğrulama sistemi ikonları
   - Müşteri yorumları (2-3 testimonial kart)
   - Kurumsal referanslar/logolar (varsa)

9. **Footer**
   - Linkler: Hakkımızda, SSS, İletişim, Blog, Satıcı Merkezi, Gizlilik, Şartlar
   - Sosyal medya ikonları
   - App store badge'leri

**Hiyerarşi:** Hero → Nasıl Çalışır → Social Proof → Keşfet → Güven → CTA
**Mobilde:** Tek kolon, hero full-width, kategoriler horizontal scroll, istatistikler 2x2 grid.

### 7.2 İlan Keşfetme Sayfası

**Amaç:** Satıcıların teklif verecekleri ilanları hızlıca bulması.

**İçerik Blokları:**

1. **Üst Bar: Arama + Filtreler**
   - Full-width search bar (autocomplete, son aramalar)
   - Chip bazlı aktif filtreler (seçildikçe eklenir, x ile kaldırılır)

2. **Filtre Paneli (sol sidebar / mobilde bottom sheet)**
   - Kategori (tree structure)
   - Bütçe aralığı (range slider)
   - Konum (il/ilçe, harita)
   - Tarih (son 24 saat, son 7 gün, tümü)
   - Durum (aktif, teklif bekliyor, son 1 gün)
   - Sıralama (en yeni, en yüksek bütçe, en çok teklif alan)

3. **İlan Grid'i**
   - Desktop: 3 kolon grid
   - Her kart: kategori badge, başlık (max 2 satır), bütçe aralığı, teklif sayısı, konum, kalan süre, alıcı güven skoru mini badge
   - Hover: elevation artışı + hafif scale
   - Staggered entrance animation
   - Infinite scroll (TanStack Query infinite query)
   - Skeleton loading (filtre değişiminde)

4. **Sonuç Sayısı + Sıralama**
   - "248 aktif ilan bulundu"
   - Dropdown sıralama

**Mobilde:** Full-width kartlar, sticky search bar, floating filter FAB butonu → bottom sheet açar.

### 7.3 İlan Detay Sayfası

**Amaç:** İlanın tüm detaylarını göstermek + satıcıyı teklif vermeye yönlendirmek.

**İçerik Blokları:**

1. **Sol Alan (desktop) / Üst Alan (mobil):**
   - Breadcrumb (Kategori > Alt kategori > İlan)
   - İlan başlığı (H1)
   - Yayın tarihi, kalan süre, görüntülenme sayısı
   - Alıcı mini profil kartı (avatar, isim, güven skoru, üyelik süresi)
   - İlan açıklaması (zengin metin)
   - Teknik detaylar tablosu (kategori bazlı dinamik alanlar)
   - Referans görseller (gallery, lightbox)
   - Ekli dokümanlar (indirilebilir)
   - Bütçe aralığı (vurgulu badge)
   - Konum (il/ilçe, mini harita opsiyonel)
   - Teslimat beklentisi

2. **Bilgilendirici UX Bandı:**
   - "Bu kategoride ortalama 12 teklif geliyor"
   - "En hızlı teklifler ortalama 2 saat içinde geliyor"
   - Hafif mavi arka planlı info card

3. **Sağ Alan (desktop) / Alt Alan (mobil) — Teklifler:**
   - "X teklif geldi" sayacı
   - Teklif kartları listesi (satıcı avatar, puan, fiyat, teslim süresi, kısa not)
   - Her kart hover'da elevation artışı
   - Kabul edilen teklif yeşil outline + "Kabul Edildi" badge
   - "Teklif Ver" sticky CTA butonu (satıcılar için)
   - Karşılaştır butonu (checkbox ile seçili teklifler)

4. **Benzer İlanlar:** Alt bölümde, aynı kategorideki diğer ilanlar.

**Mobilde:** Tek kolon stack. Görseller swipeable carousel. Teklif ver butonu sticky bottom bar.

### 7.4 İlan Oluşturma Akışı

**Amaç:** Alıcının ihtiyacını hızlı, eksiksiz ve keyifli bir şekilde ilan haline getirmesi.

**5 Adım (Multi-Step Form):**

**Step 1 — Kategori Seçimi:**
- Visual category cards (icon + isim)
- Hover feedback, seçilen kart accent border
- Alt kategori seçimi (ikinci aşama, slide-in)

**Step 2 — Detaylar:**
- İlan başlığı (AI suggestion: "Başlık önerisi: ...")
- Detaylı açıklama (textarea, min karakter sayacı)
- Kategori bazlı özel alanlar (dinamik render)
- Miktar
- Teslimat beklentisi (tarih picker veya "acil", "1 hafta", "1 ay" seçenekleri)

**Step 3 — Bütçe:**
- Bütçe tipi seçimi: Sabit fiyat / Aralık / Teklif bekliyorum
- Tutar input (currency formatted)
- "Bu kategoride ortalama bütçe: X TL" bilgilendirme
- KDV dahil/hariç toggle

**Step 4 — Görseller & Dokümanlar:**
- Drag & drop upload zone
- Görsel preview grid, sıralama (drag to reorder)
- PDF/DOC upload alanı
- Min 1 görsel zorunlu uyarısı
- Boyut ve format bilgisi

**Step 5 — Önizleme & Yayınla:**
- İlanın tam önizlemesi (gerçek kart + detay sayfası gibi)
- Düzenle butonları her bölümün yanında
- İlan süresi seçimi (7/14/30 gün)
- "Yayınla" büyük CTA
- Başarılı yayında → confetti animation + "İlanınız yayında!" ekranı + "Teklif geldiğinde sizi bilgilendireceğiz"

**Genel Form UX:**
- Üstte progress bar (step 1/5, 2/5... animasyonlu ilerleme)
- Inline validation (alan doldurulurken anında feedback)
- Adımlar arası slide animasyonu (Framer Motion AnimatePresence)
- "Taslak Kaydet" her adımda mevcut
- Geri butonu ile önceki adıma dönüş (veri korunur)

**Mobilde:** Full-screen step'ler, bottom-fixed ileri/geri butonları, sticky progress bar.

### 7.5 Teklif Gönderme Deneyimi

**Amaç:** Satıcının hızlıca, form'dan çıkmadan teklif vermesi.

**Uygulama:** Desktop'ta sağdan slide-over panel, mobilde bottom sheet (full-height).

**İçerik:**
- İlan özeti (başlık, bütçe, kalan süre — read-only)
- Teklif fiyatı input (currency format)
- Teslimat süresi (dropdown: 1 gün, 3 gün, 1 hafta, 2 hafta, 1 ay, özel tarih)
- Kısa açıklama/not (textarea, max 500 karakter)
- Opsiyonel: görsel/doküman ekleme
- "Kalan teklif hakkınız: X" bilgisi
- "Gönder" CTA
- Başarılı gönderimde: animated checkmark + "Teklifiniz gönderildi, alıcı değerlendirdiğinde bilgilendirileceksiniz"

### 7.6 Teklif Karşılaştırma Ekranı

**Amaç:** Alıcının teklifleri net bir şekilde kıyaslayıp karar vermesi.

**Uygulama:** Full-page overlay veya dedicated route.

**İçerik:**
- Yan yana kart/kolon yapısı (max 3-4 teklif aynı anda)
- Karşılaştırma kriterleri (satırlar):
  - Satıcı adı + avatar
  - Güven skoru (yıldız + badge)
  - Teklif fiyatı (**en düşük yeşil highlight**)
  - Teslimat süresi (**en kısa yeşil highlight**)
  - Tamamlanan işlem sayısı
  - Satıcı doğrulama seviyesi
  - Kısa not
  - Üyelik süresi
- Best value otomatik highlight (AI önerisi: "En iyi değer" badge)
- "Teklifi Kabul Et" butonu her kolonun altında
- "Karşı Teklif" butonu

**Mobilde:** Horizontal swipe cards (her kart bir teklif). Swipe left/right ile navigasyon. Sticky comparison bar (fiyat + skor) üstte.

### 7.7 Mesajlar

**Amaç:** Alıcı-satıcı arası güvenli, ilan bazlı iletişim.

**Desktop:** Split view — sol: konuşma listesi, sağ: aktif chat.

**Sol Panel:**
- Arama barı
- Konuşma kartları (avatar, isim, son mesaj preview, zaman, okunmadı badge)
- Filtreleme: Tümü / Okunmamış / Arşiv
- İlan bazlı gruplama (hangi ilan hakkında konuşulduğu)

**Sağ Panel (Chat):**
- Üstte: karşı taraf profil mini bilgisi + ilgili ilan linki
- Mesaj baloncukları (kendi: sağ accent, karşı: sol neutral)
- Zaman damgaları (gruplu)
- Okundu bilgisi (double check)
- Dosya paylaşımı (görsel inline, doküman kart olarak)
- Input bar: metin + emoji + dosya ekleme
- Hızlı yanıtlar (satıcı için)

**Mobilde:** Konuşma listesi → tap → chat ekranı (push navigation). Input bar keyboard üstünde sticky.

### 7.8 Dashboard

> Detaylı → Bkz. Bölüm 8

### 7.9 Profil Sayfası

**Amaç:** Kullanıcının kendi bilgilerini yönetmesi + başkalarının profilini görüntülemesi.

**Kendi Profili (Settings):**
- Avatar upload
- İsim, iletişim bilgileri, konum
- Doğrulama durumu (her seviye için progress bar)
- Abonelik bilgisi + kota durumu (satıcı)
- Bildirim tercihleri
- Güvenlik (şifre değiştir, 2FA)
- Dil ve tema tercihi (light/dark)

**Başkasının Profili (Public):**
- Avatar, isim, üyelik süresi
- Doğrulama badge'leri
- Güven skoru + yıldız puanı
- Tamamlanan işlem sayısı
- Son değerlendirmeler (yıldız + yorum)
- Ortalama yanıt süresi
- Aktif ilanlar (alıcıysa) veya son teklifler (sayı bazlı, detay gizli)

### 7.10 Abonelik / Paketler Sayfası

**Amaç:** Satıcının paket seçmesi veya yükseltmesi.

**İçerik:**
- 3-4 kolon pricing table (Basic, Plus, Pro, Enterprise)
- Önerilen paket highlight (Plus — "En popüler" badge)
- Feature comparison table (toggle ile genişletilebilir)
- Yıllık/aylık toggle (yıllıkta %20 indirim, animasyonlu fiyat geçişi)
- Her paket altında "Başla" veya "Yükselt" CTA
- FAQ accordion altında
- SSS: "Kota dolunca ne olur?", "Paket değiştirince ne olur?" gibi

**Mobilde:** Horizontal scroll cards (her paket bir kart), feature table accordion ile.

### 7.11 Bildirim Merkezi

**Amaç:** Tüm bildirimleri tek yerde görmek ve yönetmek.

**İçerik:**
- Sekme bazlı: Tümü / Teklifler / Mesajlar / Sistem
- Her bildirim kartı: ikon + başlık + açıklama + zaman + okundu/okunmadı
- Swipe to archive (mobil)
- "Tümünü okundu işaretle" butonu
- Boş durum: "Yeni bildirim yok, harika!"
- Bildirim tercihleri linki

---

## 8. DASHBOARD KURGUSU

### 8.1 Alıcı Dashboard'u

**Üst Bant — Özet KPI'lar:**
- Aktif ilanlarım (sayı)
- Toplam gelen teklif (sayı)
- Bekleyen teklifler (aksiyon gerektirenler, accent renk)
- Tamamlanan işlemler (bu ay)

**Ana Alan:**

1. **Bekleyen Aksiyonlar Kartı (Hero Card):**
   - "3 yeni teklif değerlendirmenizi bekliyor"
   - Direkt link ile ilana git
   - Bu kart her zaman en üstte, accent border

2. **Aktif İlanlarım:**
   - Kompakt kart listesi (başlık, teklif sayısı, kalan süre, durum badge)
   - Quick actions: düzenle, yenile, kapat
   - "Yeni İlan Oluştur" kart (dashed border, CTA)

3. **Son Gelen Teklifler:**
   - Timeline view (son 5-10 teklif)
   - Satıcı avatar, ilan başlığı, fiyat, zaman

4. **Tamamlanan İşlemler:**
   - Son tamamlanan 3-5 işlem
   - Değerlendirme yapılmadıysa "Değerlendir" CTA

5. **İlan Performansı:**
   - Mini chart: ilan bazlı görüntülenme/teklif trendi (son 7 gün)

### 8.2 Satıcı Dashboard'u

**Üst Bant — Özet KPI'lar:**
- Bu ay verilen teklif / kota (progress bar: 47/100)
- Bu ay satış / limit (progress bar: 12/30)
- Kabul edilen teklifler (bu ay, sayı + oran)
- Kazanç (bu ay, TL)

**Ana Alan:**

1. **Kota Durumu Kartı (Hero Card):**
   - Progress barlar ile teklif ve satış kotası
   - Kota dolmaya yakınsa uyarı + "Yükselt" CTA
   - Paket adı badge (Plus Satıcı)

2. **Önerilen İlanlar:**
   - AI bazlı: satıcının kategorisine, geçmişine, başarı oranına göre eşleşen ilanlar
   - "Teklif Ver" quick action her kartta

3. **Aktif Tekliflerim:**
   - Durum bazlı: Bekliyor / Kabul Edildi / Reddedildi
   - Her teklifte: ilan başlığı, fiyat, durum badge, zaman
   - Kabul edilende kutlama animasyonu (ilk gösterimde)

4. **Performans Özeti:**
   - Teklif kabul oranı (gauge chart)
   - Ortalama yanıt süresi
   - Müşteri puanı trendi
   - Kategori bazlı başarı dağılımı

5. **Son Değerlendirmeler:**
   - Son 3-5 yorum kartı

6. **Gelir Trendi:**
   - Aylık gelir chart (bar veya area chart)

---

## 9. TASARIM SİSTEMİ

### Component Library

Temel: **Radix UI** (headless, accessible) + custom styling (Tailwind) — "Headless + Custom" yaklaşımı. Radix erişilebilirlik ve davranış sağlar, görünüm tamamen TalepSat tasarım diline uygun olur.

### Buton Tipleri

| Varyant | Kullanım | Görünüm |
|---|---|---|
| **Primary** | Ana aksiyonlar (İlan oluştur, Teklif gönder) | Accent arka plan, beyaz metin, pill veya rounded |
| **Secondary** | İkincil aksiyonlar (Filtrele, Detay gör) | Primary outline, primary metin |
| **Ghost** | Minimal aksiyonlar (İptal, Geri) | Arka plan yok, hover'da hafif tint |
| **Destructive** | Silme, iptal etme | Error renk, outline veya filled |
| **Icon Button** | Favori, paylaş, menü | Sadece ikon, hover'da tooltip |

**Sizes:** sm (32px), md (40px), lg (48px), xl (56px — hero CTA)
**States:** default, hover (scale 1.02 + shadow), active (scale 0.97), disabled (opacity 0.5), loading (spinner)

### Input Tipleri

- **Text Input:** Label üstte, placeholder içeride, focus'ta accent border, hata altında kırmızı mesaj
- **Textarea:** Auto-resize, karakter sayacı
- **Select:** Custom dropdown (Radix Select), arama destekli
- **Date Picker:** Radix veya custom calendar, range seçimi
- **Range Slider:** Dual handle (bütçe aralığı), tooltip ile değer gösterimi
- **File Upload:** Drag & drop zone, preview, progress bar
- **Currency Input:** Otomatik bin ayracı, ₺ prefix, Zod validation
- **Search Input:** Debounced, autocomplete dropdown, son aramalar

### Kart Yapıları

1. **İlan Kartı:** Thumbnail, kategori badge, başlık, bütçe, teklif sayısı, konum, kalan süre
2. **Teklif Kartı:** Satıcı avatar, puan yıldızları, fiyat (büyük), teslim süresi, kısa not, CTA
3. **Profil Kartı:** Avatar, isim, güven skoru, doğrulama badge'leri, tamamlanan iş
4. **Dashboard KPI Kartı:** İkon, değer (büyük sayı), label, trend oku (↑↓)
5. **Bildirim Kartı:** Tip ikonu, başlık, açıklama, zaman, okunmadı dot
6. **Paket Kartı:** Paket adı, fiyat, özellik listesi, CTA, "popüler" badge

### Badge Sistemi

| Badge | Renk | Kullanım |
|---|---|---|
| Aktif | Success (yeşil) | İlan durumu |
| Bekliyor | Warning (amber) | Teklif durumu |
| Tamamlandı | Primary (mavi) | İşlem durumu |
| Reddedildi | Error (kırmızı) | Teklif durumu |
| Plus Satıcı | Silver (#A0A0A0) | Profil badge |
| Pro Satıcı | Gold (#D4A017) | Profil badge |
| Kurumsal | Platinum (#7B68AE) | Profil badge |
| Doğrulanmış | Success + checkmark | Doğrulama |
| Öne Çıkan | Accent (coral) | Boost edilmiş |
| Yeni | Primary light | Yeni ilan/teklif |

### Toast Sistemi

- Sağ üstten slide-in (desktop), üstten drop-down (mobil)
- Tipler: success (yeşil), error (kırmızı), info (mavi), warning (amber)
- Auto-dismiss: 4 saniye
- Progress bar (kalan süre)
- Action button (opsiyonel, örn: "Geri al")
- Stack: max 3 toast aynı anda

### Modal / Drawer

- **Modal:** Merkezde, overlay backdrop (blur opsiyonel), max-width 560px, ESC ile kapanır
- **Slide-Over (Drawer):** Sağdan kayarak gelir, 400-480px genişlik, teklif verme & hızlı düzenleme için
- **Bottom Sheet (Mobil):** Alttan kayarak gelir, drag handle, snap points (half, full)
- Tüm overlay'lerde: AnimatePresence ile giriş/çıkış animasyonu

### Empty States

Her liste/grid ekranı için:
- İllüstrasyon (line-art, marka renkleriyle)
- Başlık: "Henüz aktif ilanınız yok"
- Açıklama: "İlk ilanınızı oluşturun, teklifler gelmeye başlasın"
- CTA buton: "İlan Oluştur"
- İpuçları: "İyi bir ilan nasıl oluşturulur?" link

### Skeleton States

- Kart skeleton: rounded rectangle bloklar (avatar, başlık satırı, açıklama satırları, badge)
- Liste skeleton: 3-5 kart skeleton
- Dashboard skeleton: KPI kutuları + chart placeholder
- Pulse animasyonu (Tailwind animate-pulse)
- Gerçek veri geldiğinde: skeleton → fade-in content (150ms)

### Status Colors

```
Draft:      Neutral 300 (#C8C5BD)    → Taslak
Active:     Success (#1A8754)         → Aktif/Yayında
Pending:    Warning (#D4940A)         → Bekliyor
Accepted:   Success (#1A8754)         → Kabul Edildi
Rejected:   Error (#C93B3B)           → Reddedildi
Expired:    Neutral 500 (#7A7668)     → Süresi Doldu
Completed:  Primary (#1B2B4B)         → Tamamlandı
Disputed:   Warning (#D4940A)         → Anlaşmazlık
Cancelled:  Neutral 500 (#7A7668)     → İptal Edildi
```

### İkon Yaklaşımı

- **Kütüphane:** Lucide Icons (MIT lisans, 1000+ ikon, consistent stroke width)
- **Stil:** Outline (stroke-width: 1.5-2px), monochrome
- **Boyutlar:** 16px (inline), 20px (UI), 24px (nav/action), 32px (category), 48px (empty state)
- **Kategori ikonları:** Custom veya Phosphor Icons (filled variant)

---

## 10. GÜVEN VE DÖNÜŞÜM ARTTIRICI MEKANİZMALAR

### Kullanıcı Güveni

1. **Progressive Verification:** Her doğrulama adımında visible badge kazanımı. Tam doğrulanmış satıcılar listede üstte.
2. **Transparent Pricing:** Komisyon oranı, toplam maliyet her zaman görünür. Gizli ücret yok.
3. **Escrow Protection:** Yüksek tutarlarda zorunlu, düşükte opsiyonel. "Paranız güvende" messaging.
4. **Review Authenticity:** Sadece gerçekleşen işlemlerden yorum. Verified purchase badge.
5. **Platform Guarantee:** Belirli tutara kadar platform garantisi (dispute durumunda).
6. **SSL + güvenlik badge'leri:** Footer ve ödeme sayfasında görünür.

### Teklif Verme Oranını Artırma

1. **Smart Matching Notifications:** Satıcıya kategorisine uygun yeni ilanları anında bildir.
2. **Estimated Success Rate:** "Bu teklif aralığında kabul oranı %72" bilgisi.
3. **Quick Bid Templates:** Satıcının sık kullandığı teklif şablonlarını kaydetmesi.
4. **Competitive Insight:** "Bu ilana şu an X teklif var" (exact fiyat gösterilmez).
5. **Remaining Time Urgency:** "Bu ilan 2 saat sonra kapanıyor" urgency banner.

### İlan Açma Oranını Artırma

1. **Guided First Listing:** İlk ilan için interaktif wizard, her adımda tooltip.
2. **AI-Assisted Listing:** Başlık ve açıklama önerisi, kategori auto-detect.
3. **Draft Saving:** Yarıda bırakılan ilanları hatırlatma push notification.
4. **Success Stories:** "Bu kategorideki son ilan 4 saat içinde 8 teklif aldı" social proof.
5. **Zero-Friction Start:** Minimum zorunlu alan ile hızlı ilan açma, detayları sonra tamamlama.

### Satıcı Kalite Seviyesi Koruma

1. **Performance Score:** Yanıt süresi, kabul oranı, müşteri puanı, iptal oranı → composite score.
2. **Quality Threshold:** Skor belirli eşiğin altına düşerse uyarı → düzelmezse kısıtlama.
3. **Response Time SLA:** 24 saat içinde yanıt vermeyen teklifler otomatik "yanıtsız" işaretlenir.
4. **Review Moderation:** Yapay yorum tespiti, alıcı-satıcı arası çapraz yorum manipülasyonu engeli.
5. **Graduated Penalties:** İlk ihlal uyarı, ikinci geçici kısıtlama, üçüncü hesap askıya alma.

---

## 11. MOBİL UYGULAMA STRATEJİSİ

### Web ile Tutarlılık

- **Shared design tokens:** Aynı renk, spacing, tipografi değerleri (`packages/tokens`)
- **Shared Zod schemas:** Aynı form validation kuralları
- **Shared API client:** Aynı endpoint tanımları ve response tipleri
- **NativeWind:** Tailwind class isimleri mobilde de kullanılır → mental model aynı
- **Aynı ikonlar:** Lucide React Native versiyonu

### Mobil-Özel Optimizasyonlar

| Ekran | Mobil-Özel Davranış |
|---|---|
| **Ana Sayfa** | Bottom sheet hero, horizontal scroll kategoriler, compact ilan kartları |
| **Keşfet** | Sticky search, floating filter FAB, pull-to-refresh |
| **İlan Detay** | Swipeable image gallery, sticky bottom CTA bar |
| **İlan Oluştur** | Full-screen steps, native camera integration, OS file picker |
| **Teklif Ver** | Bottom sheet (draggable), haptic feedback on submit |
| **Karşılaştır** | Horizontal swipe cards, sticky top comparison bar |
| **Mesajlar** | Platform keyboard handling, image preview inline, voice note (V2) |
| **Dashboard** | Stacked compact cards, pull-to-refresh, collapsible sections |
| **Profil** | Native settings-style list, biometric auth toggle |
| **Bildirimler** | Swipe actions (okundu, arşiv, sil) |

### Bottom Navigation

```
[Ana Sayfa]  [Keşfet]  [+ İlan Aç]  [Bildirimler]  [Profil]
     🏠         🔍       ➕ (accent)      🔔            👤
```

- Orta buton (İlan Aç): Daha büyük, accent renk, hafif elevated — ana aksiyonu vurgular
- Badge: Bildirimler'de okunmamış sayısı
- Mesajlar: Profil altında veya Bildirimler'den erişim
- Aktif sekme: filled icon + accent renk, inactive: outline + neutral

### Gesture Kullanımı

- **Pull-to-refresh:** Tüm liste ekranlarında
- **Swipe right:** Bildirim okundu işaretle
- **Swipe left:** Bildirim arşivle
- **Long press:** Kart üzerinde quick actions menu
- **Pinch-to-zoom:** Görsel galerilerinde
- **Swipe between tabs:** Dashboard sekmeleri, bildirim filtreleri

---

## 12. SONUÇ — ÖZET

### Önerilen Teknoloji Stack'i

| Katman | Teknoloji |
|---|---|
| Web Frontend | Next.js 15 + React 19 + TypeScript |
| Mobil Frontend | Expo SDK 52+ + React Native + TypeScript |
| Shared Packages | Turborepo monorepo + pnpm |
| Styling | Tailwind CSS 4 (web) + NativeWind 4 (mobil) |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion 12 (web) + Reanimated 3 (mobil) |
| Realtime | SignalR (WebSocket) |
| Backend | .NET 8+ (Clean Architecture) |
| Database | PostgreSQL + Redis (cache) |
| Storage | Azure Blob Storage / S3 (görseller, dokümanlar) |
| Search | Elasticsearch / Meilisearch (ilan arama) |
| Push | Firebase FCM + Expo Notifications |

### Ürün Mimarisi Özeti

```
Platform Core:  İlan → Teklif → Negotiation → Anlaşma → Ödeme → Teslimat → Değerlendirme
Güven Katmanı:  Doğrulama (5 seviye) + Güven Skoru + Escrow + Dispute
Gelir Katmanı:  Abonelik (4 paket) + Komisyon + Boost/Öne Çıkarma + Per-Teklif Satış
Büyüme Katmanı: Referral + AI Matching + Kampanyalar + SEO
Operasyon:      Admin Panel + Moderasyon + Fraud Detection + Analitik
```

### MVP (V1) — İlk Sürüm

- [x] Kullanıcı kaydı ve girişi (email + telefon doğrulama)
- [x] Profil oluşturma (alıcı/satıcı)
- [x] İlan oluşturma (5 adım, kategori bazlı alanlar)
- [x] İlan listeleme ve filtreleme
- [x] İlan detay sayfası
- [x] Teklif verme (satıcı)
- [x] Teklif listeleme ve karşılaştırma (alıcı)
- [x] Teklif kabul/red
- [x] Temel mesajlaşma (ilan bazlı)
- [x] Abonelik sistemi (Basic, Plus, Pro)
- [x] Temel bildirim sistemi (push + in-app)
- [x] Satıcı/alıcı dashboard'ları
- [x] Temel doğrulama (email + telefon + kimlik)
- [x] Landing page + SEO
- [x] Dark mode
- [x] Responsive web + mobil uygulama
- [x] Admin panel (temel yönetim)

### V2 — Büyüme Sürümü

- [ ] Escrow ödeme sistemi
- [ ] Karşı teklif (counter-offer) sistemi
- [ ] İhale modu
- [ ] AI teklif önerileri ve ilan oluşturma yardımcısı
- [ ] Gelişmiş fraud detection
- [ ] Referral sistemi
- [ ] Kampanya/promosyon motoru
- [ ] Enterprise paket + RFQ akışı
- [ ] Teklif boost/öne çıkarma
- [ ] Gelişmiş analitik ve raporlama
- [ ] Webhook/API (kurumsal satıcılar)
- [ ] Multi-language altyapısı
- [ ] Moderasyon paneli (gelişmiş)
- [ ] Voice note mesajlaşma
- [ ] Satıcı performans detay dashboard'u

### Tasarımda En Kritik 10 Prensip

| # | Prensip | Açıklama |
|---|---|---|
| 1 | **Reverse-First UX** | Her ekran "alıcı ilan açar, satıcı teklif verir" mantığına göre kurulmalı. Sepet yok, ürün kataloğu yok. |
| 2 | **Güven Görünür Olmalı** | Badge, skor, doğrulama, escrow — güven elemanları her zaman erişilebilir ve anlaşılır olmalı. |
| 3 | **Ferahlık > Özellik Yoğunluğu** | Whitespace agresif kullanılmalı. Az eleman, çok etki. Sıkışık ekran = düşük conversion. |
| 4 | **3 Saniye Kuralı** | Her sayfa 3 saniyede amacını anlatmalı. Kullanıcı ne yapacağını hemen bilmeli. |
| 5 | **Tek Ürün, İki Rol** | Alıcı ve satıcı aynı uygulamada, aynı tasarım dilinde. İki ayrı uygulama hissi yok. |
| 6 | **Skeleton > Spinner** | Her yükleme durumunda skeleton loading. Spinner yasak (dashboard ve listeler için). |
| 7 | **Progressive Disclosure** | Karmaşıklığı gizle, adım adım göster. Multi-step form, expandable sections, "daha fazla" linkleri. |
| 8 | **Mobil-First, Desktop-Enhanced** | Tasarım mobilde başlar, desktop'ta zenginleşir. Tersi değil. |
| 9 | **Conversion-Driven Layout** | Her sayfanın tek bir ana CTA'sı var. Aksiyonlar rakip olmamalı, hiyerarşik olmalı. |
| 10 | **Controlled Motion** | Animasyonlar 500ms'i geçmez, her zaman amaca hizmet eder, dekoratif değildir. prefers-reduced-motion respect edilir. |

---

*Bu doküman yaşayan bir blueprint'tir. Geliştirme sürecinde güncellenmelidir.*
