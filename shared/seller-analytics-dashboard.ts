import type {
  SellerAnalyticsCategoryBreakdown,
  SellerAnalyticsCityBreakdown,
  SellerAnalyticsComparison,
  SellerAnalyticsListingBreakdown,
  SellerAnalyticsSnapshot,
  SellerAnalyticsStatusBreakdown,
} from './seller-analytics';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

export type SellerDashboardKpi = {
  key: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percent' | 'score';
  tone: Tone;
  hint?: string;
};

export type SellerDashboardSignal = {
  title: string;
  value: string;
  tone: Tone;
  subtitle: string;
};

export type SellerDashboardStatusShare = SellerAnalyticsStatusBreakdown & {
  share: number;
};

export type SellerDashboardCategoryShare = SellerAnalyticsCategoryBreakdown & {
  share: number;
};

export type SellerDashboardCityShare = SellerAnalyticsCityBreakdown & {
  share: number;
};

export type SellerDashboardListingRow = SellerAnalyticsListingBreakdown & {
  acceptanceRate: number;
  offerToViewRate: number;
  revenueShare: number;
};

export type SellerDashboardInsight = {
  title: string;
  body: string;
  tone: Tone;
};

export type SellerDashboardComparisonCard = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  format: 'number' | 'currency' | 'percent' | 'score';
};

export type SellerDashboardDerived = {
  kpis: SellerDashboardKpi[];
  signals: SellerDashboardSignal[];
  funnel: {
    views: number;
    offers: number;
    accepted: number;
    revenue: number;
    offerToViewRate: number;
    acceptanceRate: number;
    revenuePerAccepted: number;
  };
  statusShares: SellerDashboardStatusShare[];
  categoryShares: SellerDashboardCategoryShare[];
  cityShares: SellerDashboardCityShare[];
  listingRows: SellerDashboardListingRow[];
  insights: SellerDashboardInsight[];
  comparisonCards: SellerDashboardComparisonCard[];
};

function safePercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function toneFromDelta(delta: number): Tone {
  if (delta > 0) return 'success';
  if (delta < 0) return 'danger';
  return 'neutral';
}

function formatCountLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function buildInsights(snapshot: SellerAnalyticsSnapshot, rows: SellerDashboardListingRow[]): SellerDashboardInsight[] {
  const insights: SellerDashboardInsight[] = [];
  const { summary } = snapshot;

  if (summary.totalViews >= 20 && summary.totalOffers <= Math.max(2, Math.round(summary.totalViews * 0.05))) {
    insights.push({
      title: 'Goruntulenme var, teklif dusuk',
      body: 'Ilanlar dikkat cekiyor ama teklif akisi zayif. Baslik, ilk gorsel ve butce sunumunu sertlestirmek hizli etki yaratabilir.',
      tone: 'warning',
    });
  }

  if (summary.acceptanceRate < 20 && summary.totalOffers >= 5) {
    insights.push({
      title: 'Kabul orani baski altinda',
      body: 'Tekliflerin kucuk bir kismi kabul ediliyor. Teslim suresi, kapsam netligi ve ilk mesaj kalitesi tekrar gozden gecirilmeli.',
      tone: 'danger',
    });
  }

  if (summary.averageScore > 0 && summary.averageScore < 4.2 && summary.reviewCount >= 3) {
    insights.push({
      title: 'Musteri memnuniyeti izlenmeli',
      body: 'Puan ortalamasi kritik seviyeye yaklasiyor. Teslimat sonrasi takip ve net beklenti yonetimi onceliklenmeli.',
      tone: 'warning',
    });
  }

  if (snapshot.comparison?.delta.totalRevenue && snapshot.comparison.delta.totalRevenue > 20) {
    insights.push({
      title: 'Gelir momentumu guclu',
      body: 'Gecen doneme gore gelir belirgin artmis durumda. Yukselen kategoriler ve ilanlarin ortak desenini korumak mantikli gorunuyor.',
      tone: 'success',
    });
  }

  if (snapshot.comparison?.delta.totalRevenue && snapshot.comparison.delta.totalRevenue < -15) {
    insights.push({
      title: 'Gelir onceki donemin altinda',
      body: 'Gelir dususu goze carpiyor. Pro panelde filtreleri kullanip hangi ilan veya sehirde daralma oldugunu hizlica ayirabilirsin.',
      tone: 'danger',
    });
  }

  const dominantListing = rows[0];
  if (dominantListing && dominantListing.revenueShare >= 45) {
    insights.push({
      title: 'Gelir tek ilana yogunlasmis',
      body: `${dominantListing.title} toplam cironun buyuk kismini tasiyor. Bu iyi bir lider urun sinyali ama portfoy riski de yaratabilir.`,
      tone: 'accent',
    });
  }

  if (summary.totalOffers >= 8 && summary.acceptedOffers >= 3 && summary.totalRevenue > 0) {
    insights.push({
      title: 'Panel karar almaya uygun veri uretiyor',
      body: 'Elindeki teklif hacmi artik karsilastirma ve kategori bazli optimizasyon yapacak kadar anlamli gorunuyor.',
      tone: 'success',
    });
  }

  return insights.slice(0, 4);
}

