import { Module } from '@ringcentral-integration/commons/lib/di';

import {
  action,
  globalStorage,
  RcModuleV2,
  state,
  watch,
} from '@ringcentral-integration/core';

import { getBrandTheme, getBrandVariable } from '../../lib/themes';

@Module({
  name: 'DynamicBrand',
  deps: [
    'Brand',
    'AccountInfo',
    'GlobalStorage',
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
  }

  @globalStorage
  @state
  _cache = {};

  @action
  _setCacheConfig(config) {
    this._cache[config.id] = config;
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
      this._deps.dynamicBrandOptions &&
      this._deps.dynamicBrandOptions.enableIDB &&
      this._deps.accountInfo.info &&
      this._deps.accountInfo.info.serviceInfo &&
      this._deps.accountInfo.info.serviceInfo.brand && 
      this._deps.accountInfo.info.serviceInfo.brand.id
    ) {
      return this._deps.accountInfo.info.serviceInfo.brand.id;
    }
    return this._deps.brand.defaultConfig.id;
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
      if (configs[brandCode] && configs[brandCode].id === brandId) {
        brandConfig = configs[brandCode];
      }
    });
    if (!brandConfig) {
      brandConfig = this._deps.brand.defaultConfig;
    }
    brandConfig.theme = {
      defaultTheme: 'light',
      themeMap: {
        light: getBrandTheme(brandConfig.code),
      },
      variable: getBrandVariable(brandConfig.code),
    };
    if (brandConfig.assets) {
      brandConfig.assets = this._getAssetsLink(brandConfig.assets);
    }
    this._setCacheConfig(brandConfig);
    this._deps.brand.setDynamicConfig(brandConfig);
  }

  _getUrl(url) {
    return `${this.brandUrl}${url}`;
  }

  /** combine base use with config relative path to actual url */
  _getAssetsLink(assets) {
    return Object.entries(assets).reduce(
      (acc, [key, url]) => {
        if (!url) {
          return acc;
        }

        if (url instanceof Array) {
          acc[key] = url.map((x) => this._getUrl(x));
        } else {
          acc[key] = this._getUrl(url);
        }

        return acc;
      },
      {},
    );
  }
}
