import React, { Component } from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';

import {
  debounce,
} from '@ringcentral-integration/commons/lib/debounce-throttle/debounce';
import i18n
  from '@ringcentral-integration/widgets/components/MessageInput/i18n';
import {
  RcIconButton,
  RcTypography,
} from '@ringcentral/juno';
import {
  Attachment as attachmentSvg,
  Close as removeSvg,
  SendFilled as sentSvg,
} from '@ringcentral/juno-icon';

import { AdditionalToolbarButton } from '../AdditionalToolbarButton';
import styles from './styles.scss';

const UIHeightOffset = 65;
// the extra height of the entire field with paddings and borders

class MessageInput extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    currentLocale: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    sendButtonDisabled: PropTypes.bool,
    minHeight: PropTypes.number,
    maxHeight: PropTypes.number,
    maxLength: PropTypes.number,
    onSend: PropTypes.func,
    onChange: PropTypes.func,
    onHeightChange: PropTypes.func,
    inputExpandable: PropTypes.bool,
    supportAttachment: PropTypes.bool,
    attachments: PropTypes.array,
    addAttachment: PropTypes.func,
    removeAttachment: PropTypes.func,
    additionalToolbarButtons: PropTypes.arrayOf(PropTypes.object),
    onClickAdditionalToolbarButton: PropTypes.func,
  };

  static defaultProps = {
    disabled: false,
    sendButtonDisabled: false,
    onSend: undefined,
    onChange: undefined,
    onHeightChange: undefined,
    minHeight: 85,
    maxHeight: 300,
    maxLength: 1000,
    inputExpandable: true,
    supportAttachment: false,
    attachments: [],
    addAttachment: undefined,
    removeAttachment: undefined,
    additionalToolbarButtons: [],
  };

  _fileInputRef: any;
  _lastValueChange: any;
  textArea: any;

  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      value: props.value,
      height: props.minHeight,
    };
    this._lastValueChange = 0;
    this._fileInputRef = React.createRef();
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (
      // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
      nextProps.value !== this.state.value &&
      // ignore value changes from props for 300ms after typing
      // this is to prevent unnecessary value changes when used in chrome extension
      // where value pushed back to background and back takes longer
      Date.now() - this._lastValueChange > 300
    ) {
      // use setState(updater, callback) to recaculate height after value has been update to DOM
      this.setState(
        () => ({
          value: nextProps.value,
        }),
        () => {
          const newHeight = this.calculateNewHeight();
          // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
          if (newHeight !== this.state.height) {
            // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
            if (typeof this.props.onHeightChange === 'function') {
              // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
              this.props.onHeightChange(newHeight);
            }
            this.setState({
              height: newHeight,
            });
          }
        },
      );
    }
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  componentDidMount() {
    // do a initial size check in case the component is mounted with multi line value
    const newHeight = this.calculateNewHeight();
    // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (newHeight !== this.state.height) {
      // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
      if (typeof this.props.onHeightChange === 'function') {
        // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
        this.props.onHeightChange(newHeight);
      }
      this.setState({
        height: newHeight,
      });
    }
  }

  calculateNewHeight() {
    // @ts-expect-error TS(2339): Property 'inputExpandable' does not exist on type ... Remove this comment to see the full error message
    if (!this.props.inputExpandable) {
      // @ts-expect-error TS(2339): Property 'minHeight' does not exist on type 'Reado... Remove this comment to see the full error message
      return this.props.minHeight;
    }
    // temperarily set height to 0 to check scrollHeight
    this.textArea.style.height = 0;
    const newHeight = this.textArea.scrollHeight + 10 + UIHeightOffset;
    // set height back to original to avoid messing with react
    // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
    this.textArea.style.height = `${this.state.height - UIHeightOffset}px`;
    // @ts-expect-error TS(2339): Property 'minHeight' does not exist on type 'Reado... Remove this comment to see the full error message
    const { minHeight, maxHeight } = this.props;
    if (newHeight < minHeight) {
      return minHeight;
    }
    if (newHeight > maxHeight) {
      return maxHeight;
    }
    return newHeight;
  }

  onChange = (e: any) => {
    this._lastValueChange = Date.now();
    const {
      currentTarget: { value },
    } = e;
    const newHeight = this.calculateNewHeight();
    if (
      // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
      newHeight !== this.state.height &&
      // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
      typeof this.props.onHeightChange === 'function'
    ) {
      // @ts-expect-error TS(2339): Property 'onHeightChange' does not exist on type '... Remove this comment to see the full error message
      this.props.onHeightChange(newHeight);
    }
    this.setState({
      value,
      height: newHeight,
    });
    // ues debounce for avoiding frequent updates compose text module state
    this.updateMessageText?.();
  };

  updateMessageText =
    // @ts-expect-error TS(2339): Property 'onChange' does not exist on type 'Readon... Remove this comment to see the full error message
    typeof this.props.onChange === 'function'
      ? debounce({
          // @ts-expect-error TS(2339): Property 'onChange' does not exist on type 'Readon... Remove this comment to see the full error message
          fn: () => this.props.onChange(this.state.value),
        })
      : null;

  onKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // TODO: this component should be refactored whole UX logic
      // @ts-expect-error TS(2339): Property 'sendButtonDisabled' does not exist on ty... Remove this comment to see the full error message
      if (this.props.sendButtonDisabled) return;

      this.onSend();
    }
  };

  onSend = () => {
    this.updateMessageText?.flush();
    // @ts-expect-error TS(2339): Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
    if (!this.props.disabled && typeof this.props.onSend === 'function') {
      // @ts-expect-error TS(2339): Property 'onSend' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.props.onSend(this.state.value, this.props.attachments);
    }
  };

  onAttachmentIconClick = () => {
    this._fileInputRef.current.click();
  };

  onSelectAttachment = ({ currentTarget }: any) => {
    if (currentTarget.files.length === 0) {
      return;
    }
    // @ts-expect-error TS(2339): Property 'addAttachment' does not exist on type 'R... Remove this comment to see the full error message
    const { addAttachment } = this.props;
    let file = currentTarget.files[0];
    if (
      (file.name.endsWith('.vcard') || file.name.endsWith('.vcf')) &&
      file.type !== 'text/vcard'
    ) {
      file = new File([file], file.name, { type: 'text/vcard' });
    }
    addAttachment({
      name: file.name,
      size: file.size,
      file,
    });
  };

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    const {
      // @ts-expect-error TS(2339): Property 'currentLocale' does not exist on type 'R... Remove this comment to see the full error message
      currentLocale,
      // @ts-expect-error TS(2339): Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
      disabled,
      // @ts-expect-error TS(2339): Property 'sendButtonDisabled' does not exist on ty... Remove this comment to see the full error message
      sendButtonDisabled,
      // @ts-expect-error TS(2339): Property 'maxLength' does not exist on type 'Reado... Remove this comment to see the full error message
      maxLength,
      // @ts-expect-error TS(2339): Property 'supportAttachment' does not exist on typ... Remove this comment to see the full error message
      supportAttachment,
      // @ts-expect-error TS(2339): Property 'attachments' does not exist on type 'Rea... Remove this comment to see the full error message
      attachments,
      // @ts-expect-error TS(2339): Property 'removeAttachment' does not exist on type... Remove this comment to see the full error message
      removeAttachment,
      additionalToolbarButtons,
      onClickAdditionalToolbarButton,
    } = this.props;
    // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { value, height } = this.state;
    const inputHeight = height - UIHeightOffset;
    return (
      <div
        className={classnames(
          styles.root,
          supportAttachment && styles.supportAttachment,
        )}
      >
        <div className={styles.toolbar}>
          <RcIconButton
            variant="round"
            size="medium"
            symbol={attachmentSvg}
            onClick={this.onAttachmentIconClick}
            disabled={disabled}
            title="Attach file"
          />
          <input
            type="file"
            accept="image/tiff,image/gif,image/jpeg,image/bmp,image/png,image/svg+xml,text/vcard,application/rtf,video/mpeg,audio/mpeg,video/mp4,application/zip"
            style={{ display: 'none' }}
            ref={this._fileInputRef}
            onChange={this.onSelectAttachment}
            disabled={disabled}
          />
          {
            additionalToolbarButtons.map((button) => {
              return (
                <AdditionalToolbarButton
                  key={button.id}
                  label={button.label}
                  icon={button.icon}
                  onClick={() => {
                    onClickAdditionalToolbarButton(button.id)
                  }}
                />
              );
            })
          }
          {
            value && value.length > 0 && (
              <div className={styles.inputTip}>
                <RcTypography variant="caption1" color="neutral.f04">
                  Press Shift + Return for new line
                </RcTypography>
              </div>
            )
          }
        </div>
        <div className={styles.textField}>
          <textarea
            data-sign="messageInput"
            ref={(target) => {
              this.textArea = target;
            }}
            placeholder={i18n.getString('typeMessage', currentLocale)}
            value={value}
            maxLength={maxLength}
            onChange={this.onChange}
            onKeyPressCapture={this.onKeyDown}
            style={{
              height: inputHeight,
            }}
            disabled={disabled}
          />
          <RcIconButton
            data-sign="messageButton"
            onClick={this.onSend}
            className={styles.sendButton}
            disabled={disabled || sendButtonDisabled}
            symbol={sentSvg}
            color="action.primary"
          />
        </div>
        <div className={styles.attachments}>
          {attachments.map((attachment: any) => {
            return (
              <div
                className={styles.attachmentItem}
                key={attachment.name}
                title={attachment.name}
              >
                {attachment.name}
                <div className={styles.attachmentRemoveIcon}>
                  <RcIconButton
                    size="small"
                    symbol={removeSvg}
                    disabled={disabled}
                    onClick={() => {
                      removeAttachment(attachment);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default MessageInput;
