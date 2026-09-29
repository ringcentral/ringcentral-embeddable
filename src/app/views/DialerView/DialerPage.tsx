import type { Recipient } from '@ringcentral-integration/commons/modules/Call';
import { useFormattedPhoneNumberFn } from '@ringcentral-integration/micro-auth/src/app/components';
import { MyCallerIdDropdown } from '@ringcentral-integration/micro-phone/src/app/components/MyCallerIdDropdown';
import type { DialerViewPanelProps } from '@ringcentral-integration/micro-phone/src/app/views/DialerView/Dialer.view.interface';
import { SmartNotesMd } from '@ringcentral/spring-icon';
import {
  CallButton,
  Dialer,
  DialerPadSoundsMPEG,
  DialPad,
  IconButton,
} from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { forwardRef, useState } from 'react';

type DialerPageProps = {
  className?: string;
  readonly callButtonDisabledTooltip?: string;
} & DialerViewPanelProps;

/**
 * Host Phone dialer page with a RingCX-aware call-button tooltip.
 *
 * micro-phone's DialerPage has no tooltip prop, so this copy adds one for the
 * cross-product guard while a RingCX call is active.
 */
export const DialerPage = forwardRef<HTMLDivElement, DialerPageProps>(
  (
    {
      className,
      toNumber,
      callVolume,
      callButtonDisabled,
      callButtonDisabledTooltip,
      disableFromField,
      isWebphoneMode,
      fromNumber,
      fromNumbers,
      showAnonymous,
      changeFromNumber,
      onToNumberChange,
      onCallButtonClick,
      recipient,
      isSmartNoteEnabled,
      setRecipient,
      clearRecipient,
      ContactSearch: ToContactSearch,
    },
    ref,
  ) => {
    const [contactSearchExpanded, setContactSearchExpanded] = useState(false);
    const formatPhone = useFormattedPhoneNumberFn();
    return (
      <Dialer>
        <div
          ref={ref}
          className={clsx(
            'flex flex-col pt-3 gap-2 w-full h-full relative overflow-hidden',
            className,
          )}
        >
          {isWebphoneMode && (
            <div className="flex justify-center">
              <MyCallerIdDropdown
                showAnonymous={showAnonymous}
                disabled={disableFromField}
                value={fromNumber}
                onChange={(phoneNumber) =>
                  changeFromNumber({ phoneNumber: phoneNumber! })
                }
                options={fromNumbers}
              />
            </div>
          )}
          {ToContactSearch && (
            <ToContactSearch
              defaultTab="thirdParty"
              open={contactSearchExpanded}
              componentType="DialTextField"
              inputValue={toNumber}
              recipient={recipient}
              onInputValueChange={onToNumberChange}
              formatPhone={formatPhone}
              onSelect={async (selected: Recipient[]) => {
                await setRecipient(selected[0]);
                onCallButtonClick({ clickDialerToCall: true });
              }}
              onRemove={clearRecipient}
              onExpanded={setContactSearchExpanded}
            />
          )}
          <main
            className={clsx(
              'px-10 py-2 flex flex-col items-center flex-auto overflow-auto pb-2',
              contactSearchExpanded && 'hidden',
            )}
          >
            <DialPad
              data-sign="dialPad"
              volume={callVolume}
              sounds={DialerPadSoundsMPEG}
              size="medium"
              className="gap-y-2"
            />
            <div className="flex justify-center items-center pt-2">
              <CallButton
                variant="start"
                size="medium"
                disabled={callButtonDisabled}
                data-sign="callButton"
                aria-label="start call"
                TooltipProps={
                  callButtonDisabledTooltip
                    ? {
                        title: callButtonDisabledTooltip,
                        triggerWhenDisabled: callButtonDisabled,
                      }
                    : undefined
                }
                onClick={() => onCallButtonClick({ clickDialerToCall: true })}
              />
              {isSmartNoteEnabled && (
                <div className="flex items-center justify-center gap-1 absolute flex-col -translate-x-[72px] translate-y-2">
                  <IconButton
                    shape="squircle"
                    color="secondary"
                    symbol={SmartNotesMd}
                  />
                  <div className="typography-detail text-neutral-b2">
                    Notes off
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </Dialer>
    );
  },
);

DialerPage.displayName = 'DialerPage';
