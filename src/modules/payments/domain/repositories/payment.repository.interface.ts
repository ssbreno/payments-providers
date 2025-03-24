import { PaymentEntity } from '../entites/payment.entity'
import { RefundEntity } from '../entites/refund.entity'
import { PaymentStatus } from '../enums/payment-status.enum'

export interface IPaymentRepository {
  create(payment: PaymentEntity): Promise<PaymentEntity>
  update(id: string, data: Partial<PaymentEntity>): Promise<PaymentEntity>
  findById(id: string): Promise<PaymentEntity | null>
  findAll(): Promise<PaymentEntity[]>
  findByStatus(status: PaymentStatus): Promise<PaymentEntity[]>
  createRefund(refund: Partial<RefundEntity>): Promise<RefundEntity>
  findRefundsByPaymentId(paymentId: string): Promise<RefundEntity[]>
}
