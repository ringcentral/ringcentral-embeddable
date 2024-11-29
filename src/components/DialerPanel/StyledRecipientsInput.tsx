import { styled } from '@ringcentral/juno';

import RecipientsInput from '../RecipientsInput';

export const StyledRecipientsInput = styled(RecipientsInput)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 0;
  margin-bottom: 0;

  label {
    display: none;
  }

  input {
    text-align: center;
  }

  .RecipientsInput_rightPanel {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .RecipientsInput_inputField {
    padding-left: 20px;
  }
`;
