import React from 'react';
import PropTypes from 'prop-types';

import CopyToClipboard from 'ringcentral-widgets/components/CopyToClipboard';
import Modal from 'ringcentral-widgets/components/Modal';

import i18n from 'ringcentral-widgets/components/AlertRenderer/MeetingAlert/i18n';
import meetingStatus from 'ringcentral-integration/modules/Meeting/meetingStatus';

import styles from './styles.scss';

export default function MeetingInviteModal({
  show,
  meetingString,
  currentLocale,
  onClose,
}) {
  return (
    <Modal
      show={show}
      onClose={onClose}
      onCancel={onClose}
      clickOutToClose
      showCloseBtn
      showTitle
      title={i18n.getString(meetingStatus.scheduledSuccess, currentLocale)}
    >
      <span
        className={styles.copiedText}
      >
        {meetingString}
      </span>
      <div className={styles.copyButtonContainer}>
        <CopyToClipboard
          copiedText={meetingString}
          currentLocale={currentLocale}
          buttonClassName={styles.copyButton}
        />
      </div>
    </Modal>
  );
}

MeetingInviteModal.propTypes = {
  show: PropTypes.bool.isRequired,
  meetingString: PropTypes.string,
  currentLocale: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

MeetingInviteModal.defaultProps = {
  meetingString: '',
};
