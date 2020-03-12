import React, { Component } from 'react';
import classnames from 'classnames';
import Spinner from 'ringcentral-widgets/components/Spinner';
import MeetingItem from '../MeetingItem';

import i18n from './i18n';
import styles from './styles.scss';

export default class RecordsList extends Component<RecordsListPropsType, any> {
  static defaultProps = {
    showSpinner: false,
    fetchRecordings: () => {},
    fetchNextPageRecordings: () => {},
    cleanRecordings: () => {},
  };

  private _mounted: boolean;
  private _recordingListBody: any;
  private _scrollTop: number;

  constructor(props) {
    super(props);
    this.state = {
      fetching: false,
    };
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;
    this.loadRecordings();
  }

  componentWillUnmount() {
    this._mounted = false;
    this.props.cleanRecordings();
  }

  async loadRecordings() {
    const { fetchRecordings } = this.props;
    this.setState({
      fetching: true,
    });
    try {
      await fetchRecordings();
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

  onPlayRecording(recording) {
    window.open(
      recording.downloadLink,
      recording.displayName,
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes',
    );
  }

  onScroll = () => {
    const totalScrollHeight = this._recordingListBody.scrollHeight;
    const { clientHeight } = this._recordingListBody;
    const currentScrollTop = this._recordingListBody.scrollTop;
    // load next page if scroll near buttom
    if (
      totalScrollHeight - this._scrollTop > clientHeight + 10 &&
      totalScrollHeight - currentScrollTop <= clientHeight + 10
    ) {
      if (typeof this.props.fetchNextPageRecordings === 'function') {
        this.props.fetchNextPageRecordings();
      }
    }
    this._scrollTop = currentScrollTop;
  };

  render() {
    const { showSpinner } = this.props;
    const { fetching } = this.state;
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
    return (
      <div
        className={classnames(styles.recordingContainer)}
        ref={(list) => {
          this._recordingListBody = list;
        }}
        onScroll={this.onScroll}
      >
        {this._renderRecordingContent()}
      </div>
    );
  }

  private _renderRecordingContent() {
    const { fetching } = this.state;
    const { dateTimeFormatter, currentLocale, recordings } = this.props;
    if (!fetching && recordings.length === 0) {
      return this._renderEmptyTip();
    }
    return recordings.map((recording) => (
      <MeetingItem
        key={recording.id}
        subject={recording.subject}
        isRecording
        duration={recording.duration}
        hostInfo={recording.hostInfo}
        startTime={recording.startTime}
        onClick={() => this.onPlayRecording(recording)}
        currentLocale={currentLocale}
        dateTimeFormatter={dateTimeFormatter}
      />
    ));
  }

  private _renderEmptyTip() {
    return (
      <div className={styles.noRecordingTip}>
        <p>{i18n.getString('noRecords', this.props.currentLocale)}</p>
      </div>
    );
  }
}

export interface RecordsListPropsType {
  currentLocale: string;
  showSpinner: boolean;
  recordings: any[];
  fetchRecordings: () => any[];
  fetchNextPageRecordings: () => any[];
  cleanRecordings: () => any[];
  dateTimeFormatter: (startTime: string) => string;
};
