import { z } from 'zod';

export const offerStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
  'counter_offered',
  'expired',
]);
export type OfferStatus = z.infer<typeof offerStatusSchema>;

export const createOfferSchema = z.object({
  listingId: z.string().min(1),
  price: z.number().min(1, 'Teklif tutarı girin'),
  deliveryDays: z.number().min(1, 'Teslimat süresi girin').max(365),
  note: z
    .string()
    .max(500, 'Not en fazla 500 karakter olabilir')
    .optional(),
  attachments: z.array(z.string().url()).max(3).optional(),
});
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const counterOfferSchema = z.object({
  offerId: z.string().min(1),
  price: z.number().min(1, 'Teklif tutarı girin'),
  deliveryDays: z.number().min(1).max(365).optional(),
  note: z.string().max(500).optional(),
});
export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

export const offerSchema = createOfferSchema.extend({
  id: z.string(),
  sellerId: z.string(),
  status: offerStatusSchema,
  isBoosted: z.boolean().default(false),
  revisionCount: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Offer = z.infer<typeof offerSchema>;
