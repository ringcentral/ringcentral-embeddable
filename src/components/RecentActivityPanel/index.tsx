import React from 'react';

import { styled, palette2, RcIcon, setOpacity } from '@ringcentral/juno';
import { ArrowDown2, ArrowUp2 } from '@ringcentral/juno-icon';
import { Header } from '@ringcentral-integration/widgets/components/Header';
import RecentActivityView from '@ringcentral-integration/widgets/components/RecentActivityView';
import expandable from '@ringcentral-integration/widgets/components/RecentActivityPanel/expandable';
import styles from '@ringcentral-integration/widgets/components/RecentActivityPanel/styles.scss';

const ToggleIcon = ({ expanded }: {
  expanded: boolean;
}) => (
  <RcIcon
    symbol={expanded ?  ArrowDown2 : ArrowUp2}
    size="medium"
  />
);

const Container = styled.div`
  width: 100%;
  height: 100%;
  background: ${palette2('neutral', 'b01')};
  box-shadow: 0 -2px 2px 0 ${palette2('neutral', 'l02')};

  .RecentActivityMessages_localMessageItem:hover {
    background: ${palette2('neutral', 'b02')};
  }
`;

const StyledHeader = styled(Header)`
  height: 27px;
  min-height: 27px;
  cursor: pointer;
  border-color: ${palette2('neutral', 'l02')};
  font-weight: normal;
  font-size: 15px;
`;

/**
 * RecentActivityPanel component provides a animated slide-out panel.
 */
const RecentActivityPanel = ({
  title,
  expanded,
  onPanelToggle,
  currentContact = null,
  className = undefined,
  showSpinner,
  tabs,
  defaultTab,
  trackClickTab,
}: {
  title: string;
  expanded: boolean;
  onPanelToggle: (...args: any[]) => any;
  currentContact: any;
  className?: string;
  showSpinner: boolean;
  tabs: any[];
  defaultTab: string;
  trackClickTab: (...args: any[]) => any;
}) => {
  const toggleButton = {
    label: <ToggleIcon expanded={expanded} />,
    onClick: onPanelToggle,
    placement: 'right',
  };
  if (!currentContact) {
    return null;
  }
  return (
    <Container className={className}>
      <StyledHeader
        buttons={[toggleButton]}
        onClick={onPanelToggle}
      >
        {title}
      </StyledHeader>
      <RecentActivityView
        currentContact={currentContact}
        showSpinner={showSpinner}
        tabs={tabs}
        defaultTab={defaultTab}
        trackClickTab={trackClickTab}
      />
    </Container>
  );
};

const ExpandableRecentActivityPanel = expandable({
  styles: {
    height: '200px',
    offset: '27px',
  },
  className: styles.expandable,
})(RecentActivityPanel);

export default ExpandableRecentActivityPanel;
