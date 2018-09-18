import React from 'react';
import PropTypes from 'prop-types';
import IconLine from 'ringcentral-widgets/components/IconLine';
import Button from 'ringcentral-widgets/components/Button';

import styles from './styles.scss';

export default function AuthorizeSettingsPanel({
  authorized,
  onAuthorize,
  authorizedTitle,
  unauthorizedTitle,
  serviceName,
}) {
  const status = authorized ? authorizedTitle : unauthorizedTitle;
  return (
    <IconLine
      icon={
        <Button
          className={styles.authorizaButton}
          onClick={onAuthorize}
        >
          {status}
        </Button>
      }
    >
      {serviceName}
    </IconLine>
  );
}

AuthorizeSettingsPanel.propTypes = {
  serviceName: PropTypes.string.isRequired,
  onAuthorize: PropTypes.func.isRequired,
  authorized: PropTypes.bool.isRequired,
  authorizedTitle: PropTypes.string,
  unauthorizedTitle: PropTypes.string,
};

AuthorizeSettingsPanel.defaultProps = {
  authorizedTitle: 'Unauthorize',
  unauthorizedTitle: 'Authorize'
};
