import React from 'react';
import { render } from '@testing-library/react';

jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/components',
  () => ({
    ContactAvatar: () => <span data-sign="contactAvatar" />,
  }),
);

jest.mock('../../src/app/views/CallHUDView/i18n', () => {
  const enUS = jest.requireActual(
    '../../src/app/views/CallHUDView/i18n/en-US',
  ).default;
  return {
    __esModule: true,
    default: {},
    t: (key) => enUS[key] ?? key,
  };
});

const {
  ExtensionItem,
} = require('../../src/app/views/CallHUDView/ExtensionItem');

function renderItem(extension) {
  const { container } = render(
    <ExtensionItem
      item={{
        id: 'record-1',
        extension: {
          id: 'ext-1',
          extensionNumber: '107',
          type: 'User',
          ...extension,
        },
        presence: { presenceStatus: 'Available' },
      }}
      formatPhone={(phone) => phone}
      onClickToDial={jest.fn()}
      disableClickToDial={false}
      canPark={false}
      onPark={jest.fn()}
      onText={jest.fn()}
      pickParkLocation={jest.fn()}
      pickGroupCall={jest.fn()}
      pickCallQueueCall={jest.fn()}
      onRemoveExtension={jest.fn()}
      canEdit={false}
    />,
  );
  return container.querySelector('[data-sign="extensionItem-ext-1"]');
}

describe('CallHUD ExtensionItem', () => {
  test('keeps an extension without a contact status active', () => {
    const item = renderItem({ status: undefined });

    expect(item.className).not.toContain('opacity-50');
    expect(
      item.querySelector('[data-sign="callExtension"]'),
    ).not.toBeNull();
  });

  test('keeps an enabled extension active', () => {
    const item = renderItem({ name: 'Sushil Mall', status: 'Enabled' });

    expect(item.className).not.toContain('opacity-50');
    expect(
      item.querySelector('[data-sign="callExtension"]'),
    ).not.toBeNull();
  });

  test('disables an extension that is not enabled', () => {
    const item = renderItem({ name: 'Sushil Mall', status: 'Disabled' });

    expect(item.className).toContain('opacity-50');
    expect(item.className).toContain('pointer-events-none');
    expect(item.querySelector('[data-sign="callExtension"]')).toBeNull();
  });
});
