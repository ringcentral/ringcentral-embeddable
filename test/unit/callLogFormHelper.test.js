const {
  allRequiredFieldsAreFilled,
  getChangedKeys,
  hasFormField,
  normalizeFormData,
} = require('../../src/app/views/LogCallView/callLogForm.helper');

describe('call log form helpers', () => {
  test('finds top-level form fields', () => {
    const schema = { properties: { note: { type: 'string' } } };

    expect(hasFormField(schema, 'note')).toBe(true);
    expect(hasFormField(schema, 'contact')).toBe(false);
    expect(hasFormField({}, 'note')).toBe(false);
  });

  test('checks required fields', () => {
    const schema = { required: ['contact', 'note'] };

    expect(allRequiredFieldsAreFilled({ contact: 'c-1', note: 'n' }, schema)).toBe(true);
    expect(allRequiredFieldsAreFilled({ contact: 'c-1', note: '' }, schema)).toBe(false);
    expect(allRequiredFieldsAreFilled({}, {})).toBe(true);
  });

  test('lists the keys a change touched', () => {
    expect(
      getChangedKeys(
        { note: 'a', contact: 'c-1', tags: ['x'] },
        { note: 'b', contact: 'c-1', tags: ['x'] },
      ),
    ).toEqual(['note']);
  });

  test('keeps only form data objects', () => {
    expect(normalizeFormData({ note: 'a' })).toEqual({ note: 'a' });
    expect(normalizeFormData(['a'])).toEqual({});
    expect(normalizeFormData('a')).toEqual({});
  });
});
