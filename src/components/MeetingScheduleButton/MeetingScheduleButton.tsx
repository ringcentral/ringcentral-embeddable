import React from 'react';

import type { RcMMeetingModel } from '@ringcentral-integration/commons/modules/Meeting';
import { RcButton, RcCheckbox } from '@ringcentral/juno';

import i18n from '@ringcentral-integration/widgets/components/MeetingScheduleButton/i18n';
import styles from '@ringcentral-integration/widgets/components/MeetingScheduleButton/styles.scss';
import {
  MeetingScheduleButtonWrapper,
  ScheduleButton,
} from './MeetingScheduleButtonWrapper';

type Props = {
  currentLocale: string;
  meeting: RcMMeetingModel;
  scheduleButtonLabel: string;
  onClick?: () => any;
  hidden?: boolean;
  showSaveAsDefault?: boolean;
  disableSaveAsDefault?: boolean;
  disabled?: boolean;
  update?: (data: any) => any;
  showLaunchMeetingBtn?: boolean;
  launchMeeting?: (meeting?: RcMMeetingModel) => any;
};

export class MeetingScheduleButton extends React.Component<Props, {}> {
  static defaultProps = {
    meeting: null,
    hidden: false,
    disabled: false,
    currentLocale: undefined,
    showSaveAsDefault: false,
    disableSaveAsDefault: false,
    update() {},
    showLaunchMeetingBtn: false,
    launchMeeting() {},
    onClick() {},
  };

  getI18nButtonString() {
    return i18n.getString('schedule');
  }

  getI18nPromptString() {
    return i18n.getString('prompt');
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    const {
      hidden,
      meeting,
      currentLocale,
      showSaveAsDefault,
      disableSaveAsDefault,
      update,
      showLaunchMeetingBtn,
      onClick,
      launchMeeting,
      scheduleButtonLabel,
      disabled,
    } = this.props;
    return (
      // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
      <MeetingScheduleButtonWrapper $hidden={hidden}>
        {hidden ? (
          <div className={styles.actionPrompt}>
            {this.getI18nPromptString()}
          </div>
        ) : null}
        {showSaveAsDefault ? (
          <RcCheckbox
            data-sign="saveAsDefault"
            checked={meeting?.saveAsDefault}
            disabled={disableSaveAsDefault}
            className={styles.saveAsDefault}
            formControlLabelProps={{
              classes: {
                label: styles.saveAsDefaultLabel,
              },
            }}
            onChange={() =>
              // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
              update({
                ...meeting,
                saveAsDefault: !meeting?.saveAsDefault,
              })
            }
            label={i18n.getString('saveAsDefault', currentLocale)}
          />
        ) : null}
        <ScheduleButton
          onClick={onClick}
          disabled={disabled}
          data-sign="meetingScheduleButton"
          fullWidth
        >
          {scheduleButtonLabel || this.getI18nButtonString()}
        </ScheduleButton>
        {showLaunchMeetingBtn ? (
          <RcButton
            className={styles.gutter}
            // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
            onClick={() => launchMeeting(meeting)}
            data-sign="launchMeetingButton"
            variant="text"
            fullWidth
          >
            {i18n.getString('launchMeeting', currentLocale)}
          </RcButton>
        ) : null}
      </MeetingScheduleButtonWrapper>
    );
  }
}
