type Group = {
  id?: string;
  name?: string;
  type?: string;
  members?: any[];
  detailMembers?: any[];
  latestPost?: any;
  unread?: number;
};

export function getGlipGroupName({ group, showNumber }: {
  group: Group;
  showNumber?: boolean;
}) {
  let name = group.name;
  if (!name && group.detailMembers) {
    let noMes = group.detailMembers.filter((m) => !m.isMe);
    if (noMes.length === 0) {
      noMes = group.detailMembers;
    }
    const names = noMes.map(
      (p) =>
        `${p.firstName ? p.firstName : ''} ${p.lastName ? p.lastName : ''}`,
    );
    name = names.join(', ');
  }
  let number = '';
  if (showNumber && group.members && group.members.length > 2) {
    number = ` (${group.members.length})`;
  }
  return `${name}${number}`;
}
