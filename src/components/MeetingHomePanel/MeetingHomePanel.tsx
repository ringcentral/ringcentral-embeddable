
import React, { useState, useEffect } from 'react';
import {
  RcIconButton,
  RcCircularProgress,
  RcTypography,
  RcTooltip,
  styled,
  palette2,
} from '@ringcentral/juno';

import { ScheduleMeeting, StartMeeting, JoinMeeting } from '@ringcentral/juno-icon';

import UpcomingMeetingList from '../UpcomingMeetingList';
import { JoinDialog } from './JoinDialog';
import NoResultSvg from './noResult.svg';
import i18n from './i18n';

const Root = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  box-sizing: border-box;
  padding: 24px 16px 16px 16px;
  align-items: flex-start;
  justify-content: space-around;
`;

const StyledButton = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledButtonLabel = styled(RcTypography)`
  margin-top: 4px;
  font-size: 0.875rem;
  color: ${palette2('neutral', 'f06')};
`;

const StyledMeetingIconButton = styled(RcIconButton)`
  background: ${palette2('neutral', 'b02')};
  border-radius: 16px;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 30px;
`;

const NoResult = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NoResultSvgWrapper = styled.div`
  height: 114px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
`;

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
      <SpinnerContainer>
        <RcCircularProgress size={35} />
      </SpinnerContainer>
    );
  } else if (upcomingMeetings && upcomingMeetings.length > 0) {
    upcomingMeetingContent = (
      <UpcomingMeetingList
        meetings={upcomingMeetings}
        currentLocale={currentLocale}
        onJoin={onJoin}
      />
    );
  } else {
    upcomingMeetingContent = (
      <NoResult>
        <NoResultSvgWrapper>
          <NoResultSvg height={114} width={640} />  
        </NoResultSvgWrapper>
        <RcTypography variant="body1" color="neutral.f06">
          {i18n.getString('noUpcomingMeeting', currentLocale)}
        </RcTypography>
      </NoResult>
    );
  }
  return (
    <Root>
      <StyledButtonGroup>
        <RcTooltip title={i18n.getString('startDescription', currentLocale)}>
          <StyledButton>
            <StyledMeetingIconButton
              symbol={StartMeeting}
              onClick={onStart}
              size="xlarge"
              color="action.primary"
              variant="round"
            />
            <StyledButtonLabel variant="body1">
              {i18n.getString('start', currentLocale)}
            </StyledButtonLabel>
          </StyledButton> 
        </RcTooltip>
        <RcTooltip title={i18n.getString('scheduleDescription', currentLocale)}>
          <StyledButton>
            <StyledMeetingIconButton
              symbol={ScheduleMeeting}
              onClick={gotoSchedule}
              size="xlarge"
              color="action.primary"
              variant="round"
            />
            <StyledButtonLabel variant="body1">
              {i18n.getString('schedule', currentLocale)}
            </StyledButtonLabel>
          </StyledButton>
        </RcTooltip>
        <RcTooltip title={i18n.getString('joinDescription', currentLocale)}>
          <StyledButton>
            <StyledMeetingIconButton
              symbol={JoinMeeting}
              onClick={() => setShowJoinModal(true)}
              size="xlarge"
              color="action.primary"
              variant="round"
            />
            <StyledButtonLabel variant="body1">
              {i18n.getString('join', currentLocale)}
            </StyledButtonLabel>
          </StyledButton>
        </RcTooltip>
      </StyledButtonGroup>
      <Content>
        {upcomingMeetingContent}
      </Content>
      <JoinDialog
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={() => {
          onJoin(meetingId)
        }}
        meetingId={meetingId}
        onMeetingIdChange={(e) => setMeetingId(e.target.value)}
        currentLocale={currentLocale}
      />
    </Root>
  );
}

export { MeetingHomePanel };
