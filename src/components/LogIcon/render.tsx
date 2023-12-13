import React from 'react';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import LogIcon from './index';

export function renderExtraCallLogButton({
  callLogger,
  callLogSection,
  locale,
}) {
  const ExtraCallLogButton = (call) => {
    const sessionId = call.sessionId;
    if (!callLogger.ready) {
      return null;
    }
    const isSaving = callLogger.loggingMap[sessionId];
    const disabled = call.type === messageTypes.fax;
    const isFax = call.type === messageTypes.fax;
    const matcher = call.activityMatches && call.activityMatches[0];
    let id = null;
    if (matcher) {
      if (matcher.id) {
        id = matcher.id.toString();
      } else {
        const keys = Object.keys(matcher);
        if (keys.length > 0) {
          id = matcher[keys[0]].toString();
        }
      }
    }
    return (
      <LogIcon
        id={id}
        sessionId={sessionId}
        isSaving={isSaving}
        disabled={disabled}
        isFax={isFax}
        onClick={() => {
          if (callLogger.showLogModal) {
            callLogSection.handleLogSection(call);
          } else {
            callLogger.logCall({
              call,
            });
          }
        }}
        currentLocale={locale.currentLocale}
        logTitle={callLogger.logButtonTitle}
      />
    );
  };
  return ExtraCallLogButton;
}
