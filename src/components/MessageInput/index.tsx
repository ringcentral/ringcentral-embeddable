import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, FunctionComponent, ChangeEvent } from 'react';

import i18n from '@ringcentral-integration/widgets/components/MessageInput/i18n';
import {
  RcIconButton,
  RcTypography,
  styled,
  palette2,
} from '@ringcentral/juno';
import {
  Sms,
  Attachment as attachmentSvg,
  Close as removeSvg,
  SendFilled as sentSvg,
  SmsTemplate as templateSvg
} from '@ringcentral/juno-icon';

import { AdditionalToolbarButton } from '../AdditionalToolbarButton';
import { SmsTemplateDialog } from '../SmsTemplateDialog';

const UIHeightOffset = 65;
// the extra height of the entire field with paddings and borders

const Container = styled.div`
  position: absolute;
  bottom: 0px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2px 2px 2px;
  font-family: Helvetica;
  border-top: 1px solid ${palette2('neutral', 'l02')};
  box-sizing: border-box;
  background-color: ${palette2('neutral', 'b01')};
`;

const Toolbar = styled.div`
  padding: 0 15px 0 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const InputTip = styled.div`
  flex: 1;
  text-align: right;
`;

const TextFiled = styled.div`
  padding-right: 50px;
  box-sizing: border-box;
  position: relative;
  border: 1px solid ${palette2('neutral', 'l02')};
  border-radius: 5px;
  margin: 0 10px 10px 10px;
  margin-top: 0;

  textarea {
    background: transparent;
    font-size: 13px;
    line-height: 18px;
    width: 100%;
    margin: 10px 0 0 10px;
    resize: none;
    border: none;
    outline: medium none!important;
    box-sizing: border-box;

    &::placeholder {
      color: ${palette2('neutral', 'f02')};
    }
  }
`;

const SendButton = styled(RcIconButton)`
  position: absolute;
  bottom: 2px;
  right: 2px;
`;

const AttachmentsWrapper = styled.div`
  display: block;
  padding: 0 10px;
  max-height: 250px;
  overflow-y: auto;
`;


const AttachmentItem = styled.div`
  display: inline-block;
  color: ${palette2('neutral', 'f06')};
  font-size: 13px;
  border: solid 1px ${palette2('neutral', 'l03')};
  border-radius: 4px;
  max-width: 250px;
  position: relative;
  padding-right: 32px;
  padding-left: 10px;
  line-height: 40px;
  margin-right: 10px;
  margin-bottom: 10px;
`;

const AttachmentRemoveIconWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
`;

export type Attachment = {
  name: string;
  size: number;
  file: File;
}

type MessageInputProps = {
  value: string;
  currentLocale: string;
  disabled: boolean;
  sendButtonDisabled: boolean;
  minHeight: number;
  maxHeight: number;
  maxLength: number;
  onSend?: (value: string, attachments: any[]) => any;
  onChange?: (value: string) => any;
  onHeightChange?: (height: number) => any;
  inputExpandable: boolean;
  attachments: Attachment[],
  addAttachment?: (attachment: Attachment) => any;
  removeAttachment?: (attachment: Attachment) => any;
  additionalToolbarButtons: any[];
  onClickAdditionalToolbarButton: (id: string) => any;
  showTemplate?: boolean;
  templates?: any[];
  showTemplateManagement?: boolean;
  loadTemplates?: () => Promise<any>;
  deleteTemplate?: (templateId: string) => Promise<any>;
  createOrUpdateTemplate?: (template: any) => Promise<any>;
}

type AttachmentsProps = {
  attachments: Attachment[];
  removeAttachment: (attachment: Attachment) => any;
  disabled: boolean;
};

