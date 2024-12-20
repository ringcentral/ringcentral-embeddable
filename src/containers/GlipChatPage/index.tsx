import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';

import { GlipChatPanel } from '../../components/GlipChatPanel';

function getAtRender({
  glipGroups,
  glipPersons,
  onViewPersonProfile,
  onViewGroup,
}) {
  const AtRender = ({ id, type }) => {
    let name = id;
    if (type === 'Team') {
      const group = glipGroups.allGroups.find((g) => g.id === id);
      name = group && group.name;
    } if (type === 'All') {
      name = 'Team';
    } else {
      const person = glipPersons.personsMap[id];
      name =
        (person &&
          `${person.firstName}${
            person.lastName ? ` ${person.lastName}` : ''
          }`) ||
        id;
    }
    const onClickAtLink = (e) => {
      e.preventDefault();
      if (type === 'Person') {
        onViewPersonProfile(id);
      } else if (type === 'Team') {
        onViewGroup(id);
      }
    };
    return (
      <a href={`#${id}`} onClick={onClickAtLink}>
        @{name}
      </a>
    );
  };
  AtRender.propTypes = {
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  };
  return AtRender;
}

function mapToProps(_, { params, phone: { glipGroups, glipPosts } }) {
  return {
    groupId: params.groupId,
    group: glipGroups.currentGroup,
    posts: glipGroups.currentGroupPosts,
    textValue:
      glipPosts.postInputs[params.groupId] &&
      glipPosts.postInputs[params.groupId].text,
  };
}

function mapToFunctions(
  _,
  {
    phone: { glipGroups, glipPosts, glipPersons, dateTimeFormat },
    dateTimeFormatter = (time) =>
      dateTimeFormat.formatDateTime({ utcTimestamp: time }),
    onViewPersonProfile,
    onViewGroup,
    mobile = true,
  },
) {
  return {
    mobile,
    loadGroup(groupId) {
      glipGroups.updateCurrentGroupId(groupId);
    },
    async loadNextPage() {
      await glipPosts.loadNextPage(glipGroups.currentGroupId);
    },
    async createPost() {
      await glipPosts.create({
        groupId: glipGroups.currentGroupId,
      });
    },
    updateText(text, mentions) {
      const oldInput = glipPosts.postInputs[glipGroups.currentGroupId];
      const oldMentions = oldInput && oldInput.mentions || [];
      let newMentions;
      if (mentions) {
        const members = glipGroups.currentGroup.detailMembers;
        newMentions = mentions.map((mention) => {
          const member = members.find((m) => m.email === mention.id);
          return {
            mention: mention.mention,
            matcherId: member && member.id,
          };
        });
      }
      return glipPosts.updatePostInput({
        text,
        groupId: glipGroups.currentGroupId,
        mentions: newMentions || oldMentions,
      });
    },
    uploadFile: (fileName, rawFile) =>
      glipPosts.sendFile({
        fileName,
        rawFile,
        groupId: glipGroups.currentGroupId,
      }),
    atRender: getAtRender({
      glipGroups,
      glipPersons,
      onViewPersonProfile,
      onViewGroup,
    }),
    viewProfile(personId) {
      if (personId) {
        onViewPersonProfile(personId);
      }
    },
    dateTimeFormatter,
  };
}

const GlipChatPage = withPhone(
  connect(mapToProps, mapToFunctions)(GlipChatPanel),
);

export default GlipChatPage;
