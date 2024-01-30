import type { FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { RcList } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ConversationList/i18n';

import type { MessageItemProps } from '../ConversationItem';
import MessageItem from '../ConversationItem';

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
  dateTimeFormatter?: (...args: any[]) => any;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  showGroupNumberName?: boolean;
  placeholder?: string;
  typeFilter?: string;
  loadNextPage?: (...args: any[]) => any;
  loadingNextPage?: boolean;
  renderExtraButton?: (...args: any[]) => any;
  enableCDC?: boolean;
  maxExtensionNumberLength: number;
  formatPhone?: (formatPhone: string) => string | undefined;
} & Omit<MessageItemProps, 'conversation'>;

const Loading = styled.div`
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

function ConversationList({
  className,
  currentLocale,
  currentSiteCode,
  isMultipleSiteEnabled,
  conversations,
  perPage,
  disableLinks,
  disableCallButton,
  placeholder,
  loadingNextPage,
  formatPhone,
  renderActionMenuExtraButton,
  typeFilter,
  loadNextPage,
  ...childProps
}): FunctionComponent<ConversationListProps> {
  const scrollTopRef = useRef(0);
  const messagesListBodyRef = useRef(null);

  useEffect(() => {
    if (messagesListBodyRef.current) {
      messagesListBodyRef.current.scrollTop = 0;
    }
  }, [typeFilter]);

  let content;
  if (conversations && conversations.length) {
    content = (
      <RcList>
        {
          conversations.map((item) => (
            <MessageItem
              {...childProps}
              formatPhone={formatPhone}
              conversation={item}
              currentLocale={currentLocale}
              currentSiteCode={currentSiteCode}
              isMultipleSiteEnabled={isMultipleSiteEnabled}
              key={item.id}
              disableLinks={disableLinks}
              disableCallButton={disableCallButton}
              renderActionMenuExtraButton={renderActionMenuExtraButton}
            />
          ))
        }
      </RcList>
    );
  }
  const loading = loadingNextPage ? (
    <Loading>
      {i18n.getString('loading', currentLocale)}
    </Loading>
  ) : null;
  return (
    <Root
      className={className}
      data-sign="conversationList"
      onScroll={() => {
        const totalScrollHeight = messagesListBodyRef.current.scrollHeight;
        const { clientHeight } = messagesListBodyRef.current;
        const currentScrollTop = messagesListBodyRef.current.scrollTop;
        // load next page if scroll near buttom
        if (
          totalScrollHeight - scrollTopRef.current > clientHeight + 10 &&
          totalScrollHeight - currentScrollTop <= clientHeight + 10
        ) {
          if (typeof loadNextPage === 'function') {
            loadNextPage();
          }
        }
        scrollTopRef.current = currentScrollTop;
      }}
      ref={messagesListBodyRef}
    >
      {content}
      {loading}
    </Root>
  );
}

// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
ConversationList.defaultProps = {
  currentSiteCode: '',
  isMultipleSiteEnabled: false,
  perPage: 20,
  className: undefined,
  disableLinks: false,
  disableCallButton: false,
  dateTimeFormatter: undefined,
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  showGroupNumberName: false,
  placeholder: undefined,
  loadNextPage: undefined,
  loadingNextPage: false,
  typeFilter: undefined,
  renderExtraButton: undefined,
  enableCDC: false,
};
export default ConversationList;
