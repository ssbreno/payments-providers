import { Test } from '@nestjs/testing'
import { LoggingModule } from '../../../src/common/logging/logging.module'
import { WinstonLogger } from '../../../src/common/logging/winston.logger'

describe('LoggingModule', () => {
  let module: LoggingModule

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    module = moduleRef.get<LoggingModule>(LoggingModule)
  })

  it('should be defined', () => {
    expect(module).toBeDefined()
  })

  it('should provide WinstonLogger', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule],
    }).compile()

    const logger = moduleRef.get<WinstonLogger>(WinstonLogger)
    expect(logger).toBeDefined()
  })

  it('should export WinstonLogger', () => {
    const exports = Reflect.getMetadata('exports', LoggingModule)
    expect(exports).toContain(WinstonLogger)
  })
})
