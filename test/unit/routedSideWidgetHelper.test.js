import {
  getRoutedCallContact,
  getRoutedConversationContact,
} from '../../src/app/views/RoutedSideWidgetView/RoutedSideWidget.helper';

describe('RoutedSideWidget helper', () => {
  test('resolves the remote party for inbound and outbound conversations', () => {
    expect(
      getRoutedConversationContact({
        direction: 'Inbound',
        from: { name: 'Caller', phoneNumber: '+16505550100' },
        correspondentMatches: [{ id: 'caller', name: 'Matched caller' }],
      }),
    ).toEqual({
      id: 'caller',
      name: 'Matched caller',
      phoneNumber: '+16505550100',
    });
    expect(
      getRoutedConversationContact({
        direction: 'Outbound',
        to: [{ name: 'Callee', phoneNumber: '+16505550101' }],
      }),
    ).toEqual({
      name: 'Callee',
      phoneNumber: '+16505550101',
    });
  });

  test('resolves the remote call party and an unambiguous match', () => {
    expect(
      getRoutedCallContact({
        direction: 'Inbound',
        from: { phoneNumber: '+16505550100' },
        fromMatches: [{ id: 'caller', phoneNumber: '+16505550102' }],
      }),
    ).toEqual({
      id: 'caller',
      phoneNumber: '+16505550102',
    });
    expect(
      getRoutedCallContact({
        direction: 'Outbound',
        to: '+16505550101',
        toMatches: [{ id: 'first' }, { id: 'second' }],
      }),
    ).toEqual({ phoneNumber: '+16505550101' });
  });

  test('returns null when no contact identity is available', () => {
    expect(getRoutedConversationContact()).toBeNull();
    expect(getRoutedConversationContact({ direction: 'Inbound' })).toBeNull();
    expect(getRoutedCallContact(null)).toBeNull();
    expect(getRoutedCallContact({ direction: 'Outbound' })).toBeNull();
  });
});
