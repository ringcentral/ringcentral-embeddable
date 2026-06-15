const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function mockFormatDate(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function mockFormatTime(value) {
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (typeof value !== 'number') {
    return '';
  }
  const totalMinutes = Math.floor(value / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

jest.mock('@ringcentral/spring-ui', () => {
  const ReactForMock = require('react');
  return {
    Block: ({ children }) =>
      ReactForMock.createElement('div', { 'data-component': 'Block' }, children),
    DatePicker: ({
      disabled,
      error,
      fullWidth,
      helperText,
      id,
      inputProps,
      label,
      required,
      size,
      value,
      variant,
    }) =>
      ReactForMock.createElement('div', {
        'data-aria-describedby': inputProps?.['aria-describedby'],
        'data-aria-label': inputProps?.['aria-label'],
        'data-component': 'DatePicker',
        'data-disabled': disabled ? 'true' : undefined,
        'data-error': error ? 'true' : undefined,
        'data-full-width': fullWidth ? 'true' : undefined,
        'data-helper-text': helperText,
        'data-id': id,
        'data-label': label,
        'data-required': required ? 'true' : undefined,
        'data-size': size,
        'data-value': mockFormatDate(value),
        'data-variant': variant,
      }),
    FormLabel: ({ label }) =>
      ReactForMock.createElement('div', {
        'data-component': 'FormLabel',
        'data-label': label,
      }),
    Text: ({ children }) =>
      ReactForMock.createElement('span', { 'data-component': 'Text' }, children),
    TextField: ({ endAdornment, fullWidth, id, size, value }) =>
      ReactForMock.createElement(
        'div',
        {
          'data-component': 'TextField',
          'data-full-width': fullWidth ? 'true' : undefined,
          'data-id': id,
          'data-size': size,
          'data-value': value,
        },
        endAdornment,
      ),
    TimePicker: ({
      dateMode,
      disabled,
      error,
      fullWidth,
      helperText,
      id,
      inputProps,
      label,
      required,
      size,
      value,
      variant,
    }) =>
      ReactForMock.createElement('div', {
        'data-aria-describedby': inputProps?.['aria-describedby'],
        'data-aria-label': inputProps?.['aria-label'],
        'data-component': 'TimePicker',
        'data-date-mode': dateMode ? 'true' : undefined,
        'data-disabled': disabled ? 'true' : undefined,
        'data-error': error ? 'true' : undefined,
        'data-full-width': fullWidth ? 'true' : undefined,
        'data-helper-text': helperText,
        'data-id': id,
        'data-label': label,
        'data-required': required ? 'true' : undefined,
        'data-size': size,
        'data-value': mockFormatTime(value),
        'data-variant': variant,
      }),
  };
});

jest.mock('@ringcentral/spring-icon', () => {
  const IconMock = () => null;
  IconMock.displayName = 'IconMock';
  return {
    AttachMd: IconMock,
    TrashMd: IconMock,
  };
});

jest.mock('@ringcentral-integration/rjsf-spring', () => ({
  generateWidgets: () => ({}),
}));

const DateWidget = require('../src/Widgets/DateWidget').default;
const DateTimeWidget = require('../src/Widgets/DateTimeWidget').default;
const DurationWidget = require('../src/Widgets/DurationWidget').default;
const TimeWidget = require('../src/Widgets/TimeWidget').default;
const { widgets } = require('../src/Widgets');

function createWidgetProps(overrides = {}) {
  return {
    autofocus: false,
    disabled: false,
    hideLabel: false,
    id: 'root_field',
    label: 'Field',
    name: 'field',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    onFocus: jest.fn(),
    options: {},
    rawErrors: [],
    readonly: false,
    registry: {},
    required: false,
    schema: {
      type: 'string',
    },
    value: undefined,
    ...overrides,
  };
}

describe('jsonschema-spring-page date and time widgets', () => {
  it('renders format date values with Spring UI DatePicker', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DateWidget,
        createWidgetProps({
          id: 'root_meetingDate',
          label: 'Meeting Date',
          rawErrors: ['Required'],
          required: true,
          value: '2026-04-15',
        }),
      ),
    );
    expect(html).toContain('data-component="DatePicker"');
    expect(html).toContain('data-id="root_meetingDate"');
    expect(html).toContain('data-label="Meeting Date"');
    expect(html).toContain('data-value="2026-04-15"');
    expect(html).toContain('data-variant="outlined"');
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-required="true"');
    expect(html).toContain('data-error="true"');
    expect(html).toContain('data-helper-text="Required"');
  });

  it('renders format time values with Spring UI TimePicker', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        TimeWidget,
        createWidgetProps({
          id: 'root_meetingTime',
          label: 'Meeting Time',
          value: '09:30:00',
        }),
      ),
    );
    expect(html).toContain('data-component="TimePicker"');
    expect(html).toContain('data-id="root_meetingTime"');
    expect(html).toContain('data-label="Meeting Time"');
    expect(html).toContain('data-value="09:30"');
    expect(html).toContain('data-variant="outlined"');
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-full-width="true"');
  });

  it('renders format date-time values with Spring UI DatePicker and TimePicker', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DateTimeWidget,
        createWidgetProps({
          id: 'root_meetingStart',
          label: 'Meeting Start',
          options: {
            timeLabel: 'Start Time',
          },
          value: '2026-04-15T09:30:00.000Z',
        }),
      ),
    );
    expect(html).not.toContain('data-component="Block"');
    expect(html).toContain('data-component="DatePicker"');
    expect(html).toContain('data-id="root_meetingStart__date"');
    expect(html).toContain('data-label="Meeting Start"');
    expect(html).toContain('data-variant="outlined"');
    expect(html).toContain('data-component="TimePicker"');
    expect(html).toContain('data-id="root_meetingStart__time"');
    expect(html).not.toContain('data-label="Start Time"');
    expect(html).toContain('data-aria-label="Start Time"');
    expect(html).toContain('data-date-mode="true"');
    expect(html.match(/data-size="large"/g)).toHaveLength(2);
    expect(html).toContain('style="align-items:flex-end;display:flex;flex-wrap:wrap;gap:12px"');
  });

  it('renders duration fields without a bordered Block wrapper and uses FormLabel label text', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        DurationWidget,
        createWidgetProps({
          id: 'root_meetingDuration',
          label: 'Meeting Duration',
          options: {
            minuteStep: 15,
          },
          value: 'PT45M',
        }),
      ),
    );
    expect(html).not.toContain('data-component="Block"');
    expect(html).toContain('data-component="FormLabel"');
    expect(html).toContain('data-label="Meeting Duration"');
    expect(html).toContain('data-component="TextField"');
    expect(html).toContain('data-full-width="true"');
    expect(html).toContain('data-size="large"');
    expect(html).toContain('data-id="root_meetingDuration__hours"');
    expect(html).toContain('data-id="root_meetingDuration__minutes"');
    expect(html).toContain('style="flex:1 1 140px;min-width:0"');
  });

  it('registers Spring UI date and time widgets for RJSF lookup names', () => {
    expect(widgets.DateWidget).toBe(DateWidget);
    expect(widgets.DateTimeWidget).toBe(DateTimeWidget);
    expect(widgets.TimeWidget).toBe(TimeWidget);
    expect(widgets.date).toBe(DateWidget);
    expect(widgets.datetime).toBe(DateTimeWidget);
    expect(widgets['date-time']).toBe(DateTimeWidget);
    expect(widgets.time).toBe(TimeWidget);
  });
});
