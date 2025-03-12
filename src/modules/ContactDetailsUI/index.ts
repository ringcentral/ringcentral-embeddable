import { ContactDetailsUI as ContactDetailsUIBase } from '@ringcentral-integration/widgets/modules/ContactDetailsUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'ContactDetailsUI',
  deps: [
    'ComposeTextUI',
    'RecentCalls',
    'RecentMessages',
    'DateTimeFormat',
    'ThirdPartyService',
  ]
})
export class ContactDetailsUI extends ContactDetailsUIBase {
  async handleClickToSMS(contact, phoneNumber: string) {
    const recipient = {
      ...contact,
      phoneNumber,
    };
    this._deps.composeTextUI.gotoComposeText(recipient, false);
    this._trackClickToSMS();
  }

  getUIProps() {
    const {
      recentMessages,
      recentCalls,
      thirdPartyService,
    } = this._deps;
    let messages = [];
    let calls = [];
    let unreadMessageCounts = 0;
    if (this.currentContact) {
      messages = recentMessages.messages[this.currentContact.id] || [];
      calls = recentCalls.calls[this.currentContact.id] || [];
      unreadMessageCounts = recentMessages.unreadMessageCounts[this.currentContact.id] || 0;
    }
    return {
      ...super.getUIProps(),
      messages,
      calls,
      callLoaded: recentCalls.isCallsLoaded,
      messagesLoaded: recentMessages.isMessagesLoaded,
      unreadMessageCounts,
      showActivities: thirdPartyService.activitiesRegistered,
      activitiesTabName : thirdPartyService.activitiesTabName || thirdPartyService.serviceName,
      activities: thirdPartyService.activities,
      activitiesLoaded: thirdPartyService.activitiesLoaded,
    };
  }

  getUIFunctions({ params, navigateTo }) {
    const {
      dateTimeFormat,
      recentCalls,
      recentMessages,
      thirdPartyService,
    } = this._deps;
    return {
      ...super.getUIFunctions({ params }),
      dateTimeFormatter: (...args) => dateTimeFormat.formatDateTime(...args),
      navigateTo,
      loadCalls: async () => {
        await recentCalls.getCalls({
          currentContact: this.currentContact,
        });
      },
      clearCalls: async () => {
        await recentCalls.cleanUpCalls({
          contact: this.currentContact
        });
      },
      loadMessages: async () => {
        await recentMessages.getMessages({
          currentContact: this.currentContact,
        });
      },
      clearMessages: async () => {
        await recentMessages.cleanUpMessages({
          contact: this.currentContact
        });
      },
      loadActivities: async () => {
        await thirdPartyService.fetchActivities(this.currentContact);
      },
      clearActivities: async () => {},
      openActivityDetail: async (activity) => {
        await thirdPartyService.openActivity(activity);
      },
    };
  }
}
