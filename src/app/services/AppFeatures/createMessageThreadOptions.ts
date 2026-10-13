import type { MessageThreadOptions } from '@ringcentral-integration/micro-message/src/app/services';

import type { EmbeddableFeatureConfiguration } from './AppFeatures.interface';

/**
 * Message thread options that enable the Shared tab from the `SharedMessages`
 * feature flag.
 *
 * `enable` is read on use, so `rc-adapter-update-features-flags` can switch
 * the tab as well as the `enableSharedMessages` URL parameter.
 */
export function createMessageThreadOptions(appFeatures: {
  readonly config: EmbeddableFeatureConfiguration;
}): MessageThreadOptions {
  return {
    get enable(): boolean {
      return Boolean(appFeatures.config.SharedMessages);
    },
  };
}
