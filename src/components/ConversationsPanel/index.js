import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import messageTypes from 'ringcentral-integration/enums/messageTypes';
import Header from 'ringcentral-widgets/components/Header';
import SpinnerOverlay from 'ringcentral-widgets/components/SpinnerOverlay';
import MessageTabButton from 'ringcentral-widgets/components/MessageTabButton';
import NavigationBar from 'ringcentral-widgets/components/NavigationBar';
import SearchInput from 'ringcentral-widgets/components/SearchInput';
import ComposeText from 'ringcentral-widgets/assets/images/ComposeText.svg';
import NewComposeText from 'ringcentral-widgets/assets/images/NewComposeText.svg';
import NewComposeTextHover from 'ringcentral-widgets/assets/images/NewComposeTextHover.svg';
import styles from 'ringcentral-widgets/components/MessagesPanel/styles.scss';
import i18n from 'ringcentral-widgets/components/MessagesPanel/i18n';

import MessageList from '../ConversationList';
import newStyles from './styles.scss';

function TabTitle({
  type,
  currentLocale,
}) {
  return (
    <span className={styles.tabTitle}>
      {i18n.getString(type, currentLocale)}
    </span>
  );
}

TabTitle.propTypes = {
  type: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
};

export default class MessagesPanel extends Component {
  constructor(props) {
    super(props);

    this.onTabChanged = (type) => {
      if (typeof this.props.updateTypeFilter === 'function') {
        this.props.updateTypeFilter(type);
      }
    };
  }

  renderTabs() {
    const tabs = [
      {
        icon: <TabTitle type={messageTypes.all} currentLocale={this.props.currentLocale} />,
        label: i18n.getString(messageTypes.all, this.props.currentLocale),
        path: messageTypes.all,
        isActive: path => path === messageTypes.all,
      },
      this.props.readVoicemailPermission && {
        icon: <TabTitle type={messageTypes.voiceMail} currentLocale={this.props.currentLocale} />,
        label: i18n.getString(messageTypes.voiceMail, this.props.currentLocale),
        path: messageTypes.voiceMail,
        isActive: path => path === messageTypes.voiceMail,
        noticeCounts: this.props.voiceUnreadCounts,
      },
      this.props.readFaxPermission && {
        icon: <TabTitle type={messageTypes.fax} currentLocale={this.props.currentLocale} />,
        label: i18n.getString(messageTypes.fax, this.props.currentLocale),
        path: messageTypes.fax,
        isActive: path => path === messageTypes.fax,
        noticeCounts: this.props.faxUnreadCounts,
      },
      this.props.readTextPermission && {
        icon: <TabTitle type={messageTypes.text} currentLocale={this.props.currentLocale} />,
        label: i18n.getString(messageTypes.text, this.props.currentLocale),
        path: messageTypes.text,
        isActive: path => path === messageTypes.text,
        noticeCounts: this.props.textUnreadCounts,
      },
    ].filter(x => !!x);
    return (
      <NavigationBar
        button={MessageTabButton}
        className={styles.tabBar}
        currentPath={this.props.typeFilter}
        goTo={this.onTabChanged}
        tabs={tabs}
      />
    );
  }

  renderContent() {
    const {
      showSpinner,
      showTitle,
      searchInput,
      onSearchInputChange,
      currentLocale,
      perPage,
      disableLinks,
      conversations,
      brand,
      showConversationDetail,
      readMessage,
      markMessage,
      dateTimeFormatter,
      showContactDisplayPlaceholder,
      sourceIcons,
      showGroupNumberName,
      areaCode,
      countryCode,
      onLogConversation,
      onViewContact,
      onCreateContact,
      onClickToDial,
      onClickToSms,
      disableClickToDial,
      unmarkMessage,
      autoLog,
      enableContactFallback,
      deleteMessage,
      typeFilter,
      goToComposeText,
      composeTextPermission,
      previewFaxMessages,
      loadNextPage,
      loadingNextPage,
    } = this.props;
    if (showSpinner) {
      return (<SpinnerOverlay />);
    }
    const showTextIcon =
      composeTextPermission &&
      (typeFilter === messageTypes.all || typeFilter === messageTypes.text);
    const search = onSearchInputChange ?
      (
        <div
          className={
            classnames(styles.searchContainer, showTextIcon ? null : styles.withoutTextIcon)
          }
        >
          <SearchInput
            className={styles.searchInput}
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder={i18n.getString('search', currentLocale)}
            disabled={disableLinks}
          />
          <span
            title={i18n.getString('composeText', currentLocale)}
            className={styles.textIcon}
            onClick={goToComposeText}
          >
            <NewComposeTextHover className={styles.hoverTextSVGIcon} width={20} height={21} />
            <NewComposeText className={styles.textSVGIcon} width={20} height={21} />
          </span>
        </div>
      ) :
      null;
    const placeholder = onSearchInputChange && searchInput.length > 0 ?
      i18n.getString('noSearchResults', currentLocale) :
      i18n.getString('noMessages', currentLocale);
    return (
      <div
        className={classnames(
          styles.content,
          showTitle && styles.contentWithHeader
        )}
      >
        {search}
        <MessageList
          className={onSearchInputChange ? newStyles.contentWithSearch : null}
          currentLocale={currentLocale}
          perPage={perPage}
          disableLinks={disableLinks}
          conversations={conversations}
          brand={brand}
          showConversationDetail={showConversationDetail}
          readMessage={readMessage}
          markMessage={markMessage}
          dateTimeFormatter={dateTimeFormatter}
          showContactDisplayPlaceholder={showContactDisplayPlaceholder}
          sourceIcons={sourceIcons}
          showGroupNumberName={showGroupNumberName}
          placeholder={placeholder}
          areaCode={areaCode}
          countryCode={countryCode}
          onLogConversation={onLogConversation}
          onViewContact={onViewContact}
          onCreateContact={onCreateContact}
          onClickToDial={onClickToDial}
          onClickToSms={onClickToSms}
          disableClickToDial={disableClickToDial}
          unmarkMessage={unmarkMessage}
          autoLog={autoLog}
          enableContactFallback={enableContactFallback}
          deleteMessage={deleteMessage}
          previewFaxMessages={previewFaxMessages}
          loadNextPage={loadNextPage}
          loadingNextPage={loadingNextPage}
        />
      </div>
    );
  }

