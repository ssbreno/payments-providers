import { BaseException } from './base.exception'

export class DomainException extends BaseException {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 400, 'DOMAIN_ERROR', metadata)
    this.name = 'DomainException'
  }
}
