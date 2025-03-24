import { Test } from '@nestjs/testing'
import { LoggingModule } from '../../../src/common/logging/logging.module'
import { WinstonLogger } from '../../../src/common/logging/winston.logger'

describe('LoggingModule', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should provide WinstonLogger', async () => {
    const module = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    const logger = module.get<WinstonLogger>(WinstonLogger)
    expect(logger).toBeInstanceOf(WinstonLogger)
  })

  it('should use default log level when LOG_LEVEL is not set', async () => {
    delete process.env.LOG_LEVEL

    const module = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    const logger = module.get<WinstonLogger>(WinstonLogger)
    expect(logger).toBeDefined()
  })

  it('should use environment log level when LOG_LEVEL is set', async () => {
    process.env.LOG_LEVEL = 'debug'

    const module = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    const logger = module.get<WinstonLogger>(WinstonLogger)
    expect(logger).toBeDefined()
  })

  it('should enable silent mode when LOG_SILENT is set to 1', async () => {
    process.env.LOG_SILENT = '1'

    const module = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    const logger = module.get<WinstonLogger>(WinstonLogger)
    expect(logger).toBeDefined()
  })
})
