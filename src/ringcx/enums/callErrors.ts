/**
 * Call error constants
 */
export const callErrors = {
  noToNumber: 'callErrors-noToNumber',
  noAreaCode: 'callErrors-noAreaCode',
  connectFailed: 'callErrors-connectFailed',
  internalError: 'callErrors-internalError',
  notAnExtension: 'callErrors-notAnExtension',
  networkError: 'callErrors-networkError',
  noRingoutEnable: 'callErrors-noRingoutEnable',
  noInternational: 'callErrors-noInternational',
  emergencyNumber: 'callErrors-emergencyNumber',
  numberParseError: 'callErrors-numberParseError',
  fromAndToNumberIsSame: 'callErrors-fromAndToNumberIsSame',
} as const;

export type CallErrors = (typeof callErrors)[keyof typeof callErrors];
