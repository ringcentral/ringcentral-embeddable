import React from 'react';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import {
  RcTabs,
  RcTab,
} from '@ringcentral/juno';

const StyledTabLabel = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 400;

  > span:first-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }

  > span:not(:last-child) {
    margin-right: 4px;
  }
`;

const UnreadCount = styled.span`
  display: inline-block;
  box-sizing: content-box;
  font-size: 0.75rem;
  font-weight: 400;
  text-align: center;
  color: ${palette2('neutral', 'f03')};
`;

const StyledRcTabs = styled(RcTabs)`
  background: ${palette2('neutral', 'b01')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  .RcTab-selected .tab-unread {
    color: ${palette2('tab', 'selected')};
    font-weight: 700;
  }
`;

function TabLabel({
  label,
  unreadCounts = 0,
}) {
  return (
    <StyledTabLabel>
      <span>
        {label}
      </span>
      {
        unreadCounts > 0 && (
          <UnreadCount className="tab-unread">
            ({unreadCounts})
          </UnreadCount>
        )
      }
    </StyledTabLabel>
  )
}

export function SubTabs({
  onChange,
  value,
  tabs,
}) {
  return (
    <StyledRcTabs
      value={value}
      onChange={(_, newValue) => {
        onChange(newValue);
      }}
      variant="fullWidth"
    >
      {
        tabs.map((tab) => (
          <RcTab
            label={
              <TabLabel
                label={tab.label}
                unreadCounts={tab.unreadCounts}
              />
            }
            value={tab.value}
            key={tab.value}
            disabled={tab.disabled}
          />
        ))
      }
    </StyledRcTabs>
  );
}
