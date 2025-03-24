import { PaymentEntity } from '@src/modules/payments/domain/entites/payment.entity'
import { RefundEntity } from '@src/modules/payments/domain/entites/refund.entity'
import { PaymentMethod } from '@src/modules/payments/domain/enums/payment-method.enum'
import { PaymentStatus } from '@src/modules/payments/domain/enums/payment-status.enum'
import { RefundStatus } from '@src/modules/payments/domain/enums/refund-status.enum'

export class PaymentsMapperRepository {
  static mapToEntity(data: any): PaymentEntity {
    return PaymentEntity.create({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      status: this.mapPrismaStatusToDomain(data.status),
      paymentMethod: this.mapPrismaMethodToDomain(data.paymentMethod),
      providerName: data.providerName,
      providerId: data.providerId,
      cardId: data.cardId || undefined,
      originalAmount: data.originalAmount || undefined,
      currentAmount: data.currentAmount || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  static mapToRefundEntity(data: any): RefundEntity {
    return RefundEntity.create({
      id: data.id,
      paymentId: data.paymentId,
      amount: data.amount,
      status: this.mapPrismaRefundStatusToDomain(data.status),
      providerName: data.providerName,
      providerId: data.providerId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  static mapDomainStatusToPrisma(status: PaymentStatus): string {
    const mapping = {
      [PaymentStatus.PENDING]: 'PENDING',
      [PaymentStatus.AUTHORIZED]: 'AUTHORIZED',
      [PaymentStatus.PAID]: 'PAID',
      [PaymentStatus.FAILED]: 'FAILED',
      [PaymentStatus.REFUNDED]: 'REFUNDED',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'PARTIALLY_REFUNDED',
      [PaymentStatus.VOIDED]: 'VOIDED',
    } as Record<PaymentStatus, string>
    return mapping[status]
  }

  static mapPrismaStatusToDomain(status: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      PENDING: PaymentStatus.PENDING,
      AUTHORIZED: PaymentStatus.AUTHORIZED,
      PAID: PaymentStatus.PAID,
      FAILED: PaymentStatus.FAILED,
      REFUNDED: PaymentStatus.REFUNDED,
      PARTIALLY_REFUNDED: PaymentStatus.PARTIALLY_REFUNDED,
      VOIDED: PaymentStatus.VOIDED,
    }
    return mapping[status]
  }

  static mapDomainMethodToPrisma(method: PaymentMethod): string {
    const mapping = {
      [PaymentMethod.CARD]: 'CARD',
    } as Record<PaymentMethod, string>
    return mapping[method]
  }

  static mapPrismaMethodToDomain(method: string): PaymentMethod {
    const mapping: Record<string, PaymentMethod> = {
      CARD: PaymentMethod.CARD,
    }
    return mapping[method]
  }

  static mapDomainRefundStatusToPrisma(status: RefundStatus): string {
    const mapping = {
      [RefundStatus.PENDING]: 'PENDING',
      [RefundStatus.PROCESSED]: 'PROCESSED',
      [RefundStatus.FAILED]: 'FAILED',
    } as Record<RefundStatus, string>
    return mapping[status]
  }

  static mapPrismaRefundStatusToDomain(status: string): RefundStatus {
    const mapping: Record<string, RefundStatus> = {
      PENDING: RefundStatus.PENDING,
      PROCESSED: RefundStatus.PROCESSED,
      FAILED: RefundStatus.FAILED,
    }
    return mapping[status]
  }
}
