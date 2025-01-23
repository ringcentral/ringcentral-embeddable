import React from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

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
  return AtRender;
}

@Module({
  name: 'GlipChatUI',
  deps: [
    'RouterInteraction',
    'GlipPersons',
    'GlipGroups',
    'GlipPosts',
    'DateTimeFormat',
    'SideDrawerUI',
  ],
})
export class GlipChatUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps({
    params,
  }) {
    const {
      glipGroups,
      glipPosts,
    } = this._deps;
    return {
      groupId: params.groupId,
      group: glipGroups.currentGroup,
      posts: glipGroups.currentGroupPosts,
      textValue:
        glipPosts.postInputs[params.groupId] &&
        glipPosts.postInputs[params.groupId].text,
    };
  }

  getUIFunctions({
    params,
    glipRoute = '/glip',
    onBack,
    dateTimeFormatter,
    mobile = true,
  }) {
    const {
      routerInteraction,
      glipGroups,
      glipPersons,
      glipPosts,
      dateTimeFormat,
      sideDrawerUI,
    } = this._deps;
    const viewProfile = async (personId) => {
      if (!personId) {
        return;
      }
      if (personId === glipPersons.me.id) {
        return;
      }
      let group = glipGroups.groups.slice(0, 10).find((g) => {
        if (g.type !== 'PrivateChat') {
          return false;
        }
        return g.members.indexOf(personId) > -1;
      });
      if (!group) {
        group = await glipGroups.startChat(personId);
      }
      if (group && group.id !== params.groupId) {
        sideDrawerUI.gotoGlipChat(group.id);
      }
    };
    return {
      mobile,
      onBack: onBack ? onBack : () => {
        routerInteraction.push(glipRoute);
      },
      viewProfile,
      dateTimeFormatter: dateTimeFormatter ? dateTimeFormatter : (time) => {
        return dateTimeFormat.formatDateTime({ utcTimestamp: time });
      },
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
        onViewPersonProfile: viewProfile,
        onViewGroup: (id) => {
          if (id !== params.groupId) {
            sideDrawerUI.gotoGlipChat(id);
          }
        },
      }),
    };
  }
}