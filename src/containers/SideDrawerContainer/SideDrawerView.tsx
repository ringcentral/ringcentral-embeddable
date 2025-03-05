import React from 'react';
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
import RecentActivityContainer from '../RecentActivityContainer';
import { MessageDetailsPage } from '../MessageDetailsPage';
import ComposeTextPage from '../ComposeTextPage';
import { ConversationPage } from '../ConversationPage';
import { GlipChatPage } from '../GlipChatPage';
import LogCallPage from '../LogCallPage';
import LogMessagesPage from '../LogMessagesPage';
import { ContactAppsPage } from '../ContactAppsPage';

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

const StyledTypography = styled(RcTypography)`
  text-align: center;
  padding-top: 50px;
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
  padding: 5px 5px 0 5px;

  .RcTabs-indicator {
    display: none;;
  }
`;

const StyledTab = styled(RcTab)`
  background-color: ${palette2('neutral', 'b03')};
  font-weight: 400;
  padding: 0 8px;
  padding-right: 0;
  color: ${palette2('neutral', 'f05')};
  border-right: 1px solid ${palette2('neutral', 'l02')};
  border-bottom: 1px solid ${palette2('neutral', 'b03')};
  font-size: 0.865rem;

  &:last-child {
    border-right: none;
  }

  &.RcTab-selected {
    background-color: ${palette2('neutral', 'b01')};
    color: ${palette2('neutral', 'f05')};
    font-weight: 400;
    border-radius: 8px 8px 0 0;
    border-bottom: 1px solid ${palette2('neutral', 'b01')};
    border-right: none;
  }

  .RcTab-wrapper > *:first-child {
    margin-right: 4px;
  }

  .RcTab-wrapper > .icon {
    font-size: 18px;
  }
`;

const WidgetWrapper = styled.div`
  flex: 1;
  overflow: hidden;
`;

function EmptyView() {
  return (
    <StyledTypography>
      No widget view
    </StyledTypography>
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
  if (widgetId === 'contactApps') {
    return Apps;
  }
  return null;
}

const StyledTabLabel = styled.span`
  display: inline-block;
  padding-right: 24px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-wrap: nowrap;
  position: relative;
`;

const TabCloseButton = styled(CloseButton)`
  right: 0;
`;

function TabLabel({
  name,
  onClose,
}) {
  return (
    <StyledTabLabel title={name}>
      {name}
      <TabCloseButton
        symbol={Close}
        onClick={onClose}
        size="xsmall"
        color="neutral.f06"
        component="span"
      />
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
}) {
  if (!widget) {
    return (<EmptyView />);
  }
  if (widget.id === 'callDetails') {
    return (<CallDetailsPage params={widget.params} />);
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
      >
        <RecentActivityContainer
          navigateTo={navigateTo}
          useContact
        />
      </ContactDetailsPage>
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
  if (widget.id === 'contactApps') {
    return (
      <ContactAppsPage
        params={widget.params}
      />
    );
  }
  return <EmptyView />;
}

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
          <StyledTabs
            value={currentWidgetId}
            onChange={(_, value) => gotoWidget(value)}
            variant="moreMenu"
          >
            {
              widgets.map(widget => {
                const icon = getTabIcon(widget, currentWidgetId === widget.id);
                return (
                  <StyledTab
                    disableRipple
                    value={widget.id}
                    icon={icon && <RcIcon symbol={icon} size="medium" />}
                    label={(
                      <TabLabel
                        name={widget.name}
                        onClose={(e) => {
                          e && e.stopPropagation();
                          closeWidget(widget.id);
                        }}
                      />
                    )}
                    key={widget.id}
                    direction="vertical"
                  />
                );
              })
            }
          </StyledTabs>
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
        />
      </WidgetWrapper>
    </StyledDrawer>
  );
}
