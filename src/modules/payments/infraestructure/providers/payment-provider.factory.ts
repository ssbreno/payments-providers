import { Injectable, Logger } from '@nestjs/common'
import { IPaymentProviderRepository } from '../../domain/repositories/payment-provider.repository.interface'
import { BusinessException } from '../../../../common/exceptions/business.exception'
import { KAFKA_TOPICS } from '../../../../config/kafka.config'
import { Provider1Service } from './provider1.use-case'
import { Provider2Service } from './provider2.use-case'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { CircuitBreakerUseCase } from '@src/modules/circuit-breaker/circuit-breaker.use-case'

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name)
  private readonly providers: IPaymentProviderRepository[]
  private readonly providerMap: Map<string, IPaymentProviderRepository>

  constructor(
    private readonly provider1Service: Provider1Service,
    private readonly provider2Service: Provider2Service,
    private readonly circuitBreakerService: CircuitBreakerUseCase,
    private readonly kafkaProducer: KafkaProducerUseCase,
  ) {
    this.providers = [provider1Service, provider2Service]

    this.providerMap = new Map()
    this.providers.forEach(provider => {
      this.providerMap.set(provider.getName(), provider)
    })
  }

  async executeWithFallback<T>(
    operation: (provider: IPaymentProviderRepository) => Promise<T>,
  ): Promise<{ result: T; providerName: string }> {
    const healthyProviders = this.getHealthyProviders()

    if (healthyProviders.length === 0) {
      this.logger.error('All payment providers are unhealthy')

      await this.kafkaProducer.send(KAFKA_TOPICS.PROVIDER_STATUS, {
        status: 'all_providers_down',
        timestamp: new Date().toISOString(),
      })

      throw new BusinessException(
        'Payment processing failed. All payment providers are currently unavailable.',
        'PAYMENT_PROVIDERS_UNAVAILABLE',
      )
    }

    const allProviders = [...healthyProviders, ...this.getUnhealthyProviders()]

    let lastError: Error | null = null

    for (const provider of allProviders) {
      try {
        this.logger.log(`Attempting operation with provider: ${provider.getName()}`)
        const result = await operation(provider)
        this.logger.log(`Operation successful with provider: ${provider.getName()}`)

        await this.kafkaProducer.publishProviderStatus(provider.getName(), 'healthy')

        return { result, providerName: provider.getName() }
      } catch (error) {
        this.logger.error(`Provider ${provider.getName()} failed: ${error.message}`, error.stack)
        lastError = error

        await this.kafkaProducer.publishProviderStatus(provider.getName(), 'unhealthy')
      }
    }

    this.logger.error('All payment providers failed')
    throw (
      lastError ||
      new BusinessException(
        'Payment processing failed. All payment providers are currently unavailable.',
        'PAYMENT_PROVIDERS_UNAVAILABLE',
      )
    )
  }

  getProvider(preferredProvider?: string): IPaymentProviderRepository {
    if (preferredProvider) {
      const provider = this.providerMap.get(preferredProvider)
      if (provider && provider.isHealthy()) {
        return provider
      }
    }

    const healthyProviders = this.getHealthyProviders()
    if (healthyProviders.length > 0) {
      return healthyProviders[0]
    }

    this.logger.warn('No healthy providers available, returning first provider')
    return this.providers[0]
  }

  getAllProviders(): IPaymentProviderRepository[] {
    return [...this.providers]
  }

  getHealthyProviders(): IPaymentProviderRepository[] {
    return this.providers.filter(provider => provider.isHealthy())
  }

  private getUnhealthyProviders(): IPaymentProviderRepository[] {
    return this.providers.filter(provider => !provider.isHealthy())
  }

  getProvidersStatus(): Record<string, { healthy: boolean }> {
    const status: Record<string, { healthy: boolean }> = {}

    this.providers.forEach(provider => {
      status[provider.getName()] = {
        healthy: provider.isHealthy(),
      }
    })

    return status
  }

  resetAllProviders(): void {
    this.providers.forEach(provider => {
      this.circuitBreakerService.reset(provider.getName())
      this.kafkaProducer.publishProviderStatus(provider.getName(), 'healthy')
    })
    this.logger.log('All provider circuit breakers have been reset')
  }

  resetProvider(providerName: string): void {
    this.circuitBreakerService.reset(providerName)
    this.kafkaProducer.publishProviderStatus(providerName, 'healthy')
    this.logger.log(`Provider ${providerName} circuit breaker has been reset`)
  }
}
