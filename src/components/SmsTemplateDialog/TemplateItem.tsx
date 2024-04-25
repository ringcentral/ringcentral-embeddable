import React, { useState } from 'react';
import { handleCopy } from '@ringcentral-integration/widgets/lib/handleCopy';
import {
  RcButton,
  RcIcon,
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  styled,
} from '@ringcentral/juno';

import {
  ArrowDown2,
  ArrowUp2,
  Copy,
  Edit,
  Delete,
} from '@ringcentral/juno-icon';

import { ActionMenu } from '../ActionMenu';

const StyledListItem = styled(RcListItem)`
  align-items: baseline;
  padding-top: 0;
  padding-bottom: 0;

  .sms-template-btn-group {
    position: absolute;
    right: 16px;
    top: 10px;
    display: none;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  &:hover {
    .sms-template-btn-group {
      display: flex;
    }
  }

  ${({ $hoverOnMoreMenu }) =>
    $hoverOnMoreMenu &&
    `
    .sms-template-btn-group {
      display: flex;
    }
  `}
`;

const StyledListItemIcon = styled(RcListItemIcon)`
  position: relative;
  top: 6px;
  cursor: pointer;
`;

const StyledListItemText = styled(RcListItemText)`
  cursor: pointer;

  &.RcListItemText-multiline {
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 9px;
    padding-bottom: 9px;
  }

  ${({ $extended }) => $extended && `
    .RcListItemText-secondary {
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }
  `}
`;

const StyledActionMenu = styled(ActionMenu)`
  .RcIconButton-root {
    margin-left: 6px;
  }
`;

export function TemplateItem({
  template,
  onApply,
  onEdit,
}) {
  const [extended, setExtended] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);

  return (
    <StyledListItem
      $hoverOnMoreMenu={hoverOnMoreMenu}
    >
      <StyledListItemIcon
        onClick={() => setExtended(!extended)}
      >
        <RcIcon
          symbol={extended ? ArrowUp2 : ArrowDown2}
        />
      </StyledListItemIcon>
      <StyledListItemText
        primary={template.displayName}
        secondary={template.body.text}
        isEllipsis={true}
        $extended={extended}
        onClick={() => setExtended(!extended)}
      />
      <div className="sms-template-btn-group">
        <RcButton
          size="small"
          color="primary"
          radius="round"
          onClick={() => onApply(template.body.text)}
        >
          Apply
        </RcButton>
        <StyledActionMenu
          iconVariant="contained"
          color="neutral.b01"
          size="small"
          maxActions={2}
          onMoreMenuOpen={(open) => {
            setHoverOnMoreMenu(open);
          }}
          actions={[{
            icon: Copy,
            title: 'Copy',
            disabled: false,
            onClick: () => {
              handleCopy(template.body.text);
            },
          }, {
            icon: Edit,
            title: 'Edit',
            disabled: false,
            onClick: onEdit,
          }, {
            icon: Delete,
            title: 'Delete',
            disabled: false,
            onClick: () => {
              console.log('Delete');
            },
          }]}
        />
      </div>
    </StyledListItem>
  );
}
