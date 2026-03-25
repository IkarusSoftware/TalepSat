export interface MockListing {
  id: string;
  category: string;
  categorySlug: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  offerCount: number;
  viewCount: number;
  status: 'active' | 'expired' | 'completed';
  createdAt: string;
  expiresAt: string;
  buyerId: string;
  buyerName: string;
  buyerInitials: string;
  buyerScore: number;
  images: string[];
}

export interface MockCounterOffer {
  price: number;
  deliveryDays?: number;
  note: string;
  createdAt: string;
}

export interface MockOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  listingCity: string;
  sellerId: string;
  sellerName: string;
  sellerInitials: string;
  sellerScore: number;
  sellerVerified: boolean;
  sellerCompletedDeals: number;
  sellerMemberSince: string;
  sellerBadge: 'basic' | 'plus' | 'pro' | null;
  price: number;
  deliveryDays: number;
  note: string;
  isBoosted: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offered' | 'withdrawn';
  counterOffer?: MockCounterOffer;
  rejectedReason?: string;
  revisionCount: number;
}

export const mockListings: MockListing[] = [
  {
    id: '1',
    category: 'Mobilya',
    categorySlug: 'mobilya',
    title: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    description: 'Yeni açılacak ofisimiz için mesh sırtlıklı, ayarlanabilir kol dayanaklı, bel destekli ergonomik ofis sandalyesi temin etmek istiyoruz. BIFMA sertifikalı olması tercih sebebidir. Renk: siyah veya koyu gri. Montaj dahil olmalıdır.',
    budgetMin: 250000,
    budgetMax: 400000,
    city: 'İstanbul',
    deliveryUrgency: '2 Hafta',
    offerCount: 12,
    viewCount: 345,
    status: 'active',
    createdAt: '2026-03-23T10:00:00Z',
    expiresAt: '2026-04-06T10:00:00Z',
    buyerId: 'b1',
    buyerName: 'Ayşe Yılmaz',
    buyerInitials: 'AY',
    buyerScore: 4.8,
    images: [],
  },
  {
    id: '2',
    category: 'Tekstil',
    categorySlug: 'tekstil',
    title: '5.000 Adet Polo Yaka Tişört — Logo Baskılı, Pamuklu',
    description: 'Şirket etkinliği için %100 pamuk polo yaka tişört ürettirilecektir. Göğüs sol tarafa logo baskısı (nakış veya serigrafi). Renkler: beyaz, lacivert, kırmızı. S-XXL beden dağılımı verilecektir.',
    budgetMin: 150000,
    budgetMax: 200000,
    city: 'İzmir',
    deliveryUrgency: '1 Ay',
    offerCount: 18,
    viewCount: 512,
    status: 'active',
    createdAt: '2026-03-22T14:00:00Z',
    expiresAt: '2026-04-05T14:00:00Z',
    buyerId: 'b2',
    buyerName: 'Mehmet Kaya',
    buyerInitials: 'MK',
    buyerScore: 4.5,
    images: [],
  },
  {
    id: '3',
    category: 'Elektronik',
    categorySlug: 'elektronik',
    title: '100 Adet Dizüstü Bilgisayar — i5 12. Nesil, 16GB RAM',
    description: 'Kurumsal kullanım için 100 adet dizüstü bilgisayar alınacaktır. Minimum özellikler: Intel i5 12. nesil veya AMD Ryzen 5 eşdeğeri, 16GB RAM, 512GB SSD, 14" IPS ekran. Garanti süresi en az 2 yıl olmalıdır.',
    budgetMin: 500000,
    budgetMax: 650000,
    city: 'Ankara',
    deliveryUrgency: '2 Hafta',
    offerCount: 6,
    viewCount: 289,
    status: 'active',
    createdAt: '2026-03-24T08:00:00Z',
    expiresAt: '2026-04-07T08:00:00Z',
    buyerId: 'b3',
    buyerName: 'Elif Öztürk',
    buyerInitials: 'EÖ',
    buyerScore: 4.9,
    images: [],
  },
  {
    id: '4',
    category: 'Ambalaj',
    categorySlug: 'ambalaj',
    title: '10.000 Adet Kraft Kargo Kutusu — 30x20x15cm',
    description: 'E-ticaret gönderileri için kraft karton kargo kutusu temin edilecektir. Boyut: 30x20x15cm. Çift oluklu, dayanıklı. İsteğe bağlı 1 renk baskı (logo). Teslimat İstanbul Avrupa yakası depo adresine.',
    budgetMin: 25000,
    budgetMax: 35000,
    city: 'İstanbul',
    deliveryUrgency: '1 Hafta',
    offerCount: 22,
    viewCount: 678,
    status: 'active',
    createdAt: '2026-03-21T16:00:00Z',
    expiresAt: '2026-03-28T16:00:00Z',
    buyerId: 'b4',
    buyerName: 'Deniz Yıldız',
    buyerInitials: 'DY',
    buyerScore: 4.3,
    images: [],
  },
  {
    id: '5',
    category: 'Endüstriyel',
    categorySlug: 'endustriyel',
    title: '50 Adet Çelik Depo Rafı — Ağır Yük, 5 Katlı',
    description: 'Depo düzenlemesi için ağır yük taşıma kapasiteli çelik raf sistemi. Her kat min 200kg taşıma kapasiteli. Boyut: 200x100x50cm. Kurulum dahil olmalı. Bursa OSB bölgesine teslimat.',
    budgetMin: 75000,
    budgetMax: 120000,
    city: 'Bursa',
    deliveryUrgency: '2 Hafta',
    offerCount: 9,
    viewCount: 187,
    status: 'active',
    createdAt: '2026-03-23T12:00:00Z',
    expiresAt: '2026-04-06T12:00:00Z',
    buyerId: 'b1',
    buyerName: 'Ayşe Yılmaz',
    buyerInitials: 'AY',
    buyerScore: 4.6,
    images: [],
  },
  {
    id: '6',
    category: 'Gıda',
    categorySlug: 'gida',
    title: '2 Ton Organik Zeytinyağı — Erken Hasat, Soğuk Sıkım',
    description: 'Restoran zincirimiz için erken hasat, soğuk sıkım organik sızma zeytinyağı tedarik edilecektir. Asitlik max %0.5. 5 litrelik teneke ambalaj tercih edilir. Üretim yılı 2025-2026 sezonu.',
    budgetMin: 180000,
    budgetMax: 250000,
    city: 'Antalya',
    deliveryUrgency: '1 Ay',
    offerCount: 15,
    viewCount: 423,
    status: 'active',
    createdAt: '2026-03-20T09:00:00Z',
    expiresAt: '2026-04-03T09:00:00Z',
    buyerId: 'b5',
    buyerName: 'Selin Arslan',
    buyerInitials: 'SA',
    buyerScore: 4.7,
    images: [],
  },
  {
    id: '7',
    category: 'Reklam & Baskı',
    categorySlug: 'reklam-baski',
    title: '1.000 Adet Karton Çanta — Full Renk Baskı, Saplı',
    description: 'Mağaza için özel tasarım karton çanta ürettirilecektir. Boyut: 26x32x12cm. 200gr kuşe, full renk ofset baskı, bez sap. Tasarım hazır, baskıya verilecektir.',
    budgetMin: 12000,
    budgetMax: 18000,
    city: 'Gaziantep',
    deliveryUrgency: '1 Hafta',
    offerCount: 28,
    viewCount: 891,
    status: 'active',
    createdAt: '2026-03-24T11:00:00Z',
    expiresAt: '2026-04-07T11:00:00Z',
    buyerId: 'b2',
    buyerName: 'Can Erdoğan',
    buyerInitials: 'CE',
    buyerScore: 4.4,
    images: [],
  },
  {
    id: '8',
    category: 'İnşaat',
    categorySlug: 'insaat',
    title: '500 m² Seramik Kaplama — 60x60cm, Mat, 1. Kalite',
    description: 'Ofis projesi için 500 m² zemin seramik kaplama malzemesi alınacaktır. 60x60cm, mat yüzey, 1. kalite, rektifiye. Renk: açık gri veya bej tonları. İşçilik dahil değil, sadece malzeme.',
    budgetMin: 45000,
    budgetMax: 70000,
    city: 'Konya',
    deliveryUrgency: '2 Hafta',
    offerCount: 11,
    viewCount: 234,
    status: 'active',
    createdAt: '2026-03-22T15:00:00Z',
    expiresAt: '2026-04-05T15:00:00Z',
    buyerId: 'b3',
    buyerName: 'Hakan Polat',
    buyerInitials: 'HP',
    buyerScore: 4.2,
    images: [],
  },
];

