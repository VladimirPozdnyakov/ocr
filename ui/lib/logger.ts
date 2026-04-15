'use client'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const mergedContext: LogContext = { ...context }
    if (error instanceof Error) {
      mergedContext.errorName = error.name
      mergedContext.errorMessage = error.message
      if (this.isDevelopment) {
        mergedContext.errorStack = error.stack
      }
    } else if (error !== undefined) {
      mergedContext.error = String(error)
    }

    console.error(this.formatMessage('error', message, mergedContext))
  }
}

export const logger = new Logger()
