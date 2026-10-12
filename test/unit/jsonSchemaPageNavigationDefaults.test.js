import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// Spring templates, widgets and fields pull in Juno's untransformed ESM tree.
// The default form state is decided by the form itself, so the stock RJSF
// renderers are enough here.
jest.mock('../../packages/jsonschema-spring-page/src/Templates', () => ({
  templates: {},
}));
jest.mock('../../packages/jsonschema-spring-page/src/Widgets', () => ({
  widgets: {},
}));
jest.mock('../../packages/jsonschema-spring-page/src/Fields', () => ({
  fields: {},
}));

// eslint-disable-next-line import/first
import { JSONSchemaPage } from '../../packages/jsonschema-spring-page/src';

const navigationSchema = {
  type: 'object',
  properties: {
    section: {
      type: 'string',
      oneOf: [
        { const: 'managedSettings', title: 'Managed settings' },
        { const: 'plugins', title: 'Plugins' },
      ],
    },
  },
};

describe('JSONSchemaPage navigation defaults', () => {
  test('does not report a form data change when a page with oneOf options mounts', () => {
    const onFormDataChange = jest.fn();

    render(
      <JSONSchemaPage
        schema={navigationSchema}
        formData={{}}
        onFormDataChange={onFormDataChange}
      />,
    );

    expect(onFormDataChange).not.toHaveBeenCalled();
  });

  test('reports the selected option', () => {
    const onFormDataChange = jest.fn();

    render(
      <JSONSchemaPage
        schema={navigationSchema}
        formData={{}}
        onFormDataChange={onFormDataChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: {
        value: screen.getByRole('option', { name: 'Plugins' }).value,
      },
    });

    expect(onFormDataChange).toHaveBeenCalledWith({ section: 'plugins' });
  });
});