export const mockOffers: MockOffer[] = [
  // --- Listing 1: Ergonomik Ofis Sandalyesi ---
  {
    id: 'o1',
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    listingCategory: 'Mobilya',
    listingCity: 'İstanbul',
    sellerId: 's1',
    sellerName: 'Ergosan Mobilya A.Ş.',
    sellerInitials: 'EM',
    sellerScore: 4.9,
    sellerVerified: true,
    sellerCompletedDeals: 234,
    sellerMemberSince: '2024-03-01',
    sellerBadge: 'pro',
    price: 320000,
    deliveryDays: 10,
    note: 'BIFMA sertifikalı ürünlerimiz mevcuttur. 500 adet için özel fiyat uyguladık. Montaj dahildir.',
    isBoosted: true,
    createdAt: '2026-03-23T12:00:00Z',
    updatedAt: '2026-03-23T12:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },
  {
    id: 'o2',
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    listingCategory: 'Mobilya',
    listingCity: 'İstanbul',
    sellerId: 's2',
    sellerName: 'Office Plus Ltd.',
    sellerInitials: 'OP',
    sellerScore: 4.6,
    sellerVerified: true,
    sellerCompletedDeals: 87,
    sellerMemberSince: '2025-01-15',
    sellerBadge: 'plus',
    price: 285000,
    deliveryDays: 14,
    note: 'Mesh sırtlıklı, ayarlanabilir kol dayanaklı modellerimiz var. 2 yıl garanti.',
    isBoosted: false,
    createdAt: '2026-03-23T14:30:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    status: 'counter_offered',
    counterOffer: {
      price: 270000,
      deliveryDays: 12,
      note: 'Bütçemize uygun olması için fiyatı biraz düşürmenizi rica ediyoruz. Teslimatı 12 güne çekebilir misiniz?',
      createdAt: '2026-03-24T10:00:00Z',
    },
    revisionCount: 0,
  },
  {
    id: 'o3',
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    listingCategory: 'Mobilya',
    listingCity: 'İstanbul',
    sellerId: 's3',
    sellerName: 'Dekoratif Mobilya',
    sellerInitials: 'DM',
    sellerScore: 4.3,
    sellerVerified: false,
    sellerCompletedDeals: 42,
    sellerMemberSince: '2025-06-10',
    sellerBadge: 'basic',
    price: 260000,
    deliveryDays: 21,
    note: 'Yerli üretim, kaliteli malzeme. Teslimat 3 haftada mümkün.',
    isBoosted: false,
    createdAt: '2026-03-24T09:00:00Z',
    updatedAt: '2026-03-24T09:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },
  {
    id: 'o4',
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    listingCategory: 'Mobilya',
    listingCity: 'İstanbul',
    sellerId: 's4',
    sellerName: 'ProChair Türkiye',
    sellerInitials: 'PC',
    sellerScore: 4.8,
    sellerVerified: true,
    sellerCompletedDeals: 156,
    sellerMemberSince: '2024-08-20',
    sellerBadge: 'pro',
    price: 345000,
    deliveryDays: 7,
    note: 'Herman Miller lisanslı üretim. BIFMA + GREENGUARD sertifikalı. 5 yıl garanti. Hızlı teslimat.',
    isBoosted: false,
    createdAt: '2026-03-24T11:00:00Z',
    updatedAt: '2026-03-24T11:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },
  {
    id: 'o5',
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi — Mesh Sırt, Ayarlanabilir Kol',
    listingCategory: 'Mobilya',
    listingCity: 'İstanbul',
    sellerId: 's5',
    sellerName: 'Mega Ofis',
    sellerInitials: 'MO',
    sellerScore: 3.9,
    sellerVerified: true,
    sellerCompletedDeals: 28,
    sellerMemberSince: '2025-09-01',
    sellerBadge: null,
    price: 240000,
    deliveryDays: 18,
    note: 'Uygun fiyatlı, kaliteli ürün. Toptan fiyat avantajı.',
    isBoosted: false,
    createdAt: '2026-03-24T15:00:00Z',
    updatedAt: '2026-03-25T08:00:00Z',
    status: 'rejected',
    rejectedReason: 'Teslimat süresi çok uzun',
    revisionCount: 0,
  },

  // --- Listing 2: Polo Yaka Tişört ---
  {
    id: 'o6',
    listingId: '2',
    listingTitle: '5.000 Adet Polo Yaka Tişört — Logo Baskılı, Pamuklu',
    listingCategory: 'Tekstil',
    listingCity: 'İzmir',
    sellerId: 's1',
    sellerName: 'Ergosan Mobilya A.Ş.',
    sellerInitials: 'EM',
    sellerScore: 4.9,
    sellerVerified: true,
    sellerCompletedDeals: 234,
    sellerMemberSince: '2024-03-01',
    sellerBadge: 'pro',
    price: 175000,
    deliveryDays: 20,
    note: 'Tekstil bölümümüzden polo yaka üretimi yapılabilir. Nakış baskı dahil.',
    isBoosted: false,
    createdAt: '2026-03-22T16:00:00Z',
    updatedAt: '2026-03-23T09:00:00Z',
    status: 'accepted',
    revisionCount: 0,
  },
  {
    id: 'o7',
    listingId: '2',
    listingTitle: '5.000 Adet Polo Yaka Tişört — Logo Baskılı, Pamuklu',
    listingCategory: 'Tekstil',
    listingCity: 'İzmir',
    sellerId: 's6',
    sellerName: 'Deniz Tekstil',
    sellerInitials: 'DT',
    sellerScore: 4.7,
    sellerVerified: true,
    sellerCompletedDeals: 312,
    sellerMemberSince: '2023-11-01',
    sellerBadge: 'pro',
    price: 168000,
    deliveryDays: 25,
    note: '%100 pamuk, penye kumaş. Serigrafi baskı. Renk garantisi mevcuttur.',
    isBoosted: true,
    createdAt: '2026-03-22T18:00:00Z',
    updatedAt: '2026-03-23T09:00:00Z',
    status: 'rejected',
    rejectedReason: 'Başka bir teklif kabul edildi',
    revisionCount: 0,
  },

  // --- Listing 3: Dizüstü Bilgisayar ---
  {
    id: 'o8',
    listingId: '3',
    listingTitle: '100 Adet Dizüstü Bilgisayar — i5 12. Nesil, 16GB RAM',
    listingCategory: 'Elektronik',
    listingCity: 'Ankara',
    sellerId: 's2',
    sellerName: 'Office Plus Ltd.',
    sellerInitials: 'OP',
    sellerScore: 4.6,
    sellerVerified: true,
    sellerCompletedDeals: 87,
    sellerMemberSince: '2025-01-15',
    sellerBadge: 'plus',
    price: 580000,
    deliveryDays: 12,
    note: 'Lenovo ThinkPad serisi, kurumsal model. 3 yıl yerinde servis garantisi.',
    isBoosted: false,
    createdAt: '2026-03-24T09:00:00Z',
    updatedAt: '2026-03-24T09:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },
  {
    id: 'o9',
    listingId: '3',
    listingTitle: '100 Adet Dizüstü Bilgisayar — i5 12. Nesil, 16GB RAM',
    listingCategory: 'Elektronik',
    listingCity: 'Ankara',
    sellerId: 's7',
    sellerName: 'TeknoMarket Pro',
    sellerInitials: 'TM',
    sellerScore: 4.4,
    sellerVerified: true,
    sellerCompletedDeals: 65,
    sellerMemberSince: '2024-06-15',
    sellerBadge: 'plus',
    price: 545000,
    deliveryDays: 10,
    note: 'HP ProBook serisi. i5 13. nesil, 16GB, 512GB SSD. 2 yıl garanti + 1 yıl uzatılmış.',
    isBoosted: true,
    createdAt: '2026-03-24T10:30:00Z',
    updatedAt: '2026-03-25T11:00:00Z',
    status: 'counter_offered',
    counterOffer: {
      price: 520000,
      note: 'Fiyatı 520.000 TL\'ye çekebilir misiniz? 100 adet için toplu indirim bekliyoruz.',
      createdAt: '2026-03-25T11:00:00Z',
    },
    revisionCount: 0,
  },

  // --- Listing 4: Kraft Kargo Kutusu ---
  {
    id: 'o10',
    listingId: '4',
    listingTitle: '10.000 Adet Kraft Kargo Kutusu — 30x20x15cm',
    listingCategory: 'Ambalaj',
    listingCity: 'İstanbul',
    sellerId: 's3',
    sellerName: 'Dekoratif Mobilya',
    sellerInitials: 'DM',
    sellerScore: 4.3,
    sellerVerified: false,
    sellerCompletedDeals: 42,
    sellerMemberSince: '2025-06-10',
    sellerBadge: 'basic',
    price: 28000,
    deliveryDays: 5,
    note: 'Ambalaj ürünlerimiz de mevcuttur. Çift oluklu kraft. Baskısız teslim.',
    isBoosted: false,
    createdAt: '2026-03-22T10:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },

  // --- Listing 6: Zeytinyağı ---
  {
    id: 'o11',
    listingId: '6',
    listingTitle: '2 Ton Organik Zeytinyağı — Erken Hasat, Soğuk Sıkım',
    listingCategory: 'Gıda',
    listingCity: 'Antalya',
    sellerId: 's4',
    sellerName: 'ProChair Türkiye',
    sellerInitials: 'PC',
    sellerScore: 4.8,
    sellerVerified: true,
    sellerCompletedDeals: 156,
    sellerMemberSince: '2024-08-20',
    sellerBadge: 'pro',
    price: 210000,
    deliveryDays: 14,
    note: 'Ege bölgesi erken hasat zeytinyağı. Asitlik %0.3. Organik sertifikalı.',
    isBoosted: false,
    createdAt: '2026-03-21T08:00:00Z',
    updatedAt: '2026-03-22T14:00:00Z',
    status: 'withdrawn',
    revisionCount: 0,
  },

  // --- Listing 7: Karton Çanta ---
  {
    id: 'o12',
    listingId: '7',
    listingTitle: '1.000 Adet Karton Çanta — Full Renk Baskı, Saplı',
    listingCategory: 'Reklam & Baskı',
    listingCity: 'Gaziantep',
    sellerId: 's1',
    sellerName: 'Ergosan Mobilya A.Ş.',
    sellerInitials: 'EM',
    sellerScore: 4.9,
    sellerVerified: true,
    sellerCompletedDeals: 234,
    sellerMemberSince: '2024-03-01',
    sellerBadge: 'pro',
    price: 14500,
    deliveryDays: 7,
    note: 'Matbaa bölümümüzden full renk ofset baskı. 200gr kuşe, bez sap dahil.',
    isBoosted: false,
    createdAt: '2026-03-24T12:00:00Z',
    updatedAt: '2026-03-24T12:00:00Z',
    status: 'pending',
    revisionCount: 0,
  },
];

// --- Users ---

export interface MockUser {
  id: string;
  name: string;
  initials: string;
  role: 'buyer' | 'seller' | 'both';
  score: number;
  verified: boolean;
  city: string;
  memberSince: string;
  bio: string;
  completedDeals: number;
  companyName?: string;
  badge?: 'basic' | 'plus' | 'pro' | null;
  totalListings?: number;
}

export interface MockUserProfile extends MockUser {
  email: string;
  phone: string;
  taxNumber?: string;
  address?: string;
  notifications: {
    emailNewOffer: boolean;
    emailStatusChange: boolean;
    emailExpiry: boolean;
    push: boolean;
  };
}

export const mockUsers: MockUser[] = [
  {
    id: 'b1',
    name: 'Ayşe Yılmaz',
    initials: 'AY',
    role: 'both',
    score: 4.8,
    verified: true,
    city: 'İstanbul',
    memberSince: '2024-01-15',
    bio: 'Yılmaz Ticaret A.Ş. kurucusu. Mobilya, endüstriyel ekipman ve ofis malzemeleri alanında 10 yıllık tecrübe.',
    completedDeals: 234,
    companyName: 'Yılmaz Ticaret A.Ş.',
    badge: 'pro',
    totalListings: 12,
  },
  {
    id: 's2',
    name: 'Office Plus Ltd.',
    initials: 'OP',
    role: 'seller',
    score: 4.6,
    verified: true,
    city: 'Ankara',
    memberSince: '2025-01-15',
    bio: 'Kurumsal ofis çözümleri ve bilgi teknolojileri tedarikçisi. Lenovo, HP ve Dell yetkili bayi.',
    completedDeals: 87,
    companyName: 'Office Plus Ltd.',
    badge: 'plus',
  },
  {
    id: 's4',
    name: 'ProChair Türkiye',
    initials: 'PC',
    role: 'seller',
    score: 4.8,
    verified: true,
    city: 'İstanbul',
    memberSince: '2024-08-20',
    bio: 'Herman Miller lisanslı üretim. BIFMA ve GREENGUARD sertifikalı ergonomik mobilya üreticisi.',
    completedDeals: 156,
    companyName: 'ProChair Türkiye',
    badge: 'pro',
  },
  {
    id: 's6',
    name: 'Deniz Tekstil',
    initials: 'DT',
    role: 'seller',
    score: 4.7,
    verified: true,
    city: 'İzmir',
    memberSince: '2023-11-01',
    bio: 'Toptan tekstil üretimi ve promosyon ürünleri. Tişört, polo yaka, forma ve iş kıyafetleri.',
    completedDeals: 312,
    companyName: 'Deniz Tekstil San. Tic.',
    badge: 'pro',
  },
  {
    id: 'b2',
    name: 'Mehmet Kaya',
    initials: 'MK',
    role: 'buyer',
    score: 4.5,
    verified: true,
    city: 'İzmir',
    memberSince: '2025-02-10',
    bio: 'Etkinlik organizasyonu ve kurumsal hizmetler.',
    completedDeals: 8,
    totalListings: 5,
  },
];

export const mockUserProfile: MockUserProfile = {
  id: 'b1',
  name: 'Ayşe Yılmaz',
  initials: 'AY',
  role: 'both',
  score: 4.8,
  verified: true,
  city: 'İstanbul',
  memberSince: '2024-01-15',
  bio: 'Yılmaz Ticaret A.Ş. kurucusu. Mobilya, endüstriyel ekipman ve ofis malzemeleri alanında 10 yıllık tecrübe.',
  completedDeals: 234,
  companyName: 'Yılmaz Ticaret A.Ş.',
  badge: 'pro',
  totalListings: 12,
  email: 'ayse@yilmazticaret.com',
  phone: '0532 xxx xx xx',
  taxNumber: '1234567890',
  address: 'Levent, Beşiktaş / İstanbul',
  notifications: {
    emailNewOffer: true,
    emailStatusChange: true,
    emailExpiry: true,
    push: false,
  },
};

// Current mock user
export const currentUser = {
  id: 'b1',
  name: 'Ayşe Yılmaz',
  initials: 'AY',
  role: 'both' as const,
  sellerId: 's1',
};

// --- Messages ---

export interface MockMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface MockConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantInitials: string;
  participantVerified: boolean;
  listingId: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: MockMessage[];
}

export const mockConversations: MockConversation[] = [
  {
    id: 'conv1',
    participantId: 's2',
    participantName: 'Office Plus Ltd.',
    participantInitials: 'OP',
    participantVerified: true,
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi',
    lastMessage: 'Karşı teklifinizi inceledik, 275.000 TL\'ye anlaşabiliriz.',
    lastMessageAt: '2026-03-25T14:30:00Z',
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: 'b1', text: 'Merhaba, teklifinizle ilgili birkaç sorum olacak.', createdAt: '2026-03-24T10:00:00Z', read: true },
      { id: 'm2', senderId: 's2', text: 'Tabii, buyurun. Size nasıl yardımcı olabilirim?', createdAt: '2026-03-24T10:15:00Z', read: true },
      { id: 'm3', senderId: 'b1', text: 'BIFMA sertifikası mevcut mu? Ayrıca montaj dahil mi?', createdAt: '2026-03-24T10:20:00Z', read: true },
      { id: 'm4', senderId: 's2', text: 'Evet, tüm ürünlerimiz BIFMA sertifikalıdır. Montaj hizmeti İstanbul için ücretsizdir.', createdAt: '2026-03-24T10:35:00Z', read: true },
      { id: 'm5', senderId: 'b1', text: 'Fiyatta biraz indirim yapabilir misiniz? 270.000 TL düşünüyoruz.', createdAt: '2026-03-25T09:00:00Z', read: true },
      { id: 'm6', senderId: 's2', text: 'Karşı teklifinizi inceledik, 275.000 TL\'ye anlaşabiliriz.', createdAt: '2026-03-25T14:30:00Z', read: false },
      { id: 'm7', senderId: 's2', text: 'Bu fiyata montaj ve 2 yıl garanti dahildir.', createdAt: '2026-03-25T14:31:00Z', read: false },
    ],
  },
  {
    id: 'conv2',
    participantId: 's4',
    participantName: 'ProChair Türkiye',
    participantInitials: 'PC',
    participantVerified: true,
    listingId: '1',
    listingTitle: '500 Adet Ergonomik Ofis Sandalyesi',
    lastMessage: 'Herman Miller lisanslı ürünlerimizin kataloğunu ekte gönderiyorum.',
    lastMessageAt: '2026-03-25T11:00:00Z',
    unreadCount: 1,
    messages: [
      { id: 'm8', senderId: 's4', text: 'Merhaba, ilanınızı inceledik. Premium ürünlerimizle ilgilenebilirsiniz.', createdAt: '2026-03-24T15:00:00Z', read: true },
      { id: 'm9', senderId: 'b1', text: 'Merhaba, fiyat biraz yüksek ama kalite önemli. Detay paylaşır mısınız?', createdAt: '2026-03-24T16:00:00Z', read: true },
      { id: 'm10', senderId: 's4', text: 'Herman Miller lisanslı ürünlerimizin kataloğunu ekte gönderiyorum.', createdAt: '2026-03-25T11:00:00Z', read: false },
    ],
  },
  {
    id: 'conv3',
    participantId: 'b2',
    participantName: 'Mehmet Kaya',
    participantInitials: 'MK',
    participantVerified: true,
    listingId: '2',
    listingTitle: '5.000 Adet Polo Yaka Tişört',
    lastMessage: 'Teslimat için İzmir deposuna gönderim yapabilir misiniz?',
    lastMessageAt: '2026-03-24T18:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm11', senderId: 'b2', text: 'Teklifinizi aldık, teşekkürler. Birkaç detay sormak istiyorum.', createdAt: '2026-03-23T10:00:00Z', read: true },
      { id: 'm12', senderId: 'b1', text: 'Tabii, buyurun.', createdAt: '2026-03-23T10:30:00Z', read: true },
      { id: 'm13', senderId: 'b2', text: 'Teslimat için İzmir deposuna gönderim yapabilir misiniz?', createdAt: '2026-03-24T18:00:00Z', read: true },
    ],
  },
  {
    id: 'conv4',
    participantId: 's6',
    participantName: 'Deniz Tekstil',
    participantInitials: 'DT',
    participantVerified: true,
    listingId: '2',
    listingTitle: '5.000 Adet Polo Yaka Tişört',
    lastMessage: 'Numune gönderimini yarın kargoya veriyoruz.',
    lastMessageAt: '2026-03-23T16:00:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm14', senderId: 's6', text: 'Merhaba, polo yaka tişört konusunda uzmanız. Numune göndermemizi ister misiniz?', createdAt: '2026-03-22T14:00:00Z', read: true },
      { id: 'm15', senderId: 'b1', text: 'Evet, lütfen numune gönderin. Adres bilgilerini paylaşıyorum.', createdAt: '2026-03-22T15:00:00Z', read: true },
      { id: 'm16', senderId: 's6', text: 'Numune gönderimini yarın kargoya veriyoruz.', createdAt: '2026-03-23T16:00:00Z', read: true },
    ],
  },
];

