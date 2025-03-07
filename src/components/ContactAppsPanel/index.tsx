import React, { useState } from 'react';
import {
  styled,
  RcTypography,
  RcIconButton,
  RcTab,
} from '@ringcentral/juno';
import { Close } from '@ringcentral/juno-icon';
import { ContactAppPanel } from './ContactAppPanel';
import { Container, PageHeader, Content, AppIcon } from './styled';

const PageTitle = styled(RcTypography)`
  flex: 1;
  text-align: left;
`;

const AppListWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const AppItem = styled(RcTab)`
  width: 60px;
  margin-left: 12px;
  margin-right: 12px;
  margin-bottom: 8px;
  padding-left: 0;
  padding-right: 0;
  opacity: 1;

  .RcTab-wrapper {
    font-size: 13px;
  }
`;

const EmptyMessage = styled(RcTypography)`
  text-align: center;
  margin-top: 32px;
  width: 100%;
`;

export function ContactAppsPanel({
  apps,
  showCloseButton,
  onClose,
  onLoadApp,
}) {
  const [currentApp, setCurrentApp] = useState(null);

  if (!currentApp) {
    return (
      <Container>
        <PageHeader>
          <PageTitle variant="subheading2">Available apps</PageTitle>
          {
            showCloseButton && (
              <RcIconButton
                symbol={Close}
                onClick={onClose}
              />
            )
          }
        </PageHeader>
        <Content>
          <AppListWrapper>
            {
              apps.map((app) => (
                <AppItem
                  key={app.id}
                  label={app.name}
                  icon={<AppIcon src={app.iconUri} />}
                  onClick={() => setCurrentApp(app)}
                />
              ))
            }
            {
              apps.length === 0 && (
                <EmptyMessage variant="body1">No available apps</EmptyMessage>
              )
            }
          </AppListWrapper>
        </Content>
      </Container>
    );
  }
  return (
    <ContactAppPanel
      app={currentApp}
      onLoadApp={onLoadApp}
      onBack={() => setCurrentApp(null)}
    />
  );
}
