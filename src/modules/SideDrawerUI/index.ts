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

  @action
  setExtended(extended: boolean) {
    this.extended = extended;
  }

  toggleExtended() {
    this.setExtended(!this.extended);
  }

  @state
  showTabs = false;

  @state
  variant = 'permanent';

  @action
  setVariant(variant: 'permanent' | 'temporary') {
    this.variant = variant;
  }

  @state
  widgets: Widget[] = [];

  @state
  currentWidgetId: String | null = null;

  @action
  openWidget({
    widget,
    closeOtherWidgets = false,
    openSideDrawer = false,
  }: {
    widget: Widget;
    closeOtherWidgets?: boolean;
    openSideDrawer?: boolean;
  }) {
    if (closeOtherWidgets) {
      this.widgets = [widget];
      this.showTabs = false;
    } else {
      const index = this.widgets.findIndex((w) => w.name === widget.name);
      if (index === -1) {
        this.widgets.push(widget);
      } else {
        this.widgets[index] = widget;
      }
      this.showTabs = true;
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
      this.showTabs = false;
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

  getUIProps() {
    const { locale } = this._deps;
    return {
      currentLocale: locale.currentLocale,
      extended: this.extended,
      variant: this.variant,
      widgets: this.widgets,
      currentWidgetId: this.currentWidgetId,
      showTabs: this.showTabs,
    };
  }

  getUIFunctions() {
    const { thirdPartyService, routerInteraction } = this._deps;
    return {
      closeWidget: (widgetName: string) => this.closeWidget(widgetName),
      navigateTo: (path) => {
        if (path.indexOf('/conversations/') === 0) {
          const conversationId = path.split('/')[2];
          this.gotoConversation(conversationId);
          return;
        }
        routerInteraction.push(path);
      },
      onAttachmentDownload: (uri, e) => {
        thirdPartyService.onClickVCard(uri, e);
      },
    };
  }

  gotoConversation(conversationId) {
    this.openWidget({
      widget: {
        id: 'conversation',
        name: 'Conversation',
        params: {
          conversationId,
        },
        showCloseButton: false,
      },
      closeOtherWidgets: true,
    });
  }

  gotoContactDetails({ type, id }) {
    this.openWidget({
      widget: {
        id: 'contactDetails',
        name: 'Contact',
        params: {
          contactType: type,
          contactId: id,
        },
      },
      closeOtherWidgets: true,
    });
  }

  gotoCallDetails(telephonySessionId) {
    this.openWidget({
      widget: {
        id: 'callDetails',
        name: 'Call details',
        params: {
          telephonySessionId,
        }
      },
      closeOtherWidgets: true,
    });
  }

  gotoMessageDetails(messageId) {
    this.openWidget({
      widget: {
        id: 'messageDetails',
        name: 'Message details',
        params: {
          messageId,
        },
      },
      closeOtherWidgets: true,
    });
  }

  gotoGlipChat(chatId) {
    this.openWidget({
      widget: {
        id: 'glipChat',
        name: 'Glip chat',
        params: {
          groupId: chatId,
        },
        showCloseButton: false,
      },
      closeOtherWidgets: true,
    });
  }

  gotoLogCall(callSessionId) {
    this.openWidget({
      widget: {
        id: 'logCall',
        name: 'Log call',
        params: {
          callSessionId,
        },
        showCloseButton: false,
      },
      closeOtherWidgets: true,
    });
  }

  gotoLogConversation(conversationId) {
    this.openWidget({
      widget: {
        id: 'logConversation',
        name: 'Log conversation',
        params: {
          conversationId,
        },
        showCloseButton: false,
      },
      closeOtherWidgets: true,
    });
  }

  hasWidget(widgetId) {
    return this.widgets.some((w) => w.id === widgetId);
  }
}
