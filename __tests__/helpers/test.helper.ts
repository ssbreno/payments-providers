import { Type } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

export type MockType<T> = {
  [P in keyof T]: jest.Mock
}

export const createMock = <T>(): MockType<T> => ({}) as MockType<T>

export const createTestingModule = async <T>(
  controller: Type<T>,
  providers: any[],
): Promise<{
  module: TestingModule
  instance: T
  providers: { [key: string]: any }
}> => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [controller],
    providers,
  }).compile()

  const instance = module.get<T>(controller)
  const providersMap = providers.reduce((acc, provider) => {
    const token = typeof provider === 'function' ? provider : provider.provide
    acc[token] = module.get(token)
    return acc
  }, {})

  return {
    module,
    instance,
    providers: providersMap,
  }
}

export const createMockDate = (): Date => new Date('2025-03-12T00:00:00.000Z')
