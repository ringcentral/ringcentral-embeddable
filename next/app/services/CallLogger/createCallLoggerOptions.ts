import type { LogOptions as LoggerLogOptions } from "@ringcentral-integration/micro-core/src/app/services";
import type { CallLoggerOptions } from "@ringcentral-integration/micro-phone/src/app/services";

import type { ThirdParty } from "../ThirdParty";

interface CreateCallLoggerOptions {
  autoLog: boolean;
  thirdParty: ThirdParty;
}

export function createCallLoggerOptions({
  autoLog,
  thirdParty,
}: CreateCallLoggerOptions): CallLoggerOptions {
  return {
    autoLog,
    async logFunction<P, S>({
      item,
      ...options
    }: LoggerLogOptions<P, S>): Promise<void> {
      if (!item) {
        return;
      }
      await thirdParty.logCall({
        ...(options as Record<string, unknown>),
        call: item as Parameters<ThirdParty["logCall"]>[0]["call"],
      });
    },
    readyCheckFunction: () => thirdParty.callLoggerRegistered,
  };
}
