import React, { useState } from 'react';
import {
  styled,
  palette2,
  RcTypography,
  RcIconButton,
  RcTab,
} from '@ringcentral/juno';
import { Close, ArrowLeft2, Refresh } from '@ringcentral/juno-icon';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  width: 100%;
  background: ${palette2('neutral', 'b01')};
  color: ${palette2('neutral', 'f06')};
`;

const PageHeader = styled.div`
  padding: 0 16px;
  padding-right: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  align-items: center;
`;

const PageTitle = styled(RcTypography)`
  flex: 1;
  text-align: left;
`;

const Content = styled.div`
  flex: 1;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
`;

const AppListWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const AppIcon = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
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

const AppIconInHeader = styled(AppIcon)`
  width: 24px;
  height: 24px;
  margin-right: 8px;
`;

const BackButton = styled(RcIconButton)`
  margin-left: -10px;
`;

export function ContactAppsPanel({
  apps,
  showCloseButton,
  onClose,
  contact
}) {
  const [currentApp, setCurrentApp] = useState(null);

  if (!currentApp) {
    return (
      <Container>
        <PageHeader>
          <PageTitle variant="subheading2">My apps</PageTitle>
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
          </AppListWrapper>
        </Content>
      </Container>
    );
  }
  return (
    <Container>
      <PageHeader>
        <BackButton
          symbol={ArrowLeft2}
          onClick={() => setCurrentApp(null)}
          variant="plain"
          size="xlarge"
        />
        <AppIconInHeader src={currentApp.iconUri} />
        <PageTitle variant="subheading2">{currentApp.name}</PageTitle>
        <RcIconButton
          symbol={Refresh}
          onClick={() => setCurrentApp(currentApp)}
          size="small"
        />
      </PageHeader>
      <Content>
        app
      </Content>
    </Container>
  );
}
