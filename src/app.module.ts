import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler'
import { CacheModule } from '@nestjs/cache-manager'

import { LoggingInterceptor } from './common/logging/logging.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { CustomThrottlerGuard } from './common/guards/throttler.guard'
import { LoggingModule } from './common/logging'
import { PrismaModule } from './infraestructure/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { QueueModule } from './modules/queue/queue.module'
import { redisConfig } from './config/redis.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<ThrottlerModuleOptions> => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL') || 60,
            limit: config.get<number>('THROTTLE_LIMIT') || 100,
          },
        ],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    LoggingModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
