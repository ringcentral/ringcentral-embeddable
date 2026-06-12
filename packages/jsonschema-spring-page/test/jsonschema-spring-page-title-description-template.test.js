const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-icon', () => {
  const IconMock = () => null;
  IconMock.displayName = 'IconMock';
  return {
    CaretDownMd: IconMock,
    CaretUpMd: IconMock,
  };
});

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Divider: () => ReactForMock.createElement('hr'),
    Icon: () => ReactForMock.createElement('span'),
    Link: ({ children, ...props }) =>
      ReactForMock.createElement('a', props, children),
    Text: ({ component: Component = 'span', children, style, ...props }) =>
      ReactForMock.createElement(
        Component,
        {
          ...props,
          'data-text-color': style?.color,
        },
        children,
      ),
  };
});

const DescriptionField =
  require('../src/Templates/DescriptionField').default;
const TitleField =
  require('../src/Templates/TitleField').default;

describe('jsonschema-spring-page title and description templates', () => {
  it('uses Spring UI palette variables for description text', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionField, {
        description: 'Helpful description',
        id: 'root_description',
        uiSchema: {},
      }),
    );
    expect(html).toContain('data-text-color="var(--sui-colors-neutral-b2)"');
  });

  it('uses Spring UI palette variables for disabled title and description text', () => {
    const descriptionHtml = renderToStaticMarkup(
      React.createElement(DescriptionField, {
        description: 'Disabled description',
        id: 'root_description',
        uiSchema: {
          'ui:disabled': true,
        },
      }),
    );
    const titleHtml = renderToStaticMarkup(
      React.createElement(TitleField, {
        id: 'root_title',
        title: 'Disabled title',
        uiSchema: {
          'ui:disabled': true,
        },
      }),
    );
    expect(descriptionHtml).toContain(
      'data-text-color="var(--sui-colors-neutral-b3)"',
    );
    expect(titleHtml).toContain(
      'data-text-color="var(--sui-colors-neutral-b3)"',
    );
  });
});
