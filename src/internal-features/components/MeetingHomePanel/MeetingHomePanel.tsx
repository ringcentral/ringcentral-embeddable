
import React, { useState, useEffect } from 'react';
import { RcFabIconButton } from '@ringcentral-integration/rcui';
import classnames from 'classnames';
import Modal from 'ringcentral-widgets/components/Modal';
import TextInput from 'ringcentral-widgets/components/TextInput';
import Spinner from 'ringcentral-widgets/components/Spinner';

import UpcomingMeetingList from '../UpcomingMeetingList';

import noResult from '!url-loader!./noResult.svg';
import styles from './styles.scss';

const MeetingHomePanel = (props) => {
  const {
    gotoSchedule,
    upcomingMeetings,
    onStart,
    currentLocale,
    onJoin,
    fetchUpcomingMeetings,
  } = props;
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [loadingUpcomingMeetings, setLoadingUpcomingMeetings] = useState(true);
  useEffect(() => {
    let mounted = true;
    setLoadingUpcomingMeetings(true);
    fetchUpcomingMeetings().then(() => {
      if (mounted) {
        setLoadingUpcomingMeetings(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
  let upcomingMeetingContent;
  if (loadingUpcomingMeetings) {
    upcomingMeetingContent = (
      <div className={styles.spinnerContainer}>
        <Spinner />
      </div>
    );
  } else if (upcomingMeetings.length > 0) {
    upcomingMeetingContent = (
      <UpcomingMeetingList
        className={styles.meetingList}
        meetings={upcomingMeetings}
        currentLocale={currentLocale}
        onJoin={onJoin}
      />
    );
  } else {
    upcomingMeetingContent = (
      <div className={styles.noResult}>
        <img src={noResult} className={styles.noResultImg} />
        <div>You have no upcoming meetings</div>
      </div>
    );
  }
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
        {upcomingMeetingContent}
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
