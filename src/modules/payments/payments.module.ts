import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module'
import { PrismaModule } from '../../infraestructure/prisma/prisma.module'
import { KafkaModule } from '../kafka/kafka.module'
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case'
import { GetPaymentUseCase } from './application/use-cases/get-payment.use-case'
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case'
import { PaymentProviderFactory } from './infraestructure/providers/payment-provider.factory'
import { Provider1Service } from './infraestructure/providers/provider1.use-case'
import { Provider2Service } from './infraestructure/providers/provider2.use-case'
import { PaymentRepository } from './infraestructure/repositories/payment.repository'
import { PaymentsController } from './presentation/controllers/payments.controller'
import { ProviderTestController } from './presentation/controllers/providers.controller'

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    KafkaModule,
    CircuitBreakerModule,
  ],
  controllers: [PaymentsController, ProviderTestController],
  providers: [
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
    Provider1Service,
    Provider2Service,
    PaymentProviderFactory,
    CreatePaymentUseCase,
    GetPaymentUseCase,
    RefundPaymentUseCase,
  ],
  exports: ['IPaymentRepository', CreatePaymentUseCase, GetPaymentUseCase, RefundPaymentUseCase],
})
export class PaymentsModule {}
