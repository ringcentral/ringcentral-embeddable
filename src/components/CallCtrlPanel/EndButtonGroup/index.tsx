import React from 'react';
import type { FunctionComponent } from 'react';
import {
  HangUpSp as EndIcon,
  KeypadOffSp,
} from '@ringcentral/juno-icon';
import { styled, RcIconButton } from '@ringcentral/juno';
import CallCtrlButton from '../../CallCtrlButton';

const Container = styled.div`
  margin-top: 20px;
  margin-bottom: 30px;
  margin-left: 15%;
  margin-right: 15%;
`;

const ButtonGroup = styled.div`
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledCtrlButton = styled(CallCtrlButton)`
  width: 26%;
  padding-top: 26%;
  margin-bottom: 0;
`;

const SideArea = styled.div`
  width: 26%;
`;

export type EndButtonGroupProps = {
  controlBusy: boolean;
  onHangup: () => void;
  onHideKeyPad: () => void;
  showHideKeyPad?: boolean;
}

export const EndButtonGroup: FunctionComponent<EndButtonGroupProps> = ({
  controlBusy,
  onHangup,
  onHideKeyPad,
  showHideKeyPad = false,
}) => {
  return (
    <Container>
      <ButtonGroup>
        <SideArea />
        <StyledCtrlButton
          icon={EndIcon}
          dataSign="hangup"
          disabled={controlBusy}
          onClick={onHangup}
          color="danger.b04"
        />
        <SideArea>
          {
            showHideKeyPad && (
              <RcIconButton
                symbol={KeypadOffSp}
                size="medium"
                color="neutral.f06"
                variant="inverse"
                title="Hide Keypad"
                onClick={onHideKeyPad}
              />
            )
          }
        </SideArea>
      </ButtonGroup>
    </Container>
  );
}