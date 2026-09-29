/**
 * Call direction constants
 */
export const callDirection = {
  inbound: 'Inbound',
  outbound: 'Outbound',
} as const;

export type CallDirection = (typeof callDirection)[keyof typeof callDirection];
