import React from 'react';

import PropTypes from 'prop-types';

import Line from '@ringcentral-integration/widgets/components/Line';
import { RcButton } from '@ringcentral/juno';

import styles from './styles.scss';

export default function AuthorizeSettingsSection({
  authorized,
  onAuthorize,
  authorizedTitle,
  unauthorizedTitle,
  serviceName,
  contactSyncing,
  authorizationLogo,
  authorizedAccount,
  showAuthRedDot,
}) {
  let status = authorized ? authorizedTitle : unauthorizedTitle;
  if (authorized && contactSyncing) {
    status = 'Syncing';
  }
  let icon = null;
  if (authorizationLogo) {
    icon = (
      <div className={styles.iconHolder}>
        <img src={authorizationLogo} className={styles.icon} alt={serviceName} />
      </div>
    );
  } else {
    icon = (<span className={styles.serviceName}>{serviceName}</span>);
  }
  const authButton = (
    <RcButton
      size="small"
      onClick={onAuthorize}
      color={(authorized && !contactSyncing) ? 'danger.b04' : 'action.primary'}
    >
      {status}
    </RcButton>
  );
  let redDot = null;
  if (showAuthRedDot) {
    redDot = (<div className={styles.redDot} />);
  }
  if (authorized && authorizedAccount) {
    return (
      <Line>
        {icon}
        <div className={styles.accountWrapper}>
          <div className={styles.mailtip} title={authorizedAccount}>
            {authorizedAccount}
          </div>
          {authButton}
        </div>
      </Line>
    );
  }
  return (
    <Line>
      <div className={styles.accountWrapper}>
        {icon}
        <span className='authButtonWrapper'>
          {authButton}
          {redDot}
        </span>
      </div>
    </Line>
  );
}

AuthorizeSettingsSection.propTypes = {
  serviceName: PropTypes.string.isRequired,
  onAuthorize: PropTypes.func.isRequired,
  authorized: PropTypes.bool.isRequired,
  authorizedTitle: PropTypes.string,
  unauthorizedTitle: PropTypes.string,
  contactSyncing: PropTypes.bool,
  authorizationLogo: PropTypes.string,
  authorizedAccount: PropTypes.string,
};

AuthorizeSettingsSection.defaultProps = {
  authorizedTitle: 'Unauthorize',
  unauthorizedTitle: 'Authorize',
  contactSyncing: false,
  authorizationLogo: null,
  authorizedAccount: null,
};
