import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from 'ringcentral-widgets/components/ConversationMessageList/styles.scss';

import newStyles from './styles.scss';

function Message({
  subject,
  time,
  direction,
  sender,
  subjectRenderer: SubjectRenderer,
}) {
  return (
    <div className={styles.message}>
      {
        time ?
          (
            <div className={styles.time}>
              {time}
            </div>
          ) :
          null
      }
      {
        (sender && direction === 'Inbound') ?
          (
            <div className={styles.sender}>
              {sender}
            </div>
          ) :
          null
      }
      <div
        className={classnames(
          styles.messageBody,
          direction === 'Outbound' ? styles.outbound : styles.inbound,
          (subject && subject.length > 500) && styles.big,
        )}>
        {
          SubjectRenderer ? <SubjectRenderer subject={subject} /> : subject
        }
      </div>
      <div className={styles.clear} />
    </div>
  );
}

Message.propTypes = {
  direction: PropTypes.string.isRequired,
  subject: PropTypes.string,
  time: PropTypes.string,
  sender: PropTypes.string,
  subjectRenderer: PropTypes.func,
};

Message.defaultProps = {
  subject: '',
  sender: undefined,
  time: undefined,
  subjectRenderer: undefined,
};

class ConversationMessageList extends Component {
  componentDidMount() {
    this.scrollToLastMessage();
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.messages.length === this.props.messages.length
    ) {
      return;
    }
    if (!this._scrollUp) {
      this.scrollToLastMessage();
    } else if (
      this._listRef &&
      this._scrollHeight !== this._listRef.scrollHeight
    ) {
      this._listRef.scrollTop =
        this._listRef.scrollTop + (this._listRef.scrollHeight - this._scrollHeight);
    }
  }

  onScroll = async () => {
    if (!this._listRef) {
      return;
    }
    const currentScrollTop = this._listRef.scrollTop;
    this._scrollHeight = this._listRef.scrollHeight;
    const clientHeight = this._listRef.clientHeight;
    if (currentScrollTop < this._scrollTop) {
      // user scroll up
      this._scrollUp = true;
    } else if (currentScrollTop + clientHeight > this._scrollHeight - 200) {
      // user scroll down to bottom
      this._scrollUp = false;
    }
    if (
      currentScrollTop < 20 &&
      this._scrollTop >= 20
    ) {
      this.props.loadPreviousMessages();
    }
    this._scrollTop = currentScrollTop;
  }

  scrollToLastMessage = () => {
    if (this._listRef) {
      this._listRef.scrollTop = this._listRef.scrollHeight;
    }
  }

  render() {
    const {
      className,
      dateTimeFormatter,
      messages,
      showSender,
      height,
      messageSubjectRenderer,
      formatPhone,
      loadingNextPage,
    } = this.props;

    let lastDate = 0;
    const messageList = messages.map((message) => {
      const sender = showSender ?
        (
          message.from.name ||
          formatPhone(message.from.extensionNumber || message.from.phoneNumber)
        ) :
        null;
      const date = new Date(message.creationTime);
      const time = (date - lastDate < 60 * 60 * 1000 && date.getHours() === lastDate.getHours()) ?
        null :
        dateTimeFormatter({ utcTimestamp: message.creationTime, type: 'long' });
      lastDate = date;
      return (
        <Message
          key={message.id}
          sender={sender}
          time={time}
          direction={message.direction}
          subject={message.subject}
          subjectRenderer={messageSubjectRenderer}
        />
      );
    });
    const loading = loadingNextPage ? (
      <div className={newStyles.loading}>
        Loading...
      </div>
    ) : null;
    return (
      <div
        className={classnames(styles.root, className)}
        style={{ height }}
        ref={(body) => { this._listRef = body; }}
        onScroll={this.onScroll}
      >
        {loading}
        {messageList}
      </div>
    );
  }
}

ConversationMessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    creationTime: PropTypes.number,
    id: PropTypes.number,
    direction: PropTypes.string,
    subject: PropTypes.string,
  })).isRequired,
  className: PropTypes.string,
  showSender: PropTypes.bool,
  dateTimeFormatter: PropTypes.func.isRequired,
  messageSubjectRenderer: PropTypes.func,
  formatPhone: PropTypes.func.isRequired,
  loadPreviousMessages: PropTypes.func,
  loadingNextPage: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

ConversationMessageList.defaultProps = {
  className: null,
  showSender: false,
  messageSubjectRenderer: undefined,
  loadingNextPage: false,
  loadPreviousMessages: () => null,
  height: '100%',
};

export default ConversationMessageList;
