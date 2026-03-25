import { z } from 'zod';

export const listingStatusSchema = z.enum([
  'draft',
  'active',
  'expired',
  'completed',
  'cancelled',
]);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const budgetTypeSchema = z.enum([
  'fixed',     // Sabit fiyat
  'range',     // Aralık
  'open',      // Teklif bekliyorum
]);
export type BudgetType = z.infer<typeof budgetTypeSchema>;

export const deliveryUrgencySchema = z.enum([
  'urgent',    // Acil (1-3 gün)
  'week',      // 1 hafta
  'two_weeks', // 2 hafta
  'month',     // 1 ay
  'flexible',  // Esnek
  'custom',    // Özel tarih
]);
export type DeliveryUrgency = z.infer<typeof deliveryUrgencySchema>;

// Step 1: Category
export const listingStep1Schema = z.object({
  categoryId: z.string().min(1, 'Kategori seçin'),
  subcategoryId: z.string().optional(),
});

// Step 2: Details
export const listingStep2Schema = z.object({
  title: z
    .string()
    .min(10, 'Başlık en az 10 karakter olmalı')
    .max(120, 'Başlık en fazla 120 karakter olabilir'),
  description: z
    .string()
    .min(50, 'Açıklama en az 50 karakter olmalı')
    .max(5000, 'Açıklama en fazla 5000 karakter olabilir'),
  quantity: z.number().min(1, 'Miktar en az 1 olmalı').optional(),
  unit: z.string().optional(), // adet, kg, metre, vs.
  deliveryUrgency: deliveryUrgencySchema,
  customDeliveryDate: z.string().datetime().optional(),
  city: z.string().min(1, 'Şehir seçin'),
  district: z.string().optional(),
  // Dynamic fields based on category (stored as JSON)
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// Step 3: Budget
export const listingStep3Schema = z.object({
  budgetType: budgetTypeSchema,
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  budgetFixed: z.number().min(0).optional(),
  includesVat: z.boolean().default(false),
});

// Step 4: Media
export const listingStep4Schema = z.object({
  images: z
    .array(z.string().url())
    .min(1, 'En az 1 görsel yükleyin')
    .max(10, 'En fazla 10 görsel yükleyebilirsiniz'),
  documents: z
    .array(z.string().url())
    .max(5, 'En fazla 5 doküman yükleyebilirsiniz')
    .optional(),
});

// Step 5: Listing Duration
export const listingStep5Schema = z.object({
  durationDays: z.enum(['7', '14', '30']),
});

// Full listing creation schema
export const createListingSchema = listingStep1Schema
  .merge(listingStep2Schema)
  .merge(listingStep3Schema)
  .merge(listingStep4Schema)
  .merge(listingStep5Schema);

export type CreateListingInput = z.infer<typeof createListingSchema>;

// Listing response type
export const listingSchema = createListingSchema.extend({
  id: z.string(),
  buyerId: z.string(),
  status: listingStatusSchema,
  viewCount: z.number(),
  offerCount: z.number(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Listing = z.infer<typeof listingSchema>;
