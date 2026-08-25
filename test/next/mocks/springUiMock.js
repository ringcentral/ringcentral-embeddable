const React = require('react');

const tabContext = React.createContext(null);

function createContainer(tag = 'div') {
  return function Container({ children, component, ...props }) {
    const Component = component || tag;
    return React.createElement(Component, props, children);
  };
}

function Alert({
  action,
  children,
  classes,
  CloseButtonProps,
  closeText,
  onClose,
  severity,
  ...props
}) {
  return React.createElement(
    'div',
    {
      className: classes?.root,
      role: 'alert',
      'data-severity': severity,
      ...props,
    },
    children,
    action,
    onClose
      ? React.createElement(
          'button',
          {
            type: 'button',
            'aria-label': closeText,
            onClick: onClose,
            'data-variant': CloseButtonProps?.variant,
          },
          closeText,
        )
      : null,
  );
}

function Announcement({ classes, CloseButtonProps, ...props }) {
  return React.createElement(Alert, {
    ...props,
    classes,
    CloseButtonProps: {
      variant: 'inverted',
      ...CloseButtonProps,
    },
    'data-icon-hidden': classes?.icon === 'hidden',
    'data-spring-component': 'Announcement',
  });
}

function Avatar({ alt, children, src }) {
  return React.createElement(
    'span',
    { 'aria-label': alt, 'data-src': src || '' },
    children,
  );
}

function Badge({ children, color, type }) {
  return React.createElement(
    'span',
    {
      'data-badge-color': color,
      'data-badge-type': type,
    },
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
  { iconSize, TooltipProps, symbol, ...props },
  ref,
) {
  return React.createElement('button', {
    ref,
    type: 'button',
    'aria-label': TooltipProps?.title,
    'data-icon-size': iconSize,
    'data-symbol': symbol,
    ...props,
  });
});

function Link({ children, ...props }) {
  return React.createElement('a', props, children);
}

function ListItem({ children, classes, divider, hoverable, size, ...props }) {
  return React.createElement(
    'li',
    {
      className: classes?.root,
      'data-divider': Boolean(divider),
      'data-hoverable': Boolean(hoverable),
      'data-size': size,
      ...props,
    },
    React.createElement(
      'div',
      {
        className: classes?.content,
        'data-list-item-content': true,
      },
      children,
    ),
  );
}

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

function Tag({ children, ...props }) {
  return React.createElement('span', { 'data-tag': true, ...props }, children);
}

function ListItemText({ classes = {}, primary, secondary }) {
  return React.createElement(
    'span',
    { className: [classes.root, classes.primary].filter(Boolean).join(' ') },
    React.createElement(
      'span',
      { className: classes['primary-text'] },
      primary,
    ),
    secondary
      ? React.createElement(
          'span',
          { className: classes['secondary-text'] },
          secondary,
        )
      : null,
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
    tabContext.Provider,
    { value },
    React.createElement('button', {
      type: 'button',
      'aria-label': 'Change test tab',
      onClick: () => onChange?.(null, 'test-tab'),
    }),
    React.createElement('div', { 'data-tab-value': value }, children),
  );
}

function TabPanel({ children, keepMounted, ...props }) {
  const currentValue = React.useContext(tabContext);
  const selected = currentValue === null || currentValue === props.value;
  const [everShown, setEverShown] = React.useState(selected);
  React.useEffect(() => {
    if (selected) {
      setEverShown(true);
    }
  }, [selected]);
  if (!selected && (!keepMounted || !everShown)) {
    return null;
  }
  return React.createElement(
    'div',
    {
      'data-keep-mounted': Boolean(keepMounted),
      hidden: !selected,
      ...props,
    },
    children,
  );
}

function Text({ children, component, noWrap, titleWhenOverflow, ...props }) {
  const Component = component || 'span';
  return React.createElement(
    Component,
    {
      'data-no-wrap': Boolean(noWrap),
      'data-title-when-overflow': titleWhenOverflow,
      ...props,
    },
    children,
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
  Announcement,
  Avatar,
  Badge,
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
  Link,
  List: createContainer('ul'),
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  MenuItemText,
  MenuList: createContainer('ul'),
  PageHeader: createContainer('header'),
  PageHeaderCenter: createContainer(),
  PageHeaderLeft: createContainer(),
  PageHeaderRight: createContainer(),
  PageHeaderTitle: createContainer('h1'),
  Slider,
  Tab,
  TabContext,
  TabPanel,
  Tabs: createContainer(),
  Tag,
  Text,
  TextField,
};
