import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import type { ContactRendererOptions } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo';
import {
  ContactAvatarByRenderInfo,
  ContactDisplayRender,
  type ContactDisplayRenderProps,
} from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/components';
import {
  getContactDisplayInfo,
  type ContactDisplayInfo,
} from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/utils';
import { useContainer } from '@ringcentral-integration/next-core';
import type { AvatarProps } from '@ringcentral/spring-ui';
import React, { useCallback, useMemo, type FC } from 'react';

export interface UseCxContactRenderInfoOptions {
  /** The customer-side number of the CX call. */
  phoneNumber?: string | null;
  /** Contact matches for `phoneNumber`, from the shared ContactMatcher. */
  matches?: readonly unknown[];
  /** A caller name the CX platform reported, such as a lead name. */
  serverName?: string | null;
  /**
   * Use `unknown` where the number is already shown elsewhere.
   *
   * @default 'phoneNumber'
   */
  phoneNumberDisplayMode?: 'unknown' | 'phoneNumber';
  /**
   * The contact the call resolved to, from `useCxCallContactSelection`. Shown
   * instead of the `Maybe: <name>` guess.
   */
  selection?: {
    displayedSelection: unknown;
    selections: readonly unknown[];
  };
}

export interface CxContactRenderInfo {
  renderInfo: ContactDisplayInfo;
  Avatar: FC<Pick<AvatarProps, 'size'>>;
  DisplayName: FC<Pick<ContactDisplayRenderProps, 'displayControl'>>;
}

/**
 * Resolve the contact display for a CX call with the same renderers the RingEX
 * call list and call control use, so both products show a matched contact,
 * multiple matches and an unmatched number the same way.
 *
 * CX queues are not RingEX call queues, so no queue name is passed: the CX
 * views show the queue in their own secondary line.
 */
export const useCxContactRenderInfo = ({
  phoneNumber,
  matches,
  serverName,
  phoneNumberDisplayMode = 'phoneNumber',
  selection,
}: UseCxContactRenderInfoOptions): CxContactRenderInfo => {
  const contactRendererOptions = useContainer<ContactRendererOptions, true>(
    'ContactRendererOptions',
  );
  const renderInfo = useMemo(
    () =>
      getContactDisplayInfo<Entity>({
        serverName,
        queueName: undefined,
        matches: (matches ?? []) as Entity[],
        phoneNumber,
        phoneNumberDisplayMode,
        displaySelection: selection?.displayedSelection as Entity | undefined,
        selections: selection?.selections as Entity[] | undefined,
        getDefaultCrmMatch: contactRendererOptions?.getDefaultCrmMatch as
          | ((items: Entity[]) => Entity | undefined)
          | undefined,
      }),
    [
      serverName,
      matches,
      phoneNumber,
      phoneNumberDisplayMode,
      selection?.displayedSelection,
      selection?.selections,
      contactRendererOptions?.getDefaultCrmMatch,
    ],
  );
  const Avatar = useCallback<CxContactRenderInfo['Avatar']>(
    ({ size }) => (
      <ContactAvatarByRenderInfo
        isQueue={false}
        isConferenceCall={false}
        renderInfo={renderInfo}
        size={size}
      />
    ),
    [renderInfo],
  );
  const DisplayName = useCallback<CxContactRenderInfo['DisplayName']>(
    ({ displayControl }) => (
      <ContactDisplayRender info={renderInfo} displayControl={displayControl} />
    ),
    [renderInfo],
  );
  return { renderInfo, Avatar, DisplayName };
};
