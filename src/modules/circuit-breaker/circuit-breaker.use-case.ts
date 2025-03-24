import { Injectable, Logger } from '@nestjs/common'
import * as CircuitBreaker from 'opossum'
import { Options } from 'opossum'
import { DEFAULT_CIRCUIT_BREAKER_OPTIONS } from '../../config/circuit-breaker.config'

@Injectable()
export class CircuitBreakerUseCase {
  private readonly logger = new Logger(CircuitBreakerUseCase.name)
  private readonly breakers: Map<string, CircuitBreaker> = new Map()

  getBreaker(name: string, options: Partial<Options> = {}): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!
    }

    const dummyFunction = async () => null

    const circuitOptions: Options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options,
      name,
    }

    const breaker = new CircuitBreaker(dummyFunction, circuitOptions)

    this.addBreakerListeners(breaker)

    this.breakers.set(name, breaker)

    return breaker
  }

  async fire<T>(name: string, fn: () => Promise<T>, options: Partial<Options> = {}): Promise<T> {
    const circuitOptions: Options = {
      ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
      ...options,
      name,
    }

    const breaker = new CircuitBreaker(fn, circuitOptions)
    this.addBreakerListeners(breaker)

    this.breakers.set(name, breaker)

    try {
      const result = await breaker.fire()
      return result
    } catch (error) {
      this.logger.error(`Circuit breaker ${name} error: ${error.message}`, error.stack)
      throw error
    }
  }

  isCircuitClosed(name: string): boolean {
    const breaker = this.breakers.get(name)
    if (!breaker) {
      return true
    }
    return breaker.closed
  }

  getStatus(): Record<string, { state: string; metrics: any }> {
    const status: Record<string, { state: string; metrics: any }> = {}

    this.breakers.forEach((breaker, name) => {
      let state = 'unknown'
      if (breaker.closed) {
        state = 'closed'
      } else if (breaker.opened) {
        state = 'open'
      } else if (breaker.halfOpen) {
        state = 'half-open'
      }

      status[name] = {
        state,
        metrics: {
          failures: breaker.status.stats.failures,
          fallbacks: breaker.status.stats.fallbacks,
          successes: breaker.status.stats.successes,
          rejects: breaker.status.stats.rejects,
          fires: breaker.status.stats.fires,
        },
      }
    })

    return status
  }

  openCircuit(name: string): void {
    const breaker = this.breakers.get(name)
    if (breaker) {
      breaker.open()
      this.logger.warn(`Circuit ${name} manually opened`)
    }
  }

  closeCircuit(name: string): void {
    const breaker = this.breakers.get(name)
    if (breaker) {
      breaker.close()
      this.logger.log(`Circuit ${name} manually closed`)
    }
  }

  resetAll(): void {
    this.breakers.forEach(breaker => {
      breaker.close()
    })
    this.logger.log('All circuit breakers have been reset')
  }

  reset(name: string): void {
    const breaker = this.breakers.get(name)
    if (breaker) {
      breaker.close()
      this.logger.log(`Circuit breaker ${name} has been reset`)
    }
  }

  private addBreakerListeners(breaker: CircuitBreaker): void {
    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker ${breaker.name} is open`)
    })

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker ${breaker.name} is closed`)
    })

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker ${breaker.name} is half-open`)
    })

    breaker.on('failure', error => {
      this.logger.error(
        `Circuit breaker ${breaker.name} failure: ${error?.message || 'Unknown error'}`,
        error?.stack,
      )
    })

    breaker.on('fallback', result => {
      this.logger.warn(`Circuit breaker ${breaker.name} executed fallback`)
    })

    breaker.on('reject', () => {
      this.logger.warn(`Circuit breaker ${breaker.name} rejected execution`)
    })
  }
}
