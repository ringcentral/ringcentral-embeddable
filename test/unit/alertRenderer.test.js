/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { webphoneErrors } from '@ringcentral-integration/commons/modules/Webphone/webphoneErrors';

import { getAlertRenderer } from '../../src/components/AlertRenderer';

jest.mock('@ringcentral-integration/widgets/components/FormattedMessage', () => (
  function MockFormattedMessage({ message, values = {} }) {
    return (
      <span>
        {message}
        {values.link}
      </span>
    );
  }
));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    ReportAnIssue: createIcon('ReportAnIssue'),
    InfoBorder: createIcon('InfoBorder'),
    Check: createIcon('Check'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !['symbol', 'size', 'color', 'variant'].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag) => React.forwardRef((props, ref) => (
    React.createElement(tag, { ...cleanProps(props), ref }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div');
  return {
    RcIcon: createComponent('span'),
    RcLink: createComponent('a'),
    RcTypography: createComponent('span'),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('@ringcentral/juno/foundation', () => {
  const { styled } = require('@ringcentral/juno');
  return { styled };
});

describe('AlertRenderer', () => {
  it('returns static renderers for embeddable alert messages', () => {
    const renderAlert = getAlertRenderer({ onThirdPartyLinkClick: jest.fn() });
    const expectedMessages = [
      ['allowMicrophonePermissionOnInactiveTab', 'Please go to your first opened tab'],
      ['popupWindowOpened', 'You have a popup window opened.'],
      ['cannotPopupWindowWithCall', 'active calls'],
      ['stopRecordDisabled', 'stopping recording is not supported'],
      ['maxGroupSMSLimitReached', 'maximum 10 recipients'],
      ['noUnreadForOldMessages', 'mark old messages as unread'],
      ['noUnreadForOutboundMessages', 'mark outbound messages as unread'],
      ['deleteSmsTemplateError', 'template deletion failed'],
      ['saveSmsTemplateError', 'template saving failed'],
      ['smsTemplateMaxLimit', 'maximum 25 number of templates'],
      ['dropVoicemailMessageError', 'failed to drop voicemail message'],
      ['dropVoicemailMessageGreetingDetectionTimeout', 'greeting ended detection timeout'],
      ['dropVoicemailMessageFailedAsCallEnded', 'detection failed as call ended'],
      ['dropVoicemailMessageSendedAsCallEnded', 'sended failed as call ended'],
      ['dropVoicemailMessageMaxLimit', 'maximum 10 number of voicemail messages'],
      ['tooManyVoicemailDroppingSessions', 'too many voicemail dropping calls'],
      ['customPhoneNumberFormatTemplateRequired', 'format template'],
      ['customPhoneNumberFormatTemplateLengthInvalid', '10-15 digits'],
      ['invalidPhoneNumberFormatType', 'invalid phone number format type'],
      ['callHUDAddExtensionsLimitExceeded', 'maximum number of extensions'],
      ['callHUDUpdateExtensionsFailed', 'failed to update extensions list'],
      ['callHUDSyncExtensionsFailed', 'failed to sync extensions list'],
      ['messageThreadResolveFailed', 'failed to resolve message thread'],
      ['messageThreadAssignFailed', 'failed to assign message thread'],
      ['messageThreadCreateNoteFailed', 'failed to create note'],
      ['messageThreadUpdateNoteFailed', 'failed to update note'],
      ['messageThreadDeleteNoteFailed', 'failed to delete note'],
      ['messageThreadMarkAsUnreadFailed', 'does not have any inbound messages'],
      ['threadIsAssignedToOtherExtension', 'claim the thread'],
    ];

    expectedMessages.forEach(([message, expectedText]) => {
      const Renderer = renderAlert({ message });
      expect(Renderer()).toContain(expectedText);
    });
    expect(renderAlert({ message: 'unknown-message' })).toBeNull();
  });

  it('renders custom alerts and dispatches third-party link clicks', () => {
    const onThirdPartyLinkClick = jest.fn();
    const renderAlert = getAlertRenderer({ onThirdPartyLinkClick });
    const Renderer = renderAlert({ message: 'showCustomAlertMessage' });

    const { rerender } = render(
      <Renderer
        showMore
        message={{
          level: 'danger',
          payload: {
            alertMessage: 'Custom alert',
            details: [{
              title: 'Required steps',
              items: [
                { type: 'text', text: 'Read the warning' },
                {
                  id: 'docs-link',
                  type: 'link',
                  text: 'Open docs',
                  href: 'https://example.com/docs',
                },
                { type: 'unknown', text: 'Ignored' },
              ],
            }],
          },
        }}
      />,
    );

    expect(screen.getByText('Custom alert')).toBeTruthy();
    expect(screen.getByText('Required steps')).toBeTruthy();
    expect(screen.getByText('Read the warning')).toBeTruthy();
    fireEvent.click(screen.getByText('Open docs'));
    expect(onThirdPartyLinkClick).toHaveBeenCalledWith('docs-link');

    rerender(
      <Renderer
        message={{
          level: 'success',
          payload: {
            alertMessage: 'Completed',
            details: [],
          },
        }}
      />,
    );
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders noise-reduction and webphone limit alerts', () => {
    const renderAlert = getAlertRenderer({ onThirdPartyLinkClick: jest.fn() });
    const NoiseReductionRenderer = renderAlert({
      message: 'showNoiseReductionNotSupported',
    });
    render(<NoiseReductionRenderer />);

    expect(screen.getByText(/noise reduction isn't supported/)).toBeTruthy();
    expect(screen.getByText('here').getAttribute('href')).toBe(
      'https://ringcentral.github.io/ringcentral-embeddable/docs/config/noise-reduction/',
    );

    const limitRenderer = renderAlert({
      message: webphoneErrors.webphoneCountOverLimit,
    });
    const forbiddenRenderer = renderAlert({
      message: webphoneErrors.webphoneForbidden,
    });
    expect(limitRenderer()).toContain('Account signed in on another device');
    expect(forbiddenRenderer()).toContain('Account signed in on another device');
  });
});
