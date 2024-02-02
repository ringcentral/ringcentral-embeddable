import React from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { SubTabs } from '../SubTabs';

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

export function SubTabsView({
  currentPath,
  goTo,
  children,
  tabs,
}) {
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
