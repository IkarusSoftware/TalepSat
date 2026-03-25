import { z } from 'zod';

export const userRoleSchema = z.enum(['buyer', 'seller', 'both']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const verificationLevelSchema = z.enum([
  'none',
  'basic',      // Email + phone
  'identity',   // ID verification
  'address',    // Address verification
  'commercial', // Tax / company verification
  'premium',    // On-site verification
]);
export type VerificationLevel = z.infer<typeof verificationLevelSchema>;

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
    .regex(/[0-9]/, 'En az bir rakam içermeli'),
  fullName: z.string().min(2, 'İsim en az 2 karakter olmalı').max(100),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/, 'Geçerli bir telefon numarası girin'),
  role: userRoleSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Kullanım şartlarını kabul etmelisiniz' }) }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^(\+90|0)?[0-9]{10}$/),
  city: z.string().min(1, 'Şehir seçin'),
  district: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
