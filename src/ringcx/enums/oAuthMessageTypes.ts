export const oAuthMessageTypes = {
  loginPopup: 'loginPopup',
  oAuthCallback: 'oAuthCallback',
} as const;

export type OAuthMessageType = typeof oAuthMessageTypes[keyof typeof oAuthMessageTypes];
