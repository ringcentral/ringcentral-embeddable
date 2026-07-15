import type { AuthOptions } from '@ringcentral-integration/micro-auth/src/app/services';

/**
 * Authentication options used by the Embeddable Auth replacement.
 */
export interface EmbeddableAuthOptions extends AuthOptions {
  authProxy?: boolean;
}
