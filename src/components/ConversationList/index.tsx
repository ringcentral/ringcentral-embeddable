import type { FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { Virtuoso, RcTypography } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ConversationList/i18n';

import type { MessageItemProps } from '../ConversationItem';
import { ConversationItem } from '../ConversationItem';

export type ConversationListProps = {
  brand: string;
  currentLocale: string;
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  conversations: {
    id?: number;
    conversationId: string;
    subject?: string;
  }[];
  disableLinks?: boolean;
  disableCallButton?: boolean;
  perPage?: number;
  className?: string;
  showConversationDetail: (...args: any[]) => any;
  readMessage: (...args: any[]) => any;
  markMessage: (...args: any[]) => any;
  unmarkMessage: (...args: any[]) => any;
  dateTimeFormatter: (...args: any[]) => any;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  showGroupNumberName?: boolean;
  placeholder?: string;
  typeFilter?: string;
  loadNextPage?: (...args: any[]) => any;
  loadingNextPage?: boolean;
  enableCDC?: boolean;
  maxExtensionNumberLength: number;
  formatPhone?: (formatPhone: string) => string | undefined;
  showLogButton?: boolean;
  logButtonTitle?: string;
  openMessageDetails: (id: number) => void;
  rcAccessToken?: string;
} & Omit<MessageItemProps, 'conversation'>;

const Loading = styled(RcTypography)`
  text-align: center;
  line-height: 40px;
  font-size: 14px;
`;

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overflow-y: auto;
  overflow-x: hidden;
  transform: translateZ(0);
`;

const ListFooter = ({
  context: { loadingNextPage, currentLocale }
}) => {
  if (loadingNextPage) {
    return (
      <Loading variant="body1" color="neutral.f05">
        {i18n.getString('loading', currentLocale)}
      </Loading>
    );
  }
  return null;
}

const ConversationList: FunctionComponent<ConversationListProps> = ({
  className = undefined,
  currentLocale,
  currentSiteCode = '',
  isMultipleSiteEnabled = false,
  conversations,
  perPage = 20,
  disableLinks = false,
  disableCallButton = false,
  placeholder = undefined,
  loadingNextPage = false,
  formatPhone,
  typeFilter = undefined,
  loadNextPage = undefined,
  showLogButton = false,
  logButtonTitle = '',
  dateTimeFormatter,
  showContactDisplayPlaceholder = true,
  sourceIcons = undefined,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  showGroupNumberName = false,
  enableCDC = false,
  openMessageDetails,
  rcAccessToken,
  ...childProps
}: ConversationListProps) => {
  const messagesListBodyRef = useRef(null);

  useEffect(() => {
    if (messagesListBodyRef.current) {
      messagesListBodyRef.current.scrollToIndex({
        index: 0,
        align: 'start',
        behavior: 'smooth',
      });
    }
  }, [typeFilter]);

  let content;
  if (conversations && conversations.length) {
    content = (
      <Virtuoso
        ref={messagesListBodyRef}
        style={{
          height: '100%',
          width: '100%',
        }}
        components={{
          Footer: ListFooter,
        }}
        context={{
          loadingNextPage,
          currentLocale,
        }}
        totalCount={conversations.length}
        data={conversations}
        itemContent={(index, item) => (
          <ConversationItem
            {...childProps}
            showContactDisplayPlaceholder={showContactDisplayPlaceholder}
            dateTimeFormatter={dateTimeFormatter}
            formatPhone={formatPhone}
            conversation={item}
            currentLocale={currentLocale}
            currentSiteCode={currentSiteCode}
            isMultipleSiteEnabled={isMultipleSiteEnabled}
            key={item.id}
            disableLinks={disableLinks}
            disableCallButton={disableCallButton}
            showLogButton={showLogButton}
            logButtonTitle={logButtonTitle}
            sourceIcons={sourceIcons}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
            showGroupNumberName={showGroupNumberName}
            enableCDC={enableCDC}
            openMessageDetails={openMessageDetails}
            rcAccessToken={rcAccessToken}
          />
        )}
        endReached={() => {
          if (typeof loadNextPage === 'function') {
            loadNextPage();
          }
        }}
      />
    );
  }
  return (
    <Root
      className={className}
      data-sign="conversationList"
    >
      {content}
    </Root>
  );
}

export default ConversationList;
