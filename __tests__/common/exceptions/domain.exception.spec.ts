import { DomainException } from '../../../src/common/exceptions/domain.exception'

describe('DomainException', () => {
  it('should create an instance with only message', () => {
    const message = 'Domain error'
    const error = new DomainException(message)

    expect(error).toBeInstanceOf(DomainException)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('DomainException')
    expect(error.errorCode).toBe('DOMAIN_ERROR')
    expect(error.stack).toBeDefined()
  })

  it('should create an instance with metadata', () => {
    const message = 'Domain error'
    const metadata = { key: 'value' }
    const error = new DomainException(message, metadata)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(400)
    expect(error.errorCode).toBe('DOMAIN_ERROR')
    expect(error.metadata).toEqual(metadata)
  })
})
