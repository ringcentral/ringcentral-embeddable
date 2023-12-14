import React, { Component } from 'react';
import PropTypes from 'prop-types';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import InsideModal from '@ringcentral-integration/widgets/components/InsideModal';
import LogSection from '@ringcentral-integration/widgets/components/LogSection';
import InputField from '@ringcentral-integration/widgets/components/InputField';

import styles from './styles.scss';

export default class LogSectionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      note: '',
    };

    this._lastCallId = this.props.currentCall && this.props.currentCall.id;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.currentCall) {
      return;
    }
    if (
      nextProps.currentCall.id !== this._lastCallId
    ) {
      this._lastCallId = nextProps.currentCall.id;
      this.props.onLoadData(nextProps.currentCall);
      const matchedActivity =
        nextProps.currentCall.activityMatches &&
        nextProps.currentCall.activityMatches[0];
      console.log(nextProps.currentCall);
      this.setState({
        note: matchedActivity && matchedActivity.note ? matchedActivity.note : '',
      });
    }
    const nextMatcher = this.getLogMatcher(nextProps);
    const matcher = this.getLogMatcher(this.props);
    if (nextMatcher && nextMatcher !== matcher) {
      this.setState({
        note: nextMatcher.note || '',
      });
    }
  }

  onNoteChange = (e) => {
    const value = e.target.value;
    this.setState({
      note: value,
    });
  }

  onSaveCallLog = () => {
    this.props.onSaveCallLog({
      call: this.props.currentCall,
      note: this.state.note,
    });
  }

  getLogMatcher(props = this.props) {
    if (!props.currentCall) {
      return null;
    }
    if (props.currentCall.activityMatches && props.currentCall.activityMatches.length) {
      return props.currentCall.activityMatches[0];
    }
    return null;
  }

  renderEditSection = () => {
    return (
      <InputField
        dataSign="logNote"
        label={'Note'}
        className={styles.noteSection}
      >
        <textarea
          placeholder={'Add call log note'}
          value={this.state.note}
          maxLength={1000}
          onChange={this.onNoteChange}
          className={styles.noteArea}
        />
      </InputField>
    );
  }

  render() {
    if (!this.props.currentCall) {
      return null;
    }
    let logName = 'Unknown';
    const nameEntities = this.props.currentCall.direction === callDirections.inbound
        ? this.props.currentCall.fromMatches : this.props.currentCall.toMatches;
    if (nameEntities && nameEntities.length > 0) {
      logName = nameEntities[0].name;
    }
    return (
      <InsideModal
        title={'Log Call'}
        show={this.props.show}
        onClose={this.props.onClose}
        containerStyles={styles.container}
        modalStyles={styles.modal}
        maskStyle={styles.mask}
      >
        <LogSection
          currentLocale={this.props.currentLocale}
          currentLog={{
            call: this.props.currentCall,
            currentLogCall: this.props.currentLogCall,
            logName,
          }}
          renderEditLogSection={this.renderEditSection}
          onSaveCallLog={this.onSaveCallLog}
        />
      </InsideModal>
    );
  }
}

LogSectionModal.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentCall: PropTypes.object,
  currentLogCall: PropTypes.object,
  onSaveCallLog: PropTypes.func.isRequired,
  onLoadData: PropTypes.func.isRequired,
};

LogSectionModal.defaultProps = {
  currentCall:  null,
  currentLogCall: {}
};
