import type { FunctionComponent } from 'react';
import React from 'react';

import type { RcVMeetingModel } from '@ringcentral-integration/commons/interfaces/Rcv.model';
import { RcButton, RcCheckbox, spacing, styled } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/RcVideoScheduleButton/i18n';

import { MeetingScheduleButtonWrapper } from '../MeetingScheduleButton/MeetingScheduleButtonWrapper';

export interface RcVideoScheduleButtonProps {
  currentLocale: string;
  meeting: RcVMeetingModel;
  hidden: boolean;
  disabled: boolean;
  onClick: () => any;
  brand: string;
  showSaveAsDefault: boolean;
  disableSaveAsDefault: boolean;
  update: (args: any) => any;
  buttonLabel: string;
}

function getI18nButtonString() {
  return i18n.getString('schedule');
}

const RcVideoScheduleButtonWrapper = styled(MeetingScheduleButtonWrapper)<{
  $noCheckbox: boolean;
}>`
  padding: ${({ $noCheckbox }) => ($noCheckbox ? spacing(4) : '5px')} 16px 16px
    16px;
`;

export const RcVideoScheduleButton: FunctionComponent<RcVideoScheduleButtonProps> =
  (props) => {
    const {
      hidden,
      disabled,
      meeting,
      onClick,
      currentLocale,
      showSaveAsDefault,
      disableSaveAsDefault,
      update,
      buttonLabel,
    } = props;

    return (
      <RcVideoScheduleButtonWrapper
        $hidden={hidden}
        $noCheckbox={!showSaveAsDefault}
      >
        {showSaveAsDefault ? (
          <RcCheckbox
            label={i18n.getString('saveAsDefault', currentLocale)}
            data-sign="saveAsDefault"
            checked={meeting.saveAsDefault}
            disabled={disableSaveAsDefault}
            onChange={() => {
              update({
                ...meeting,
                saveAsDefault: !meeting.saveAsDefault,
              });
            }}
          />
        ) : null}
        <RcButton
          onClick={onClick}
          disabled={disabled}
          data-sign="videoScheduleButton"
          fullWidth
        >
          {buttonLabel || getI18nButtonString()}
        </RcButton>
      </RcVideoScheduleButtonWrapper>
    );
  };
