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
} from '@ringcentral/juno';
import { ArrowRight, ArrowUp2, ArrowDown2, Logout, Lock } from '@ringcentral/juno-icon';

import type {
  LinkLineItemProps,
  SwitchLineItemProps,
} from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import i18n from '@ringcentral-integration/widgets/components/SettingsPanel/i18n';

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

interface NewSwitchLineItemProps extends SwitchLineItemProps {
  className?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
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
  // tooltip,
}) => {
  if (!show) {
    return null;
  }

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
  return (
    <StyledSettingItem
      data-sign={dataSign}
      className={className}
    >
      <RcListItemText
        primary={label}
        title={customTitle || i18n.getString(name, currentLocale)}
      />
      <RcListItemSecondaryAction>
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

interface GroupLineItemProps {
  name: string;
  show: boolean;
  dataSign?: string;
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
          primary={name}
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
}

export const ExternalLinkLineItem: FunctionComponent<ExternalLinkLineItemProps> = ({
  uri,
  name,
  dataSign = undefined,
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