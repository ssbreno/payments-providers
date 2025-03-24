import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { BaseUseCase } from '../../../../core/domain/base.use-case'
import { RefundPaymentDto } from '../../presentation/dtos/refund-payment.dto'
import { KAFKA_TOPICS } from '../../../../config/kafka.config'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { PaymentStatus } from '../../domain/enums/payment-status.enum'
import { RefundStatus } from '../../domain/enums/refund-status.enum'
import { PaymentProviderFactory } from '../../infraestructure/providers/payment-provider.factory'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface'

interface RefundPaymentInput {
  paymentId: string
  data: RefundPaymentDto
}

@Injectable()
export class RefundPaymentUseCase implements BaseUseCase<RefundPaymentInput, PaymentEntity> {
  private readonly logger = new Logger(RefundPaymentUseCase.name)

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly kafkaProducer: KafkaProducerUseCase,
  ) {}

  async execute({ paymentId, data }: RefundPaymentInput): Promise<PaymentEntity> {
    this.logger.log(`Processing refund for payment ID: ${paymentId}, amount: ${data.amount}`)

    const payment = await this.paymentRepository.findById(paymentId)

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }

    if (!payment.isRefundable()) {
      throw new BadRequestException(
        `Payment with ID ${paymentId} cannot be refunded due to its status: ${payment.status}`,
      )
    }

    if (!payment.canBeRefunded(data.amount)) {
      throw new BadRequestException(
        `Refund amount ${data.amount} exceeds the available amount ${payment.currentAmount}`,
      )
    }

    await this.kafkaProducer.send(
      KAFKA_TOPICS.PAYMENT_PROCESSING,
      {
        paymentId: payment.id,
        refundAmount: data.amount,
        operation: 'refund',
        timestamp: new Date().toISOString(),
      },
      `refund-${payment.id}`,
    )

    try {
      const provider = this.providerFactory.getProvider(payment.providerName)

      const updatedPayment = await provider.refundPayment(payment.providerId, {
        amount: data.amount,
      })

      const savedPayment = await this.paymentRepository.update(payment.id, {
        status: this.determineStatus(payment, data.amount),
        currentAmount: (payment.currentAmount ?? 0) - data.amount,
      })

      const refund = await this.paymentRepository.createRefund({
        paymentId: payment.id,
        amount: data.amount,
        status: RefundStatus.PROCESSED,
        providerName: payment.providerName,
        providerId: updatedPayment.providerId || `refund-${payment.providerId}`,
      })

      await this.kafkaProducer.send(
        KAFKA_TOPICS.PAYMENT_SUCCESS,
        {
          paymentId: payment.id,
          refundId: refund.id,
          refundAmount: data.amount,
          operation: 'refund',
          timestamp: new Date().toISOString(),
        },
        `refund-${payment.id}`,
      )

      this.logger.log(`Refund processed successfully for payment ID: ${paymentId}`)

      return savedPayment
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack)

      await this.paymentRepository.createRefund({
        paymentId: payment.id,
        amount: data.amount,
        status: RefundStatus.FAILED,
        providerName: payment.providerName,
        providerId: `failed-refund-${payment.providerId}`,
      })

      await this.kafkaProducer.send(
        KAFKA_TOPICS.PAYMENT_FAILURE,
        {
          paymentId: payment.id,
          refundAmount: data.amount,
          operation: 'refund',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        `refund-${payment.id}`,
      )

      throw error
    }
  }

  private determineStatus(payment: PaymentEntity, refundAmount: number): PaymentStatus {
    if (payment.currentAmount && payment.currentAmount - refundAmount <= 0) {
      return PaymentStatus.REFUNDED
    }

    return PaymentStatus.PARTIALLY_REFUNDED
  }
}
