import React, { useState } from 'react';
import type { FunctionComponent } from 'react';

import {
  RcDialerPadSoundsMPEG,
  RcDialPad,
  useAudio,
  RcTextField,
  styled,
} from '@ringcentral/juno';
import { sleep } from '@ringcentral-integration/commons/utils';

const cleanRegex = /[^\d*#]/g;
const filter = (value: any) => value.replace(cleanRegex, '');
const MAX_PASTE_LENGTH = 15;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
`;

const StyledInput = styled(RcTextField)`
  margin-bottom: 5px;

  .RcTextFieldInput-underline:before {
    border: none;
  }

  .RcTextFieldInput-underline:hover:before {
    border: none;
  }

  .RcTextFieldInput-underline:after {
    border: none;
  }

  input {
    text-align: center;
  }
`;

const DialPadWrapper = styled.div`
  padding: 0 18%;
  width: 100%;
`;

const StyledDialPad = styled(RcDialPad)`
  max-width: 300px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
`;

type ActiveCallDialPadProps = {
  onChange: (...args: any[]) => any;
};

const ActiveCallKeyPad: FunctionComponent<ActiveCallDialPadProps> = ({
  onChange,
}) => {
  const [value, setValue] = useState('');
  const audio = useAudio();

  const playAudio = async (value: any) => {
    const url = RcDialerPadSoundsMPEG[value];
    if (!url) {
      return;
    }
    if (!audio.paused) {
      try {
        await audio.pause();
      } catch (e) {
        console.error(e);
      }
    }
    audio.src = url;
    audio.currentTime = 0;
    return audio.play().catch((e) => {
      console.error(e);
    });
  };
  const sendDTMFKeys = async (keys: any) => {
    if (keys === '') {
      return;
    }
    onChange(keys);
    for(const key of keys.split('')) {
      await playAudio(key);
      await sleep(200);
    }
  }
  return (
    <Container>
      <StyledInput
        data-sign="input"
        value={value}
        onChange={(e) => {
          const value = filter(e.currentTarget.value);
          setValue(value);
        }}
        onKeyDown={(e) => {
          const value = filter(e.key);
          sendDTMFKeys(value);
        }}
        onPaste={(e) => {
          const item = e.clipboardData.items[0];
          item.getAsString((data: any) => {
            const value = filter(data.replace(/<[^>]*>/g, '')); // remove HTML tag in firefox
            let keys = value;
            if (value.length > MAX_PASTE_LENGTH) {
              keys = value.slice(0, MAX_PASTE_LENGTH);
            }
            console.log(keys);
            sendDTMFKeys(keys);
            if (value.length > MAX_PASTE_LENGTH) {
              setValue((preState) => preState.replace(value, keys));
            }
          });
        }}
        autoFocus
        clearBtn={false}
      />
      <DialPadWrapper>
        <StyledDialPad
          data-sign="keypad"
          onChange={(key) => {
            setValue((preState) => {
              const value = preState + key;
              return value;
            });
            sendDTMFKeys(key);
          }}
          autoSize
        />
      </DialPadWrapper>
    </Container>
  );
}

export default ActiveCallKeyPad;