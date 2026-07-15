/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

jest.mock('@ringcentral-integration/widgets/components/ConversationList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/FromField/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/BackHeader', () => (
  function MockBackHeader({
    children,
    onBackClick,
  }) {
    return (
      <header>
        <button type="button" onClick={onBackClick}>env-back</button>
        <span>{children}</span>
      </header>
    );
  }
));

jest.mock('@ringcentral-integration/widgets/components/Button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }) => (
    <button disabled={disabled} type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/IconLine', () => (
  function MockIconLine({
    children,
    icon,
  }) {
    return (
      <label>
        {icon}
        <span>{children}</span>
      </label>
    );
  }
));

jest.mock('@ringcentral-integration/widgets/components/Line', () => (
  function MockLine({
    children,
  }) {
    return <div>{children}</div>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/Panel', () => (
  function MockPanel({
    children,
  }) {
    return <section>{children}</section>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/Switch', () => (
  function MockSwitch({
    checked,
    onChange,
  }) {
    return (
      <button type="button" onClick={onChange}>
        {`env-switch:${String(checked)}`}
      </button>
    );
  }
));

jest.mock('@ringcentral-integration/widgets/components/TextInput', () => (
  function MockTextInput({
    disabled,
    onChange,
    placeholder,
    value = '',
  }) {
    return (
      <input
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.({
          currentTarget: {
            value: event.target.value,
          },
        })}
      />
    );
  }
));

jest.mock('@ringcentral-integration/widgets/components/ContactDisplay/displayFormatter', () => ({
  displayFormatter: jest.fn(({
    entityName,
    entityType,
    phoneNumber,
  }) => [entityName, entityType, phoneNumber].filter(Boolean).join('|')),
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDropdownList/ContactInfo', () => ({
  ContactInfo: ({
    name,
    phoneNumber,
  }) => <span>{`info:${name}:${phoneNumber}`}</span>,
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDropdownList/ContactPhone', () => ({
  ContactPhone: ({
    phoneNumber,
  }) => <span>{`phone:${phoneNumber}`}</span>,
}));

jest.mock('@ringcentral-integration/widgets/components/ContactDropdownList/DoNotCallIndicator', () => ({
  DoNotCallIndicator: ({
    doNotCall,
  }) => (doNotCall ? <span>do-not-call</span> : null),
}));

jest.mock('@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper', () => ({
  getPresenceStatus: jest.fn((presence) => `presence:${presence}`),
}));

jest.mock('../../src/components/SettingsPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/SearchAndFilter/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('../../src/components/DialerPanel/FromField/helper', () => ({
  getPhoneNumberLabel: jest.fn((number) => number.label || number.phoneNumber),
}));

