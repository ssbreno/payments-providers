import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module'
import { KafkaProducerUseCase } from './application/use-cases/kafka-producer.use-case'
import { KafkaConsumerUseCase } from './application/use-cases/kafka-consumer.use-case'
import { CircuitControlUseCase } from './application/use-cases/circuit-control.use-case'
import { PaymentEventsUseCase } from './application/use-cases/payment-events.use-case'

@Global()
@Module({
  imports: [ConfigModule, CircuitBreakerModule],
  providers: [
    KafkaProducerUseCase,
    KafkaConsumerUseCase,
    PaymentEventsUseCase,
    CircuitControlUseCase,
  ],
  exports: [
    KafkaProducerUseCase,
    KafkaConsumerUseCase,
    PaymentEventsUseCase,
    CircuitControlUseCase,
  ],
})
export class KafkaModule {}
