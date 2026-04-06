import { describe, expect, it } from 'vitest';
import { getOfferActionState } from './offer-actions';

describe('getOfferActionState', () => {
  it('allows seller to edit and withdraw a pending offer', () => {
    const state = getOfferActionState({
      status: 'pending',
      isSeller: true,
      isBuyer: false,
      myConfirmed: false,
    });

    expect(state.canEditOffer).toBe(true);
    expect(state.canWithdraw).toBe(true);
    expect(state.canRespondCounter).toBe(false);
    expect(state.showOrderStatus).toBe(false);
  });

  it('allows seller to respond to a counter offer and revise it', () => {
    const state = getOfferActionState({
      status: 'counter_offered',
      isSeller: true,
      isBuyer: false,
      myConfirmed: false,
    });

    expect(state.canRespondCounter).toBe(true);
    expect(state.canEditOffer).toBe(true);
    expect(state.canWithdraw).toBe(true);
  });

  it('requires confirmation only for accepted offers with an unconfirmed side', () => {
    const state = getOfferActionState({
      status: 'accepted',
      isSeller: false,
      isBuyer: true,
      myConfirmed: false,
    });

    expect(state.showOrderStatus).toBe(true);
    expect(state.needsConfirmation).toBe(true);
    expect(state.canReview).toBe(false);
  });

  it('enables review flow for completed offers', () => {
    const state = getOfferActionState({
      status: 'completed',
      isSeller: true,
      isBuyer: false,
      myConfirmed: true,
    });

    expect(state.showOrderStatus).toBe(true);
    expect(state.canReview).toBe(true);
    expect(state.needsConfirmation).toBe(false);
  });

  it('offers a new-offer CTA for rejected seller offers', () => {
    const state = getOfferActionState({
      status: 'rejected',
      isSeller: true,
      isBuyer: false,
      myConfirmed: false,
    });

    expect(state.canCreateNewOffer).toBe(true);
    expect(state.canWithdraw).toBe(false);
  });
});
