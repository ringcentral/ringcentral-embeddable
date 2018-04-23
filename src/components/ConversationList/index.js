import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import MessageItem from 'ringcentral-widgets/components/MessageItem';
import styles from 'ringcentral-widgets/components/MessageList/styles.scss';
import newStyles from './styles.scss';

function NoMessages(props) {
  return (
    <p className={styles.noMessages}>{props.placeholder}</p>
  );
}

NoMessages.propTypes = {
  placeholder: PropTypes.string.isRequired,
};

export default class MessageList extends Component {
  constructor(props) {
    super(props);
    this._scrollTop = 0;
  }

  onScroll = () => {
    const totalScrollHeight = this.messagesListBody.scrollHeight;
    const { clientHeight } = this.messagesListBody;
    const currentScrollTop = this.messagesListBody.scrollTop;
    // load next page if scroll near buttom
    if (
      (totalScrollHeight - this._scrollTop) > (clientHeight + 10) &&
      (totalScrollHeight - currentScrollTop) <= (clientHeight + 10)
    ) {
      if (typeof this.props.loadNextPage === 'function') {
        this.props.loadNextPage();
      }
    }
    this._scrollTop = currentScrollTop;
  }

  render() {
    const {
      className,
      currentLocale,
      conversations,
      perPage,
      disableLinks,
      placeholder,
      loadingNextPage,
      ...childProps,
    } = this.props;

    const content = (conversations && conversations.length) ?
      conversations.map(item => (
        <MessageItem
          {...childProps}
          conversation={item}
          currentLocale={currentLocale}
          key={item.id}
          disableLinks={disableLinks}
        />
      ))
      : <NoMessages placeholder={placeholder} />;
    const loading = loadingNextPage ? (
      <div className={newStyles.loading}>
        Loading...
      </div>
    ) : null;
    return (
      <div
        className={classnames(styles.root, className)}
        onScroll={this.onScroll}
        ref={(list) => { this.messagesListBody = list; }}
        >
        {content}
        {loading}
      </div>
    );
  }
}

MessageList.propTypes = {
  brand: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
  conversations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    conversationId: PropTypes.string.isRequired,
    subject: PropTypes.string,
  })).isRequired,
  disableLinks: PropTypes.bool,
  perPage: PropTypes.number,
  className: PropTypes.string,
  showConversationDetail: PropTypes.func.isRequired,
  readMessage: PropTypes.func.isRequired,
  markMessage: PropTypes.func.isRequired,
  unmarkMessage: PropTypes.func.isRequired,
  dateTimeFormatter: PropTypes.func,
  showContactDisplayPlaceholder: PropTypes.bool,
  sourceIcons: PropTypes.object,
  showGroupNumberName: PropTypes.bool,
  placeholder: PropTypes.string,
  loadNextPage: PropTypes.func,
  loadingNextPage: PropTypes.bool,
};
MessageList.defaultProps = {
  perPage: 20,
  className: undefined,
  disableLinks: false,
  dateTimeFormatter: undefined,
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  showGroupNumberName: false,
  placeholder: undefined,
  loadNextPage: undefined,
  loadingNextPage: false
};
