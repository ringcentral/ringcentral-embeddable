import {
  AppFooterNav,
  AppHeaderNav,
  CopyIconButtonSpring,
} from '@ringcentral-integration/micro-core/src/app/components';
import {
  getDetail,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/ConversationsListItem/helpers';
import {
  ActionMenuList,
  PageHeader,
  useHistoryActionButtons,
} from '@ringcentral-integration/next-widgets/components';
import { Block, BlockHeader } from '@ringcentral/spring-ui';
import React, { type FunctionComponent } from 'react';

import type { FaxDetailsPanelProps } from './FaxDetails.view.interface';

export const FaxDetailsPanel: FunctionComponent<FaxDetailsPanelProps> = ({
  fax,
  goBack,
  useActionsHandler,
  useConversationItemInfo,
}) => {
  const { actions, info } = useConversationItemInfo(fax);
  const onAction = useActionsHandler(fax, info, 'Fax detail page');
  const buttons = useHistoryActionButtons(actions, onAction);
  const {
    Avatar,
    DisplayName,
    creationTime,
    formattedPhoneNumber,
    myCallerId,
    myCallerIdTitle,
  } = info;
  const hasSelfNumber = Boolean(
    fax.self?.extensionNumber || fax.self?.phoneNumber,
  );

  return (
    <>
      <AppHeaderNav override>
        <PageHeader onBackClick={goBack} />
      </AppHeaderNav>
      <div
        className="mt-3 mb-4 flex flex-col gap-4 items-center"
        data-sign="faxDetails"
      >
        <Avatar size="xxlarge" />
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <h2 className="typography-title w-full truncate text-center text-neutral-b0">
            <DisplayName
              displayControl={{
                align: 'center',
                matchCounts: true,
                maybe: true,
              }}
            />
          </h2>
          {formattedPhoneNumber ? (
            <div className="flex items-center gap-1">
              <p
                className="typography-subtitle truncate text-neutral-b2"
                title={formattedPhoneNumber}
              >
                {formattedPhoneNumber}
              </p>
              <CopyIconButtonSpring getText={() => formattedPhoneNumber} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-nowrap gap-6">
          <ActionMenuList buttons={buttons} variant="plain" />
        </div>
      </div>
      <div className="px-3 py-2">
        {hasSelfNumber ? (
          <Block className="mb-2">
            <BlockHeader>
              <span className="typography-descriptorMini">
                {myCallerIdTitle}
              </span>
              <div className="typography-mainText text-neutral-b2">
                {myCallerId}
              </div>
            </BlockHeader>
          </Block>
        ) : null}
        <Block>
          <BlockHeader>
            <span
              className="typography-descriptorMini"
              data-sign="faxCreationTime"
            >
              {creationTime}
            </span>
            <div
              className="typography-mainText text-neutral-b2"
              data-sign="faxSummary"
            >
              {getDetail(fax)}
            </div>
          </BlockHeader>
        </Block>
      </div>
      <AppFooterNav />
    </>
  );
};
