import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { kafkaConfig, KAFKA_TOPICS } from '@src/config/kafka.config'

@Injectable()
export class KafkaProducerUseCase implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerUseCase.name)
  private readonly client: ClientKafka

  constructor(private readonly configService: ConfigService) {
    this.client = new ClientKafka(kafkaConfig(configService).options)
  }

  async onModuleInit() {
    const topics = Object.values(KAFKA_TOPICS)
    for (const topic of topics) {
      this.client.subscribeToResponseOf(topic)
    }
    await this.client.connect()
    this.logger.log('Kafka producer connected')
  }

  async send(topic: string, message: any, key?: string): Promise<void> {
    const messageValue = typeof message === 'string' ? message : JSON.stringify(message)

    try {
      this.logger.debug(`Sending message to topic ${topic}: ${messageValue}`)
      await this.client.emit(topic, {
        key,
        value: messageValue,
      })
    } catch (error) {
      this.logger.error(`Error sending message to topic ${topic}: ${error.message}`, error.stack)
      throw error
    }
  }

  async publishPaymentProcessing(payment: any, providerId: string): Promise<void> {
    await this.send(
      KAFKA_TOPICS.PAYMENT_PROCESSING,
      {
        paymentId: payment.id || 'unknown',
        amount: payment.amount,
        currency: payment.currency,
        providerId,
        timestamp: new Date().toISOString(),
      },
      payment.id,
    )
  }

  /**
   * Publish a payment success event
   * @param payment The successful payment
   * @param providerId The ID of the provider that processed the payment
   */
  async publishPaymentSuccess(payment: any, providerId: string): Promise<void> {
    await this.send(
      KAFKA_TOPICS.PAYMENT_SUCCESS,
      {
        paymentId: payment.id,
        providerId,
        amount: payment.amount,
        timestamp: new Date().toISOString(),
      },
      payment.id,
    )
  }

  /**
   * Publish a payment failure event
   * @param payment The failed payment
   * @param providerId The ID of the provider that failed
   * @param errorMessage The error message
   */
  async publishPaymentFailure(
    payment: any,
    providerId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.send(
      KAFKA_TOPICS.PAYMENT_FAILURE,
      {
        paymentId: payment.id || 'unknown',
        providerId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      payment.id,
    )
  }

  /**
   * Publish a provider status event
   * @param providerId The ID of the provider
   * @param status The status of the provider (e.g., 'healthy', 'unhealthy')
   */
  async publishProviderStatus(providerId: string, status: 'healthy' | 'unhealthy'): Promise<void> {
    await this.send(
      KAFKA_TOPICS.PROVIDER_STATUS,
      {
        providerId,
        status,
        timestamp: new Date().toISOString(),
      },
      providerId,
    )
  }

  /**
   * Publish a circuit control command
   * @param providerId The ID of the provider
   * @param command The command to send (e.g., 'open', 'close')
   */
  async publishCircuitControl(providerId: string, command: 'open' | 'close'): Promise<void> {
    await this.send(
      KAFKA_TOPICS.CIRCUIT_CONTROL,
      {
        providerId,
        command,
        timestamp: new Date().toISOString(),
      },
      providerId,
    )
  }
}