// --- Notifications ---

export interface MockNotification {
  id: string;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'counter_offer' | 'message' | 'listing_expiry' | 'system';
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'n1',
    type: 'offer_received',
    title: 'Yeni teklif geldi',
    description: 'Ergosan Mobilya A.Ş. "500 Adet Ergonomik Ofis Sandalyesi" ilanına ₺320.000 teklif verdi.',
    link: '/offers/o1',
    read: false,
    createdAt: '2026-03-25T12:00:00Z',
  },
  {
    id: 'n2',
    type: 'counter_offer',
    title: 'Karşı teklif gönderildi',
    description: 'Office Plus Ltd. karşı teklifinize yanıt verdi: ₺275.000',
    link: '/offers/o2',
    read: false,
    createdAt: '2026-03-25T14:30:00Z',
  },
  {
    id: 'n3',
    type: 'message',
    title: 'Yeni mesaj',
    description: 'ProChair Türkiye size bir mesaj gönderdi.',
    link: '/messages',
    read: false,
    createdAt: '2026-03-25T11:00:00Z',
  },
  {
    id: 'n4',
    type: 'offer_accepted',
    title: 'Teklifiniz kabul edildi!',
    description: '"5.000 Adet Polo Yaka Tişört" ilanı için teklifiniz kabul edildi.',
    link: '/offers/o6',
    read: true,
    createdAt: '2026-03-23T09:00:00Z',
  },
  {
    id: 'n5',
    type: 'listing_expiry',
    title: 'İlan süresi dolmak üzere',
    description: '"10.000 Adet Kraft Kargo Kutusu" ilanının süresinin dolmasına 3 gün kaldı.',
    link: '/listing/4',
    read: true,
    createdAt: '2026-03-25T08:00:00Z',
  },
  {
    id: 'n6',
    type: 'offer_rejected',
    title: 'Teklifiniz reddedildi',
    description: '"500 Adet Ergonomik Ofis Sandalyesi" için Mega Ofis\'in teklifi reddedildi.',
    link: '/offers/o5',
    read: true,
    createdAt: '2026-03-25T08:00:00Z',
  },
  {
    id: 'n7',
    type: 'system',
    title: 'Hoş geldin!',
    description: 'TalepSat\'a hoş geldiniz. Profilinizi tamamlayarak daha fazla teklif alabilirsiniz.',
    link: '/settings',
    read: true,
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'n8',
    type: 'offer_received',
    title: 'Yeni teklif geldi',
    description: 'Dekoratif Mobilya "500 Adet Ergonomik Ofis Sandalyesi" ilanına ₺260.000 teklif verdi.',
    link: '/offers/o3',
    read: true,
    createdAt: '2026-03-24T09:00:00Z',
  },
];

