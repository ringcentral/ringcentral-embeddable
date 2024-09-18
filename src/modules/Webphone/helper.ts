import {
  normalizeSession as normalizeSessionBase
} from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';

function getCallQueueName({ direction, headers }) {
  if (
    direction === callDirections.outbound ||
    !headers ||
    !headers['P-Rc-Api-Call-Info'] ||
    !headers['P-Rc-Api-Call-Info'][0] ||
    !headers['P-Rc-Api-Call-Info'][0].raw ||
    !headers['P-Asserted-Identity'] ||
    !headers['P-Asserted-Identity'][0] ||
    !headers['P-Asserted-Identity'][0].raw
  ) {
    return null;
  }
  if (headers['P-Rc-Api-Call-Info'][0].raw.indexOf('queue-call') === -1) {
    return null;
  }
  const callInfo = headers['P-Rc-Api-Call-Info'][0].raw.split(';');
  let queueName = callInfo.find((info) => info.indexOf('queueName=') > -1);
  if (!queueName) {
    return null;
  }
  queueName = queueName.split('=')[1];
  return `${queueName} - `
}

export function normalizeSession(session) {
  return {
    ...normalizeSessionBase(session),
    callQueueName: getCallQueueName({
      direction: session.__rc_direction,
      headers: session.request && session.request.headers,
    }),
  }
}
