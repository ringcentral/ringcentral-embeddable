import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import formatDuration from 'ringcentral-widgets/lib/formatDuration';
import PlayIcon from 'ringcentral-widgets/assets/images/Play.svg';

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
}) {
  const recording = recordings && recordings[0]
  const recodingContent = recording && recording.metadata ? (
    <div className={classnames(styles.item, styles.recording)}>
      <PlayIcon width={18} height={18} />
      <span className={styles.duration}>{formatDuration(recording.metadata.duration)}</span>
    </div>
  ) : null;

  const hostContent = hostInfo ? (
    <div className={styles.item}>
      {i18n.getString('host', currentLocale)}: {hostInfo.displayName}
    </div>
  ) : null;

  return (
    <div
      className={classnames(styles.root, recording && onClick ? styles.clickable : '')}
      onClick={() => {
        recording && onClick(id)
      }}
    >
      <div className={classnames(styles.item, styles.subject)}>
        {displayName}
      </div>
      {recodingContent}
      {hostContent}
      <div className={styles.item}>
        {dateTimeFormatter(startTime)}
      </div>
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
};

MeetingItem.defaultProps = {
  isRecording: false,
  duration: undefined,
  onClick: undefined,
};
