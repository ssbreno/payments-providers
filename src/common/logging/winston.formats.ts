import * as clc from 'cli-color'
import { format } from 'winston'
import * as winston from 'winston'

interface LogLevel {
  [key: string]: number
}

interface FormatOptions {
  upperCase?: boolean
}

interface WinstonInfo extends winston.Logform.TransformableInfo {
  level: string
  levels?: LogLevel
  context?: string
  timestamp?: string | number | Date
  message: unknown
  ms?: string
  [key: string]: unknown
}

type LogLevelCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
type StackDriverLevel = Record<LogLevelCode, string>

const NPM_LEVEL_NAME_TO_CODE: LogLevel = {
  error: 3,
  warn: 4,
  info: 6,
  verbose: 7,
  debug: 7,
  silly: 7,
}

const STACK_DRIVER_LOGGING_LEVEL_CODE_TO_NAME: StackDriverLevel = {
  0: 'emergency',
  1: 'alert',
  2: 'critical',
  3: 'error',
  4: 'warning',
  5: 'notice',
  6: 'info',
  7: 'debug',
}

const NEST_COLOR_SCHEME: Record<string, (text: string) => string> = {
  info: clc.green,
  error: clc.red,
  warn: clc.yellow,
  debug: clc.magenta,
  verbose: clc.cyan,
}

interface FormatOptions {
  upperCase?: boolean
}

function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

export const severity = format((info: WinstonInfo): WinstonInfo => {
  const { level } = info
  const levels = info.levels || NPM_LEVEL_NAME_TO_CODE
  const levelCode = levels[level] || 6

  const stackDriverLevel =
    STACK_DRIVER_LOGGING_LEVEL_CODE_TO_NAME[levelCode as LogLevelCode] || 'info'

  return {
    ...info,
    severity: stackDriverLevel.toUpperCase(),
  }
})

export const severityWithOptions = (options: FormatOptions = {}): any =>
  format((info: WinstonInfo): WinstonInfo => {
    const { level } = info
    const levels = info.levels || NPM_LEVEL_NAME_TO_CODE
    const levelCode = levels[level] || 6
    const stackDriverLevel =
      STACK_DRIVER_LOGGING_LEVEL_CODE_TO_NAME[levelCode as LogLevelCode] || 'info'

    return {
      ...info,
      severity: options.upperCase ? stackDriverLevel.toUpperCase() : stackDriverLevel,
    }
  })

export const nestConsoleFormat = (appName = 'NestWinston'): winston.Logform.Format => {
  return format((info: WinstonInfo) => {
    const { context, level, timestamp, message, ms, ...meta } = info
    const color = NEST_COLOR_SCHEME[level] || ((text: string): string => text)
    const levelMessage = color(`[${appName}] ${level.toUpperCase()} - `)

    const timestampMessage = timestamp
      ? new Date(timestamp).toLocaleString()
      : new Date().toLocaleString()

    const contextMessage = context ? clc.yellow(`[${context}] `) : ''

    const outputMessage = isObject(message)
      ? color(JSON.stringify(message))
      : color(String(message))

    const timestampDiff = ms ? clc.yellow(ms) : ''

    const metaMessage = Object.keys(meta).length > 0 ? color(JSON.stringify(meta, null, 2)) : ''

    const formattedMessage =
      `${levelMessage}${timestampMessage} ${contextMessage}${outputMessage}${timestampDiff ? ' ' + timestampDiff : ''}${metaMessage ? ' ' + metaMessage : ''}`.trim()

    info.message = formattedMessage

    return info
  })() as winston.Logform.Format
}
