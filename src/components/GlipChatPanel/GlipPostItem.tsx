import React from 'react';
import type { ReactNode } from 'react';
import {
  RcAvatar,
  RcIcon,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  styled,
  palette2,
} from '@ringcentral/juno';
import { UserDefault } from '@ringcentral/juno-icon';
import status from '@ringcentral-integration/commons/modules/GlipPosts/status';
import { GlipPostContent } from './GlipPostContent';

type Creator = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
};
function PostAvatar({
  creator = null,
  viewProfile
}: {
  creator: Creator | null;
  viewProfile: (id: string) => void;
}) {
  return (
    <RcAvatar
      src={creator && creator.avatar}
      size="xsmall"
      color="avatar.global"
      onClick={creator ? () => viewProfile(creator.id) : undefined}
    >
      {
        creator && creator.avatar ? null : (
          <RcIcon
            symbol={UserDefault}
            size="small"
          />
        )
      }
    </RcAvatar>
  )
}

const NameWrapper = styled.span`
  display: flex;
  flex-direction: row;
`;

const NameText = styled.span`
  flex: 1;
  cursor: pointer;
  font-weight: 700;
  color: ${palette2('neutral', 'f06')};
  font-size: 0.875rem;
`;

const TimeText = styled.span`
  text-align: right;
  font-size: 0.75rem;
  color: ${palette2('neutral', 'f04')};
`;

function PostName({
  creator = null,
  showName,
  viewProfile,
  dateTime,
}: {
  creator: Creator | null;
  showName: boolean;
  viewProfile: (id: string) => void;
  dateTime?: string;
  sendStatus?: string | null;
}) {
  if (!creator || !showName) {
    return null;
  }
  return (
    <NameWrapper>
      <NameText onClick={() => viewProfile(creator.id)}>
        {creator.firstName} {creator.lastName}
      </NameText>
      {
        dateTime ? (
          <TimeText>{dateTime}</TimeText>
        ) : null
      }
    </NameWrapper>
  );
}

function OtherMessageType({
  postType,
  addedPersons,
}: {
  postType: string;
  addedPersons: ReactNode | null;
}) {
  return (
    <span>
      {postType === 'PersonJoined' ? 'joined the team' : null}
      {postType === 'PersonsAdded' ? 'added ' : null}
      {addedPersons}
    </span>
  );
}

function PostStatus({ sendStatus = null }: { sendStatus: string | null }) {
  if (!sendStatus) {
    return null;
  }
  return (
    <span>{sendStatus === status.creating ? 'Sending' : 'Send failed'}</span>
  );
}

const StyledItem = styled(RcListItem)`
  align-items: flex-start;

  .RcListItemText-secondary {
    font-size: 0.875rem;
    color: ${palette2('neutral', 'f06')};

    a {
      color: ${palette2('interactive', 'f01')};
    }
  }
`;

const StyledItemAvatar = styled(RcListItemAvatar)`
  margin-top: 5px;  
`;

const EmptyAvatar = styled.div`
  width: 32px;
  margin-right: 8px;
`;

export function GlipPostItem({
  post = {},
  className = undefined,
  creationTime = undefined,
  showName = true,
  atRender = () => null,
  viewProfile,
  showCreator = true,
}: {
  post: any;
  className?: string;
  creationTime?: string;
  showName?: boolean;
  showCreator?: boolean;
  atRender: (...args: any[]) => any;
  viewProfile: (...args: any[]) => any;
}) {
  let addedPersons = null;
  if (post.type === 'PersonsAdded') {
    addedPersons =
      post.addedPersonIds &&
      post.addedPersonIds.map((id) => {
        const peronName = atRender({ id, type: 'Person' });
        return <span key={id}>{peronName}</span>;
      });
  }
  return (
    <StyledItem className={className}>
      {
        showCreator ? (
          <StyledItemAvatar>
            <PostAvatar creator={post.creator} viewProfile={viewProfile} />
          </StyledItemAvatar>
        ) : (
          <EmptyAvatar />
        )
      }
      <RcListItemText
        primary={
          showCreator ? (
            <PostName
              creator={post.creator}
              showName={showName || post.type !== 'TextMessage'}
              viewProfile={viewProfile}
              dateTime={creationTime}
            />
          ) : null
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
        secondary={
          <>
            <PostStatus sendStatus={post.sendStatus} />
            {
              post.type === 'TextMessage' ? (
                <GlipPostContent
                  post={post}
                  atRender={atRender}
                />
              ) : (
                <>
                  <OtherMessageType
                    postType={post.type}
                    addedPersons={addedPersons}
                  />
                </>
              )
            }
          </>
        }
      />
    </StyledItem>
  );
}
