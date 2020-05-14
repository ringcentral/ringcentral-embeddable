import {
  RcDatePicker,
  RcExpansionPanel,
  RcExpansionPanelDetails,
  RcExpansionPanelSummary,
  RcFormGroup,
  RcIconButton,
  RcLineSelect,
  RcMenuItem,
  RcSwitch,
  RcTextField,
  RcTimePicker,
} from '@ringcentral-integration/rcui';
import arrowDownSvg from '@ringcentral-integration/rcui/icons/icon-arrow_down.svg';
import eventNewSvg from '@ringcentral-integration/rcui/icons/icon-event-new.svg';
import { reduce } from 'ramda';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'ringcentral-widgets/lib/reactHooks';

import { RcVMeetingModel } from '../../models/rcv.model';
import i18n from './i18n';
import styles from './styles.scss';

export const MINUTE_SCALE = 4;
export const HOUR_SCALE = 13;

function getMinutesList(MINUTE_SCALE) {
  return reduce(
    (result) => {
      const index = result.length;
      const value = (60 / MINUTE_SCALE) * index;
      const text = `${`${value}0`.slice(0, 2)} min`;
      return result.concat({
        value,
        text,
      });
    },
    [],
    new Array(MINUTE_SCALE),
  );
}

function getHoursList(HOUR_SCALE) {
  if (HOUR_SCALE > 23) {
    throw new Error('HOUR_SCALE must be less than 23.');
  }
  return reduce(
    (result) => {
      const value = result.length;
      const text = `${`0${value}0`.slice(-3, -1)} hr`;
      return result.concat({
        value,
        text,
      });
    },
    [],
    new Array(HOUR_SCALE),
  );
}

function getHelperTextForPasswordField(
  meeting: RcVMeetingModel,
  currentLocale: string,
): string {
  if (!meeting.meetingPassword) {
    return i18n.getString('passwordEmptyError', currentLocale);
  }
  if (!meeting.isMeetingPasswordValid) {
    return i18n.getString('passwordInvalidError', currentLocale);
  }
  return i18n.getString('passwordHintText', currentLocale);
}

interface VideoConfigProps {
  currentLocale: string;
  meeting: RcVMeetingModel;

  updateMeetingSettings: (meeting: RcVMeetingModel) => void;
  validatePasswordSettings: (password: string, isSecret: boolean) => boolean;

  recipientsSection?: React.ReactNode;
  showWhen?: boolean;
  showDuration?: boolean;
  brandName: string;
  init: () => any;
  personalMeetingId?: string;
  datePickerSize?: string;
  timePickerSize?: string;
  showHeader?: boolean;
}