// --- Subscription Plans ---

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'free' | 'basic' | 'plus' | 'pro';
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge: string | null;
  popular: boolean;
  features: PlanFeature[];
  limits: {
    offersPerMonth: number | null;
    boostPerMonth: number;
    responseTime: string;
    analytics: boolean;
    prioritySupport: boolean;
    verifiedBadge: boolean;
    customProfile: boolean;
  };
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Başlangıç',
    slug: 'free',
    description: 'Platformu keşfet, ilk tekliflerini ver.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    popular: false,
    features: [
      { text: 'Ayda 5 teklif hakkı', included: true },
      { text: 'Temel profil sayfası', included: true },
      { text: 'Mesajlaşma', included: true },
      { text: 'Teklif öne çıkarma', included: false },
      { text: 'Detaylı analitik', included: false },
      { text: 'Öncelikli destek', included: false },
      { text: 'Doğrulanmış rozet', included: false },
      { text: 'Özel profil sayfası', included: false },
    ],
    limits: {
      offersPerMonth: 5,
      boostPerMonth: 0,
      responseTime: 'Standart',
      analytics: false,
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
    },
  },
  {
    id: 'plan-basic',
    name: 'Basic',
    slug: 'basic',
    description: 'Küçük işletmeler için ideal başlangıç paketi.',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    badge: 'basic',
    popular: false,
    features: [
      { text: 'Ayda 25 teklif hakkı', included: true },
      { text: 'Temel profil sayfası', included: true },
      { text: 'Mesajlaşma', included: true },
      { text: 'Ayda 3 teklif öne çıkarma', included: true },
      { text: 'Temel analitik', included: true },
      { text: 'Öncelikli destek', included: false },
      { text: 'Doğrulanmış rozet', included: false },
      { text: 'Özel profil sayfası', included: false },
    ],
    limits: {
      offersPerMonth: 25,
      boostPerMonth: 3,
      responseTime: 'Standart',
      analytics: true,
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
    },
  },
  {
    id: 'plan-plus',
    name: 'Plus',
    slug: 'plus',
    description: 'Büyüyen işletmeler için güçlü araçlar.',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    badge: 'plus',
    popular: true,
    features: [
      { text: 'Ayda 100 teklif hakkı', included: true },
      { text: 'Gelişmiş profil sayfası', included: true },
      { text: 'Mesajlaşma', included: true },
      { text: 'Ayda 10 teklif öne çıkarma', included: true },
      { text: 'Detaylı analitik', included: true },
      { text: 'Öncelikli destek', included: true },
      { text: 'Doğrulanmış rozet', included: true },
      { text: 'Özel profil sayfası', included: false },
    ],
    limits: {
      offersPerMonth: 100,
      boostPerMonth: 10,
      responseTime: '4 saat içinde',
      analytics: true,
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: false,
    },
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Profesyonel satıcılar için sınırsız erişim.',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    badge: 'pro',
    popular: false,
    features: [
      { text: 'Sınırsız teklif hakkı', included: true },
      { text: 'Premium profil sayfası', included: true },
      { text: 'Mesajlaşma', included: true },
      { text: 'Sınırsız teklif öne çıkarma', included: true },
      { text: 'Gelişmiş analitik & raporlama', included: true },
      { text: 'Öncelikli destek (1 saat)', included: true },
      { text: 'Doğrulanmış rozet', included: true },
      { text: 'Özel profil sayfası', included: true },
    ],
    limits: {
      offersPerMonth: null,
      boostPerMonth: 999,
      responseTime: '1 saat içinde',
      analytics: true,
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
    },
  },
];

