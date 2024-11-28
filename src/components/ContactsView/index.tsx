import React, { Component } from 'react';

import PropTypes from 'prop-types';
import { includes } from 'ramda';
import { styled, RcIconButton, palette2 } from '@ringcentral/juno';
import { Refresh } from '@ringcentral/juno-icon';
import debounce from '@ringcentral-integration/commons/lib/debounce';

import ContactList from '@ringcentral-integration/widgets/components/ContactList';
import contactSourceI18n from '@ringcentral-integration/widgets/components/ContactSourceFilter/i18n';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import i18n from '@ringcentral-integration/widgets/components/ContactsView/i18n';

import { SubTabsView } from '../SubTabsView';
import { SearchLine } from '../SearchLine';

const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .ContactItem_root {
    background: ${palette2('neutral', 'b01')};
    border-bottom: 1px solid ${palette2('neutral', 'l02')};
    
    .ContactItem_contactName {
      color: ${palette2('neutral', 'f06')};
      font-family: 'Lato', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    }

    .ContactItem_phoneNumber {
      color: ${palette2('neutral', 'f05')};
      font-family: 'Lato', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    }
  }

  .ContactList_groupCaption {
    background-color: ${palette2('neutral', 'b03')};
    color: ${palette2('neutral', 'f06')};
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
`;

const PanelContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
  overflow-y: auto;
  width: 100%;
  height: 100%;
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledSpinnerOverlay = styled(SpinnerOverlay)`
  z-index: 2;
`;

const StyledRefreshButton = styled(RcIconButton)`
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
`;

const RefreshContacts = ({
  onRefresh,
  refreshing,
  currentLocale,
}) => {
  return (
    <StyledRefreshButton
      loading={refreshing}
      symbol={Refresh}
      onClick={onRefresh}
      title={i18n.getString('refresh', currentLocale)}
    />
  );
};

class ContactsView extends Component {
  // @ts-expect-error
  constructor(props) {
    super(props);
    this.state = {
      searchString: props.searchString,
      lastInputTimestamp: 0,
      unfold: false,
      contentHeight: 0,
      contentWidth: 0,
      refreshing: false,
    };
    // @ts-expect-error
    this.contactList = React.createRef();
    // @ts-expect-error
    this.contentWrapper = React.createRef();
    // @ts-expect-error
    this.onUnfoldChange = (unfold) => {
      this.setState({
        unfold,
      });
    };
  }

  calculateContentSize = () => {
    if (
      // @ts-expect-error
      this.contentWrapper &&
      // @ts-expect-error
      this.contentWrapper.current &&
      // @ts-expect-error
      this.contentWrapper.current.getBoundingClientRect
    ) {
      // @ts-expect-error

      const rect = this.contentWrapper.current.getBoundingClientRect();
      return {
        contentHeight: rect.bottom - rect.top,
        contentWidth: rect.right - rect.left,
      };
    }
    return {
      contentHeight: 0,
      contentWidth: 0,
    };
  };

  // @ts-expect-error
  componentDidMount() {
    // @ts-expect-error
    this._mounted = true;
    // @ts-expect-error
    const { onVisitPage } = this.props;
    if (typeof onVisitPage === 'function') {
      onVisitPage();
    }
    this.setState({
      ...this.calculateContentSize(),
    });
    window.addEventListener('resize', this.onResize);
  }

  // @ts-expect-error
  UNSAFE_componentWillUpdate(nextProps, nextState) {
    // @ts-expect-error
    const { lastInputTimestamp } = this.state;
    // @ts-expect-error
    const { searchString: searchStringProp } = this.props;
    // sync search string from other app instance
    const isNotEditing = Date.now() - lastInputTimestamp > 2000;
    if (isNotEditing && nextProps.searchString !== searchStringProp) {
      nextState.searchString = nextProps.searchString;
    }
    // default to the first contact source when current selected contact source is removed
    if (!includes(nextProps.searchSource, nextProps.contactSourceNames)) {
      // @ts-expect-error
      const { searchString } = this.state;
      this.search({
        searchSource: nextProps.contactSourceNames[0],
        searchString,
      });
    }
  }

  // @ts-expect-error
  componentWillUnmount() {
    // @ts-expect-error
    this._mounted = false;
    window.removeEventListener('resize', this.onResize);
  }

  // @ts-expect-error
  onSearchInputChange = (ev) => {
    this.setState(
      {
        searchString: ev.target.value,
        lastInputTimestamp: Date.now(),
      },
      () => {
        // @ts-expect-error
        const { searchString } = this.state;
        // @ts-expect-error
        const { searchSource } = this.props;
        this.search({
          searchString,
          searchSource,
        });
      },
    );
  };

  // @ts-expect-error
  onSourceSelect = (searchSource) => {
    if (
      // @ts-expect-error
      this.contactList &&
      // @ts-expect-error
      this.contactList.current &&
      // @ts-expect-error
      this.contactList.current.resetScrollTop
    ) {
      // @ts-expect-error
      this.contactList.current.resetScrollTop();
    }
    // @ts-expect-error
    const { searchString } = this.state;
    this.search({
      searchSource,
      searchString,
    });
  };

  onResize = debounce(() => {
    // @ts-expect-error
    if (this._mounted) {
      this.setState({
        ...this.calculateContentSize(),
      });
    }
  }, 300);

  onRefresh = async () => {
    // @ts-expect-error
    const { onRefresh } = this.props;
    if (typeof onRefresh === 'function') {
      this.setState({ refreshing: true }, async () => {
        await onRefresh();
        this.setState({ refreshing: false });
      });
    }
  };

  // @ts-expect-error
  search({ searchSource, searchString }) {
    // @ts-expect-error
    const { onSearchContact } = this.props;
    if (typeof onSearchContact === 'function') {
      onSearchContact({
        searchSource,
        searchString,
      });
    }
  }

  // @ts-expect-error
  render() {
    const {
      // @ts-expect-error
      currentLocale,
      // @ts-expect-error
      contactGroups,
      // @ts-expect-error
      contactSourceNames,
      // @ts-expect-error
      searchSource,
      // @ts-expect-error
      isSearching,
      // @ts-expect-error
      showSpinner,
      // @ts-expect-error
      getAvatarUrl,
      // @ts-expect-error
      getPresence,
      // @ts-expect-error
      onItemSelect,
      // @ts-expect-error
      sourceNodeRenderer,
      // @ts-expect-error
      onRefresh,
      // @ts-expect-error
      bottomNotice,
      // @ts-expect-error
      bottomNoticeHeight,
      children,
      // @ts-expect-error
      currentSiteCode,
      // @ts-expect-error
      isMultipleSiteEnabled,
    } = this.props;
    // @ts-expect-error
    const { refreshing, searchString, unfold, contentWidth, contentHeight } =
      this.state;

    const showRefresh = typeof onRefresh === 'function';
    const refreshButton = showRefresh ? (
      <RefreshContacts
        refreshing={refreshing}
        currentLocale={currentLocale}
        onRefresh={this.onRefresh}
      />
    ) : null;
    return (
      <SubTabsView
        currentPath={searchSource}
        tabs={contactSourceNames.map((source) => {
          return ({
            value: source,
            label: contactSourceI18n.getString(source, currentLocale),
          });
        })}
        goTo={this.onSourceSelect}
        variant="moreMenu"
      >
        <Container data-sign="contactList">
          <SearchInputContainer>
            <SearchLine
              searchInput={searchString || ''}
              dataSign="contactsSearchInput"
              onSearchInputChange={this.onSearchInputChange}
              placeholder={i18n.getString('searchPlaceholder', currentLocale)}
              clearBtn={false}
            />
            {refreshButton}
          </SearchInputContainer>
          <PanelContainer>
            <ContentWrapper
              ref={
                // @ts-expect-error
                this.contentWrapper
              }
            >
              <ContactList
                // @ts-expect-error
                ref={this.contactList}
                // @ts-expect-error
                currentLocale={currentLocale}
                contactGroups={contactGroups}
                getAvatarUrl={getAvatarUrl}
                getPresence={getPresence}
                onItemSelect={onItemSelect}
                currentSiteCode={currentSiteCode}
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                sourceNodeRenderer={sourceNodeRenderer}
                isSearching={isSearching}
                bottomNotice={bottomNotice}
                bottomNoticeHeight={bottomNoticeHeight}
                width={contentWidth}
                height={contentHeight}
              />
            </ContentWrapper>
          </PanelContainer>
          {showSpinner ? <StyledSpinnerOverlay /> : null}
          {children}
        </Container>
      </SubTabsView>
    );
  }
}

// @ts-expect-error
ContactsView.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  contactGroups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      caption: PropTypes.string.isRequired,
      contacts: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          name: PropTypes.string,
          extensionNumber: PropTypes.string,
          email: PropTypes.string,
          profileImageUrl: PropTypes.string,
          presence: PropTypes.object,
          contactStatus: PropTypes.string,
        }),
      ).isRequired,
    }),
  ).isRequired,
  contactSourceNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  getAvatarUrl: PropTypes.func.isRequired,
  getPresence: PropTypes.func.isRequired,
  showSpinner: PropTypes.bool.isRequired,
  currentSiteCode: PropTypes.string,
  isMultipleSiteEnabled: PropTypes.bool,
  searchSource: PropTypes.string,
  searchString: PropTypes.string,
  isSearching: PropTypes.bool,
  onItemSelect: PropTypes.func,
  onSearchContact: PropTypes.func,
  sourceNodeRenderer: PropTypes.func,
  onVisitPage: PropTypes.func,
  onRefresh: PropTypes.func,
  bottomNotice: PropTypes.func,
  bottomNoticeHeight: PropTypes.number,
  children: PropTypes.node,
};

// @ts-expect-error
ContactsView.defaultProps = {
  searchSource: undefined,
  searchString: undefined,
  isSearching: false,
  onItemSelect: undefined,
  onSearchContact: undefined,
  sourceNodeRenderer: undefined,
  onVisitPage: undefined,
  children: undefined,
  onRefresh: undefined,
  bottomNotice: undefined,
  bottomNoticeHeight: 0,
  currentSiteCode: '',
  isMultipleSiteEnabled: false,
};

export default ContactsView;
