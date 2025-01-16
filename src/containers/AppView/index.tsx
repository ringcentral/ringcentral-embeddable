import React, { useRef } from 'react';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { ModalContainer } from '@ringcentral-integration/widgets/containers/ModalContainer';
import { ConnectivityBadgeContainer } from '@ringcentral-integration/widgets/containers/ConnectivityBadgeContainer';
import CallBadgeContainer from '@ringcentral-integration/widgets/containers/CallBadgeContainer';
import { DrawerContext } from '../../lib/DrawerContext';
import { NotificationContainer } from '../NotificationContainer';
import { SideDrawerContainer } from '../SideDrawerContainer';
import MeetingInviteModal from '../MeetingInviteModal';
import { IncomingCallContainer } from '../IncomingCallContainer';
import { DemoOnlyBanner } from '../../components/DemoOnlyBanner';
import { InitializeAudioBanner } from '../../components/InitializeAudioBanner';
import { EnvironmentPanel } from '../../components/EnvironmentPanel';

import './styles.scss';

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${palette2('neutral', 'b01')};
  display: flex;
  flex-direction: row;
`;

const MainContent = styled.div<{ showSideDrawer: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  width: 100%;
  position: relative;
  max-width: ${({ showSideDrawer }) => showSideDrawer ? '50%' : '100%'};
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  position: relative;
`;

function AppView({
  showDemoWarning,
  dismissDemoWarning,
  showAudioInit,
  onEnableAudio,
  showSideDrawer,
  callBadgeHidden,
  goToCallCtrl,
  getAvatarUrl,
  getPresence,
  children = null,
  server = null,
  environmentEnabled = false,
  clientId = null,
  clientSecret = null,
  onSetData = undefined,
  redirectUri,
}: {
  showDemoWarning: boolean,
  dismissDemoWarning: Function,
  showAudioInit: boolean,
  onEnableAudio: Function,
  showSideDrawer: boolean,
  openSideDrawer: Function,
  callBadgeHidden: boolean,
  goToCallCtrl: Function,
  getAvatarUrl: Function,
  getPresence: Function,
  children: any,
  server: string,
  environmentEnabled: boolean,
  clientId: string,
  clientSecret: string,
  onSetData: Function,
  redirectUri: string,
}) {
  const mainContent = useRef(null);
  return (
    <Root>
      <MainContent showSideDrawer={showSideDrawer}>
        <DemoOnlyBanner
          show={showDemoWarning}
          onClose={dismissDemoWarning}
        />
        {
          showAudioInit ? (
            <InitializeAudioBanner
              onEnableAudio={onEnableAudio}
            />
          ) : null
        }
        <Content ref={mainContent}>
          {children}
          <CallBadgeContainer
            hidden={callBadgeHidden}
            goToCallCtrl={goToCallCtrl}
          />
          <IncomingCallContainer
            showContactDisplayPlaceholder={false}
            getAvatarUrl={getAvatarUrl}
            showCallQueueName
            getPresence={getPresence}
            container={mainContent.current}
          />
          <ConnectivityBadgeContainer />
          <MeetingInviteModal />
          <ModalContainer />
          <NotificationContainer
            callingSettingsUrl="/settings/calling"
            regionSettingsUrl="/settings/region"
          />
          <EnvironmentPanel
            server={server}
            enabled={environmentEnabled}
            clientId={clientId}
            clientSecret={clientSecret}
            onSetData={onSetData}
            redirectUri={redirectUri}
            recordingHost={''}
          />
        </Content>
      </MainContent>
      <SideDrawerContainer />
    </Root>
  );
}

const AppViewConnected = connectModule((phone) => phone.appViewUI)(AppView);

export default AppViewConnected;
