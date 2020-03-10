import sleep from 'ringcentral-integration/lib/sleep';
import React, { useState } from 'react';
import SpinnerOverlay from 'ringcentral-widgets/components/SpinnerOverlay';
import MeetingConfigs from 'ringcentral-widgets/components/MeetingConfigs';
import isSafari from 'ringcentral-widgets/lib/isSafari';

import { VideoConfig, Topic } from '../VideoPanel/VideoConfig';

import { GenericMeetingPanelProps } from './interface';
import styles from './styles.scss';

const GenericMeetingPanel: React.ComponentType<GenericMeetingPanelProps> = (
  props,
) => {
  const { showCustom, CustomPanel } = props;
  if (showCustom) {
    return CustomPanel as JSX.Element;
  }

  const {
    meeting,
    disabled,
    currentLocale,
    scheduleButton: ScheduleButton,
    recipientsSection,
    showWhen,
    showDuration,
    showRecurringMeeting,
    openNewWindow,
    meetingOptionToggle,
    passwordPlaceholderEnable,
    audioOptionToggle,
    onOK,
    init,
    showSaveAsDefault,
    updateMeetingSettings,
    isRCM,
    isRCV,
    datePickerSize,
    timePickerSize,
    showLaunchMeetingBtn,
    launchMeeting,
    scheduleButtonLabel,
    appCode,
    schedule,
    brandName,
  } = props;

  if (!isRCM && !isRCV) {
    return <SpinnerOverlay />;
  }

  const [topicRef, setTopicRef] = useState(null);

  return (
    <div className={styles.wrapper}>
      {isRCM && (
        <MeetingConfigs
          update={updateMeetingSettings}
          init={init}
          meeting={meeting}
          disabled={disabled}
          currentLocale={currentLocale}
          recipientsSection={recipientsSection}
          showWhen={showWhen}
          showDuration={showDuration}
          showRecurringMeeting={showRecurringMeeting}
          openNewWindow={openNewWindow}
          meetingOptionToggle={meetingOptionToggle}
          passwordPlaceholderEnable={passwordPlaceholderEnable}
          audioOptionToggle={audioOptionToggle}
        />
      )}
      {isRCV && (
        <VideoConfig
          currentLocale={currentLocale}
          meeting={meeting}
          updateMeetingSettings={updateMeetingSettings}
          recipientsSection={recipientsSection}
          showWhen={showWhen}
          showDuration={showDuration}
          init={init}
          datePickerSize={datePickerSize}
          timePickerSize={timePickerSize}
          brandName={brandName}
        >
          <Topic
            name={meeting.name}
            updateMeetingTopic={(name) => {
              updateMeetingSettings({
                ...meeting,
                name,
              });
            }}
            currentLocale={currentLocale}
            setTopicRef={setTopicRef}
          />
        </VideoConfig>
      )}
      {(isRCM || isRCV) && ScheduleButton && (
        <ScheduleButton
          currentLocale={currentLocale}
          disabled={disabled}
          meeting={meeting}
          onOK={onOK}
          onClick={async () => {
            if (!disabled) {
              await sleep(100);
              const opener = openNewWindow && isSafari() ? window.open() : null;
              // const meetingSetting = isRCM
              //   ? meeting
              //   : {
              //       ...meeting,
              //       name: topicRef.current.props.value, // TODO: why this?
              //     };
              await schedule(meeting, opener);
            }
          }}
          update={updateMeetingSettings}
          showSaveAsDefault={showSaveAsDefault}
          launchMeeting={launchMeeting}
          showLaunchMeetingBtn={showLaunchMeetingBtn}
          appCode={appCode}
          scheduleButtonLabel={scheduleButtonLabel}
        />
      )}
    </div>
  );
};

GenericMeetingPanel.defaultProps = {
  launchMeeting() {},
  disabled: false,
  showWhen: true,
  showDuration: true,
  showRecurringMeeting: true,
  openNewWindow: true,
  meetingOptionToggle: false,
  passwordPlaceholderEnable: false,
  audioOptionToggle: false,
  onOK: undefined,
  scheduleButton: undefined,
  showSaveAsDefault: true,
  showCustom: false,
  showLaunchMeetingBtn: false,
  appCode: '',
  scheduleButtonLabel: '',
};

export { GenericMeetingPanel };
