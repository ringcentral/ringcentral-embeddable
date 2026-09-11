const path = require('path');
const { createRequire } = require('module');
const React = require('react');
const { render } = require('@testing-library/react');

jest.mock('@ringcentral-integration/rjsf-spring', () => ({
  generateTemplates: () => ({}),
  generateWidgets: () => ({}),
}));

const {
  JSONSchemaPage,
} = require('../../packages/jsonschema-spring-page/src');

const workspacePackages = [
  'packages/jsonschema-page',
  'packages/jsonschema-spring-page',
];

describe('React dependency identity', () => {
  test.each(workspacePackages)(
    '%s resolves the application React singleton',
    (workspacePackage) => {
      const workspaceRequire = createRequire(
        path.resolve(workspacePackage, 'package.json'),
      );

      expect(workspaceRequire.resolve('react')).toBe(require.resolve('react'));
      expect(workspaceRequire.resolve('react-dom')).toBe(
        require.resolve('react-dom'),
      );
    },
  );

  test('renders an object schema with the application React renderer', () => {
    const { container } = render(
      React.createElement(JSONSchemaPage, {
        formData: { note: '' },
        onFormDataChange: jest.fn(),
        schema: {
          title: 'Conversation log',
          type: 'object',
          properties: {
            note: {
              title: 'Note',
              type: 'string',
            },
          },
        },
      }),
    );

    expect(container.querySelector('form')).not.toBeNull();
  });
});
