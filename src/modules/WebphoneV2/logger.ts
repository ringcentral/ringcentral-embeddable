export class Logger {
  public log(message: string, ...args: any[]) {
    console.log('[INFO] WEBPHONE ', message, ...args);
  }

  public warn(message: string, ...args: any[]) {
    console.warn('[WARN] WEBPHONE ', message, ...args);
  }

  public error(message: string, ...args: any[]) {
    console.error('[ERROR] WEBPHONE ', message, ...args);
  }

  public debug(message: string, ...args: any[]) {
    console.log('[DEBUG] WEBPHONE ', message, ...args);
  }
}
