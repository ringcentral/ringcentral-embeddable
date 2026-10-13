import { messageTypes } from '../../../enums';
import { callErrors } from '../../../enums/callErrors';

export default {
  // Call alert messages
  [messageTypes.NO_SUPPORT_COUNTRY]:
    'Outbound calls for the country are not yet supported.',
  [messageTypes.FAILED_TO_CALL]:
    'The line is busy or has a pending disposition.',
  [messageTypes.PREVIEW_DIAL_NO_ANSWER]:
    "The lead couldn't be dialed. Try again.",
  [messageTypes.INTERCEPT]:
    'The dial result for your manual outbound call was INTERCEPT.',
  [messageTypes.COPY_UII_SUCCESS]: 'Call ID copied',
  [callErrors.noToNumber]: 'Please enter a valid phone number.',
  [callErrors.emergencyNumber]: 'Emergency calling is not available.',
} as const;
