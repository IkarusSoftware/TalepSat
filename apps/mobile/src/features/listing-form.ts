import Ionicons from '@expo/vector-icons/Ionicons';

export const LISTING_CATEGORIES: Array<{
  label: string;
  slug: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { label: 'Elektronik', slug: 'elektronik', icon: 'desktop-outline' },
  { label: 'Tekstil & Konfeksiyon', slug: 'tekstil', icon: 'shirt-outline' },
  { label: 'Gida', slug: 'gida', icon: 'restaurant-outline' },
  { label: 'Yapi Malzemeleri', slug: 'yapi-malzemeleri', icon: 'construct-outline' },
  { label: 'Makine & Ekipman', slug: 'makine-ekipman', icon: 'build-outline' },
  { label: 'Otomotiv', slug: 'otomotiv', icon: 'car-sport-outline' },
  { label: 'Mobilya', slug: 'mobilya', icon: 'bed-outline' },
  { label: 'Kimyasal Urunler', slug: 'kimyasal', icon: 'flask-outline' },
  { label: 'Tarim', slug: 'tarim', icon: 'leaf-outline' },
  { label: 'Diger', slug: 'diger', icon: 'apps-outline' },
];

export const LISTING_DELIVERY_OPTIONS: Array<{
  value: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'urgent', label: 'Acil', hint: '1-3 gun', icon: 'flash-outline' },
  { value: 'week', label: '1 Hafta', hint: 'Hizli teslim', icon: 'time-outline' },
  { value: 'two_weeks', label: '2 Hafta', hint: 'Dengeli sure', icon: 'calendar-outline' },
  { value: 'month', label: '1 Ay', hint: 'Planli teslim', icon: 'hourglass-outline' },
  { value: 'flexible', label: 'Esnek', hint: 'Uygun teklif odakli', icon: 'swap-horizontal-outline' },
];
