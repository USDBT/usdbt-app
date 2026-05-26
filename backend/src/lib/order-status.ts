export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  USER_DEBITED: 'user_debited',
  HOT_WALLET_FUNDED: 'hot_wallet_funded',
  BITREFILL_PROCESSING: 'bitrefill_processing',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

