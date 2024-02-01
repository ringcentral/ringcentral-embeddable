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

type CallIconProps = {
  direction: string;
  missed?: boolean;
//   active?: boolean;
//   ringing?: boolean;
  inboundTitle?: string;
  outboundTitle?: string;
  missedTitle?: string;
  type?: string;
};
export const CallIcon: FunctionComponent<CallIconProps> = ({
  direction,
  missed = false,
//   active = false,
//   ringing = false,
  inboundTitle = '',
  outboundTitle = '',
  missedTitle = '',
  type = '',
}) => {
  let icon;
  let title = '';
  let color = 'neutral.f05';
  if (type === messageTypes.fax) {
    icon = direction === messageDirection.inbound ? InboundFaxBorder : OutboundFaxBorder;
  } else {
    if (missed) {
      title = missedTitle;
      icon = MissedcallBorder;
      color = 'danger.b04';
    } else if (direction === callDirections.inbound) {
      title = inboundTitle;
      icon = IncallBorder;
    } else {
      title = outboundTitle;
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
