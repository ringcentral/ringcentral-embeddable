import React from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { SubTabs } from '../SubTabs';
import i18n from '../MainViewPanel/i18n';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
`;

export function PhoneTabsView({
  currentLocale,
  currentPath,
  showActiveCalls,
  goTo,
  children,
  disableHistory,
}) {
  const tabs = [{
    value: '/dialer',
    label: i18n.getString('dialpadLabel', currentLocale),
  }];
  if (showActiveCalls) {
    tabs.push({
      value: '/calls',
      label: i18n.getString('callsLabel', currentLocale),
    });
  }
  tabs.push({
    value: '/history',
    label: i18n.getString('historyLabel', currentLocale),
    disabled: disableHistory,
  });
  return (
    <Container>
      <SubTabs
        onChange={goTo}
        value={currentPath}
        tabs={tabs}
      />
      <Content>
        {children}
      </Content>
    </Container>
  );
}
