import { ConfigService } from '@nestjs/config'

describe('Project Constants', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('PROJECT_NAME', () => {
    it('should use npm package name when available', () => {
      process.env.npm_package_name = 'test-package'
      delete process.env.PROJECT_NAME
      const { PROJECT_NAME } = require('../../../src/common/constants/project')
      expect(PROJECT_NAME).toBe('test-package')
    })

    it('should use PROJECT_NAME env when npm_package_name is not available', () => {
      delete process.env.npm_package_name
      process.env.PROJECT_NAME = 'env-project-name'
      const { PROJECT_NAME } = require('../../../src/common/constants/project')
      expect(PROJECT_NAME).toBe('env-project-name')
    })

    it('should use empty string when neither npm_package_name nor PROJECT_NAME are available', () => {
      delete process.env.npm_package_name
      delete process.env.PROJECT_NAME
      const { PROJECT_NAME } = require('../../../src/common/constants/project')
      expect(PROJECT_NAME).toBe('')
    })
  })

  describe('PROJECT_DESCRIPTION', () => {
    it('should use npm package description when available', () => {
      process.env.npm_package_description = 'test-description'
      delete process.env.PROJECT_DESCRIPTION
      const { PROJECT_DESCRIPTION } = require('../../../src/common/constants/project')
      expect(PROJECT_DESCRIPTION).toBe('test-description')
    })

    it('should use PROJECT_DESCRIPTION env when npm_package_description is not available', () => {
      delete process.env.npm_package_description
      process.env.PROJECT_DESCRIPTION = 'env-project-description'
      const { PROJECT_DESCRIPTION } = require('../../../src/common/constants/project')
      expect(PROJECT_DESCRIPTION).toBe('env-project-description')
    })

    it('should use empty string when neither npm_package_description nor PROJECT_DESCRIPTION are available', () => {
      delete process.env.npm_package_description
      delete process.env.PROJECT_DESCRIPTION
      const { PROJECT_DESCRIPTION } = require('../../../src/common/constants/project')
      expect(PROJECT_DESCRIPTION).toBe('')
    })
  })

  describe('PROJECT_VERSION', () => {
    it('should use npm package version when available', () => {
      process.env.npm_package_version = '1.0.0'
      delete process.env.PROJECT_VERSION
      const { PROJECT_VERSION } = require('../../../src/common/constants/project')
      expect(PROJECT_VERSION).toBe('1.0.0')
    })

    it('should use PROJECT_VERSION env when npm_package_version is not available', () => {
      delete process.env.npm_package_version
      process.env.PROJECT_VERSION = '2.0.0'
      const { PROJECT_VERSION } = require('../../../src/common/constants/project')
      expect(PROJECT_VERSION).toBe('2.0.0')
    })

    it('should use empty string when neither npm_package_version nor PROJECT_VERSION are available', () => {
      delete process.env.npm_package_version
      delete process.env.PROJECT_VERSION
      const { PROJECT_VERSION } = require('../../../src/common/constants/project')
      expect(PROJECT_VERSION).toBe('')
    })
  })

  describe('ConfigService Integration', () => {
    let projectModule: any
    let mockConfigService: { get: jest.Mock }

    beforeEach(() => {
      mockConfigService = {
        get: jest.fn(),
      }

      jest.resetModules()
      projectModule = require('../../../src/common/constants/project')
    })

    describe('setConfigService', () => {
      it('should set the config service instance', () => {
        projectModule.setConfigService(mockConfigService)

        mockConfigService.get.mockReturnValueOnce('test-project-name')
        const result = projectModule.getProjectName()

        expect(mockConfigService.get).toHaveBeenCalledWith('project.name')
        expect(result).toBe('test-project-name')
      })
    })

    describe('getProjectName', () => {
      it('should get project name from config service when available', () => {
        projectModule.setConfigService(mockConfigService)
        mockConfigService.get.mockReturnValueOnce('test-project-name')

        const result = projectModule.getProjectName()

        expect(mockConfigService.get).toHaveBeenCalledWith('project.name')
        expect(result).toBe('test-project-name')
      })

      it('should return empty string when config service is not set', () => {
        jest.resetModules()
        const freshModule = require('../../../src/common/constants/project')

        expect(freshModule.getProjectName()).toBe('')
      })
    })

    describe('getProjectDescription', () => {
      it('should get project description from config service when available', () => {
        projectModule.setConfigService(mockConfigService)
        mockConfigService.get.mockReturnValueOnce('test-project-description')

        const result = projectModule.getProjectDescription()

        expect(mockConfigService.get).toHaveBeenCalledWith('project.description')
        expect(result).toBe('test-project-description')
      })

      it('should return empty string when config service is not set', () => {
        jest.resetModules()
        const freshModule = require('../../../src/common/constants/project')

        expect(freshModule.getProjectDescription()).toBe('')
      })
    })

    describe('getProjectVersion', () => {
      it('should get project version from config service when available', () => {
        projectModule.setConfigService(mockConfigService)
        mockConfigService.get.mockReturnValueOnce('1.0.0-test')

        const result = projectModule.getProjectVersion()

        expect(mockConfigService.get).toHaveBeenCalledWith('project.version')
        expect(result).toBe('1.0.0-test')
      })

      it('should return empty string when config service is not set', () => {
        jest.resetModules()
        const freshModule = require('../../../src/common/constants/project')

        expect(freshModule.getProjectVersion()).toBe('')
      })
    })
  })
})
