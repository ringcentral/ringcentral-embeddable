const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Slider: jest.fn(({
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      disabled,
      id,
      max,
      min,
      name,
      showColorAtRest,
      step,
      value,
      valueLabelDisplay,
    }) =>
      ReactForMock.createElement('div', {
        'aria-describedby': ariaDescribedBy,
        'data-aria-label': ariaLabel,
        'data-aria-labelledby': ariaLabelledBy,
        'data-component': 'Slider',
        'data-disabled': disabled ? 'true' : 'false',
        'data-max': max,
        'data-min': min,
        'data-name': name,
        'data-show-color-at-rest': showColorAtRest ? 'true' : 'false',
        'data-step': step,
        'data-value': value,
        'data-value-label-display': valueLabelDisplay,
        id,
      })),
  };
});

const { Slider } = require('@ringcentral/spring-ui');
const RangeWidget = require('../src/Widgets/RangeWidget').default;

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    hideLabel: false,
    id: 'root_volume',
    label: 'Volume',
    name: 'volume',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      maximum: 100,
      minimum: 0,
      multipleOf: 10,
      type: 'integer',
    },
    value: 50,
    ...overrides,
  };
}

describe('jsonschema-spring-page RangeWidget', () => {
  beforeEach(() => {
    Slider.mockClear();
  });

  it('uses Spring UI Slider with normal Spring UI form-field label classes', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        RangeWidget,
        createWidgetProps({
          options: {
            step: 5,
          },
          rawErrors: ['Required'],
          required: true,
        }),
      ),
    );

    expect(html).toContain('data-component="Slider"');
    expect(html).toContain('data-min="0"');
    expect(html).toContain('data-max="100"');
    expect(html).toContain('data-step="5"');
    expect(html).toContain('data-value="50"');
    expect(html).toContain('data-show-color-at-rest="true"');
    expect(html).toContain('data-value-label-display="auto"');
    expect(html).toContain('data-aria-labelledby="root_volume__label"');
    expect(html).toContain(
      '<label id="root_volume__label" class="sui-form-field-label sui-form-field-outlined-label sui-form-field-error-label" for="root_volume">Volume *</label>',
    );
    expect(html).not.toContain('sui-form-label-label');
    expect(html).not.toContain('type="range"');
  });

  it('uses the hidden label as the Slider aria-label when the visual label is hidden', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        RangeWidget,
        createWidgetProps({
          hideLabel: true,
        }),
      ),
    );

    expect(html).not.toContain('root_volume__label');
    expect(html).toContain('data-aria-label="Volume"');
  });

  it('emits numeric Slider values to RJSF on change', () => {
    const props = createWidgetProps();
    renderToStaticMarkup(
      React.createElement(RangeWidget, props),
    );

    const sliderProps = Slider.mock.calls[0][0];
    sliderProps.onChange(new Event('input'), 75);

    expect(props.onChange).toHaveBeenCalledWith(75);
  });
});
