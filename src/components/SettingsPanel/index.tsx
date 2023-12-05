import React from 'react';

import {
  SettingsPanel,
} from '@ringcentral-integration/widgets/components/SettingsPanel';

import { AdditionalSettings } from './AdditionalSettings';

function NewSettingsPanel(props) {
  return (
    <SettingsPanel
      {
        ...props
      }
      showAutoLog={false}
      showAutoLogSMS={false}
      additional={
        <AdditionalSettings
          {...props}
        />
      }
    />
  );
}

export default NewSettingsPanel;
