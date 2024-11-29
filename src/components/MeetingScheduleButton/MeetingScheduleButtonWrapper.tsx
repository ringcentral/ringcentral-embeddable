import { css, palette2, RcButton, styled } from '@ringcentral/juno';

export const ScheduleButton = styled(RcButton)``;

export const MeetingScheduleButtonWrapper = styled.div<{ $hidden: boolean }>`
  flex-shrink: 0;
  padding: 3px 20px 16px;
  background-color: transparent;
  box-shadow: none;

  ${({ $hidden }) =>
    $hidden
      ? css`
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          margin-top: -20px;
        `
      : css`
          border-top: 1px solid ${palette2('neutral', 'l02')};
          position: relative;
          background-color: ${palette2('neutral', 'b01')};
        `};

  ${ScheduleButton} {
    margin-top: 13px;
  }
`;
