import React from 'react';
import PropTypes from 'prop-types';
import authErrors from '../../modules/ImplicitOAuth/authErrors';

const messages = {
  [authErrors.popWindowError]: 'Pop up login window failed. Please update your browser configure on popup',
};

function ErrorAlert(props) {
  let msg;
  if (props.message.message === authErrors.oAuthCallbackError) {
    msg =
      props.message.payload &&
      `${props.message.payload.error}: ${props.message.payload.description}`;
  } else {
    msg = messages[props.message.message];
  }
  return (
    <span>{msg}</span>
  );
}

ErrorAlert.propTypes = {
  message: PropTypes.shape({
    message: PropTypes.string.isRequired,
    payload: PropTypes.object,
  }).isRequired,
};

ErrorAlert.handleMessage = ({ message }) => (
  message === authErrors.popWindowError ||
  message === authErrors.oAuthCallbackError
);

export default function getAlertRenderer() {
  return (message) => {
    if (ErrorAlert.handleMessage(message)) {
      return ErrorAlert;
    }
    return null;
  };
}

