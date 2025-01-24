import React from 'react';
import { styled, ellipsis } from '@ringcentral/juno';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import {
  messageIsFax,
  messageIsTextMessage,
} from '@ringcentral-integration/commons/lib/messageHelper';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { format } from '@ringcentral-integration/utils';
import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';

const SubjectOverview = styled.span`
  ${ellipsis()}
  flex: 1;
`;

export function Detail({ conversation, currentLocale }) {
  if (messageIsTextMessage(conversation)) {
    if (
      conversation.mmsAttachments &&
      conversation.mmsAttachments.length > 0
    ) {
      const imageCount = conversation.mmsAttachments.filter(
        (m) => m.contentType.indexOf('image') > -1,
      ).length;
      if (imageCount > 0) {
        return format(i18n.getString('imageAttachment', currentLocale), {
          count: imageCount,
        });
      }
      return format(i18n.getString('fileAttachment', currentLocale), {
        count: conversation.mmsAttachments.length,
      });
    }
    return (
      <SubjectOverview>{conversation.subject}</SubjectOverview>
    );
  }
  if (conversation.voicemailAttachment) {
    const { duration } = conversation.voicemailAttachment;
    return `${i18n.getString(
      'voiceMessage',
      currentLocale,
    )} (${formatDuration(duration)})`;
  }
  if (messageIsFax(conversation)) {
    const pageCount = +conversation.faxPageCount;
    const nameKey = pageCount === 1 ? 'page' : 'pages';
    if (conversation.direction === messageDirection.inbound) {
      return `${i18n.getString(
        'faxReceived',
        currentLocale,
      )}(${pageCount} ${i18n.getString(nameKey, currentLocale)})`;
    }
    return `${i18n.getString(
      'faxSent',
      currentLocale,
    )}(${pageCount} ${i18n.getString(nameKey, currentLocale)})`;
  }
  return '';
}
