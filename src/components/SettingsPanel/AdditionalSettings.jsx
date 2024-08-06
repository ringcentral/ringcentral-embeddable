import React from 'react';
import { LinkLineItem, SwitchLineItem, ButtonLineItem } from './SettingItem';

const Empty = () => null;

export function AdditionalSettings({
  currentLocale,
  thirdPartySettings,
  onSettingToggle,
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  showAutoLog = false,
  autoLogTitle,
  autoLogEnabled = false,
  disableAutoLogEnabled = false,
  onAutoLogChange = Empty,
  autoLogSMSEnabled = false,
  showAutoLogSMS = false,
  autoLogSMSTitle,
  onAutoLogSMSChange,
}) {
  const additionalItems = [];
  if (showAutoLog) {
    additionalItems.push({
      order: 3000,
      id: 'autoLogCalls',
      component: (
        <SwitchLineItem
          name="autoLogCalls"
          dataSign="AutoLogCall"
          show={showAutoLog}
          customTitle={autoLogTitle}
          currentLocale={currentLocale}
          disabled={disableAutoLogEnabled}
          checked={autoLogEnabled}
          onChange={onAutoLogChange}
        />
      ),
    });
  }
  if (showAutoLogSMS) {
    additionalItems.push({
      order: 4000,
      id: 'autoLogSMS',
      component: (
        <SwitchLineItem
          name="autoLogSMS"
          dataSign="AutoLogSMS"
          customTitle={autoLogSMSTitle}
          show={showAutoLogSMS}
          currentLocale={currentLocale}
          checked={autoLogSMSEnabled}
          onChange={onAutoLogSMSChange}
        />
      ),
    });
  }
  thirdPartySettings.forEach((setting, index) => {
    let item;
    if (setting.type === 'section') {
      item = (
        <LinkLineItem
          key={setting.id || setting.name}
          customTitle={setting.name}
          currentLocale={setting.currentLocale}
          onClick={() => {
            gotoThirdPartySection(setting.id);
          }}
          show
        />
      );
    } else if (setting.type === 'button') {
      item = (
        <ButtonLineItem
          key={setting.id || setting.name}
          name={setting.name}
          buttonLabel={setting.buttonLabel}
          onClick={() => {
            onThirdPartyButtonClick(setting.id);
          }}
        />
      );
    } else {
      item = (
        <SwitchLineItem
          key={setting.id || setting.name}
          customTitle={setting.name}
          show
          dataSign={`thirdPartySettings-${setting.name}`}
          checked={setting.value}
          onChange={() => {
            onSettingToggle(setting);
          }}
        />
      );
    }
    additionalItems.push({
      order: setting.order || (8000 + index),
      id: setting.id || setting.name,
      component: item,
    });
  });
  return (
    <>
      {
        additionalItems
          .sort((a, b) => a.order - b.order)
          .map(item => (
            <div key={item.id}>
              {item.component}
            </div>
          ))
      }
    </>
  );
}
