import React, {useState, useRef, useEffect } from 'react';
import { styled, Virtuoso } from '@ringcentral/juno';
import { GlipPostItem } from './GlipPostItem';

const Container = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

export function GlipPostList({
  className = undefined,
  posts = [],
  groupId = undefined,
  dateTimeFormatter,
  viewProfile,
  loadNextPage,
  atRender = undefined,
}: {
  className?: string;
  posts?: any[];
  groupId?: string;
  dateTimeFormatter: (...args: any[]) => any;
  viewProfile: (...args: any[]) => any;
  loadNextPage: (...args: any[]) => any;
  atRender?: (...args: any[]) => any;
}) {
  const mounted = useRef(true);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const listRef = useRef(null);
  const postsRef = useRef(posts);
  const visibleRangeRef = useRef({ startIndex: 0, endIndex: 0 });
  useEffect(() => {
    let scrollTimeout;
    if (posts.length !== postsRef.current.length) {
      if (visibleRangeRef.current.endIndex > postsRef.current.length - 3) {
        scrollTimeout = setTimeout(() => {
          if (!mounted.current || !listRef.current) {
            return;
          }
          listRef.current.scrollToIndex({
            index: posts.length - 1,
            behavior: 'smooth',
            align: 'end',
          });
        }, 1000);
      } else if (listRef.current) {
        // load more in top
        listRef.current.scrollToIndex(posts.length - postsRef.current.length + visibleRangeRef.current.startIndex);
      }
    }
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.autoscrollToBottom();
    }
  }, [groupId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <Container>
      <Virtuoso
        className={className}
        style={{
          height: '100%',
          width: '100%',
        }}
        ref={listRef}
        initialTopMostItemIndex={posts.length - 1}
        rangeChanged={async (range) => {
          const oldRange = visibleRangeRef.current;
          visibleRangeRef.current = range;
          if (oldRange && range.startIndex < 2 && oldRange.startIndex > range.startIndex) {
            // start reached
            if (!mounted.current) {
              return;
            }
            if (loadingNextPage) {
              return;
            }
            setLoadingNextPage(true);
            await loadNextPage();
            if (!mounted.current) {
              return;
            }
            setLoadingNextPage(false);
          }
        }}
        totalCount={posts.length}
        data={posts}
        itemContent={(index, post) => {
          const lastPost = posts[index - 1];
          let showCreator = true;
          if (
            lastPost &&
            lastPost.creatorId === post.creatorId &&
            lastPost.type === post.type &&
            lastPost.type === 'TextMessage'
          ) {
            const date = new Date(post.creationTime);
            const lastDate = new Date(lastPost.creationTime);
            if (
              date.getTime() - lastDate.getTime() < 60 * 1000 &&
              date.getMinutes() === lastDate.getMinutes()
            ) {
              showCreator = false;
            }
          }
          return (
            <GlipPostItem
              post={post}
              creationTime={dateTimeFormatter(post.creationTime)}
              atRender={atRender}
              viewProfile={viewProfile}
              showCreator={showCreator}
            />
          );
        }}
      />
    </Container>
  );
}
