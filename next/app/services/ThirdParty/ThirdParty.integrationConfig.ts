import type { IntegrationConfigOptions } from '@ringcentral-integration/micro-setting/src/app/services';

import type { ThirdParty } from './ThirdParty';

const DEFAULT_INTEGRATION_KEY = 'thirdParty';

/** Creates integration configuration backed by the registered service state. */
export function createThirdPartyIntegrationConfig(
  thirdParty: Pick<ThirdParty, 'displayName' | 'sourceName'>
): IntegrationConfigOptions {
  return {
    get key(): string {
      return thirdParty.sourceName ?? DEFAULT_INTEGRATION_KEY;
    },
    get name(): string | undefined {
      return thirdParty.displayName ?? thirdParty.sourceName ?? undefined;
    },
    onViewEntity: (entity) => {
      console.log('🐞 ~ onViewEntity entity:', entity);
    },
    onCreateEntity: (entity) => {
      console.log('🐞 ~ onCreateEntity entity:', entity);
    },
  };
}
