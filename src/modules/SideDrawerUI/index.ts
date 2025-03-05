import type { ReactNode } from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state, track } from '@ringcentral-integration/core';
import { trackEvents } from '../Analytics/trackEvents';
interface Widget {
  id: string;
  name: string;
  icon?: string;
  node?: ReactNode;
  onClose?: () => void;
  showTitle?: boolean;
  params: Record<string, any>;
  showCloseButton?: boolean;
}

type Variant = 'permanent' | 'temporary';

type CurrentContact = {
  id?: string;
  phoneNumber?: string;
  phoneNumbers?: {
    phoneNumber: string;
  }[];
}

function isSameContact(contact1?: CurrentContact | null, contact2?: CurrentContact | null) {
  if (!contact1 || !contact2) {
    return false;
  }
  if (
    contact1.id &&
    contact2.id &&
    contact1.id === contact2.id
  ) {
    return true;
  }
  if (
    contact1.phoneNumber &&
    contact2.phoneNumber &&
    contact1.phoneNumber === contact2.phoneNumber
  ) {
    return true
  }
  if (
    contact1.phoneNumbers &&
    contact2.phoneNumber &&
    contact1.phoneNumbers.some((p) => p.phoneNumber === contact2.phoneNumber)
  ) {
    return true;
  }
  if (
    contact2.phoneNumbers &&
    contact1.phoneNumber &&
    contact2.phoneNumbers.some((p) => p.phoneNumber === contact1.phoneNumber)
  ) {
    return true;
  }
  return false;
}

function isContactHasNewData(currentContact: CurrentContact, newContact: CurrentContact) {
  if (!currentContact.id && newContact.id) {
    return true;
  }
  if (
    currentContact.id &&
    newContact.id &&
    !currentContact.phoneNumber &&
    newContact.phoneNumber
  ) {
    return true
  }
  if (
    currentContact.id &&
    newContact.id &&
    currentContact.phoneNumber &&
    newContact.phoneNumber &&
    !currentContact.phoneNumbers &&
    newContact.phoneNumbers
  ) {
    return true;
  }
}

