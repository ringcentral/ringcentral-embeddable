import type {
  DateTimeFormat,
  LogOptions as LoggerLogOptions,
} from '@ringcentral-integration/micro-core/src/app/services';

import type { ThirdParty } from '../ThirdParty';
import type { ConversationLoggerOptions } from './ConversationLogger.interface';

interface CreateConversationLoggerOptions {
  autoLog: boolean;
  dateTimeFormat: DateTimeFormat;
  thirdParty: ThirdParty;
}

export function createConversationLoggerOptions({
  autoLog,
  dateTimeFormat,
  thirdParty,
}: CreateConversationLoggerOptions): ConversationLoggerOptions {
  return {
    autoLog,
    async logFunction<P, S>({
      item,
      ...options
    }: LoggerLogOptions<P, S>): Promise<void> {
      if (!item) {
        return;
      }
      await thirdParty.logConversation({
        ...(options as Record<string, unknown>),
        item: item as Parameters<ThirdParty['logConversation']>[0]['item'],
      });
    },
    readyCheckFunction: () => thirdParty.messageLoggerRegistered,
    isLoggedContact(_conversation, lastActivity, item) {
      const activity = lastActivity as typeof lastActivity & {
        contact?: string | { id?: string };
        contactId?: string;
      };
      const contactId =
        typeof activity.contact === 'string'
          ? activity.contact
          : activity.contact?.id;
      return Boolean(
        item?.id &&
          [activity.id, activity.contactId, contactId].includes(item.id),
      );
    },
    accordWithLogRequirement(conversation) {
      if ((conversation.type as string) === 'Thread') {
        return true;
      }
      const today = dateTimeFormat.formatDateTime({
        type: 'date',
        utcTimestamp: new Date(),
      });
      return conversation.date === today;
    },
  };
}
