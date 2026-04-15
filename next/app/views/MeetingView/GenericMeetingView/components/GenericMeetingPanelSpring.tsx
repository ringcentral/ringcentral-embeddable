import { AppFooterNav, AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Block, Skeleton, SkeletonContainer } from '@ringcentral/spring-ui';
import React, { useEffect, useState } from 'react';
import { usePromise } from 'react-use';

import {
  GenericMeetingPanelSpringProps,
  GenericMeetingPanelSpringFunctions,
} from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/GenericMeetingView.view.interface';
import i18n from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/i18n';

import { GeneralMeetingSettings } from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/GeneralMeetingSettings';
import {
  GeneralMeetingSettingsProps,
  GeneralMeetingSettingsFunctions,
} from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/GeneralMeetingSettings.interface';
import { MeetingConfigPanel } from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/MeetingConfigPanel';
import {
  MeetingConfigPanelProps,
  MeetingConfigPanelFunctions,
} from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/MeetingConfigPanel.interface';
import { PersonalMeetingSettingsSwitch } from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/PersonalMeetingSettingsSwitch';
import {
  PersonalMeetingSettingsSwitchProps,
  PersonalMeetingSettingsSwitchFunctions,
} from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring/components/PersonalMeetingSettingsSwitch.interface';

// Skeleton components for loading states
const MeetingConfigPanelSkeleton: React.FC = () => (
  <Block
    bordered
    borderRadius="small"
    padding
    className="w-full mx-auto"
    classes={{
      root: 'overflow-visible',
    }}
  >
    <div className="flex flex-col gap-4 w-full">
      {/* Meeting Title */}
      <div className="flex flex-col gap-1 w-full">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton variant="rectangular" className="w-full h-12" />
      </div>
      {/* Date */}
      <div className="flex flex-col gap-1">
        <Skeleton variant="text" className="w-16 h-4" />
        <Skeleton variant="rectangular" className="w-full h-12" />
      </div>
      {/* Time and Duration */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton variant="text" className="w-16 h-4" />
          <Skeleton variant="rectangular" className="w-full h-12" />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton variant="text" className="w-20 h-4" />
          <Skeleton variant="rectangular" className="w-full h-12" />
        </div>
      </div>
      {/* Schedule Button */}
      <Skeleton variant="rectangular" className="w-full h-12" />
    </div>
  </Block>
);

const GeneralMeetingSettingsSkeleton: React.FC = () => (
  <Block
    bordered
    borderRadius="small"
    padding
    className="w-full mx-auto"
    classes={{
      root: 'overflow-visible',
    }}
  >
    <div className="flex flex-col gap-4">
      {/* Require Password */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <Skeleton variant="text" className="w-32 h-5" />
          <Skeleton variant="text" className="w-48 h-4 mt-1" />
        </div>
        <Skeleton variant="rectangular" className="w-12 h-6" />
      </div>
      {/* Who Can Join */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <Skeleton variant="text" className="w-24 h-5" />
          <Skeleton variant="rectangular" className="w-full h-12 mt-1" />
        </div>
      </div>
      {/* Waiting Room */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <Skeleton variant="text" className="w-28 h-5" />
          <Skeleton variant="text" className="w-40 h-4 mt-1" />
        </div>
        <Skeleton variant="rectangular" className="w-12 h-6" />
      </div>
      {/* Start Meeting After Join */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <Skeleton variant="text" className="w-36 h-5" />
          <Skeleton variant="text" className="w-44 h-4 mt-1" />
        </div>
        <Skeleton variant="rectangular" className="w-12 h-6" />
      </div>
    </div>
  </Block>
);

const PersonalMeetingSettingsSwitchSkeleton: React.FC = () => (
  <Block
    bordered
    borderRadius="small"
    padding
    className="w-full mx-auto"
    classes={{
      root: 'overflow-visible',
    }}
  >
    <div className="flex flex-col gap-1">
      <div className="flex gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <Skeleton variant="text" className="w-40 h-5" />
          <Skeleton variant="text" className="w-56 h-4 mt-1" />
        </div>
        <div>
          <Skeleton variant="rectangular" className="w-12 h-6" />
        </div>
      </div>
    </div>
  </Block>
);

export const GenericMeetingPanelSpring: React.FC<
  GenericMeetingPanelSpringProps & GenericMeetingPanelSpringFunctions
> = (props) => {
  const { t } = useLocale(i18n);
  const {
    isPersonalMeetingEnabled,
    disabled,
    init,
    personalMeetingLink,
    onPersonalMeetingToggle,
    viewPersonalMeetingSettings,
    navigationState,
    onBackClick,
    isTab = false,
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const mounted = usePromise();

  useEffect(() => {
    if (init && navigationState !== '?from=personalMeetingSettings') {
      setIsLoading(true);
      mounted(init()).finally(() => {
        setIsLoading(false);
      });
    }
  }, [init, mounted]);

  // When personal meeting is enabled, disable the general meeting settings
  const generalSettingsDisabled = disabled || isPersonalMeetingEnabled;

  // Extract props for MeetingConfigPanel
  const meetingConfigPanelProps: MeetingConfigPanelProps = {
    meetingTitle: props.meetingTitle,
    meetingDate: props.meetingDate,
    meetingTime: props.meetingTime,
    meetingDuration: props.meetingDuration,
    hourOptions: props.hourOptions,
    minuteOptions: props.minuteOptions,
    disabled: props.disabled,
  };

  const meetingConfigPanelFunctions: MeetingConfigPanelFunctions = {
    onMeetingTitleChange: props.onMeetingTitleChange,
    onMeetingDateChange: props.onMeetingDateChange,
    onMeetingTimeChange: props.onMeetingTimeChange,
    onMeetingDurationChange: props.onMeetingDurationChange,
    onScheduleMeeting: props.onScheduleMeeting,
  };

  // Extract props for GeneralMeetingSettings
  const generalMeetingSettingsProps: GeneralMeetingSettingsProps = {
    requirePassword: props.requirePassword,
    meetingPassword: props.meetingPassword,
    whoCanJoin: props.whoCanJoin,
    useWaitingRoom: props.useWaitingRoom,
    waitingRoomParticipants: props.waitingRoomParticipants,
    startMeetingAfterJoin: props.startMeetingAfterJoin,
    whoCanJoinOptions: props.whoCanJoinOptions,
    waitingRoomOptions: props.waitingRoomOptions,
    disabled: generalSettingsDisabled,
    isJoinBeforeHostDisabled: props.isJoinBeforeHostDisabled,
    isWaitingRoomDisabled: props.isWaitingRoomDisabled,
    isWaitingRoomTypeDisabled: props.isWaitingRoomTypeDisabled,
    isAuthenticatedCanJoinDisabled: props.isAuthenticatedCanJoinDisabled,
    isAuthUserTypeDisabled: props.isAuthUserTypeDisabled,
    isRequirePasswordDisabled: props.isRequirePasswordDisabled,
    // Locked properties
    isRequirePasswordLocked: props.isRequirePasswordLocked,
    isJoinBeforeHostLocked: props.isJoinBeforeHostLocked,
    isWaitingRoomLocked: props.isWaitingRoomLocked,
    isAuthUserTypeLocked: props.isAuthUserTypeLocked,
    brandConfig: props.brandConfig,
  };

  const generalMeetingSettingsFunctions: GeneralMeetingSettingsFunctions = {
    onRequirePasswordChange: props.onRequirePasswordChange,
    onPasswordChange: props.onPasswordChange,
    onWhoCanJoinChange: props.onWhoCanJoinChange,
    onUseWaitingRoomChange: props.onUseWaitingRoomChange,
    onWaitingRoomParticipantsChange: props.onWaitingRoomParticipantsChange,
    onStartMeetingAfterJoinChange: props.onStartMeetingAfterJoinChange,
  };

  // Extract props for PersonalMeetingSettingsSwitch
  const personalMeetingSettingsSwitchProps: PersonalMeetingSettingsSwitchProps =
    {
      isPersonalMeetingEnabled,
      personalMeetingLink,
      disabled,
    };

  const personalMeetingSettingsSwitchFunctions: PersonalMeetingSettingsSwitchFunctions =
    {
      onPersonalMeetingToggle,
      viewPersonalMeetingSettings,
    };

  return (
    <>
      {isTab ? (
        <AppHeaderNav title={t('video')}>{null}</AppHeaderNav>
      ) : (
        <AppHeaderNav override>
          <PageHeader onBackClick={onBackClick}>
            {t('scheduleMeeting')}
          </PageHeader>
        </AppHeaderNav>
      )}
      <div
        className="flex flex-col flex-auto overflow-y-auto overflow-x-hidden px-3 py-3 gap-3"
        data-sign="videoConfigsPanel"
      >
        {isLoading ? (
          <SkeletonContainer data-sign="videoConfigsPanelSkeleton">
            <MeetingConfigPanelSkeleton />
            <GeneralMeetingSettingsSkeleton />
            <PersonalMeetingSettingsSwitchSkeleton />
          </SkeletonContainer>
        ) : (
          <>
            <MeetingConfigPanel
              {...meetingConfigPanelProps}
              {...meetingConfigPanelFunctions}
            />
            <GeneralMeetingSettings
              {...generalMeetingSettingsProps}
              {...generalMeetingSettingsFunctions}
            />
            <PersonalMeetingSettingsSwitch
              {...personalMeetingSettingsSwitchProps}
              {...personalMeetingSettingsSwitchFunctions}
            />
          </>
        )}
      </div>
      {!isTab && <AppFooterNav />}
    </>
  );
};
