export type CxAgentStateColor = 'green' | 'red' | 'grey' | 'blue' | 'yellow';

export const agentStatesColors: Record<string, CxAgentStateColor> = {
  // green
  AVAILABLE: 'green',
  // red
  'AUX-UNAVAIL-OFFHOOK': 'red',
  'AUX-UNAVAIL-NO-OFFHOOK': 'red',
  OFFLINE: 'red',
  // grey
  'ON-BREAK': 'grey',
  AWAY: 'grey',
  LUNCH: 'grey',
  // blue
  ENGAGED: 'blue',
  // yellow
  WORKING: 'yellow',
  TRAINING: 'yellow',
  TRANSITION: 'yellow',
  // TODO: should check with color
  'RNA-STATE': 'yellow',
};
