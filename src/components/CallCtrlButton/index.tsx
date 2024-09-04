import React from 'react';
import type { FunctionComponent, RefObject } from 'react';
import {
  styled,
  palette2,
  css,
  setOpacity,
  RcIconButton,
  RcText,
} from '@ringcentral/juno';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  height: 0;
  padding-top: 40px;
  margin-bottom: 40px;
  position: relative;
`;

const StyledIconButton = styled(RcIconButton)<{ $active: boolean, $activeColor: string }>`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  &.RcIconButton-contained {
    box-shadow: none;
    ${({ $active, $activeColor }) => $active && !$activeColor ? css`
      background-color: ${setOpacity(palette2('interactive', 'b02'), '12')};
      color: ${palette2('interactive', 'f01')};

      &:hover {
        color: ${palette2('interactive', 'f01')};
      }
    ` : ''}
  }
`;

const Label = styled(RcText)`
  text-align: center;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 5px);
`;

type ActiveCallButtonProps = {
  className?: string;
  buttonClassName?: string;
  onClick?: (...args: any[]) => any;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  icon?: (...args: any[]) => any;
  showRipple?: boolean;
  dataSign?: string;
  color?: string;
  activeColor?: string;
  buttonRef?: RefObject<HTMLDivElement>;
};
const CallCtrlButton: FunctionComponent<ActiveCallButtonProps> = ({
  className = undefined,
  icon,
  dataSign,
  buttonClassName = undefined,
  disabled = false,
  onClick = undefined,
  color,
  activeColor,
  buttonRef = undefined,
  active = false,
  title = undefined,
  showRipple = false,
}) => {
  const buttonColor = active ?
    (activeColor || 'interactive.b01') :
    (color || 'neutral.b03');
  return (
    <Container className={className}>
      <StyledIconButton
        symbol={icon}
        size="large"
        data-sign={dataSign}
        className={buttonClassName}
        variant="contained"
        disabled={disabled}
        onClick={onClick}
        color={buttonColor}
        innerRef={buttonRef}
        $active={active}
        $activeColor={activeColor}
      />
      {
        title && (
          <Label variant="caption1" color={disabled ? 'neutral.f02' : 'neutral.f06'}>
            {title}
          </Label>
        )
      }
    </Container>
  );
};

export default CallCtrlButton;
