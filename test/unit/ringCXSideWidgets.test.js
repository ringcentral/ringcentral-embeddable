jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('../../src/ringcx/components/AgentAssistantPanel', () => ({
  AgentAssistantPanel: () => null,
}));

jest.mock('../../src/ringcx/components/AgentAssistantPanel/i18n', () => ({
  t: (key) => (key === 'agentAssistant' ? 'Agent assistant' : key),
}));

jest.mock('../../src/ringcx/components/AgentScriptPanel', () => ({
  AgentScriptPanel: () => null,
}));

jest.mock('../../src/ringcx/components/AgentScriptPanel/i18n', () => ({
  t: (key) => (key === 'agentScript' ? 'Agent script' : key),
}));

jest.mock('../../src/ringcx/services/CxAgentAssistant', () => ({
  CxAgentAssistant: class CxAgentAssistant {},
}));

jest.mock('../../src/ringcx/services/CxAgentScript', () => ({
  CxAgentScript: class CxAgentScript {},
}));

jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));

jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class CxPresence {},
}));

jest.mock('../../src/ringcx/services/CxLeadInfo', () => ({
  CxLeadInfo: class CxLeadInfo {},
}));

jest.mock('../../src/ringcx/views/CxLeadInfoView', () => ({
  CxLeadInfoView: class CxLeadInfoView {},
}));

jest.mock('../../src/ringcx/views/CxManualPassView', () => ({
  CxManualPassView: class CxManualPassView {},
}));

jest.mock('../../src/ringcx/views/CxLeadUpdateView', () => ({
  CxLeadUpdateView: class CxLeadUpdateView {},
}));

jest.mock('../../src/ringcx/components/ManualPassForm/i18n', () => ({
  t: (key) => (key === 'manualPass' ? 'Manual pass' : key),
}));

jest.mock('../../src/ringcx/components/LeadInfoPanel/i18n', () => ({
  t: (key) => (key === 'lead' ? 'Lead' : key),
}));

const { watch } = require('@ringcentral-integration/next-core');
const {
  RINGCX_AGENT_ASSISTANT_WIDGET_ID,
  RINGCX_AGENT_SCRIPT_WIDGET_ID,
  RINGCX_LEAD_INFO_WIDGET_ID,
  RINGCX_SIDE_WIDGET_WIDTH,
  RingCXSideWidgets,
} = require('../../src/ringcx/services/RingCXSideWidgets/RingCXSideWidgets');

const CALL_ID = 'uii-1$1';

/** Watchers `onInit` binds, in order. */
const WATCHERS = {
  script: 0,
  assistant: 1,
  followCall: 2,
  openCallLead: 3,
  leadResolved: 4,
};

/**
 * A `CxLeadInfo` whose call leads are `leadCallIds` and whose fetched leads
 * are `leadRequestIds`.
 */
function createLeadInfo({ leadCallIds = [], leadRequestIds = [] } = {}) {
  return {
    target: null,
    setTarget: jest.fn(function setTarget(target) {
      this.target = target;
    }),
    get info() {
      const { target } = this;
      const resolved =
        target?.type === 'call'
          ? leadCallIds.includes(target.callId)
          : leadRequestIds.includes(target?.requestId);
      return resolved ? { target } : null;
    },
    canViewCallLead: jest.fn((callId) => leadCallIds.includes(callId)),
    followActivityCall: jest.fn(),
  };
}

