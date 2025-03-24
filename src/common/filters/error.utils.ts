import { ValidationError } from 'class-validator'

function toSnakeCase(string?: string): string {
  if (!string) return ''

  const matches = string.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)

  return matches ? matches.map(x => x.toLowerCase()).join('_') : ''
}

export function getErrorCode(exception: ExceptionResponse | string): string {
  if (typeof exception === 'string') {
    return formatErrorCode(exception)
  }

  if ('error' in exception && typeof exception.error === 'string') {
    return formatErrorCode(exception.error)
  }

  return ''
}

export function getErrorMessage(exception: ExceptionResponse | string): string | Array<string> {
  if (typeof exception === 'string') {
    return exception
  }

  const exceptionObj = exception

  if (typeof exceptionObj?.message === 'string') {
    return exceptionObj.message
  }

  if (
    Array.isArray(exceptionObj?.message) &&
    exceptionObj.message.every(msg => typeof msg === 'string')
  ) {
    return exceptionObj.message
  }

  if (Array.isArray(exceptionObj?.message)) {
    const firstError = exceptionObj.message[0]

    if (typeof firstError === 'string') {
      return firstError
    }

    if ('constraints' in firstError || 'children' in firstError) {
      return parseErrorMessage(firstError as ValidationError)
    }
  }

  return 'INTERNAL_SERVER_ERROR'
}

function formatErrorCode(error: string): string {
  return toSnakeCase(error).toUpperCase()
}

function parseErrorMessage(error: ValidationError): string {
  const constraints = findConstraints(error)

  if (!constraints) {
    return 'Invalid parameter'
  }

  return Object.values(constraints).join(' -- ')
}

function findConstraints(error: ValidationError): Constraint | undefined {
  if (error.constraints) {
    return error.constraints
  }

  if (error.children && error.children.length > 0) {
    for (const child of error.children) {
      const constraints = findConstraints(child)
      if (constraints) {
        return constraints
      }
    }
  }

  return undefined
}

interface Constraint {
  [type: string]: string
}

interface ExceptionResponse {
  error?: string
  message?: string | string[] | ValidationError[]
}
