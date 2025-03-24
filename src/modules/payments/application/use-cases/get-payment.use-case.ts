import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common'
import { BaseUseCase } from '../../../../core/domain/base.use-case'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { PaymentProviderFactory } from '../../infraestructure/providers/payment-provider.factory'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface'

@Injectable()
export class GetPaymentUseCase implements BaseUseCase<string, PaymentEntity> {
  private readonly logger = new Logger(GetPaymentUseCase.name)

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly kafkaProducer: KafkaProducerUseCase,
  ) {}

  async execute(paymentId: string): Promise<PaymentEntity> {
    this.logger.log(`Fetching payment with ID: ${paymentId}`)

    const payment = await this.paymentRepository.findById(paymentId)

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }

    try {
      const provider = this.providerFactory.getProvider(payment.providerName)

      if (provider.isHealthy()) {
        const refreshedPayment = await provider.getPayment(payment.providerId)

        const updatedPayment = await this.paymentRepository.update(payment.id, {
          status: refreshedPayment.status,
          currentAmount: refreshedPayment.currentAmount,
        })

        return updatedPayment
      } else {
        this.logger.warn(
          `Provider ${payment.providerName} is unhealthy. Using stored payment data.`,
        )
        return payment
      }
    } catch (error) {
      this.logger.warn(
        `Unable to refresh payment status from provider ${payment.providerName}. Using stored data.`,
        error.stack,
      )

      await this.kafkaProducer.publishProviderStatus(payment.providerName, 'unhealthy')

      return payment
    }
  }
}
