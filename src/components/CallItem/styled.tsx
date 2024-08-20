import {
  styled,
  palette2,
  ellipsis,
  RcListItem,
  RcListItemIcon,
} from '@ringcentral/juno';

import { ActionMenu } from '../ActionMenu';

export const StyledListItem = styled(RcListItem)`
  padding: 0;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  background-color: ${palette2('neutral', 'b01')};
  height: 60px;
  box-sizing: border-box;
  ${({ $clickable }) =>
    $clickable &&
    `
    cursor: pointer;
  `}

  &.RcListItem-gutters {
    padding: 0;
  }

  .MuiListItemText-root {
    margin: 0;
    padding: 10px 16px 10px 0;
  }

  .call-item-action-menu {
    display: none;
  }

  .call-item-recording-icon {
    margin-right: 4px;
  }

  &:hover {
    .call-item-time {
      display: none;
    }
    .call-item-action-menu {
      display: flex;
    }
    .call-item-recording-icon {
      color: ${palette2('action', 'primary')};
    }
  }

  ${({ $hoverOnMoreMenu }) =>
    $hoverOnMoreMenu &&
    `
    .call-item-time {
      display: none;
    }
    .call-item-action-menu {
      display: flex;
    }
  `}

  ${({ $cursorPointer }) => {
    if ($cursorPointer) {
      return `
      cursor: pointer;
    `;
    }
  }}
`;

export const StyledItemIcon = styled(RcListItemIcon)`
  padding: 16px 0 16px 16px;

  .icon {
    font-size: 26px;
  }
`;

export const StyledSecondary = styled.span`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

export const DetailArea = styled.span`
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  flex-direction: row;
  ${ellipsis()}
`;


export const StyledActionMenu = styled(ActionMenu)`
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -16px;

  .RcIconButton-root {
    margin-left: 6px;
  }
`;
