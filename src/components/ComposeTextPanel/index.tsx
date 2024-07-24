import React, { Component } from 'react';

import classnames from 'classnames';

import type {
  ToNumber,
} from '@ringcentral-integration/commons/modules/ComposeText';
import NoSenderAlert
  from '@ringcentral-integration/widgets/components/ComposeTextPanel/NoSenderAlert';
import styles
  from '@ringcentral-integration/widgets/components/ComposeTextPanel/styles.scss';
import FromField from '@ringcentral-integration/widgets/components/FromField';

import {
  SpinnerOverlay,
} from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import { RcTypography, styled } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import { BackHeader } from '../BackHeader';
import MessageInput from '../MessageInput'; // TODO: temporary solution, wait for new component ready
import type { Attachment } from '../MessageInput';
import RecipientsInput from '../RecipientsInput';

const Title = styled(RcTypography)`
  line-height: 40px;
`;

export interface ComposeTextPanelProps {
  brand?: string;
  className?: string;
  send: (...args: any[]) => any;
  senderNumbers: {
    phoneNumber: string;
  }[];
  sendButtonDisabled: boolean;
  formatPhone: (...args: any[]) => any;
  formatContactPhone: (...args: any[]) => any;
  detectPhoneNumbers: (...args: any[]) => any;
  searchContact: (...args: any[]) => any;
  searchContactList: {
    name: string;
    entityType: string;
    phoneType: string;
    phoneNumber: string;
  }[];
  currentLocale: string;
  updateSenderNumber: (...args: any[]) => any;
  updateTypingToNumber: (...args: any[]) => any;
  cleanTypingToNumber: (...args: any[]) => any;
  addToNumber: (...args: any[]) => any;
  removeToNumber: (...args: any[]) => any;
  updateMessageText: (...args: any[]) => any;
  messageText: string;
  typingToNumber: string;
  senderNumber: string;
  toNumbers: ToNumber[];
  outboundSMS?: boolean;
  showSpinner?: boolean;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  recipientsContactInfoRenderer?: (...args: any[]) => any;
  recipientsContactPhoneRenderer?: (...args: any[]) => any;
  autoFocus?: boolean;
  inputExpandable?: boolean;
  supportAttachment?: boolean;
  attachments?: Attachment[];
  addAttachment?: (...args: any[]) => any;
  removeAttachment?: (...args: any[]) => any;
  useRecipientsInputV2?: boolean;
  additionalToolbarButtons: any[];
  onClickAdditionalToolbarButton: (...args: any[]) => any;
  goBack: (...args: any[]) => any;
  showTemplate?: boolean;
  templates?: any[];
  showTemplateManagement?: boolean;
  loadTemplates?: () => Promise<any>;
  deleteTemplate?: (templateId: string) => Promise<any>;
  createOrUpdateTemplate?: (template: any) => Promise<any>;
  sortTemplates?: (...args: any[]) => any;
}

type ComposeTextPanelState = {
  messageText: any;
};
class ComposeTextPanel extends Component<
  ComposeTextPanelProps,
  ComposeTextPanelState