function buildComparisonCards(comparison: SellerAnalyticsComparison | undefined, snapshot: SellerAnalyticsSnapshot) {
  if (!comparison) return [];
  return [
    {
      label: 'Toplam teklif',
      current: snapshot.summary.totalOffers,
      previous: comparison.previousPeriod.totalOffers,
      delta: comparison.delta.totalOffers,
      format: 'number' as const,
    },
    {
      label: 'Kabul edilen',
      current: snapshot.summary.acceptedOffers,
      previous: comparison.previousPeriod.acceptedOffers,
      delta: comparison.delta.acceptedOffers,
      format: 'number' as const,
    },
    {
      label: 'Toplam gelir',
      current: snapshot.summary.totalRevenue,
      previous: comparison.previousPeriod.totalRevenue,
      delta: comparison.delta.totalRevenue,
      format: 'currency' as const,
    },
    {
      label: 'Kabul orani',
      current: snapshot.summary.acceptanceRate,
      previous: comparison.previousPeriod.acceptanceRate,
      delta: comparison.delta.acceptanceRate,
      format: 'percent' as const,
    },
    {
      label: 'Goruntulenme',
      current: snapshot.summary.totalViews,
      previous: comparison.previousPeriod.totalViews,
      delta: comparison.delta.totalViews,
      format: 'number' as const,
    },
  ];
}

