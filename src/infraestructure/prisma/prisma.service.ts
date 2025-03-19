/* eslint-disable @typescript-eslint/no-floating-promises */
import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close()
    })
  }

  async cleanDatabase(): Promise<void> {
    // Add the models you want to clean in the correct order (respecting foreign key constraints)
    const models = ['User', 'Worker']

    for (const model of models) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${model}" CASCADE;`)
    }
  }
}
