import { UnauthorizedException } from '../../../src/common/exceptions/unauthorized.exception'

describe('UnauthorizedException', () => {
  it('should create an instance with default message', () => {
    const error = new UnauthorizedException()

    expect(error).toBeInstanceOf(UnauthorizedException)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Unauthorized access')
    expect(error.statusCode).toBe(401)
    expect(error.name).toBe('UnauthorizedException')
    expect(error.errorCode).toBe('UNAUTHORIZED')
    expect(error.stack).toBeDefined()
  })

  it('should create an instance with custom message', () => {
    const message = 'Custom unauthorized message'
    const error = new UnauthorizedException(message)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(401)
    expect(error.errorCode).toBe('UNAUTHORIZED')
  })

  it('should create an instance with metadata', () => {
    const message = 'Custom unauthorized message'
    const metadata = { userId: '123' }
    const error = new UnauthorizedException(message, metadata)

    expect(error.message).toBe(message)
    expect(error.statusCode).toBe(401)
    expect(error.errorCode).toBe('UNAUTHORIZED')
    expect(error.metadata).toEqual(metadata)
  })
})
