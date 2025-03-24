import { Injectable, Inject, Logger } from '@nestjs/common'
import { BaseUseCase } from '../../../../core/domain/base.use-case'
import { CreatePaymentDto } from '../../presentation/dtos/create-payment.dto'
import { KAFKA_TOPICS } from '../../../../config/kafka.config'
import { v4 as uuidv4 } from 'uuid'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { PaymentProviderFactory } from '../../infraestructure/providers/payment-provider.factory'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface'

@Injectable()
export class CreatePaymentUseCase implements BaseUseCase<CreatePaymentDto, PaymentEntity> {
  private readonly logger = new Logger(CreatePaymentUseCase.name)

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly kafkaProducer: KafkaProducerUseCase,
  ) {}

  async execute(input: CreatePaymentDto): Promise<PaymentEntity> {
    const tempPaymentId = uuidv4()
    this.logger.log(
      `Processing payment (ID: ${tempPaymentId}) for amount ${input.amount} ${input.currency}`,
    )

    const healthyProviders = this.providerFactory.getHealthyProviders()
    if (healthyProviders.length === 0) {
      this.logger.error('No healthy payment providers available')
      throw new Error('All payment providers are currently unavailable. Please try again later.')
    }

    try {
      await this.kafkaProducer.send(
        KAFKA_TOPICS.PAYMENT_PROCESSING,
        {
          paymentId: tempPaymentId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          timestamp: new Date().toISOString(),
        },
        tempPaymentId,
      )

      const { result: providerPayment, providerName } =
        await this.providerFactory.executeWithFallback(provider =>
          provider.createPayment({
            amount: input.amount,
            currency: input.currency,
            description: input.description,
            card: input.card,
          }),
        )

      this.logger.log(`Payment processed successfully with provider: ${providerName}`)

      const payment = await this.paymentRepository.create(providerPayment)

      this.logger.log(`Payment saved to database with ID: ${payment.id}`)

      await this.kafkaProducer.send(
        KAFKA_TOPICS.PAYMENT_SUCCESS,
        {
          paymentId: payment.id,
          tempPaymentId,
          providerId: providerName,
          amount: payment.amount,
          currency: payment.currency,
          timestamp: new Date().toISOString(),
        },
        payment.id,
      )

      return payment
    } catch (error) {
      await this.kafkaProducer.send(
        KAFKA_TOPICS.PAYMENT_FAILURE,
        {
          paymentId: tempPaymentId,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        tempPaymentId,
      )

      throw error
    }
  }
}
