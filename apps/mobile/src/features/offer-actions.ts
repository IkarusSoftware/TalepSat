export type OfferActionContext = {
  status: string;
  isSeller: boolean;
  isBuyer: boolean;
  myConfirmed: boolean;
};

export function getOfferActionState(context: OfferActionContext) {
  const isAccepted = context.status === 'accepted';
  const isCompleted = context.status === 'completed';
  const isCounterOffered = context.status === 'counter_offered';
  const isPending = context.status === 'pending';
  const isRejected = context.status === 'rejected';

  return {
    showOrderStatus: isAccepted || isCompleted,
    needsConfirmation: isAccepted && !context.myConfirmed,
    canWithdraw: context.isSeller && (isPending || isCounterOffered),
    canEditOffer: context.isSeller && (isPending || isCounterOffered),
    canRespondCounter: context.isSeller && isCounterOffered,
    canReview: isCompleted,
    canCreateNewOffer: context.isSeller && isRejected,
    canSeeSellerCounterTools: context.isSeller && isCounterOffered,
    canSeeBuyerCounterTools: context.isBuyer && (isPending || isCounterOffered),
  };
}
