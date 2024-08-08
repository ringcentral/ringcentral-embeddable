import type { DNDStatusValueType } from '@ringcentral-integration/commons/modules/Presence';
import { dndStatus } from '@ringcentral-integration/commons/modules/Presence';
import {
  palette2,
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcIcon,
  RcPresence,
  spacing,
  styled,
  css,
} from '@ringcentral/juno';
import { ArrowDown2, ArrowUp2 } from '@ringcentral/juno-icon';
import type { FunctionComponent } from 'react';
import React, { useState } from 'react';

import { getPresenceStatusName } from '@ringcentral-integration/widgets/lib/getPresenceStatusName';
import { usePresenceItems } from '@ringcentral-integration/widgets/components/PresenceDropdown/usePresenceItems';

import i18n from '@ringcentral-integration/widgets/components/PresenceSettingSection/i18n';

import { SwitchLineItem, StyledSettingItem } from './SettingItem';

const StyledList = styled(RcList)`
  background-color: ${palette2('neutral', 'elevation')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  margin-bottom: 10px;

  ${RcListItem} {
    padding-left: ${spacing(5)};
  }
`;

const StyledPresenceSettingItem = styled(StyledSettingItem)`
  ${(props) => props.$extended && css`
    .RcListItemText-primary {
      font-weight: bold;
    }
  `}
`;

type PresenceSettingSectionProps = {
  currentLocale: string;
  dndStatus: DNDStatusValueType;
  userStatus: string;
  isCallQueueMember: boolean;
  setAvailable: (...args: any[]) => any;
  setBusy: (...args: any[]) => any;
  setDoNotDisturb: (...args: any[]) => any;
  setInvisible: (...args: any[]) => any;
  toggleAcceptCallQueueCalls: (...args: any[]) => any;
  showPresenceSettings: boolean;
};

const StyledPresenceIcon = styled(RcPresence)`
  padding: 0;
`;

const StyledCurrentStatus = styled.span`
  font-size: 0.875rem;
`;

const StyledCallQueueSwitch = styled(SwitchLineItem)`
  padding-left: ${spacing(2)};
  padding-right: ${spacing(2)};
  font-size: 13px;
  min-height: 40px;
`;

export const PresenceSettingSection: FunctionComponent<
  PresenceSettingSectionProps
> = ({
  showPresenceSettings = false,
  toggleAcceptCallQueueCalls,
  isCallQueueMember,
  dndStatus: dndStatusProp,
  userStatus,
  currentLocale,
  setAvailable,
  setBusy,
  setDoNotDisturb,
  setInvisible,
}) => {
  const [showSelects, setShowSelects] = useState(showPresenceSettings);

  const toggleShow = () => {
    setShowSelects((prev) => !prev);
  };

  const onCallQueueChange = () => {
    toggleAcceptCallQueueCalls();
  };

  const acceptQueueCalls = (
    <StyledCallQueueSwitch
      show={isCallQueueMember}
      dataSign="acceptQueueSwitch"
      name={i18n.getString('acceptQueueCalls', currentLocale)}
      disabled={dndStatusProp === dndStatus.doNotAcceptAnyCalls}
      checked={dndStatusProp === dndStatus.takeAllCalls}
      onChange={onCallQueueChange}
    />
  );
  const currentStatus = getPresenceStatusName(
    userStatus as any,
    dndStatusProp as any,
    currentLocale,
  );

  const { elements: presenceElements, selectedItem } = usePresenceItems({
    currentLocale,
    userStatus,
    dndStatus: dndStatusProp,
    onChange: (type) => {
      switch (type) {
        case 'available':
          setAvailable();
          break;
        case 'busy':
          setBusy();
          break;
        case 'DND':
          setDoNotDisturb();
          break;
        case 'offline':
          setInvisible();
          break;
        default:
          break;
      }
    },
  });

  return (
    <>
      <StyledPresenceSettingItem
        data-sign="statusToggleShow"
        onClick={toggleShow}
        $extended={showSelects}
      >
        <RcListItemText
          primary={i18n.getString('status', currentLocale)}
        />
        <RcListItemSecondaryAction>
          <StyledPresenceIcon size="medium" type={selectedItem?.type} />
          <StyledCurrentStatus>{currentStatus}</StyledCurrentStatus>
          <RcIcon
            symbol={showSelects ? ArrowUp2 : ArrowDown2}
          />
        </RcListItemSecondaryAction>
      </StyledPresenceSettingItem>
      {
        showSelects ? (
          <StyledList>
            {presenceElements}
            {acceptQueueCalls}
          </StyledList>
        ) : (
          null
        )
      }
    </>
  );
};
