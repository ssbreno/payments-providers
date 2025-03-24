import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infraestructure/prisma/prisma.service'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { RefundEntity } from '../../domain/entites/refund.entity'
import { PaymentStatus } from '../../domain/enums/payment-status.enum'
import { RefundStatus } from '../../domain/enums/refund-status.enum'
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface'
import { PaymentsMapperRepository } from './mappers/payments.mapper.repository'

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(private prisma: PrismaService) {}

  async create(payment: PaymentEntity): Promise<PaymentEntity> {
    const paymentData = await this.prisma.payment.create({
      data: {
        id: payment.id || undefined,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        status: PaymentsMapperRepository.mapDomainStatusToPrisma(payment.status) as any,
        paymentMethod: PaymentsMapperRepository.mapDomainMethodToPrisma(
          payment.paymentMethod,
        ) as any,
        providerName: payment.providerName,
        providerId: payment.providerId,
        cardId: payment.cardId,
        originalAmount: payment.originalAmount,
        currentAmount: payment.currentAmount || payment.amount,
      },
    })

    return PaymentsMapperRepository.mapToEntity(paymentData)
  }

  async update(id: string, data: Partial<PaymentEntity>): Promise<PaymentEntity> {
    const updateData: any = {}

    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined)
      updateData.status = PaymentsMapperRepository.mapDomainStatusToPrisma(data.status) as any
    if (data.paymentMethod !== undefined)
      updateData.paymentMethod = PaymentsMapperRepository.mapDomainMethodToPrisma(
        data.paymentMethod,
      ) as any
    if (data.providerName !== undefined) updateData.providerName = data.providerName
    if (data.providerId !== undefined) updateData.providerId = data.providerId
    if (data.cardId !== undefined) updateData.cardId = data.cardId
    if (data.originalAmount !== undefined) updateData.originalAmount = data.originalAmount
    if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount

    const paymentData = await this.prisma.payment.update({
      where: { id },
      data: updateData,
    })

    return PaymentsMapperRepository.mapToEntity(paymentData)
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return null
    }

    return PaymentsMapperRepository.mapToEntity(payment)
  }

  async findAll(): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return payments.map((payment: any) => PaymentsMapperRepository.mapToEntity(payment))
  }

  async findByStatus(status: PaymentStatus): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentsMapperRepository.mapDomainStatusToPrisma(status) as any },
      orderBy: { createdAt: 'desc' },
    })

    return payments.map((payment: any) => PaymentsMapperRepository.mapToEntity(payment))
  }

  async createRefund(refund: Partial<RefundEntity>): Promise<RefundEntity> {
    const refundData = await this.prisma.refund.create({
      data: {
        id: refund.id || undefined,
        paymentId: refund.paymentId as string,
        amount: refund.amount as number,
        status: PaymentsMapperRepository.mapDomainRefundStatusToPrisma(
          refund.status as RefundStatus,
        ) as any,
        providerName: refund.providerName as string,
        providerId: refund.providerId as string,
      },
    })

    return PaymentsMapperRepository.mapToRefundEntity(refundData)
  }

  async findRefundsByPaymentId(paymentId: string): Promise<RefundEntity[]> {
    const refunds = await this.prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    })

    return refunds.map((refund: any) => PaymentsMapperRepository.mapToRefundEntity(refund))
  }
}