// --- Current Subscription ---

export interface MockSubscription {
  planId: string;
  planName: string;
  planSlug: 'free' | 'basic' | 'plus' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  offersUsed: number;
  offersLimit: number | null;
  boostsUsed: number;
  boostsLimit: number;
  autoRenew: boolean;
  paymentMethod: {
    type: 'card';
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  invoices: MockInvoice[];
}

export interface MockInvoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

export const currentSubscription: MockSubscription = {
  planId: 'plan-pro',
  planName: 'Pro',
  planSlug: 'pro',
  billingCycle: 'yearly',
  currentPeriodStart: '2026-01-15',
  currentPeriodEnd: '2027-01-15',
  offersUsed: 47,
  offersLimit: null,
  boostsUsed: 12,
  boostsLimit: 999,
  autoRenew: true,
  paymentMethod: {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2027,
  },
  invoices: [
    { id: 'inv-1', date: '2026-01-15', amount: 9990, status: 'paid', description: 'Pro Plan — Yıllık Abonelik' },
    { id: 'inv-2', date: '2025-12-15', amount: 999, status: 'paid', description: 'Pro Plan — Aylık Abonelik' },
    { id: 'inv-3', date: '2025-11-15', amount: 599, status: 'paid', description: 'Plus Plan — Aylık Abonelik' },
    { id: 'inv-4', date: '2025-10-15', amount: 599, status: 'paid', description: 'Plus Plan — Aylık Abonelik' },
  ],
};

// --- Admin Panel ---

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalOffers: number;
  totalRevenue: number;
  activeUsers30d: number;
  newUsersToday: number;
  pendingReports: number;
  pendingListingApprovals: number;
}

