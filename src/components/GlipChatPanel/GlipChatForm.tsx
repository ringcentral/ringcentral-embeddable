import React from 'react';
import { styled, palette2, RcIconButton } from '@ringcentral/juno';
import { Attachment, Emoji, SendFilled } from '@ringcentral/juno-icon';
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
  height = 120,
  textValue = '',
  onTextChange,
  onSubmit,
  onUploadFile,
  groupId,
  members = [],
  disabled,
}) {
  return (
    <Root className={className}>
      <Tools>
        <RcIconButton
          symbol={Emoji}
          onClick={() => {}}
        />
        <RcIconButton
          symbol={Attachment}
          onClick={() => {}}
        />
      </Tools>
      <InputArea>
        <StyledInput
          placeholder={placeholder}
          value={textValue}
          onChange={(text, mentions) => {
            onTextChange(text, mentions.map((mention) => {
              const member = members.find((m) => m.email === mention.id);
              return {
                mention: mention.mention,
                matcherId: member && member.id,
              };
            }))
          }}
          suggestions={members}
          disabled={disabled}
        />
        <SendButton
          onClick={onSubmit}
          symbol={SendFilled}
          disabled={!textValue}
          color="action.primary"
        />
      </InputArea>
    </Root>
  )
}
