import React, { Component } from 'react';
import classnames from 'classnames';

import Spinner from 'ringcentral-widgets/components/Spinner';
import { RcOutlineTextField, RcBoxSelect, RcMenuItem } from '@ringcentral-integration/rcui';

import searchSvg from '@ringcentral-integration/rcui/icons/icon-search.svg';

import MeetingItem from '../MeetingItem';
import styles from './styles.scss';

import i18n from './i18n';

interface IMeetingHistoryPanelProps {
  currentLocale: string;
  showSpinner: boolean;
  meetings: any[];
  fetchMeetings: () => any[];
  fetchNextPageMeetings: () => any[];
  cleanMettings: () => any[];
  dateTimeFormatter: (startTime: string) => string;
  onClick: () => void;
  onLog?: (meeting: any) => void;
  logTitle?: string;
  fetchingNextPage: boolean;
  type: string;
  updateType: (type: any) => void;
  searchText: string;
  updateSearchText: (type: any) => void;
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
    />
  ));
  const noResult = meetings.length === 0 ? (
     <div className={styles.noFound}>{i18n.getString('noFound', currentLocale)}</div>
  ) : null;
  return (
    <div>
      {list}
      {noResult}
    </div>
  )
}

export default class IMeetingHistoryPanel extends Component<IMeetingHistoryPanelProps, any> {
  static defaultProps = {
    showSpinner: false,
    fetchMeetings: () => {},
    fetchNextPageMeetings: () => {},
    cleanMettings: () => {},
    onClick: () => {},
  };

  private _meetingListBody: any;
  private _scrollTop: number;

  componentDidMount() {
    this.props.fetchMeetings();
  }

  componentWillUnmount() {}

  onScroll = () => {
    const totalScrollHeight = this._meetingListBody.scrollHeight;
    const { clientHeight } = this._meetingListBody;
    const currentScrollTop = this._meetingListBody.scrollTop;
    // load next page if scroll near buttom
    if (
      totalScrollHeight - this._scrollTop > clientHeight + 10 &&
      totalScrollHeight - currentScrollTop <= clientHeight + 10
    ) {
      this.props.fetchNextPageMeetings();
    }
    this._scrollTop = currentScrollTop;
  };

  render() {
    const {
      showSpinner,
      dateTimeFormatter,
      currentLocale,
      meetings,
      onClick,
      onLog,
      logTitle,
      fetchingNextPage,
      type,
      updateType,
      searchText,
      updateSearchText,
    } = this.props;
    let content;
    if (showSpinner) {
      content = (
        <div className={styles.spinnerContainer}>
          <Spinner />
        </div>
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
      <div className={styles.loading}>
        Loading
      </div>
    ) : null;
    return (
      <div
        className={classnames(styles.meetingContainer)}
        ref={(list) => {
          this._meetingListBody = list;
        }}
        onScroll={this.onScroll}
      >
        <div className={styles.header}>
          <div className={styles.input}>
            <RcOutlineTextField
              iconPosition="left"
              symbol={searchSvg}
              value={searchText}
              radiusType="rounded"
              size="small"
              onChange={(e) => {
                updateSearchText(e.target.value);
              }}
            />
          </div>
          <RcBoxSelect
            className={styles.typeSelect}
            size="default"
            value={type}
            renderValue={(value) => i18n.getString(value, currentLocale)}
            onChange={(e) => {
              updateType(e.target.value);
            }}
            classes={{
              root: styles.typeSelect,
            }}
          >
            <RcMenuItem value="all">{i18n.getString('all', currentLocale)}</RcMenuItem>
            <RcMenuItem value={'recordings'}>{i18n.getString('recordings', currentLocale)}</RcMenuItem>
          </RcBoxSelect>
        </div>
        {content}
        {loadingNextPageTip}
      </div>
    );
  }
}
