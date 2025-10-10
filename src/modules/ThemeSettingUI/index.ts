import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, computed } from '@ringcentral-integration/core';

@Module({
  name: 'ThemeSettingUI',
  deps: [
    'Theme',
    'RouterInteraction',
  ],
})
export class ThemeSettingUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @computed((that: ThemeSettingUI) => [that._deps.theme.isAutoMode, that._deps.theme.themeType])
  get settingSection() {
    const { theme } = this._deps;
    const value = theme.isAutoMode ? 'auto' : theme.themeType;
    return {
      id: 'theme',
      name: 'Theme',
      type: 'section',
      items: [
        {
          id: 'theme',
          name: 'Set color theme to',
          type: 'option',
          value,
          options: [
            { id: 'auto', name: 'From system settings' },
            { id: 'light', name: 'Light' },
            { id: 'dark', name: 'Dark' },
          ],
        },
      ],
    };
  }

  getUIProps() {
    return {
      section: this.settingSection,
    };
  }

  getUIFunctions() {
    return {
      onSave: (newSetting) => {
        if (newSetting.items[0].value === 'auto') {
          this._deps.theme.setAutoMode(true);
          this._deps.theme.setThemeTypeSystem();
          return;
        }
        this._deps.theme.setAutoMode(false);
        this._deps.theme.setThemeType(newSetting.items[0].value);
      },
      onBackButtonClick: () => {
        this._deps.routerInteraction.goBack();
      }
    };
  }
}
