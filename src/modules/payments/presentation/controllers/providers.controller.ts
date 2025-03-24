import { Controller, Post, Get, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { CircuitBreakerUseCase } from '@src/modules/circuit-breaker/circuit-breaker.use-case'
import { KafkaProducerUseCase } from '@src/modules/kafka/application/use-cases/kafka-producer.use-case'
import { firstValueFrom } from 'rxjs'
import { PaymentProviderFactory } from '../../infraestructure/providers/payment-provider.factory'

@ApiTags('provider-tests')
@Controller('provider-tests')
export class ProviderTestController {
  constructor(
    private readonly providerFactory: PaymentProviderFactory,
    private readonly circuitBreakerService: CircuitBreakerUseCase,
    private readonly kafkaProducer: KafkaProducerUseCase,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get provider health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns provider health and circuit breaker status',
  })
  getProviderStatus() {
    return {
      providers: this.providerFactory.getProvidersStatus(),
      healthyProviders: this.providerFactory.getHealthyProviders().map(p => p.getName()),
      circuitBreakers: this.circuitBreakerService.getStatus(),
    }
  }

  @Post('fail/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate a provider failure' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provider failure simulation' })
  async simulateProviderFailure(@Param('provider') provider: string) {
    if (provider !== 'provider1' && provider !== 'provider2') {
      return { success: false, message: 'Invalid provider name. Use provider1 or provider2.' }
    }

    const providerUrl = this.configService.get<string>(
      provider === 'provider1' ? 'PROVIDER1_BASE_URL' : 'PROVIDER2_BASE_URL',
    )

    try {
      await firstValueFrom(this.httpService.post(`${providerUrl}/simulate-failure`))

      await this.kafkaProducer.publishProviderStatus(provider, 'unhealthy')

      this.circuitBreakerService.openCircuit(provider)

      return {
        success: true,
        message: `Simulated failure for ${provider}.`,
        note: 'The circuit breaker has been opened and provider marked as unhealthy.',
      }
    } catch (error) {
      return {
        success: true,
        message: `Provider ${provider} is already failing or unreachable.`,
      }
    }
  }

  @Post('recover/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate a provider recovery' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provider recovery simulation' })
  async simulateProviderRecovery(@Param('provider') provider: string) {
    if (provider !== 'provider1' && provider !== 'provider2') {
      return { success: false, message: 'Invalid provider name. Use provider1 or provider2.' }
    }

    try {
      this.providerFactory.resetProvider(provider)

      await this.kafkaProducer.publishCircuitControl(provider, 'close')

      await this.kafkaProducer.publishProviderStatus(provider, 'healthy')

      const providerUrl = this.configService.get<string>(
        provider === 'provider1' ? 'PROVIDER1_BASE_URL' : 'PROVIDER2_BASE_URL',
      )

      try {
        await firstValueFrom(this.httpService.post(`${providerUrl}/simulate-recovery`))
      } catch (error) {}

      return {
        success: true,
        message: `${provider} has been recovered.`,
        note: 'The circuit breaker has been closed and provider marked as healthy.',
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to recover ${provider}: ${error.message}`,
      }
    }
  }

  @Post('reset-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all circuit breakers' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All circuit breakers reset' })
  async resetAllCircuitBreakers() {
    try {
      this.providerFactory.resetAllProviders()

      const providers = this.providerFactory.getAllProviders()
      for (const provider of providers) {
        await this.kafkaProducer.publishCircuitControl(provider.getName(), 'close')
        await this.kafkaProducer.publishProviderStatus(provider.getName(), 'healthy')
      }

      return {
        success: true,
        message: 'All circuit breakers have been reset and providers marked as healthy.',
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset circuit breakers: ${error.message}`,
      }
    }
  }

  @Post('kafka/provider-status/:provider/:status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually publish provider status to Kafka' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Provider status published to Kafka' })
  async publishProviderStatus(
    @Param('provider') provider: string,
    @Param('status') status: 'healthy' | 'unhealthy',
  ) {
    if (provider !== 'provider1' && provider !== 'provider2') {
      return { success: false, message: 'Invalid provider name. Use provider1 or provider2.' }
    }

    if (status !== 'healthy' && status !== 'unhealthy') {
      return { success: false, message: 'Invalid status. Use healthy or unhealthy.' }
    }

    try {
      await this.kafkaProducer.publishProviderStatus(provider, status)

      return {
        success: true,
        message: `Published ${status} status for ${provider} to Kafka.`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to publish provider status: ${error.message}`,
      }
    }
  }

  @Post('kafka/circuit-control/:provider/:command')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually publish circuit control command to Kafka' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Circuit control command published to Kafka' })
  async publishCircuitControl(
    @Param('provider') provider: string,
    @Param('command') command: 'open' | 'close',
  ) {
    if (provider !== 'provider1' && provider !== 'provider2') {
      return { success: false, message: 'Invalid provider name. Use provider1 or provider2.' }
    }

    if (command !== 'open' && command !== 'close') {
      return { success: false, message: 'Invalid command. Use open or close.' }
    }

    try {
      await this.kafkaProducer.publishCircuitControl(provider, command)

      return {
        success: true,
        message: `Published ${command} circuit control command for ${provider} to Kafka.`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to publish circuit control command: ${error.message}`,
      }
    }
  }
}
