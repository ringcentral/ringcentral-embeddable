import type { BrandConfig } from '@ringcentral-integration/commons/modules/Brand';

import { brandConfig as atos } from './atos/brandConfig';
import { brandConfig as att } from './att/brandConfig';
import { brandConfig as avaya } from './avaya/brandConfig';
import { brandConfig as bt } from './bt/brandConfig';
import { brandConfig as rainbow } from './rainbow/brandConfig';
import { brandConfig as rc } from './rc/brandConfig';
import { brandConfig as telus } from './telus/brandConfig';

/**
 * All brands bundled into the app, keyed by brand code.
 * The app picks one at runtime from the `brand` URL parameter.
 */
export const brandConfigs: Record<string, BrandConfig> = {
  rc,
  att,
  bt,
  telus,
  atos,
  avaya,
  rainbow,
};
