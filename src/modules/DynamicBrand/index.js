import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  processAssets,
} from '@ringcentral-integration/commons/modules/Brand/helpers';
import {
  action,
  globalStorage,
  RcModuleV2,
  state,
  watch,
} from '@ringcentral-integration/core';

import {
  getBrandThemeWithJupiterBlue,
  getBrandVariable,
  getBrandDarkTheme,
} from '../../lib/themes';

window.brandConfigs = process.env.BRAND_CONFIGS;

@Module({
  name: 'DynamicBrand',
  deps: [
    'Brand',
    'AccountInfo',
    'GlobalStorage',
    'Auth',
    {
      dep: 'DynamicBrandOptions',
      optional: true,
    },
  ],
})
export class DynamicBrand extends RcModuleV2 {
  constructor(deps) {
    super({
      deps,
      storageKey: 'brandConfigLoader',
      enableGlobalCache: true,
    });
    this._ignoreModuleReadiness(deps.accountInfo);
    this._ignoreModuleReadiness(deps.auth);
    this._deps.auth.addBeforeLogoutHandler(() => {
      this._setCachedAccountBrandId(null);
    });
  }

  @globalStorage
  @state
  _cache = {};

  @globalStorage
  @state
  cachedAccountBrandId = null;

  @action
  _setCacheConfig(config) {
    this._cache[config.id] = config;
  }

  @action
  _setCachedAccountBrandId(id) {
    this.cachedAccountBrandId = id;
  }

  get enabled() {
    return !!(this._deps.dynamicBrandOptions && this._deps.dynamicBrandOptions.enableIDB);
  }

  get baseUrl() {
    return this._deps.dynamicBrandOptions && this._deps.dynamicBrandOptions.baseUrl;
  }

  /**
   * target url that host brand resource
   */
  get brandUrl() {
    return this.baseUrl;
  }

  get _currentBrandId() {
    if (
      this._deps.dynamicBrandOptions?.enableIDB &&
      this._accountBrandId
    ) {
      return this._accountBrandId;
    }
    if (this.cachedAccountBrandId) {
      return this.cachedAccountBrandId;
    }
    return this._deps.brand.defaultConfig.id;
  }

  get _accountBrandId() {
    return this._deps.accountInfo.info?.serviceInfo?.brand?.id;
  }

  onInitOnce() {
    if (this.enabled) {
      this._setConfig();
      watch(
        this,
        () => this._deps.accountInfo.info?.serviceInfo?.brand?.id,
        () => {
          this._setConfig();
        },
      );
    }
  }

  _setConfig() {
    const brandId = this._currentBrandId;
    const configs = process.env.BRAND_CONFIGS;
    let brandConfig;
    Object.keys(configs).forEach((brandCode) => {
      if (!configs[brandCode]) {
        return;
      }
      if (
        configs[brandCode].id === brandId
      ) {
        brandConfig = configs[brandCode];
        return;
      }
      if (!configs[brandCode].subBrands) {
        return;
      }
      if (configs[brandCode].subBrands.some((subBrand) => subBrand.id === brandId)) {
        brandConfig = configs[brandCode];
        return;
      }
    });
    if (!brandConfig) {
      brandConfig = this._deps.brand.defaultConfig;
    }
    brandConfig.theme = {
      defaultTheme: 'light',
      themeMap: {
        light: getBrandThemeWithJupiterBlue(brandConfig.code),
        dark: getBrandDarkTheme(brandConfig.code),
      },
      variable: getBrandVariable(brandConfig.code),
    };
    if (brandConfig.assets) {
      brandConfig.assets = processAssets(
        brandConfig.assets,
        this.brandUrl || window.location.origin,
      );
    }
    this._setCacheConfig(brandConfig);
    if (this._accountBrandId) {
      this._setCachedAccountBrandId(this._accountBrandId);
    }
    this._deps.brand.setDynamicConfig(brandConfig);
  }
}
