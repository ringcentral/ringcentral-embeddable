const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Link: ({ children, ...props }) => ReactForMock.createElement('a', props, children),
    Text: ({ component: Component = 'span', children, ...props }) =>
      ReactForMock.createElement(Component, props, children),
  };
});

const {
  getTextColor,
  getTypographyComponent,
  getTypographyClassName,
} = require('../src/utils/compat');
const {
  Typography,
} = require('../src/Fields/Typography');

describe('jsonschema-spring-page typography compatibility', () => {
  it('uses Spring UI typography variants directly', () => {
    expect(getTypographyClassName('headline')).toBe('typography-headline');
    expect(getTypographyClassName('display3')).toBe('typography-display3');
    expect(getTypographyClassName('descriptorMiniSemiBold')).toBe(
      'typography-descriptorMiniSemiBold',
    );
  });

  it('preserves Spring UI typography class names', () => {
    expect(getTypographyClassName('typography-title')).toBe('typography-title');
    expect(getTypographyClassName('typography-mainText')).toBe(
      'typography-mainText',
    );
  });

  it('maps legacy Juno typography variants to Spring UI classes', () => {
    expect(getTypographyClassName('h4')).toBe('typography-headline');
    expect(getTypographyClassName('h6')).toBe('typography-display3');
    expect(getTypographyClassName('body1')).toBe('typography-mainText');
    expect(getTypographyClassName('body2')).toBe(
      'typography-subtitleMiniSemiBold',
    );
    expect(getTypographyClassName('caption1')).toBe('typography-descriptor');
    expect(getTypographyClassName('caption2')).toBe(
      'typography-descriptorMiniSemiBold',
    );
    expect(getTypographyClassName('title1')).toBe(
      'typography-display3 tracking-normal',
    );
    expect(getTypographyClassName('title2')).toBe('typography-title');
  });

  it('falls back to main text for unknown variants', () => {
    expect(getTypographyClassName()).toBe('typography-mainText');
    expect(getTypographyClassName('unknown')).toBe('typography-mainText');
  });

  it('maps heading variants to Text component tags', () => {
    expect(getTypographyComponent('h1', false)).toBe('h1');
    expect(getTypographyComponent('h4', false)).toBe('h4');
    expect(getTypographyComponent('typography-title', false)).toBe('p');
    expect(getTypographyComponent('h4', true)).toBe('li');
  });

  it('maps legacy Juno text color tokens to Spring UI CSS tokens', () => {
    expect(getTextColor('success.f02')).toBe('var(--sui-colors-success-f)');
    expect(getTextColor('danger.f02')).toBe('var(--sui-colors-danger-f)');
    expect(getTextColor('warning.f02')).toBe('var(--sui-colors-warning-f)');
    expect(getTextColor('interactive.f01')).toBe('var(--sui-colors-primary-f)');
    expect(getTextColor('#123456')).toBe('#123456');
  });

  it('renders heading variants through Spring UI Text component overrides', () => {
    const html = renderToStaticMarkup(
      React.createElement(Typography, {
        schema: {
          description: 'Heading text',
        },
        uiSchema: {
          'ui:variant': 'h4',
        },
      }),
    );
    expect(html).toContain('<h4');
    expect(html).toContain('typography-headline');
    expect(html).not.toContain('style=');
  });

  it('renders bulleted list items with visible marker classes', () => {
    const html = renderToStaticMarkup(
      React.createElement(Typography, {
        schema: {
          description: 'Bullet text',
        },
        uiSchema: {
          'ui:bulletedList': true,
        },
      }),
    );
    expect(html).toContain('<li');
    expect(html).toContain('list-disc');
    expect(html).toContain('list-outside');
    expect(html).toContain('!overflow-visible');
    expect(html).not.toContain('style=');
  });
});
