const picExtensions = ['jpg', 'jpeg', 'gif', 'svg', 'png'];

export default function isPicture(uri) {
  if (!uri) {
    return false;
  }
  let isPic = false;
  picExtensions.forEach((ext) => {
    if (uri.indexOf(`.${ext}?`) > 0) {
      isPic = true;
    }
  });
  return isPic;
}

export function formatFistLineWithMentions(text, mentions) {
  if (text === undefined || text === null) {
    return null;
  }
  let firstLine = text.split('\n')[0];
  if (mentions && mentions.length > 0) {
    mentions.forEach((mention) => {
      firstLine = firstLine.replace(
        `![:${mention.type}](${mention.id})`,
        `@${mention.name}`,
      );
    });
  }
  return firstLine;
}

export function getPostAbstract(post, members) {
  if (!post) {
    return null;
  }
  let formattedText;
  if (post.attachments && post.attachments.length > 0) {
    const attachment = post.attachments[0];
    if (isPicture(attachment.contentUri)) {
      formattedText = 'shared a picture';
    } else {
      formattedText = 'shared a file';
    }
  }
  if (post.type === 'PersonJoined') {
    formattedText = 'joined the team';
  }
  if (post.type === 'PersonsAdded') {
    const addedPersons = post.addedPersonIds.map((id) => {
      const member = members.find((m) => m.id === id);
      let name = id;
      if (member) {
        name = `${member.firstName}${
          member.lastName ? ` ${member.lastName}` : ''
        }`;
      }
      return `@${name}`;
    });
    formattedText = `added ${addedPersons.join(' ')} to the team`;
  }
  if (!formattedText) {
    formattedText = formatFistLineWithMentions(post.text, post.mentions);
  }
  return formattedText;
}