@Module({
  name: 'SideDrawerUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'SideDrawerUIOptions',
    'ThirdPartyService',
    'Analytics',
  ],
})
export class SideDrawerUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  get enabled() {
    return this._deps.sideDrawerUIOptions.enableSideWidget;
  }

  onInitOnce() {
    const handleResize = () => {
      const smallWindow = window.innerWidth < 500;
      if (smallWindow && this.extended) {
        this.setExtended(false);
      }
      if (!smallWindow && this.widgets.length > 0 && !this.extended) {
        this.setExtended(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
  }

  @state
  extended = false;

  @state
  variant = 'temporary';

  @state
  widgets: Widget[] = [];

  @state
  currentWidgetId: String | null = null;

  @state
  currentContact: CurrentContact | null = null;

  @action
  setExtended(extended: boolean) {
    this.extended = extended;
    if (this.extended && this.variant === 'temporary') {
      this.setVariant('permanent');
    }
    if (!this.extended && this.variant === 'permanent') {
      this.setVariant('temporary');
    }
  }

  @track((that) => that.extended ? [trackEvents.openSideDrawer] : [trackEvents.closeSideDrawer])
  toggleExtended() {
    this.setExtended(!this.extended);
  }

  @action
  setVariant(variant: Variant) {
    this.variant = variant;
  }

  @action
  addWidget(widget: Widget) {
    if (this.widgets.some((w) => w.id === widget.id)) {
      return;
    }
    this.widgets = this.widgets.concat(widget);
  }

  @action
  openWidget({
    widget,
    openSideDrawer = false,
    contact = null,
  }: {
    widget: Widget;
    openSideDrawer?: boolean;
    contact?: CurrentContact | null;
  }) {
    const sameContact = isSameContact(this.currentContact, contact);
    if (!sameContact) {
      this.widgets = [widget];
      this.currentContact = contact;
    } else {
      if (isContactHasNewData(this.currentContact!, contact!)) {
        this.currentContact = contact;
      }
      this.widgets = [widget].concat(this.widgets.filter((w) => w.id !== widget.id));
    }
    this.currentWidgetId = widget.id;
    if (openSideDrawer && !this.extended) {
      this.extended = true;
      this.variant = 'permanent';
    }
  }

  @action
  closeWidget(widgetId: string) {
    if (!widgetId && this.widgets.length === 0) {
      // close side drawer for empty view close
      this.extended = false;
      this.variant = 'temporary';
      return;
    }
    const index = this.widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) {
      return;
    }
    const widget = this.widgets[index];
    if (typeof widget.onClose === 'function') {
      widget.onClose();
    }
    this.widgets = this.widgets.filter((w) => w.id !== widgetId);
    if (this.widgets.length === 0) {
      this.currentWidgetId = null;
      this.currentContact = null;
    } else {
      if (index < this.widgets.length) {
        this.currentWidgetId = this.widgets[index].id;
      } else {
        this.currentWidgetId = this.widgets[this.widgets.length - 1].id;
      }
    }
  }

  get modalOpen() {
    return this.widgets.length > 0 && this.variant === 'temporary';
  }

  @action
  clearWidgets() {
    this.widgets = [];
    this.currentWidgetId = null;
  }

  @action
  setCurrentWidgetId(widgetId: string) {
    this.currentWidgetId = widgetId;
  }

  getUIProps() {
    const { locale } = this._deps;
    return {
      currentLocale: locale.currentLocale,
      extended: this.extended,
      variant: this.variant,
      widgets: this.widgets,
      currentWidgetId: this.currentWidgetId,
    };
  }

  getUIFunctions() {
    const { thirdPartyService, routerInteraction } = this._deps;
    return {
      closeWidget: (widgetName: string) => this.closeWidget(widgetName),
      gotoWidget: (widgetId: string) => {
        const widget = this.widgets.find((w) => w.id === widgetId);
        if (widget) {
          this.setCurrentWidgetId(widgetId);
        }
      },
      navigateTo: (path) => {
        if (path.indexOf('/conversations/') === 0) {
          const conversationId = path.split('/')[2];
          this.gotoConversation(conversationId, this.currentContact);
          return;
        }
        routerInteraction.push(path);
      },
      onAttachmentDownload: (uri, e) => {
        thirdPartyService.onClickVCard(uri, e);
      },
    };
  }

  gotoConversation(conversationId, contact) {
    this.openWidget({
      widget: {
        id: 'conversation',
        name: 'Conversation',
        params: {
          conversationId: conversationId,
        },
      },
      contact,
    });
    this._deps.analytics.trackRouter(`/conversations/${conversationId}`);
  }

  gotoContactDetails(contact) {
    this.openWidget({
      widget: {
        id: 'contactDetails',
        name: 'Contact',
        params: {
          contactType: contact.type,
          contactId: contact.id,
        },
        showCloseButton: true,
      },
      contact,
    });
    this.addWidget({
      id: 'contactApps',
      name: 'Apps',
      params: {
        contactType: contact.type,
        contactId: contact.id,
      },
    });
    this._deps.analytics.trackRouter(`/contacts/${contact.type}/${contact.id}`);
  }

  @track(() => [trackEvents.viewRecording])
  gotoCallDetails(telephonySessionId, contact) {
    this.openWidget({
      widget: {
        id: 'callDetails',
        name: 'Recording',
        params: {
          telephonySessionId,
        },
        showCloseButton: true,
      },
      contact,
    });
  }

  @track(() => [trackEvents.viewMessageDetails])
  gotoMessageDetails(message, contact) {
    this.openWidget({
      widget: {
        id: 'messageDetails',
        name: message.type === 'Fax' ? 'Fax' : 'Voicemail',
        params: {
          messageId: message.id,
          type: message.type,
        },
        showCloseButton: true,
      },
      contact,
    });
  }

  gotoGlipChat(chatId) {
    this.openWidget({
      widget: {
        id: 'glipChat',
        name: 'Chat',
        params: {
          groupId: chatId,
        },
      },
    });
    this._deps.analytics.trackRouter(`/glip/groups/${chatId}`);
  }

  gotoLogCall(callSessionId, contact) {
    this.openWidget({
      widget: {
        id: 'logCall',
        name: 'Log call',
        params: {
          callSessionId,
        },
      },
      contact,
    });
    this._deps.analytics.trackRouter(`/log/call/${callSessionId}`);
  }

  gotoLogConversation(conversation, contact) {
    let name = 'Log messages';
    if (conversation.type === 'VoiceMail') {
      name = 'Log voicemail';
    } else if (conversation.type === 'Fax') {
      name = 'Log fax';
    }
    this.openWidget({
      widget: {
        id: 'logConversation',
        name,
        params: {
          conversationId: conversation.conversationId,
          type: conversation.type,
        },
      },
      contact,
    });
    this._deps.analytics.trackRouter(`/log/messages/${conversation.conversationId}`);
  }

  hasWidget(widgetId) {
    return this.widgets.some((w) => w.id === widgetId);
  }
}
