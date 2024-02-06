import {
  styled,
  palette2,
  ellipsis,
  RcListItem,
  RcListItemIcon,
} from '@ringcentral/juno';

import { ActionMenu } from '../ActionMenu';

export const StyledListItem = styled(RcListItem)`
  padding: 6px 16px;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  background-color: ${palette2('neutral', 'b01')};
  height: 60px;
  box-sizing: border-box;

  .call-item-action-menu {
    display: none;
  }

  &:hover {
    .call-item-time {
      display: none;
    }
    .call-item-action-menu {
      display: flex;
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
`;

export const StyledItemIcon = styled(RcListItemIcon)`
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
