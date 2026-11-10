import type { CompatibleCall } from './CallLogger';

export const RINGCX_CALL_LOG_SOURCE = 'ringcx';

/**
 * A source that can build a host log-page call without the host importing
 * that source's runtime. The RingCX chunk registers `'ringcx'` when it loads.
 */
export interface CallLogSource {
  readonly source: string;
  getCallForLog(id: string): Promise<CompatibleCall | null>;
}

/**
 * Shows a source's call log form somewhere other than the log page, such as
 * a RingCX wrap-up page. Resolves whether it did.
 */
export type CallLogPageHandler = (id: string) => Promise<boolean>;

class CallLogSourceRegistry {
  private readonly sources = new Map<string, CallLogSource>();

  private readonly logPageHandlers = new Map<string, CallLogPageHandler>();

  registerLogPageHandler(source: string, handler: CallLogPageHandler): void {
    this.logPageHandlers.set(source, handler);
  }

  unregisterLogPageHandler(source: string): void {
    this.logPageHandlers.delete(source);
  }

  /**
   * Lets the source show a log page path for one of its calls itself.
   *
   * @returns Whether the source showed it; the log page opens otherwise.
   */
  async openLogPage(
    sourceName: string | undefined,
    id: string,
  ): Promise<boolean> {
    const handler = sourceName ? this.logPageHandlers.get(sourceName) : undefined;
    if (!handler || !id) {
      return false;
    }
    return handler(id);
  }

  register(source: CallLogSource): void {
    this.sources.set(source.source, source);
  }

  unregister(sourceName: string): void {
    this.sources.delete(sourceName);
  }

  get(sourceName: string): CallLogSource | undefined {
    return this.sources.get(sourceName);
  }

  async getCall(
    sourceName: string | undefined,
    id: string,
  ): Promise<CompatibleCall | null> {
    if (!sourceName || !id) {
      return null;
    }
    const source = this.sources.get(sourceName);
    if (!source) {
      return null;
    }
    return source.getCallForLog(id);
  }
}

export const callLogSourceRegistry = new CallLogSourceRegistry();
