import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import type {
  ConversationLogger,
  FilteredConversation,
} from '@ringcentral-integration/micro-message/src/app/services';
import type { HistoryAction } from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';

type ConversationWithLogState = FilteredConversation & {
  conversationId?: string;
  conversationMatches?: Array<{ id?: string }>;
};

interface CreateConversationLogActionOptions {
  conversation: ConversationWithLogState;
  editLogLabel: string;
  isLogging: boolean;
  logButtonTitle?: string | null;
  logMessageLabel: string;
  ready: boolean;
}

interface LogConversationManuallyOptions {
  conversation: ConversationWithLogState;
  conversationLogger: Pick<ConversationLogger, 'logConversation'>;
  correspondentEntity?: Entity;
}

export function hasLoggedConversation(
  conversation: ConversationWithLogState,
): boolean {
  return Boolean(conversation.conversationMatches?.length);
}

export function createConversationLogAction({
  conversation,
  editLogLabel,
  isLogging,
  logButtonTitle,
  logMessageLabel,
  ready,
}: CreateConversationLogActionOptions): HistoryAction | null {
  if (!ready) {
    return null;
  }
  const isLogged = hasLoggedConversation(conversation);
  return {
    type: isLogged ? 'viewLog' : 'createLog',
    label:
      logButtonTitle ||
      (isLogged ? editLogLabel : logMessageLabel),
    disabled: isLogging,
  };
}

export function insertConversationLogAction(
  actions: HistoryAction[],
  logAction: HistoryAction | null,
): HistoryAction[] {
  const actionsWithoutLog = actions.filter(
    ({ type }) =>
      !['createLog', 'selectRecordsForAutoLog', 'viewLog'].includes(type),
  );
  return logAction ? [logAction, ...actionsWithoutLog] : actionsWithoutLog;
}

export async function logConversationManually({
  conversation,
  conversationLogger,
  correspondentEntity,
}: LogConversationManuallyOptions): Promise<void> {
  const conversationId = conversation.conversationId;
  if (!conversationId) {
    return;
  }
  await conversationLogger.logConversation({
    conversationId,
    correspondentEntity: correspondentEntity!,
    redirect: true,
    triggerType: 'manual',
  });
}
