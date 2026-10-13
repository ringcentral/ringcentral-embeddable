jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

jest.mock('@ringcentral-integration/micro-setting/src/app/services', () => ({
  IntegrationConfig: class IntegrationConfig {},
}));

jest.mock('@ringcentral-integration/micro-contacts/src/app/views', () => ({
  ContactDetailsView: class ContactDetailsView {
    constructor(
      _modalView,
      _contactMatcher,
      locale,
      router,
      contactSearch,
      _contacts,
      _extensionInfo,
      appFeatures,
    ) {
      this._locale = locale;
      this._router = router;
      this._contactSearch = contactSearch;
      this._appFeatures = appFeatures;
      this.currentContact = null;
      this.currentContactReadyState = 'contactReadyStatesView-pending';
    }

    getUIProps() {
      return {
        contact: this.currentContact,
        showSpinner: true,
      };
    }

    getUIFunctions() {
      return {
        onBackClick: () => this._router.goBack(),
        formatNumber: (phoneNumber) => `contact:${phoneNumber}`,
      };
    }
  },
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  CALLING_ROUTE_PATH: '/calling',
}));

jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));
jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock(
  '../../src/app/views/ContactDetailsView/ContactDetailsPanel',
  () => ({
    ContactDetailsPanel: () => null,
  }),
);

import { contactReadyStates } from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/contactReadyStates';

import { ContactDetailsView } from '../../src/app/views/ContactDetailsView/ContactDetails.view';

function createView({
  localeReady = true,
  contactSearchReady = false,
  appFeaturesReady = true,
  router = {},
  sideWidgetView,
  thirdParty,
  phoneNumberFormat,
  numberFormatter,
} = {}) {
  return new ContactDetailsView(
    {},
    {},
    { ready: localeReady, currentLocale: 'en-US' },
    router,
    { ready: contactSearchReady },
    {},
    {},
    { ready: appFeaturesReady },
    {},
    {},
    {},
    {},
    {},
    undefined,
    sideWidgetView,
    thirdParty,
    phoneNumberFormat,
    numberFormatter,
  );
}

describe('ContactDetailsView loading state', () => {
  test('shows a loaded contact without waiting for ContactSearch readiness', () => {
    const view = createView({ contactSearchReady: false });
    view.currentContact = { id: 'contact-1', type: 'crm' };
    view.currentContactReadyState = contactReadyStates.loaded;

    expect(view.getUIProps({})).toEqual(
      expect.objectContaining({
        contact: view.currentContact,
        showSpinner: false,
      }),
    );
  });

  test('keeps showing the spinner while the contact is loading', () => {
    const view = createView({ contactSearchReady: true });
    view.currentContactReadyState = contactReadyStates.loading;

    expect(view.getUIProps({}).showSpinner).toBe(true);
  });
});

describe('ContactDetailsView navigation', () => {
  function createRouter(currentPath = '/history/call-1') {
    return {
      currentPath,
      goBack: jest.fn(),
      push: jest.fn().mockResolvedValue(undefined),
      replace: jest.fn().mockResolvedValue(undefined),
    };
  }

  test.each(['/history/call-1', '/conversations/conversation-1'])(
    'returns a direct contact view to its originating route: %s',
    async (returnPath) => {
      const router = createRouter(returnPath);
      const view = createView({ router });

      await view.showContactDetails({
        id: 'company-contact-1',
        type: 'company',
        direct: true,
        returnPath,
      });
      view.getUIFunctions({}).onBackClick();

      expect(router.push).toHaveBeenCalledWith(
        '/contacts/company/company-contact-1?direct=true',
      );
      expect(router.replace).toHaveBeenCalledWith(returnPath);
      expect(router.goBack).not.toHaveBeenCalled();
    },
  );

  test('uses normal history when contact details came from the contact list', async () => {
    const router = createRouter('/contacts');
    const view = createView({ router });

    await view.showContactDetails({
      id: 'personal-contact-1',
      type: 'personal',
    });
    view.getUIFunctions({}).onBackClick();

    expect(router.goBack).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('ContactDetailsView from the call page', () => {
  function createRouter(currentPath = '/calling') {
    return {
      currentPath,
      goBack: jest.fn(),
      push: jest.fn().mockResolvedValue(undefined),
      replace: jest.fn().mockResolvedValue(undefined),
    };
  }

  function createSideWidgetView() {
    const handles = [];
    return {
      handles,
      createContent: jest.fn((options) => {
        const handle = { options };
        handles.push(handle);
        return handle;
      }),
      openContent: jest.fn(),
      closeTabFromPanel: jest.fn().mockResolvedValue(undefined),
    };
  }

  test('opens the contact in a side widget tab and stays on the call page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.showContactDetails({
      id: 'company-contact-1',
      type: 'company',
      direct: true,
      returnPath: '/calling',
    });

    expect(handle.options).toEqual(
      expect.objectContaining({
        id: 'call-page-contact-details',
        scope: 'contact',
      }),
    );
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle);
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('closes the tab from its back button instead of routing', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.showContactDetails({ id: 'company-contact-1', type: 'company' });
    handle.options.onBack();

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'call-page-contact-details',
    );
    expect(router.goBack).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('closes the call page tab when a contact opens as a routed page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await view.showContactDetails({ id: 'company-contact-1', type: 'company' });
    router.currentPath = '/contacts';
    await view.showContactDetails({ id: 'personal-contact-1', type: 'personal' });

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'call-page-contact-details',
    );
    expect(router.push).toHaveBeenCalledWith(
      '/contacts/personal/personal-contact-1',
    );
  });

  test('leaves side widget tabs alone once the call page tab closed', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.showContactDetails({ id: 'company-contact-1', type: 'company' });
    handle.options.onClose(null);
    router.currentPath = '/contacts';
    await view.showContactDetails({ id: 'personal-contact-1', type: 'personal' });

    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(
      '/contacts/personal/personal-contact-1',
    );
  });

  test('routes to the contact page when there is no side widget', async () => {
    const router = createRouter('/calling');
    const view = createView({ router });

    await view.showContactDetails({ id: 'company-contact-1', type: 'company' });

    expect(router.push).toHaveBeenCalledWith(
      '/contacts/company/company-contact-1',
    );
  });
});

