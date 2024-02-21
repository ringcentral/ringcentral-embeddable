import React, { useRef, useEffect } from 'react';

import {
  RcCircularProgress,
  RcTypography,
  RcList,
  styled,
} from '@ringcentral/juno';

import { SearchLine } from '../SearchLine';
import MeetingItem from '../MeetingItem';

import i18n from './i18n';

const StyledContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  position: relative;
`;

const StyledNoFound = styled(RcTypography)`
  margin-top: 50px;
  text-align: center;
`;

const SpinnerContainer = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  margin-top: -20px;
  margin-left: -20px;
  width: 40px;
  height: 40px;
`;

const LoadingNext = styled(RcTypography)`
  text-align: center;
  line-height: 40px;
  font-size: 14px;
`;

interface IMeetingHistoryPanelProps {
  currentLocale: string;
  showSpinner: boolean;
  meetings: any[];
  fetchMeetings: (type) => any[];
  fetchNextPageMeetings: (type) => any[];
  dateTimeFormatter: (startTime: string) => string;
  onClick: () => void;
  onLog?: (meeting: any) => void;
  logTitle?: string;
  fetchingNextPage: boolean;
  type: string;
  searchText: string;
  updateSearchText: (searchText: string, type: string) => void;
}

function MeetingList({
  dateTimeFormatter,
  currentLocale,
  meetings,
  onClick,
  onLog,
  logTitle,
}) {
  const list = meetings.map((meeting) => (
    <MeetingItem
      key={meeting.id}
      displayName={meeting.displayName}
      hostInfo={meeting.hostInfo}
      startTime={meeting.startTime}
      currentLocale={currentLocale}
      dateTimeFormatter={dateTimeFormatter}
      recordings={meeting.recordings}
      onClick={onClick}
      id={meeting.id}
      onLog={() => {
        onLog(meeting);
      }}
      showLog={!!onLog}
      logTitle={logTitle}
      duration={meeting.duration}
    />
  ));
  if (meetings.length === 0) {
    return (
      <StyledNoFound variant="body1">{i18n.getString('noFound', currentLocale)}</StyledNoFound>
    );
  }
  return (
    <RcList>
      {list}
    </RcList>
  );
}

export default function MeetingHistoryPanel({
  currentLocale,
  showSpinner = false,
  meetings,
  fetchMeetings,
  fetchNextPageMeetings,
  dateTimeFormatter,
  onClick,
  onLog,
  logTitle,
  fetchingNextPage,
  searchText,
  updateSearchText,
  type
}: IMeetingHistoryPanelProps) {
  const meetingListBody = useRef(null);
  const scrollTop = useRef(0);

  useEffect(() => {
    fetchMeetings(type);
  }, [type]);

  const onScroll = () => {
    const totalScrollHeight = meetingListBody.current.scrollHeight;
    const { clientHeight } = meetingListBody.current;
    const currentScrollTop = meetingListBody.current.scrollTop;
    // load next page if scroll near buttom
    if (
      totalScrollHeight - scrollTop.current > clientHeight + 10 &&
      totalScrollHeight - currentScrollTop <= clientHeight + 10
    ) {
      fetchNextPageMeetings(type);
    }
    scrollTop.current = currentScrollTop;
  };

  let content;

  if (showSpinner) {
    content = (
      <SpinnerContainer>
        <RcCircularProgress size={35} />
      </SpinnerContainer>
    );
  } else {
    content = (
      <MeetingList
        dateTimeFormatter={dateTimeFormatter}
        currentLocale={currentLocale}
        meetings={meetings}
        onClick={onClick}
        onLog={onLog}
        logTitle={logTitle}
      />
    );
  }

  const loadingNextPageTip = fetchingNextPage ? (
    <LoadingNext>
      {i18n.getString('loading', currentLocale)}
    </LoadingNext>
  ) : null;
  return (
    <StyledContainer
      ref={meetingListBody}
      onScroll={onScroll}
    >
      <SearchLine
        onSearchInputChange={(e) => {
          updateSearchText(e.target.value, type);
        }}
        searchInput={searchText}
        disableLinks={false}
        placeholder={i18n.getString('search', currentLocale)}
      />
      {content}
      {loadingNextPageTip}
    </StyledContainer>
  );
}
