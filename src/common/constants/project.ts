import { ConfigService } from '@nestjs/config'

let configService: ConfigService

export const setConfigService = (config: ConfigService) => {
  configService = config
}

export const getProjectName = () => configService?.get('project.name') || ''
export const getProjectDescription = () => configService?.get('project.description') || ''
export const getProjectVersion = () => configService?.get('project.version') || ''

export const PROJECT_NAME = process.env.npm_package_name || process.env.PROJECT_NAME || ''
export const PROJECT_DESCRIPTION =
  process.env.npm_package_description || process.env.PROJECT_DESCRIPTION || ''
export const PROJECT_VERSION = process.env.npm_package_version || process.env.PROJECT_VERSION || ''
