import React from 'react';
import PropTypes from 'prop-types';
import Line from 'ringcentral-widgets/components/Line';
import IconField from 'ringcentral-widgets/components/IconField';
import Button from 'ringcentral-widgets/components/Button';

import styles from './styles.scss';

export default function AuthorizeSettingsSection({
  authorized,
  onAuthorize,
  authorizedTitle,
  unauthorizedTitle,
  serviceName,
  contactSyncing
}) {
  let status = authorized ? authorizedTitle : unauthorizedTitle;
  if (authorized && contactSyncing) {
    status = 'Syncing';
  }
  return (
    <Line
    >
      <IconField
        className={styles.iconField}
        icon={
          <Button
            className={styles.authorizaButton}
            onClick={onAuthorize}
          >
            {status}
          </Button>
        }
      >
        <span className={styles.serviceName}>{serviceName}</span>
      </IconField>
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
};

AuthorizeSettingsSection.defaultProps = {
  authorizedTitle: 'Unauthorize',
  unauthorizedTitle: 'Authorize',
  contactSyncing: false,
};