export const VideoConfig: React.FunctionComponent<VideoConfigProps> = (
  props,
) => {
  const {
    currentLocale,
    meeting,
    updateMeetingSettings,
    validatePasswordSettings,
    recipientsSection,
    init,
    children,
    showWhen,
    showDuration,
    brandName,
    showHeader,
    personalMeetingId,
    datePickerSize,
    timePickerSize,
  } = props;
  const hoursList = getHoursList(HOUR_SCALE);
  const minutesList = getMinutesList(MINUTE_SCALE);
  const isRCBrand = brandName === 'RingCentral';

  const [meetingPassword, setMeetingPassword] = useState<string>(
    meeting.meetingPassword,
  );
  useEffect(() => {
    setMeetingPassword(meeting.meetingPassword);
  }, [meeting.meetingPassword]);

  const debouncedPassword = useDebounce<string>(meetingPassword, 200);
  useEffect(() => {
    const isMeetingPasswordValid = validatePasswordSettings(
      debouncedPassword,
      meeting.isMeetingSecret,
    );
    updateMeetingSettings({
      ...meeting,
      meetingPassword: debouncedPassword,
      isMeetingPasswordValid,
    });
  }, [debouncedPassword]);

  useEffect(() => {
    if (init) {
      init();
    }
  }, []);
  const header = showHeader ? (
    <div className={styles.title}>
      <h2>{i18n.getString('schedule', currentLocale)}</h2>
    </div>
  ) : null;

  const startTime = useMemo(() => {
    return new Date(meeting.startTime);
  }, [meeting.startTime]);

  const meetingSettingsPanelExpandable = false;

  return (
    <div className={styles.videoConfig}>
      {header}
      <div className={styles.meetingContent}>
        <div className={styles.meetingSection}>{children}</div>
        {recipientsSection ? (
          <div className={styles.meetingSection}>{recipientsSection}</div>
        ) : null}
        {showWhen ? (
          <div className={styles.meetingSection}>
            <RcDatePicker
              label={i18n.getString('date', currentLocale)}
              data-sign="date"
              date={startTime}
              fullWidth
              size={datePickerSize}
              onChange={(value) => {
                updateMeetingSettings({
                  ...meeting,
                  startTime: value,
                });
              }}
              formatString="MM/DD/YYYY"
              InputProps={{
                endAdornment: (
                  <RcIconButton
                    variant="round"
                    size="small"
                    symbol={eventNewSvg}
                  />
                ),
              }}
            />
          </div>
        ) : null}
        {showWhen ? (
          <div className={styles.meetingSection}>
            <RcTimePicker
              fullWidth
              size={timePickerSize}
              label={i18n.getString('startTime', currentLocale)}
              data-sign="startTime"
              value={startTime}
              onChange={(value) => {
                updateMeetingSettings({
                  ...meeting,
                  startTime: new Date(value),
                });
              }}
              InputProps={{
                endAdornment: (
                  <RcIconButton
                    variant="round"
                    size="small"
                    symbol={eventNewSvg}
                  />
                ),
              }}
            />
          </div>
        ) : null}
        {showDuration ? (
          <div className={styles.meetingSection}>
            <div className={styles.hourDuration}>
              <RcLineSelect
                // size="small"
                data-sign="durationHour"
                value={Math.floor(meeting.duration / 60)}
                onChange={(e) => {
                  const value = +e.target.value;
                  const restMinutes = Math.floor(meeting.duration % 60);
                  const durationInMinutes = value * 60 + restMinutes;
                  updateMeetingSettings({
                    ...meeting,
                    duration: durationInMinutes,
                  });
                }}
                classes={{
                  root: styles.select,
                }}
                className={styles.select}
                label={i18n.getString('duration', currentLocale)}
              >
                {hoursList.map((item, i) => (
                  <RcMenuItem
                    key={i}
                    value={item.value}
                    data-sign={`option${i}`}
                  >
                    {item !== null ? item.text : 'defaultValue'}
                  </RcMenuItem>
                ))}
              </RcLineSelect>
            </div>
            <div className={styles.minuteDuration}>
              <RcLineSelect
                data-sign="durationMinute"
                required
                value={Math.floor(meeting.duration % 60)}
                onChange={(e) => {
                  const value = +e.target.value;
                  const restHours = Math.floor(meeting.duration / 60);
                  const isMax = restHours === hoursList.slice(-1)[0].value;
                  const minutes = isMax ? 0 : value;
                  const durationInMinutes = restHours * 60 + minutes;
                  updateMeetingSettings({
                    ...meeting,
                    duration: durationInMinutes,
                  });
                }}
                classes={{
                  root: styles.select,
                }}
              >
                {minutesList.map((item, i) => (
                  <RcMenuItem
                    key={i}
                    value={item.value}
                    data-sign={`option${i}`}
                  >
                    {item !== null ? item.text : 'defaultValue'}
                  </RcMenuItem>
                ))}
              </RcLineSelect>
            </div>
          </div>
        ) : null}
        <div className={styles.meetingSettings}>
          <RcExpansionPanel
            classes={{
              root: styles.expansionPanel,
              expanded: styles.expansionPanelExpanded,
            }}
            defaultExpanded
            disabled={!meetingSettingsPanelExpandable}
          >
            <RcExpansionPanelSummary
              classes={{
                root: styles.expansionPanelSummary,
                content: styles.expansionPanelSummaryContent,
                disabled: meetingSettingsPanelExpandable
                  ? null
                  : styles.expansionPanelSummaryDisabled,
              }}
              expandIcon={
                meetingSettingsPanelExpandable ? (
                  <RcIconButton variant="round" symbol={arrowDownSvg} />
                ) : null
              }
              data-sign="expansionSummary"
            >
              {i18n.getString(
                isRCBrand ? 'rcMeetingSettings' : 'meetingSettings',
                currentLocale,
              )}
            </RcExpansionPanelSummary>
            <RcExpansionPanelDetails
              classes={{
                root: styles.expansionPanelDetails,
              }}
              date-sign="expansionDetails"
            >
              <RcFormGroup
                classes={{
                  root: styles.toggleGroup,
                }}
              >
                {personalMeetingId ? (
                  <RcSwitch
                    data-sign="usePersonalMeetingId"
                    checked={meeting.usePersonalMeetingId}
                    onChange={() => {
                      updateMeetingSettings({
                        ...meeting,
                        usePersonalMeetingId: !meeting.usePersonalMeetingId,
                      });
                    }}
                    label={
                      <div>
                        <div>
                          {i18n.getString(
                            'usePersonalMeetingId',
                            currentLocale,
                          )}
                        </div>
                        <div className={styles.personMeetingInfo}>
                          {personalMeetingId}
                        </div>
                      </div>
                    }
                    formControlLabelProps={{
                      classes: { root: styles.labelPlacementStart },
                      labelPlacement: 'start',
                    }}
                  />
                ) : null}
                <RcSwitch
                  data-sign="requirePassword"
                  checked={meeting.isMeetingSecret}
                  onChange={() => {
                    const next = !meeting.isMeetingSecret;
                    updateMeetingSettings({
                      ...meeting,
                      isMeetingSecret: next,
                    });
                  }}
                  label={i18n.getString('requirePassword', currentLocale)}
                  formControlLabelProps={{
                    classes: { root: styles.labelPlacementStart },
                    labelPlacement: 'start',
                  }}
                />
                {meeting.isMeetingSecret ? (
                  <div className={styles.inputArea}>
                    <RcTextField
                      error={!meeting.isMeetingPasswordValid}
                      helperText={getHelperTextForPasswordField(
                        meeting,
                        currentLocale,
                      )}
                      placeholder={i18n.getString('setPassword', currentLocale)}
                      data-sign="password"
                      fullWidth
                      clearBtn={false}
                      value={meetingPassword}
                      inputProps={{
                        maxLength: 255,
                      }}
                      onChange={(e) => {
                        const password = e.target.value;
                        if (/^[A-Za-z0-9]{0,10}$/.test(password)) {
                          setMeetingPassword(password);
                        }
                      }}
                    />
                  </div>
                ) : null}
                <RcSwitch
                  data-sign="allowJoinBeforeHost"
                  checked={meeting.allowJoinBeforeHost}
                  onChange={() => {
                    updateMeetingSettings({
                      ...meeting,
                      allowJoinBeforeHost: !meeting.allowJoinBeforeHost,
                    });
                  }}
                  label={i18n.getString('joinBeforeHost', currentLocale)}
                  formControlLabelProps={{
                    classes: { root: styles.labelPlacementStart },
                    labelPlacement: 'start',
                  }}
                />
                <RcSwitch
                  data-sign="muteAudio"
                  checked={meeting.muteAudio}
                  onChange={() => {
                    updateMeetingSettings({
                      ...meeting,
                      muteAudio: !meeting.muteAudio,
                    });
                  }}
                  label={i18n.getString('muteAudio', currentLocale)}
                  formControlLabelProps={{
                    classes: { root: styles.labelPlacementStart },
                    labelPlacement: 'start',
                  }}
                />
                <RcSwitch
                  data-sign="turnOffCamera"
                  checked={meeting.muteVideo}
                  onChange={() => {
                    updateMeetingSettings({
                      ...meeting,
                      muteVideo: !meeting.muteVideo,
                    });
                  }}
                  label={i18n.getString('turnOffCamera', currentLocale)}
                  formControlLabelProps={{
                    classes: { root: styles.labelPlacementStart },
                    labelPlacement: 'start',
                  }}
                />
              </RcFormGroup>
            </RcExpansionPanelDetails>
          </RcExpansionPanel>
        </div>
      </div>
    </div>
  );
};

