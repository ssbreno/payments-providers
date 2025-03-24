import { WinstonLogger } from '../../../src/common/logging/winston.logger'
import * as winston from 'winston'

// Mock para winston
jest.mock('winston', () => {
  const originalModule = jest.requireActual('winston')

  // Mock para o logger
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }

  // Mock para format function que imita o comportamento do winston.format
  const formatFn = function (formatFunction: any): any {
    return formatFunction
  }

  // Adiciona as propriedades necessárias ao formatFn
  const mockFormat = Object.assign(formatFn, {
    combine: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    ms: jest.fn().mockReturnValue({}),
    printf: jest.fn().mockReturnValue({}),
  })

  // Mock para createLogger
  return {
    ...originalModule,
    createLogger: jest.fn(options => {
      // Garante que o formato seja definido para os testes
      if (options && !options.format) {
        options.format = mockFormat.combine()
      }
      return mockLogger
    }),
    format: mockFormat,
    transports: {
      Console: jest.fn(),
    },
  }
})

describe('WinstonLogger', () => {
  let logger: WinstonLogger
  let winstonLogger: any

  beforeEach(() => {
    jest.clearAllMocks()
    logger = new WinstonLogger('TestContext')
    winstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value
  })

  describe('constructor', () => {
    it('should create a logger with default options', () => {
      expect(winston.createLogger).toHaveBeenCalled()
      const options = (winston.createLogger as jest.Mock).mock.calls[0][0]
      expect(options.level).toBe('info')
      expect(options.silent).toBe(false)
      expect(options.format).toBeDefined()
      expect(options.transports).toHaveLength(1)
    })

    it('should create a logger with custom options', () => {
      const customTransport = new winston.transports.Console()
      const customFormat = winston.format.combine()

      new WinstonLogger('CustomContext', {
        level: 'debug',
        silent: true,
        format: customFormat,
        transports: [customTransport],
      })

      const options = (winston.createLogger as jest.Mock).mock.calls[1][0]
      expect(options.level).toBe('debug')
      expect(options.silent).toBe(true)
      expect(options.format).toBe(customFormat)
      expect(options.transports).toEqual([customTransport])
    })
  })

  describe('setContext', () => {
    it('should update the context', () => {
      logger.setContext('NewContext')

      // Verificar se o contexto foi atualizado chamando um método de log
      logger.log('test message')
      expect(winstonLogger.info).toHaveBeenCalledWith('test message', {
        context: 'NewContext',
      })
    })
  })

  describe('log methods', () => {
    it('should call info for log method', () => {
      logger.log('info message')
      expect(winstonLogger.info).toHaveBeenCalledWith('info message', {
        context: 'TestContext',
      })
    })

    it('should call warn for warn method', () => {
      logger.warn('warning message')
      expect(winstonLogger.warn).toHaveBeenCalledWith('warning message', {
        context: 'TestContext',
      })
    })

    it('should call debug for debug method', () => {
      logger.debug('debug message')
      expect(winstonLogger.debug).toHaveBeenCalledWith('debug message', {
        context: 'TestContext',
      })
    })

    it('should call verbose for verbose method', () => {
      logger.verbose('verbose message')
      expect(winstonLogger.verbose).toHaveBeenCalledWith('verbose message', {
        context: 'TestContext',
      })
    })

    it('should handle object messages with message property', () => {
      const objMessage = { message: 'object message', data: { key: 'value' } }
      logger.log(objMessage)
      expect(winstonLogger.info).toHaveBeenCalledWith('object message', {
        context: 'TestContext',
        data: { key: 'value' },
      })
    })

    it('should handle object messages without message property', () => {
      const objMessage = { data: { key: 'value' } }
      logger.log(objMessage)
      expect(winstonLogger.info).toHaveBeenCalledWith(objMessage, {
        context: 'TestContext',
      })
    })

    it('should use provided context instead of default', () => {
      logger.log('message with context', 'OverrideContext')
      expect(winstonLogger.info).toHaveBeenCalledWith('message with context', {
        context: 'OverrideContext',
      })
    })
  })

  describe('error method', () => {
    it('should handle string error messages', () => {
      logger.error('error message')
      expect(winstonLogger.error).toHaveBeenCalledWith('error message', {
        context: 'TestContext',
      })
    })

    it('should handle Error objects', () => {
      const error = new Error('error object')
      error.stack = 'stack trace'

      logger.error(error)

      expect(winstonLogger.error).toHaveBeenCalledWith('error object', {
        context: 'TestContext',
        stack: 'stack trace',
      })
    })

    it('should handle Error objects with custom trace', () => {
      const error = new Error('error object')
      const customTrace = 'custom stack trace'

      logger.error(error, customTrace)

      expect(winstonLogger.error).toHaveBeenCalledWith('error object', {
        context: 'TestContext',
        stack: customTrace,
      })
    })

    it('should handle object error messages with message property', () => {
      const objError = { message: 'object error', code: 500 }

      logger.error(objError)

      expect(winstonLogger.error).toHaveBeenCalledWith('object error', {
        context: 'TestContext',
        code: 500,
      })
    })

    it('should handle object error messages with message property and trace', () => {
      const objError = { message: 'object error', code: 500 }
      const trace = 'error trace'

      logger.error(objError, trace)

      expect(winstonLogger.error).toHaveBeenCalledWith('object error', {
        context: 'TestContext',
        code: 500,
        stack: trace,
      })
    })

    it('should handle object error messages without message property', () => {
      const objError = { code: 500 }

      logger.error(objError)

      expect(winstonLogger.error).toHaveBeenCalledWith('Error', {
        context: 'TestContext',
        code: 500,
      })
    })

    it('should use provided context instead of default', () => {
      logger.error('error with context', undefined, 'ErrorContext')

      expect(winstonLogger.error).toHaveBeenCalledWith('error with context', {
        context: 'ErrorContext',
      })
    })

    it('should handle string error with trace', () => {
      logger.error('error message', 'trace info')

      expect(winstonLogger.error).toHaveBeenCalledWith('error message', {
        context: 'TestContext',
        stack: 'trace info',
      })
    })
  })
})
