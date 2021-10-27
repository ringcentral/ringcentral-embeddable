import React, { Component } from 'react';
import { Button } from '@ringcentral-integration/widgets/components/Button';
import styles from '@ringcentral-integration/widgets/components/ConferencePanel/styles.scss';
import PropTypes from 'prop-types';

export default class ThirdPartyConferenceInviteButton extends Component {
  constructor(props) {
    super(props);

    // add logics
    this._onInvite = () => {
      const inviteText = this.props.getInviteTxt();
      if (!inviteText) {
        return;
      }
      this.props.onInvite({
        inviteText,
        dialInNumber: props.dialInNumber,
        topic: 'New Conference'
      });
    };
  }

  render() {
    if (!this.props.inviteTitle) {
      return null;
    }
    return (
      <Button
        className={styles.button}
        onClick={this._onInvite}
      >
        {this.props.inviteTitle}
      </Button>
    );
  }
}

ThirdPartyConferenceInviteButton.propTypes = {
  getInviteTxt: PropTypes.func.isRequired,
  dialInNumber: PropTypes.string.isRequired,
  onInvite: PropTypes.func.isRequired,
  inviteTitle: PropTypes.string,
};

ThirdPartyConferenceInviteButton.defaultProps = {
  inviteTitle: null,
};
