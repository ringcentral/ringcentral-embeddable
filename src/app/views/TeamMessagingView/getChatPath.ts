/** The Chat tab, as in the legacy app and its analytics. */
export const CHATS_PATH = '/glip';

/** A chat page, as in the legacy app and its analytics. */
export function getChatPath(chatId: string): string {
  return `${CHATS_PATH}/groups/${encodeURIComponent(chatId)}`;
}
