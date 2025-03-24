import { BusinessException } from '../../../src/common/exceptions/business.exception'

describe('BusinessException', () => {
  it('should create an instance with only message', () => {
    const message = 'Business error'
    const error = new BusinessException(message)

    expect(error).toBeInstanceOf(BusinessException)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(422)
    expect(error.name).toBe('BusinessException')
    expect(error.errorCode).toBe('BUSINESS_ERROR')
    expect(error.stack).toBeDefined()
  })

  it('should create an instance with custom error code', () => {
    const message = 'Business error'
    const errorCode = 'CUSTOM_ERROR'
    const error = new BusinessException(message, errorCode)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(422)
    expect(error.errorCode).toBe(errorCode)
  })

  it('should create an instance with metadata', () => {
    const message = 'Business error'
    const errorCode = 'CUSTOM_ERROR'
    const metadata = { key: 'value' }
    const error = new BusinessException(message, errorCode, metadata)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(422)
    expect(error.errorCode).toBe(errorCode)
    expect(error.metadata).toEqual(metadata)
  })
})
