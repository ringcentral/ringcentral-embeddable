/** @jest-environment jsdom */
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

const { SideDrawerUI } = require('../../src/modules/SideDrawerUI');

function createDeps(overrides = {}) {
  return {
    analytics: {
      trackRouter: jest.fn(),
    },
    locale: {
      currentLocale: 'en-US',
    },
    routerInteraction: {
      currentPath: '/messages',
      push: jest.fn(),
    },
    sideDrawerUIOptions: {
      enableSideWidget: true,
    },
    thirdPartyService: {
      onClickVCard: jest.fn(),
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  const sideDrawer = new SideDrawerUI(deps);
  sideDrawer.parentModule = {
    analytics: {
      track: jest.fn(),
    },
  };
  return sideDrawer;
}

function createWidget(id, overrides = {}) {
  return {
    id,
    name: `${id} widget`,
    params: {},
    ...overrides,
  };
}

describe('SideDrawerUI', () => {
  beforeEach(() => {
    setStagedState({});
    window.innerWidth = 1024;
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
  });

  it('manages drawer variant, resize behavior, widgets, and current contact data', () => {
    const deps = createDeps();
    const sideDrawer = createModule(deps);
    const closeFirst = jest.fn();

    expect(sideDrawer.enabled).toBe(true);
    sideDrawer.setExtended(true);
    expect(sideDrawer.variant).toBe('permanent');
    sideDrawer.toggleExtended();
    expect(sideDrawer.extended).toBe(false);
    expect(sideDrawer.variant).toBe('temporary');

    sideDrawer.addWidget(createWidget('first', { onClose: closeFirst }));
    sideDrawer.addWidget(createWidget('first'));
    expect(sideDrawer.widgets).toHaveLength(1);

    sideDrawer.openWidget({
      contact: { id: 'contact-1', type: 'company' },
      openSideDrawer: true,
      widget: createWidget('first', { onClose: closeFirst }),
    });
    expect(sideDrawer.extended).toBe(true);
    expect(sideDrawer.variant).toBe('permanent');
    expect(sideDrawer.currentWidgetId).toBe('first');

    sideDrawer.openWidget({
      contact: {
        id: 'contact-1',
        phoneNumber: '+16505550123',
        type: 'company',
      },
      widget: createWidget('second'),
    });
    expect(sideDrawer.currentContact.phoneNumber).toBe('+16505550123');
    expect(sideDrawer.widgets.map((widget) => widget.id)).toEqual(['second', 'first']);

    sideDrawer.closeWidget('missing');
    expect(sideDrawer.widgets).toHaveLength(2);
    sideDrawer.closeWidget('first');
    expect(closeFirst).toHaveBeenCalled();
    expect(sideDrawer.currentWidgetId).toBe('second');
    sideDrawer.closeWidget('second');
    expect(sideDrawer.widgets).toEqual([]);
    expect(sideDrawer.currentContact).toBeNull();

    sideDrawer.closeWidget('');
    expect(sideDrawer.extended).toBe(false);
    expect(sideDrawer.variant).toBe('temporary');

    sideDrawer.openWidget({
      widget: createWidget('modal'),
    });
    expect(sideDrawer.modalOpen).toBe(true);
    sideDrawer.setCurrentWidgetId('modal');
    sideDrawer.clearWidgets();
    expect(sideDrawer.currentWidgetId).toBeNull();

    sideDrawer.openWidget({
      openSideDrawer: true,
      widget: createWidget('wide'),
    });
    sideDrawer.onInitOnce();
    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    expect(sideDrawer.extended).toBe(false);
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    expect(sideDrawer.extended).toBe(true);
  });

  it('builds UI props/functions and routes widget navigation through drawer helpers', () => {
    const deps = createDeps();
    const sideDrawer = createModule(deps);
    const funcs = sideDrawer.getUIFunctions();

    sideDrawer.openWidget({
      contact: { id: 'contact-1', type: 'company' },
      widget: createWidget('conversation'),
    });
    expect(sideDrawer.getUIProps()).toMatchObject({
      contact: { id: 'contact-1', type: 'company' },
      currentLocale: 'en-US',
      currentWidgetId: 'conversation',
      extended: false,
      mainPath: '/messages',
      variant: 'temporary',
    });

    funcs.gotoWidget('conversation');
    expect(sideDrawer.currentWidgetId).toBe('conversation');
    funcs.navigateTo('/settings');
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/settings');
    funcs.navigateTo('/conversations/conversation-1');
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'conversation',
      params: {
        conversationId: 'conversation-1',
        type: 'conversation',
      },
    });
    expect(deps.analytics.trackRouter).toHaveBeenCalledWith('/conversations/conversation-1');

    const event = { preventDefault: jest.fn() };
    funcs.onAttachmentDownload('https://example.com/card.vcf', event);
    expect(deps.thirdPartyService.onClickVCard).toHaveBeenCalledWith(
      'https://example.com/card.vcf',
      event,
    );
    funcs.closeWidget('conversation');
    expect(sideDrawer.widgets).toEqual([]);
  });

  it('opens details, logs, apps, chat, and voicemail-drop widgets', () => {
    const deps = createDeps();
    const sideDrawer = createModule(deps);
    const contact = {
      id: 'contact-1',
      type: 'company',
    };

    sideDrawer.gotoContactDetails(contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'contactDetails',
      params: {
        contactId: 'contact-1',
        contactType: 'company',
      },
    });
    expect(deps.analytics.trackRouter).toHaveBeenCalledWith('/contacts/company/contact-1');

    sideDrawer.gotoCallDetails('telephony-1', contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'callDetails',
      name: 'Recording',
      params: { telephonySessionId: 'telephony-1' },
    });

    sideDrawer.gotoMessageDetails({
      id: 'message-1',
      type: 'Fax',
    }, contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'messageDetails',
      name: 'Fax',
      params: {
        messageId: 'message-1',
        type: 'Fax',
      },
    });

    sideDrawer.gotoGlipChat('group-1');
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'glipChat',
      params: { groupId: 'group-1' },
    });
    expect(deps.analytics.trackRouter).toHaveBeenCalledWith('/glip/groups/group-1');

    sideDrawer.gotoLogCall('call-1', contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'logCall',
      params: { callSessionId: 'call-1' },
    });
    expect(deps.analytics.trackRouter).toHaveBeenCalledWith('/log/call/call-1');

    sideDrawer.gotoLogConversation({
      conversationId: 'conversation-1',
      type: 'VoiceMail',
    }, contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'logConversation',
      name: 'Log voicemail',
    });
    sideDrawer.gotoLogConversation({
      conversationId: 'fax-1',
      type: 'Fax',
    }, contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'logConversation',
      name: 'Log fax',
    });

    sideDrawer.openApps(contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'widgetApps',
      name: 'Apps',
    });
    expect(sideDrawer.extended).toBe(true);

    sideDrawer.openAppTab({
      iconUri: 'https://example.com/icon.png',
      id: 'crm',
      name: 'CRM',
    }, contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      icon: 'https://example.com/icon.png',
      id: 'widgetApps-crm',
      params: { appId: 'crm' },
    });

    sideDrawer.openVoicemailDrop('call-2', contact);
    expect(sideDrawer.widgets[0]).toMatchObject({
      id: 'voicemailDrop',
      params: { callSessionId: 'call-2' },
    });
    expect(sideDrawer.hasWidget('voicemailDrop')).toBe(true);

    const disabledDrawer = createModule(createDeps({
      sideDrawerUIOptions: {
        enableSideWidget: false,
      },
    }));
    disabledDrawer.openApps(contact);
    expect(disabledDrawer.widgets).toEqual([]);
  });
});
