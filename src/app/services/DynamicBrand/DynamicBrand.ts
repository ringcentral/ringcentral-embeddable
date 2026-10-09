import { AccountInfo } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  type BrandConfig,
  type BrandConfigOptions,
  processAssets,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  inject,
  injectable,
  optional,
  RcModule,
  watch,
} from '@ringcentral-integration/next-core';

import type { DynamicBrandOptions } from './DynamicBrand.interface';

/**
 * Switches the brand config to the logged-in account's brand, so the UI,
 * Spring theme and adapter logo follow the account instead of the URL brand.
 */
@injectable({
  name: 'DynamicBrand',
})
export class DynamicBrand extends RcModule {
  constructor(
    private readonly _brand: Brand,
    private readonly _accountInfo: AccountInfo,
    @inject('DynamicBrandOptions')
    private readonly _options: DynamicBrandOptions,
    @optional('BrandConfigOptions')
    private readonly _brandConfigOptions?: BrandConfigOptions,
  ) {
    super();
  }

  override onInitOnce(): void {
    this._applyAccountBrand();
    watch(
      this,
      () => this._accountInfo.brandId,
      () => this._applyAccountBrand(),
    );
  }

  override onReset(): void {
    this._clearDynamicConfig();
  }

  private _applyAccountBrand(): void {
    const brandConfig = this._findBrandConfig(this._accountInfo.brandId);
    if (!brandConfig || brandConfig.code === this._brand.defaultConfig.code) {
      this._clearDynamicConfig();
      return;
    }
    this._brand.setDynamicConfig({
      ...brandConfig,
      assets: brandConfig.assets
        ? processAssets(
            brandConfig.assets,
            this._brandConfigOptions?.assetOrigin || globalThis.location.origin,
          )
        : brandConfig.assets,
    });
  }

  /**
   * Match the account brand id against each brand and its sub brands.
   */
  private _findBrandConfig(brandId?: string): BrandConfig | undefined {
    if (!brandId) {
      return undefined;
    }
    return Object.values(this._options.brandConfigs ?? {}).find(
      (config) =>
        config.id === brandId ||
        config.subBrands?.some((subBrand) => subBrand.id === brandId),
    );
  }

  private _clearDynamicConfig(): void {
    // Brand falls back to the URL/default brand config when this is null.
    this._brand.setDynamicConfig(null as unknown as BrandConfig);
  }
}
