import React from 'react';

import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import { RcThumbnail } from '@ringcentral/juno';
import { 
  SmsBorder as ComposeTextIcon,
  InboundFaxBorder as FaxInboundIcon,
  OutboundFaxBorder as FaxOutboundIcon,
  BubbleLinesBorder as GroupConversationIcon,
  VoicemailBorder as VoicemailIcon,
} from '@ringcentral/juno-icon';

import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';

type ConversationIconProps = {
  group?: boolean;
  type?: string;
  currentLocale?: string;
  direction?: string;
  color?: string;
};

export const ConversationIcon: React.FC<ConversationIconProps> = ({
  group,
  type,
  currentLocale,
  direction,
  color,
}) => {
  let title;
  let icon;
  switch (type) {
    case messageTypes.voiceMail:
      title = i18n.getString(messageTypes.voiceMail, currentLocale);
      icon = VoicemailIcon;
      break;
    case messageTypes.fax:
      title = i18n.getString(messageTypes.fax, currentLocale);
      icon =
        direction === messageDirection.inbound ? FaxInboundIcon : FaxOutboundIcon;
      break;
    default:
      title = group
        ? i18n.getString('groupConversation', currentLocale)
        : i18n.getString('conversation', currentLocale);
      icon = group ? GroupConversationIcon : ComposeTextIcon;
  }
  return (
    <RcThumbnail
      symbol={icon}
      color={color}
      title={title}
    />
  );
};
ConversationIcon.defaultProps = {
  group: false,
  type: undefined,
  currentLocale: undefined,
  direction: undefined,
};
