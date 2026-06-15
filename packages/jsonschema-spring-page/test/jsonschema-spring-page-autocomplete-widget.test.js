const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Autocomplete: jest.fn(({
      'aria-describedby': ariaDescribedBy,
      disabled,
      error,
      fullWidth,
      id,
      inputValue,
      label,
      multiple,
      onChange,
      onInputChange,
      options,
      placeholder,
      renderOption,
      required,
      toggleButton,
      value,
      variant,
    }) =>
      ReactForMock.createElement(
        'div',
        {
          'aria-describedby': ariaDescribedBy,
          'data-component': 'Autocomplete',
          'data-disabled': disabled ? 'true' : 'false',
          'data-error': error ? 'true' : 'false',
          'data-full-width': fullWidth ? 'true' : 'false',
          'data-has-on-change': typeof onChange === 'function' ? 'true' : 'false',
          'data-has-on-input-change':
            typeof onInputChange === 'function' ? 'true' : 'false',
          'data-input-value': inputValue,
          'data-label': label,
          'data-multiple': multiple ? 'true' : 'false',
          'data-option-count': options.length,
          'data-placeholder': placeholder,
          'data-required': required ? 'true' : 'false',
          'data-toggle-button': toggleButton ? 'true' : 'false',
          'data-value': JSON.stringify(value),
          'data-variant': variant,
          id,
        },
        options.map((option, index) =>
          renderOption(option, {
            highlighted: index === 0,
            index,
            inputValue,
          }),
        ),
      )),
    MenuItemText: ({ info, primary }) =>
      ReactForMock.createElement(
        'span',
        {
          'data-component': 'MenuItemText',
          'data-info': info,
        },
        primary,
      ),
    Option: jest.fn(() => {
      throw new Error('AutocompleteWidget should not render Spring UI Option');
    }),
    SuggestionListItem: jest.fn(({
      children,
      highlighted,
      id,
      label,
    }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-component': 'SuggestionListItem',
          'data-highlighted': highlighted ? 'true' : 'false',
          'data-id': id,
          'data-label': label,
        },
        children,
      )),
  };
});

const {
  Autocomplete,
  Option,
  SuggestionListItem,
} = require('@ringcentral/spring-ui');
const AutocompleteWidget = require('../src/Widgets/AutocompleteWidget').default;

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    formContext: {},
    hideError: false,
    hideLabel: false,
    id: 'root_city',
    label: 'City',
    multiple: false,
    name: 'city',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {
      enumOptions: [
        {
          label: 'New York',
          value: 'new-york',
        },
        {
          label: 'Los Angeles',
          value: 'los-angeles',
        },
      ],
    },
    placeholder: 'Start typing a city...',
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      enum: ['new-york', 'los-angeles'],
      type: 'string',
    },
    uiSchema: {},
    value: '',
    ...overrides,
  };
}

describe('jsonschema-spring-page AutocompleteWidget', () => {
  beforeEach(() => {
    Autocomplete.mockClear();
    Option.mockClear();
    SuggestionListItem.mockClear();
  });

  it('renders Spring UI Autocomplete options with SuggestionListItem', () => {
    const html = renderToStaticMarkup(
      React.createElement(AutocompleteWidget, createWidgetProps()),
    );

    expect(html).toContain('data-component="Autocomplete"');
    expect(html).toContain('data-label="City"');
    expect(html).toContain('data-placeholder="Start typing a city..."');
    expect(html).toContain('data-toggle-button="true"');
    expect(html).toContain('data-variant="tags"');
    expect(html).toContain('data-component="SuggestionListItem"');
    expect(html).toContain('data-highlighted="true"');
    expect(html).toContain('data-component="MenuItemText"');
    expect(html).toContain('data-info="new-york"');
    expect(html).toContain('New York');
    expect(Option).not.toHaveBeenCalled();
  });

  it('uses Spring UI one-argument input and selection callbacks', () => {
    const props = createWidgetProps();

    renderToStaticMarkup(React.createElement(AutocompleteWidget, props));

    const autocompleteProps = Autocomplete.mock.calls[0][0];
    autocompleteProps.onInputChange('Lo');
    expect(props.onChange).toHaveBeenCalledWith('Lo');

    autocompleteProps.onChange([
      {
        id: 'los-angeles',
        label: 'Los Angeles',
        value: 'los-angeles',
      },
    ]);
    expect(props.onChange).toHaveBeenLastCalledWith('los-angeles');
  });

  it('maps multiple selected items to array values', () => {
    const props = createWidgetProps({
      multiple: true,
      value: [],
    });

    renderToStaticMarkup(React.createElement(AutocompleteWidget, props));

    const autocompleteProps = Autocomplete.mock.calls[0][0];
    autocompleteProps.onChange([
      {
        id: 'new-york',
        label: 'New York',
        value: 'new-york',
      },
      {
        id: 'los-angeles',
        label: 'Los Angeles',
        value: 'los-angeles',
      },
    ]);

    expect(props.onChange).toHaveBeenCalledWith(['new-york', 'los-angeles']);
  });
});
