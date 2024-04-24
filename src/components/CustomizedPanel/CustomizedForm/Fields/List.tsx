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
} from '@ringcentral/juno';

const StyledList = styled(RcList)`
  margin: 0 -16px;
`;

const StyledItem = styled(RcListItem)`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  cursor: pointer;
`;

export function List({
  schema,
  disabled,
  formData,
  onChange,
}) {
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
                <RcAvatar
                  size="xsmall"
                  src={item.icon}
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
