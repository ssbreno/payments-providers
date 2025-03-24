import { NotFoundException } from '../../../src/common/exceptions/not-found.exception'

describe('NotFoundException', () => {
  it('should create an instance with resource name', () => {
    const resource = 'User'
    const error = new NotFoundException(resource)

    expect(error).toBeInstanceOf(NotFoundException)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('User not found')
    expect(error.statusCode).toBe(404)
    expect(error.name).toBe('NotFoundException')
    expect(error.errorCode).toBe('RESOURCE_NOT_FOUND')
    expect(error.stack).toBeDefined()
  })

  it('should create an instance with metadata', () => {
    const resource = 'User'
    const metadata = { userId: '123' }
    const error = new NotFoundException(resource, metadata)

    expect(error.message).toBe('User not found')
    expect(error.statusCode).toBe(404)
    expect(error.errorCode).toBe('RESOURCE_NOT_FOUND')
    expect(error.metadata).toEqual(metadata)
  })
})
