/** @jest-environment jsdom */
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { callingOptions } from '@ringcentral-integration/commons/modules/CallingSettings';

import {
  AudioSettingsPanel,
  getDeviceOptionRenderer,
  getDeviceValueRenderer,
  getFallbackLabel,
} from '../../src/components/AudioSettingsPanel';
import { CallingSettingsPanel } from '../../src/components/CallingSettingsPanel';
import MessageInput from '../../src/components/MessageInput';
import { SettingsPanel } from '../../src/components/SettingsPanel/SettingsPanel';

jest.mock('@ringcentral-integration/widgets/components/AudioSettingsPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/CallingSettingsPanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/MessageInput/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/DurationCounter', () => (
  function MockDurationCounter({ offset, startTime }) {
    return <span>{`duration:${startTime}:${offset}`}</span>;
  }
));

jest.mock('@ringcentral-integration/widgets/components/SpinnerOverlay', () => ({
  SpinnerOverlay: () => <span data-sign="spinner" data-testid="spinner">spinner</span>,
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => {
    function MockIcon() {
      return <span data-icon={name} />;
    }
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Attachment: createIcon('Attachment'),
    Close: createIcon('Close'),
    SendFilled: createIcon('SendFilled'),
    Sms: createIcon('Sms'),
    SmsTemplate: createIcon('SmsTemplate'),
    TimeBorder: createIcon('TimeBorder'),
  };
});

function mockCreateJunoMock() {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'color',
        'formControlLabelProps',
        'fullWidth',
        'helperText',
        'inputProps',
        'labelPlacement',
        'loading',
        'radius',
        'renderValue',
        'size',
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
      ? React.createElement(Component, {
        ...cleanProps(props),
        ref,
        'data-sign': props['data-sign'] || `styled-${Component}`,
        'data-testid': props['data-testid'] || props['data-sign'] || `styled-${Component}`,
      }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.a = () => createComponent('a', 'styled-a');
  styled.div = () => createComponent('div', 'styled-div');
  styled.img = () => createComponent('img', 'styled-img');
  styled.label = () => createComponent('label', 'styled-label');
  styled.span = () => createComponent('span', 'styled-span');
  const getSelectNextValue = (label, dataSign) => {
    if (dataSign === 'myLocation') return '+16505550100';
    if (label === 'makeCallsWith') return 'callingOptions-browser';
    if (label === 'Microphone') return 'input-2';
    if (label === 'Speaker source') return 'output-2';
    if (label === 'Ringtone source') return 'ringtone-2';
    return 'selected-value';
  };
  return {
    RcButton: ({
      children,
      disabled,
      onClick,
      ...props
    }) => (
      <button
        data-sign={props['data-sign'] || children}
        data-testid={props['data-testid'] || props['data-sign'] || children}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
    ),
    RcCard: createComponent('section', 'card'),
    RcCardActions: createComponent('div', 'card-actions'),
    RcCardContent: createComponent('div', 'card-content'),
    RcIconButton: ({
      disabled,
      onClick,
      symbol,
      title,
      ...props
    }) => (
      <button
        data-sign={props['data-sign'] || title || symbol?.displayName || 'icon-button'}
        data-testid={props['data-testid'] || props['data-sign'] || title || symbol?.displayName || 'icon-button'}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {title || symbol?.displayName || 'icon-button'}
      </button>
    ),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcMenuItem: ({ children, value, ...props }) => (
      <span data-sign={props['data-sign'] || value} data-value={value}>
        {children}
      </span>
    ),
    RcSelect: ({
      children,
      disabled,
      label,
      onChange,
      renderValue,
      value,
      ...props
    }) => (
      <div data-sign={props['data-sign'] || `select-wrapper-${label || 'unknown'}`}>
        <span>{label}</span>
        <button
          data-sign={`select-${props['data-sign'] || label || 'unknown'}`}
          data-testid={`select-${props['data-sign'] || label || 'unknown'}`}
          disabled={disabled}
          type="button"
          onClick={() => onChange?.({
            target: {
              value: getSelectNextValue(label, props['data-sign']),
            },
          })}
        >
          {`select:${label || props['data-sign']}:${value || 'empty'}`}
        </button>
        {renderValue ? <span>{renderValue(value)}</span> : null}
        {children}
      </div>
    ),
    RcSwitch: ({
      checked,
      disabled,
      label,
      onChange,
      ...props
    }) => (
      <button
        data-sign={props['data-sign'] || label}
        data-testid={props['data-testid'] || props['data-sign'] || label}
        disabled={disabled}
        type="button"
        onClick={() => onChange?.(null, !checked)}
      >
        {`switch:${label}:${String(checked)}`}
      </button>
    ),
    RcTextField: ({
      disabled,
      label,
      onChange,
      value,
      ...props
    }) => (
      <input
        aria-label={label}
        data-sign={props['data-sign'] || label}
        data-testid={props['data-testid'] || props['data-sign'] || label}
        disabled={disabled}
        value={value || ''}
        onChange={onChange}
      />
    ),
    RcTooltip: ({ children }) => <>{children}</>,
    RcTypography: ({ children }) => <span>{children}</span>,
    palette2: jest.fn(() => '#000'),
    styled,
  };
}

jest.mock('@ringcentral/juno', () => mockCreateJunoMock());

jest.mock('@ringcentral/juno/foundation', () => {
  const {
    styled,
  } = mockCreateJunoMock();
  return {
    styled,
  };
});

jest.mock('../../src/components/BackHeaderView', () => ({
  BackHeaderView: ({
    children,
    onBack,
    title,
  }) => (
    <section>
      <button data-sign="back" type="button" onClick={onBack}>
        {`back:${title}`}
      </button>
      {children}
    </section>
  ),
}));

jest.mock('../../src/components/SaveButton', () => ({
  SaveButton: ({
    disabled,
    onClick,
  }) => (
    <button
      data-sign="saveButton"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      save
    </button>
  ),
}));

jest.mock('../../src/components/AudioSettingsPanel/VolumeSlider', () => ({
  VolumeSlider: ({
    label,
    onChange,
    volume,
  }) => (
    <button
      data-sign={`volume-${label}`}
      type="button"
      onClick={() => onChange(volume + 0.1)}
    >
      {`volume:${label}:${volume}`}
    </button>
  ),
}));

jest.mock('../../src/components/AdditionalToolbarButton', () => ({
  AdditionalToolbarButton: ({
    label,
    onClick,
  }) => (
    <button data-sign={`toolbar-${label}`} type="button" onClick={onClick}>
      {`toolbar:${label}`}
    </button>
  ),
}));

jest.mock('../../src/components/SmsTemplateDialog', () => ({
  SmsTemplateDialog: ({
    onApply,
    onClose,
    open,
  }) => (
    open ? (
      <section role="dialog">
        <button type="button" onClick={() => onApply('template text')}>
          apply-template
        </button>
        <button type="button" onClick={onClose}>
          close-template
        </button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/SettingsPanel/BasePanel', () => ({
  BasePanel: ({
    additional,
    children,
    eulaLabel,
    onEulaLinkClick,
    onLogoutButtonClick,
    version,
  }) => (
    <section data-sign="settings-base">
      <button data-sign="logout" type="button" onClick={onLogoutButtonClick}>
        logout
      </button>
      <button data-sign="eula" type="button" onClick={onEulaLinkClick}>
        {eulaLabel || 'eula'}
      </button>
      <span>{version}</span>
      {children}
      {additional}
    </section>
  ),
}));

jest.mock('../../src/components/SettingsPanel/AuthSettingsSection', () => ({
  AuthSettingsSection: ({
    links = [],
    onAuthorize,
    onLicenseRefresh,
    serviceName,
  }) => (
    <section data-sign="auth-section">
      <span>{serviceName}</span>
      <button data-sign="authorize" type="button" onClick={onAuthorize}>
        authorize
      </button>
      <button data-sign="license-refresh" type="button" onClick={onLicenseRefresh}>
        refresh-license
      </button>
      {links.map((link) => (
        <a data-sign={`auth-link-${link.label}`} href={link.uri} key={link.label}>
          {link.label}
        </a>
      ))}
    </section>
  ),
}));

jest.mock('../../src/components/SettingsPanel/PresenceSettingSection', () => ({
  PresenceSettingSection: ({
    gotoCallQueuePresenceSettings,
    setAvailable,
    setBusy,
    setDoNotDisturb,
    setInvisible,
    toggleAcceptCallQueueCalls,
  }) => (
    <section data-sign="presence-section">
      <button data-sign="presence-available" type="button" onClick={setAvailable}>available</button>
      <button data-sign="presence-busy" type="button" onClick={setBusy}>busy</button>
      <button data-sign="presence-dnd" type="button" onClick={setDoNotDisturb}>dnd</button>
      <button data-sign="presence-invisible" type="button" onClick={setInvisible}>invisible</button>
      <button data-sign="presence-queue" type="button" onClick={toggleAcceptCallQueueCalls}>queue</button>
      <button data-sign="presence-call-queue-settings" type="button" onClick={gotoCallQueuePresenceSettings}>call queue</button>
    </section>
  ),
}));

jest.mock('../../src/components/SettingsPanel/SettingItem', () => ({
  ButtonLineItem: ({
    buttonLabel,
    name,
    onClick,
  }) => (
    <button data-sign={`button-${name}`} type="button" onClick={onClick}>
      {buttonLabel || name}
    </button>
  ),
  ExternalLinkLineItem: ({
    dataSign,
    name,
    uri,
  }) => (
    <a data-sign={`external-${dataSign || name}`} href={uri}>
      {name}
    </a>
  ),
  GroupLineItem: ({
    children,
    dataSign,
    name,
    show,
  }) => (
    show ? (
      <section data-sign={`group-${dataSign || name}`}>
        <span>{name}</span>
        {children}
      </section>
    ) : null
  ),
  LinkLineItem: ({
    dataSign,
    name,
    onClick,
    show,
  }) => (
    show ? (
      <button data-sign={`link-${dataSign || name}`} type="button" onClick={onClick}>
        {name}
      </button>
    ) : null
  ),
  OptionSettingLineItem: ({
    dataSign,
    name,
    onChange,
    show,
    value,
  }) => (
    show ? (
      <button
        data-sign={`option-${dataSign || name}`}
        type="button"
        onClick={() => onChange(`${value || 'value'}-next`)}
      >
        {name}
      </button>
    ) : null
  ),
  SwitchLineItem: ({
    checked,
    dataSign,
    name,
    onChange,
    show,
  }) => (
    show ? (
      <button
        data-sign={`switch-${dataSign || name}`}
        type="button"
        onClick={() => onChange(!checked)}
      >
        {`${name}:${String(checked)}`}
      </button>
    ) : null
  ),
}));

function getBySign(sign) {
  return document.querySelector(`[data-sign="${sign}"]`);
}

function createSettingsProps(overrides = {}) {
  return {
    additional: <span>additional-settings</span>,
    autoLogDescription: 'Call logging description',
    autoLogEnabled: true,
    autoLogSMSDescription: 'SMS logging description',
    autoLogSMSEnabled: false,
    autoLogSMSTitle: 'SMS logging',
    autoLogTitle: 'Call logging',
    autoLogWarning: 'Call logging warning',
    children: <span>settings-child</span>,
    currentLocale: 'en-US',
    dndStatus: 'TakeAllCalls',
    eulaLabel: 'Terms',
    eulaLink: 'https://example.com/eula',
    gotoCallQueuePresenceSettings: jest.fn(),
    gotoPhoneNumberFormatSettings: jest.fn(),
    gotoThirdPartySection: jest.fn(),
    gotoVoicemailDropSettings: jest.fn(),
    hudEnabled: true,
    isAdmin: true,
    isCallQueueMember: true,
    loginNumber: '+16505550100',
    onAudioSettingsLinkClick: jest.fn(),
    onAutoLogChange: jest.fn(),
    onAutoLogSMSChange: jest.fn(),
    onCallingSettingsLinkClick: jest.fn(),
    onEulaLinkClick: jest.fn(),
    onFeedbackSettingsLinkClick: jest.fn(),
    onHUDSettingsToggle: jest.fn(),
    onLogoutButtonClick: jest.fn(),
    onRegionSettingsLinkClick: jest.fn(),
    onSmartNoteAutoStartToggle: jest.fn(),
    onSmartNoteToggle: jest.fn(),
    onTextSettingsLinkClick: jest.fn(),
    onThemeSettingsLinkClick: jest.fn(),
    onThirdPartyAuthorize: jest.fn(),
    onThirdPartyButtonClick: jest.fn(),
    onThirdPartyLicenseRefresh: jest.fn(),
    onThirdPartySettingChanged: jest.fn(),
    openPresenceSettings: true,
    ringCXLicensed: true,
    ringSenseLicensed: true,
    setAvailable: jest.fn(),
    setBusy: jest.fn(),
    setDoNotDisturb: jest.fn(),
    setInvisible: jest.fn(),
    showAudio: true,
    showAutoLog: true,
    showAutoLogSMS: true,
    showCallQueuePresenceSettings: true,
    showCalling: true,
    showFeedback: true,
    showHeader: true,
    showHUDSettings: true,
    showPhoneNumberFormatSettings: true,
    showPresenceSettings: true,
    showRegion: true,
    showSmartNoteSetting: true,
    showText: true,
    showThemeSetting: true,
    showVoicemailDropSettings: true,
    smartNoteAutoStartEnabled: true,
    smartNoteEnabled: true,
    thirdPartyAuth: {
      authorized: false,
      authorizationLinks: [{ label: 'Docs', uri: 'https://example.com/docs' }],
      serviceName: 'CRM',
      showAuthButton: true,
    },
    thirdPartySettings: [
      {
        description: 'Open CRM section',
        id: 'crm-section',
        name: 'CRM Section',
        type: 'section',
      },
      {
        buttonType: 'link',
        id: 'crm-link',
        name: 'CRM Link',
        type: 'button',
      },
      {
        buttonLabel: 'Run',
        id: 'crm-button',
        name: 'CRM Button',
        type: 'button',
      },
      {
        id: 'sync',
        name: 'Sync Contacts',
        type: 'boolean',
        value: true,
      },
      {
        id: 'mode',
        name: 'Sync Mode',
        options: [{ id: 'fast', name: 'Fast' }],
        type: 'option',
        value: 'fast',
      },
      {
        groupId: 'advancedFeatures',
        id: 'grouped',
        name: 'Grouped Toggle',
        type: 'boolean',
        value: false,
      },
      {
        id: 'external',
        name: 'CRM Help',
        type: 'externalLink',
        uri: 'https://example.com/help',
      },
      {
        id: 'crm-group',
        items: [{
          id: 'nested',
          name: 'Nested Toggle',
          type: 'boolean',
          value: false,
        }],
        name: 'CRM Group',
        type: 'group',
      },
    ],
    toggleAcceptCallQueueCalls: jest.fn(),
    userStatus: 'Available',
    version: '1.2.3',
    ...overrides,
  };
}

describe('settings and input flow components', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds settings groups and dispatches built-in and third-party actions', () => {
    const props = createSettingsProps();
    render(<SettingsPanel {...props} />);

    [
      'logout',
      'eula',
      'authorize',
      'license-refresh',
      'link-region',
      'link-theme',
      'link-phoneNumberFormat',
      'link-calling',
      'link-text',
      'link-voicemailDropSettings',
      'link-audio',
      'link-feedback',
      'presence-available',
      'presence-busy',
      'presence-dnd',
      'presence-invisible',
      'presence-queue',
      'presence-call-queue-settings',
      'switch-AIAssistantAutoStart',
      'switch-hudSettings',
      'switch-AutoLogCall',
      'switch-AutoLogSMS',
      'link-crm-section',
      'link-CRM Link',
      'button-CRM Button',
      'switch-thirdPartySettings-sync',
      'option-thirdPartySettings-mode',
      'switch-thirdPartySettings-grouped',
      'switch-thirdPartySettings-nested',
    ].forEach((sign) => {
      fireEvent.click(getBySign(sign));
    });

    expect(props.onLogoutButtonClick).toHaveBeenCalled();
    expect(props.onEulaLinkClick).toHaveBeenCalled();
    expect(props.onThirdPartyAuthorize).toHaveBeenCalled();
    expect(props.onThirdPartyLicenseRefresh).toHaveBeenCalled();
    expect(props.onRegionSettingsLinkClick).toHaveBeenCalled();
    expect(props.onThemeSettingsLinkClick).toHaveBeenCalled();
    expect(props.gotoPhoneNumberFormatSettings).toHaveBeenCalled();
    expect(props.onCallingSettingsLinkClick).toHaveBeenCalled();
    expect(props.onTextSettingsLinkClick).toHaveBeenCalled();
    expect(props.gotoVoicemailDropSettings).toHaveBeenCalled();
    expect(props.onAudioSettingsLinkClick).toHaveBeenCalled();
    expect(props.onFeedbackSettingsLinkClick).toHaveBeenCalled();
    expect(props.setAvailable).toHaveBeenCalled();
    expect(props.setBusy).toHaveBeenCalled();
    expect(props.setDoNotDisturb).toHaveBeenCalled();
    expect(props.setInvisible).toHaveBeenCalled();
    expect(props.toggleAcceptCallQueueCalls).toHaveBeenCalled();
    expect(props.gotoCallQueuePresenceSettings).toHaveBeenCalled();
    expect(props.onSmartNoteAutoStartToggle).toHaveBeenCalledWith(false);
    expect(props.onHUDSettingsToggle).toHaveBeenCalledWith(false);
    expect(props.onAutoLogChange).toHaveBeenCalledWith(false);
    expect(props.onAutoLogSMSChange).toHaveBeenCalledWith(true);
    expect(props.gotoThirdPartySection).toHaveBeenCalledWith('crm-section');
    expect(props.onThirdPartyButtonClick).toHaveBeenCalledWith('crm-link');
    expect(props.onThirdPartyButtonClick).toHaveBeenCalledWith('crm-button');
    expect(props.onThirdPartySettingChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sync' }),
      false,
    );
    expect(props.onThirdPartySettingChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'mode' }),
      'fast-next',
    );
    expect(props.onThirdPartySettingChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'grouped' }),
      true,
    );
    expect(props.onThirdPartySettingChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'nested' }),
      true,
    );
    expect(getBySign('external-CRM Help').getAttribute('href')).toBe('https://example.com/help');
  });

  it('renders settings panel with default optional props', () => {
    render(<SettingsPanel currentLocale="en-US" />);

    expect(getBySign('settings-base')).toBeTruthy();
    expect(getBySign('logout')).toBeTruthy();
    expect(getBySign('eula').textContent).toBe('eula');
    expect(getBySign('auth-section')).toBeNull();
    expect(getBySign('presence-section')).toBeNull();
    expect(getBySign('spinner')).toBeNull();
  });

  it('handles audio devices, volume controls, and exported device renderers', async () => {
    const devices = [
      { deviceId: 'input-1', label: '' },
      { deviceId: 'input-2', label: 'USB mic' },
    ];
    expect(getFallbackLabel(devices, 0, 'en-US')).toBe('noLabel 1');
    expect(getDeviceValueRenderer(devices, 'en-US')(null)).toBe('noDevice');
    expect(getDeviceValueRenderer(devices, 'en-US')('input-2')).toBe('USB mic');
    expect(getDeviceOptionRenderer(devices, 'en-US')(devices[0], 0)).toBe('noLabel 1');

    const props = {
      availableInputDevices: devices,
      availableOutputDevices: [
        { deviceId: 'output-1', label: '' },
        { deviceId: 'output-2', label: 'USB speaker' },
      ],
      callVolume: 0.5,
      checkUserMedia: jest.fn(),
      currentLocale: 'en-US',
      dialButtonVolume: 0.2,
      gotoRingtoneSettings: jest.fn(),
      inputDeviceId: 'input-1',
      noiseReductionEnabled: true,
      onBackButtonClick: jest.fn(),
      onNoiseReductionChange: jest.fn(),
      onRingtoneDeviceIdChange: jest.fn(),
      onSave: jest.fn(),
      outputDeviceId: 'output-1',
      ringtoneDeviceId: 'output-1',
      ringtoneVolume: 0.7,
      showCallVolume: true,
      showDialButtonVolume: true,
      showNoiseReductionSetting: true,
      showRingToneVolume: true,
      showRingtoneAudioSetting: true,
      supportDevices: true,
      userMedia: false,
    };
    render(<AudioSettingsPanel {...props} />);

    await waitFor(() => {
      expect(props.checkUserMedia).toHaveBeenCalled();
    });
    fireEvent.click(getBySign('checkMicPermission'));
    fireEvent.click(getBySign('select-Microphone'));
    fireEvent.click(getBySign('select-Speaker source'));
    fireEvent.click(getBySign('select-Ringtone source'));
    fireEvent.click(getBySign('Enable noise reduction'));
    fireEvent.click(getBySign('volume-Speaker volume'));
    fireEvent.click(getBySign('volume-Ringtone volume'));
    fireEvent.click(getBySign('volume-Dial button volume'));
    fireEvent.click(screen.getByText('Manage'));
    fireEvent.click(getBySign('back'));

    expect(props.checkUserMedia).toHaveBeenCalledTimes(2);
    expect(props.onSave).toHaveBeenCalledWith({ inputDeviceId: 'input-2' });
    expect(props.onSave).toHaveBeenCalledWith({ outputDeviceId: 'output-2' });
    expect(props.onRingtoneDeviceIdChange).toHaveBeenCalledWith('ringtone-2');
    expect(props.onNoiseReductionChange).toHaveBeenCalledWith(false);
    expect(props.onSave).toHaveBeenCalledWith({ callVolume: 0.6 });
    expect(props.onSave).toHaveBeenCalledWith({ ringtoneVolume: 0.7999999999999999 });
    expect(props.onSave).toHaveBeenCalledWith({ dialButtonVolume: 0.30000000000000004 });
    expect(props.gotoRingtoneSettings).toHaveBeenCalled();
    expect(props.onBackButtonClick).toHaveBeenCalled();
  });

  it('saves calling settings and renders spinner state', () => {
    const props = {
      availableNumbersWithLabel: [{ label: 'Main', value: '+16505550100' }],
      callWith: callingOptions.ringout,
      callWithOptions: [
        callingOptions.ringout,
        callingOptions.browser,
        callingOptions.softphone,
        callingOptions.jupiter,
      ],
      currentLocale: 'en-US',
      defaultRingoutPrompt: true,
      disabled: false,
      incomingAudio: true,
      incomingAudioFile: 'incoming.mp3',
      jupiterAppName: 'RingCentral app',
      locationSearchable: true,
      myLocation: 'custom',
      onBackButtonClick: jest.fn(),
      onSave: jest.fn(),
      outgoingAudio: false,
      outgoingAudioFile: 'outgoing.mp3',
      ringoutPrompt: false,
      softphoneAppName: 'RC Phone',
    };
    const { rerender } = render(<CallingSettingsPanel {...props} />);

    fireEvent.click(getBySign('select-myLocation'));
    fireEvent.click(getBySign('ringoutPromptToggle'));
    fireEvent.click(getBySign('saveButton'));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      callWith: callingOptions.ringout,
      isCustomLocation: false,
      myLocation: '+16505550100',
      ringoutPrompt: true,
    }));

    fireEvent.click(getBySign('select-makeCallsWith'));
    fireEvent.click(getBySign('saveButton'));
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      callWith: callingOptions.browser,
    }));

    rerender(<CallingSettingsPanel {...props} showSpinner />);
    expect(getBySign('spinner')).toBeTruthy();
  });

  it('handles real message input send, attachment, template, and duration flows', () => {
    const onChange = jest.fn();
    const onSend = jest.fn();
    const addAttachment = jest.fn();
    const removeAttachment = jest.fn();
    const onClickAdditionalToolbarButton = jest.fn();
    const { rerender } = render(
      <MessageInput
        addAttachment={addAttachment}
        additionalToolbarButtons={[{ id: 'crm', label: 'CRM', icon: 'crm.png' }]}
        attachments={[{
          file: new File(['old'], 'old.png', { type: 'image/png' }),
          name: 'old.png',
          size: 3,
        }]}
        accumulatedTypingTime={2000}
        currentLocale="en-US"
        disabled={false}
        inputExpandable
        onChange={onChange}
        onClickAdditionalToolbarButton={onClickAdditionalToolbarButton}
        onSend={onSend}
        removeAttachment={removeAttachment}
        sendButtonDisabled={false}
        showTemplate
        showTemplateManagement
        showTypingDuration
        sortTemplates={jest.fn()}
        supportAttachment
        templates={[{ id: 'template-1' }]}
        typingStartTime={1000}
        value="hello"
      />,
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    fireEvent.change(textarea, {
      target: { value: 'updated' },
    });
    fireEvent.keyPress(textarea, {
      charCode: 13,
      key: 'Enter',
      shiftKey: false,
    });
    fireEvent.click(getBySign('messageButton'));
    fireEvent.click(screen.getByText('toolbar:CRM'));
    fireEvent.click(screen.getByText('Close'));
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: {
        files: [new File(['card'], 'lead.vcf', { type: '' })],
      },
    });
    fireEvent.click(screen.getByText('Use template'));
    fireEvent.click(screen.getByText('apply-template'));

    expect(onChange).toHaveBeenCalledWith('updated');
    expect(onSend).toHaveBeenCalledWith('updated', expect.any(Array));
    expect(onClickAdditionalToolbarButton).toHaveBeenCalledWith('crm');
    expect(removeAttachment).toHaveBeenCalledWith(expect.objectContaining({
      name: 'old.png',
    }));
    expect(addAttachment).toHaveBeenCalledWith(expect.objectContaining({
      name: 'lead.vcf',
      file: expect.objectContaining({ type: 'text/vcard' }),
    }));
    expect(onChange).toHaveBeenCalledWith('template text');
    expect(screen.getByText('duration:1000:-2000')).toBeTruthy();

    rerender(
      <MessageInput
        accumulatedTypingTime={5000}
        additionalToolbarButtons={[]}
        attachments={[]}
        currentLocale="en-US"
        disabled={false}
        inputExpandable={false}
        onClickAdditionalToolbarButton={jest.fn()}
        sendButtonDisabled
        showTypingDuration
        supportAttachment={false}
        typingStartTime={null}
        value=""
      />,
    );
    expect(getBySign('typingDurationPaused')).toBeTruthy();
  });
});
