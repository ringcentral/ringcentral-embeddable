import type { ModuleOptions } from 'reactant';

import type { CxRuntimeOptions } from '../app/services/RingCX/RingCX.interface';
import { CxRouteCoordinator } from './CxRouteCoordinator';
import { RingCXAdapterBridge } from './services/RingCXAdapterBridge';
import { CxAnnouncementsView } from './CxAnnouncements.view';
import { CxAppView } from './CxApp.view';
import { CxSettingsView } from './CxSettings.view';
import { CxAgentAssistant } from './services/CxAgentAssistant';
import { CxAgentScript } from './services/CxAgentScript';
import { CxAgentSession } from './services/CxAgentSession';
import { CxAuth } from './services/CxAuth';
import { CxActiveCallControl } from './services/CxActiveCallControl';
import { CxCall } from './services/CxCall';
import { CxCallDataSource } from './services/CxCallDataSource';
import { CxCallDisposition } from './services/CxCallDisposition';
import { CxCallHistory } from './services/CxCallHistory';
import { CxCallMonitor } from './services/CxCallMonitor';
import { CxRequeueCall } from './services/CxRequeueCall';
import { CxTransferCall } from './services/CxTransferCall';
import { CxClient } from './services/CxClient';
import { CxDirectorySearch } from './services/CxDirectorySearch';
import { CxIntegratedSoftphone } from './services/CxIntegratedSoftphone';
import { CxLeads } from './services/CxLeads';
import { CxPresence } from './services/CxPresence';
import { CxSessionRecovery } from './services/CxSessionRecovery';
import { CxSettings } from './services/CxSettings';
import { CxSubscription } from './services/CxSubscription';
import { CxWorkingState } from './services/CxWorkingState';
import { RingCXSideWidgets } from './services/RingCXSideWidgets';
import { CxAgentView } from './views/CxAgentView';
import { CxActiveCallListView } from './views/CxActiveCallListView';
import { CxActiveCallView } from './views/CxActiveCallView';
import { CxCallHistoryDetailView } from './views/CxCallHistoryDetailView';
import { CxCallHistoryView } from './views/CxCallHistoryView';
import { CxChooseAccountView } from './views/CxChooseAccountView';
import { CxDialerView } from './views/CxDialerView';
import { CxDispositionView } from './views/CxDispositionView';
import { CxIntegratedSoftphoneView } from './views/CxIntegratedSoftphoneView';
import { CxLeadsView } from './views/CxLeadsView';
import { CxManualDialSettingsView } from './views/CxManualDialSettingsView';
import { CxMultiLoginView } from './views/CxMultiLoginView';
import { CxOffhookButtonView } from './views/CxOffhookButtonView';
import { CxSessionConfigView } from './views/CxSessionConfigView';
import { CxSessionInfoView } from './views/CxSessionInfoView';
import { CxSessionUpdateView } from './views/CxSessionUpdateView';
import { CxTransferView } from './views/CxTransferView';
import { CxWorkingStateSelectView } from './views/CxWorkingStateSelectView';

export function getRingCXModules(
  options: CxRuntimeOptions,
): ModuleOptions[] {
  return [
    {
      provide: 'CxClientOptions',
      useValue: {
        options: {
          allowMultiSocket: false,
          authHost: options.authHost,
          clientAppType: options.clientAppType,
          clientAppVersion: options.clientAppVersion,
          componentName: 'RingCX Embeddable',
          isI18nEnabled: true,
          isSecureSocket: true,
          localTesting: false,
        },
        callbacks: {
          closeResponse: () => undefined,
          openResponse: () => undefined,
        },
      },
    },
    {
      provide: 'CxWorkingStateOptions',
      useValue: { hideCallNote: options.hideCallNote },
    },
    {
      provide: 'CxActiveCallViewOptions',
      useValue: { hideCallNote: options.hideCallNote },
    },
    {
      provide: 'CxDispositionViewOptions',
      useValue: { hideCallNote: options.hideCallNote },
    },
    {
      provide: 'CxSessionRecoveryOptions',
      useValue: { dispositionPathPrefix: '/agent/calls' },
    },
    {
      provide: 'CxSessionConfigViewOptions',
      useValue: { showReChooseAccount: true },
    },
    {
      provide: 'CxAgentScriptOptions',
      useValue: {
        enabled: options.enableAgentScript,
        pageUrl: options.agentScriptPageUrl,
      },
    },
    {
      provide: 'CxAgentAssistantOptions',
      useValue: {
        clientId: options.agentAssistantClientId,
        pageUrl: options.agentAssistantPageUrl,
      },
    },
    CxClient,
    CxSubscription,
    CxAuth,
    CxPresence,
    CxCallDataSource,
    CxAgentSession,
    CxSettings,
    CxCallMonitor,
    CxCallDisposition,
    CxActiveCallControl,
    CxTransferCall,
    CxRequeueCall,
    CxWorkingState,
    CxIntegratedSoftphone,
    CxCall,
    CxDirectorySearch,
    CxLeads,
    CxCallHistory,
    CxSessionRecovery,
    CxAgentScript,
    CxAgentAssistant,
    RingCXSideWidgets,
    CxMultiLoginView,
    CxChooseAccountView,
    CxSessionConfigView,
    CxSessionUpdateView,
    CxSessionInfoView,
    CxDialerView,
    CxLeadsView,
    CxCallHistoryView,
    CxCallHistoryDetailView,
    CxWorkingStateSelectView,
    CxOffhookButtonView,
    CxIntegratedSoftphoneView,
    CxAgentView,
    CxActiveCallView,
    CxActiveCallListView,
    CxDispositionView,
    CxTransferView,
    CxManualDialSettingsView,
    // Registered against the string token, not the bare class: every consumer
    // injects it as `@optional('RingCXAdapterBridge')`, and a bare class
    // binding is not reachable by that name. A missing binding resolves to
    // `undefined` and every bridge call becomes a silent no-op.
    { provide: 'RingCXAdapterBridge', useClass: RingCXAdapterBridge },
    CxRouteCoordinator,
    CxAnnouncementsView,
    CxAppView,
    CxSettingsView,
  ];
}
