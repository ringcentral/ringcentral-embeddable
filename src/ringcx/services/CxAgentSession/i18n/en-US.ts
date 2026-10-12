import { dropDownOptions, loginTypes, messageTypes } from '../../../enums';

export default {
  [loginTypes.RC_PHONE]: 'RingCentral Office phone',
  [loginTypes.external]: 'Use external phone',
  [loginTypes.integrated]: 'Integrated softphone',
  [dropDownOptions.None]: 'None',
  [messageTypes.NOT_INBOUND_QUEUE_SELECTED]: 'Please select at least one inbound queue.',
  [messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED]: 'Please select at least one inbound queue or a dial group.',
  [messageTypes.EMPTY_PHONE_NUMBER]: 'Phone number is required.',
  [messageTypes.INVALID_PHONE_NUMBER]: 'Invalid phone number.',
  [messageTypes.AGENT_CONFIG_ERROR]: 'Agent configuration failed.',
  [messageTypes.UPDATE_AGENT_ERROR]: 'Failed to update agent settings.',
  [messageTypes.UPDATE_AGENT_SUCCESS]: 'Agent settings updated successfully.',
  [messageTypes.EXISTING_LOGIN_ENGAGED]: 'Login is currently in use. Please try again later.',
  dialGroupUpdated: 'Your dial group has been updated to dial group: {dialGroupName}',
} as const;
