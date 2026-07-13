/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import ActiveCallKeyPad from '../../src/components/CallCtrlPanel/ActiveKeyPad';
import DialerPanel from '../../src/components/DialerPanel';
import ForwardForm from '../../src/components/ForwardForm';
import LogCallPanel from '../../src/components/LogCallPanel';
import TransferPanel from '../../src/components/TransferPanel';
import { WidgetAppsPanel } from '../../src/components/WidgetAppsPanel';

jest.mock('@ringcentral-integration/commons/utils', () => ({
  sleep: jest.fn(async () => {}),
}));

jest.mock('@ringcentral-integration/widgets/components/ForwardForm/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/TransferPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    Askfirst: createIcon('Askfirst'),
    Close: createIcon('Close'),
    Phone: createIcon('Phone'),
    TransferCall: createIcon('TransferCall'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'autoSize',
        'clearBtn',
        'component',
        'fullScreen',
        'icon',
        'inputRef',
        'selected',
        'sounds',
        'symbol',
        'variant',
      ].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag, testId) => React.forwardRef((props, ref) => (
    React.createElement(tag, {
      ...cleanProps(props),
      ref,
      'data-sign': props['data-sign'] || testId,
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div', 'styled-div');
  styled.img = () => createComponent('img', 'styled-img');
  return {
    RcAlert: createComponent('div', 'alert'),
    RcButton: React.forwardRef((props, ref) => (
      <button
        {...cleanProps(props)}
        ref={ref}
        data-sign={props['data-sign']}
        data-testid={props['data-testid'] || props['data-sign']}
        disabled={props.disabled}
        type="button"
        onClick={props.onClick}
      >
        {props.children}
      </button>
    )),
    RcDialog: ({ children, open }) => (open ? <div role="dialog">{children}</div> : null),
    RcDialogActions: createComponent('div', 'dialog-actions'),
    RcDialogContent: createComponent('div', 'dialog-content'),
    RcDialogTitle: createComponent('h2', 'dialog-title'),
    RcDialerPadSoundsMPEG: {
      1: 'tone-1.mp3',
      2: 'tone-2.mp3',
      3: 'tone-3.mp3',
    },
    RcDialPad: ({ onChange, getDialPadButtonProps }) => (
      <div data-sign="dial-pad" data-testid="dial-pad">
        {['1', '2', '3'].map((key) => {
          const buttonProps = getDialPadButtonProps ? getDialPadButtonProps(key) : {};
          return (
            <button
              key={key}
              data-sign={buttonProps['data-sign'] || `dial-${key}`}
              data-testid={buttonProps['data-test-id'] || buttonProps['data-sign'] || `dial-${key}`}
              type="button"
              onClick={() => onChange(key)}
            >
              {key}
            </button>
          );
        })}
      </div>
    ),
    RcIconButton: ({ onClick }) => (
      <button data-sign="callButton" type="button" onClick={onClick}>
        close
      </button>
    ),
    RcList: createComponent('div', 'list'),
    RcListItem: ({ children, onClick, selected, ...props }) => (
      <button
        {...cleanProps(props)}
        data-selected={selected ? 'true' : 'false'}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    ),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcTab: ({ icon, label, onClick }) => (
      <button type="button" onClick={onClick}>
        {icon}
        <span>{label}</span>
      </button>
    ),
    RcTextField: React.forwardRef((props, ref) => (
      <input
        {...cleanProps(props)}
        ref={ref}
        data-sign={props['data-sign']}
        data-testid={props['data-testid'] || props['data-sign']}
        value={props.value}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        onPaste={props.onPaste}
      />
    )),
    RcTypography: createComponent('span', 'typography'),
    RcResponsive: ({ children }) => <>{children}</>,
    css: jest.fn(() => ''),
    flexCenterStyle: '',
    palette2: jest.fn(() => '#000'),
    spacing: jest.fn(() => '0'),
    setOpacity: jest.fn(() => '#000'),
    styled,
    useAudio: jest.fn(() => ({
      currentTime: 0,
      pause: jest.fn(async () => {}),
      paused: true,
      play: jest.fn(async () => {}),
      src: '',
    })),
    useResponsiveMatch: jest.fn(() => ({
      gtSM: false,
      gtXS: false,
      ltMD: false,
      ltSM: false,
    })),
  };
});

jest.mock('../../src/components/CustomizedPanel', () => ({
  CustomizedPanel: ({
    formData,
    infoNode,
    onBackButtonClick,
    onButtonClick,
    onClose,
    onFormDataChange,
    onSave,
    pageId,
    schema: mockSchema,
    title,
  }) => (
    <section>
      <h1>{title}</h1>
      {infoNode}
      <span data-testid="log-contact">{formData.contactId}</span>
      <span>{formData.note}</span>
      <span data-testid="log-schema">{Object.keys(mockSchema.properties || {}).join(',')}</span>
      <button type="button" onClick={onBackButtonClick}>back</button>
      <button type="button" onClick={() => onButtonClick('page-button')}>page-button</button>
      <button
        type="button"
        onClick={() => onFormDataChange(pageId, { contactId: 'contact-1', note: 'changed' }, ['note'])}
      >
        change-form
      </button>
      <button
        type="button"
        onClick={() => onSave(pageId, { contactId: 'contact-1', note: 'saved note' })}
      >
        save-log
      </button>
      <button type="button" onClick={onClose}>close</button>
    </section>
  ),
}));

jest.mock('../../src/components/LogCallPanel/CallInfo', () => ({
  CallInfo: ({ call, formatPhone }) => (
    <div data-testid="call-info">
      {formatPhone(call.to.phoneNumber)}
    </div>
  ),
}));

jest.mock('../../src/components/RecipientsInput', () => {
  const React = require('react');
  return function MockRecipientsInput({
    addToRecipients,
    inputRef,
    onChange,
    onClean,
    removeFromRecipients,
    value,
    $hidden,
  }) {
    React.useEffect(() => {
      if (inputRef) {
        inputRef({ focus: jest.fn() });
      }
    }, [inputRef]);
    return (
      <div data-hidden={$hidden ? 'true' : 'false'} data-testid="recipients-input">
        <input
          data-sign="forward-recipient-value"
          data-testid="forward-recipient-value"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" onClick={() => addToRecipients({ phoneNumber: '+16505550999' })}>
          add-forward-recipient
        </button>
        <button type="button" onClick={removeFromRecipients}>remove-forward-recipient</button>
        <button type="button" onClick={onClean}>clean-forward-recipient</button>
      </div>
    );
  };
});

jest.mock('../../src/components/DialerPanel/StyledRecipientsInput', () => ({
  StyledRecipientsInput: function MockStyledRecipientsInput({
    addToRecipients,
    onChange,
    onClean,
    removeFromRecipients,
    value,
  }) {
    return (
      <div data-testid="transfer-recipient-input">
        <input
          data-sign="transfer-recipient-value"
          data-testid="transfer-recipient-value"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" onClick={() => addToRecipients({ phoneNumber: '+16505550777' })}>
          add-transfer-recipient
        </button>
        <button type="button" onClick={removeFromRecipients}>remove-transfer-recipient</button>
        <button type="button" onClick={onClean}>clean-transfer-recipient</button>
      </div>
    );
  },
}));

jest.mock('../../src/components/DialerPanel/FromField', () => ({
  __esModule: true,
  default: ({
    disabled,
    fromNumber,
    hidden,
    onChange,
  }) => (
    <button disabled={disabled} type="button" onClick={() => onChange('from-changed')}>
      {`from:${String(hidden)}:${fromNumber || 'empty'}`}
    </button>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <span data-sign="spinner">spinner</span>,
}));

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({ children, onBack, title }) => (
    <section>
      <h1>{title}</h1>
      <button type="button" onClick={onBack}>back-transfer</button>
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/TransferPanel/CallButton', () => ({
  CallButton: ({ dataSign, disabled, onClick, title }) => (
    <button
      data-sign={dataSign}
      data-testid={dataSign}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {title}
    </button>
  ),
}));

jest.mock('../../src/components/WidgetAppsPanel/WidgetAppPanel', () => ({
  WidgetAppPanel: ({
    app,
    contact,
    isPinned,
    onBack,
    onClose,
    onLoadApp,
    onPinChanged,
    showBack,
    showCloseButton,
  }) => (
    <section>
      <h1>{app.name}</h1>
      <span>{contact?.id}</span>
      <span>{isPinned ? 'pinned' : 'unpinned'}</span>
      <button type="button" onClick={() => onLoadApp(app)}>load-app</button>
      {showBack ? <button type="button" onClick={onBack}>back-apps</button> : null}
      <button type="button" onClick={onPinChanged}>pin-app</button>
      {showCloseButton ? <button type="button" onClick={onClose}>close-app</button> : null}
    </section>
  ),
}));

function createCall(overrides = {}) {
  return {
    activityMatches: [],
    direction: callDirections.inbound,
    fromMatches: [{
      description: 'CRM contact',
      id: 'contact-1',
      name: 'Customer One',
    }],
    id: 'call-1',
    to: {
      phoneNumber: '+16505550123',
    },
    toMatches: [],
    ...overrides,
  };
}

describe('interaction components', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('renders dialer panel with default optional props and shortcuts', () => {
    const onCallButtonClick = jest.fn();
    const { rerender } = render(
      <DialerPanel
        currentLocale="en-US"
        onCallButtonClick={onCallButtonClick}
        searchContact={jest.fn()}
        searchContactList={[]}
        clearToNumber={jest.fn()}
        setRecipient={jest.fn()}
        clearRecipient={jest.fn()}
      />,
    );

    expect(screen.getByText('from:true:empty')).toBeTruthy();
    fireEvent.click(screen.getByText('1'));
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.click(document.querySelector('[data-sign="callButton"]'));
    expect(onCallButtonClick).toHaveBeenCalledWith({ clickDialerToCall: true });

    rerender(
      <DialerPanel
        callButtonDisabled
        currentLocale="en-US"
        fromNumber="+16505550100"
        onCallButtonClick={onCallButtonClick}
        searchContact={jest.fn()}
        searchContactList={[]}
        clearToNumber={jest.fn()}
        setRecipient={jest.fn()}
        clearRecipient={jest.fn()}
        showFromField={false}
        showSpinner
        toNumber="123"
      >
        <span>dialer-child</span>
      </DialerPanel>,
    );
    expect(screen.queryByText(/from:/)).toBeNull();
    expect(screen.getByText('spinner')).toBeTruthy();
    expect(screen.getByText('dialer-child')).toBeTruthy();
  });

  it('loads, edits, and saves log call panel defaults and customized fields', async () => {
    const props = {
      currentLocale: 'en-US',
      currentCall: null,
      dateTimeFormatter: jest.fn(),
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      isLogging: false,
      onBackButtonClick: jest.fn(),
      onClose: jest.fn(),
      onCustomizedFieldChange: jest.fn(),
      onFormPageButtonClick: jest.fn(),
      onLoadData: jest.fn(),
      onSave: jest.fn(),
      onViewCall: jest.fn(),
      sessionId: 'session-1',
    };

    const { rerender } = render(<LogCallPanel {...props} />);
    const getLogContact = () => document.querySelector('[data-testid="log-contact"]');
    const getLogSchema = () => document.querySelector('[data-testid="log-schema"]');
    expect(screen.queryByText('Log call')).toBeNull();

    rerender(<LogCallPanel {...props} currentCall={createCall()} smartNote="AI note" />);
    await waitFor(() => {
      expect(props.onViewCall).toHaveBeenCalledWith('session-1');
      expect(props.onLoadData).toHaveBeenCalledWith(expect.objectContaining({ id: 'call-1' }));
    });
    expect(screen.getByText('Log call')).toBeTruthy();
    expect(screen.getByText('formatted-+16505550123')).toBeTruthy();
    fireEvent.click(screen.getByText('change-form'));
    expect(props.onCustomizedFieldChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'call-1' }),
      { contactId: 'contact-1', note: 'changed' },
      ['note'],
    );
    fireEvent.click(screen.getByText('save-log'));
    expect(props.onSave).toHaveBeenCalledWith({
      call: expect.objectContaining({ id: 'call-1' }),
      formData: { contactId: 'contact-1', note: 'saved note' },
      note: 'saved note',
    });
    fireEvent.click(screen.getByText('page-button'));
    fireEvent.click(screen.getByText('back'));
    fireEvent.click(screen.getByText('close'));
    expect(props.onFormPageButtonClick).toHaveBeenCalledWith('page-button');
    expect(props.onBackButtonClick).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();

    rerender(<LogCallPanel
      {...props}
      currentCall={createCall({
        activityMatches: [{
          contact: { id: 'contact-2' },
          note: 'Logged note',
        }],
        id: 'call-2',
      })}
      customizedPage={{
        formData: { note: 'custom note' },
        id: 'custom-page',
        schema: { type: 'object', properties: { custom: { type: 'string' } } },
        title: 'Custom log',
        uiSchema: {},
      }}
    />);
    expect(screen.getByText('Custom log')).toBeTruthy();
    expect(screen.getByText('custom note')).toBeTruthy();

    rerender(
      <LogCallPanel
        {...props}
        currentCall={createCall({
          activityMatches: [{
            contactId: 'activity-contact',
            note: 'Outbound note',
          }],
          direction: callDirections.outbound,
          fromMatches: [],
          id: 'call-3',
          toMatches: [{
            description: 'Outbound CRM contact',
            id: 'to-contact',
            name: 'Outbound Customer',
          }],
        })}
      />,
    );
    expect(screen.getByText('Edit log')).toBeTruthy();
    expect(screen.getByText('Outbound note')).toBeTruthy();
    expect(getLogContact().textContent).toBe('to-contact');
    expect(getLogSchema().textContent).toBe('contactId,note');

    rerender(
      <LogCallPanel
        {...props}
        currentCall={createCall({
          activityMatches: [{
            contact: 'fallback-contact',
            note: '',
          }],
          direction: callDirections.outbound,
          fromMatches: [],
          id: 'call-3',
          toMatches: [{
            id: 'to-contact',
            name: 'Outbound Customer',
          }],
        })}
      />,
    );
    expect(getLogContact().textContent).toBe('fallback-contact');

    rerender(
      <LogCallPanel
        {...props}
        currentCall={createCall({
          direction: callDirections.outbound,
          fromMatches: null,
          id: 'call-4',
          toMatches: [],
        })}
      />,
    );
    expect(screen.getByText('Log call')).toBeTruthy();
    expect(getLogContact().textContent).toBe('');
    expect(getLogSchema().textContent).toBe('note');

    rerender(
      <LogCallPanel
        {...props}
        currentCall={createCall({
          activityMatches: [],
          id: 'call-5',
        })}
        customizedPage={{
          id: 'minimal-custom-page',
          schema: { type: 'object', properties: { custom: { type: 'string' } } },
        }}
      />,
    );
    expect(screen.getByText('Log call')).toBeTruthy();
    expect(getLogContact().textContent).toBe('');
    expect(getLogSchema().textContent).toBe('custom');
  });

  it('selects forwarding targets, forwards custom recipients, and closes after success', async () => {
    const props = {
      currentLocale: 'en-US',
      formatPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
      forwardingNumbers: [{
        id: 'forward-1',
        label: 'Mobile',
        phoneNumber: '+16505550111',
      }],
      onCancel: jest.fn(),
      onForward: jest.fn(async () => true),
      open: true,
      searchContact: jest.fn(),
      searchContactList: [],
    };
    render(<ForwardForm {...props} />);

    expect(screen.getByText('Forward to')).toBeTruthy();
    expect(screen.getByText('formatted-+16505550111')).toBeTruthy();
    fireEvent.click(screen.getByTestId('forwardCall'));
    await waitFor(() => {
      expect(props.onForward).toHaveBeenCalledWith('+16505550111', null);
      expect(props.onCancel).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('customNumber'));
    fireEvent.change(screen.getByTestId('forward-recipient-value'), {
      target: { value: '+16505550222' },
    });
    fireEvent.click(screen.getByTestId('forwardCall'));
    await waitFor(() => {
      expect(props.onForward).toHaveBeenCalledWith('+16505550222', null);
    });

    fireEvent.click(screen.getByText('add-forward-recipient'));
    fireEvent.click(screen.getByTestId('forwardCall'));
    await waitFor(() => {
      expect(props.onForward).toHaveBeenCalledWith(
        '+16505550999',
        { phoneNumber: '+16505550999' },
      );
    });
    fireEvent.click(screen.getByText('remove-forward-recipient'));
    fireEvent.click(screen.getByText('clean-forward-recipient'));
    fireEvent.click(screen.getByTestId('cancel'));
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('dials transfer digits, sends blind and warm transfers, and handles call end', async () => {
    const props = {
      currentLocale: 'en-US',
      formatPhone: jest.fn((phoneNumber) => phoneNumber),
      onBack: jest.fn(),
      onCallEnd: jest.fn(),
      onTransfer: jest.fn(),
      onWarmTransfer: jest.fn(),
      searchContact: jest.fn(),
      session: { id: 'session-1', isOnTransfer: false },
      sessionId: 'session-1',
      setActiveSessionId: jest.fn(),
      enableWarmTransfer: true,
    };
    const { rerender } = render(<TransferPanel {...props}>child-content</TransferPanel>);

    await waitFor(() => {
      expect(props.setActiveSessionId).toHaveBeenCalledWith('session-1');
    });
    fireEvent.click(screen.getByText('1'));
    await waitFor(() => {
      expect(props.onTransfer).toHaveBeenCalledTimes(0);
    });
    fireEvent.click(screen.getByTestId('transferBtn'));
    expect(props.onTransfer).toHaveBeenCalledWith('1', 'session-1');
    fireEvent.click(screen.getByTestId('warnTransferBtn'));
    expect(props.onWarmTransfer).toHaveBeenCalledWith('1', 'session-1');

    fireEvent.click(screen.getByText('add-transfer-recipient'));
    fireEvent.click(screen.getByTestId('transferBtn'));
    expect(props.onTransfer).toHaveBeenLastCalledWith('+16505550777', 'session-1');
    fireEvent.click(screen.getByText('back-transfer'));
    expect(props.onBack).toHaveBeenCalled();
    expect(screen.getByText('child-content')).toBeTruthy();

    rerender(<TransferPanel {...props} session={null} />);
    expect(props.onCallEnd).toHaveBeenCalled();
  });

  it('opens widget apps, pinned tabs, pin actions, back, close, and empty state', () => {
    const apps = [{
      iconUri: 'https://example.com/crm.png',
      id: 'crm',
      name: 'CRM',
    }, {
      iconUri: 'https://example.com/helpdesk.png',
      id: 'helpdesk',
      name: 'Helpdesk',
    }];
    const props = {
      appId: null,
      apps,
      contact: { id: 'contact-1', type: 'crm' },
      onClose: jest.fn(),
      onLoadApp: jest.fn(),
      openAppTab: jest.fn(),
      pinAppIds: ['crm'],
      showCloseButton: true,
      toggleAppPin: jest.fn(),
    };
    const { rerender } = render(<WidgetAppsPanel {...props} />);

    fireEvent.click(screen.getByText('CRM'));
    expect(props.openAppTab).toHaveBeenCalledWith(apps[0], props.contact);
    fireEvent.click(screen.getByText('Helpdesk'));
    expect(screen.getByText('Helpdesk')).toBeTruthy();
    fireEvent.click(screen.getByText('load-app'));
    expect(props.onLoadApp).toHaveBeenCalledWith(apps[1]);
    fireEvent.click(screen.getByText('pin-app'));
    expect(props.toggleAppPin).toHaveBeenCalledWith('helpdesk');
    expect(props.openAppTab).toHaveBeenLastCalledWith(apps[1], props.contact);
    fireEvent.click(screen.getByText('back-apps'));
    expect(screen.getByText('Available apps')).toBeTruthy();

    rerender(<WidgetAppsPanel {...props} appId="crm" />);
    expect(screen.getByText('CRM')).toBeTruthy();
    fireEvent.click(screen.getByText('close-app'));
    expect(props.onClose).toHaveBeenCalled();

    rerender(<WidgetAppsPanel {...props} appId={null} apps={[]} contact={{ id: 'contact-2' }} />);
    expect(screen.getByText('No available apps')).toBeTruthy();
  });

  it('filters active-call keypad input, dialpad, keydown, and paste values', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const onChange = jest.fn();
    render(<ActiveCallKeyPad onChange={onChange} />);

    fireEvent.change(screen.getByTestId('input'), {
      target: { value: 'abc12#' },
    });
    expect(screen.getByTestId('input').value).toBe('12#');

    fireEvent.keyDown(screen.getByTestId('input'), {
      key: '*',
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('*');
    });
    fireEvent.click(screen.getByTestId('dial-1'));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('1');
    });

    fireEvent.paste(screen.getByTestId('input'), {
      clipboardData: {
        items: [{
          getAsString: (callback) => callback('<b>12345678901234567890</b>'),
        }],
      },
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('123456789012345');
    });
    expect(console.log).toHaveBeenCalledWith('123456789012345');
  });
});
