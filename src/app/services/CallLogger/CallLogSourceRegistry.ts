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

class CallLogSourceRegistry {
  private readonly sources = new Map<string, CallLogSource>();

  register(source: CallLogSource): void {
    console.log('[CallLogSourceRegistry] register:', source.source);
    this.sources.set(source.source, source);
  }

  unregister(sourceName: string): void {
    console.log('[CallLogSourceRegistry] unregister:', sourceName);
    this.sources.delete(sourceName);
  }

  get(sourceName: string): CallLogSource | undefined {
    return this.sources.get(sourceName);
  }

  async getCall(
    sourceName: string | undefined,
    id: string,
  ): Promise<CompatibleCall | null> {
    console.log('[CallLogSourceRegistry] getCall query:', {
      sourceName,
      id,
      registeredSources: Array.from(this.sources.keys()),
    });
    if (!sourceName || !id) {
      return null;
    }
    const source = this.sources.get(sourceName);
    if (!source) {
      console.warn('[CallLogSourceRegistry] source not registered:', {
        sourceName,
        registeredSources: Array.from(this.sources.keys()),
      });
      return null;
    }
    return source.getCallForLog(id);
  }
}

export const callLogSourceRegistry = new CallLogSourceRegistry();
