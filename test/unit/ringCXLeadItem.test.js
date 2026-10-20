// A fetched lead's numbers dial it from the Leads list; a number already
// dialed cannot be dialed again, as in Agent One.

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({ t: (key) => key }),
}));
jest.mock('../../src/ringcx/services/CxLeads', () => ({
  SEARCH_DISABLE_DIAL_STATES: [],
}));

import React from 'react';
import { render } from '@testing-library/react';

import { LeadItem } from '../../src/ringcx/components/LeadItem/LeadItem';

const allByDataSign = (dataSign) => [
  ...document.querySelectorAll(`[data-sign="${dataSign}"]`),
];

const lead = {
  leadId: 'lead-1',
  requestId: 'request-1',
  leadState: 'PENDING',
};

describe('LeadItem dialed numbers', () => {
  test('disables a number already dialed and keeps the others', () => {
    render(
      <LeadItem
        lead={lead}
        displayName="Ada Lovelace"
        phoneNumbers={[
          { formatted: '(650) 555-0100', destination: '+16505550100', dialed: true },
          { formatted: '(650) 555-0101', destination: '+16505550101' },
        ]}
        onDial={jest.fn()}
      />,
    );

    const [dialed, other] = allByDataSign('phoneNumberButton');
    expect(dialed).toBeDisabled();
    expect(other).not.toBeDisabled();
  });

  test('disables the dial action of a single number already dialed', () => {
    render(
      <LeadItem
        lead={lead}
        displayName="Ada Lovelace"
        phoneNumbers={[
          { formatted: '(650) 555-0100', destination: '+16505550100', dialed: true },
        ]}
        onDial={jest.fn()}
      />,
    );

    expect(allByDataSign('dialButton')[0]).toBeDisabled();
    expect(allByDataSign('phoneNumberButton')[0]).toBeDisabled();
  });
});
