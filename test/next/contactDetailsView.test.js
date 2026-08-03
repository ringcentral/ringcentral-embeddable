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
      _router,
      contactSearch,
      _contacts,
      _extensionInfo,
      appFeatures,
    ) {
      this._locale = locale;
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
  },
}));

jest.mock(
  '../../next/app/views/ContactDetailsView/ContactDetailsPanel',
  () => ({
    ContactDetailsPanel: () => null,
  }),
);

import { contactReadyStates } from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/contactReadyStates';

import { ContactDetailsView } from '../../next/app/views/ContactDetailsView/ContactDetails.view';

function createView({
  localeReady = true,
  contactSearchReady = false,
  appFeaturesReady = true,
} = {}) {
  return new ContactDetailsView(
    {},
    {},
    { ready: localeReady },
    {},
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
