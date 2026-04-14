'use client'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
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
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    }

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorContext))
    } else {
      // In production, you could send to error tracking service like Sentry
      // For now, just log to console
      console.error(this.formatMessage('error', message, errorContext))
    }
  }
}

export const logger = new Logger()
