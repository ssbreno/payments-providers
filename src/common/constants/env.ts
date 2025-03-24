import { ConfigService } from '@nestjs/config'

let configService: ConfigService

export const setConfigService = (config: ConfigService) => {
  configService = config
}

export const getLogLevel = () => {
  if (configService) {
    return configService.get('app.logLevel') || 'debug'
  }
  return process.env.LOG_LEVEL || 'debug'
}

export const isProduction = () => {
  if (configService) {
    return configService.get('app.nodeEnv') === 'production'
  }
  return process.env.NODE_ENV === 'production'
}

export const getPort = () => {
  if (configService) {
    return configService.get('app.port') || 8080
  }
  return process.env.PORT || 8080
}

export const LOG_LEVEL = process.env.LOG_LEVEL || 'debug'
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const PORT = process.env.PORT || 8080
