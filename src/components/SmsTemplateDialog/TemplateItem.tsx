import React, { useState } from 'react';
import { handleCopy } from '@ringcentral-integration/widgets/lib/handleCopy';
import {
  RcButton,
  RcIcon,
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  RcListItemSecondaryAction,
  RcChip,
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

const TypeLabel = styled(RcChip)`
  font-size: 0.75rem;
  padding: 0;
  height: 22px;
  top: 6px;
`;

export function TemplateItem({
  template,
  onApply,
  onEdit,
  onDelete,
  showTemplateManagement,
}) {
  const [extended, setExtended] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);

  const showEdit = showTemplateManagement && template.scope === 'Personal';
  const actions = [{
    icon: Copy,
    title: 'Copy',
    disabled: false,
    onClick: () => {
      handleCopy(template.body.text);
    },
  }];
  if (showEdit) {
    actions.push({
      icon: Edit,
      title: 'Edit',
      disabled: false,
      onClick: onEdit,
    });
    actions.push({
      icon: Delete,
      title: 'Delete',
      disabled: false,
      onClick: onDelete,
    });
  }
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
      {
        template.scope === 'Company' && (
          <RcListItemSecondaryAction>
            <TypeLabel label="Company" />
          </RcListItemSecondaryAction>
        )
      }
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
          actions={actions}
        />
      </div>
    </StyledListItem>
  );
}
