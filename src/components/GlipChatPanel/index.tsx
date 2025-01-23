import React, { useEffect } from 'react';
import { RcLoading, RcIconButton, styled, palette2 } from '@ringcentral/juno';
import { Close as CloseIcon } from '@ringcentral/juno-icon';
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

const CloseButton = styled(RcIconButton)`
  position: absolute;
  right: 6px;
  top: 0;
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
  onBack = undefined,
  loadGroup,
  groupId = null,
  hideBackButton = false,
  showCloseButton = false,
  onClose,
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
  onBack?: (...args: any[]) => any;
  loadGroup: (...args: any[]) => any;
  groupId?: string | null;
  hideBackButton?: boolean;
  showCloseButton?: boolean;
  onClose?: (...args: any[]) => any;
}) {
  useEffect(() => {
    loadGroup(groupId);
  }, [groupId]);

  return (
    <BackHeaderView
      dataSign="glipChat"
      onBack={onBack}
      title={getGlipGroupName({ group, showNumber: true})}
      hideBackButton={!onBack || hideBackButton}
      className={className}
      rightButton={showCloseButton ? (
        <CloseButton 
          symbol={CloseIcon} 
          title="Close" 
          onClick={onClose} 
          data-sign="closeButton"
        />
      ) : null}
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
