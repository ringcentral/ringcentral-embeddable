import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import PlayIcon from '@ringcentral-integration/widgets/assets/images/Play.svg';
import LogIcon from '@ringcentral-integration/widgets/assets/images/MessagesLog.svg';

import styles from './styles.scss';
import i18n from './i18n';

export default function MeetingItem({
  displayName,
  hostInfo,
  startTime,
  onClick,
  currentLocale,
  dateTimeFormatter,
  recordings,
  id,
  onLog,
  showLog,
  logTitle,
}) {
  const recording = recordings && recordings[0]
  const recodingContent = recording && recording.metadata ? (
    <div
      className={classnames(styles.item, styles.recording)}
      onClick={() => {
        onClick(id)
      }}
    >
      <PlayIcon width={18} height={18} />
      <span className={styles.duration}>{formatDuration(recording.metadata.duration)}</span>
    </div>
  ) : null;

  const hostContent = hostInfo ? (
    <div className={styles.item}>
      {i18n.getString('host', currentLocale)}: {hostInfo.displayName}
    </div>
  ) : null;
  
  const logBtn = showLog ? (
    <div className={styles.logButton} onClick={onLog} title={logTitle}>
      <LogIcon className={styles.logIcon} />
    </div>
  ) :  null;
  return (
    <div
      className={classnames(styles.root)}
    >
      <div
        className={
          classnames(styles.item, styles.subject, recording && onClick ? styles.clickable : '')
        }
        onClick={() => {
          recording && onClick(id)
        }}
      >
        {displayName}
      </div>
      <div>
        {recodingContent}
        {hostContent}
        <div className={styles.item}>
          {dateTimeFormatter(startTime)}
        </div>
      </div>
      {logBtn}
    </div>
  );
}

MeetingItem.propsTypes = {
  displayName: PropTypes.string.isRequired,
  hostInfo: PropTypes.object.isRequired,
  startTime: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  dateTimeFormatter: PropTypes.func.isRequired,
  onPlayRecording: PropTypes.func,
  id: PropTypes.string.isRequired,
  onLog: PropTypes.func,
  showLog: PropTypes.bool,
  logTitle: PropTypes.string,
};

MeetingItem.defaultProps = {
  isRecording: false,
  duration: undefined,
  onClick: undefined,
  onLog: undefined,
  showLog: false,
  logTitle: ''
};