function createWidgets({
  hasScript = false,
  hasAssistant = false,
  activityCallId = '',
  cxCallIds = [],
  isDialing = false,
  leadInfo = createLeadInfo(),
  portManager = { shared: false, isServer: false },
} = {}) {
  const handles = new Map();
  const sideWidgetView = {
    isOpen: false,
    tabs: [],
    createOrUpdateContent: jest.fn((options) => {
      const handle = { options };
      handles.set(options.id, handle);
      return handle;
    }),
    openContent: jest.fn(),
    closeContent: jest.fn(),
  };
  const cxLeadInfoView = { component: () => null };
  const cxManualPassView = {
    lead: null,
    setRequestId: jest.fn(),
    component: () => null,
  };
  const cxLeadUpdateView = { setTarget: jest.fn(), component: () => null };
  const widgets = new RingCXSideWidgets(
    sideWidgetView,
    { hasVisibleScript: hasScript },
    { hasVisibleAssistant: hasAssistant },
    { activityCallId, isDialing },
    { callIds: cxCallIds },
    leadInfo,
    cxLeadInfoView,
    cxManualPassView,
    cxLeadUpdateView,
    portManager,
  );
  return { cxLeadInfoView, handles, leadInfo, sideWidgetView, widgets };
}

/** Binds the widgets and returns the callback of one of `onInit`'s watchers. */
function initWidgets(widgets) {
  watch.mockClear();
  widgets.onInit();
  return (name) => watch.mock.calls[WATCHERS[name]][2];
}

const openedIds = (sideWidgetView) =>
  sideWidgetView.openContent.mock.calls.map(([handle, options]) => [
    handle.options.id,
    options.activate,
  ]);

