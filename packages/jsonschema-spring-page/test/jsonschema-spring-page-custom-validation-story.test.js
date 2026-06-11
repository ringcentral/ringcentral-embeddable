jest.mock('../src/index', () => ({
  JSONSchemaPage: () => null,
}));

const { CustomValidation } = require('../src/__stories__/BasicForms.stories.tsx');

describe('jsonschema-spring-page custom validation story', () => {
  it('shows the submit button so validation can be triggered', () => {
    expect(CustomValidation.args.hiddenSubmitButton).toBe(false);
  });
});