const InnerTopic: React.FunctionComponent<{
  name: string;
  currentLocale: string;
  setTopicRef: (ref: any) => void;
  updateMeetingTopic: (name: string) => void;
}> = ({ name, currentLocale, setTopicRef, updateMeetingTopic }) => {
  const [topic, setTopic] = useState(name);
  const topicRef = useRef();
  useEffect(() => {
    setTopic(name);
    setTopicRef(topicRef);
  }, [name, setTopicRef]);
  return (
    <RcTextField
      innerRef={topicRef}
      // size="small"
      label={i18n.getString('topic', currentLocale)}
      data-sign="topic"
      fullWidth
      clearBtn={false}
      value={topic}
      inputProps={{
        maxLength: 255,
      }}
      onChange={(e) => {
        setTopic(e.target.value);
      }}
      onBlur={() => {
        updateMeetingTopic(topic);
      }}
      classes={{
        root: styles.input,
      }}
    />
  );
};

export const Topic = React.memo(
  InnerTopic,
  (prevProps, nextProps) => prevProps.name === nextProps.name,
);

VideoConfig.defaultProps = {
  recipientsSection: undefined,
  showWhen: true,
  showDuration: true,
  personalMeetingId: undefined,
  datePickerSize: 'medium',
  timePickerSize: 'medium',
  showHeader: true,
};
