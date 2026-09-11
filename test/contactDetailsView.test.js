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
      };
    }
  },
}));

jest.mock(
  '../src/app/views/ContactDetailsView/ContactDetailsPanel',
  () => ({
    ContactDetailsPanel: () => null,
  }),
);

import { contactReadyStates } from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/contactReadyStates';

import { ContactDetailsView } from '../src/app/views/ContactDetailsView/ContactDetails.view';

function createView({
  localeReady = true,
  contactSearchReady = false,
  appFeaturesReady = true,
  router = {},
} = {}) {
  return new ContactDetailsView(
    {},
    {},
    { ready: localeReady },
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