describe('ContactDetailsView third-party service', () => {
  function createThirdParty(overrides = {}) {
    return {
      additionalContactActions: [{ id: 'schedule', label: 'Schedule' }],
      activitiesRegistered: true,
      activityName: null,
      serviceName: 'TestService',
      activities: [{ id: '1', subject: 'Follow-up call' }],
      activitiesLoaded: true,
      onClickAdditionalButton: jest.fn(async () => undefined),
      fetchActivities: jest.fn(async () => undefined),
      openActivity: jest.fn(async () => undefined),
      ...overrides,
    };
  }

  test('passes the service actions and activities to the page', () => {
    const view = createView({ thirdParty: createThirdParty() });

    expect(view.getUIProps({})).toEqual(
      expect.objectContaining({
        additionalActions: [{ id: 'schedule', label: 'Schedule' }],
        showActivities: true,
        activitiesTabName: 'TestService',
        activities: [{ id: '1', subject: 'Follow-up call' }],
        activitiesLoaded: true,
      }),
    );
  });

  test('names the activities tab after activityName when set', () => {
    const view = createView({
      thirdParty: createThirdParty({ activityName: 'CRM activities' }),
    });

    expect(view.getUIProps({}).activitiesTabName).toBe('CRM activities');
  });

  test('shows nothing extra without a third-party service', () => {
    const view = createView();

    expect(view.getUIProps({})).toEqual(
      expect.objectContaining({
        additionalActions: [],
        showActivities: false,
        activities: [],
      }),
    );
  });

  test('sends clicks and activity requests to the service', () => {
    const thirdParty = createThirdParty();
    const view = createView({ thirdParty });
    const functions = view.getUIFunctions({});
    const resource = { id: 'contact-1', phoneNumber: '+16505550100' };

    functions.onClickAdditionalAction('schedule', resource);
    functions.loadActivities();
    view.currentContact = { id: 'contact-1', type: 'crm' };
    functions.loadActivities();
    functions.openActivity({ id: '1' });

    expect(thirdParty.onClickAdditionalButton).toHaveBeenCalledWith(
      'schedule',
      resource,
    );
    expect(thirdParty.fetchActivities).toHaveBeenCalledTimes(1);
    expect(thirdParty.fetchActivities).toHaveBeenCalledWith({
      id: 'contact-1',
      type: 'crm',
    });
    expect(thirdParty.openActivity).toHaveBeenCalledWith({ id: '1' });
    expect(functions.formatActivityTime(1760000000000)).toEqual(
      expect.any(String),
    );
  });
});

describe('ContactDetailsView phone number format', () => {
  const numberFormatter = {
    formatNumber: jest.fn((phoneNumber) => `formatter:${phoneNumber}`),
  };

  test('keeps the contact formatting for the default national format', () => {
    const view = createView({
      phoneNumberFormat: { setting: { formatType: 'national' } },
      numberFormatter,
    });

    expect(view.getUIFunctions({}).formatNumber('+16505550100')).toBe(
      'contact:+16505550100',
    );
  });

  test.each(['international', 'e164', 'custom'])(
    'formats contact numbers with the %s format',
    (formatType) => {
      const view = createView({
        phoneNumberFormat: { setting: { formatType } },
        numberFormatter,
      });

      expect(view.getUIFunctions({}).formatNumber('+16505550100')).toBe(
        'formatter:+16505550100',
      );
    },
  );

  test('re-renders the numbers when the format changes', () => {
    const setting = { formatType: 'e164' };
    const view = createView({
      phoneNumberFormat: { setting },
      numberFormatter,
    });

    expect(view.getUIProps({}).phoneNumberFormatSetting).toBe(setting);
  });

  test('keeps the contact formatting without the format setting', () => {
    expect(createView().getUIFunctions({}).formatNumber('+16505550100')).toBe(
      'contact:+16505550100',
    );
  });
});
