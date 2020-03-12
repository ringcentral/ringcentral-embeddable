import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import PlayIcon from 'ringcentral-widgets/assets/images/Play.svg';

import styles from './styles.scss';
import i18n from './i18n';

export default function MeetingItem({
  subject,
  isRecording,
  duration,
  hostInfo,
  startTime,
  onClick,
  currentLocale,
  dateTimeFormatter,
}) {
  const recodingContent = isRecording ? (
    <div className={classnames(styles.item, styles.recording)}>
      <PlayIcon width={18} height={18} />
      <span className={styles.duration}>{duration}s</span>
    </div>
  ) : null;

  const hostContent = hostInfo ? (
    <div className={styles.item}>
      {i18n.getString('host', currentLocale)}: {hostInfo.displayName}
    </div>
  ) : null;

  return (
    <div
      className={classnames(styles.root, onClick ? styles.clickable : '')}
      onClick={onClick}
    >
      <div className={classnames(styles.item, styles.subject)}>
        {subject}
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
  subject: PropTypes.string.isRequired,
  isRecording: PropTypes.boolean,
  hostInfo: PropTypes.object.isRequired,
  startTime: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
  duration: PropTypes.number,
  onClick: PropTypes.func,
  dateTimeFormatter: PropTypes.func.isRequired,
};

MeetingItem.defaultProps = {
  isRecording: false,
  duration: undefined,
  onClick: undefined,
};
