import React from 'react';

import PropTypes from 'prop-types';

import {
  LinkLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/LinkLineItem';
import {
  SwitchLineItem,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SwitchLineItem';

export function ThirdPartySettings({ settings, onToggle, goToSettingSection }) {
  const settingNodes = settings.map(setting => {
    if (setting.type === 'section') {
      return (
        <LinkLineItem
          key={setting.id || setting.name}
          customTitle={setting.name}
          currentLocale={setting.currentLocale}
          onClick={() => {
            goToSettingSection(setting.id);
          }}
          show
        />
      )
    }
    return (
      <SwitchLineItem
        key={setting.id || setting.name}
        customTitle={setting.name}
        show
        dataSign={`thirdPartySettings-${setting.name}`}
        checked={setting.value}
        onChange={() => {
          onToggle(setting);
        }}
      />
    );
  });
  return (
    <>
      {settingNodes}
    </>
  );
}

ThirdPartySettings.propTypes = {
  settings: PropTypes.arrayOf(PropTypes.object),
  onToggle: PropTypes.func.isRequired,
  goToSettingSection: PropTypes.func.isRequired,
};

ThirdPartySettings.defaultProps = {
  settings: []
};
