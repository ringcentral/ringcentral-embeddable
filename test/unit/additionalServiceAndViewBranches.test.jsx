/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSleep = jest.fn(async () => {});
const mockWatch = jest.fn(() => jest.fn());

jest.mock('@ringcentral-integration/commons/lib/di', () => ({
  Module: () => (target) => target,
}));

jest.mock('@ringcentral-integration/core', () => ({
  RcModuleV2: class MockRcModuleV2 {
    constructor({ deps }) {
      this._deps = deps;
    }
  },
  action: () => {},
  computed: () => () => {},
  globalStorage: () => {},
  state: () => {},
  storage: () => {},
  watch: (...args) => mockWatch(...args),
}));

jest.mock('@ringcentral-integration/utils', () => ({
  sleep: (...args) => mockSleep(...args),
}));

jest.mock('@ringcentral-integration/commons/modules/Theme/defaultCssVariable', () => ({
  defaultCssVariable: {
    primaryColor: '#000',
  },
}));

jest.mock('@ringcentral-integration/commons/modules/AudioSettings', () => ({
  AudioSettings: class MockAudioSettingsBase {
    constructor() {
      this.availableInputDevices = [];
      this.data = {
        inputDeviceId: 'default',
      };
    }

    setAvailableDevices(devices) {
      this.availableDevices = devices;
      this.availableInputDevices = devices.filter((device) => device.kind === 'audioinput');
    }

    setUserMediaError() {
      this.userMediaErrorSet = true;
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/AddressBook', () => ({
  AddressBook: class MockAddressBookBase {
    constructor(deps) {
      this._deps = deps;
      this._perPage = 2;
      this._source = {
        _props: {},
      };
      this.syncToken = 'sync-token';
    }

    async sync() {
      this.baseSyncCalled = true;
      return 'base-sync';
    }
  },
}));

jest.mock('@ringcentral-integration/commons/modules/DataFetcherV2', () => ({
  DataFetcherV2Consumer: class MockDataFetcherV2Consumer {
    constructor({ deps }) {
      this._deps = deps;
      this.data = null;
    }
  },
  DataSource: class MockDataSource {
    constructor(options) {
      Object.assign(this, options);
    }
  },
}));

jest.mock('@ringcentral-integration/commons/lib/debounce', () => (fn) => fn);

jest.mock('@ringcentral-integration/widgets/components/ContactList', () => {
  const React = require('react');
  return React.forwardRef(({
    bottomNotice,
    contactGroups,
    height,
    isSearching,
    onItemSelect,
    width,
  }, ref) => {
    React.useImperativeHandle(ref, () => ({
      resetScrollTop: jest.fn(),
    }));
    return (
      <section data-height={height} data-searching={isSearching ? 'true' : 'false'} data-sign="contact-list" data-width={width}>
        {contactGroups.map((group) => (
          <button key={group.id} type="button" onClick={() => onItemSelect(group.contacts[0])}>
            {group.caption}
          </button>
        ))}
        {bottomNotice ? bottomNotice() : null}
      </section>
    );
  });
});

jest.mock('@ringcentral-integration/widgets/components/ContactSourceFilter/i18n', () => ({
  getString: jest.fn((key) => `source-${key}`),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactsView/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <div data-sign="spinner-overlay">spinner</div>,
}));

jest.mock('../../src/components/SubTabsView', () => ({
  SubTabsView: ({ children, goTo, tabs }) => (
    <section data-sign="sub-tabs">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" onClick={() => goTo(tab.value)}>
          {tab.label}
        </button>
      ))}
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/SearchLine', () => ({
  SearchLine: ({ onSearchInputChange, placeholder, searchInput }) => (
    <input
      data-sign="contacts-search"
      placeholder={placeholder}
      value={searchInput}
      onChange={onSearchInputChange}
    />
  ),
}));

