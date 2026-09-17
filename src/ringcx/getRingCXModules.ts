import type { ModuleOptions } from 'reactant';

import type { CxRuntimeOptions } from '../app/services/RingCX/RingCX.interface';
import { CxRouteCoordinator } from './CxRouteCoordinator';
import { CxAppView } from './CxApp.view';
import { CxSettingsView } from './CxSettings.view';
import { CxAgentSession } from './services/CxAgentSession';
import { CxAuth } from './services/CxAuth';
import { CxCall } from './services/CxCall';
import { CxCallDataSource } from './services/CxCallDataSource';
import { CxCallDisposition } from './services/CxCallDisposition';
import { CxCallHistory } from './services/CxCallHistory';
import { CxCallMonitor } from './services/CxCallMonitor';
import { CxClient } from './services/CxClient';
import { CxDirectorySearch } from './services/CxDirectorySearch';
import { CxIntegratedSoftphone } from './services/CxIntegratedSoftphone';
import { CxLeads } from './services/CxLeads';
import { CxPresence } from './services/CxPresence';
import { CxSessionRecovery } from './services/CxSessionRecovery';
import { CxSettings } from './services/CxSettings';
import { CxSubscription } from './services/CxSubscription';
import { CxWorkingState } from './services/CxWorkingState';
import { CxAgentView } from './views/CxAgentView';
import { CxCallHistoryDetailView } from './views/CxCallHistoryDetailView';
import { CxCallHistoryView } from './views/CxCallHistoryView';
import { CxChooseAccountView } from './views/CxChooseAccountView';
import { CxDialerView } from './views/CxDialerView';
import { CxIntegratedSoftphoneView } from './views/CxIntegratedSoftphoneView';
import { CxLeadsView } from './views/CxLeadsView';
import { CxMultiLoginView } from './views/CxMultiLoginView';
import { CxOffhookButtonView } from './views/CxOffhookButtonView';
import { CxSessionConfigView } from './views/CxSessionConfigView';
import { CxSessionInfoView } from './views/CxSessionInfoView';
import { CxSessionUpdateView } from './views/CxSessionUpdateView';
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
      provide: 'CxSessionRecoveryOptions',
      useValue: { dispositionPathPrefix: '/agent/calls' },
    },
    {
      provide: 'CxSessionConfigViewOptions',
      useValue: { showReChooseAccount: true },
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
    CxWorkingState,
    CxIntegratedSoftphone,
    CxCall,
    CxDirectorySearch,
    CxLeads,
    CxCallHistory,
    CxSessionRecovery,
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
    CxRouteCoordinator,
    CxAppView,
    CxSettingsView,
  ];
}
