import { BaseEntity } from '../../../../core/domain/base.entity'
import { PaymentMethod } from '../enums/payment-method.enum'
import { PaymentStatus } from '../enums/payment-status.enum'

export class PaymentEntity extends BaseEntity {
  amount: number
  currency: string
  description: string
  status: PaymentStatus
  paymentMethod: PaymentMethod
  providerName: string
  providerId: string
  cardId?: string
  originalAmount?: number
  currentAmount?: number

  constructor(partial: Partial<PaymentEntity>) {
    super()
    Object.assign(this, partial)
  }

  static create(partial: Partial<PaymentEntity>): PaymentEntity {
    return new PaymentEntity(partial)
  }

  isRefundable(): boolean {
    return (
      this.status === PaymentStatus.AUTHORIZED ||
      this.status === PaymentStatus.PAID ||
      this.status === PaymentStatus.PARTIALLY_REFUNDED
    )
  }

  canBeRefunded(amount: number): boolean {
    if (!this.isRefundable()) {
      return false
    }
    return typeof this.currentAmount === 'number' && this.currentAmount >= amount
  }
}
