import React, { useState, useEffect } from 'react';
import {
  RcDrawer,
  RcTypography,
  RcIconButton,
  RcTabs,
  RcTab,
  RcIcon,
  styled,
  palette2,
  css,
} from '@ringcentral/juno';
import {
  Close,
  ContactsBorder,
  Contacts,
  Phone,
  PhoneBorder,
  AiIndicator,
  AiSparkle,
  Sms,
  SmsBorder,
  Voicemail,
  VoicemailBorder,
  Fax,
  FaxBorder,
  BubbleLines,
  BubbleLinesBorder,
  Note,
  NoteBorder,
  Apps,
} from '@ringcentral/juno-icon';
import { CallDetailsPage } from '../CallDetailsPage';
import { SmartNotesPage } from '../SmartNotesPage';
import ContactDetailsPage from '../ContactDetailsPage';
import { MessageDetailsPage } from '../MessageDetailsPage';
import ComposeTextPage from '../ComposeTextPage';
import { ConversationPage } from '../ConversationPage';
import { GlipChatPage } from '../GlipChatPage';
import LogCallPage from '../LogCallPage';
import LogMessagesPage from '../LogMessagesPage';
import { WidgetAppsPage } from '../WidgetAppsPage';
import type { WidgetContact } from '../../lib/widgetContact';

const StyledDrawer = styled(RcDrawer)`
  .RcDrawer-paper {
    width: 100%;
    height: 100%;
    background-color: ${palette2('neutral', 'b01')};
    display: flex;
    flex-direction: column;
    border-radius: 0;
  }

  &.MuiDrawer-docked {
    height: 100%;
    width: 50%;
    .RcDrawer-paper {
      width: 50%;
    }
  }
`;

const Header = styled.div<{ $showBorder?: boolean }>`
  position: relative;
  padding: 0;
  text-align: center;
  width: 100%;
  height: 40px;
  ${props => props.$showBorder && css`
    border-bottom: 1px solid ${palette2('neutral', 'l02')};
  `}
`;

const HeaderTitle = styled(RcTypography)`
  line-height: 40px;
`;

const CloseButton = styled(RcIconButton)`
  position: absolute;
  right: 6px;
  top: 0;
`;

const StyledTabs = styled(RcTabs)`
  background-color: ${palette2('neutral', 'b03')};
  padding: 4px 8px 0 8px;
  height: 36px;
  box-sizing: border-box;

  .RcTabs-indicator {
    display: none;
  }
`;

const StyledTab = styled(RcTab)`
  background-color: ${palette2('neutral', 'b03')};
  font-weight: 400;
  padding: 6px 16px 6px 16px;
  color: ${palette2('neutral', 'f06')};
  border-right: 1px solid ${palette2('neutral', 'l02')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  font-size: 0.875rem;
  line-height: 20px;
  box-sizing: border-box;
  height: 32px;

  &:last-child {
    border-right: none;
  }

  &.RcTab-selected {
    background-color: ${palette2('neutral', 'b01')};
    color: ${palette2('neutral', 'f06')};
    font-weight: 400;
    font-size: 0.875rem;
    border-bottom: 1px solid ${palette2('neutral', 'b01')};
    border-radius: 12px 12px 0 0;
    border-right: none;
    padding-right: 4px;

    .SideWidgetTabLabel {
      padding-right: 24px;
    }
  }

  .RcTab-wrapper > *:first-child {
    margin-right: 4px;
  }

  .RcTab-wrapper > .icon {
    font-size: 16px;
  }
`;

const StyledTabLabel = styled.span`
  display: inline-block;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-wrap: nowrap;
  position: relative;
`;

const TabCloseButton = styled(CloseButton)`
  right: 0;
`;

const WidgetWrapper = styled.div`
  flex: 1;
  overflow: hidden;
`;

const EmptyWidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
`;

const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  margin-top: 40%;
`;

const EmptyTitle = styled(RcTypography)`
  margin-bottom: 8px;
`;

const EmptyDescription = styled(RcTypography)`
  font-size: 0.875rem;
  text-align: center;
`;

function EmptyView({
  mainPath,
}) {
  let description = 'No widget view';
  let title = '';
  if (mainPath === '/contacts') {
    description = 'Select an item on the left for a more detailed look.'
  } else if (
    mainPath.indexOf('/messages') === 0 ||
    mainPath === '/history/recordings' ||
    mainPath === '/glip'
  ) {
    if (mainPath.indexOf('/messages/voicemail') === 0) {
      title = 'Voicemail summary';
    } else if (mainPath.indexOf('/messages/fax') === 0) {
      title = 'Fax summary';
    } else if (mainPath === '/messages') {
      title = 'Text details';
    } else if (mainPath === '/history/recordings') {
      title = 'Recording details';
    } else if (mainPath === '/glip') {
      title = 'Chat details';
    }
    description = 'For a detailed view, select an item from the list panel on the left.';
  }
  return (
    <EmptyWidgetContainer>
      <EmptyContent>
        {
          title && (
            <EmptyTitle color="neutral.f06" variant="subheading2">
              {title}
            </EmptyTitle>
          )
        }
        <EmptyDescription color="neutral.f05" variant='caption1'>
          {description}
        </EmptyDescription>
      </EmptyContent>
    </EmptyWidgetContainer>
  );
}

