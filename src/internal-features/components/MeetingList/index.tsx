import React, { Component } from 'react';
import classnames from 'classnames';

import Spinner from 'ringcentral-widgets/components/Spinner';
import MeetingItem from '../MeetingItem';
import styles from './styles.scss';

interface IMeetingListProps {
  currentLocale: string;
  showSpinner: boolean;
  meetings: any[];
  fetchMeetings: () => any[];
  fetchNextPageMeetings: () => any[];
  cleanMettings: () => any[];
  dateTimeFormatter: (startTime: string) => string;
  onClick: () => void;
}

export default class MeetingList extends Component<IMeetingListProps, any> {
  static defaultProps = {
    showSpinner: false,
    fetchMeetings: () => {},
    fetchNextPageMeetings: () => {},
    cleanMettings: () => {},
    onClick: () => {},
  };

  private _mounted: boolean;
  private _meetingListBody: any;
  private _scrollTop: number;

  constructor(props) {
    super(props);
    this.state = {
      fetching: false,
      loadingNextPage: false,
    };
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;
    this.loadMeetings();
  }

  componentWillUnmount() {
    this._mounted = false;
    this.props.cleanMettings();
  }

  async loadMeetings() {
    const { fetchMeetings } = this.props;
    this.setState({
      fetching: true,
    });
    try {
      await fetchMeetings();
      if (!this._mounted) {
        return;
      }
      this.setState({
        fetching: false,
      });
    } catch (e) {
      console.error(e);
      this.setState({
        fetching: false,
      });
    }
  }

  async loadNextPageMeetings() {
    const { fetchNextPageMeetings } = this.props;
    if (this.state.loadingNextPage) {
      return;
    }
    this.setState({
      loadingNextPage: true,
    });
    try {
      await fetchNextPageMeetings();
      if (!this._mounted) {
        return;
      }
      this.setState({
        loadingNextPage: false,
      });
    } catch (e) {
      console.error(e);
      this.setState({
        loadingNextPage: false,
      });
    }
  }

  onScroll = () => {
    const totalScrollHeight = this._meetingListBody.scrollHeight;
    const { clientHeight } = this._meetingListBody;
    const currentScrollTop = this._meetingListBody.scrollTop;
    // load next page if scroll near buttom
    if (
      totalScrollHeight - this._scrollTop > clientHeight + 10 &&
      totalScrollHeight - currentScrollTop <= clientHeight + 10
    ) {
      this.loadNextPageMeetings();
    }
    this._scrollTop = currentScrollTop;
  };

  render() {
    const { showSpinner } = this.props;
    const { fetching, loadingNextPage } = this.state;
    const isLoading = showSpinner || fetching;
    if (isLoading) {
      return (
        <div className={classnames(styles.meetingContainer)}>
          <div className={styles.spinnerContainer}>
            <Spinner />
          </div>
        </div>
      );
    }
    const loadingNextPageTip = loadingNextPage ? (
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
        {this._renderMeetingsContent()}
        {loadingNextPageTip}
      </div>
    );
  }

  private _renderMeetingsContent() {
    const { fetching } = this.state;
    const { dateTimeFormatter, currentLocale, meetings, onClick } = this.props;
    if (!fetching && meetings.length === 0) {
      return null;
    }
    return meetings.map((meeting) => (
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
      />
    ));
  }
}
