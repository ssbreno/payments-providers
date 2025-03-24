import { BaseException } from './base.exception'

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized access', metadata?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', metadata)
    this.name = 'UnauthorizedException'
  }
}
