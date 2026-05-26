import { ORDER_STATUS, type OrderStatus } from './order-status'

type ProgressMeta = {
  step: number
  totalSteps: number
  label: string
  terminal: boolean
}

const TOTAL_STEPS = 4

export function getOrderProgress(status: OrderStatus): ProgressMeta {
  switch (status) {
    case ORDER_STATUS.PENDING_PAYMENT:
      return { step: 1, totalSteps: TOTAL_STEPS, label: 'Waiting for payment', terminal: false }
    case ORDER_STATUS.USER_DEBITED:
      return { step: 2, totalSteps: TOTAL_STEPS, label: 'Payment received', terminal: false }
    case ORDER_STATUS.HOT_WALLET_FUNDED:
      return { step: 3, totalSteps: TOTAL_STEPS, label: 'Funding provider wallet', terminal: false }
    case ORDER_STATUS.BITREFILL_PROCESSING:
      return { step: 4, totalSteps: TOTAL_STEPS, label: 'Issuing your card', terminal: false }
    case ORDER_STATUS.DELIVERED:
      return { step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, label: 'Delivered', terminal: true }
    case ORDER_STATUS.REFUNDED:
      return { step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, label: 'Refunded', terminal: true }
    case ORDER_STATUS.FAILED:
    default:
      return { step: TOTAL_STEPS, totalSteps: TOTAL_STEPS, label: 'Failed', terminal: true }
  }
}

