import type { OAuthOptions } from '@ringcentral-integration/micro-auth/src/app/services';

/**
 * Legacy Embeddable authentication inputs consumed by the next OAuth service.
 */
export interface EmbeddableOAuthOptions extends OAuthOptions {
  authProxy?: boolean;
  authorizationCode?: string;
  authorizationCodeVerifier?: string;
  disableLoginPopup?: boolean;
  externalAuthId?: string;
  jwt?: string;
  proxyUri?: string;
}
