import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { PROVIDER_CIRCUIT_BREAKER_OPTIONS } from '@src/config/circuit-breaker.config'
import { CircuitBreakerUseCase } from '@src/modules/circuit-breaker/circuit-breaker.use-case'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { PaymentMethod } from '../../domain/enums/payment-method.enum'
import { PaymentStatus } from '../../domain/enums/payment-status.enum'
import {
  IPaymentProviderRepository,
  CreatePaymentRequest,
  RefundRequest,
} from '../../domain/repositories/payment-provider.repository.interface'

@Injectable()
export class Provider1Service implements IPaymentProviderRepository {
  private readonly logger = new Logger(Provider1Service.name)
  private readonly baseUrl: string
  private readonly providerName: string = 'provider1'

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerUseCase,
    private readonly kafkaProducer: KafkaProducerUseCase,
  ) {
    this.baseUrl = this.configService.get<string>('PROVIDER1_BASE_URL', 'http://localhost:3001')
  }

  getName(): string {
    return this.providerName
  }

  isHealthy(): boolean {
    return this.circuitBreakerService.isCircuitClosed(this.providerName)
  }

  async createPayment(payment: CreatePaymentRequest): Promise<PaymentEntity> {
    return this.circuitBreakerService.fire(
      this.providerName,
      async () => {
        try {
          await this.kafkaProducer.publishPaymentProcessing(payment, this.providerName)

          const response = await firstValueFrom(
            this.httpService.post(`${this.baseUrl}/charges`, {
              amount: payment.amount,
              currency: payment.currency,
              description: payment.description,
              paymentMethod: {
                type: 'card',
                card: {
                  number: payment.card.number,
                  holderName: payment.card.holder,
                  cvv: payment.card.cvv,
                  expirationDate: payment.card.expiration,
                  installments: payment.card.installments,
                },
              },
            }),
          )

          const paymentEntity = this.mapToPaymentEntity(response.data)

          await this.kafkaProducer.publishPaymentSuccess(paymentEntity, this.providerName)

          return paymentEntity
        } catch (error) {
          this.logger.error(
            `Error creating payment with ${this.providerName}: ${error.message}`,
            error.stack,
          )

          await this.kafkaProducer.publishPaymentFailure(
            payment,
            this.providerName,
            error.message || 'Unknown error',
          )

          await this.kafkaProducer.publishProviderStatus(this.providerName, 'unhealthy')

          throw new HttpException(
            `Payment processing failed with provider ${this.getName()}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          )
        }
      },
      PROVIDER_CIRCUIT_BREAKER_OPTIONS[this.providerName],
    )
  }

  async getPayment(paymentId: string): Promise<PaymentEntity> {
    return this.circuitBreakerService.fire(
      this.providerName,
      async () => {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/charges/${paymentId}`),
          )

          return this.mapToPaymentEntity(response.data)
        } catch (error) {
          this.logger.error(
            `Error fetching payment from ${this.providerName}: ${error.message}`,
            error.stack,
          )

          await this.kafkaProducer.publishProviderStatus(this.providerName, 'unhealthy')

          throw new HttpException(
            `Failed to fetch payment details from provider ${this.getName()}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          )
        }
      },
      PROVIDER_CIRCUIT_BREAKER_OPTIONS[this.providerName],
    )
  }

  async refundPayment(paymentId: string, refund: RefundRequest): Promise<PaymentEntity> {
    return this.circuitBreakerService.fire(
      this.providerName,
      async () => {
        try {
          const response = await firstValueFrom(
            this.httpService.post(`${this.baseUrl}/refund/${paymentId}`, {
              amount: refund.amount,
            }),
          )

          return this.mapToPaymentEntity(response.data)
        } catch (error) {
          this.logger.error(
            `Error refunding payment with ${this.providerName}: ${error.message}`,
            error.stack,
          )

          await this.kafkaProducer.publishProviderStatus(this.providerName, 'unhealthy')

          throw new HttpException(
            `Refund processing failed with provider ${this.getName()}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          )
        }
      },
      PROVIDER_CIRCUIT_BREAKER_OPTIONS[this.providerName],
    )
  }

  private mapToPaymentEntity(data: any): PaymentEntity {
    return PaymentEntity.create({
      providerId: data.id,
      providerName: this.getName(),
      amount: data.originalAmount,
      currency: data.currency,
      description: data.description,
      status: this.mapStatus(data.status),
      paymentMethod: PaymentMethod.CARD,
      cardId: data.cardId,
      originalAmount: data.originalAmount,
      currentAmount: data.currentAmount,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(),
    })
  }

  private mapStatus(providerStatus: string): PaymentStatus {
    switch (providerStatus) {
      case 'authorized':
        return PaymentStatus.AUTHORIZED
      case 'failed':
        return PaymentStatus.FAILED
      case 'refunded':
        return PaymentStatus.REFUNDED
      default:
        return PaymentStatus.PENDING
    }
  }
}
