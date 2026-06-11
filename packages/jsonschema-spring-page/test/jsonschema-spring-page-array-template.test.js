const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const ArrayFieldTemplate =
  require('../src/Templates/ArrayFieldTemplate').default;
const ArrayFieldItemTemplate =
  require('../src/Templates/ArrayFieldItemTemplate').default;

function createButtonTemplate(label) {
  return function ButtonTemplate({ className, disabled }) {
    return React.createElement('button', { className, disabled }, label);
  };
}

function createRegistry() {
  return {
    templates: {
      ArrayFieldDescriptionTemplate: ({ description }) =>
        React.createElement('div', { className: 'description' }, description),
      ArrayFieldItemTemplate,
      ArrayFieldTitleTemplate: ({ title }) =>
        React.createElement('div', { className: 'title' }, title),
      ButtonTemplates: {
        AddButton: createButtonTemplate('Add Item'),
        CopyButton: createButtonTemplate('Copy'),
        MoveDownButton: createButtonTemplate('Move down'),
        MoveUpButton: createButtonTemplate('Move up'),
        RemoveButton: createButtonTemplate('Remove'),
      },
    },
  };
}

function createArrayItemProps(overrides = {}) {
  return {
    canAdd: true,
    children: React.createElement('input', { defaultValue: 'react' }),
    className: 'array-item',
    disabled: false,
    hasCopy: false,
    hasMoveDown: true,
    hasMoveUp: false,
    hasRemove: true,
    hasToolbar: true,
    index: 0,
    key: 'tags-0',
    onAddIndexClick: () => () => undefined,
    onCopyIndexClick: () => () => undefined,
    onDropIndexClick: () => () => undefined,
    onReorderClick: () => () => undefined,
    readonly: false,
    registry: createRegistry(),
    schema: {
      type: 'string',
    },
    totalItems: 2,
    uiSchema: {},
    ...overrides,
  };
}

describe('jsonschema-spring-page array templates', () => {
  it('renders primitive item actions on the same row as the input', () => {
    const html = renderToStaticMarkup(
      React.createElement(ArrayFieldItemTemplate, createArrayItemProps()),
    );
    expect(html).toContain('w-full min-w-0');
    expect(html).toContain('border-neutral-b4');
    expect(html).toContain('flex items-start gap-2');
    expect(html).toContain('flex shrink-0 justify-end gap-1 pt-6');
    expect(html).toContain('shrink-0');
    expect(html).not.toContain('shadow-md');
    expect(html.indexOf('value="react"')).toBeLessThan(html.indexOf('Move down'));
  });

  it('anchors object item actions in the card header area', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ArrayFieldItemTemplate,
        createArrayItemProps({
          children: React.createElement('div', null, 'Object item fields'),
          schema: {
            properties: {
              name: {
                type: 'string',
              },
            },
            type: 'object',
          },
        }),
      ),
    );
    expect(html).not.toContain('flex items-start gap-2');
    expect(html).toContain('relative');
    expect(html).toContain('flex shrink-0 justify-end gap-1 absolute right-3 top-3');
    expect(html).toContain("[&amp;&gt;[id$=&#x27;__title&#x27;]]:pr-[136px]");
  });

  it('renders array shell without the default shadow layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(ArrayFieldTemplate, {
        canAdd: true,
        className: 'field-array',
        disabled: false,
        idSchema: {
          $id: 'root_tags',
        },
        items: [createArrayItemProps()],
        onAddClick: () => undefined,
        readonly: false,
        registry: createRegistry(),
        required: false,
        schema: {
          description: 'Add relevant tags for the project',
          type: 'array',
        },
        title: 'Project Tags',
        uiSchema: {},
      }),
    );
    expect(html).toContain('Project Tags');
    expect(html).toContain('Add relevant tags for the project');
    expect(html).toContain('mt-3 flex w-full min-w-0 flex-col gap-3');
    expect(html).toContain('array-item-add shrink-0');
    expect(html).not.toContain('shadow-md');
  });
});
