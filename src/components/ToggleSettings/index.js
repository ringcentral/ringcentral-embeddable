import React from 'react';
import PropTypes from 'prop-types';
import IconLine from '@ringcentral-integration/widgets/components/IconLine';
import Switch from '@ringcentral-integration/widgets/components/Switch';

export default function ToggleSettings({ settings, onToggle }) {
  const settingNodes = settings.map(setting => (
    <IconLine
      key={setting.name}
      icon={(
        <Switch
          disable={false}
          checked={setting.value}
          onChange={() => {
            onToggle(setting);
          }}
        />
      )}
    >
      <span title={setting.name}>
        {setting.name}
      </span>
    </IconLine>
  ));
  return (
    <>
      {settingNodes}
    </>
  );
}

ToggleSettings.propTypes = {
  settings: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.bool,
  })),
  onToggle: PropTypes.func.isRequired,
};

ToggleSettings.defaultProps = {
  settings: []
};
