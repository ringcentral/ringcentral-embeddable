import React from 'react';
import PropTypes from 'prop-types';
import authErrors from '../../modules/Auth/authErrors';

const messages = {
  [authErrors.popWindowError]: 'Pop up login window failed. Please update your browser configure on popup',
};

export default function ErrorAlert(props) {
  const msg = messages[props.message.message];
  return (
    <span>{msg}</span>
  );
}

ErrorAlert.propTypes = {
  message: PropTypes.shape({
    message: PropTypes.string.isRequired,
  }).isRequired,
};

ErrorAlert.handleMessage = ({ message }) => (
  message === authErrors.popWindowError
);