  render() {
    const {
      currentLocale,
      showTitle,
      showComposeText,
      goToComposeText,
    } = this.props;
    const buttons = [];
    if (showComposeText) {
      buttons.push({
        label: <ComposeText className={styles.composeText} />,
        onClick: goToComposeText,
        placement: 'right',
      });
    }
    const header = showTitle ?
      (
        <Header buttons={buttons}>
          {i18n.getString('title', currentLocale)}
        </Header>
      ) :
      null;
    const tabsHeader = this.renderTabs();
    const content = this.renderContent();
    return (
      <div className={styles.root}>
        {header}
        {tabsHeader}
        {content}
      </div>
    );
  }
}

MessagesPanel.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  showSpinner: PropTypes.bool,
  showTitle: PropTypes.bool,
  showContactDisplayPlaceholder: PropTypes.bool,
  sourceIcons: PropTypes.object,
  showComposeText: PropTypes.bool,
  goToComposeText: PropTypes.func.isRequired,
  typeFilter: PropTypes.string,
  updateTypeFilter: PropTypes.func,
  showConversationDetail: PropTypes.func.isRequired,
  textUnreadCounts: PropTypes.number.isRequired,
  voiceUnreadCounts: PropTypes.number.isRequired,
  faxUnreadCounts: PropTypes.number.isRequired,
  showGroupNumberName: PropTypes.bool,
  onClickToDial: PropTypes.func,
  onClickToSms: PropTypes.func,
  markMessage: PropTypes.func.isRequired,
  readMessage: PropTypes.func.isRequired,
  readTextPermission: PropTypes.bool,
  readVoicemailPermission: PropTypes.bool,
  readFaxPermission: PropTypes.bool,
  onSearchInputChange: PropTypes.func,
  searchInput: PropTypes.string,
  perPage: PropTypes.number,
  disableLinks: PropTypes.bool,
  conversations: PropTypes.array.isRequired,
  brand: PropTypes.string.isRequired,
  dateTimeFormatter: PropTypes.func,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  onLogConversation: PropTypes.func,
  onViewContact: PropTypes.func,
  onCreateContact: PropTypes.func,
  disableClickToDial: PropTypes.bool,
  unmarkMessage: PropTypes.func.isRequired,
  autoLog: PropTypes.bool,
  enableContactFallback: PropTypes.bool,
  deleteMessage: PropTypes.func,
  composeTextPermission: PropTypes.bool,
  previewFaxMessages: PropTypes.func,
  loadNextPage: PropTypes.func.isRequired,
  loadingNextPage: PropTypes.bool,
};

MessagesPanel.defaultProps = {
  showSpinner: false,
  showTitle: false,
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  showComposeText: false,
  typeFilter: messageTypes.all,
  updateTypeFilter: undefined,
  showGroupNumberName: false,
  onClickToDial: undefined,
  onClickToSms: undefined,
  readTextPermission: true,
  readVoicemailPermission: true,
  readFaxPermission: true,
  onSearchInputChange: undefined,
  searchInput: '',
  perPage: 20,
  disableLinks: false,
  dateTimeFormatter: undefined,
  onLogConversation: undefined,
  onViewContact: undefined,
  onCreateContact: undefined,
  disableClickToDial: false,
  autoLog: false,
  enableContactFallback: undefined,
  deleteMessage: undefined,
  composeTextPermission: true,
  previewFaxMessages: undefined,
  loadingNextPage: false,
};
