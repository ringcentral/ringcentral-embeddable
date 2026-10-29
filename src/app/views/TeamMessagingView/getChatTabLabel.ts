/** Counts above this show as "99+". */
const MAX_UNREAD_COUNT = 99;

/** A sub tab's label with its unread count, such as "All (9)" or "All (99+)". */
export function getChatTabLabel(label: string, unreadCount: number): string {
  if (unreadCount <= 0) {
    return label;
  }
  const count =
    unreadCount > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : `${unreadCount}`;
  return `${label} (${count})`;
}
