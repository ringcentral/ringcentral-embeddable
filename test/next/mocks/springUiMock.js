const React = require('react');

function createContainer(tag = 'div') {
  return function Container({ children, component, ...props }) {
    const Component = component || tag;
    return React.createElement(Component, props, children);
  };
}

function Alert({ children, severity, ...props }) {
  return React.createElement(
    'div',
    { role: 'alert', 'data-severity': severity, ...props },
    children,
  );
}

function Avatar({ alt, children, src }) {
  return React.createElement(
    'span',
    { 'aria-label': alt, 'data-src': src || '' },
    children,
  );
}

function Button({
  children,
  focusableWhenDisabled,
  fullWidth,
  loading,
  startIcon,
  symbol,
  TooltipProps,
  ...props
}) {
  return React.createElement(
    'button',
    {
      type: 'button',
      'data-focusable-when-disabled': Boolean(focusableWhenDisabled),
      'data-full-width': Boolean(fullWidth),
      'data-loading': Boolean(loading),
      'data-start-icon': startIcon,
      'data-symbol': symbol,
      title: TooltipProps?.title,
      ...props,
    },
    children,
  );
}

function CircularProgressIndicator({ progressBarProps, ...props }) {
  return React.createElement('div', {
    role: 'progressbar',
    ...progressBarProps,
    ...props,
  });
}

function Dialog({ children, open, ...props }) {
  return open
    ? React.createElement('div', { role: 'dialog', ...props }, children)
    : null;
}

function EmptyState({ description, title }) {
  return React.createElement(
    'div',
    null,
    React.createElement('span', null, title),
    description ? React.createElement('span', null, description) : null,
  );
}

function Icon({ symbol, ...props }) {
  return React.createElement('span', { 'data-symbol': symbol, ...props });
}

const IconButton = React.forwardRef(function IconButton(
  { TooltipProps, symbol, ...props },
  ref,
) {
  return React.createElement('button', {
    ref,
    type: 'button',
    'aria-label': TooltipProps?.title,
    'data-symbol': symbol,
    ...props,
  });
});

function Menu({ anchorEl, children, open, ...props }) {
  return open || anchorEl
    ? React.createElement('div', { role: 'menu', ...props }, children)
    : null;
}

function MenuItem({ children, ...props }) {
  return React.createElement(
    'button',
    { type: 'button', role: 'menuitem', ...props },
    children,
  );
}

function MenuItemText({ primary }) {
  return React.createElement('span', null, primary);
}

function ListItemText({ primary, secondary }) {
  return React.createElement(
    'span',
    null,
    React.createElement('span', null, primary),
    secondary ? React.createElement('span', null, secondary) : null,
  );
}

function Slider({
  getAriaValueText,
  marks,
  onChange,
  onChangeCommitted,
  value,
  valueLabelDisplay,
  valueLabelFormat,
  ...props
}) {
  return React.createElement('input', {
    type: 'range',
    value,
    onChange: (event) => onChange?.(event, Number(event.target.value)),
    onMouseUp: (event) =>
      onChangeCommitted?.(event, Number(event.currentTarget.value)),
    ...props,
  });
}

function Tab({ label, value, ...props }) {
  return React.createElement(
    'button',
    { type: 'button', 'data-value': value, ...props },
    label,
  );
}

function TabContext({ children, onChange, value }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('button', {
      type: 'button',
      'aria-label': 'Change test tab',
      onClick: () => onChange?.(null, 'test-tab'),
    }),
    React.createElement('div', { 'data-tab-value': value }, children),
  );
}

function TextField({
  className,
  clearBtn,
  error,
  fullWidth,
  helperText,
  inputProps,
  label,
  onChange,
  value,
  ...props
}) {
  return React.createElement(
    'label',
    { className },
    label,
    React.createElement('input', {
      value: value ?? '',
      onChange,
      'aria-invalid': Boolean(error),
      'data-clear-button': Boolean(clearBtn),
      'data-full-width': Boolean(fullWidth),
      ...inputProps,
      ...props,
    }),
    helperText ? React.createElement('span', null, helperText) : null,
  );
}

module.exports = {
  Alert,
  Avatar,
  Button,
  CircularProgressIndicator,
  Dialog,
  DialogActions: createContainer(),
  DialogContent: createContainer(),
  DialogTitle: createContainer('h2'),
  EmptyState,
  FormLabel: createContainer('label'),
  Icon,
  IconButton,
  List: createContainer('ul'),
  ListItem: createContainer('li'),
  ListItemText,
  Menu,
  MenuItem,
  MenuItemText,
  PageHeader: createContainer('header'),
  PageHeaderLeft: createContainer(),
  PageHeaderRight: createContainer(),
  PageHeaderTitle: createContainer('h1'),
  Slider,
  Tab,
  TabContext,
  TabPanel: createContainer(),
  Tabs: createContainer(),
  Text: createContainer('span'),
  TextField,
};
