import React from 'react';

import {
  styled,
  RcButton,
  RcDialog,
  RcDialogContent,
  RcDialogActions,
  RcDialogTitle,
  RcTypography,
} from '@ringcentral/juno';
import { format } from '@ringcentral-integration/utils';
import i18n from '@ringcentral-integration/widgets/components/ActiveCallItem/i18n';
import SwitchImage from '@ringcentral-integration/widgets/assets/images/img_call_switch.svg';

const StyledDialogContent = styled(RcDialogContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ImageWrapper = styled('div')`
  padding: 10px 0;
`;

export function SwitchDialog({
  open,
  onClose,
  onSwitch,
  contactName,
  currentLocale,
}) {
  if (!open) {
    return null;
  }
  return (
    <RcDialog
      open={open}
      onClose={onClose}
    >
      <RcDialogTitle>
        {i18n.getString('callSwitch', currentLocale)}
      </RcDialogTitle>
      <StyledDialogContent>
        <ImageWrapper>
          <SwitchImage width="116" height="69" />
        </ImageWrapper>
        <RcTypography variant="body1">
          {
            format(i18n.getString('comfirmContext', currentLocale), {
              // displayName: activeCall.name,
              displayName: contactName,
            })
          }
        </RcTypography>
      </StyledDialogContent>
      <RcDialogActions>
        <RcButton variant="plain" onClick={onClose}>
          {i18n.getString('comfirmCancelButton', currentLocale)}
        </RcButton>
        <RcButton onClick={onSwitch}>{i18n.getString('comfirmOKButton', currentLocale)}</RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}
