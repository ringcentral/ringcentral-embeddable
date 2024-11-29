import {
  action,
  computed,
  globalStorage,
  RcModuleV2,
  state,
  watch,
} from '@ringcentral-integration/core';
import type { RcTheme } from '@ringcentral/juno';

import { Module } from '@ringcentral-integration/commons/lib/di';
import type { CssModuleVariable } from '@ringcentral-integration/commons/modules/Brand/BrandConfig.interface';
import { defaultCssVariable } from '@ringcentral-integration/commons/modules/Theme/defaultCssVariable';
import type { Deps } from '@ringcentral-integration/commons/modules/Theme/Theme.interface';

function getCurrentTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

@Module({
  name: 'Theme',
  deps: [
    'Brand',
    'GlobalStorage',
    { dep: 'ThemeOptions', optional: true }
  ],
})
export class Theme extends RcModuleV2<Deps> {
  constructor(deps: Deps) {
    super({
      deps,
      enableGlobalCache: true,
      storageKey: 'Theme',
    });
  }

  @globalStorage
  @state
  themeType = 'light';

  @action
  setThemeType(type: string) {
    this.themeType = type;
  }

  @globalStorage
  @state
  isAutoMode = false;

  @action
  setAutoMode(isAutoMode: boolean) {
    this.isAutoMode = isAutoMode;
  }

  setThemeTypeSystem() {
    const newType = getCurrentTheme();
    if (this.themeType !== newType) {
      this.setThemeType(newType);
    }
  }

  override onInitOnce() {
    const defaultThemeType = this._deps.brand.brandConfig.theme?.defaultTheme;
    const supportThemes = Object.keys(this._deps.brand.brandConfig.theme?.themeMap || {});
    if (defaultThemeType && !supportThemes.includes(this.themeType)) {
      this.setThemeType(defaultThemeType);
    }

    watch(
      this,
      () => this._deps.brand.brandConfig.theme,
      (newValue) => {
        const newDefaultThemeType = newValue?.defaultTheme;
        const supportThemes = Object.keys(newValue?.themeMap || {});
        if (newDefaultThemeType && !supportThemes.includes(this.themeType)) {
          this.setThemeType(newValue.defaultTheme);
        }
      },
    );

    this.initSystemTheme();
  }

  initSystemTheme() {
    try {
      if (this.isAutoMode) {
        this.setThemeTypeSystem();
      }
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.isAutoMode) {
          this.setThemeTypeSystem();
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  get theme() {
    const curr = this._deps.brand.brandConfig.theme?.themeMap?.[
      this.themeType
    ] as any;

    return curr as RcTheme;
  }

  @computed((that: Theme) => [that._deps.brand.brandConfig.theme?.variable])
  get variable() {
    return {
      ...defaultCssVariable,
      ...this._deps.brand.brandConfig.theme?.variable,
    } as CssModuleVariable;
  }
}
