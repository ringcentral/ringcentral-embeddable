import type { ConversationLoggerOptions as BaseConversationLoggerOptions } from '@ringcentral-integration/micro-message/src/app/services/ConversationLogger/ConversationLogger.interface';

export interface ConversationLoggerOptions
  extends BaseConversationLoggerOptions {
  autoLog?: boolean;
}
