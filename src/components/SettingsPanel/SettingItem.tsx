import React, { useState } from 'react';
import type { FunctionComponent } from 'react';
import {
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  styled,
  css,
  RcIcon,
  RcSwitch,
  RcButton,
  palette2,
  setOpacity,
  RcLink,
  RcTooltip,
  RcTypography,
  RcSelect,
  RcMenuItem,
} from '@ringcentral/juno';
import { ArrowRight, ArrowUp2, ArrowDown2, Logout, Lock } from '@ringcentral/juno-icon';

import type {
  LinkLineItemProps,
  SwitchLineItemProps,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import i18n from './i18n';

export const StyledSettingItem = styled(RcListItem)<{ $noBorder?: boolean }>`
  min-height: 50px;
  background-color: ${palette2('neutral', 'b01')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  ${(props) => props.$noBorder && css`
    border-bottom: none;
  `}

  .RcListItemText-primary {
    font-size: 0.875rem;
  }
`;

interface NewLinkLineItemProps extends LinkLineItemProps {
  description?: string;
  className?: string;
}

export const LinkLineItem: FunctionComponent<NewLinkLineItemProps> = ({
  show,
  name,
  customTitle,
  currentLocale,
  onClick,
  dataSign = undefined,
  pendoSignName = undefined,
  description = undefined,
  className = undefined,
}) => {
  if (!show) {
    return null;
  }
  return (
    <StyledSettingItem
      onClick={onClick}
      data-sign={dataSign}
      data-pendo={pendoSignName}
      className={className}
    >
      <RcListItemText
        primary={customTitle || i18n.getString(name, currentLocale)}
        secondary={description}
        secondaryTypographyProps={{
          title: description,
        }}
      />
      <RcListItemSecondaryAction>
        <RcIcon symbol={ArrowRight} />
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
};

interface NewSwitchLineItemProps extends SwitchLineItemProps {
  className?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
  warning?: string;
}

const StyledSwitch = styled(RcSwitch)`
  ${(props) => props.readOnly && css`
    opacity: 0.5;
  `}
`;

const InfoIcon = styled(RcIcon)`
  margin-left: 5px;
  vertical-align: middle;
  cursor: pointer;
  display: inline-block;
`;

const ItemLabel = ({
  customTitle,
  name,
  currentLocale,
  readOnly,
  readOnlyReason,
}) => {
  let label = customTitle || i18n.getString(name, currentLocale);
  if (readOnly) {
    label = (
      <>
        {label}
        <RcTooltip title={readOnlyReason || ''}>
          <InfoIcon
            symbol={Lock}
            size="small"
          />
        </RcTooltip>
      </>
    );
  }
  return label;
}

type BaseSettingActionItemProps = {
  name: string;
  customTitle?: string;
  currentLocale: string;
  dataSign?: string;
  className?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
  warning?: string;
  settingAction: React.ReactNode;
}

const StyledSettingDescription = styled(RcTypography)`
  text-wrap: auto;
`;

const BaseSettingActionItem: FunctionComponent<BaseSettingActionItemProps> = ({
  name,
  customTitle,
  currentLocale,
  dataSign,
  className,
  readOnly,
  readOnlyReason,
  description,
  warning,
  settingAction,
}) => {
  const label = (
    <ItemLabel
      customTitle={customTitle}
      name={name}
      currentLocale={currentLocale}
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
    />
  );
  return (
    <StyledSettingItem
      data-sign={dataSign}
      className={className}
    >
      <RcListItemText
        primary={label}
        title={customTitle || i18n.getString(name, currentLocale)}
        secondary={
          <>
            {
              description ? (
                <StyledSettingDescription variant="caption1" color="neutral.f04" title={description}>
                  {description}
                </StyledSettingDescription>
              ) : null
            }
            {
              warning ? (
                <StyledSettingDescription variant="caption1" color="danger.f02" title={warning}>
                  {warning}
                </StyledSettingDescription>
              ) : null
            }
          </>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
      />
      <RcListItemSecondaryAction>
        {settingAction}
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
}

export const SwitchLineItem: FunctionComponent<NewSwitchLineItemProps> = ({
  show,
  name,
  customTitle,
  switchTitle,
  currentLocale,
  dataSign,
  disabled,
  checked,
  onChange,
  className,
  readOnly,
  readOnlyReason,
  description,
  warning,
  // tooltip,
}) => {
  if (!show) {
    return null;
  }
  return (
    <BaseSettingActionItem
      name={name}
      customTitle={customTitle}
      currentLocale={currentLocale}
      dataSign={dataSign}
      className={className}
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
      description={description}
      warning={warning}
      settingAction={
        <StyledSwitch
          checked={checked}
          disabled={disabled}
          onChange={(_, checked) => {
            if (readOnly) {
              return;
            }
            onChange && onChange(checked);
          }}
          formControlLabelProps={{
            labelPlacement: 'start',
          }}
          label={switchTitle}
          readOnly={readOnly}
        />
      }
    />
  );
}

type OptionSettingLineItemProps = {
  show: boolean;
  name: string;
  customTitle?: string;
  currentLocale: string;
  dataSign?: string;
  value: string | number;
  disabled?: boolean;
  options: {
    id: string | number;
    name: string;
  }[];
  onChange: (value: string | number) => void;
  className?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
  warning?: string;
}

const StyledSelect = styled(RcSelect)`
  width: 138px;
`;

export const OptionSettingLineItem: FunctionComponent<OptionSettingLineItemProps> = ({
  show,
  name,
  customTitle,
  currentLocale,
  dataSign,
  value,
  disabled,
  options,
  onChange,
  className,
  readOnly,
  readOnlyReason,
  description,
  warning,
}) => {
  if (!show) {
    return null;
  }
  return (
    <BaseSettingActionItem
      name={name}
      customTitle={customTitle}
      currentLocale={currentLocale}
      dataSign={dataSign}
      className={className}
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
      description={description}
      warning={warning}
      settingAction={
        <StyledSelect
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          variant="box"
          onChange={(event) => {
            if (readOnly) {
              return;
            }
            onChange(event.target.value as (string | number));
          }}
        >
          {
            options.map((option) => (
              <RcMenuItem
                key={option.id}
                value={option.id}
              >
                {option.name}
              </RcMenuItem>
            ))
          }
        </StyledSelect>
      }
    />
  );
}

interface ButtonLineItemProps {
  name: string;
  buttonLabel: string;
  onClick: () => void;
  description?: string;
}

export const ButtonLineItem: FunctionComponent<ButtonLineItemProps> = ({
  name,
  buttonLabel,
  onClick,
  description = undefined,
}) => {
  return (
    <StyledSettingItem>
      <RcListItemText
        primary={name}
        secondary={description}
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

interface GroupLineItemProps {
  name: string;
  show: boolean;
  dataSign?: string;
  description?: string;
  currentLocale: string;
}

const StyledGroupSettingItem = styled(StyledSettingItem)`
  ${(props) => props.$extended && css`
    background-color: ${setOpacity(palette2('neutral', 'b04'), '08')};
    .RcListItemText-primary {
      font-weight: bold;
    }
  `}
`;

const StyledGroupSplit = styled.div`
  height: 10px;
`;
export const GroupLineItem: FunctionComponent<GroupLineItemProps> = ({
  name,
  children,
  show,
  dataSign = undefined,
  description = undefined,
  currentLocale,
}) => {
  const [extended, setExtended] = useState(false);

  if (!show) {
    return null;
  }

  return (
    <>
      <StyledGroupSettingItem
        onClick={() => setExtended(!extended)}
        $extended={extended}
        data-sign={dataSign}
      >
        <RcListItemText
          primary={i18n.getString(name, currentLocale)}
          secondary={description}
        />
        <RcListItemSecondaryAction>
          <RcIcon
            symbol={extended ? ArrowUp2 : ArrowDown2}
          />
        </RcListItemSecondaryAction>
      </StyledGroupSettingItem>
      {
        extended ? children : null
      }
      {
        extended ?<StyledGroupSplit /> : null
      }
    </>
  );
}

interface ExternalLinkLineItemProps {
  name: string;
  uri: string;
  dataSign?: string;
  description?: string;
}

export const ExternalLinkLineItem: FunctionComponent<ExternalLinkLineItemProps> = ({
  uri,
  name,
  dataSign = undefined,
  description = undefined,
}) => {
  return (
    <StyledSettingItem data-sign={dataSign}>
      <RcListItemText
        primary={(
          <RcLink
            href={uri}
            target="_blank"
          >
            {name}
          </RcLink>
        )}
        primaryTypographyProps={{
          'component': 'div',
        }}
        secondary={description}
      />
    </StyledSettingItem>
  );
}

interface LogoutItemProps {
  onLogout: () => void;
  loginNumber: string;
  currentLocale: string;
}

export const LogoutItem: FunctionComponent<LogoutItemProps> = ({
  currentLocale,
  onLogout,
  loginNumber,
}) => {
  return (
    <StyledSettingItem
      onClick={onLogout}
      data-sign="logoutButton"
      $noBorder
    >
      <RcListItemText
        primary={i18n.getString('logout', currentLocale)}
        primaryTypographyProps={{
          color: 'neutral.f05',
        }}
        secondary={loginNumber}
        secondaryTypographyProps={{
          'data-sign': 'loginNumber',
        }}
      />
      <RcListItemSecondaryAction>
        <RcIcon
          symbol={Logout}
          size="medium"
          color="neutral.f03"
        />
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  )
}