const AttachmentList: FunctionComponent<AttachmentsProps> = ({
  attachments,
  removeAttachment,
  disabled,
}) => {
  return (
    <AttachmentsWrapper>
      {attachments.map((attachment: Attachment) => {
        return (
          <AttachmentItem
            key={attachment.name}
            title={attachment.name}
          >
            {attachment.name}
            <AttachmentRemoveIconWrapper>
              <RcIconButton
                size="small"
                symbol={removeSvg}
                disabled={disabled}
                onClick={() => {
                  removeAttachment(attachment);
                }}
              />
            </AttachmentRemoveIconWrapper>
          </AttachmentItem>
        );
      })}
    </AttachmentsWrapper>
  );
}
const MessageInput: FunctionComponent<MessageInputProps> = ({
  currentLocale,
  value: valueProp = '',
  disabled = false,
  sendButtonDisabled = false,
  onSend: onSendProp = undefined,
  onChange = undefined,
  onHeightChange = undefined,
  inputExpandable = true,
  maxLength = 1000,
  maxHeight = 300,
  minHeight = 85,
  attachments = [],
  addAttachment = undefined,
  removeAttachment = undefined,
  additionalToolbarButtons = [],
  onClickAdditionalToolbarButton,
  showTemplate = false,
  templates = [],
  showTemplateManagement = false,
  loadTemplates = undefined,
  deleteTemplate = undefined,
  createOrUpdateTemplate = undefined,
}) => {
  const [value, setValue] = useState('');
  const [height, setHeight] = useState(minHeight);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const inputHeight = height - UIHeightOffset;
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null);
  const lastValueChangeRef = useRef(0);
  const heightRef = useRef(height);

  useEffect(() => {
    if (valueProp !== value) {
      // ignore value changes from props for 300ms after typing
      // this is to prevent unnecessary value changes when used in chrome extension
      // where value pushed back to background and back takes longer
      const updateTimeDiff = Date.now() - lastValueChangeRef.current;
      if (updateTimeDiff > 1000) {
        setValue(valueProp);
      }
    }
  }, [valueProp]);

  useEffect(()  => {
    let newHeight = minHeight;
    if (!inputExpandable) {
      return;
    }
    // temporarily set height to 0 to check scrollHeight
    textAreaRef.current.style.height = 0;
    newHeight = textAreaRef.current.scrollHeight + 10 + UIHeightOffset;
    // set height back to original to avoid messing with react
    textAreaRef.current.style.height = `${heightRef.current - UIHeightOffset}px`;
    if (newHeight < minHeight) {
      newHeight = minHeight;
    }
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
    }
    if (heightRef.current === newHeight) {
      return;
    }
    heightRef.current = newHeight;
    if (typeof onHeightChange === 'function') {
      onHeightChange(newHeight);
    }
    setHeight(newHeight);
  }, [value, minHeight, maxHeight, inputExpandable]);
  
  const onSend = () => {
    if (!disabled && typeof onSendProp === 'function') {
      onSendProp(value, attachments);
    }
  };

  return (
    <Container>
      <Toolbar>
        <RcIconButton
          variant="round"
          size="medium"
          symbol={attachmentSvg}
          onClick={() => {
            fileInputRef.current.click();
          }}
          disabled={disabled}
          title="Attach file"
        />
        {
          showTemplate && (
            <RcIconButton
              variant="round"
              size="medium"
              symbol={templateSvg}
              disabled={disabled}
              title="Use template"
              onClick={() => {
                setTemplateDialogOpen(true);
              }}
            />
          )
        }
        <input
          type="file"
          accept="image/tiff,image/gif,image/jpeg,image/bmp,image/png,image/svg+xml,text/vcard,application/rtf,video/mpeg,audio/mpeg,video/mp4,application/zip"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={({ currentTarget }: any) => {
            if (currentTarget.files.length === 0) {
              return;
            }
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
          }}
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
            <InputTip>
              <RcTypography variant="caption1" color="neutral.f04">
                Press Shift + Return for new line
              </RcTypography>
            </InputTip>
          )
        }
      </Toolbar>
      <TextFiled>
        <textarea
          data-sign="messageInput"
          ref={textAreaRef}
          placeholder={i18n.getString('typeMessage', currentLocale)}
          value={value}
          maxLength={maxLength}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            lastValueChangeRef.current = Date.now();
            const {
              currentTarget: { value },
            } = e;
            setValue(value);
            if (typeof onChange === 'function') {
              // TODO: use debounce for avoiding frequent updates compose text module state
              onChange(value);
            }
          }}
          onKeyPressCapture={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
        
              // TODO: this component should be refactored whole UX logic
              if (sendButtonDisabled) return;
        
              onSend();
            }
          }}
          style={{
            height: inputHeight,
          }}
          disabled={disabled}
        />
        <SendButton
          data-sign="messageButton"
          onClick={onSend}
          disabled={disabled || sendButtonDisabled}
          symbol={sentSvg}
          color="action.primary"
        />
      </TextFiled>
      <AttachmentList
        attachments={attachments}
        removeAttachment={removeAttachment}
        disabled={disabled}
      />
      <SmsTemplateDialog
        open={templateDialogOpen}
        onClose={() => {
          setTemplateDialogOpen(false);
        }}
        templates={templates}
        onApply={(text) => {
          lastValueChangeRef.current = Date.now();
          setValue(text);
          setTemplateDialogOpen(false);
          if (typeof onChange === 'function') {
            // TODO: use debounce for avoiding frequent updates compose text module state
            onChange(text);
          }
        }}
        showTemplateManagement={showTemplateManagement}
        loadTemplates={loadTemplates}
        deleteTemplate={deleteTemplate}
        createOrUpdateTemplate={createOrUpdateTemplate}
      />
    </Container>
  );
}

export default MessageInput;
