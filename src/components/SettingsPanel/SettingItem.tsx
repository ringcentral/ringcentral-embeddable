import React from 'react';
import type { FunctionComponent } from 'react';
import {
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  styled,
  RcIcon,
  RcSwitch,
  RcButton,
  palette2,
} from '@ringcentral/juno';
import { ArrowRight } from '@ringcentral/juno-icon';

import type {
  LinkLineItemProps,
  SwitchLineItemProps,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import i18n from '@ringcentral-integration/widgets/components/SettingsPanel/i18n';

export const StyledSettingItem = styled(RcListItem)`
  min-height: 50px;
  background-color: ${palette2('neutral', 'b01')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  .RcListItemText-primary {
    font-size: 0.875rem;
  }
`;

export const LinkLineItem: FunctionComponent<LinkLineItemProps> = ({
  show,
  name,
  customTitle,
  currentLocale,
  onClick,
  dataSign = undefined,
  pendoSignName = undefined,
}) => {
  if (!show) {
    return null;
  }
  return (
    <StyledSettingItem
      onClick={onClick}
      data-sign={dataSign}
      data-pendo={pendoSignName}
    >
      <RcListItemText
        primary={customTitle || i18n.getString(name, currentLocale)}
      />
      <RcListItemSecondaryAction>
        <RcIcon symbol={ArrowRight} />
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
};

export const SwitchLineItem: FunctionComponent<SwitchLineItemProps> = ({
  show,
  name,
  customTitle,
  switchTitle,
  currentLocale,
  dataSign,
  disabled,
  checked,
  onChange,
  // tooltip,
}) => {
  if (!show) {
    return null;
  }

  return (
    <StyledSettingItem
      data-sign={dataSign}
    >
      <RcListItemText
        primary={customTitle || i18n.getString(name, currentLocale)}
        title={customTitle || i18n.getString(name, currentLocale)}
      />
      <RcListItemSecondaryAction>
        <RcSwitch
          checked={checked}
          disabled={disabled}
          onChange={(_, checked) => {
            onChange && onChange(checked);
          }}
          formControlLabelProps={{
            labelPlacement: 'start',
          }}
          label={switchTitle}
        />
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
}

interface ButtonLineItemProps {
  name: string;
  buttonLabel: string;
  onClick: () => void;
}

export const ButtonLineItem: FunctionComponent<ButtonLineItemProps> = ({
  name,
  buttonLabel,
  onClick,
}) => {
  return (
    <StyledSettingItem>
      <RcListItemText
        primary={name}
      />
      <RcListItemSecondaryAction>
        <RcButton
          size="small"
          color="action.primary"
          onClick={onClick}
        >
          {buttonLabel}
        </RcButton>
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
}
