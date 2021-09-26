import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Spinner from '@ringcentral-integration/widgets/components/Spinner';
import styles from '@ringcentral-integration/widgets/components/RecentActivityMessages/styles.scss';
import i18n from '@ringcentral-integration/widgets/components/RecentActivityMessages/i18n';

function ActivityItem({ item, dateTimeFormatter, openItem }) {
  const { subject, time } = item;
  const formattedTime = dateTimeFormatter({ utcTimestamp: time });
  return (
    <div
      className={classnames(styles.messageItem, styles.localMessageItem)}
      onClick={() => {
        if (typeof openItem === 'function') {
          openItem(item);
        }
      }}
    >
      <dl className={styles.dl}>
        <dt className={styles.messageSubject} title={subject}>{subject}</dt>
        <dd className={styles.messageTime} title={formattedTime}>{formattedTime}</dd>
      </dl>
    </div>
  );
}

ActivityItem.propTypes = {
  item: PropTypes.object.isRequired,
  dateTimeFormatter: PropTypes.func.isRequired,
  openItem: PropTypes.func.isRequired
};

class RecentActivityItems extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      isLoaded,
      items,
      currentLocale,
      dateTimeFormatter,
      openItem
    } = this.props;
    if (!isLoaded) {
      return <Spinner className={styles.spinner} ringWidth={4} />;
    }
    let messageListView = null;
    if (items === undefined || items === null || items.length === 0) {
      messageListView = <p className={styles.noRecords}>{i18n.getString('noRecords', currentLocale)}</p>;
    } else {
      messageListView = items.map((item, index) => (
        <ActivityItem
          key={item.id || index}
          item={item}
          dateTimeFormatter={dateTimeFormatter}
          openItem={openItem}
        />
      ));
    }
    return (
      <div className={styles.messages}>
        {messageListView}
      </div>
    );
  }
}

RecentActivityItems.propTypes = {
  isLoaded: PropTypes.bool.isRequired,
  currentLocale: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  dateTimeFormatter: PropTypes.func.isRequired,
  openItem: PropTypes.func,
};

RecentActivityItems.defaultProps = {
  openItem: undefined,
};

export default RecentActivityItems;
