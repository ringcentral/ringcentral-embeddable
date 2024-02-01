import { Module } from '@ringcentral-integration/commons/lib/di';
import { CallsListUI as BaseCallsListUI } from '@ringcentral-integration/widgets/modules/CallsListUI';
import { renderExtraCallLogButton } from '../../components/LogIcon/render';

@Module({
  name: 'CallsListUI',
  deps: [
    'Locale',
    'CallLogSection',
    'RouterInteraction',
    'ActivityMatcher',
    { dep: 'CallsListUIOptions', optional: true },
  ],
})
export class CallsListUI extends BaseCallsListUI {
  getUIProps({ ...props }) {
    const {
      callHistory,
      locale,
      callLogger,
      call,
      appFeatures,
      regionSettings,
      connectivityMonitor,
      dateTimeFormat,
      composeText,
    } = this._deps;
    return {
      ...super.getUIProps({ ...props }),
      width: window.innerWidth || 300,
      height: window.innerHeight ? (window.innerHeight - 53) : 454,
      adaptive: true,
      onlyHistory: true,
      // showSaveLogBtn: false,
      useNewList: true,
      disableClickToDial:
        !(call && call.isIdle) || !appFeatures.isCallingEnabled,
      showSpinner: !(
        callHistory.ready &&
        locale.ready &&
        regionSettings.ready &&
        dateTimeFormat.ready &&
        connectivityMonitor.ready &&
        appFeatures.ready &&
        (!call || call.ready) &&
        (!composeText || composeText.ready)
      ),
      showLogButton: callLogger.ready,
      logButtonTitle: callLogger.logButtonTitle,
    };
  }

  getUIFunctions({ ...props }) {
    const {
      callLogSection,
      routerInteraction,
      locale,
      callLogger,
    } = this._deps;
    let onLogCall = null; // hide default log button
    if (callLogger.ready) {
      onLogCall = (async ({ call }) => {
        if (callLogger.showLogModal) {
          callLogSection.handleLogSection(call);
          return;
        }
        await callLogger.logCall({
          call,
        });
      });
    }
    return {
      ...super.getUIFunctions({
        ...props,
      }),
      onLogCall,
      renderExtraButton: renderExtraCallLogButton({
        callLogSection,
        callLogger,
        locale,
      }),

      // hide default log & view contact button
      onViewContact: props.onViewContact || (({ contact: { type, id } }) => {
        routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
      }),
      isLoggedContact(call, activity, contact) {
        return (
          activity &&
          contact &&
          activity.contact &&
          activity.contact.id === contact.id
        );
      },
    };
  }
}
