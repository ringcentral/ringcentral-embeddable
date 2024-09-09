import React from 'react';

import {
  RcTypography,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcDialogActions,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcIcon,
  RcIconButton,
  styled,
} from '@ringcentral/juno';
import { Conference, Merge, Close } from '@ringcentral/juno-icon';

import i18n from '@ringcentral-integration/widgets/components/ConfirmMergeModal/i18n';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
  }
`;

const ConferenceItem = styled(RcListItem)`
  width: 100%;

  &.RcListItem-gutters {
    padding-left: 0;
    padding-right: 0;
  }
`;

const CloseButton = styled(RcIconButton)`
  position: absolute;
  top: 5px;
  right: 6px;
`;

type ConfirmMergeModalProps = {
  currentLocale: string;
  show: boolean;
  onMerge?: (...args: any[]) => any;
  onCancel?: (...args: any[]) => any;
};
const ConfirmMergeModal: React.FC<ConfirmMergeModalProps> = ({
  currentLocale,
  show,
  onMerge = () => null,
  onCancel = () => null,
}) => {
  return (
    <StyledDialog
      open={show}
      onClose={onCancel}
      keepMounted={false}
    >
      <RcDialogTitle>
        {i18n.getString('confirmation', currentLocale)}
      </RcDialogTitle>
      <RcDialogContent>
        <RcTypography>
          {i18n.getString('confirmMergeToConference', currentLocale)}
        </RcTypography>
      </RcDialogContent>
      <RcDialogActions>
        <ConferenceItem
          canHover={false}
          disableTouchRipple
        >
          <RcListItemAvatar>
            <RcAvatar
              size="xsmall"
              data-sign="avatar"
              color="avatar.global"
            >
              <RcIcon
                symbol={Conference}
                size="small"
              />
            </RcAvatar>
          </RcListItemAvatar>
          <RcListItemText
            primary={i18n.getString('conferenceCall', currentLocale)}
          />
          <RcListItemSecondaryAction>
            <RcIconButton
              symbol={Merge}
              size="small"
              onClick={onMerge}
              variant="contained"
              color="neutral.b03"
              title={i18n.getString('mergeToConference', currentLocale)}
            />
          </RcListItemSecondaryAction>
        </ConferenceItem>
      </RcDialogActions>
      <CloseButton
        symbol={Close}
        onClick={onCancel}
      />
    </StyledDialog>
  );
};

export default ConfirmMergeModal;
