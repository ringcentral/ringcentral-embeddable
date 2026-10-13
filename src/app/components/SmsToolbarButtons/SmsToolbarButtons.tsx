import { useConnector, useContainer } from '@ringcentral-integration/next-core';
import { AppsMd } from '@ringcentral/spring-icon';
import { Icon, IconButton } from '@ringcentral/spring-ui';
import React from 'react';

import type { ThirdParty } from '../../services/ThirdParty';

/**
 * `smsToolbar` button icons are image URLs, as in 3.x.
 */
function isImageUri(icon: string | undefined): icon is string {
  return Boolean(icon && /^(https?:|data:image\/|\/)/.test(icon));
}

/**
 * The `smsToolbar` buttons the third-party service registered, shown in the
 * message input toolbar. A click sends only the button to the host, as 3.x
 * did.
 */
export function SmsToolbarButtons(): React.ReactElement | null {
  const thirdParty = useContainer<ThirdParty>('ThirdParty');
  const buttons = useConnector(() => thirdParty.additionalSMSToolbarButtons);
  if (buttons.length === 0) {
    return null;
  }
  return (
    <>
      {buttons.map((button) => (
        <IconButton
          key={button.id}
          variant="icon"
          size="large"
          color="secondary"
          className="text-neutral-b2"
          data-sign={`smsToolbarButton-${button.id}`}
          TooltipProps={{ title: button.label || button.id }}
          // Keep the input focused, as the template button does.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            void thirdParty.onClickAdditionalButton(button.id);
          }}
        >
          {isImageUri(button.icon) ? (
            <img
              src={button.icon}
              alt={button.label || button.id}
              className="size-5 object-contain"
            />
          ) : (
            <Icon symbol={AppsMd} size="medium" />
          )}
        </IconButton>
      ))}
    </>
  );
}
