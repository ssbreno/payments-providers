import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { CircuitBreakerUseCase } from '@src/modules/circuit-breaker/circuit-breaker.use-case'
import { KafkaConsumerUseCase } from './kafka-consumer.use-case'
import { KAFKA_TOPICS } from '@src/config/kafka.config'

@Injectable()
export class CircuitControlUseCase implements OnModuleInit {
  private readonly logger = new Logger(CircuitControlUseCase.name)
  private readonly providerFailureCounter: Map<string, { count: number; lastFailure: Date }> =
    new Map()

  private readonly FAILURE_THRESHOLD = 3
  private readonly FAILURE_WINDOW_MS = 60000

  constructor(
    private readonly kafkaConsumerUseCase: KafkaConsumerUseCase,
    private readonly circuitBreakerUseCase: CircuitBreakerUseCase,
  ) {}

  async onModuleInit() {
    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.PAYMENT_FAILURE,
      this.handlePaymentFailure.bind(this),
      'circuit-control-failure-group',
    )

    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.CIRCUIT_CONTROL,
      this.handleCircuitControl.bind(this),
      'circuit-control-command-group',
    )

    await this.kafkaConsumerUseCase.consume(
      KAFKA_TOPICS.PROVIDER_STATUS,
      this.handleProviderStatus.bind(this),
      'circuit-control-status-group',
    )

    this.logger.log('Circuit control service initialized')
  }

  private async handlePaymentFailure(message: any): Promise<void> {
    try {
      const { providerId, error } = message

      if (!providerId) {
        this.logger.warn('Received payment failure event without provider ID')
        return
      }

      this.logger.warn(`Payment failed with provider ${providerId}: ${error}`)

      const counterData = this.providerFailureCounter.get(providerId) || {
        count: 0,
        lastFailure: new Date(0),
      }
      const now = new Date()

      if (now.getTime() - counterData.lastFailure.getTime() < this.FAILURE_WINDOW_MS) {
        counterData.count += 1
      } else {
        counterData.count = 1
      }

      counterData.lastFailure = now
      this.providerFailureCounter.set(providerId, counterData)

      if (counterData.count >= this.FAILURE_THRESHOLD) {
        this.logger.warn(
          `Provider ${providerId} reached failure threshold, opening circuit breaker`,
        )
        this.circuitBreakerUseCase.openCircuit(providerId)
      }
    } catch (error) {
      this.logger.error(`Error handling payment failure: ${error.message}`, error.stack)
    }
  }

  private async handleCircuitControl(message: any): Promise<void> {
    try {
      const { providerId, command } = message

      if (!providerId || !command) {
        this.logger.warn('Received invalid circuit control command')
        return
      }

      this.logger.log(`Received circuit control command for ${providerId}: ${command}`)

      switch (command) {
        case 'open':
          this.circuitBreakerUseCase.openCircuit(providerId)
          break
        case 'close':
          this.circuitBreakerUseCase.closeCircuit(providerId)
          this.providerFailureCounter.set(providerId, { count: 0, lastFailure: new Date(0) })
          break
        default:
          this.logger.warn(`Unknown circuit control command: ${command}`)
      }
    } catch (error) {
      this.logger.error(`Error handling circuit control command: ${error.message}`, error.stack)
    }
  }

  private async handleProviderStatus(message: any): Promise<void> {
    try {
      const { providerId, status } = message

      if (!providerId || !status) {
        this.logger.warn('Received invalid provider status update')
        return
      }

      this.logger.log(`Received provider status update for ${providerId}: ${status}`)

      if (status === 'healthy') {
        this.circuitBreakerUseCase.closeCircuit(providerId)
        this.providerFailureCounter.set(providerId, { count: 0, lastFailure: new Date(0) })
      } else if (status === 'unhealthy') {
        this.circuitBreakerUseCase.openCircuit(providerId)
      }
    } catch (error) {
      this.logger.error(`Error handling provider status update: ${error.message}`, error.stack)
    }
  }
}
