import type { BrandConfig } from '@ringcentral-integration/micro-core/src/app/services';

export interface DynamicBrandOptions {
  /**
   * All brand configs bundled into the app, keyed by brand code.
   */
  brandConfigs?: Record<string, BrandConfig>;
}