export const adminStats: AdminStats = {
  totalUsers: 2847,
  totalListings: 1234,
  totalOffers: 5621,
  totalRevenue: 487500,
  activeUsers30d: 1456,
  newUsersToday: 23,
  pendingReports: 7,
  pendingListingApprovals: 12,
};

export interface AdminReport {
  id: string;
  type: 'listing' | 'user' | 'offer' | 'message';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reportedBy: string;
  reportedByInitials: string;
  targetId: string;
  targetTitle: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export const adminReports: AdminReport[] = [
  {
    id: 'r1',
    type: 'listing',
    reason: 'Yanıltıcı ilan',
    description: 'İlan açıklaması ile görseller uyuşmuyor. Fiyat aralığı gerçekçi değil.',
    status: 'pending',
    reportedBy: 'Mehmet Kaya',
    reportedByInitials: 'MK',
    targetId: '5',
    targetTitle: '500 Adet Güvenlik Kamerası — 4K, PoE',
    createdAt: '2026-03-25T09:00:00Z',
    priority: 'high',
  },
  {
    id: 'r2',
    type: 'user',
    reason: 'Sahte profil',
    description: 'Kullanıcı birden fazla hesap açarak teklif manipülasyonu yapıyor.',
    status: 'pending',
    reportedBy: 'Office Plus Ltd.',
    reportedByInitials: 'OP',
    targetId: 's3',
    targetTitle: 'Dekoratif Mobilya',
    createdAt: '2026-03-25T07:30:00Z',
    priority: 'high',
  },
  {
    id: 'r3',
    type: 'offer',
    reason: 'Spam teklif',
    description: 'Aynı satıcı tüm ilanlara aynı düşük fiyat teklifi gönderiyor.',
    status: 'pending',
    reportedBy: 'Ayşe Yılmaz',
    reportedByInitials: 'AY',
    targetId: 'o10',
    targetTitle: 'Dekoratif Mobilya — 28.000 TL teklif',
    createdAt: '2026-03-24T16:00:00Z',
    priority: 'medium',
  },
  {
    id: 'r4',
    type: 'message',
    reason: 'Uygunsuz mesaj',
    description: 'Satıcı platform dışında ödeme yapmayı teklif ediyor.',
    status: 'pending',
    reportedBy: 'ProChair Türkiye',
    reportedByInitials: 'PC',
    targetId: 'conv3',
    targetTitle: 'Mehmet Kaya — mesaj ihlali',
    createdAt: '2026-03-24T12:00:00Z',
    priority: 'medium',
  },
  {
    id: 'r5',
    type: 'listing',
    reason: 'Yasaklı ürün',
    description: 'İlanda yasaklı bir ürün kategorisi satışa sunulmuş.',
    status: 'reviewed',
    reportedBy: 'Deniz Tekstil',
    reportedByInitials: 'DT',
    targetId: '8',
    targetTitle: 'Bilinmeyen Ürün İlanı',
    createdAt: '2026-03-23T14:00:00Z',
    priority: 'high',
  },
  {
    id: 'r6',
    type: 'user',
    reason: 'Kötü niyetli davranış',
    description: 'Teklifleri kabul edip sonra sürekli iptal ediyor.',
    status: 'resolved',
    reportedBy: 'Ergosan Mobilya A.Ş.',
    reportedByInitials: 'EM',
    targetId: 'b2',
    targetTitle: 'Mehmet Kaya',
    createdAt: '2026-03-22T10:00:00Z',
    priority: 'low',
  },
  {
    id: 'r7',
    type: 'listing',
    reason: 'Telif hakkı ihlali',
    description: 'İlanda başka bir firmanın görselleri izinsiz kullanılmış.',
    status: 'dismissed',
    reportedBy: 'TeknoMarket Pro',
    reportedByInitials: 'TM',
    targetId: '3',
    targetTitle: '100 Adet Dizüstü Bilgisayar',
    createdAt: '2026-03-21T08:00:00Z',
    priority: 'low',
  },
];

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: 'buyer' | 'seller' | 'both';
  status: 'active' | 'suspended' | 'banned';
  plan: 'free' | 'basic' | 'plus' | 'pro';
  verified: boolean;
  joinedAt: string;
  lastActiveAt: string;
  listingsCount: number;
  offersCount: number;
  reportsCount: number;
}

