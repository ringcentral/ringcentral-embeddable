import React, { Component } from 'react';
import classnames from 'classnames';

import styles from 'ringcentral-widgets/components/MeetingScheduleButton/styles.scss';
import i18n from 'ringcentral-widgets/components/MeetingScheduleButton/i18n';
import Button from 'ringcentral-widgets/components/Button';
import CheckBox from 'ringcentral-widgets/components/CheckBox';

export default class MeetingScheduleButton extends Component {
  getI18nButtonString() {
    return i18n.getString('schedule');
  }

  getI18nPromptString() {
    return i18n.getString('prompt');
  }

  getI18nTermsString() {
    return i18n.getString('terms');
  }

  render() {
    const {
      hidden,
      meeting,
      currentLocale,
      showSaveAsDefault,
      update,
      showLaunchMeetingBtn,
      onClick,
      launchMeeting,
      scheduleButtonLabel,
      disabled,
    } = this.props;
    return (
      <div
        className={classnames(
          styles.inviteBox,
          !hidden ? styles.withShadow : styles.onlyButton,
        )}
      >
        {hidden ? (
          <div className={styles.actionPrompt}>
            {this.getI18nPromptString()}
          </div>
        ) : null}
        {showSaveAsDefault ? (
          <CheckBox
            dataSign="saveAsDefault"
            checked={meeting.saveAsDefault}
            onChecked={() =>
              update({
                ...meeting,
                saveAsDefault: !meeting.saveAsDefault,
              })
            }
            type="checkbox"
            className={styles.notShowAgain}
          >
            {i18n.getString('saveAsDefault', currentLocale)}
          </CheckBox>
        ) : null}
        <Button
          onClick={onClick}
          disabledClassName={styles.isContainedTypeDisabled}
          className={classnames(
            styles.isContainedType,
            disabled ? styles.isContainedTypeDisabled : null,
          )}
          dataSign="meetingScheduleButton"
        >
          {scheduleButtonLabel || this.getI18nButtonString()}
        </Button>
        {showLaunchMeetingBtn ? (
          <Button
            dataSign="launchMeetingButton"
            className={classnames(styles.isOutlineType)}
            onClick={() => launchMeeting(meeting)}
          >
            {i18n.getString('launchMeeting', currentLocale)}
          </Button>
        ) : null}
      </div>
    );
  }
}
