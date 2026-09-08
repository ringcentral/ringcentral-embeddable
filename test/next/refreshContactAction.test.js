import {
  createRefreshContactActionButton,
  insertRefreshContactActionButton,
} from '../../next/app/components/RefreshContactActionButton';
import { refreshContactMatch } from '../../next/app/services/ContactMatcher/refreshContactMatch';

describe('refresh-contact action', () => {
  test('marks a manual refresh before forcing contact matching', async () => {
    const setManualRefreshNumber = jest.fn();
    const forceMatchNumber = jest.fn(async () => {});

    await refreshContactMatch(
      { forceMatchNumber, setManualRefreshNumber },
      '+16505550100',
    );

    expect(setManualRefreshNumber).toHaveBeenCalledWith('+16505550100');
    expect(forceMatchNumber).toHaveBeenCalledWith({
      phoneNumber: '+16505550100',
    });
    expect(setManualRefreshNumber.mock.invocationCallOrder[0]).toBeLessThan(
      forceMatchNumber.mock.invocationCallOrder[0],
    );
  });

  test('creates a Spring refresh button that forwards the phone number', () => {
    const onRefreshContact = jest.fn();
    const stopPropagation = jest.fn();
    const button = createRefreshContactActionButton({
      disabled: true,
      label: 'Refresh contact',
      onRefreshContact,
      phoneNumber: '+16505550100',
    });

    expect(button).toEqual(
      expect.objectContaining({
        actionType: 'refreshContact',
        disabled: true,
        label: 'Refresh contact',
        symbol: 'RefreshContactMd',
      }),
    );

    button.onClick({ stopPropagation });

    expect(onRefreshContact).toHaveBeenCalledWith('+16505550100');
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  test('does not create refresh without a number or callback', () => {
    expect(
      createRefreshContactActionButton({
        label: 'Refresh contact',
        onRefreshContact: jest.fn(),
      }),
    ).toBeNull();
    expect(
      createRefreshContactActionButton({
        label: 'Refresh contact',
        phoneNumber: '+16505550100',
      }),
    ).toBeNull();
  });

  test('inserts refresh before the requested action and otherwise appends it', () => {
    const refreshContactButton = { actionType: 'refreshContact' };
    const buttons = [{ actionType: 'call' }, { actionType: 'viewLog' }];

    expect(
      insertRefreshContactActionButton(
        buttons,
        refreshContactButton,
        'viewLog',
      ).map(({ actionType }) => actionType),
    ).toEqual(['call', 'refreshContact', 'viewLog']);
    expect(
      insertRefreshContactActionButton(
        [{ actionType: 'call' }],
        refreshContactButton,
        'delete',
      ).map(({ actionType }) => actionType),
    ).toEqual(['call', 'refreshContact']);
  });
});
