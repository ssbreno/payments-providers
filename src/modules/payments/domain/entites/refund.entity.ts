import { BaseEntity } from '../../../../core/domain/base.entity'
import { RefundStatus } from '../enums/refund-status.enum'

export class RefundEntity extends BaseEntity {
  paymentId: string
  amount: number
  status: RefundStatus
  providerName: string
  providerId: string

  constructor(partial: Partial<RefundEntity>) {
    super()
    Object.assign(this, partial)
  }

  static create(partial: Partial<RefundEntity>): RefundEntity {
    return new RefundEntity(partial)
  }
}
