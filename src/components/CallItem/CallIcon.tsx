import React, { FunctionComponent } from 'react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { messageDirection } from '@ringcentral-integration/commons/enums/messageDirection';
import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';
import { RcThumbnail } from '@ringcentral/juno';
import {
  IncallBorder,
  OutcallBorder,
  MissedcallBorder,
  InboundFaxBorder,
  OutboundFaxBorder
} from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/CallItem/i18n';

type CallIconProps = {
  direction: string;
  missed?: boolean;
//   active?: boolean;
//   ringing?: boolean;
  inboundTitle?: string;
  outboundTitle?: string;
  missedTitle?: string;
  type?: string;
  currentLocale: string;
};
export const CallIcon: FunctionComponent<CallIconProps> = ({
  direction,
  missed = false,
//   active = false,
//   ringing = false,
  
  type = '',
  currentLocale,
}) => {
  let icon;
  let title = '';
  let color = 'neutral.f05';
  if (type === messageTypes.fax) {
    icon = direction === messageDirection.inbound ? InboundFaxBorder : OutboundFaxBorder;
  } else {
    if (missed) {
      title = i18n.getString('missedCall', currentLocale);
      icon = MissedcallBorder;
      color = 'danger.b04';
    } else if (direction === callDirections.inbound) {
      title = i18n.getString('inboundCall', currentLocale);
      icon = IncallBorder;
    } else {
      title = i18n.getString('outboundCall', currentLocale);
      icon = OutcallBorder;
    }
  }
  // TODO: ringing status
  return (
    <RcThumbnail
      symbol={icon}
      color={color}
      title={title}
    />
  );
};
