import { decidePageContact } from '../src/app/views/RoutedSideWidgetView/RoutedSideWidget.contact';

const nothing = { contactApplied: false, blankContactApplied: false };
const blank = { contactApplied: true, blankContactApplied: true };
const applied = { contactApplied: true, blankContactApplied: false };
const contact = { id: 'contact-1', phoneNumber: '+16505550100' };

describe('decidePageContact', () => {
  test('waits while the contact is unknown', () => {
    expect(decidePageContact(nothing, undefined, false)).toEqual({
      type: 'keep',
    });
  });

  test('applies a contact once', () => {
    expect(decidePageContact(nothing, contact, false)).toEqual({
      type: 'apply',
      contact,
      next: applied,
    });
    expect(decidePageContact(applied, contact, false)).toEqual({ type: 'keep' });
    expect(decidePageContact(applied, null, false)).toEqual({ type: 'keep' });
  });

  test('applies no contact, which closes other contacts’ tabs', () => {
    expect(decidePageContact(nothing, null, false)).toEqual({
      type: 'apply',
      contact: null,
      next: blank,
    });
  });

  test('waits before applying no contact on a page whose contact arrives late', () => {
    expect(decidePageContact(nothing, null, true)).toEqual({ type: 'defer' });
    expect(decidePageContact(nothing, contact, true)).toMatchObject({
      type: 'apply',
      contact,
    });
  });

  test('replaces no contact with a real one that arrives later', () => {
    expect(decidePageContact(blank, contact, false)).toEqual({
      type: 'apply',
      contact,
      next: applied,
    });
    expect(decidePageContact(blank, contact, true)).toMatchObject({
      type: 'apply',
    });
    expect(decidePageContact(blank, null, false)).toEqual({ type: 'keep' });
  });
});
