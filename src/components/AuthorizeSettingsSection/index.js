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
}) {
  const status = authorized ? authorizedTitle : unauthorizedTitle;
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
};

AuthorizeSettingsSection.defaultProps = {
  authorizedTitle: 'Unauthorize',
  unauthorizedTitle: 'Authorize'
};
