import React, { useState, useEffect, useRef } from 'react';
import { reduce } from 'ramda';
import {
  RcTextField,
  RcIconButton,
  RcDatePicker,
  RcTimePicker,
  RcMenuItem,
  RcLineSelect,
  RcExpansionPanel,
  RcExpansionPanelSummary,
  RcExpansionPanelDetails,
  RcFormGroup,
  RcSwitch,
  RcDatePickerSize,
  RcTimePickerSize,
} from '@ringcentral-integration/rcui';

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

export const VideoConfig: React.FunctionComponent<VideoConfigProps> = (
  props,
) => {
  const {
    currentLocale,
    meeting,
    updateMeetingSettings,
    recipientsSection,
    init,
    children,
    showWhen,
    showDuration,
    datePickerSize,
    timePickerSize,
    brandName,
    showHeader,
  } = props;
  const hoursList = getHoursList(HOUR_SCALE);
  const minutesList = getMinutesList(MINUTE_SCALE);
  const isRCBrand = brandName === 'RingCentral';
  useEffect(() => {
    if (typeof init === 'function') {
      init();
    }
  }, []);
  const header = showHeader ? (
    <div className={styles.title}>
      <h2>{i18n.getString('schedule', currentLocale)}</h2>
    </div>
  ) : null;
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
              size={datePickerSize}
              value={meeting.startTime}
              fullWidth
              onChange={(value) => {
                updateMeetingSettings({
                  ...meeting,
                  startTime: value,
                });
              }}
              format="MM/DD/YYYY"
              InputProps={{
                endAdornment: (
                  <RcIconButton variant="round" size="small" icon="event-new" />
                ),
              }}
            />
          </div>
        ) : null}
        {showWhen ? (
          <div className={styles.meetingSection}>
            <RcTimePicker
              fullWidth
              label={i18n.getString('startTime', currentLocale)}
              data-sign="startTime"
              value={meeting.startTime}
              size={timePickerSize}
              onChange={(value) => {
                updateMeetingSettings({
                  ...meeting,
                  startTime: value,
                });
              }}
              InputProps={{
                endAdornment: (
                  <RcIconButton variant="round" size="small" icon="event-new" />
                ),
              }}
            />
          </div>
        ) : null}
        {showDuration ? (
          <div className={styles.meetingSection}>
            <div className={styles.hourDuration}>
              <RcLineSelect
                size="small"
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
          >
            <RcExpansionPanelSummary
              classes={{
                root: styles.expansionPanelSummary,
                content: styles.expansionPanelSummaryContent,
              }}
              expandIcon={<RcIconButton variant="round" icon="arrow_down" />}
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
                  }}
                />
                <RcSwitch
                  data-sign="requirePassword"
                  checked={meeting.isMeetingSecret}
                  onChange={() => {
                    updateMeetingSettings({
                      ...meeting,
                      isMeetingSecret: !meeting.isMeetingSecret,
                    });
                  }}
                  label={i18n.getString('requirePassword', currentLocale)}
                  formControlLabelProps={{
                    classes: { root: styles.labelPlacementStart },
                  }}
                />
                {
                  meeting.isMeetingSecret ? (
                    <RcTextField
                      placeholder={i18n.getString('password', currentLocale)}
                      data-sign="password"
                      fullWidth
                      value={meeting.meetingPassword}
                      inputProps={{
                        maxLength: 255,
                      }}
                      onChange={(e) => {
                        updateMeetingSettings({
                          ...meeting,
                          meetingPassword: e.target.value,
                        });
                      }}
                      classes={{
                        root: styles.inputArea,
                      }}
                    />
                  ) : null
                }
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
  }, [name]);
  return (
    <RcTextField
      ref={topicRef}
      // size="small"
      label={i18n.getString('topic', currentLocale)}
      data-sign="topic"
      fullWidth
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
  datePickerSize: 'small',
  timePickerSize: 'small',
};

interface VideoConfigProps {
  currentLocale: string;
  datePickerSize?: RcDatePickerSize;
  timePickerSize?: RcTimePickerSize;
  meeting: RcVMeetingModel;
  updateMeetingSettings: any;
  recipientsSection?: React.ReactNode;
  showWhen?: boolean;
  showDuration?: boolean;
  brandName: string;
  init: () => any;
  showHeader: boolean;
}
