import { Test } from '@nestjs/testing'
import { PrismaModule } from '../../../src/infraestructure/prisma/prisma.module'
import { PrismaService } from '../../../src/infraestructure/prisma/prisma.service'

describe('PrismaModule', () => {
  let module: PrismaModule

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile()

    module = moduleRef.get<PrismaModule>(PrismaModule)
  })

  it('should be defined', () => {
    expect(module).toBeDefined()
  })

  it('should provide PrismaService', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile()

    const service = moduleRef.get<PrismaService>(PrismaService)
    expect(service).toBeDefined()
  })

  it('should export PrismaService', () => {
    const exports = Reflect.getMetadata('exports', PrismaModule)
    expect(exports).toContain(PrismaService)
  })
})
