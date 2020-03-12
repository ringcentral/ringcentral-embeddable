
import React, { useState } from 'react';
import { RcFabIconButton } from '@ringcentral-integration/rcui';
import classnames from 'classnames';
import Modal from 'ringcentral-widgets/components/Modal';
import TextInput from 'ringcentral-widgets/components/TextInput';

import noResult from '!url-loader!./noResult.svg';
import styles from './styles.scss';

const MeetingHomePanel = (props) => {
  const { gotoSchedule, recents, onStart, currentLocale, onJoin } = props;
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  return (
    <div className={styles.root}>
      <div className={styles.buttons}>
        <div className={styles.button} onClick={gotoSchedule}>
          <RcFabIconButton
            icon='schedule'
            size='medium'
            color={['accent', 'tomato']}
            className={classnames(styles.iconButton, styles.schedule)}
          />
          <label>Schedule</label>
        </div>
        <div className={styles.button} onClick={onStart}>
          <RcFabIconButton
            icon='start'
            size='medium'
            color={['semantic', 'positive']}
            className={classnames(styles.iconButton, styles.start)}
          />
          <label>Start</label>
        </div>
        <div className={styles.button} onClick={() => setShowJoinModal(true)}>
          <RcFabIconButton
            icon='join'
            size='medium'
            color={['primary', 'light']}
            className={classnames(styles.iconButton, styles.join)}
          />
          <label>Join</label>
        </div>
      </div>
      <div className={styles.content}>
        {
          recents.length === 0 ? (
            <div className={styles.noResult}>
              <img src={noResult} className={styles.noResultImg} />
              <div>You have no upcoming meetings</div>
            </div>
          ) : null
        }
      </div>
      <Modal
        currentLocale={currentLocale}
        title='Join a meeting'
        show={showJoinModal}
        onCancel={() => setShowJoinModal(false)}
        textConfirm="Join"
        onConfirm={() => {
          onJoin(meetingId)
        }}
      >
        <TextInput
          className={styles.meetingInput}
          placeholder="Enter meeting ID or meeting link"
          onChange={(e) => { setMeetingId(e.currentTarget.value); }}
          value={meetingId}
        />
      </Modal>
    </div>
  );
}

export { MeetingHomePanel };
