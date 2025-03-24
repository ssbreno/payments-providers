import { PaymentEntity } from '../entites/payment.entity'

export interface CreatePaymentRequest {
  amount: number
  currency: string
  description: string
  card: {
    number: string
    holder: string
    cvv: string
    expiration: string
    installments: number
  }
}

export interface RefundRequest {
  amount: number
}

export interface IPaymentProviderRepository {
  getName(): string
  isHealthy(): boolean
  createPayment(payment: CreatePaymentRequest): Promise<PaymentEntity>
  getPayment(paymentId: string): Promise<PaymentEntity>
  refundPayment(paymentId: string, refund: RefundRequest): Promise<PaymentEntity>
}
