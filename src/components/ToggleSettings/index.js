import React from 'react';

import PropTypes from 'prop-types';

import IconLine from '@ringcentral-integration/widgets/components/IconLine';
import Switch from '@ringcentral-integration/widgets/components/Switch';

export function ToggleSetting({
  name,
  value,
  onChange,
  disabled,
}) {
  return (
    <IconLine
      icon={(
        <Switch
          disable={disabled}
          checked={value}
          onChange={onChange}
        />
      )}
    >
      <span title={name}>
        {name}
      </span>
    </IconLine>
  );
}
export function ToggleSettings({ settings, onToggle }) {
  const settingNodes = settings.map(setting => (
    <ToggleSetting
      key={setting.name}
      name={setting.name}
      value={setting.value}
      disabled={false}
      onChange={() => {
        onToggle(setting);
      }}
    />
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
