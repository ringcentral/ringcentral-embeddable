import React from 'react';
import {
  RcIcon,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcChip,
  styled,
  palette2,
} from '@ringcentral/juno';
import { UserDefault, DefaultTeamAvatar } from '@ringcentral/juno-icon';
import { getPostAbstract } from '../GlipChatPanel/formatPost';
import { getGlipGroupName } from '../GlipChatPanel/getGlipGroupName';

type Group = {
  id?: string;
  name?: string;
  type?: string;
  members?: any[];
  detailMembers?: any[];
  latestPost?: any;
  unread?: number;
};

function LatestPost({ latestPost = null, members }: {
  latestPost: any;
  members: any[];
}) {
  if (!latestPost) {
    return null;
  }
  const isGroup = members.length > 2;
  const formatedText = getPostAbstract(latestPost, members);

  if (!isGroup || !latestPost.creator) {
    return (
      <span>
        {formatedText || 'Unsupported message'}
      </span>
    );
  }
  return (
    <span>
      {latestPost.creator.firstName}: {formatedText || 'Unsupported message'}
    </span>
  );
}

function GlipGroupAvatar({
  persons,
  groupType,
}: {
  persons: any[];
  groupType?: string;
}) {
  let avatarUrl = null;
  if (groupType !== 'Team' && persons.length <= 2) {
    const personsWithoutMe = persons.filter((p) => !p.isMe);
    let person = personsWithoutMe && personsWithoutMe[0];
    if (!person) {
      person = persons[0];
    }
    avatarUrl = person.avatar;
  }
  return (
    <RcListItemAvatar>
      <RcAvatar
        src={avatarUrl}
        size="xsmall"
        color="avatar.global"
      >
        {
          avatarUrl ? null : (
            <RcIcon
              symbol={(persons.length > 2 || groupType === 'Team') ? DefaultTeamAvatar : UserDefault}
              size="medium"
            />
          )
        }
      </RcAvatar>
    </RcListItemAvatar>
  );
};

const StyledListItem = styled(RcListItem)`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  background-color: ${palette2('neutral', 'b01')};
`;

const UnreadBadge = styled(RcChip)`
  height: 18px;
  background-color: ${palette2('neutral', 'b04')};

  .MuiChip-label {
    padding: 0 4px;
    font-size: 0.875rem;
    color: ${palette2('neutral', 'f01')};
  }
`;

const StyledSecondaryAction = styled(RcListItemSecondaryAction)`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  height: 38px;
`;

export function GlipGroupItem(
  {
    group = {},
    className = undefined,
    onSelectGroup,
    active = false,
    dateTimeFormatter,
  }: {
    group: Group;
    className?: string;
    onSelectGroup: (...args: any[]) => any;
    active?: boolean;
    dateTimeFormatter: (...args: any[]) => any;
  }
) {
  return (
    <StyledListItem
      onClick={onSelectGroup}
      selected={active}
      className={className}
    >
      <GlipGroupAvatar
        persons={group.detailMembers}
        groupType={group.type}
      />
      <RcListItemText
        primary={getGlipGroupName({ group })}
        secondary={
          <LatestPost latestPost={group.latestPost} members={group.detailMembers} />
        }
      />
      <StyledSecondaryAction>
        {
          group.unread > 0 ? (
            <UnreadBadge
              label={group.unread}
            />
          ) : null
        }
        <span>{group.latestPost ? dateTimeFormatter(group.latestPost.creationTime) : null}</span>
      </StyledSecondaryAction>
    </StyledListItem>
  );
}

