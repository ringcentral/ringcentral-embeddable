import React from 'react';
import type { ToNumber } from '@ringcentral-integration/commons/modules/ComposeText';
import NoSenderAlert from '@ringcentral-integration/widgets/components/ComposeTextPanel/NoSenderAlert';

import {
  SpinnerOverlay,
} from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import { RcTypography, styled, palette2 } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import { BackHeader } from '../BackHeader';
import MessageInput from '../MessageInput'; // TODO: temporary solution, wait for new component ready
import type { Attachment } from '../MessageInput';
import RecipientsInput from '../RecipientsInput';
import FromField from './FromField';

const Title = styled(RcTypography)`
  line-height: 40px;
`;

const Root = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: inherit;
  box-sizing: border-box;
  background: ${palette2('neutral', 'b01')};
  * {
    box-sizing: border-box;
  }

  label {
    font-weight: normal;
    margin-bottom: 0;
  }

  .RecipientsInput_selectReceivers {
    max-height: 24vh;
    overflow-y: auto;
  }
`;

const SenderField = styled.div`
  margin: 0 0 5px 0;
  padding: 0 20px 1px 20px;
  border-bottom: ${palette2('neutral', 'l02')} 1px solid;
  transition: height 0.5s ease-in;
  color: ${palette2('neutral', 'f03')};
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

function ComposeTextPanel({
  send,
  brand = 'RingCentral',
  autoFocus = false,
  className = undefined,
  toNumbers,
  attachments,
  formatPhone,
  messageText = '',
  showSpinner = false,
  senderNumber = '',
  addAttachment,
  currentLocale,
  searchContact,
  senderNumbers,
  typingToNumber = '',
  inputExpandable,
  removeAttachment,
  phoneTypeRenderer,
  searchContactList,
  updateMessageText,
  detectPhoneNumbers,
  formatContactPhone,
  sendButtonDisabled,
  updateTypingToNumber,
  phoneSourceNameRenderer,
  recipientsContactInfoRenderer,
  recipientsContactPhoneRenderer,
  additionalToolbarButtons = [],
  onClickAdditionalToolbarButton,
  goBack,
  showTemplate,
  templates,
  showTemplateManagement,
  loadTemplates,
  deleteTemplate,
  createOrUpdateTemplate,
  sortTemplates,
  outboundSMS = false,
  cleanTypingToNumber,
  addToNumber,
  removeToNumber,
  updateSenderNumber,
}: ComposeTextPanelProps) {
  const showAlert = !!(
    senderNumbers.length === 0 &&
    outboundSMS &&
    toNumbers.some((x) => x && x.type !== 'company')
  );
  return (
    <Root className={className}>
      {showSpinner ? <SpinnerOverlay /> : null}
      <BackHeader
        onBack={goBack}
      >
        <Title variant="body1" color="neutral.f06">
          {i18n.getString('composeText', currentLocale)}
        </Title>
      </BackHeader>
      <NoSenderAlert
        currentLocale={currentLocale}
        showAlert={showAlert}
        brand={brand}
      />
      <RecipientsInput
        value={typingToNumber}
        onChange={updateTypingToNumber}
        onClean={() => {
          cleanTypingToNumber();
        }}
        recipients={toNumbers}
        addToRecipients={async (receiver, shouldClean = true) => {
          const isAdded = await addToNumber(receiver);
          if (isAdded && shouldClean) {
            cleanTypingToNumber();
          }
        }}
        removeFromRecipients={(phoneNumber) => {
          removeToNumber({ phoneNumber });
        }}
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
      <SenderField>
        <FromField
          currentLocale={currentLocale}
          fromNumber={senderNumber}
          fromNumbers={senderNumbers}
          formatPhone={formatPhone}
          onChange={(value: string) => {
            updateSenderNumber({
              phoneNumber: value
            });
          }}
          hidden={senderNumbers.length === 0}
          showAnonymous={false}
        />
      </SenderField>
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
    </Root>
  );
}

export default ComposeTextPanel;
