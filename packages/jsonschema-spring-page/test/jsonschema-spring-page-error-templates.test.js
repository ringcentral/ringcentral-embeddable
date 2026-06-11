const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const ErrorListTemplate =
  require('../src/Templates/ErrorListTemplate').default;
const FieldErrorTemplate =
  require('../src/Templates/FieldErrorTemplate').default;

describe('jsonschema-spring-page error templates', () => {
  it('does not render the global error summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(ErrorListTemplate, {
        errors: [{ stack: 'username: Must be at least 3 characters long' }],
        registry: {},
      }),
    );
    expect(html).toBe('');
  });

  it('does not render duplicate field error blocks', () => {
    const html = renderToStaticMarkup(
      React.createElement(FieldErrorTemplate, {
        errors: ['Must be at least 3 characters long'],
        idSchema: {
          $id: 'root_username',
        },
      }),
    );
    expect(html).toBe('');
  });
});