export function getSellerDashboardDerived(snapshot: SellerAnalyticsSnapshot): SellerDashboardDerived {
  const { summary } = snapshot;
  const offerToViewRate = safePercent(summary.totalOffers, summary.totalViews);
  const revenuePerAccepted = summary.acceptedOffers ? Number((summary.totalRevenue / summary.acceptedOffers).toFixed(0)) : 0;
  const avgViewsPerListing = summary.activeListings ? Number((summary.totalViews / summary.activeListings).toFixed(1)) : 0;

  const statusShares = (snapshot.breakdowns?.byStatus || []).map((item) => ({
    ...item,
    share: safePercent(item.count, Math.max(summary.totalOffers, 1)),
  }));

  const categoryShares = (snapshot.breakdowns?.byCategory || []).map((item) => ({
    ...item,
    share: safePercent(item.count, Math.max(summary.totalOffers, 1)),
  }));

  const cityShares = (snapshot.breakdowns?.byCity || []).map((item) => ({
    ...item,
    share: safePercent(item.count, Math.max(summary.totalOffers, 1)),
  }));

  const listingRows = (snapshot.breakdowns?.topListings || []).map((item) => ({
    ...item,
    acceptanceRate: safePercent(item.accepted, Math.max(item.count, 1)),
    offerToViewRate: safePercent(item.count, item.views),
    revenueShare: safePercent(item.revenue, Math.max(summary.totalRevenue, 1)),
  }));

  const strongestCategory = categoryShares[0];
  const strongestListing = listingRows[0];
  const strongestCity = cityShares[0];

  const signals: SellerDashboardSignal[] = [
    {
      title: 'Tekliften goruntulenmeye gecis',
      value: `%${offerToViewRate}`,
      tone: offerToViewRate >= 20 ? 'success' : offerToViewRate >= 10 ? 'accent' : 'warning',
      subtitle: `${summary.totalViews} goruntulenmeden ${formatCountLabel(summary.totalOffers, 'teklif', 'teklif')} cikti`,
    },
    {
      title: 'Ortalama kabul edilen is',
      value: revenuePerAccepted > 0 ? `${revenuePerAccepted.toLocaleString('tr-TR')} TL` : '0 TL',
      tone: revenuePerAccepted >= 5000 ? 'success' : revenuePerAccepted >= 2000 ? 'accent' : 'neutral',
      subtitle: `${formatCountLabel(summary.acceptedOffers, 'kabul', 'kabul')} uzerinden hesaplandi`,
    },
    {
      title: 'Portfoy cekim gucu',
      value: avgViewsPerListing ? `${avgViewsPerListing}` : '0',
      tone: avgViewsPerListing >= 20 ? 'success' : avgViewsPerListing >= 8 ? 'accent' : 'neutral',
      subtitle: `${formatCountLabel(summary.activeListings, 'aktif ilan', 'aktif ilan')} basina ortalama goruntulenme`,
    },
  ];

  if (snapshot.comparison) {
    signals.unshift({
      title: 'Donem momentumu',
      value: `${snapshot.comparison.delta.totalRevenue > 0 ? '+' : ''}${snapshot.comparison.delta.totalRevenue}%`,
      tone: toneFromDelta(snapshot.comparison.delta.totalRevenue),
      subtitle: 'Onceki doneme gore gelir degisimi',
    });
  }

  const kpis: SellerDashboardKpi[] = [
    {
      key: 'totalOffers',
      label: 'Toplam teklif',
      value: summary.totalOffers,
      format: 'number',
      tone: 'warning',
      hint: 'Secili zaman araliginda gelen toplam teklif',
    },
    {
      key: 'acceptedOffers',
      label: 'Kabul edilen',
      value: summary.acceptedOffers,
      format: 'number',
      tone: 'success',
      hint: 'Kazanilan is sayisi',
    },
    {
      key: 'pendingOffers',
      label: 'Bekleyen',
      value: summary.pendingOffers,
      format: 'number',
      tone: 'accent',
      hint: 'Aksiyon bekleyen teklifler',
    },
    {
      key: 'totalRevenue',
      label: 'Toplam kazanc',
      value: summary.totalRevenue,
      format: 'currency',
      tone: 'accent',
      hint: 'Kabul edilen islerden olusan gelir',
    },
    {
      key: 'acceptanceRate',
      label: 'Kabul orani',
      value: summary.acceptanceRate,
      format: 'percent',
      tone: summary.acceptanceRate >= 35 ? 'success' : summary.acceptanceRate >= 20 ? 'warning' : 'danger',
      hint: 'Tekliften kabule donus',
    },
    {
      key: 'totalViews',
      label: 'Goruntulenme',
      value: summary.totalViews,
      format: 'number',
      tone: 'neutral',
      hint: 'Secili aralikta izlenen toplam gorsunum',
    },
    {
      key: 'averageScore',
      label: 'Ortalama puan',
      value: summary.averageScore,
      format: 'score',
      tone: summary.averageScore >= 4.6 ? 'success' : summary.averageScore >= 4 ? 'accent' : 'warning',
      hint: `${formatCountLabel(summary.reviewCount, 'yorum', 'yorum')} baz alindi`,
    },
    {
      key: 'activeListings',
      label: 'Aktif ilan',
      value: summary.activeListings,
      format: 'number',
      tone: 'neutral',
      hint: 'Teklif alan benzersiz ilan sayisi',
    },
  ];

  if (strongestCategory) {
    signals.push({
      title: 'Guclu kategori',
      value: strongestCategory.label,
      tone: 'accent',
      subtitle: `${strongestCategory.count} teklif, %${strongestCategory.share} pay`,
    });
  }

  if (snapshot.tier === 'pro' && strongestCity) {
    signals.push({
      title: 'Yukselen sehir',
      value: strongestCity.label,
      tone: 'success',
      subtitle: `${strongestCity.count} teklif ve ${strongestCity.revenue.toLocaleString('tr-TR')} TL gelir`,
    });
  }

  if (snapshot.tier === 'pro' && strongestListing) {
    signals.push({
      title: 'Lokomotif ilan',
      value: strongestListing.title,
      tone: 'accent',
      subtitle: `%${strongestListing.revenueShare} gelir payi, %${strongestListing.acceptanceRate} kabul`,
    });
  }

  return {
    kpis,
    signals: signals.slice(0, snapshot.tier === 'pro' ? 6 : 4),
    funnel: {
      views: summary.totalViews,
      offers: summary.totalOffers,
      accepted: summary.acceptedOffers,
      revenue: summary.totalRevenue,
      offerToViewRate,
      acceptanceRate: summary.acceptanceRate,
      revenuePerAccepted,
    },
    statusShares,
    categoryShares,
    cityShares,
    listingRows,
    insights: buildInsights(snapshot, listingRows),
    comparisonCards: buildComparisonCards(snapshot.comparison, snapshot),
  };
}
