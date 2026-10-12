import {
  getClosedSideWidgetTabIds,
  getSideWidgetMinExpandedWidth,
  openSideWidgetTab,
  removeSideWidgetTab,
} from '../../src/app/views/SideWidgetView/SideWidgetTabs.helper';

const apps = { id: 'side-widget-apps', name: 'Apps' };
const callDetails = { id: 'call-details', name: 'Call details' };
const hud = { id: 'call-hud', name: 'HUD', scope: 'global' };

function state(tabs, currentTabId = tabs[0]?.id ?? 'side-widget-apps') {
  return { tabs, currentTabId, selectedAppId: 'crm' };
}

describe('openSideWidgetTab', () => {
  const options = {
    activate: true,
    preserveTabs: true,
    enabled: true,
    showAppsTab: false,
  };

  test('puts new content in front and activates it', () => {
    expect(
      openSideWidgetTab(state([callDetails]), { ...options, tab: hud }),
    ).toEqual({
      tabs: [hud, callDetails],
      currentTabId: 'call-hud',
      selectedAppId: null,
    });
  });

  test('keeps an open tab in place and the Apps tab at the end', () => {
    const next = openSideWidgetTab(state([hud, callDetails]), {
      ...options,
      tab: { ...callDetails, name: 'Renamed' },
      showAppsTab: true,
    });

    expect(next.tabs.map(({ id, name }) => [id, name])).toEqual([
      ['call-hud', 'HUD'],
      ['call-details', 'Renamed'],
      ['side-widget-apps', 'Apps'],
    ]);
  });

  test('keeps only global tabs when the contact changes', () => {
    const next = openSideWidgetTab(state([callDetails, hud, apps]), {
      ...options,
      tab: { id: 'conversation', name: 'Conversation' },
      preserveTabs: false,
    });

    expect(next.tabs.map(({ id }) => id)).toEqual(['conversation', 'call-hud']);
  });

  test('opens in the background without changing the selection', () => {
    const next = openSideWidgetTab(state([callDetails]), {
      ...options,
      tab: hud,
      activate: false,
    });

    expect(next.currentTabId).toBe('call-details');
    expect(next.selectedAppId).toBe('crm');
  });

  test('selects a background tab when the current one was closed', () => {
    const next = openSideWidgetTab(state([callDetails]), {
      ...options,
      tab: hud,
      activate: false,
      preserveTabs: false,
    });

    expect(next.tabs).toEqual([hud]);
    expect(next.currentTabId).toBe('call-hud');
    expect(next.selectedAppId).toBeNull();
  });

  test('drops the Apps tab without enableSideWidget', () => {
    const next = openSideWidgetTab(state([apps]), {
      ...options,
      tab: hud,
      enabled: false,
    });

    expect(next.tabs).toEqual([hud]);
  });
});

describe('removeSideWidgetTab', () => {
  test('selects the tab that takes the closed one’s place', () => {
    expect(
      removeSideWidgetTab(state([hud, callDetails, apps], 'call-details'), 'call-details')
        .currentTabId,
    ).toBe('side-widget-apps');
  });

  test('selects the previous tab when the last one closes', () => {
    expect(
      removeSideWidgetTab(state([hud, callDetails], 'call-details'), 'call-details')
        .currentTabId,
    ).toBe('call-hud');
  });

  test('keeps the selection when a background tab closes', () => {
    expect(
      removeSideWidgetTab(state([hud, callDetails], 'call-hud'), 'call-details'),
    ).toEqual({ tabs: [hud], currentTabId: 'call-hud', selectedAppId: 'crm' });
  });

  test('clears the selected app with the Apps tab', () => {
    expect(
      removeSideWidgetTab(state([hud, apps]), 'side-widget-apps').selectedAppId,
    ).toBeNull();
  });
});

describe('getClosedSideWidgetTabIds', () => {
  test('lists contact tabs a contact change closes', () => {
    expect(
      getClosedSideWidgetTabIds([callDetails, hud, apps], 'conversation', false),
    ).toEqual(['call-details']);
    expect(
      getClosedSideWidgetTabIds([callDetails], 'conversation', true),
    ).toEqual([]);
  });
});

describe('getSideWidgetMinExpandedWidth', () => {
  test('returns the widest width among the tabs', () => {
    expect(
      getSideWidgetMinExpandedWidth([
        { id: 'a', name: 'A', minExpandedWidth: 320 },
        { id: 'b', name: 'B', minExpandedWidth: 360 },
        callDetails,
      ]),
    ).toBe(360);
    expect(getSideWidgetMinExpandedWidth([callDetails])).toBeNull();
  });
});
