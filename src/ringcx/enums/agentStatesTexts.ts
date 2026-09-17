export const defaultAgentStateTexts = {
  WORKING: 'Working',
  AVAILABLE: 'Available',
  AWAY: 'Away',
  'ON-BREAK': 'On Break',
  LUNCH: 'Lunch',
  'AUX-UNAVAIL-OFFHOOK': 'Allow Offhook',
  'AUX-UNAVAIL-NO-OFFHOOK': 'Disconnect Offhook',
  TRAINING: 'Training',
} as const;

export type DefaultAgentStateTexts = keyof typeof defaultAgentStateTexts;
