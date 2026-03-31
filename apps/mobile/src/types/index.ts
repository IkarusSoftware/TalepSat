export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  badge: string | null;
  verified: boolean;
  image: string | null;
  city: string | null;
  bio: string | null;
  companyName?: string | null;
  taxNumber?: string | null;
  phone?: string | null;
  score: number;
  completedDeals: number;
  createdAt?: string;
  lastSeen?: string;
  // From GET /api/users/[id]
  listingCount?: number;
  totalOffers?: number;
  acceptedOffers?: number;
  acceptRate?: number;
  reviewCount?: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  deliveryUrgency: string;
  status: string;
  images: string[];
  viewCount: number;
  offerCount: number;
  expiresAt: string | null;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  buyerInitials: string;
  buyerScore: number;
  buyerVerified: boolean;
  buyerImage?: string | null;
  offers?: Offer[];
}

export interface Offer {
  id: string;
  price: number;
  deliveryDays: number;
  note: string | null;
  status: string;
  boosted: boolean;
  counterPrice: number | null;
  counterDays: number | null;
  counterNote: string | null;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  listingId: string;
  sellerId: string;
  // Denormalized from API
  listingTitle?: string;
  listingCategory?: string;
  listingCity?: string;
  sellerName?: string;
  sellerInitials?: string;
  sellerScore?: number;
  sellerVerified?: boolean;
  sellerBadge?: string | null;
  sellerCompletedDeals?: number;
  sellerMemberSince?: string;
  buyerName?: string;
}

export interface Conversation {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  participantId: string;
  participantName: string;
  participantInitials: string;
  participantVerified: boolean;
  participantLastSeen: string | null;
  participantImage?: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  muted: boolean;
  acceptedOfferId?: string | null;
  acceptedOfferStatus?: string | null;
  isBuyerInOffer?: boolean;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  sender?: { id: string; name: string };
  attachments: MessageAttachment[] | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; image: string | null };
  offer: { id: string; price: number; listing: { id: string; title: string; category: string; city: string } };
}

export interface Order {
  id: string;
  price: number;
  deliveryDays: number;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  listingId: string;
  listingTitle: string;
  listingCategory: string;
  listingCity: string;
  isBuyer: boolean;
  buyerId?: string;
  sellerId?: string;
  sellerName: string;
  sellerScore?: number;
  sellerVerified?: boolean;
  buyerName: string;
  buyerVerified?: boolean;
  hasMyReview?: boolean;
  myReviewRating?: number | null;
  totalReviews?: number;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  offersPerMonth: number;
  boostPerMonth: number;
  maxListings: number;
  analytics: boolean;
  prioritySupport: boolean;
  verifiedBadge: boolean;
}