export const adminUsers: AdminUser[] = [
  {
    id: 'b1', name: 'Ayşe Yılmaz', initials: 'AY', email: 'ayse@yilmazticaret.com',
    role: 'both', status: 'active', plan: 'pro', verified: true,
    joinedAt: '2024-01-15', lastActiveAt: '2026-03-25T14:00:00Z',
    listingsCount: 12, offersCount: 47, reportsCount: 0,
  },
  {
    id: 's2', name: 'Office Plus Ltd.', initials: 'OP', email: 'info@officeplus.com',
    role: 'seller', status: 'active', plan: 'plus', verified: true,
    joinedAt: '2025-01-15', lastActiveAt: '2026-03-25T12:00:00Z',
    listingsCount: 0, offersCount: 34, reportsCount: 0,
  },
  {
    id: 's3', name: 'Dekoratif Mobilya', initials: 'DM', email: 'iletisim@dekoratif.com',
    role: 'seller', status: 'suspended', plan: 'basic', verified: false,
    joinedAt: '2025-06-10', lastActiveAt: '2026-03-24T09:00:00Z',
    listingsCount: 0, offersCount: 18, reportsCount: 3,
  },
  {
    id: 's4', name: 'ProChair Türkiye', initials: 'PC', email: 'satis@prochair.com.tr',
    role: 'seller', status: 'active', plan: 'pro', verified: true,
    joinedAt: '2024-08-20', lastActiveAt: '2026-03-25T11:00:00Z',
    listingsCount: 0, offersCount: 89, reportsCount: 0,
  },
  {
    id: 'b2', name: 'Mehmet Kaya', initials: 'MK', email: 'mehmet@kayaetkinlik.com',
    role: 'buyer', status: 'active', plan: 'free', verified: true,
    joinedAt: '2025-02-10', lastActiveAt: '2026-03-24T18:00:00Z',
    listingsCount: 5, offersCount: 0, reportsCount: 2,
  },
  {
    id: 's6', name: 'Deniz Tekstil', initials: 'DT', email: 'siparis@deniztekstil.com',
    role: 'seller', status: 'active', plan: 'pro', verified: true,
    joinedAt: '2023-11-01', lastActiveAt: '2026-03-23T16:00:00Z',
    listingsCount: 0, offersCount: 156, reportsCount: 0,
  },
  {
    id: 's7', name: 'TeknoMarket Pro', initials: 'TM', email: 'info@teknomarket.com',
    role: 'seller', status: 'active', plan: 'plus', verified: true,
    joinedAt: '2024-06-15', lastActiveAt: '2026-03-25T10:00:00Z',
    listingsCount: 0, offersCount: 65, reportsCount: 0,
  },
  {
    id: 'b3', name: 'Ali Vural', initials: 'AV', email: 'ali.vural@gmail.com',
    role: 'buyer', status: 'banned', plan: 'free', verified: false,
    joinedAt: '2026-01-05', lastActiveAt: '2026-03-15T08:00:00Z',
    listingsCount: 2, offersCount: 0, reportsCount: 5,
  },
];
