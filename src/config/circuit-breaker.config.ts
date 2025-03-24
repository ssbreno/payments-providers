import { Options } from 'opossum'

export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  rollingCountTimeout: 60000,
  rollingCountBuckets: 10,
  errorFilter: (error: null | undefined) => error === null || error === undefined,
  name: 'default',
}

export const PROVIDER_CIRCUIT_BREAKER_OPTIONS: { [key: string]: Options } = {
  provider1: {
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    name: 'provider1',
  },
  provider2: {
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    name: 'provider2',
  },
}
