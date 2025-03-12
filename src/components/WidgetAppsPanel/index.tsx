import React, { useState, useRef, useEffect } from 'react';
import {
  styled,
  RcTypography,
  RcIconButton,
  RcTab,
} from '@ringcentral/juno';
import { Close } from '@ringcentral/juno-icon';
import { WidgetAppPanel } from './WidgetAppPanel';
import { Container, PageHeader, Content, AppIcon } from './styled';
import { isSameContact } from '../../lib/widgetContact';

const PageTitle = styled(RcTypography)`
  flex: 1;
  text-align: left;
`;

const AppListWrapper = styled(Content)`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  padding: 0;
  padding-top: 10px;
  flex: unset;
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

export function WidgetAppsPanel({
  apps,
  showCloseButton,
  onClose,
  onLoadApp,
  contact,
  onInPageButtonClick,
}) {
  const [currentApp, setCurrentApp] = useState(null);
  const contactRef = useRef(contact);

  useEffect(() => {
    if (!isSameContact(contactRef.current, contact)) {
      setCurrentApp(null);
    }
    contactRef.current = contact;
  }, [contact]);

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
      </Container>
    );
  }
  return (
    <WidgetAppPanel
      app={currentApp}
      onLoadApp={onLoadApp}
      onBack={() => setCurrentApp(null)}
      contact={contact}
      onButtonClick={onInPageButtonClick}
    />
  );
}