function getTabIcon(widget, active) {
  const widgetId = widget.id;
  if (widgetId === 'contactDetails') {
    return active ? Contacts : ContactsBorder;
  }
  if (widgetId === 'callDetails') {
    return active ? Phone : PhoneBorder;
  }
  if (widgetId === 'smartNotes') {
    return active ? AiIndicator : AiSparkle;
  }
  if (widgetId === 'messageDetails') {
    if (widget.params?.type === 'VoiceMail') {
      return active ? Voicemail : VoicemailBorder;
    }
    if (widget.params?.type === 'Fax') {
      return active ? Fax : FaxBorder;
    }
  }
  if (widgetId === 'messageDetails' || widgetId === 'composeText' || widgetId === 'conversation') {
    return active ? Sms : SmsBorder;
  }
  if (widgetId === 'glipChat') {
    return active ? BubbleLines : BubbleLinesBorder;
  }
  if (widgetId === 'logCall' || widgetId === 'logConversation') {
    return active ? Note : NoteBorder;
  }
  if (widgetId === 'widgetApps') {
    return Apps;
  }
  if (widget.icon) {
    return widget.icon;
  }
  return null;
}

const StyledTabImageIcon = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 8px;
`;

function TabIcon({
  widget,
  active,
}) {
  const icon = getTabIcon(widget, active);
  if (!icon) {
    return null;
  }
  if (typeof icon === 'string' && icon.indexOf("://") > 0) {
    return <StyledTabImageIcon src={icon} />;
  }
  return <RcIcon symbol={icon} size="medium" />;
}

function TabLabel({
  name,
  onClose,
  showCloseButton,
}) {
  return (
    <StyledTabLabel title={name} className="SideWidgetTabLabel">
      {name}
      {
        showCloseButton && (
          <TabCloseButton
            symbol={Close}
            onClick={onClose}
            size="xsmall"
            color="neutral.f06"
            component="span"
          />
        )
      }
    </StyledTabLabel>
  );
}

function Widget({
  widget,
  contactSourceRenderer,
  navigateTo,
  onAttachmentDownload,
  onClose,
  drawerVariant,
  withTab,
  contact,
  mainPath,
  sourceIcons,
}) {
  if (!widget) {
    return (<EmptyView mainPath={mainPath} />);
  }
  if (widget.id === 'callDetails') {
    return (<CallDetailsPage params={widget.params} sourceIcons={sourceIcons} />);
  }
  if (widget.id === 'smartNotes') {
    return (
      <SmartNotesPage
        showCloseButton={!withTab}
      />
    );
  }
  if (widget.id === 'messageDetails') {
    return (
      <MessageDetailsPage
        params={widget.params}
        showContactDisplayPlaceholder={false}
        sourceIcons={sourceIcons}
      />
    );
  }
  if (widget.id === 'composeText') {
    return (
      <ComposeTextPage
        supportAttachment
        hideBackButton={drawerVariant === 'permanent' || withTab}
        showCloseButton={drawerVariant === 'permanent' && !withTab}
        onClose={onClose}
        goBack={onClose}
      />
    );
  }
  if (widget.id === 'conversation') {
    return (
      <ConversationPage
        params={widget.params}
        showContactDisplayPlaceholder={false}
        showGroupNumberName
        supportAttachment
        onAttachmentDownload={onAttachmentDownload}
        hideBackButton={drawerVariant === 'permanent' || withTab}
        showCloseButton={drawerVariant === 'permanent' && !withTab}
        onClose={onClose}
        goBack={onClose}
        sourceIcons={sourceIcons}
      />
    );
  }
  if (widget.id === 'contactDetails') {
    return (
      <ContactDetailsPage
        params={widget.params}
        contactId={widget.params?.contactId}
        sourceNodeRenderer={contactSourceRenderer}
        onClickMailTo={
          (email) => {
            window.open(`mailto:${email}`);
          }
        }
        hideHeader
        navigateTo={navigateTo}
      />
    )
  }
  if (widget.id === 'glipChat') {
    return (
      <GlipChatPage
        params={widget.params}
        hideBackButton={drawerVariant === 'permanent' || withTab}
        showCloseButton={drawerVariant === 'permanent' && !withTab}
        onClose={onClose}
        onBack={onClose}
      />
    );
  }
  if (widget.id === 'logCall') {
    return (
      <LogCallPage
        params={widget.params}
        hideBackButton={drawerVariant === 'permanent' || withTab}
        showCloseButton={drawerVariant === 'permanent' && !withTab}
        onClose={onClose}
        onBackButtonClick={onClose}
      />
    );
  }
  if (widget.id === 'logConversation') {
    return (
      <LogMessagesPage
        params={widget.params}
        hideBackButton={drawerVariant === 'permanent' || withTab}
        showCloseButton={drawerVariant === 'permanent' && !withTab}
        onClose={onClose}
        onBackButtonClick={onClose}
      />
    );
  }
  if (widget.id === 'widgetApps') {
    return (
      <WidgetAppsPage
        contact={contact}
        showCloseButton={!withTab}
        onClose={onClose}
      />
    );
  }
  if (widget.id.indexOf('widgetApps-') === 0) {
    return (
      <WidgetAppsPage
        appId={widget.params?.appId}
        contact={contact}
        showCloseButton={!withTab}
        onClose={onClose}
      />
    );
  }
  return <EmptyView mainPath={mainPath} />;
}

const TabsPlaceholder = styled.div`
  height: 36px;
  background-color: ${palette2('neutral', 'b03')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
`;

function WidgetTabs({
  widgets,
  currentWidgetId,
  gotoWidget,
  closeWidget,
}) {
  const [tabs, setTabs] = useState(widgets);
  useEffect(() => {
    setTabs([]);
    setTimeout(() => {
      setTabs(widgets); // force update to fix tab no-re-render issue
    }, 0);
  }, [widgets, currentWidgetId]);

  if (tabs.length === 0) {
    return <TabsPlaceholder />;
  }

  const tabsList =
    tabs.map(widget => {
      return (
        <StyledTab
          disableRipple
          value={widget.id}
          icon={(
            <TabIcon
              widget={widget}
              active={currentWidgetId === widget.id}
            />
          )}
          label={(
            <TabLabel
              name={widget.name}
              onClose={(e) => {
                e && e.stopPropagation();
                closeWidget(widget.id);
              }}
              showCloseButton={currentWidgetId === widget.id}
            />
          )}
          key={widget.id}
          direction="vertical"
        />
      );
    });
  return (
    <StyledTabs
      value={currentWidgetId}
      onChange={(_, value) => gotoWidget(value)}
      variant="moreMenu"
      resizeThrottleTime={0}
      MoreButtonProps={{
        MenuProps: {
          MenuListProps: {
            className: 'SideWidgetMenuList',
          },
        },
      }}
    >
      {tabsList}
    </StyledTabs>
  );
};

export function SideDrawerView({
  variant = 'permanent',
  widgets = [],
  currentWidgetId,
  closeWidget,
  gotoWidget,
  contactSourceRenderer,
  navigateTo,
  extended,
  onAttachmentDownload,
  contact,
  mainPath,
  sourceIcons,
}: {
  variant: 'permanent' | 'temporary';
  widgets: any[];
  currentWidgetId: string | null;
  closeWidget: (widgetId: string | null) => void;
  gotoWidget: (widgetId: string) => void;
  contactSourceRenderer: any;
  navigateTo: (path: string) => void;
  extended: boolean;
  onAttachmentDownload: (attachment: any) => void;
  contact?: WidgetContact;
  mainPath: string;
  sourceIcons: any;
}) {
  let drawerVariant = variant;
  if (
    widgets.length === 0 &&
    (
      drawerVariant === 'temporary' ||
      !extended
    )) {
    return null;
  }
  const showTabs = widgets.length > 1;
  const widget = widgets.find((w) => w.id === currentWidgetId);
  const showCloseButton = !widget || widget.showCloseButton;
  const showTitleInHeader = !!(widget && widget.showTitle && widget.name);

  return (
    <StyledDrawer
      anchor="right"
      variant={drawerVariant}
      open={drawerVariant === 'temporary' ? !!widget : undefined}
      keepMounted={drawerVariant === 'temporary' ? true : undefined}
    >
      {
        showCloseButton && !showTabs && (
          <Header $showBorder={showTitleInHeader}>
            {
              showTitleInHeader && (
                <HeaderTitle variant="body1" color="neutral.f06">
                  {widget.name}
                </HeaderTitle>
              )
            }
            <CloseButton
              symbol={Close}
              onClick={() => closeWidget(currentWidgetId)}
              size="medium"
              data-sign="sideDrawerModalCloseButton"
            />
          </Header>
        )
      }
      {
        showTabs && (
          <WidgetTabs
            widgets={widgets}
            currentWidgetId={currentWidgetId}
            gotoWidget={gotoWidget}
            closeWidget={closeWidget}
          />
        )
      }
      {
        showCloseButton && showTabs && (
          <Header></Header>
        )
      }
      <WidgetWrapper
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
          }
        }}
      >
        <Widget
          widget={widget}
          contactSourceRenderer={contactSourceRenderer}
          navigateTo={navigateTo}
          onAttachmentDownload={onAttachmentDownload}
          onClose={() => closeWidget(currentWidgetId)}
          drawerVariant={drawerVariant}
          withTab={showTabs}
          contact={contact}
          mainPath={mainPath}
          sourceIcons={sourceIcons}
        />
      </WidgetWrapper>
    </StyledDrawer>
  );
}
