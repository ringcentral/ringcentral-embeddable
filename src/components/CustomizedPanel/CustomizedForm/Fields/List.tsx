import React from 'react';

import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcIcon,
  styled,
  palette2,
  css
} from '@ringcentral/juno';

import { ArrowRight } from '@ringcentral/juno-icon';

const StyledList = styled(RcList)`
  margin: 0 -16px;
`;

const StyledItem = styled(RcListItem)`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  cursor: pointer;
`;

const StyledAvatar = styled(RcAvatar)`
  .RcAvatar-avatarContainer {
    ${({ $round }) => 
      $round ? '' : css`
        border-radius: 0;
        background: transparent;
      `
    }
  }
`;

const NavigationIcon = styled(RcIcon)`
  margin: 8px 0;
`;

function Item({
  item,
  disabled,
  selected,
  onClick,
  showIconAsAvatar,
  showAsNavigation,
}) {
  return (
    <StyledItem
      key={item.const}
      disabled={disabled}
      selected={selected}
      onClick={onClick}
    >
      {
        item.icon ? (
          <RcListItemAvatar>
            <StyledAvatar
              size="xsmall"
              src={item.icon}
              $round={showIconAsAvatar}
            />
          </RcListItemAvatar>
        ) : null
      }
      <RcListItemText
        primary={item.title}
        secondary={item.description}
      />
      {
        (item.meta || showAsNavigation) ? (
          <RcListItemSecondaryAction>
            {item.meta}
            {
              showAsNavigation ? (
                <NavigationIcon
                  symbol={ArrowRight}
                  size="large"
                />
              ) : null
            }
          </RcListItemSecondaryAction>
        ) : null
      }
    </StyledItem>
  );
}

export function List({
  schema,
  uiSchema,
  disabled,
  formData,
  onChange,
}) {
  const showIconAsAvatar = 
    typeof uiSchema['ui:showIconAsAvatar'] === 'undefined' ?
    true :
    uiSchema['ui:showIconAsAvatar'];
  const showAsNavigation = 
    typeof uiSchema['ui:navigation'] === 'undefined' ?
    false :
    uiSchema['ui:navigation'];
  const showSelected =
    typeof uiSchema['ui:showSelected'] === 'undefined' ?
    true :
    uiSchema['ui:showSelected'];
  return (
    <StyledList>
      {schema.oneOf.map((item) => (
        <Item
          key={item.const}
          item={item}
          disabled={disabled}
          selected={showSelected && formData === item.const}
          onClick={() => {
            onChange(item.const);
          }}
          showIconAsAvatar={showIconAsAvatar}
          showAsNavigation={showAsNavigation}
        />
      ))}
    </StyledList>
  );
}
