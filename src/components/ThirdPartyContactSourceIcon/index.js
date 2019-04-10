import React from 'react';
import PropTypes from 'prop-types';

import styles from './styles.scss';

export default function ThirdPartyContactSourceIcon({
  iconUri,
  sourceName
}) {
  return (
    <img src={iconUri} alt={sourceName} className={styles.icon} />
  );
}

ThirdPartyContactSourceIcon.propTypes = {
  iconUri: PropTypes.string,
  sourceName: PropTypes.string,
};

ThirdPartyContactSourceIcon.defaultProps = {
  iconUri: undefined,
  sourceName: undefined
};
