import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import UnloggedIcon from 'ringcentral-widgets/assets/images/UnloggedIcon.svg';
import LoggedIcon from 'ringcentral-widgets/assets/images/LoggedIcon.svg';
import i18n from 'ringcentral-widgets/components/LogIcon/i18n';
import styles from 'ringcentral-widgets/components/LogIcon/styles.scss';


export default function LogIcon({
    sessionId,
    id,
    onClick,
    isSaving,
    currentLocale,
    disabled,
    isFax,
}) {
  const loggedIcon = <LoggedIcon width={23} className={styles.loggedIcon} />;
  const unLoggedIcon = <UnloggedIcon width={23} className={styles.unloggedIcon} />;
  let tooltip = null;
  if (isFax) {
    tooltip = i18n.getString('faxNotSupported', currentLocale);
  } else {
    tooltip = i18n.getString(id ? 'logged' : 'unlogged', currentLocale);
  }
  const logIconClassName = classnames(
    styles.logIcon,
    isSaving ? styles.isSaving : null,
    disabled ? styles.disabled : null,
  );
  return (
    <div
      className={logIconClassName}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) {
          return;
        }
        onClick({
          sessionId,
          id
        });
      }}
      title={tooltip}>
      {id ? loggedIcon : unLoggedIcon}
    </div>
  );
}

LogIcon.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  sessionId: PropTypes.string,
  id: PropTypes.string,
  onClick: PropTypes.func,
  isSaving: PropTypes.bool,
  disabled: PropTypes.bool,
  isFax: PropTypes.bool,
};

LogIcon.defaultProps = {
  sessionId: undefined,
  id: undefined,
  onClick: undefined,
  isSaving: false,
  disabled: false,
  isFax: false,
};
