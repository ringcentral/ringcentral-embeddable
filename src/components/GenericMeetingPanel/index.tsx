import React, { useRef } from 'react';

import type { RcVMeetingModel } from '@ringcentral-integration/commons/interfaces/Rcv.model';
import type { RcMMeetingModel } from '@ringcentral-integration/commons/modules/Meeting';
import { sleep } from '@ringcentral-integration/commons/utils';
import { isSafari } from '@ringcentral-integration/utils';

import type { TopicRef } from '@ringcentral-integration/widgets/components/InnerTopic';
import { Topic } from '@ringcentral-integration/widgets/components/InnerTopic';
// import MeetingConfigs from '@ringcentral-integration/widget/component/MeetingConfigs'; // Remove this to avoid use moment
import { MeetingConfigs as MeetingConfigsV2 } from '@ringcentral-integration/widgets/components/MeetingConfigsV2';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import { VideoConfig } from '@ringcentral-integration/widgets/components/VideoPanel/VideoConfig';
import type { GenericMeetingPanelProps } from '@ringcentral-integration/widgets/components/GenericMeetingPanel/interface';
import styles from '@ringcentral-integration/widgets/components/GenericMeetingPanel/styles.scss';

const GenericMeetingPanel: React.ComponentType<GenericMeetingPanelProps> = (
  props,
) => {
  const topicRef = useRef<TopicRef>(null);

  const { showCustom, CustomPanel } = props;
  if (showCustom) {
    return CustomPanel as JSX.Element;
  }

  const {
    useRcmV2,
    meeting,
    disabled,
    configDisabled,
    currentLocale,
    scheduleButton: ScheduleButton,
    recipientsSection,
    showTopic,
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
    disableSaveAsDefault,
    updateMeetingSettings,
    isRCM,
    isRCV,
    datePickerSize,
    timePickerSize,
    checkboxSize,
    showLaunchMeetingBtn,
    launchMeeting,
    scheduleButtonLabel,
    appCode,
    schedule,
    showSpinner,
    showRcvAdminLock,
    showPmiConfirm,
    enablePersonalMeeting,
    isPmiChangeConfirmed,
    onPmiChangeClick,
    showWaitingRoom,
    showE2EE,
    isE2EEDisabled,
    personalMeetingId,
    switchUsePersonalMeetingId,
    // @ts-expect-error TS(2339): Property 'updateHasSettingsChanged' does not exist... Remove this comment to see the full error message
    updateHasSettingsChanged,
    trackSettingChanges,
    e2eeInteractFunc,
    showScheduleOnBehalf,
    delegators,
    joinBeforeHostLabel,
    authUserTypeValue,
    isJoinBeforeHostDisabled,
    isMuteAudioDisabled,
    isTurnOffCameraDisabled,
    isAllowScreenSharingDisabled,
    isAuthenticatedCanJoinDisabled,
    isRequirePasswordDisabled,
    isWaitingRoomDisabled,
    isWaitingRoomNotCoworkerDisabled,
    isWaitingRoomGuestDisabled,
    isWaitingRoomAllDisabled,
    isAuthUserTypeDisabled,
    isWaitingRoomTypeDisabled,
    isSignedInUsersDisabled,
    isSignedInCoWorkersDisabled,
    updateScheduleFor,
    labelPlacement,
    showSpinnerInConfigPanel,
    enableServiceWebSettings,
    recurringMeetingPosition,
    defaultTopic,
    isPersonalMeetingDisabled,
    showIeSupportAlert,
    showRemoveMeetingWarning,
    brandConfig,
  } = props;

  if (showSpinner) {
    return <SpinnerOverlay />;
  }
  return (
    <div className={styles.wrapper}>
      {isRCM && (
        <MeetingConfigsV2
          // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
          disabled={configDisabled}
          defaultTopic={defaultTopic}
          showSpinnerInConfigPanel={showSpinnerInConfigPanel}
          updateMeetingSettings={updateMeetingSettings}
          personalMeetingId={personalMeetingId}
          switchUsePersonalMeetingId={switchUsePersonalMeetingId}
          init={init}
          labelPlacement={labelPlacement}
          meeting={meeting as RcMMeetingModel}
          currentLocale={currentLocale}
          recipientsSection={recipientsSection}
          showTopic={showTopic}
          showWhen={showWhen}
          showDuration={showDuration}
          showRecurringMeeting={showRecurringMeeting}
          meetingOptionToggle={meetingOptionToggle}
          audioOptionToggle={audioOptionToggle}
          showScheduleOnBehalf={showScheduleOnBehalf}
          // @ts-expect-error TS(2322): Type 'RcvDelegator[] | undefined' is not assignabl... Remove this comment to see the full error message
          delegators={delegators}
          updateScheduleFor={updateScheduleFor}
          trackSettingChanges={trackSettingChanges}
          enableServiceWebSettings={enableServiceWebSettings}
          recurringMeetingPosition={recurringMeetingPosition}
          datePickerSize={datePickerSize}
          timePickerSize={timePickerSize}
          checkboxSize={checkboxSize}
          showIeSupportAlert={showIeSupportAlert}
          showRemoveMeetingWarning={showRemoveMeetingWarning}
          brandConfig={brandConfig}
        >
          {showTopic && (
            <Topic
              name={(meeting as RcMMeetingModel).topic}
              updateMeetingTopic={(topic) => {
                updateMeetingSettings({ ...meeting, topic });
              }}
              currentLocale={currentLocale}
              ref={topicRef}
              defaultTopic={defaultTopic}
            />
          )}
        </MeetingConfigsV2>
      )}
      {isRCV && (
        <VideoConfig
          disabled={configDisabled}
          // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
          isPersonalMeetingDisabled={isPersonalMeetingDisabled}
          currentLocale={currentLocale}
          labelPlacement={labelPlacement}
          meeting={meeting as RcVMeetingModel}
          e2eeInteractFunc={e2eeInteractFunc}
          updateScheduleFor={updateScheduleFor}
          updateMeetingSettings={updateMeetingSettings}
          recipientsSection={recipientsSection}
          showWhen={showWhen}
          showDuration={showDuration}
          init={init}
          datePickerSize={datePickerSize}
          timePickerSize={timePickerSize}
          checkboxSize={checkboxSize}
          showRcvAdminLock={showRcvAdminLock}
          showPmiConfirm={showPmiConfirm}
          showWaitingRoom={showWaitingRoom}
          showE2EE={showE2EE}
          isE2EEDisabled={isE2EEDisabled}
          isWaitingRoomNotCoworkerDisabled={isWaitingRoomNotCoworkerDisabled}
          isWaitingRoomGuestDisabled={isWaitingRoomGuestDisabled}
          isWaitingRoomAllDisabled={isWaitingRoomAllDisabled}
          isAuthUserTypeDisabled={isAuthUserTypeDisabled}
          isWaitingRoomTypeDisabled={isWaitingRoomTypeDisabled}
          isSignedInUsersDisabled={isSignedInUsersDisabled}
          isSignedInCoWorkersDisabled={isSignedInCoWorkersDisabled}
          enablePersonalMeeting={enablePersonalMeeting}
          isPmiChangeConfirmed={isPmiChangeConfirmed}
          personalMeetingId={personalMeetingId}
          switchUsePersonalMeetingId={switchUsePersonalMeetingId}
          updateHasSettingsChanged={updateHasSettingsChanged}
          trackSettingChanges={trackSettingChanges}
          onPmiChangeClick={onPmiChangeClick}
          showScheduleOnBehalf={showScheduleOnBehalf}
          showSpinnerInConfigPanel={showSpinnerInConfigPanel}
          delegators={delegators}
          joinBeforeHostLabel={joinBeforeHostLabel}
          authUserTypeValue={authUserTypeValue}
          isJoinBeforeHostDisabled={isJoinBeforeHostDisabled}
          isMuteAudioDisabled={isMuteAudioDisabled}
          isTurnOffCameraDisabled={isTurnOffCameraDisabled}
          isAllowScreenSharingDisabled={isAllowScreenSharingDisabled}
          isAuthenticatedCanJoinDisabled={isAuthenticatedCanJoinDisabled}
          isWaitingRoomDisabled={isWaitingRoomDisabled}
          isRequirePasswordDisabled={isRequirePasswordDisabled}
          showIeSupportAlert={showIeSupportAlert}
          showRemoveMeetingWarning={showRemoveMeetingWarning}
          brandConfig={brandConfig}
        >
          {showTopic && (
            <Topic
              name={(meeting as RcVMeetingModel).name}
              updateMeetingTopic={(name) => {
                updateMeetingSettings({ name });
              }}
              currentLocale={currentLocale}
              ref={topicRef}
              defaultTopic={defaultTopic}
            />
          )}
        </VideoConfig>
      )}
      {(isRCM || isRCV) && ScheduleButton && (
        <ScheduleButton
          currentLocale={currentLocale}
          disabled={disabled}
          meeting={meeting}
          // @ts-expect-error TS(2322): Type '(() => any) | undefined' is not assignable t... Remove this comment to see the full error message
          onOK={onOK}
          onClick={async () => {
            if (!disabled) {
              await sleep(100);
              const opener = openNewWindow && isSafari() ? window.open() : null;
              const meetingSetting = isRCM
                ? {
                    ...meeting,
                    // @ts-expect-error TS(2339): Property 'topic' does not exist on type 'RcMMeetin... Remove this comment to see the full error message
                    topic: useRcmV2 ? topicRef.current?.value : meeting.topic,
                  }
                : {
                    ...meeting,
                    name: topicRef.current?.value,
                  };
              // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
              await schedule(meetingSetting, opener);
            }
          }}
          update={updateMeetingSettings}
          // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
          showSaveAsDefault={showSaveAsDefault}
          // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
          disableSaveAsDefault={disableSaveAsDefault}
          // @ts-expect-error TS(2322): Type '(() => any) | undefined' is not assignable t... Remove this comment to see the full error message
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
  showTopic: true,
  showDuration: true,
  showRecurringMeeting: true,
  openNewWindow: true,
  meetingOptionToggle: false,
  passwordPlaceholderEnable: false,
  audioOptionToggle: false,
  onOK: undefined,
  scheduleButton: undefined,
  showRcvAdminLock: false,
  showPmiConfirm: false,
  showWaitingRoom: false,
  showE2EE: false,
  isE2EEDisabled: false,
  isWaitingRoomNotCoworkerDisabled: false,
  isWaitingRoomGuestDisabled: false,
  isWaitingRoomAllDisabled: false,
  isAuthUserTypeDisabled: false,
  isWaitingRoomTypeDisabled: false,
  isSignedInUsersDisabled: false,
  isSignedInCoWorkersDisabled: false,
  enablePersonalMeeting: false,
  isPmiChangeConfirmed: false,
  showSaveAsDefault: true,
  disableSaveAsDefault: false,
  showCustom: false,
  showLaunchMeetingBtn: false,
  appCode: '',
  scheduleButtonLabel: '',
  personalMeetingId: undefined,
  showSpinner: false,
  useRcmV2: false,
  labelPlacement: 'start',
  enableServiceWebSettings: false,
  recurringMeetingPosition: 'middle',
};

export { GenericMeetingPanel };
