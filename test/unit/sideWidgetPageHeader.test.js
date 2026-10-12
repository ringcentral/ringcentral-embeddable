import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SideWidgetPageHeader } from '../../src/app/views/SideWidgetView/SideWidgetPageHeader';

describe('SideWidgetPageHeader', () => {
  test('shows the title and a close button when the page can close', () => {
    const onClose = jest.fn();
    render(
      <SideWidgetPageHeader
        title="HUD"
        onClose={onClose}
        closeLabel="Close HUD"
        data-sign="callHUDHeader"
        closeDataSign="callHUDClose"
      />,
    );

    expect(screen.getByText('HUD')).toBeInTheDocument();
    expect(
      document.querySelector('[data-sign="callHUDHeaderCenter"]'),
    ).toHaveTextContent('HUD');
    fireEvent.click(document.querySelector('[data-sign="callHUDClose"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('leaves the close button out while a tab bar names the page', () => {
    render(
      <SideWidgetPageHeader
        title="Voicemail drop"
        closeLabel="Close"
        closeDataSign="voicemailDropClose"
      />,
    );

    expect(screen.getByText('Voicemail drop')).toBeInTheDocument();
    expect(
      document.querySelector('[data-sign="voicemailDropClose"]'),
    ).toBeNull();
  });
});
