import { CustomThrottlerGuard } from '../../../src/common/guards/throttler.guard'
import { FastifyRequest } from 'fastify'
import { ThrottlerModuleOptions } from '@nestjs/throttler'
import { Reflector } from '@nestjs/core'

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard

  beforeEach(() => {
    const options = {
      ttl: 60,
      limit: 10,
    } as any
    const mockStorageService = {
      increment: jest.fn().mockResolvedValue({ totalHits: 1, timeToExpire: 60 }),
    }
    const reflector = new Reflector()

    guard = new CustomThrottlerGuard(options, mockStorageService as any, reflector)
  })

  describe('getTracker', () => {
    it('should return x-forwarded-for header when present', async () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        ip: '127.0.0.1',
        raw: {},
        id: '1',
        params: {},
        query: {},
        body: {},
        url: '',
        method: 'GET',
        routerPath: '',
        routerMethod: '',
        is: () => false,
        server: {} as any,
        connection: {} as any,
      } as any as FastifyRequest

      const result = await guard['getTracker'](mockRequest)
      expect(result).toBe('192.168.1.1')
    })

    it('should return IP when x-forwarded-for header is not present', async () => {
      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
        raw: {},
        id: '1',
        params: {},
        query: {},
        body: {},
        url: '',
        method: 'GET',
        routerPath: '',
        routerMethod: '',
        is: () => false,
        server: {} as any,
        connection: {} as any,
      } as any as FastifyRequest

      const result = await guard['getTracker'](mockRequest)
      expect(result).toBe('127.0.0.1')
    })

    it('should handle multiple IPs in x-forwarded-for header', async () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        ip: '127.0.0.1',
        raw: {},
        id: '1',
        params: {},
        query: {},
        body: {},
        url: '',
        method: 'GET',
        routerPath: '',
        routerMethod: '',
        is: () => false,
        server: {} as any,
        connection: {} as any,
      } as any as FastifyRequest

      const result = await guard['getTracker'](mockRequest)
      expect(result).toBe('192.168.1.1, 10.0.0.1')
    })
  })
})
