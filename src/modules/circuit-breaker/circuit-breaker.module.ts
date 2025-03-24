import { Module, Global } from '@nestjs/common'
import { CircuitBreakerUseCase } from './circuit-breaker.use-case'

@Global()
@Module({
  providers: [CircuitBreakerUseCase],
  exports: [CircuitBreakerUseCase],
})
export class CircuitBreakerModule {}
