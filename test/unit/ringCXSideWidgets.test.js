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

const {
  RINGCX_AGENT_ASSISTANT_WIDGET_ID,
  RINGCX_AGENT_SCRIPT_WIDGET_ID,
  RINGCX_SIDE_WIDGET_WIDTH,
  RingCXSideWidgets,
} = require('../../src/ringcx/services/RingCXSideWidgets/RingCXSideWidgets');

function createWidgets({
  hasScript = false,
  hasAssistant = false,
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
  const widgets = new RingCXSideWidgets(
    sideWidgetView,
    { hasVisibleScript: hasScript },
    { hasVisibleAssistant: hasAssistant },
    {},
    {},
    portManager,
  );
  return { handles, sideWidgetView, widgets };
}

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
        keepActiveOnCallApps: true,
        keepMounted: true,
        minExpandedWidth: RINGCX_SIDE_WIDGET_WIDTH,
      }),
    );
    expect(RINGCX_SIDE_WIDGET_WIDTH).toBe(360);
    expect(options.getName()).toBe(name);
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
    widgets.onInit();
    const { watch } = require('@ringcentral-integration/next-core');
    const scriptWatcher = watch.mock.calls.at(-2)[2];

    scriptWatcher(false);
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
});
