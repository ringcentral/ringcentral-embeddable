const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { sessionStatus } = require('@ringcentral-integration/commons/modules/Webphone/sessionStatus');

const { CallHUDUI } = require('../../src/modules/CallHUDUI');

function createExtension(type, overrides = {}) {
  return {
    extension: {
      extensionNumber: '101',
      id: `${type}-1`,
      name: `${type} One`,
      status: 'Enabled',
      type,
      ...overrides.extension,
    },
    presence: {
      activeCalls: [],
      ...overrides.presence,
    },
  };
}

function createDeps(overrides = {}) {
  const user = createExtension('User', {
    extension: {
      extensionNumber: '101',
      id: 'user-1',
      name: 'Ada Agent',
    },
  });
  const parkLocation = createExtension('ParkLocation', {
    extension: {
      extensionNumber: '801',
      id: 'park-1',
      name: 'Park One',
    },
    presence: {
      activeCalls: [{ id: 'parked-call' }],
    },
  });
  const groupPickup = createExtension('GroupCallPickup', {
    extension: {
      extensionNumber: '701',
      id: 'group-1',
      name: 'Pickup Group',
    },
    presence: {
      activeCalls: [{ id: 'group-call' }],
    },
  });
  const department = createExtension('Department', {
    extension: {
      extensionNumber: '901',
      id: 'queue-1',
      name: 'Support Queue',
    },
    presence: {
      activeCalls: [{ id: 'queue-call' }],
    },
  });
  return {
    accountInfo: {
      maxExtensionNumberLength: 6,
    },
    appFeatures: {
      hasEditMonitoredExtensionsPermission: true,
    },
    auth: {
      accessToken: 'access-token',
    },
    call: {
      isIdle: true,
    },
    callingSettings: {
      fromNumber: '+16505550100',
    },
    companyContacts: {
      data: [
        {
          extensionNumber: '102',
          firstName: 'Grace',
          id: 'user-2',
          lastName: 'Hopper',
          profileImage: {
            uri: 'https://media.example.com/grace',
          },
          type: 'User',
        },
        {
          extensionNumber: '101',
          id: 'user-1',
          name: 'Ada Agent',
          type: 'User',
        },
        {
          extensionNumber: '200',
          id: 'ivr-1',
          name: 'IVR',
          type: 'IvrMenu',
        },
      ],
    },
    composeText: {
      updateMessageText: jest.fn(),
    },
    composeTextUI: {
      gotoComposeText: jest.fn(),
    },
    dialerUI: {
      call: jest.fn(),
    },
    extensionInfo: {
      id: 'current-extension',
      isMultipleSiteEnabled: true,
      site: {
        code: '101',
      },
    },
    grantExtensions: {
      grantParkLocations: [
        parkLocation,
        createExtension('ParkLocation', {
          extension: {
            extensionNumber: '802',
            id: 'park-2',
            name: 'Park Two',
          },
        }),
      ],
    },
    locale: {
      currentLocale: 'en-US',
    },
    monitoredExtensions: {
      addExtensions: jest.fn(async () => {}),
      callQueuePickupList: [department],
      groupCallPickupList: [groupPickup],
      monitoredExtensions: [user, parkLocation, groupPickup, department],
      parkLocations: [parkLocation],
      removeExtension: jest.fn(async () => {}),
    },
    phoneNumberFormat: {
      format: jest.fn(({ phoneNumber }) => `formatted-${phoneNumber}`),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    routerInteraction: {
      push: jest.fn(),
    },
    webphone: {
      activeSession: {
        callStatus: sessionStatus.connected,
        id: 'session-1',
        isOnHold: false,
        voicemailDropStatus: false,
      },
      parkToLocation: jest.fn(async () => {}),
      pickGroupCall: jest.fn(async () => {}),
      pickParkLocation: jest.fn(async () => {}),
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  return new CallHUDUI(deps);
}

describe('CallHUDUI', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.clearAllMocks();
  });

  it('filters visible and available extensions by type and search input', () => {
    const deps = createDeps();
    const hud = createModule(deps);

    expect(hud.typeList).toEqual([
      { id: 'User', unreadCount: 0 },
      { id: 'ParkLocation', unreadCount: 1 },
      { id: 'GroupCallPickup', unreadCount: 1 },
      { id: 'Department', unreadCount: 1 },
    ]);

    hud.setSearchInput('ada');
    expect(hud.extensions.map((item) => item.extension.id)).toEqual(['user-1']);

    hud.setType('ParkLocation');
    expect(hud.searchInput).toBe('');
    expect(hud.extensionAddFilter).toBe('');
    expect(hud.extensions.map((item) => item.extension.id)).toEqual(['park-1']);

    hud.setExtensionAddFilter('park');
    expect(hud.availableExtensions).toEqual([{
      extensionNumber: '802',
      id: 'park-2',
      name: 'Park Two',
    }]);

    hud.setType('User');
    hud.setExtensionAddFilter('grace');
    expect(hud.availableExtensions).toEqual([{
      extensionNumber: '102',
      id: 'user-2',
      name: 'Grace Hopper',
      profileImageUrl: 'https://media.example.com/grace?access_token=access-token',
    }]);
    hud.setExtensionAddFilter('  ');
    expect(hud.availableExtensions).toEqual([]);
  });

  it('builds UI props from dependency readiness and active session state', () => {
    const deps = createDeps();
    const hud = createModule(deps);
    hud.setSearchInput('ada');

    expect(hud.getUIProps()).toMatchObject({
      allExtensions: [],
      canEdit: true,
      canPark: true,
      currentLocale: 'en-US',
      disableClickToDial: false,
      extensionAddFilter: '',
      searchInput: 'ada',
      type: 'User',
    });

    deps.call.isIdle = false;
    deps.webphone.activeSession.isOnHold = true;
    expect(hud.getUIProps()).toMatchObject({
      canPark: false,
      disableClickToDial: true,
    });
  });

  it('exposes UI actions for dialing, parking, pickup, texting, add, and remove flows', async () => {
    const deps = createDeps();
    const hud = createModule(deps);
    const funcs = hud.getUIFunctions();
    const activeCall = { id: 'active-call' };
    const extension = {
      id: 'park-1',
      name: 'Park One',
    };

    expect(funcs.formatPhone('+16505550123')).toBe('formatted-+16505550123');
    expect(deps.phoneNumberFormat.format).toHaveBeenCalledWith({
      areaCode: '650',
      countryCode: 'US',
      isMultipleSiteEnabled: true,
      maxExtensionLength: 6,
      phoneNumber: '+16505550123',
      siteCode: '101',
    });

    funcs.onTypeChange('Department');
    funcs.onSearchInputChange('support');
    funcs.onExtensionAddFilterChange('queue');
    expect(hud.type).toBe('Department');
    expect(hud.searchInput).toBe('support');
    expect(hud.extensionAddFilter).toBe('queue');

    funcs.onClickToDial({ phoneNumber: '101' });
    expect(deps.routerInteraction.push).toHaveBeenCalledWith('/dialer');
    expect(deps.dialerUI.call).toHaveBeenCalledWith({
      recipient: { phoneNumber: '101' },
    });

    deps.call.isIdle = false;
    funcs.onClickToDial({ phoneNumber: '102' });
    expect(deps.dialerUI.call).toHaveBeenCalledTimes(1);

    await funcs.onPark(extension);
    expect(deps.webphone.parkToLocation).toHaveBeenCalledWith('session-1', extension);

    await funcs.onText('Customer is waiting');
    expect(deps.composeTextUI.gotoComposeText).toHaveBeenCalled();
    expect(deps.composeText.updateMessageText).toHaveBeenCalledWith('Customer is waiting');
    await funcs.onText('');
    expect(deps.composeText.updateMessageText).toHaveBeenCalledTimes(1);

    await funcs.pickParkLocation(extension, activeCall);
    expect(deps.webphone.pickParkLocation).toHaveBeenCalledWith(
      'park-1',
      activeCall,
      '+16505550100',
    );
    await funcs.pickGroupCall(extension, activeCall);
    expect(deps.webphone.pickGroupCall).toHaveBeenCalledWith(
      'park-1',
      activeCall,
      '+16505550100',
      'gcp',
    );
    await funcs.pickCallQueueCall(extension, activeCall);
    expect(deps.webphone.pickGroupCall).toHaveBeenCalledWith(
      'park-1',
      activeCall,
      '+16505550100',
      'qpk',
    );

    await funcs.onAddExtensions([]);
    expect(deps.monitoredExtensions.addExtensions).not.toHaveBeenCalled();
    await funcs.onAddExtensions([{ id: 'user-2' }]);
    expect(deps.monitoredExtensions.addExtensions).toHaveBeenCalledWith([{ id: 'user-2' }]);
    await funcs.onRemoveExtension('user-2');
    expect(deps.monitoredExtensions.removeExtension).toHaveBeenCalledWith('user-2');
  });
});
