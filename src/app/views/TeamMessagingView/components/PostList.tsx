import { CircularProgressIndicator } from '@ringcentral/spring-ui';
import React, { useCallback, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { TeamMessagingPostItem } from '../../../services/TeamMessaging';
import type { EmojiLookup } from '../formatPostText';
import type {
  ChatPanelProps,
  ThreadInfo,
} from '../TeamMessaging.view.interface';
import { PostItem, type PostItemProps } from './PostItem';

/** Virtuoso needs a positive first index that drops as older posts load. */
const FIRST_ITEM_INDEX = 1_000_000;

/** Consecutive posts by one person within a minute share the header. */
const GROUP_INTERVAL_MS = 60 * 1000;

function getTime(post?: TeamMessagingPostItem): number {
  return post?.creationTime ? new Date(post.creationTime).getTime() : 0;
}

function shouldShowCreator(
  post: TeamMessagingPostItem,
  previous?: TeamMessagingPostItem,
): boolean {
  return !(
    previous &&
    post.type === 'TextMessage' &&
    previous.type === 'TextMessage' &&
    previous.creatorId === post.creatorId &&
    getTime(post) - getTime(previous) < GROUP_INTERVAL_MS
  );
}

/**
 * Keeps Virtuoso's first item index in step with older posts being added at
 * the top, so the scroll position holds while they load.
 */
function useFirstItemIndex(posts: readonly TeamMessagingPostItem[]): number {
  const stateRef = useRef({
    firstId: posts[0]?.id,
    firstItemIndex: FIRST_ITEM_INDEX,
  });
  const firstId = posts[0]?.id;
  if (firstId !== stateRef.current.firstId) {
    const oldFirstPosition = posts.findIndex(
      (post) => post.id === stateRef.current.firstId,
    );
    if (oldFirstPosition > 0) {
      stateRef.current.firstItemIndex -= oldFirstPosition;
    }
    stateRef.current.firstId = firstId;
  }
  return stateRef.current.firstItemIndex;
}

/**
 * Whether the newest post is a new one the user sent, so the list should
 * follow it even when not scrolled to the bottom. Loading older posts also
 * changes the list, but keeps the newest post, so it must not scroll.
 */
function useSentNewPost(posts: readonly TeamMessagingPostItem[]): boolean {
  const lastPost = posts[posts.length - 1];
  const lastIdRef = useRef(lastPost?.id);
  const isNew = !!lastPost && lastPost.id !== lastIdRef.current;
  lastIdRef.current = lastPost?.id;
  return isNew && !!lastPost.sentByMe;
}

type PostListProps = Pick<
  ChatPanelProps,
  'posts' | 'isLoading' | 'hasOlderPosts' | 'loadOlderPosts'
> &
  Omit<PostItemProps, 'post' | 'showCreator' | 'thread' | 'onOpenThread'> & {
    emojiLookup?: EmojiLookup;
    getThreadInfo?: (post: TeamMessagingPostItem) => ThreadInfo | undefined;
    openThread?: (post: TeamMessagingPostItem) => void;
  };

/**
 * The posts, oldest first. It opens at the newest post, loads older posts at
 * the top and follows new posts while scrolled to the bottom.
 */
export function PostList({
  posts,
  isLoading,
  hasOlderPosts,
  loadOlderPosts,
  getThreadInfo,
  openThread,
  ...itemProps
}: PostListProps): React.ReactElement {
  const firstItemIndex = useFirstItemIndex(posts);
  const sentNewPost = useSentNewPost(posts);
  const loadingOlderRef = useRef(false);
  const handleStartReached = useCallback(async () => {
    if (!hasOlderPosts || loadingOlderRef.current) {
      return;
    }
    loadingOlderRef.current = true;
    try {
      await loadOlderPosts();
    } finally {
      loadingOlderRef.current = false;
    }
  }, [hasOlderPosts, loadOlderPosts]);
  const itemContent = useCallback(
    (index: number, post: TeamMessagingPostItem) => {
      const position = index - firstItemIndex;
      return (
        <PostItem
          {...itemProps}
          post={post}
          showCreator={shouldShowCreator(post, posts[position - 1])}
          thread={getThreadInfo?.(post)}
          onOpenThread={openThread ? () => openThread(post) : undefined}
        />
      );
    },
    [firstItemIndex, itemProps, posts, getThreadInfo, openThread],
  );
  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        {isLoading ? (
          <CircularProgressIndicator size="large" color="primary" />
        ) : null}
      </div>
    );
  }
  return (
    <Virtuoso
      className="flex-1"
      data-sign="postList"
      data={posts}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={posts.length - 1}
      computeItemKey={(_index, post) => post.id ?? _index}
      startReached={() => void handleStartReached()}
      followOutput={(isAtBottom) =>
        isAtBottom || sentNewPost ? 'smooth' : false
      }
      components={{
        Header: () =>
          isLoading && hasOlderPosts ? (
            <div className="flex justify-center py-2">
              <CircularProgressIndicator size="small" color="primary" />
            </div>
          ) : null,
        Footer: () => <div className="h-3" />,
      }}
      itemContent={itemContent}
    />
  );
}
