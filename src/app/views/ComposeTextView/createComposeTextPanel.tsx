import type { ComposeTextViewSpringOptions } from '@ringcentral-integration/micro-message/src/app/views/ComposeTextViewSpring/ComposeText.view.interface';
import { ComposeTextPanel } from '@ringcentral-integration/micro-message/src/app/views/ComposeTextViewSpring/ComposeTextPanel';
import type { ComponentProps, FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';

import {
  COMPOSE_TYPING_CONTEXT,
  type SmsTypingTimeTracker,
} from '../../services/SmsTypingTimeTracker';
import { TypingDuration } from '../ConversationView/TypingDuration';

type ComposeTextPanelProps = ComponentProps<typeof ComposeTextPanel>;

/**
 * Creates the compose text panel with the SMS typing duration in the message
 * input, pausing the typing session when the page is left with a draft.
 */
export function createComposeTextPanel(
  smsTypingTimeTracker: SmsTypingTimeTracker | undefined,
): NonNullable<ComposeTextViewSpringOptions['component']> {
  const TypingTimeComposeTextPanel: FunctionComponent<ComposeTextPanelProps> = (
    props,
  ) => {
    const latestMessageText = useRef(props.messageText);
    latestMessageText.current = props.messageText;

    useEffect(
      () => () => {
        if (!smsTypingTimeTracker) {
          return;
        }
        if (latestMessageText.current) {
          void smsTypingTimeTracker.pauseTyping(COMPOSE_TYPING_CONTEXT);
          return;
        }
        void smsTypingTimeTracker.clearTyping(COMPOSE_TYPING_CONTEXT);
      },
      [],
    );

    return (
      <ComposeTextPanel
        {...props}
        endAdornment={
          smsTypingTimeTracker ? (
            <>
              {props.endAdornment}
              <TypingDuration
                tracker={smsTypingTimeTracker}
                contextKey={COMPOSE_TYPING_CONTEXT}
              />
            </>
          ) : (
            props.endAdornment
          )
        }
      />
    );
  };
  return TypingTimeComposeTextPanel;
}
