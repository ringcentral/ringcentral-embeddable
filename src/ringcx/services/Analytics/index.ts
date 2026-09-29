/**
 * The host binds its analytics implementation under the `micro-auth` token
 * (`{ provide: Analytics, useClass: EmbeddableAnalytics }`), so RingCX must
 * inject that token. Injecting the subclass makes the container auto-bind a
 * second instance under the same `Analytics` module name.
 */
export { Analytics } from '@ringcentral-integration/micro-auth/src/app/services';
