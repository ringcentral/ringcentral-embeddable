import type {
  TeamMessagingMember,
  TeamMessagingPost,
} from '../../services/TeamMessaging';
import {
  getNoteAttachments,
  getPersonName,
  getPostTask,
  getTaskActivity,
} from '../../services/TeamMessaging';
import { t } from './i18n';

const PICTURE_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'svg', 'png', 'webp'];

const EMOJI_SHORTCODE_PATTERN = /:([a-zA-Z0-9_+-]+):/g;

/** "@Team" as a mention token: a Team mention with the id -1. */
export const AT_TEAM_TOKEN = '![:Team](-1)';

/** The RingCentral app writes "@Team" as an HTML anchor. */
const AT_TEAM_PATTERN =
  /<a\s+class='at_mention_compose'\s+rel='{"id":-1}'>([^<]+)<\/a>/g;

/** Resolves an emoji shortcode, such as `smile`, to its native emoji. */
export type EmojiLookup = (shortcode: string) => string | undefined;

/** Whether an attachment is a picture, from its URI or its name. */
export function isPicture(uri?: string, name?: string): boolean {
  return PICTURE_EXTENSIONS.some(
    (extension) =>
      !!uri?.toLowerCase().includes(`.${extension}?`) ||
      !!name?.toLowerCase().endsWith(`.${extension}`),
  );
}

/** Replace `:shortcode:` with the native emoji when it is known. */
export function replaceEmojiText(text: string, lookup?: EmojiLookup): string {
  if (!lookup) {
    return text;
  }
  return text.replace(
    EMOJI_SHORTCODE_PATTERN,
    (match, shortcode: string) => lookup(shortcode) ?? match,
  );
}

/**
 * Replace the "@Team" anchor with a mention token, or with its plain text for
 * a preview.
 */
export function replaceAtTeamText(text: string, preview = false): string {
  return text.replace(AT_TEAM_PATTERN, (_match, mentionText: string) =>
    preview ? mentionText : `![:All](${mentionText})`,
  );
}

/** The first line of a post, with mention tokens shown as "@name". */
function getFirstLineWithMentions(post: TeamMessagingPost): string {
  let firstLine = (post.text ?? '')
    .split('\n')[0]
    .split(AT_TEAM_TOKEN)
    .join(`@${t('atTeam')}`);
  (post.mentions ?? []).forEach((mention) => {
    firstLine = firstLine
      .split(`![:${mention.type}](${mention.id})`)
      .join(`@${mention.name}`);
  });
  return firstLine;
}

function getAddedPersonsText(
  post: TeamMessagingPost,
  members: readonly TeamMessagingMember[],
): string {
  return (post.addedPersonIds ?? [])
    .map((id) => {
      const member = members.find((item) => item.id === id);
      return `@${getPersonName(member) || id}`;
    })
    .join(' ');
}

/**
 * A one-line summary of a post for the chat list, as in the legacy app.
 */
export function getPostAbstract({
  post,
  members,
  emojiLookup,
}: {
  post: TeamMessagingPost;
  members: readonly TeamMessagingMember[];
  emojiLookup?: EmojiLookup;
}): string {
  if (post.type === 'PersonJoined') {
    return t('joinedTheTeam');
  }
  if (post.type === 'PersonsAdded') {
    return t('addedToTheTeam', {
      persons: getAddedPersonsText(post, members),
    });
  }
  const activity = getTaskActivity(post);
  if (activity) {
    const subject = activity.subject ?? '';
    if (activity.status === 'Completed') {
      return t('completedTaskPreview', { subject });
    }
    return activity.status === 'Pending'
      ? t('reopenedTaskPreview', { subject })
      : t('updatedTaskPreview', { subject });
  }
  const task = getPostTask(post);
  if (task) {
    return t('taskPreview', { subject: task.subject ?? '' });
  }
  const note = getNoteAttachments([post])[0];
  if (note) {
    return t('notePreview', { title: note.title ?? '' });
  }
  const attachment = post.attachments?.[0];
  if (attachment && !post.text) {
    return isPicture(attachment.contentUri, attachment.name)
      ? t('sharedAPicture')
      : t('sharedAFile');
  }
  const firstLine = getFirstLineWithMentions({
    ...post,
    text: replaceEmojiText(
      replaceAtTeamText(post.text ?? '', true),
      emojiLookup,
    ),
  });
  return firstLine || t('unsupportedMessage');
}
