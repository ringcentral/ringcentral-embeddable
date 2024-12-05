import React, { useCallback, useRef, useState } from 'react';
import { styled, palette2, RcIconButton, RcPopover } from '@ringcentral/juno';
import { Attachment, Emoji, SendFilled } from '@ringcentral/juno-icon';
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { GlipTextInput } from './GlipTextInput';

const Root = styled.div`
  display: flex;
  flex-direction: column;
`;

const Tools = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const StyledInput = styled(GlipTextInput)`
  flex: 1;
`;

const InputArea = styled.div`
  padding-right: 50px;
  padding-left: 10px;
  padding-bottom: 10px;
  padding-top: 10px;
  box-sizing: border-box;
  position: relative;
  border: 1px solid ${palette2('neutral', 'l02')};
  border-radius: 5px;
  margin: 0 10px 10px 10px;
  margin-top: 0;
`;

const SendButton = styled(RcIconButton)`
  position: absolute;
  bottom: 2px;
  right: 2px;
`;

export function GlipChatForm({
  className,
  placeholder,
  textValue = '',
  onTextChange,
  onSubmit,
  onUploadFile,
  groupId,
  members = [],
  disabled,
}) {
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const emojiButtonRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  return (
    <Root className={className}>
      <Tools>
        <RcIconButton
          symbol={Emoji}
          onClick={() => {
            setShowEmojiPicker(true);
          }}
          disabled={disabled}
          innerRef={emojiButtonRef}
        />
        <RcIconButton
          symbol={Attachment}
          onClick={() => {
            fileInputRef.current.click();
          }}
          disabled={disabled}
        />
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) {
              return;
            }
            setSending(true);
            const reader = new FileReader();
            reader.onloadend = async (evt) => {
              if (evt.target.readyState === FileReader.DONE) {
                await onUploadFile(file.name, evt.target.result);
              }
              setSending(false);
            };
            reader.readAsArrayBuffer(file);
          }}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <RcPopover
          open={showEmojiPicker}
          anchorEl={emojiButtonRef.current}
          anchorOrigin={{
            horizontal: 'center',
            vertical: 'top'
          }}
          onClose={() => {
            setShowEmojiPicker(false);
          }}
          transformOrigin={{
            horizontal: 'center',
            vertical: 'top'
          }}
        >
          {
            showEmojiPicker ? (
              <Picker
                data={emojiData}
                onEmojiSelect={(emoji) => {
                  setShowEmojiPicker(false);
                  if (inputRef.current) {
                    const range = inputRef.current.getSelection();
                    const position = range ? range.index : 0;
                    inputRef.current.insertText(
                      position,
                      position === 0 ? `${emoji.shortcodes} ` : ` ${emoji.shortcodes} `,
                    );
                  }
                }}
              />
            ) : null
          }
        </RcPopover>
      </Tools>
      <InputArea>
        <StyledInput
          placeholder={placeholder}
          value={textValue}
          onChange={onTextChange}
          suggestions={members}
          disabled={disabled}
          ref={inputRef}
        />
        <SendButton
          onClick={async () => {
            setSending(true)
            await onSubmit();
            setSending(false);
          }}
          symbol={SendFilled}
          disabled={!textValue}
          color="action.primary"
          loading={sending}
        />
      </InputArea>
    </Root>
  )
}
