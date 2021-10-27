import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import MessagesLog from '@ringcentral-integration/widgets/assets/images/MessagesLog.svg';
import i18n from '@ringcentral-integration/widgets/components/MessagesLogIcon/i18n';
import styles from '@ringcentral-integration/widgets/components/MessagesLogIcon/styles.scss';

export default function MessagesLogIcon({
  disabled,
  onClick,
  currentLocale,
  title,
}) {
  const tooltip = i18n.getString('log', currentLocale);
  return (
    <div
      className={classnames(
        styles.messageLog,
        disabled && styles.disabledMessageLog,
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      title={title || tooltip}>
      <MessagesLog className={styles.logIcon} />
    </div>
  );
}

MessagesLogIcon.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

MessagesLogIcon.defaultProps = {
  disabled: false,
  onClick() {},
  title: undefined,
};
