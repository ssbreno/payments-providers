import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { KAFKA_TOPICS } from '@src/config/kafka.config'
import { KafkaConsumerUseCase } from './kafka-consumer.use-case'
import { KafkaProducerUseCase } from './kafka-producer.use-case'

@Injectable()
export class PaymentEventsUseCase implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventsUseCase.name)

  private readonly failedPayments = new Map<
    string,
    {
      retryCount: number
      lastRetry: Date
      originalProvider: string
    }
  >()

  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_MS = 30000

  constructor(
    private readonly kafkaConsumerUseCase: KafkaConsumerUseCase,
    private readonly kafkaProducerUseCase: KafkaProducerUseCase,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.PAYMENT_FAILURE,
      this.handlePaymentFailure.bind(this),
      'payment-events-failure-group',
    )

    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.PAYMENT_RETRY,
      this.handlePaymentRetry.bind(this),
      'payment-events-retry-group',
    )

    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.PAYMENT_RECOVERY,
      this.handlePaymentRecovery.bind(this),
      'payment-events-recovery-group',
    )

    this.logger.log('Payment events service initialized')
  }

  private async handlePaymentFailure(message: any): Promise<void> {
    try {
      const { paymentId, providerId } = message

      if (!paymentId) {
        this.logger.warn('Received payment failure event without payment ID')
        return
      }

      const failureInfo = this.failedPayments.get(paymentId) || {
        retryCount: 0,
        lastRetry: new Date(0),
        originalProvider: providerId,
      }

      failureInfo.retryCount = failureInfo.retryCount + 1
      failureInfo.lastRetry = new Date()
      this.failedPayments.set(paymentId, failureInfo)

      if (failureInfo.retryCount <= this.MAX_RETRIES) {
        setTimeout(async () => {
          await this.kafkaProducerUseCase.send(
            KAFKA_TOPICS.PAYMENT_RETRY,
            {
              paymentId,
              originalProvider: providerId,
              retryCount: failureInfo.retryCount,
              timestamp: new Date().toISOString(),
            },
            paymentId,
          )
        }, this.RETRY_DELAY_MS)

        this.logger.log(
          `Scheduled retry ${failureInfo.retryCount} for payment ${paymentId} in ${this.RETRY_DELAY_MS}ms`,
        )
      } else {
        this.logger.error(`Payment ${paymentId} has exceeded maximum retry attempts`)
      }
    } catch (error) {
      this.logger.error(`Error handling payment failure: ${error.message}`, error.stack)
    }
  }

  private async handlePaymentRetry(message: any): Promise<void> {
    try {
      const { paymentId, originalProvider } = message

      if (!paymentId) {
        this.logger.warn('Received payment retry event without payment ID')
        return
      }

      this.logger.log(`Processing retry for payment ${paymentId}`)

      await this.kafkaProducerUseCase.send(
        KAFKA_TOPICS.PAYMENT_RECOVERY,
        {
          paymentId,
          originalProvider,
          timestamp: new Date().toISOString(),
        },
        paymentId,
      )
    } catch (error) {
      this.logger.error(`Error handling payment retry: ${error.message}`, error.stack)
    }
  }

  private async handlePaymentRecovery(message: any): Promise<void> {
    this.logger.log(`Received payment recovery event: ${JSON.stringify(message)}`)
  }
}
