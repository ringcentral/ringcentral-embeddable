import type { MessageThreadOptions } from '@ringcentral-integration/micro-message/src/app/services';

import type { EmbeddableFeatureConfiguration } from './AppFeatures.interface';

/**
 * Message thread options that enable the Shared tab from the `SharedMessages`
 * feature flag, which the `enableSharedMessages` URL parameter sets.
 *
 * `enable` is read on use, so it follows the flag after startup too.
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
