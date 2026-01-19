
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && LogLevel[envLevel as keyof typeof LogLevel] !== undefined) {
      this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${levelName}]`;
    
    if (data) {
      console.log(prefix, message, JSON.stringify(data));
    } else {
      console.log(prefix, message);
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...data }
      : { error, ...data };
    
    this.log(LogLevel.ERROR, 'ERROR', message, errorData);
  }
}

export { Logger };
export const logger = Logger.getInstance();
