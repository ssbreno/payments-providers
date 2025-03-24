export interface ErrorMetadata {
  code?: string
  details?: Record<string, unknown>
  stack?: string
}

export interface ErrorResponse {
  message: string
  metadata?: ErrorMetadata
}
