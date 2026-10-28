import type { HeaderNavViewSpringOptions } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';

export interface EmbeddableHeaderNavViewOptions
  extends HeaderNavViewSpringOptions {
  /**
   * Unread team messaging posts, for the Chat tab badge. The Chat tab shows
   * only when this is set and team messaging is enabled.
   */
  getChatUnreadCount?: () => number;
}
