import {
  action,
  injectable,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useEffect, useMemo, useState } from 'react';

import {
  TeamMessagingChats,
  TeamMessagingPersons,
  type TeamMessagingPost,
  TeamMessagingPosts,
  type TeamMessagingPostItem,
  TeamMessagingThreads,
  toPostItem,
} from '../../services/TeamMessaging';
import { upsertPosts } from '../../services/TeamMessaging/TeamMessaging.helper';
import { ThreadDrawer } from './components/ThreadDrawer';
import type {
  ThreadDrawerProps,
  ThreadViewProps,
} from './TeamMessaging.view.interface';

/** Whether a post belongs to the thread of `parent`. */
function isReplyTo(post: TeamMessagingPost, parent: TeamMessagingPost): boolean {
  return (
    post.id !== parent.id &&
    (post.parentPostId === parent.id ||
      (!!parent.threadId && post.threadId === parent.threadId))
  );
}

/**
 * A thread, opened in a drawer over its chat: the parent post, its replies
 * and a composer that replies in the thread.
 */
@injectable({
  name: 'TeamMessagingThreadView',
})
export class TeamMessagingThreadView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _teamMessagingPosts: TeamMessagingPosts,
    private _teamMessagingThreads: TeamMessagingThreads,
    private _teamMessagingPersons: TeamMessagingPersons,
  ) {
    super();
    // The chat list is fetched on demand; a failed fetch must not keep this
    // view, and the app view that renders it, from initializing.
    const readiness = this as unknown as {
      _ignoreModuleReadiness(dep: object): void;
    };
    readiness._ignoreModuleReadiness(_teamMessagingChats);
  }

  /** Text typed in each thread and not sent yet, by parent post id. */
  @state
  drafts: Record<string, string> = {};

  @action
  saveDraft(postId: string, text: string): void {
    if (text) {
      this.drafts[postId] = text;
    } else {
      delete this.drafts[postId];
    }
  }

  /** The parent post: from the chat's posts, or fetched by id. */
  getParent(chatId: string, postId: string): TeamMessagingPost | undefined {
    return (
      this._teamMessagingPosts.postsMap[chatId]?.find(
        ({ id }) => id === postId,
      ) ?? this._teamMessagingThreads.parentsMap[postId]
    );
  }

  /** The parent, then its replies, oldest first. */
  private _usePosts(
    chatId: string,
    postId: string,
  ): { parent?: TeamMessagingPost; posts: TeamMessagingPostItem[] } {
    const { parent, chatPosts, replies, personsMap, myId } = useConnector(
      () => {
        const parentPost = this.getParent(chatId, postId);
        return {
          parent: parentPost,
          chatPosts: this._teamMessagingPosts.postsMap[chatId],
          replies: parentPost?.threadId
            ? this._teamMessagingThreads.repliesMap[parentPost.threadId]
            : undefined,
          personsMap: this._teamMessagingPersons.personsMap,
          myId: this._teamMessagingChats.myId,
        };
      },
    );
    const posts = useMemo(() => {
      if (!parent) {
        return [];
      }
      // Replies come from the thread, plus those in the chat's posts, such
      // as a first reply still being sent.
      const newestFirst = upsertPosts(
        replies ?? [],
        (chatPosts ?? []).filter((post) => isReplyTo(post, parent)),
      );
      return [parent, ...[...newestFirst].reverse()].map((post) =>
        toPostItem({ post, personsMap, myId }),
      );
    }, [parent, chatPosts, replies, personsMap, myId]);
    return { parent, posts };
  }

  /**
   * Load the parent when it is not loaded, then its replies. Returns whether
   * looking for the parent has finished.
   */
  private _useLoadThread(
    chatId: string,
    postId: string,
    threadId?: string,
  ): boolean {
    const [parentChecked, setParentChecked] = useState(false);
    useEffect(() => {
      if (!postId) {
        return undefined;
      }
      let active = true;
      setParentChecked(false);
      void this._teamMessagingThreads
        .loadParent(chatId, postId)
        .finally(() => active && setParentChecked(true));
      return () => {
        active = false;
      };
    }, [chatId, postId]);
    useEffect(() => {
      if (threadId) {
        void this._teamMessagingThreads.loadThread(chatId, threadId);
      }
    }, [chatId, threadId]);
    return parentChecked;
  }

  private _useDrawerFunctions(
    { chatId, postId, actions }: ThreadViewProps,
    threadId?: string,
  ): Pick<
    ThreadDrawerProps,
    'loadOlderPosts' | 'sendMessage' | 'saveDraft'
  > {
    return useMemo(
      () => ({
        loadOlderPosts: () =>
          threadId
            ? this._teamMessagingThreads.loadOlderReplies(chatId, threadId)
            : Promise.resolve(false),
        // The first reply starts the thread; later ones join it.
        sendMessage: (text: string, files: File[]) =>
          actions.sendMessage(
            text,
            files,
            threadId ? { threadId } : { parentPostId: postId ?? undefined },
          ),
        saveDraft: (text: string) => {
          if (postId) {
            this.saveDraft(postId, text);
          }
        },
      }),
      [chatId, postId, threadId, actions],
    );
  }

  component(props: ThreadViewProps): React.ReactElement {
    const { chatId, postId, actions, container, onClose } = props;
    const threadPostId = postId ?? '';
    const { parent, posts } = this._usePosts(chatId, threadPostId);
    const threadId = parent?.threadId;
    const parentChecked = this._useLoadThread(chatId, threadPostId, threadId);
    const functions = this._useDrawerFunctions(props, threadId);
    const { chat, loadingReplies, hasOlderPosts } = useConnector(() => ({
      chat: this._teamMessagingChats.getChatItem(chatId),
      loadingReplies: threadId
        ? !!this._teamMessagingThreads.loadingThreadIds[threadId]
        : false,
      hasOlderPosts: threadId
        ? !!this._teamMessagingThreads.olderPageTokens[threadId]
        : false,
    }));
    const { sendMessage: _sendMessage, ...postActions } = actions;
    return (
      <ThreadDrawer
        {...postActions}
        {...functions}
        threadKey={threadPostId}
        open={!!postId}
        container={container}
        onClose={onClose}
        members={chat?.members ?? []}
        posts={posts}
        isLoading={loadingReplies || (!parent && !parentChecked)}
        isAvailable={!!parent || !parentChecked}
        hasOlderPosts={hasOlderPosts}
        draft={this.drafts[threadPostId] ?? ''}
      />
    );
  }
}
