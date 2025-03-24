import { BaseException } from '../../../src/common/exceptions/base.exception'

describe('BaseException', () => {
  it('should create an instance with only message', () => {
    const message = 'Test error'
    const error = new BaseException(message)

    expect(error).toBeInstanceOf(BaseException)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(500)
    expect(error.name).toBe('BaseException')
    expect(error.stack).toBeDefined()
  })

  it('should create an instance with custom status code', () => {
    const message = 'Test error'
    const statusCode = 400
    const error = new BaseException(message, statusCode)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(statusCode)
  })

  it('should create an instance with error code', () => {
    const message = 'Test error'
    const statusCode = 400
    const errorCode = 'TEST_ERROR'
    const error = new BaseException(message, statusCode, errorCode)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(statusCode)
    expect(error.errorCode).toBe(errorCode)
  })

  it('should create an instance with metadata', () => {
    const message = 'Test error'
    const statusCode = 400
    const errorCode = 'TEST_ERROR'
    const metadata = { key: 'value' }
    const error = new BaseException(message, statusCode, errorCode, metadata)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(statusCode)
    expect(error.errorCode).toBe(errorCode)
    expect(error.metadata).toEqual(metadata)
  })
})
