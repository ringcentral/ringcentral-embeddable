import React, { useEffect } from 'react';
import type { ToNumber } from '@ringcentral-integration/commons/modules/ComposeText';

import {
  SpinnerOverlay,
} from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import { RcTypography, RcIconButton, RcCheckbox, RcIcon, RcTooltip, styled, palette2 } from '@ringcentral/juno';
import { Close, InfoBorder } from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import { BackHeader } from '../BackHeader';
import MessageInput from '../MessageInput'; // TODO: temporary solution, wait for new component ready
import type { Attachment } from '../MessageInput';
import RecipientsInput from '../RecipientsInput';
import { FromField } from './FromField';
import { NoTextPermission } from './NoTextPermission';

const Title = styled(RcTypography)`
  line-height: 40px;
`;

const Root = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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

  .GroupSMSCheckboxLabel {
    margin-left: 0;
    width: 100%;
    padding-left: 20px;
    padding-right: 18px;
    margin-bottom: 5px;

    .MuiFormControlLabel-label {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .RcCheckbox-root {
      padding: 6px;
    }
  }
`;

const SenderField = styled.div`
  padding: 0 20px 1px 20px;
  transition: height 0.5s ease-in;
  color: ${palette2('neutral', 'f03')};
`;

const Aline = styled.div`
  border-bottom: ${palette2('neutral', 'l02')} 1px solid;
  margin-bottom: 5px;
`;

const EmptyContainer = styled.div`
  flex: 1;
`;

const GroupSMSLabelText = styled(RcTypography)`
  font-size: 0.75rem;
  margin-right: 10px;
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
  hideHeader?: boolean;
  hideBackButton?: boolean;
  onClose?: (...args: any[]) => any;
  showCloseButton?: boolean;
  onLoad?: (...args: any[]) => any;
  groupSMS?: boolean;
  setGroupSMS?: (checked: boolean) => void;
  // Typing duration tracking
  showTypingDuration?: boolean;
  typingStartTime?: number | null;
  accumulatedTypingTime?: number;
}

const CloseButton = styled(RcIconButton)`
  position: absolute;
  right: 6px;
  top: 0;
`;

function GroupSMSCheckbox({
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <RcCheckbox
      disabled={disabled}
      label={
        <>
          <GroupSMSLabelText component="span" variant="caption1">
            Create group text
          </GroupSMSLabelText>
          <RcTooltip title={
            <>
              <RcTypography variant="body1">
                Send group text messages (up to 10 people) to start a text conversation.
              </RcTypography>
              <br />
              <RcTypography variant="body1">
                Or uncheck the box to send a text message to everyone individually. They will be unaware of the other recipients.
              </RcTypography>
            </>
          }>
            <RcIcon symbol={InfoBorder} size="small" />
          </RcTooltip>
        </>
      }
      formControlLabelProps={{
        labelPlacement: 'start',
        className: 'GroupSMSCheckboxLabel',
      }}
      checked={checked}
      onChange={(e, checked) => {
        onChange(checked);
      }}
    />
  );
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
  hideHeader = false,
  hideBackButton = false,
  onClose,
  showCloseButton = false,
  onLoad,
  groupSMS = false,
  setGroupSMS = (checked: boolean) => {},
  showTypingDuration = false,
  typingStartTime = null,
  accumulatedTypingTime = 0,
}: ComposeTextPanelProps) {
  const noPermission = !!(
    senderNumbers.length === 0 ||
    !outboundSMS
  );
  useEffect(() => {
    if (typeof onLoad === 'function') {
      onLoad();
    }
  }, []);

  return (
    <Root className={className} data-sign="composeTextPanel">
      {showSpinner ? <SpinnerOverlay /> : null}
      {
        !hideHeader && (
          <BackHeader
            onBack={goBack}
            hideBackButton={hideBackButton}
          >
            <Title variant="body1" color="neutral.f06">
              {i18n.getString('composeText', currentLocale)}
            </Title>
            {
              showCloseButton && (
                <CloseButton
                  symbol={Close}
                  onClick={onClose}
                  data-sign="closeButton"
                  title="Close"
                />
              )
            }
          </BackHeader>
        )
      }
      {
        noPermission ? (
          <NoTextPermission />
        ) : (
          <>
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
            <GroupSMSCheckbox
              checked={groupSMS}
              onChange={setGroupSMS}
              disabled={toNumbers.length === 0 || (toNumbers.length === 1 && !typingToNumber)}
            />
            <Aline />
            <EmptyContainer />
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
              disabled={senderNumbers.length === 0}
              showTypingDuration={showTypingDuration}
              typingStartTime={typingStartTime}
              accumulatedTypingTime={accumulatedTypingTime}
            />
          </>
        )
      }
    </Root>
  );
}

export default ComposeTextPanel;
