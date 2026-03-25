import { z } from 'zod';

export const subscriptionPlanSchema = z.enum(['basic', 'plus', 'pro', 'enterprise']);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionBillingSchema = z.enum(['monthly', 'yearly']);
export type SubscriptionBilling = z.infer<typeof subscriptionBillingSchema>;

export interface PlanLimits {
  offersPerMonth: number;     // -1 = unlimited
  salesPerMonth: number;      // -1 = unlimited
  boostsPerMonth: number;
  overageOfferPrice: number;  // TL per extra offer
  commissionRate: number;     // percentage
  maxImageSize: number;       // MB
  maxUsers: number;           // -1 = unlimited
  hasAiSuggestions: boolean;
  hasApiAccess: boolean;
  hasDedicatedSupport: boolean;
  hasClosedListingAccess: boolean;
  hasAuctionAccess: boolean;
}

export const planLimits: Record<SubscriptionPlan, PlanLimits> = {
  basic: {
    offersPerMonth: 20,
    salesPerMonth: 5,
    boostsPerMonth: 0,
    overageOfferPrice: 15,
    commissionRate: 5,
    maxImageSize: 2,
    maxUsers: 1,
    hasAiSuggestions: false,
    hasApiAccess: false,
    hasDedicatedSupport: false,
    hasClosedListingAccess: false,
    hasAuctionAccess: false,
  },
  plus: {
    offersPerMonth: 100,
    salesPerMonth: 30,
    boostsPerMonth: 3,
    overageOfferPrice: 8,
    commissionRate: 3.5,
    maxImageSize: 2,
    maxUsers: 1,
    hasAiSuggestions: true,
    hasApiAccess: false,
    hasDedicatedSupport: false,
    hasClosedListingAccess: false,
    hasAuctionAccess: true,
  },
  pro: {
    offersPerMonth: -1,
    salesPerMonth: -1,
    boostsPerMonth: 10,
    overageOfferPrice: 0,
    commissionRate: 2,
    maxImageSize: 10,
    maxUsers: 3,
    hasAiSuggestions: true,
    hasApiAccess: true,
    hasDedicatedSupport: true,
    hasClosedListingAccess: true,
    hasAuctionAccess: true,
  },
  enterprise: {
    offersPerMonth: -1,
    salesPerMonth: -1,
    boostsPerMonth: -1,
    overageOfferPrice: 0,
    commissionRate: 0, // custom
    maxImageSize: 10,
    maxUsers: -1,
    hasAiSuggestions: true,
    hasApiAccess: true,
    hasDedicatedSupport: true,
    hasClosedListingAccess: true,
    hasAuctionAccess: true,
  },
};

export const planPricing: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  basic: { monthly: 299, yearly: 2870 },       // ~20% discount yearly
  plus: { monthly: 799, yearly: 7670 },
  pro: { monthly: 1499, yearly: 14390 },
  enterprise: { monthly: 0, yearly: 0 },        // custom pricing
};
