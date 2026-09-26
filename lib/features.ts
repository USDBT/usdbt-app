// Features whose screens exist but whose payment side is not built yet. A real order is
// charged for one card at the provider's price, so these stay off until settlement supports them.
export const FEATURES = {
  bulkOrders: false, // more than one card per order
  checkoutDiscounts: false, // points, referral and volume discounts at checkout
  nftCards: false, // on-chain NFT gift cards
  escrow: false, // holding funds until the buyer confirms the code
} as const
