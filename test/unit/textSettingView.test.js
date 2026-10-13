import React from 'react';
import { act, render } from '@testing-library/react';

import { TextSettingView } from '../../src/app/views/TextSettingView/TextSetting.view';

let mockPanelProps;

jest.mock(
  '../../src/app/views/ThirdPartySettingSectionView/ThirdPartySettingSectionPanel',
  () => ({
    ThirdPartySettingSectionPanel: (props) => {
      mockPanelProps = props;
      return null;
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/components/MyCallerIdDropdown/i18n',
  () => ({
    __esModule: true,
    default: {
      getString: (key) =>
        ({ DirectNumber: 'Direct number', MainCompanyNumber: 'Main' })[key] ??
        key,
    },
  }),
);

function createView({
  senderNumber = '+16505550100',
  senderNumbersList = [
    { phoneNumber: '+16505550100', usageType: 'DirectNumber' },
    { phoneNumber: '+16505550199', usageType: 'MainCompanyNumber', label: 'Sales' },
    { phoneNumber: '+16505550111' },
  ],
} = {}) {
  const composeText = {
    senderNumber,
    updateSenderNumber: jest.fn(async () => undefined),
  };
  const router = { goBack: jest.fn() };
  const view = new TextSettingView(
    composeText,
    { senderNumbersList },
    {
      formattingParams: {},
      formatNumber: (phoneNumber) => `formatted:${phoneNumber}`,
    },
    { currentLocale: 'en-US' },
    router,
  );
  return { view, composeText, router };
}

describe('TextSettingView', () => {
  test('lists the SMS senders with their labels and selects the current one', () => {
    const { view } = createView();
    const [item] = view.section.items;

    expect(item).toMatchObject({
      id: 'senderNumber',
      type: 'option',
      value: '+16505550100',
      required: true,
    });
    expect(item.options).toEqual([
      {
        id: '+16505550100',
        name: 'formatted:+16505550100',
        description: 'Direct number',
      },
      {
        id: '+16505550199',
        name: 'formatted:+16505550199',
        description: 'Sales',
      },
      {
        id: '+16505550111',
        name: 'formatted:+16505550111',
        description: '',
      },
    ]);
  });

  test('saves the picked sender as the compose sender', async () => {
    const { view, composeText, router } = createView();
    const Component = () => view.component();
    render(<Component />);

    await act(async () => {
      await mockPanelProps.onSave({
        ...mockPanelProps.section,
        items: [{ id: 'senderNumber', value: '+16505550199' }],
      });
    });
    mockPanelProps.onBack();

    expect(composeText.updateSenderNumber).toHaveBeenCalledWith(
      '+16505550199',
    );
    expect(router.goBack).toHaveBeenCalled();
  });

  test('ignores a save without a sender', async () => {
    const { view, composeText } = createView();
    const Component = () => view.component();
    render(<Component />);

    await act(async () => {
      await mockPanelProps.onSave({
        ...mockPanelProps.section,
        items: [{ id: 'senderNumber', value: '' }],
      });
    });

    expect(composeText.updateSenderNumber).not.toHaveBeenCalled();
  });
});
