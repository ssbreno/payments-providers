import { BaseException } from './base.exception'

export class BusinessException extends BaseException {
  constructor(message: string, errorCode?: string, metadata?: Record<string, unknown>) {
    super(message, 422, errorCode || 'BUSINESS_ERROR', metadata)
    this.name = 'BusinessException'
  }
}
