import { Test } from '@nestjs/testing'
import { PrismaService } from '../../../src/infraestructure/prisma/prisma.service'

describe('PrismaService', () => {
  let service: PrismaService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile()

    service = module.get<PrismaService>(PrismaService)
    jest.spyOn(service, '$connect').mockImplementation(() => Promise.resolve())
    jest.spyOn(service, '$disconnect').mockImplementation(() => Promise.resolve())
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should connect to database', async () => {
      await service.onModuleInit()
      expect(service.$connect).toHaveBeenCalled()
    })
  })

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      await service.onModuleDestroy()
      expect(service.$disconnect).toHaveBeenCalled()
    })
  })
})
