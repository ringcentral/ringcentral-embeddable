import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from 'ringcentral-widget/components/LoginPanel/styles.scss';
import i18n from 'ringcentral-widget/components/LoginPanel/i18n';
import SpinnerOverlay from 'ringcentral-widget/components/SpinnerOverlay';
import LoginPanel from 'ringcentral-widget/components/LoginPanel';

export default class NewLoginPanel extends LoginPanel {
  render() {
    const {
      className,
      onLoginButtonClick,
      currentLocale,
      disabled,
      version,
      showSpinner,
      children,
    } = this.props;
    const spinner = showSpinner ?
      <SpinnerOverlay /> :
      null;
    const versionDisplay = version ?
      (
        <div className={styles.versionContainer} >
          {i18n.getString('version', currentLocale)} {version}
        </div>
      ) :
      null;
    return (
      <div className={classnames(styles.root, className)}>
        <button
          className={styles.loginButton}
          onClick={onLoginButtonClick}
          disabled={disabled} >
          {i18n.getString('loginButton', currentLocale)}
        </button>
        {versionDisplay}
        {spinner}
        {children}
      </div>
    );
  }
}