describe('RingCXSideWidgets', () => {
  test.each([
    [RINGCX_AGENT_SCRIPT_WIDGET_ID, 'Agent script'],
    [RINGCX_AGENT_ASSISTANT_WIDGET_ID, 'Agent assistant'],
  ])('registers %s as a kept-mounted global tab at the RingCX width', (id, name) => {
    const { handles } = createWidgets();
    const { options } = handles.get(id);

    expect(options).toEqual(
      expect.objectContaining({
        id,
        name,
        scope: 'global',
        keepActiveOnCallApps: expect.any(Function),
        keepMounted: true,
        minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      }),
    );
    expect(RINGCX_SIDE_WIDGET_WIDTH).toBe(360);
    expect(options.getName()).toBe(name);
  });

  test.each([
    ['a CX call is up', { cxCallIds: [CALL_ID] }, true],
    ['a CX call is dialing', { isDialing: true }, true],
    ['the CX call ended, during its disposition', {}, false],
  ])('keeps the tabs in front of call apps only while %s', (_name, state, keep) => {
    const { handles } = createWidgets(state);

    [
      RINGCX_AGENT_SCRIPT_WIDGET_ID,
      RINGCX_AGENT_ASSISTANT_WIDGET_ID,
      RINGCX_LEAD_INFO_WIDGET_ID,
    ].forEach((id) => {
      expect(handles.get(id).options.keepActiveOnCallApps()).toBe(keep);
    });
  });

  test('opens the script as the active tab and the assistant behind it', () => {
    const { handles, sideWidgetView, widgets } = createWidgets({
      hasScript: true,
      hasAssistant: true,
    });

    widgets.onInit();

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get(RINGCX_AGENT_SCRIPT_WIDGET_ID),
      { activate: true, expand: true },
    );
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get(RINGCX_AGENT_ASSISTANT_WIDGET_ID),
      { activate: false, expand: true },
    );
  });

  test('folds an emptied drawer when the call ends the widgets, not the agent', async () => {
    const { handles, sideWidgetView, widgets } = createWidgets({
      hasScript: true,
    });
    const getWatcher = initWidgets(widgets);

    getWatcher('script')(false);
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get(RINGCX_AGENT_SCRIPT_WIDGET_ID),
      { collapseWhenLast: true },
    );

    // The agent hiding them keeps a docked drawer open.
    sideWidgetView.closeContent.mockClear();
    sideWidgetView.isOpen = true;
    sideWidgetView.tabs = [{ id: RINGCX_AGENT_SCRIPT_WIDGET_ID }];
    await widgets.toggle();
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get(RINGCX_AGENT_SCRIPT_WIDGET_ID),
      undefined,
    );
  });

  test('leaves the tabs to the server port', () => {
    const { sideWidgetView, widgets } = createWidgets({
      hasScript: true,
      portManager: { shared: true, isServer: false },
    });

    widgets.onInit();

    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
  });

  describe('Lead tab', () => {
    test('registers the Lead as a global tab at the RingCX width', () => {
      const { handles, leadInfo } = createWidgets();
      const { options } = handles.get(RINGCX_LEAD_INFO_WIDGET_ID);

      expect(options).toEqual(
        expect.objectContaining({
          id: RINGCX_LEAD_INFO_WIDGET_ID,
          name: 'Lead',
          scope: 'global',
          keepActiveOnCallApps: expect.any(Function),
          minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
        }),
      );
      // No iframe to keep alive.
      expect(options.keepMounted).toBeUndefined();
      expect(options.getName()).toBe('Lead');

      leadInfo.target = { type: 'call', callId: CALL_ID };
      options.onClose();
      expect(leadInfo.setTarget).toHaveBeenCalledWith(null);
    });

    test("does not wait for the Lead view's dependencies to bind the auto-open", () => {
      const { cxLeadInfoView, widgets } = createWidgets();

      expect(widgets.ignoredModules).toContain(cxLeadInfoView);
    });

    test('opens Script, Lead and Assistant for a call, the script first and active', () => {
      const { leadInfo, sideWidgetView, widgets } = createWidgets({
        hasScript: true,
        hasAssistant: true,
        activityCallId: CALL_ID,
        leadInfo: createLeadInfo({ leadCallIds: [CALL_ID] }),
      });

      widgets.onInit();

      // New tabs go first, so they open in reverse.
      expect(openedIds(sideWidgetView)).toEqual([
        [RINGCX_AGENT_ASSISTANT_WIDGET_ID, false],
        [RINGCX_LEAD_INFO_WIDGET_ID, false],
        [RINGCX_AGENT_SCRIPT_WIDGET_ID, true],
      ]);
      expect(leadInfo.target).toEqual({ type: 'call', callId: CALL_ID });
      expect(widgets.availableWidgetNames).toEqual([
        'Agent script',
        'Lead',
        'Agent assistant',
      ]);
    });

    test('makes the Lead active when the call has no script', () => {
      const { sideWidgetView, widgets } = createWidgets({
        hasAssistant: true,
        activityCallId: CALL_ID,
        leadInfo: createLeadInfo({ leadCallIds: [CALL_ID] }),
      });

      widgets.onInit();

      expect(openedIds(sideWidgetView)).toEqual([
        [RINGCX_AGENT_ASSISTANT_WIDGET_ID, false],
        [RINGCX_LEAD_INFO_WIDGET_ID, true],
      ]);
    });

    test('opens the Lead once per answered call with a lead', () => {
      const { leadInfo, sideWidgetView, widgets } = createWidgets({
        leadInfo: createLeadInfo({ leadCallIds: [CALL_ID] }),
      });
      const getWatcher = initWidgets(widgets);
      const [, selectCallLead] = watch.mock.calls[WATCHERS.openCallLead];

      expect(selectCallLead()).toBe('');
      getWatcher('openCallLead')('');
      expect(sideWidgetView.openContent).not.toHaveBeenCalled();

      getWatcher('openCallLead')(CALL_ID);
      expect(leadInfo.target).toEqual({ type: 'call', callId: CALL_ID });
      expect(openedIds(sideWidgetView)).toEqual([
        [RINGCX_LEAD_INFO_WIDGET_ID, true],
      ]);
    });

    test('moves the lead along with the call being worked on', () => {
      const { leadInfo, widgets } = createWidgets();
      const getWatcher = initWidgets(widgets);

      getWatcher('followCall')(CALL_ID);

      expect(leadInfo.followActivityCall).toHaveBeenCalledWith(CALL_ID);
    });

    test('folds the Lead away once its lead is gone', () => {
      const { handles, sideWidgetView, widgets } = createWidgets();
      const getWatcher = initWidgets(widgets);
      sideWidgetView.closeContent.mockClear();

      getWatcher('leadResolved')(true);
      expect(sideWidgetView.closeContent).not.toHaveBeenCalled();

      getWatcher('leadResolved')(false);
      expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
        handles.get(RINGCX_LEAD_INFO_WIDGET_ID),
        { collapseWhenLast: true },
      );
    });

    test('opens a fetched lead from the Leads tab as the active tab', async () => {
      const { leadInfo, sideWidgetView, widgets } = createWidgets({
        leadInfo: createLeadInfo({ leadRequestIds: ['request-1'] }),
      });

      await widgets.viewLeadInfo({ type: 'lead', requestId: 'request-1' });

      expect(leadInfo.target).toEqual({ type: 'lead', requestId: 'request-1' });
      expect(openedIds(sideWidgetView)).toEqual([
        [RINGCX_LEAD_INFO_WIDGET_ID, true],
      ]);
    });

    test('leaves the tab closed for a lead that does not resolve', async () => {
      const { leadInfo, sideWidgetView, widgets } = createWidgets();

      await widgets.viewLeadInfo({ type: 'lead', requestId: 'request-9' });

      expect(leadInfo.target).toBeNull();
      expect(sideWidgetView.openContent).not.toHaveBeenCalled();
    });

    test('closes from its own back button with the default collapse', async () => {
      const { handles, sideWidgetView, widgets } = createWidgets();

      await widgets.closeLeadInfo();

      expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
        handles.get(RINGCX_LEAD_INFO_WIDGET_ID),
      );
    });
  });

  describe('call screen toggle', () => {
    function createCallWidgets(openTabIds, target) {
      const leadInfo = createLeadInfo({
        leadCallIds: [CALL_ID],
        leadRequestIds: ['request-1'],
      });
      leadInfo.target = target ?? null;
      const created = createWidgets({
        hasScript: true,
        hasAssistant: true,
        activityCallId: CALL_ID,
        leadInfo,
      });
      created.sideWidgetView.isOpen = openTabIds.length > 0;
      created.sideWidgetView.tabs = openTabIds.map((id) => ({ id }));
      return created;
    }

    const CALL_TARGET = { type: 'call', callId: CALL_ID };
    const ALL_IDS = [
      RINGCX_AGENT_SCRIPT_WIDGET_ID,
      RINGCX_LEAD_INFO_WIDGET_ID,
      RINGCX_AGENT_ASSISTANT_WIDGET_ID,
    ];

    test('counts as visible only with every widget open', () => {
      expect(createCallWidgets(ALL_IDS, CALL_TARGET).widgets.visible).toBe(true);
      expect(
        createCallWidgets(
          [RINGCX_AGENT_SCRIPT_WIDGET_ID, RINGCX_AGENT_ASSISTANT_WIDGET_ID],
          CALL_TARGET,
        ).widgets.visible,
      ).toBe(false);
    });

    test('does not count a Lead tab still on another fetched lead', () => {
      const { widgets } = createCallWidgets(ALL_IDS, {
        type: 'lead',
        requestId: 'request-1',
      });

      expect(widgets.visible).toBe(false);
    });

    test('brings in only the missing widgets, the first of them active', async () => {
      const { leadInfo, sideWidgetView, widgets } = createCallWidgets([
        RINGCX_AGENT_SCRIPT_WIDGET_ID,
      ]);

      await widgets.toggle();

      expect(openedIds(sideWidgetView)).toEqual([
        [RINGCX_AGENT_ASSISTANT_WIDGET_ID, false],
        [RINGCX_LEAD_INFO_WIDGET_ID, true],
      ]);
      expect(leadInfo.target).toEqual(CALL_TARGET);
    });

    test('puts every widget away when all are open', async () => {
      const { handles, sideWidgetView, widgets } = createCallWidgets(
        ALL_IDS,
        CALL_TARGET,
      );

      await widgets.toggle();

      expect(sideWidgetView.openContent).not.toHaveBeenCalled();
      expect(
        sideWidgetView.closeContent.mock.calls.map(([handle]) => handle),
      ).toEqual(ALL_IDS.map((id) => handles.get(id)));
    });
  });
});
