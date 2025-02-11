import type { ReactNode } from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state } from '@ringcentral-integration/core';

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
      let newVariant: Variant = window.innerWidth > 500 ? 'permanent' : 'temporary';
      if (!this.enabled && newVariant === 'permanent' && this.widgets.length === 0) {
        newVariant = 'temporary';
      }
      if (this.variant === newVariant) {
        return;
      }
      this.setVariant(newVariant);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
  }

  @state
  extended = false;

  @state
  variant = 'permanent';

  @state
  widgets: Widget[] = [];

  @state
  currentWidgetId: String | null = null;

  @state
  currentContact: CurrentContact | null = null;

  @action
  setExtended(extended: boolean) {
    this.extended = extended;
  }

  toggleExtended() {
    this.setExtended(!this.extended);
  }

  @action
  setVariant(variant: 'permanent' | 'temporary') {
    this.variant = variant;
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
    }
  }

  @action
  closeWidget(widgetId: string) {
    if (!widgetId && this.widgets.length === 0) {
      // close side drawer for empty view close
      this.extended = false;
      return;
    }
    const index = this.widgets.findIndex((w) => w.id === widgetId);
    if (index > -1) {
      const widget = this.widgets[index];
      if (typeof widget.onClose === 'function') {
        widget.onClose();
      }
    }
    this.widgets = this.widgets.filter((w) => w.id !== widgetId);
    if (this.widgets.length === 0) {
      this.currentWidgetId = null;
      this.currentContact = null;
    } else {
      if (index === -1) {
        return;
      }
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
  }

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
  }

  gotoLogCall(callSessionId, contact) {
    this.openWidget({
      widget: {
        id: 'logCall',
        name: 'Log',
        params: {
          callSessionId,
        },
      },
      contact,
    });
  }

  gotoLogConversation(conversationId, contact) {
    this.openWidget({
      widget: {
        id: 'logConversation',
        name: 'Log',
        params: {
          conversationId,
        },
      },
      contact,
    });
  }

  hasWidget(widgetId) {
    return this.widgets.some((w) => w.id === widgetId);
  }
}