> {
  addToRecipients: (item: ToNumber) => void;
  removeFromRecipients: (phoneNumber: string) => void;
  cleanReceiverValue: () => void;
  onSenderChange: any;
  static defaultProps: {
    brand: 'RingCentral';
    className: null;
    messageText: '';
    typingToNumber: '';
    senderNumber: '';
    outboundSMS: false;
    showSpinner: false;
    autoFocus: false;
    supportAttachment: false;
    additionalToolbarButtons: [],
  };
  constructor(props: ComposeTextPanelProps | Readonly<ComposeTextPanelProps>) {
    super(props);
    this.state = {
      messageText: props.messageText,
    };
    const {
      updateSenderNumber,
      cleanTypingToNumber,
      addToNumber,
      removeToNumber,
    } = this.props;
    this.onSenderChange = (value: any) => {
      updateSenderNumber(value);
    };
    this.cleanReceiverValue = () => {
      cleanTypingToNumber();
    };
    this.addToRecipients = async (receiver, shouldClean = true) => {
      const isAdded = await addToNumber(receiver);
      if (isAdded && shouldClean) {
        cleanTypingToNumber();
      }
    };
    this.removeFromRecipients = (phoneNumber) => {
      removeToNumber({ phoneNumber });
    };
  }

  override UNSAFE_componentWillReceiveProps(nextProps: { messageText: any }) {
    const { messageText } = this.state;
    if (nextProps.messageText !== messageText) {
      this.setState({
        messageText: nextProps.messageText,
      });
    }
  }
  hasSenderNumbers() {
    const { senderNumbers } = this.props;
    return senderNumbers.length > 0;
  }
  hasPersonalRecipient() {
    const { toNumbers } = this.props;
    return toNumbers.some((x) => x && x.type !== 'company');
  }

  showAlert() {
    const { outboundSMS } = this.props;
    return !!(
      !this.hasSenderNumbers() &&
      outboundSMS &&
      this.hasPersonalRecipient()
    );
  }

  onInputChange = (searchString: string) => {
    const { updateTypingToNumber, searchContact } = this.props;
    updateTypingToNumber(searchString);
    searchContact(searchString);
  };

  override render() {
    const {
      send,
      brand,
      autoFocus,
      className,
      toNumbers,
      attachments,
      formatPhone,
      messageText,
      showSpinner,
      senderNumber,
      addAttachment,
      currentLocale,
      searchContact,
      senderNumbers,
      typingToNumber,
      inputExpandable,
      removeAttachment,
      phoneTypeRenderer,
      searchContactList,
      supportAttachment,
      updateMessageText,
      detectPhoneNumbers,
      formatContactPhone,
      sendButtonDisabled,
      updateTypingToNumber,
      // TODO: temporary solution, wait for new component ready
      useRecipientsInputV2,
      phoneSourceNameRenderer,
      recipientsContactInfoRenderer,
      recipientsContactPhoneRenderer,
      additionalToolbarButtons,
      onClickAdditionalToolbarButton,
      goBack,
      showTemplate,
      templates,
      showTemplateManagement,
      loadTemplates,
      deleteTemplate,
      createOrUpdateTemplate,
      sortTemplates,
    } = this.props;
    const filteredSearchContactList =
      useRecipientsInputV2 && typingToNumber.length >= 3
        ? searchContactList
        : [];
    return (
      <div className={classnames(styles.root, className)}>
        {showSpinner ? <SpinnerOverlay /> : null}
        <BackHeader
          onBack={goBack}
        >
          <Title variant="body1">
            {i18n.getString('composeText', currentLocale)}
          </Title>
        </BackHeader>
        <NoSenderAlert
          currentLocale={currentLocale}
          showAlert={this.showAlert()}
          brand={brand}
        />
        <RecipientsInput
          value={typingToNumber}
          recipientsClassName={styles.recipients}
          onChange={updateTypingToNumber}
          onClean={this.cleanReceiverValue}
          recipients={toNumbers}
          addToRecipients={this.addToRecipients}
          removeFromRecipients={this.removeFromRecipients}
          searchContact={searchContact}
          searchContactList={searchContactList}
          formatContactPhone={formatContactPhone}
          detectPhoneNumbers={detectPhoneNumbers}
          currentLocale={currentLocale}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          contactInfoRenderer={recipientsContactInfoRenderer}
          contactPhoneRenderer={recipientsContactPhoneRenderer}
          titleEnabled
          autoFocus={autoFocus}
          multiple
        />
        <div className={styles.senderField}>
          <FromField
            currentLocale={currentLocale}
            fromNumber={senderNumber}
            fromNumbers={senderNumbers}
            formatPhone={formatPhone}
            onChange={this.onSenderChange}
            hidden={!this.hasSenderNumbers()}
            showAnonymous={false}
          />
        </div>
        <MessageInput
          value={messageText}
          onChange={updateMessageText}
          sendButtonDisabled={sendButtonDisabled}
          currentLocale={currentLocale}
          onSend={send}
          inputExpandable={inputExpandable}
          attachments={attachments}
          addAttachment={addAttachment}
          removeAttachment={removeAttachment}
          additionalToolbarButtons={additionalToolbarButtons}
          onClickAdditionalToolbarButton={onClickAdditionalToolbarButton}
          showTemplate={showTemplate}
          templates={templates}
          showTemplateManagement={showTemplateManagement}
          loadTemplates={loadTemplates}
          deleteTemplate={deleteTemplate}
          createOrUpdateTemplate={createOrUpdateTemplate}
          sortTemplates={sortTemplates}
        />
      </div>
    );
  }
}

export default ComposeTextPanel;
