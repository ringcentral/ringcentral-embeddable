import React from 'react';

import { List } from 'react-virtualized';

import NoCalls from '@ringcentral-integration/widgets/components/NoCalls';

import { CallItem } from '../CallItem';

type CallListV2Props = {
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  className?: string;
  width: number;
  height: number;
  brand: string;
  currentLocale: string;
  calls: any[];
  active?: boolean;
  areaCode: string;
  countryCode: string;
  onViewContact?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  createEntityTypes?: any[];
  onLogCall?: (...args: any[]) => any;
  onClickToDial?: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  isLoggedContact?: (...args: any[]) => any;
  loggingMap?: any;
  disableLinks?: boolean;
  disableCallButton?: boolean;
  disableClickToDial?: boolean;
  outboundSmsPermission?: boolean;
  internalSmsPermission?: boolean;
  dateTimeFormatter: (...args: any[]) => any;
  webphoneAnswer?: (...args: any[]) => any;
  webphoneReject?: (...args: any[]) => any;
  webphoneHangup?: (...args: any[]) => any;
  webphoneResume?: (...args: any[]) => any;
  enableContactFallback?: boolean;
  autoLog?: boolean;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  renderContactName?: (...args: any[]) => any;
  renderSubContactName?: (...args: any[]) => any;
  renderExtraButton?: (...args: any[]) => any;
  contactDisplayStyle?: string;
  externalViewEntity?: (...args: any[]) => any;
  externalHasEntity?: (...args: any[]) => any;
  readTextPermission?: boolean;
  rowHeight?: number;
  extendedRowHeight?: number;
  showChooseEntityModal?: boolean;
  enableCDC?: boolean;
  maxExtensionNumberLength: number;
  formatPhone: (phoneNumber: string) => string | undefined;
  showLogButton: boolean;
  logButtonTitle: string;
};
type CallListV2State = {
  extendedIndex: null;
};
class CallListV2 extends React.PureComponent<CallListV2Props, CallListV2State> {
  _list: any;
  constructor(props: any) {
    super(props);
    this.state = {
      extendedIndex: null,
    };
    this._list = React.createRef();
  }

  _renderRowHeight = ({ index }: any) => {
    return 60;
  };

  _rowRender = ({ index, key, style }: any) => {
    const {
      className,
      brand,
      currentLocale,
      calls,
      areaCode,
      countryCode,
      onViewContact,
      onCreateContact,
      createEntityTypes,
      onLogCall,
      onClickToDial,
      onClickToSms,
      isLoggedContact,
      disableLinks,
      disableCallButton,
      disableClickToDial,
      outboundSmsPermission,
      internalSmsPermission,
      active,
      dateTimeFormatter,
      loggingMap,
      webphoneAnswer,
      webphoneReject,
      webphoneHangup,
      webphoneResume,
      enableContactFallback,
      autoLog,
      showContactDisplayPlaceholder,
      sourceIcons,
      phoneTypeRenderer,
      phoneSourceNameRenderer,
      renderContactName,
      renderSubContactName,
      renderExtraButton,
      contactDisplayStyle,
      externalViewEntity,
      externalHasEntity,
      readTextPermission,
      currentSiteCode,
      isMultipleSiteEnabled,
      showChooseEntityModal,
      enableCDC,
      maxExtensionNumberLength,
      formatPhone,
      showLogButton,
      logButtonTitle,
    } = this.props;
    const { extendedIndex } = this.state;
    let content;
    if (index >= calls.length) {
      content = (
        <div className={className}>
          <NoCalls currentLocale={currentLocale} active={active} />
        </div>
      );
    } else {
      const call = calls[index];
      content = (
        <CallItem
          formatPhone={formatPhone}
          key={call.id}
          renderIndex={index}
          extended={extendedIndex === index}
          call={call}
          currentLocale={currentLocale}
          currentSiteCode={currentSiteCode}
          isMultipleSiteEnabled={isMultipleSiteEnabled}
          brand={brand}
          areaCode={areaCode}
          countryCode={countryCode}
          onViewContact={onViewContact}
          onCreateContact={onCreateContact}
          createEntityTypes={createEntityTypes}
          onLogCall={onLogCall}
          onClickToDial={onClickToDial}
          onClickToSms={onClickToSms}
          isLoggedContact={isLoggedContact}
          disableLinks={disableLinks}
          disableCallButton={disableCallButton}
          disableClickToDial={disableClickToDial}
          outboundSmsPermission={outboundSmsPermission}
          internalSmsPermission={internalSmsPermission}
          active={!!active}
          dateTimeFormatter={dateTimeFormatter}
          isLogging={!!loggingMap[call.sessionId]}
          enableContactFallback={enableContactFallback}
          autoLog={autoLog}
          showContactDisplayPlaceholder={showContactDisplayPlaceholder}
          sourceIcons={sourceIcons}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          renderContactName={renderContactName}
          renderSubContactName={renderSubContactName}
          renderExtraButton={renderExtraButton}
          contactDisplayStyle={contactDisplayStyle}
          externalViewEntity={externalViewEntity}
          externalHasEntity={externalHasEntity}
          readTextPermission={readTextPermission}
          // disable animation when rendered with react-virtualized
          withAnimation={false}
          showChooseEntityModal={showChooseEntityModal}
          enableCDC={enableCDC}
          maxExtensionNumberLength={maxExtensionNumberLength}
          showLogButton={showLogButton}
          logButtonTitle={logButtonTitle}
        />
      );
    }
    return (
      <div key={key} style={style}>
        {content}
      </div>
    );
  };
  noRowsRender = () => {
    const { currentLocale, active } = this.props;
    return <NoCalls currentLocale={currentLocale} active={active} />;
  };

  override render() {
    const { width, height, calls, className } = this.props;
    return (
      <div>
        <List
          style={{ outline: 'none', overflowY: 'auto' }}
          containerStyle={{ overflow: 'visible' }}
          ref={this._list}
          width={width}
          height={height}
          overscanRowCount={15}
          className={className}
          rowCount={calls.length}
          rowHeight={this._renderRowHeight}
          rowRenderer={this._rowRender}
          noRowsRenderer={this.noRowsRender}
        />
      </div>
    );
  }
}
// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
CallListV2.defaultProps = {
  currentSiteCode: '',
  isMultipleSiteEnabled: false,
  className: null,
  active: false,
  disableLinks: false,
  disableCallButton: false,
  disableClickToDial: false,
  outboundSmsPermission: false,
  internalSmsPermission: false,
  onViewContact: undefined,
  onCreateContact: undefined,
  createEntityTypes: undefined,
  onLogCall: undefined,
  isLoggedContact: undefined,
  onClickToDial: undefined,
  onClickToSms: undefined,
  loggingMap: {},
  webphoneAnswer: undefined,
  webphoneReject: undefined,
  webphoneHangup: undefined,
  webphoneResume: undefined,
  enableContactFallback: undefined,
  showContactDisplayPlaceholder: true,
  autoLog: false,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  renderContactName: undefined,
  renderSubContactName: undefined,
  renderExtraButton: undefined,
  contactDisplayStyle: undefined,
  externalViewEntity: undefined,
  externalHasEntity: undefined,
  readTextPermission: true,
  rowHeight: 65,
  extendedRowHeight: 130,
  showChooseEntityModal: true,
  enableCDC: false,
};
export default CallListV2;
