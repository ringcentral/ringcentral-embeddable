import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';
import type { BaseAppConfig } from '@ringcentral-integration/next-integration/interfaces';

import rc from './rc';

export interface AppConfig extends BaseAppConfig {
  brandConfig: BrandConfig;
}

export const appConfig = rc;

export { BrandConfig };
