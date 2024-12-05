import emojiData from '@emoji-mart/data';
import { init } from 'emoji-mart'
import { SearchIndex } from 'emoji-mart';

const picExtensions = ['jpg', 'jpeg', 'gif', 'svg', 'png'];

export default function isPicture(uri, name = null) {
  if (!uri) {
    return false;
  }
  let isPic = false;
  picExtensions.forEach((ext) => {
    if (uri.indexOf(`.${ext}?`) > -1) {
      isPic = true;
    }
    if (!isPic && name) {
      if (name.indexOf(`.${ext}`) > -1) {
        isPic = true;
      }
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
    formattedText = formatFistLineWithMentions(
      replaceEmojiText(replaceAtTeamText(post.text, true)),
      post.mentions
    );
  }
  return formattedText;
}

init({ data: emojiData });
const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
export const replaceEmojiText = (text) => {
  if (typeof text !== 'string') {
    return text;
  }

  return text.split(emojiRegex).map((part, index) => {
    const emojiCode = SearchIndex.get(part);
    if (emojiCode && emojiCode.skins) {
      return emojiCode.skins[0].native;
    }
    return part;
  }).join('');
};

const atTeamRegex = /<a\s+class='at_mention_compose'\s+rel='{"id":-1}'>[^<]+<\/a>/;

export const replaceAtTeamText = (text, preview = false) => {
  if (typeof text !== 'string') {
    return text;
  }
  const matched = text.match(atTeamRegex);
  if (!matched) {
    return text;
  }
  let mentionText = matched[0].split('>')[1];
  if (!mentionText) {
    return text;
  }
  mentionText = mentionText.split('<')[0];
  if (preview) {
    return text.replace(matched[0], mentionText);
  }
  return text.replace(matched[0], `![:All](${mentionText})`);
};