jest.mock('@ringcentral/juno-icon', () => ({
  Refresh: function Refresh() {
    return null;
  },
}));

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const blockedProps = new Set(['color', 'loading', 'symbol', 'variant']);
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (key !== 'children' && !key.startsWith('$') && !blockedProps.has(key)) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag, testId) => React.forwardRef((props, ref) => (
    React.createElement(tag, {
      ...cleanProps(props),
      ref,
      'data-sign': props['data-sign'] || testId,
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => {
    if (typeof Component === 'string') {
      return React.createElement(Component, { ...cleanProps(props), ref }, props.children);
    }
    return <Component {...props} ref={ref}>{props.children}</Component>;
  });
  styled.div = () => createComponent('div', 'styled-div');
  return {
    RcIconButton: ({ children, onClick, title }) => (
      <button title={title || ''} type="button" onClick={onClick}>{children || title || 'icon-button'}</button>
    ),
    RcTypography: ({ children }) => <span>{children}</span>,
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

const { Theme } = require('../../src/modules/Theme');
const { AudioSettings } = require('../../src/modules/AudioSettings');
const { AddressBook } = require('../../src/modules/AddressBook');
const { GrantExtensions } = require('../../src/modules/GrantExtensions/GrantExtensions');
const ContactsView = require('../../src/components/ContactsView').default;

function createThemeDeps(theme = {}) {
  return {
    brand: {
      brandConfig: {
        theme,
      },
    },
  };
}

function createAddressBookDeps(overrides = {}) {
  return {
    appFeatures: {
      hasPersonalContactsPermission: true,
    },
    extensionFeatures: {
      features: {
        ReadPersonalContacts: {
          available: true,
        },
      },
    },
    ...overrides,
  };
}

function createGrantDeps(overrides = {}) {
  const platform = {
    get: jest.fn(async () => ({
      json: async () => ({
        records: [{
          extension: {
            extensionNumber: '701',
            id: 'park-1',
            type: 'ParkLocation',
          },
          name: '',
        }],
      }),
    })),
  };
  return {
    client: {
      service: {
        platform: () => platform,
      },
    },
    companyContacts: {
      data: [
        {
          extensionNumber: '701',
          firstName: 'Park',
          id: 'park-1',
          lastName: 'One',
          status: 'Enabled',
        },
        {
          id: 'sms-1',
          name: 'SMS Recipient',
        },
      ],
    },
    dataFetcherV2: {
      fetchData: jest.fn(async () => {}),
      register: jest.fn(),
    },
    extensionFeatures: {
      features: {
        ReadExtensions: {
          available: true,
        },
      },
      ready: true,
    },
    subscription: {
      message: null,
      subscribe: jest.fn(),
    },
    tabManager: {
      active: true,
    },
    ...overrides,
    platform,
  };
}

function createContactsProps(overrides = {}) {
  return {
    bottomNotice: jest.fn(() => <span>bottom notice</span>),
    bottomNoticeHeight: 20,
    contactGroups: [{
      caption: 'Favorites',
      contacts: [{ id: 'contact-1', name: 'Ada' }],
      id: 'favorites',
    }],
    contactSourceNames: ['personal', 'company'],
    currentLocale: 'en-US',
    currentSiteCode: '001',
    getAvatarUrl: jest.fn(),
    getPresence: jest.fn(),
    isMultipleSiteEnabled: true,
    isSearching: false,
    onItemSelect: jest.fn(),
    onRefresh: jest.fn(async () => {}),
    onSearchContact: jest.fn(),
    onVisitPage: jest.fn(),
    searchSource: 'personal',
    searchString: 'Ada',
    showSpinner: false,
    sourceNodeRenderer: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSleep.mockClear();
  mockWatch.mockClear();
});

test('covers theme defaults, auto mode and system-theme error handling', () => {
  const addEventListener = jest.fn();
  window.matchMedia = jest.fn(() => ({
    addEventListener,
    matches: true,
  }));
  const theme = new Theme(createThemeDeps({
    defaultTheme: 'dark',
    themeMap: {
      dark: { name: 'dark-theme' },
    },
    variable: {
      accentColor: '#f00',
    },
  }));
  theme.themeType = 'unsupported';
  theme.setThemeType = jest.fn((type) => {
    theme.themeType = type;
  });
  theme.isAutoMode = true;
  theme.onInitOnce();
  expect(theme.setThemeType).toHaveBeenCalledWith('dark');
  expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  addEventListener.mock.calls[0][1]();
  expect(theme.themeType).toBe('dark');
  expect(theme.theme).toEqual({ name: 'dark-theme' });
  expect(theme.variable).toEqual({
    accentColor: '#f00',
    primaryColor: '#000',
  });
  theme.themeType = 'dark';
  theme.setThemeTypeSystem();
  expect(theme.setThemeType).toHaveBeenCalledTimes(1);
  theme.isAutoMode = false;
  addEventListener.mock.calls[0][1]();
  expect(theme.setThemeType).toHaveBeenCalledTimes(1);
  window.matchMedia = jest.fn(() => {
    throw new Error('match media failed');
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  theme.initSystemTheme();
  expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  console.error.mockRestore();
});

test('covers audio settings device fallback and input constraint branches', () => {
  const audioSettings = new AudioSettings();
  audioSettings.ringtoneDeviceId = 'speaker-1';
  audioSettings.setRingtoneDeviceId('speaker-2');
  expect(audioSettings.ringtoneDeviceId).toBe('speaker-2');
  audioSettings.setAvailableDevices([
    { deviceId: 'speaker-2', kind: 'audiooutput' },
  ]);
  expect(audioSettings.ringtoneDeviceId).toBe('speaker-2');
  audioSettings.setAvailableDevices([
    { deviceId: 'speaker-3', kind: 'audiooutput' },
  ]);
  expect(audioSettings.ringtoneDeviceId).toBe('speaker-3');
  audioSettings.setAvailableDevices([
    { deviceId: 'default', kind: 'audiooutput' },
  ]);
  expect(audioSettings.ringtoneDeviceId).toBe('default');
  audioSettings.setUserMediaError();
  expect(audioSettings.userMediaErrorSet).toBe(true);
  expect(audioSettings.ringtoneDeviceId).toBe('default');
  audioSettings.enableAutoPlay();
  expect(audioSettings.autoplayEnabled).toBe(true);
  audioSettings.data.inputDeviceId = 'microphone-1';
  expect(audioSettings.inputDeviceId).toBe('microphone-1');
  expect(audioSettings.audioConstraints).toEqual({
    deviceId: {
      exact: 'microphone-1',
    },
  });
  audioSettings.data.inputDeviceId = '';
  expect(audioSettings.audioConstraints).toBe(true);
  audioSettings.data.inputDeviceId = 'default';
  audioSettings.availableInputDevices = [];
  expect(audioSettings.inputDeviceId).toBe('default');
  audioSettings.availableInputDevices = [{ deviceId: 'default', groupId: '', kind: 'audioinput' }];
  expect(audioSettings.inputDeviceId).toBe('default');
  audioSettings.availableInputDevices = [
    { deviceId: 'default', groupId: 'g1', kind: 'audioinput', label: '' },
  ];
  expect(audioSettings.inputDeviceId).toBe('default');
  audioSettings.availableInputDevices = [
    { deviceId: 'default', groupId: 'g1', kind: 'audioinput', label: 'Default' },
    { deviceId: 'mic-1', groupId: 'g1', kind: 'audioinput', label: 'Default Microphone' },
  ];
  expect(audioSettings.inputDeviceId).toBe('mic-1');
  audioSettings.availableInputDevices = [
    { deviceId: 'default', groupId: 'g1', kind: 'audioinput', label: 'Default' },
    { deviceId: 'mic-1', groupId: 'g1', kind: 'audioinput', label: 'External' },
    { deviceId: 'mic-2', groupId: 'g1', kind: 'audioinput', label: 'Built-in' },
  ];
  expect(audioSettings.inputDeviceId).toBe('default');
});

test('covers address book full sync, token fallback, permissions and no-permission sync', async () => {
  const addressBook = new AddressBook(createAddressBookDeps());
  addressBook._fetch = jest.fn(async (_perPage, _syncToken, pageId) => {
    if (!pageId) {
      return {
        nextPageId: 'page-2',
        records: [{ id: 'contact-1' }],
        syncInfo: {
          syncToken: 'sync-1',
          syncType: 'FSync',
        },
      };
    }
    return {
      records: [{ id: 'contact-2' }],
      syncInfo: {
        syncToken: 'sync-2',
        syncType: 'ISync',
      },
    };
  });
  addressBook._processISyncData = jest.fn((records) => records.map((record) => ({
    ...record,
    processed: true,
  })));
  await expect(addressBook._fetchAll('token-1')).resolves.toEqual({
    records: [
      { id: 'contact-1', processed: true },
      { id: 'contact-2', processed: true },
    ],
    syncToken: 'sync-2',
  });
  expect(mockSleep).toHaveBeenCalledWith(2000);
  addressBook._fetchAll = jest.fn(async (syncToken) => ({
    records: [],
    syncToken: syncToken || 'full-sync',
  }));
  await expect(addressBook._sync()).resolves.toEqual({
    records: [],
    syncToken: 'sync-token',
  });
  addressBook._fetchAll.mockRejectedValueOnce({
    response: {
      status: 403,
    },
  });
  await expect(addressBook._sync()).resolves.toEqual({});
  addressBook._fetchAll.mockRejectedValueOnce({
    response: {
      clone: () => ({
        json: async () => ({
          errors: [{ errorCode: 'CMN-101' }],
        }),
      }),
    },
  }).mockResolvedValueOnce({
    records: [],
    syncToken: 'fallback',
  });
  await expect(addressBook._sync()).resolves.toEqual({
    records: [],
    syncToken: 'fallback',
  });
  addressBook._fetchAll.mockRejectedValueOnce({
    response: {
      clone: () => ({
        json: async () => ({
          errors: [{ errorCode: 'OTHER' }],
        }),
      }),
    },
  });
  await expect(addressBook._sync()).rejects.toEqual(expect.any(Object));
  expect(addressBook._hasPermission).toBe(true);
  await expect(addressBook.sync()).resolves.toBe('base-sync');
  addressBook._deps.extensionFeatures.features.ReadPersonalContacts.available = false;
  expect(addressBook.sync()).toBeUndefined();
  expect(addressBook._source._props.permissionCheckFunction()).toBe(false);
});

test('covers grant extension source, subscriptions, computed filters and sync guards', async () => {
  const deps = createGrantDeps();
  const grantExtensions = new GrantExtensions(deps);
  expect(deps.dataFetcherV2.register).toHaveBeenCalledWith(expect.objectContaining({
    key: 'grantExtensions',
  }));
  await expect(grantExtensions._source.fetchFunction()).resolves.toEqual({
    records: [expect.objectContaining({ extension: expect.objectContaining({ id: 'park-1' }) })],
  });
  grantExtensions.onInit();
  expect(deps.subscription.subscribe).toHaveBeenCalledWith([
    '/restapi/v1.0/account/~/extension/~/grant',
  ]);
  expect(mockWatch).toHaveBeenCalled();
  grantExtensions.sync = jest.fn(async () => {});
  grantExtensions._handleSubscription(null);
  grantExtensions._handleSubscription({ event: '/restapi/v1.0/account/~/extension/~/presence' });
  expect(grantExtensions.sync).not.toHaveBeenCalled();
  grantExtensions._handleSubscription({ event: '/restapi/v1.0/account/~/extension/~/grant' });
  expect(grantExtensions.sync).toHaveBeenCalled();
  grantExtensions._stopWatching = jest.fn();
  grantExtensions.onReset();
  expect(grantExtensions._stopWatching).toBeNull();
  grantExtensions.data = {
    records: [
      {
        extension: {
          extensionNumber: '701',
          id: 'park-1',
          type: 'ParkLocation',
        },
        name: '',
        smsRecipient: true,
      },
      {
        callQueueSmsRecipient: true,
        extension: {
          extensionNumber: '801',
          id: 'queue-1',
          type: 'Department',
        },
        name: 'Queue Name',
      },
    ],
  };
  expect(grantExtensions.grantExtensions).toEqual([
    expect.objectContaining({
      extension: expect.objectContaining({
        name: 'Park One',
        status: 'Enabled',
        type: 'ParkLocation',
      }),
    }),
    expect.objectContaining({
      extension: expect.objectContaining({
        name: 'Queue Name',
        type: 'Department',
      }),
    }),
  ]);
  expect(grantExtensions.grantParkLocations).toHaveLength(1);
  expect(grantExtensions.callQueueSmsRecipients).toHaveLength(1);
  expect(grantExtensions.smsRecipients).toHaveLength(1);
  const activeSync = new GrantExtensions(createGrantDeps());
  await activeSync.sync();
  expect(activeSync._deps.dataFetcherV2.fetchData).toHaveBeenCalledWith(activeSync._source);
  activeSync._deps.tabManager.active = false;
  await activeSync.sync();
  expect(activeSync._deps.dataFetcherV2.fetchData).toHaveBeenCalledTimes(1);
  activeSync._deps.extensionFeatures.features.ReadExtensions.available = false;
  expect(activeSync._hasPermission).toBe(false);
  expect(activeSync._source.permissionCheckFunction()).toBe(false);
  expect(activeSync.onInit()).toBeUndefined();
  await activeSync.sync();
  expect(activeSync._deps.dataFetcherV2.fetchData).toHaveBeenCalledTimes(1);
});

test('covers contacts view search, source reset, refresh, resize and spinner branches', async () => {
  const props = createContactsProps();
  const { container, rerender, unmount } = render(<ContactsView {...props}>child-node</ContactsView>);
  expect(props.onVisitPage).toHaveBeenCalled();
  expect(screen.getByText('Favorites')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('searchPlaceholder'), { target: { value: 'Grace' } });
  expect(props.onSearchContact).toHaveBeenCalledWith({
    searchSource: 'personal',
    searchString: 'Grace',
  });
  fireEvent.click(screen.getByText('source-company'));
  expect(props.onSearchContact).toHaveBeenCalledWith({
    searchSource: 'company',
    searchString: 'Grace',
  });
  fireEvent.click(screen.getByTitle('refresh'));
  await waitFor(() => expect(props.onRefresh).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Favorites'));
  expect(props.onItemSelect).toHaveBeenCalledWith({ id: 'contact-1', name: 'Ada' });
  const wrapper = container.querySelector('[data-sign="contactList"] div div');
  if (wrapper) {
    wrapper.getBoundingClientRect = () => ({
      bottom: 240,
      left: 0,
      right: 160,
      top: 40,
    });
  }
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
  rerender(
    <ContactsView
      {...props}
      contactSourceNames={['company']}
      searchSource="removed"
      searchString="Updated"
      showSpinner
    />,
  );
  expect(props.onSearchContact).toHaveBeenCalledWith({
    searchSource: 'company',
    searchString: 'Grace',
  });
  expect(screen.getByText('spinner')).toBeInTheDocument();
  unmount();
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
});
