import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { styled, palette2 } from '@ringcentral/juno';
import type {
  ContactDetailsViewFunctionProps,
  ContactDetailsViewProps,
} from '@ringcentral-integration/widgets/components/ContactDetailsView/ContactDetailsView.interface';
import i18n from '@ringcentral-integration/widgets/components/ContactDetailsView/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { ContactDetails } from './ContactDetails';

interface MessageHolderProps {
  children: string;
}
const MessageHolderWrapper = styled.div`
  color: ${palette2('neutral', 'f05')};
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
`;

const MessageHolder: FunctionComponent<MessageHolderProps> = ({ children }) => {
  return <MessageHolderWrapper>{children}</MessageHolderWrapper>;
};

const StyledPanel = styled.div`
  overflow: hidden;
  padding-top: 0;
  padding-bottom: 30px;
  position: relative;
  height: 100%;
  width: 100%;
  background-color: ${palette2('neutral', 'b01')};
  box-sizing: border-box;
`;

type AdditionProps = {
  hideHeader: boolean;
}

export const ContactDetailsView: FunctionComponent<
  ContactDetailsViewFunctionProps & ContactDetailsViewProps & AdditionProps
> = ({
  children,
  contact,
  currentLocale,
  isMultipleSiteEnabled,
  isCallButtonDisabled,
  disableLinks,
  showSpinner,
  formatNumber,
  canCallButtonShow,
  canTextButtonShow,
  onBackClick,
  onVisitPage,
  onLeavingPage,
  onClickMailTo,
  onClickToDial,
  onClickToSMS,
  sourceNodeRenderer,
  getPresence,
  hideHeader,
}) => {
  useEffect(() => {
    onVisitPage?.();

    return onLeavingPage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  let content = null;
  if (showSpinner) {
    content = (
      <MessageHolder>
        {i18n.getString('loadingContact', currentLocale)}
      </MessageHolder>
    );
  } else if (!contact) {
    content = (
      <MessageHolder>
        {i18n.getString('contactNotFound', currentLocale)}
      </MessageHolder>
    );
  } else {
    content = (
      <ContactDetails
        currentLocale={currentLocale}
        contact={contact}
        canCallButtonShow={canCallButtonShow}
        canTextButtonShow={canTextButtonShow}
        onClickToSMS={onClickToSMS}
        onClickToDial={onClickToDial}
        isMultipleSiteEnabled={isMultipleSiteEnabled}
        isCallButtonDisabled={isCallButtonDisabled}
        disableLinks={disableLinks}
        onClickMailTo={onClickMailTo}
        formatNumber={formatNumber}
        sourceNodeRenderer={sourceNodeRenderer}
        getPresence={getPresence}
      />
    );
  }

  return (
    <BackHeaderView
      dataSign="contactDetails"
      onBack={onBackClick}
      title={i18n.getString('contactDetails', currentLocale)}
      hideHeader={hideHeader}
    >
      <StyledPanel>
        {content}
        {children}
      </StyledPanel>
    </BackHeaderView>
  );
};
