import type { SDKConfig } from '@ringcentral-integration/commons/lib/createSdkConfig';

import type { EmbeddableAuthOptions } from './Auth.interface';
import type { EmbeddableOAuthOptions } from './Authentication.interface';

type AuthenticationConfig = {
  sdkOptions: Partial<SDKConfig>;
  authOptions: EmbeddableAuthOptions;
  oAuthOptions: EmbeddableOAuthOptions;
};

/**
 * Maps public Embeddable authentication inputs to SDK and service options.
 */
export function getAuthenticationConfig({
  prefix,
  sdkConfig,
  authorizationCode,
  authorizationCodeVerifier,
  authProxy,
  disableLoginPopup,
  externalAuthId,
  jwt,
  proxyUri,
  redirectUri,
}: {
  prefix?: string;
  sdkConfig: SDKConfig;
  authorizationCode?: string;
  authorizationCodeVerifier?: string;
  authProxy: boolean;
  disableLoginPopup: boolean;
  externalAuthId?: string;
  jwt?: string;
  proxyUri?: string;
  redirectUri?: string;
}): AuthenticationConfig {
  const resolvedRedirectUri = redirectUri ?? './redirect.html';
  return {
    sdkOptions: {
      cachePrefix: authProxy ? `sdk-auth-proxy-${prefix}` : `sdk-${prefix}`,
      redirectUri: resolvedRedirectUri,
      ...(authProxy && {
        authProxy: true,
        authorizeEndpoint: '/authorize',
        revokeEndpoint: '/logout',
      }),
    },
    authOptions: {
      usePKCE:
        !authProxy && Boolean(sdkConfig.clientId) && !sdkConfig.clientSecret,
      authProxy,
    },
    oAuthOptions: {
      redirectUri: resolvedRedirectUri,
      prefix,
      uiOptions: ['hide_remember_me', 'hide_tos'],
      authProxy,
      authorizationCode,
      authorizationCodeVerifier,
      disableLoginPopup,
      externalAuthId,
      jwt,
      proxyUri,
    },
  };
}