jest.mock('../../src/components/SearchLine', () => ({
  SearchLine: ({
    disableLinks,
    onSearchInputChange,
    placeholder,
    searchInput,
  }) => (
    <input
      data-disabled-links={disableLinks ? 'true' : 'false'}
      placeholder={placeholder}
      value={searchInput}
      onChange={onSearchInputChange}
    />
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/EnvironmentPanel/styles.scss', () => ({
  disabled: 'disabled',
  root: 'root',
  saveButton: 'saveButton',
}));

jest.mock('@ringcentral-integration/jsonschema-page', () => ({
  TextWithMarkdown: ({
    text,
  }) => <span>{`markdown:${text}`}</span>,
}));

jest.mock('../../src/components/ConversationItem', () => ({
  ConversationItem: ({
    conversation,
    disableCallButton,
    disableLinks,
    logButtonTitle,
    showLogButton,
    threadBusy,
  }) => (
    <button data-sign="conversation-item" type="button">
      {[
        conversation.conversationId,
        disableCallButton ? 'no-call' : 'call',
        disableLinks ? 'no-link' : 'link',
        showLogButton ? logButtonTitle : 'no-log',
        threadBusy ? 'busy' : 'idle',
      ].join(':')}
    </button>
  ),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    ArrowDown2: createIcon('ArrowDown2'),
    ArrowRight: createIcon('ArrowRight'),
    ArrowUp2: createIcon('ArrowUp2'),
    BubbleLinesBorder: createIcon('BubbleLinesBorder'),
    InboundFaxBorder: createIcon('InboundFaxBorder'),
    GroupDefault: createIcon('GroupDefault'),
    Lock: createIcon('Lock'),
    Logout: createIcon('Logout'),
    OutboundFaxBorder: createIcon('OutboundFaxBorder'),
    Refresh: createIcon('Refresh'),
    SmsBorder: createIcon('SmsBorder'),
    UserDefault: createIcon('UserDefault'),
    VoicemailBorder: createIcon('VoicemailBorder'),
  };
});

function mockCreateJuno() {
  const React = require('react');
  const blockedProps = new Set([
    'canHover',
    'color',
    'disableRipple',
    'disableTouchRipple',
    'formControlLabelProps',
    'innerRef',
    'labelPlacement',
    'presenceProps',
    'radius',
    'readOnly',
    'renderValue',
    'selected',
    'size',
    'symbol',
    'variant',
  ]);
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (key !== 'children' && !key.startsWith('$') && !blockedProps.has(key)) {
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
  const styled = (Component) => () => React.forwardRef((props, ref) => {
    if (typeof Component === 'string') {
      return React.createElement(Component, {
        ...cleanProps(props),
        ref,
        'data-sign': props['data-sign'] || `styled-${Component}`,
        'data-testid': props['data-testid'] || props['data-sign'] || `styled-${Component}`,
      }, props.children);
    }
    return <Component {...props} ref={ref}>{props.children}</Component>;
  });
  styled.div = () => createComponent('div', 'styled-div');
  styled.label = () => createComponent('label', 'styled-label');
  styled.span = () => createComponent('span', 'styled-span');
  const RcButton = ({
    children,
    onClick,
    ...props
  }) => (
    <button
      data-sign={props['data-sign'] || String(children)}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
  const RcIconButton = ({
    innerRef,
    onClick,
    title,
    symbol,
    ...props
  }) => (
    <button
      data-sign={props['data-sign'] || title || symbol?.name || 'icon-button'}
      ref={innerRef}
      type="button"
      onClick={onClick}
    >
      {title || symbol?.name || 'icon-button'}
    </button>
  );
  const RcListItem = ({
    children,
    onClick,
    onMouseOver,
    ...props
  }) => (
    <button
      {...cleanProps(props)}
      type="button"
      onClick={onClick}
      onMouseOver={onMouseOver}
    >
      {children}
    </button>
  );
  const RcListItemText = ({
    primary,
    secondary,
  }) => (
    <span>
      <span>{primary}</span>
      <span>{secondary}</span>
    </span>
  );
  const RcSelect = ({
    children,
    disabled,
    onChange,
    renderValue,
    value,
    ...props
  }) => (
    <span data-sign={props['data-sign'] || 'select'}>
      <button
        disabled={disabled}
        type="button"
        onClick={() => onChange?.({
          target: {
            value: props['data-next-value'] || 'changed',
          },
        })}
      >
        {`select:${value || 'empty'}`}
      </button>
      {renderValue ? renderValue(value) : null}
      {children}
    </span>
  );
  const RcSwitch = ({
    checked,
    disabled,
    label,
    onChange,
  }) => (
    <button
      disabled={disabled}
      type="button"
      onClick={() => onChange?.(null, !checked)}
    >
      {`switch:${label || ''}:${String(checked)}`}
    </button>
  );
  const Virtuoso = React.forwardRef(({
    components = {},
    context,
    data = [],
    endReached,
    itemContent,
    totalCount,
  }, ref) => {
    const scrollToIndex = jest.fn();
    React.useImperativeHandle(ref, () => ({ scrollToIndex }));
    global.__conversationListScrollToIndex = scrollToIndex;
    const Footer = components.Footer;
    return (
      <section data-total={totalCount} data-sign="virtuoso">
        {data.map((item, index) => (
          <React.Fragment key={item.conversationId}>
            {itemContent(index, item)}
          </React.Fragment>
        ))}
        {Footer ? <Footer context={context} /> : null}
        <button type="button" onClick={endReached}>end-reached</button>
      </section>
    );
  });
  return {
    RcAvatar: ({
      children,
      iconSymbol,
      src,
    }) => (
      <span
        data-icon={iconSymbol?.name || ''}
        data-sign="avatar"
        data-src={src || ''}
      >
        {children}
      </span>
    ),
    RcButton,
    RcChip: ({
      label,
      onClick,
    }) => <button type="button" onClick={onClick}>{label}</button>,
    RcIcon: () => <span data-sign="icon">icon</span>,
    RcIconButton,
    RcLink: createComponent('a', 'link'),
    RcListItem,
    RcListItemAvatar: createComponent('span', 'list-item-avatar'),
    RcListItemSecondaryAction: createComponent('span', 'list-item-secondary-action'),
    RcListItemText,
    RcMenu: ({
      children,
      onClose,
      open,
    }) => (open ? (
      <section data-sign="menu">
        <button type="button" onClick={onClose}>close-menu</button>
        {children}
      </section>
    ) : null),
    RcMenuItem: ({
      children,
      onClick,
      value,
    }) => (
      <button data-value={value} type="button" onClick={onClick}>
        {children}
      </button>
    ),
    RcSelect,
    RcSwitch,
    RcText: createComponent('span', 'text'),
    RcThumbnail: ({
      color,
      title,
    }) => <span data-color={color || ''} data-sign="thumbnail" title={title}>{title}</span>,
    RcTooltip: ({
      children,
      title,
    }) => <span title={title}>{children}</span>,
    RcTypography: ({
      children,
    }) => <span>{children}</span>,
    Virtuoso,
    css: () => '',
    palette2: jest.fn(() => '#000'),
    setOpacity: jest.fn((color, opacity) => `${color}:${opacity}`),
    styled,
    useAvatarColorToken: jest.fn((name) => `color:${name}`),
    useAvatarShortName: jest.fn(({ firstName = '', lastName = '' }) => (
      `${firstName.charAt(0)}${lastName.charAt(0)}`
    )),
    useChange: (effect, getValue) => {
      const value = getValue();
      React.useEffect(effect, [value]);
    },
    useRefState: (initialValue) => {
      const ref = React.useRef(initialValue);
      const [, setRevision] = React.useState(0);
      const setValue = (value, shouldRender = true) => {
        ref.current = value;
        if (shouldRender) {
          setRevision((revision) => revision + 1);
        }
      };
      return [ref, setValue];
    },
  };
}

jest.mock('@ringcentral/juno', () => mockCreateJuno());

jest.mock('@ringcentral/juno/foundation', () => {
  const {
    styled,
  } = mockCreateJuno();
  return {
    styled,
  };
});

const {
  ButtonLineItem,
  ExternalLinkLineItem,
  GroupLineItem,
  LinkLineItem,
  LogoutItem,
  OptionSettingLineItem,
  SwitchLineItem,
} = require('../../src/components/SettingsPanel/SettingItem');
const { AuthSettingsSection } = require('../../src/components/SettingsPanel/AuthSettingsSection');
const ConversationList = require('../../src/components/ConversationList').default;
const { ContactAvatar } = require('../../src/components/ContactAvatar');
const { ConversationIcon } = require('../../src/components/ConversationItem/ConversationIcon');
const { BottomAssignInfo } = require('../../src/components/ConversationPanel/BottomAssignInfo');
const { GroupNumbersDisplay } = require('../../src/components/ConversationPanel/GroupNumbersDisplay');
const { ContactItem } = require('../../src/components/ContactDropdownList/ContactItem');
const { FromField } = require('../../src/components/ComposeTextPanel/FromField');
const { EnvironmentPanel } = require('../../src/components/EnvironmentPanel');
const {
  CALL_TYPE_LIST,
  CALL_TYPE_LIST_WITH_UN_LOGGED,
  SearchAndFilter,
} = require('../../src/components/SearchAndFilter');

test('covers settings item variants, read-only guards and default render paths', () => {
  const onLinkClick = jest.fn();
  const onSwitchChange = jest.fn();
  const onOptionChange = jest.fn();
  const onButtonClick = jest.fn();
  const onLogout = jest.fn();
  const { rerender } = render(
    <section>
      <LinkLineItem
        show={false}
        name="hidden"
        currentLocale="en-US"
        onClick={onLinkClick}
      />
      <LinkLineItem
        show
        name="profile"
        currentLocale="en-US"
        customTitle="Profile"
        description="Profile description"
        onClick={onLinkClick}
      />
      <SwitchLineItem
        show
        checked={false}
        currentLocale="en-US"
        description="Switch description"
        name="sync"
        readOnly
        readOnlyReason="Managed"
        switchTitle="Sync"
        warning="Switch warning"
        onChange={onSwitchChange}
      />
      <OptionSettingLineItem
        show
        currentLocale="en-US"
        name="region"
        options={[
          { id: 'us', name: 'United States' },
          { id: 'uk', name: 'United Kingdom' },
        ]}
        readOnly
        value="us"
        warning="Option warning"
        onChange={onOptionChange}
      />
      <ButtonLineItem
        buttonLabel="Run"
        description="Button description"
        name="Action"
        onClick={onButtonClick}
      />
      <GroupLineItem
        show
        currentLocale="en-US"
        description="Group description"
        name="advanced"
      >
        <span>advanced child</span>
      </GroupLineItem>
      <ExternalLinkLineItem
        dataSign="external"
        description="External description"
        name="Docs"
        uri="https://example.com"
      />
      <LogoutItem
        currentLocale="en-US"
        isAdmin
        loginNumber="+16505550100"
        ringCXLicensed
        ringSenseLicensed
        onLogout={onLogout}
      />
    </section>,
  );
  expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Profile'));
  expect(onLinkClick).toHaveBeenCalled();
  fireEvent.click(screen.getByText('switch:Sync:false'));
  expect(onSwitchChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('select:us'));
  expect(onOptionChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Run'));
  expect(onButtonClick).toHaveBeenCalled();
  fireEvent.click(screen.getByText('advanced'));
  expect(screen.getByText('advanced child')).toBeInTheDocument();
  fireEvent.click(screen.getByText('logout'));
  expect(onLogout).toHaveBeenCalled();
  expect(screen.getByText('ACE')).toBeInTheDocument();
  expect(screen.getByText('RingCX')).toBeInTheDocument();
  expect(screen.getByText('admin')).toBeInTheDocument();

  rerender(
    <section>
      <SwitchLineItem
        show
        checked
        currentLocale="en-US"
        name="sync"
        switchTitle="Sync"
        onChange={onSwitchChange}
      />
      <OptionSettingLineItem
        show
        currentLocale="en-US"
        name="region"
        options={[{ id: 'us', name: 'United States' }]}
        value="us"
        onChange={onOptionChange}
      />
      <GroupLineItem show={false} currentLocale="en-US" name="hidden-group" />
      <LogoutItem
        currentLocale="en-US"
        isAdmin={false}
        loginNumber="+16505550100"
        ringCXLicensed={false}
        ringSenseLicensed={false}
        onLogout={onLogout}
      />
    </section>,
  );
  fireEvent.click(screen.getByText('switch:Sync:true'));
  expect(onSwitchChange).toHaveBeenCalledWith(false);
  fireEvent.click(screen.getByText('select:us'));
  expect(onOptionChange).toHaveBeenCalledWith('changed');
  expect(screen.queryByText('hidden-group')).not.toBeInTheDocument();
});

test('covers auth settings authorization, license and link branches', () => {
  const onAuthorize = jest.fn();
  const onLicenseRefresh = jest.fn();
  const { rerender } = render(
    <AuthSettingsSection
      authorized={false}
      authorizationLogo="https://example.com/logo.png"
      links={[
        { label: 'Help', uri: 'https://example.com/help' },
        { label: 'Privacy', uri: 'https://example.com/privacy' },
      ]}
      licenseDescription="License markdown"
      licenseStatus="License: expired"
      onAuthorize={onAuthorize}
      onLicenseRefresh={onLicenseRefresh}
      serviceInfo="Connect service"
      serviceName="CRM"
      showAuthButton
      showAuthRedDot
      unauthorizedTitle="Connect"
    />,
  );
  expect(screen.getByText('disconnected')).toBeInTheDocument();
  expect(screen.getByText('markdown:License markdown')).toBeInTheDocument();
  fireEvent.click(screen.getByText('refresh'));
  expect(onLicenseRefresh).toHaveBeenCalled();
  fireEvent.click(screen.getByText('Connect'));
  expect(onAuthorize).toHaveBeenCalled();
  expect(screen.getByText('Help')).toBeInTheDocument();
  expect(screen.getByText('Privacy')).toBeInTheDocument();

  rerender(
    <AuthSettingsSection
      authorized
      authorizedAccount="ada@example.com"
      authorizedTitle="Disconnect"
      contactSyncing
      licenseStatus=""
      onAuthorize={onAuthorize}
      serviceName="CRM"
      showAuthButton
    />,
  );
  expect(screen.getByText('connected as ada@example.com')).toBeInTheDocument();
  fireEvent.click(screen.getByText('syncing'));
  expect(onAuthorize).toHaveBeenCalledTimes(2);
});

test('covers contact avatar names, media urls and fallback icon branches', () => {
  const getAvatar = () => document.querySelector('[data-sign="avatar"]');
  const { rerender } = render(
    <ContactAvatar contact={{ name: 'Ada Lovelace' }} />,
  );

  expect(getAvatar()).toHaveTextContent('AL');
  expect(getAvatar()).toHaveAttribute('data-src', '');

  rerender(
    <ContactAvatar
      contact={{ name: 'Ignored' }}
      fullName="Grace Hopper"
      presenceOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      presenceProps={{ type: 'available', title: 'Available' }}
      size="small"
    />,
  );
  expect(getAvatar()).toHaveTextContent('GH');

  rerender(
    <ContactAvatar
      contact={{
        name: 'Image User',
        profileImageUrl: 'https://example.com/avatar.png',
      }}
    />,
  );
  expect(getAvatar()).toHaveAttribute('data-src', 'https://example.com/avatar.png');

  rerender(
    <ContactAvatar
      contact={{
        name: 'Media User',
        profileImage: { uri: 'https://media.ringcentral.com/avatar' },
      }}
      rcAccessToken="token"
    />,
  );
  expect(getAvatar()).toHaveAttribute(
    'data-src',
    'https://media.ringcentral.com/avatar?access_token=token',
  );

  rerender(
    <ContactAvatar
      contact={{
        name: 'Biz User',
        profileImage: {
          uri: 'https://media.ringcentral.biz/avatar?access_token=old',
        },
      }}
      rcAccessToken="token"
    />,
  );
  expect(getAvatar()).toHaveAttribute(
    'data-src',
    '',
  );

  rerender(<ContactAvatar contact={{}} isGroup />);
  expect(getAvatar()).toHaveAttribute('data-icon', 'MockIcon');

  rerender(<ContactAvatar />);
  expect(getAvatar()).toHaveAttribute('data-icon', 'MockIcon');
});

test('covers conversation list empty, populated, footer and pagination branches', () => {
  const loadNextPage = jest.fn();
  const baseProps = {
    brand: 'RingCentral',
    conversations: [],
    currentLocale: 'en-US',
    dateTimeFormatter: jest.fn(),
    maxExtensionNumberLength: 6,
    markMessage: jest.fn(),
    openMessageDetails: jest.fn(),
    readMessage: jest.fn(),
    showConversationDetail: jest.fn(),
    unmarkMessage: jest.fn(),
  };
  const { rerender } = render(<ConversationList {...baseProps} />);
  expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
  rerender(
    <ConversationList
      {...baseProps}
      additionalActions={[{ id: 'assign' }]}
      conversations={[{ conversationId: 'thread-1', id: 1 }]}
      currentSiteCode="101"
      disableCallButton
      disableLinks
      enableCDC
      isMultipleSiteEnabled
      loadNextPage={loadNextPage}
      loadingNextPage
      logButtonTitle="Log"
      rcAccessToken="token"
      showGroupNumberName
      showLogButton
      threadBusy
      typeFilter="SMS"
    />,
  );
  expect(screen.getByText('thread-1:no-call:no-link:Log:busy')).toBeInTheDocument();
  expect(screen.getByText('loading')).toBeInTheDocument();
  fireEvent.click(screen.getByText('end-reached'));
  expect(loadNextPage).toHaveBeenCalled();
  expect(global.__conversationListScrollToIndex).toHaveBeenCalledWith({
    align: 'start',
    behavior: 'smooth',
    index: 0,
  });
});

test('covers group number display contact matching and unread branches', () => {
  const formatPhone = jest.fn((phoneNumber) => `formatted:${phoneNumber}`);
  const phoneSourceNameRenderer = jest.fn((entityType) => `source:${entityType}`);
  const { rerender } = render(
    <GroupNumbersDisplay
      brand="RingCentral"
      contactMatches={[
        {
          entityType: 'company',
          hidden: false,
          name: 'Ada Contact',
          phoneNumber: '+1',
          phoneNumbers: [{ phoneNumber: '+1' }],
        },
        {
          entityType: 'personal',
          extensionNumber: '101',
          hidden: true,
          name: 'Hidden Contact',
        },
      ]}
      correspondents={[
        { name: 'Ada', phoneNumber: '+1' },
        { extensionNumber: '101', name: 'Extension User' },
        { name: '', phoneNumber: '+2' },
      ]}
      currentLocale="en-US"
      formatPhone={formatPhone}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      unread
    />,
  );
  expect(screen.getByText('Ada Contact, Hidden Contact, formatted:+2')).toBeInTheDocument();
  expect(screen.getByText('Ada Contact, Hidden Contact, formatted:+2')).toHaveAttribute(
    'title',
    'Ada Contact|company|formatted:+1, Hidden Contact|personal, formatted:+2',
  );

  rerender(
    <GroupNumbersDisplay
      brand="RingCentral"
      contactMatches={[]}
      correspondents={[{ extensionNumber: '202', name: '' }]}
      currentLocale="en-US"
      formatPhone={formatPhone}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
    />,
  );
  expect(screen.getByText('formatted:202')).toBeInTheDocument();
});

test('covers contact dropdown item renderers, hidden info and async presence branches', async () => {
  jest.useFakeTimers();
  const onHover = jest.fn();
  const onClick = jest.fn();
  const getPresence = jest.fn(async () => 'Available');
  const CustomInfo = ({
    name,
  }) => <span>{`custom-info:${name}`}</span>;
  const CustomPhone = ({
    phoneNumber,
  }) => <span>{`custom-phone:${phoneNumber}`}</span>;
  const { rerender, unmount } = render(
    <ContactItem
      active
      contact={{
        doNotCall: true,
        entityType: 'Contact',
        name: 'Ada',
        phoneNumber: '+1',
        phoneType: 'direct',
        presence: 'Busy',
        profileImageUrl: '',
      }}
      contactInfoRenderer={CustomInfo}
      contactPhoneRenderer={CustomPhone}
      currentLocale="en-US"
      formatContactPhone={(phoneNumber) => `formatted:${phoneNumber}`}
      getPresence={getPresence}
      onClick={onClick}
      onHover={onHover}
    />,
  );
  expect(screen.getByText('custom-info:Ada')).toBeInTheDocument();
  expect(screen.getByText('custom-phone:+1')).toBeInTheDocument();
  expect(screen.getByText('do-not-call')).toBeInTheDocument();
  fireEvent.mouseOver(screen.getByText('custom-info:Ada'));
  fireEvent.click(screen.getByText('custom-info:Ada'));
  expect(onHover).toHaveBeenCalled();
  expect(onClick).toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });
  expect(getPresence).toHaveBeenCalled();

  rerender(
    <ContactItem
      active={false}
      contact={{
        entityType: 'Contact',
        name: 'Grace',
        phoneNumber: '+2',
        phoneType: 'direct',
        profileImageUrl: 'avatar.png',
      }}
      currentLocale="en-US"
      formatContactPhone={(phoneNumber) => `formatted:${phoneNumber}`}
      hiddenContactInfo
      onClick={onClick}
      onHover={onHover}
    />,
  );
  expect(screen.queryByText('info:Grace:+2')).not.toBeInTheDocument();
  expect(screen.getByText('phone:+2')).toBeInTheDocument();
  unmount();
  jest.useRealTimers();
});

test('covers compose from field visibility, anonymous option and labels', () => {
  const onChange = jest.fn();
  const formatPhone = jest.fn((phoneNumber) => `formatted:${phoneNumber}`);
  const { rerender } = render(
    <FromField
      currentLocale="en-US"
      formatPhone={formatPhone}
      fromNumber="+1"
      fromNumbers={[
        {
          extension: { name: 'Sales Queue' },
          label: 'Main',
          phoneNumber: '+1',
          primary: true,
          usageType: 'DirectNumber',
        },
      ]}
      hidden
      onChange={onChange}
    />,
  );
  expect(screen.queryByText('from:')).not.toBeInTheDocument();
  rerender(
    <FromField
      currentLocale="en-US"
      formatPhone={formatPhone}
      fromNumber="+1"
      fromNumbers={[
        {
          extension: { name: 'Sales Queue' },
          label: 'Main',
          phoneNumber: '+1',
          primary: true,
          usageType: 'DirectNumber',
        },
      ]}
      hidden={false}
      showAnonymous
      onChange={onChange}
    />,
  );
  expect(screen.getByText('from:')).toBeInTheDocument();
  expect(screen.getByText('Sales Queue')).toBeInTheDocument();
  expect(screen.getByText('anonymous')).toBeInTheDocument();
  fireEvent.click(screen.getByText('select:+1'));
  expect(onChange).toHaveBeenCalledWith('changed');

  rerender(
    <FromField
      currentLocale="en-US"
      disabled
      formatPhone={formatPhone}
      fromNumber=""
      fromNumbers={[]}
      hidden={false}
      showAnonymous={false}
      onChange={onChange}
    />,
  );
  expect(screen.getByText('select:empty')).toBeDisabled();
});

test('covers search and filter preview, rest menu and disabled filter branches', () => {
  const onSearchInputChange = jest.fn();
  const onTypeChange = jest.fn();
  const { rerender } = render(
    <SearchAndFilter
      currentLocale="en-US"
      disableLinks
      placeholder="Search"
      searchInput=""
      showTypeFilter
      type="Outbound"
      typeList={CALL_TYPE_LIST}
      onSearchInputChange={onSearchInputChange}
      onTypeChange={onTypeChange}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Ada' } });
  expect(onSearchInputChange).toHaveBeenCalledWith('Ada');
  expect(screen.getByText('ALL')).toBeInTheDocument();
  expect(screen.getByText('OUTBOUND')).toBeInTheDocument();
  fireEvent.click(screen.getByText('MockIcon'));
  fireEvent.click(screen.getByText('Inbound'));
  expect(onTypeChange).toHaveBeenCalledWith('Inbound');

  rerender(
    <SearchAndFilter
      currentLocale="en-US"
      placeholder="Search"
      searchInput="Ada"
      showTypeFilter
      type="Logged"
      typeList={CALL_TYPE_LIST_WITH_UN_LOGGED}
      onSearchInputChange={onSearchInputChange}
      onTypeChange={onTypeChange}
    />,
  );
  expect(screen.getByText('LOGGED')).toBeInTheDocument();
  fireEvent.click(screen.getByText('MockIcon'));
  fireEvent.click(screen.getByText('UnLogged'));
  expect(onTypeChange).toHaveBeenCalledWith('UnLogged');

  rerender(
    <SearchAndFilter
      currentLocale="en-US"
      placeholder="Search"
      searchInput=""
      showTypeFilter={false}
      type="All"
      typeList={CALL_TYPE_LIST}
      onSearchInputChange={onSearchInputChange}
      onTypeChange={onTypeChange}
    />,
  );
  expect(screen.queryByText('ALL')).not.toBeInTheDocument();
});

test('covers conversation icon and bottom assignment info branches', () => {
  const onAssign = jest.fn();
  const onAssignToMe = jest.fn();
  const onReply = jest.fn();
  const { rerender } = render(
    <section>
      <ConversationIcon currentLocale="en-US" type="VoiceMail" color="neutral" />
      <ConversationIcon currentLocale="en-US" type="Fax" direction="Inbound" />
      <ConversationIcon currentLocale="en-US" type="Fax" direction="Outbound" />
      <ConversationIcon currentLocale="en-US" group />
      <ConversationIcon currentLocale="en-US" />
      <BottomAssignInfo
        busy={false}
        status="Resolved"
        onReply={onReply}
      />
    </section>,
  );
  const getByAnyTitle = (titles) => screen.getByTitle((title) => titles.includes(title));
  expect(getByAnyTitle(['Voice Mail', 'VoiceMail'])).toBeInTheDocument();
  expect(screen.getAllByTitle('Fax')).toHaveLength(2);
  expect(getByAnyTitle(['Group Conversation', 'groupConversation'])).toBeInTheDocument();
  expect(getByAnyTitle(['Conversation', 'conversation'])).toBeInTheDocument();
  fireEvent.click(screen.getByText('Reply'));
  expect(onReply).toHaveBeenCalled();

  rerender(
    <BottomAssignInfo
      assignee={{ name: 'Ada' }}
      busy
      isAssignedToMe={false}
      status="Open"
      onAssignToMe={onAssignToMe}
    />,
  );
  expect(screen.getByText(/assigned to Ada/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Assign to me'));
  expect(onAssignToMe).toHaveBeenCalled();

  rerender(
    <BottomAssignInfo
      assignee={null}
      busy={false}
      status="Open"
      onAssign={onAssign}
      onReply={onReply}
    />,
  );
  fireEvent.click(screen.getByText('Assign'));
  fireEvent.click(screen.getByText('Reply'));
  expect(onAssign).toHaveBeenCalled();
  expect(onReply).toHaveBeenCalledTimes(2);

  rerender(
    <BottomAssignInfo
      assignee={{ name: 'Ada' }}
      isAssignedToMe
      status="Open"
    />,
  );
  expect(screen.queryByText(/assigned to Ada/)).not.toBeInTheDocument();
});

test('covers environment panel hidden, save and cancel flows', () => {
  const onSetData = jest.fn();
  const baseProps = {
    clientId: 'client-id',
    clientSecret: 'client-secret',
    enabled: false,
    onSetData,
    recordingHost: 'https://recording.test',
    redirectUri: 'https://redirect.test',
    server: 'https://server.test',
  };
  const { unmount } = render(
    <EnvironmentPanel
      {...baseProps}
      defaultHidden
    />,
  );

  expect(screen.queryByText('Environment')).not.toBeInTheDocument();

  act(() => {
    window.toggleEnv();
  });

  expect(screen.getByText('Environment')).toBeInTheDocument();
  expect(screen.getByDisplayValue('https://redirect.test')).toBeDisabled();
  expect(screen.getByText('Save')).toBeDisabled();

  fireEvent.change(screen.getByDisplayValue('https://server.test'), {
    target: { value: 'https://new-server.test' },
  });
  const [clientIdInput, clientSecretInput] = screen.getAllByPlaceholderText('Optional');
  fireEvent.change(clientIdInput, { target: { value: 'new-client-id' } });
  fireEvent.change(clientSecretInput, { target: { value: 'new-client-secret' } });
  fireEvent.click(screen.getByText('env-switch:false'));
  fireEvent.click(screen.getByText('Save'));

  expect(onSetData).toHaveBeenCalledWith({
    clientId: 'new-client-id',
    clientSecret: 'new-client-secret',
    enabled: true,
    recordingHost: 'https://recording.test',
    server: 'https://new-server.test',
  });
  expect(screen.queryByText('Environment')).not.toBeInTheDocument();

  act(() => {
    window.toggleEnv();
  });

  fireEvent.click(screen.getByText('env-back'));
  expect(screen.queryByText('Environment')).not.toBeInTheDocument();
  expect(onSetData).toHaveBeenCalledTimes(1);

  unmount();
  render(
    <EnvironmentPanel
      {...baseProps}
      defaultHidden={false}
    />,
  );

  expect(screen.getByText('Environment')).toBeInTheDocument();
  expect(screen.getByText('Save')).toBeDisabled();
  delete window.toggleEnv;
});
