import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import { useConnector, useContainer } from '@ringcentral-integration/next-core';
import { useMemo } from 'react';

import { createThirdPartyActionButton } from '../../components/ThirdPartyActionButton';
import type { ThirdParty } from '../../services/ThirdParty';

/**
 * Buttons for the `messageAction` buttons the third-party service
 * registered. A click sends the conversation to the host as `resource`,
 * as 3.x did.
 */
export function useAdditionalMessageButtons(
  conversation: unknown,
  disabled?: boolean,
): ActionMenuListButtonProps[] {
  const thirdParty = useContainer<ThirdParty>('ThirdParty');
  const actions = useConnector(() => thirdParty.additionalMessageActions);
  return useMemo(
    () =>
      actions.map((action) =>
        createThirdPartyActionButton({
          action,
          disabled,
          onClick: (buttonId, resource) =>
            thirdParty.onClickAdditionalButton(buttonId, resource),
          resource: conversation,
        }),
      ),
    [actions, conversation, disabled, thirdParty],
  );
}
