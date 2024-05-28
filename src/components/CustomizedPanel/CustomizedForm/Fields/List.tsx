import React from 'react';

import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  styled,
  palette2,
  css
} from '@ringcentral/juno';

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
  return (
    <StyledList>
      {schema.oneOf.map((item) => (
        <StyledItem
          key={item.const}
          disabled={disabled}
          selected={formData === item.const}
          onClick={() => {
            onChange(item.const);
          }}
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
            item.meta ? (
              <RcListItemSecondaryAction>
                {item.meta}
              </RcListItemSecondaryAction>
            ) : null
          }
        </StyledItem>
      ))}
    </StyledList>
  );
}
