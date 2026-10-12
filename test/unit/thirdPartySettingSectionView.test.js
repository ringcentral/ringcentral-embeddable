import React from 'react';
import { render } from '@testing-library/react';

import { ThirdPartySettingSectionView } from '../../src/app/views/ThirdPartySettingSectionView/ThirdPartySettingSection.view';
import { ThirdPartySettingSectionPanel } from '../../src/app/views/ThirdPartySettingSectionView/ThirdPartySettingSectionPanel';

jest.mock(
  '../../src/app/views/ThirdPartySettingSectionView/ThirdPartySettingSectionPanel',
  () => ({ ThirdPartySettingSectionPanel: jest.fn(() => null) }),
);

function renderView(view, sectionId = 'crmSettings') {
  const Component = () =>
    view.component({ match: { params: { sectionId } } });
  return render(<Component />);
}

describe('ThirdPartySettingSectionView', () => {
  beforeEach(() => {
    ThirdPartySettingSectionPanel.mockClear();
  });

  test('connects the selected section to navigation, analytics, and saving', async () => {
    const section = {
      id: 'crmSettings',
      name: 'CRM settings',
      type: 'section',
      items: [],
    };
    const thirdParty = {
      settings: [section],
      onUpdateSetting: jest.fn().mockResolvedValue(undefined),
    };
    const router = { goBack: jest.fn() };
    const analytics = { track: jest.fn().mockResolvedValue(undefined) };
    const view = new ThirdPartySettingSectionView(
      thirdParty,
      router,
      analytics,
    );
    renderView(view);

    const props = ThirdPartySettingSectionPanel.mock.calls[0][0];
    expect(props.section).toBe(section);
    props.onBack();
    await props.onSave({ ...section, name: 'Updated CRM settings' });

    expect(router.goBack).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith(
      'Save Third Party Setting Section',
    );
    expect(thirdParty.onUpdateSetting).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated CRM settings' }),
    );
  });

  test('does not render an unknown or non-section setting', () => {
    const view = new ThirdPartySettingSectionView(
      {
        settings: [{ id: 'toggle', name: 'Toggle', type: 'boolean' }],
        onUpdateSetting: jest.fn(),
      },
      { goBack: jest.fn() },
      { track: jest.fn() },
    );
    const { container, rerender } = renderView(view, 'missing');
    expect(container).toBeEmptyDOMElement();

    const Component = () =>
      view.component({ match: { params: { sectionId: 'toggle' } } });
    rerender(<Component />);
    expect(container).toBeEmptyDOMElement();
    expect(ThirdPartySettingSectionPanel).not.toHaveBeenCalled();
  });
});
