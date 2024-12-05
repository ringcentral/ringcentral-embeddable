import React, { useEffect } from 'react';
import { RcLoading, styled, palette2 } from '@ringcentral/juno';
import { GlipChatForm } from './GlipChatForm';
import { GlipPostList } from './GlipPostList';
import { getGlipGroupName } from './getGlipGroupName';
import { BackHeaderView } from '../BackHeaderView';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  border-bottom: solid 1px ${palette2('neutral', 'l02')};
`;

export function GlipChatPanel({
  group = {},
  className = undefined,
  posts = [],
  updateText,
  createPost,
  textValue = '',
  dateTimeFormatter,
  showSpinner = false,
  atRender = undefined,
  uploadFile,
  viewProfile,
  loadNextPage,
  onBackClick = undefined,
  loadGroup,
  groupId = null,
}: {
  group: any;
  className?: string;
  posts: any[];
  updateText: (...args: any[]) => any;
  createPost: (...args: any[]) => any;
  textValue: string;
  dateTimeFormatter: (...args: any[]) => any;
  showSpinner: boolean;
  atRender?: (...args: any[]) => any;
  uploadFile: (...args: any[]) => any;
  viewProfile: (...args: any[]) => any;
  loadNextPage: (...args: any[]) => any;
  onBackClick?: (...args: any[]) => any;
  loadGroup: (...args: any[]) => any;
  groupId?: string | null;
}) {
  useEffect(() => {
    loadGroup(groupId);
  }, [groupId]);

  return (
    <BackHeaderView
      dataSign="glipChat"
      onBack={onBackClick}
      title={getGlipGroupName({ group, showNumber: true})}
      hideBackButton={!onBackClick}
      className={className}
    >
      <RcLoading loading={showSpinner}>
        <Container>
          <Content>
            <GlipPostList
              posts={posts}
              atRender={atRender}
              groupId={group.id}
              dateTimeFormatter={dateTimeFormatter}
              viewProfile={viewProfile}
              loadNextPage={loadNextPage}
            />
          </Content>
          <GlipChatForm
            textValue={textValue}
            onTextChange={updateText}
            groupId={group.id}
            onSubmit={createPost}
            onUploadFile={uploadFile}
            members={group.detailMembers}
            placeholder="Type a message"
            disabled={showSpinner}
          />
        </Container>
      </RcLoading>
    </BackHeaderView>
  );
}
