import React from 'react';
import {
  RcDrawer,
  RcTypography,
  RcIconButton,
  RcTabs,
  RcTab,
  styled,
  palette2,
} from '@ringcentral/juno';
import { Close } from '@ringcentral/juno-icon';
import { CallDetailsPage } from '../CallDetailsPage';
import { SmartNotesPage } from '../SmartNotesPage';
import ContactDetailsPage from '../ContactDetailsPage';
import RecentActivityContainer from '../RecentActivityContainer';
import { MessageDetailsPage } from '../MessageDetailsPage';

const StyledDrawer = styled(RcDrawer)`
  .RcDrawer-paper {
    width: 100%;
    background-color: ${palette2('neutral', 'b01')};
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

const ActionLine = styled.div`
  position: relative;
  padding: 5px 6px;
  text-align: right;
`;

const StyledTabs = styled(RcTabs)`
  background-color: ${palette2('neutral', 'b03')};
  padding: 10px 5px 0 5px;

  .RcTabs-indicator {
    display: none;;
  }
`;

const StyledTab = styled(RcTab)`
  background-color: ${palette2('neutral', 'b03')};
  font-weight: 400;
  padding-top: 2px;
  padding-bottom: 2px;
  color: ${palette2('neutral', 'f05')};
  border-right: 1px solid ${palette2('neutral', 'l02')};
  border-bottom: 1px solid ${palette2('neutral', 'b03')};

  &:last-child {
    border-right: none;
  }

  &.RcTab-selected {
    background-color: ${palette2('neutral', 'b01')};
    color: ${palette2('neutral', 'f05')};
    font-weight: 400;
    border-radius: 5px 5px 0 0;
    border-bottom: 1px solid ${palette2('neutral', 'b01')};
    border-right: none;
  }
`;

function EmptyView() {
  return (
    <StyledTypography>
      No widget view
    </StyledTypography>
  );
}

function Widget({ widget, contactSourceRenderer, navigateTo }) {
  if (!widget) {
    return (<EmptyView />);
  }
  if (widget.id === 'callDetails') {
    return (<CallDetailsPage params={widget.params} />);
  }
  if (widget.id === 'smartNotes') {
    return (<SmartNotesPage />);
  }
  if (widget.id === 'messageDetails') {
    return (
      <MessageDetailsPage
        params={widget.params}
        showContactDisplayPlaceholder={false}
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
  return <EmptyView />;
}

export function SideDrawerView({
  variant = 'permanent',
  widgets,
  currentWidgetId,
  closeWidget,
  showTabs,
  contactSourceRenderer,
  navigateTo,
}: {
  variant: 'permanent' | 'temporary';
  widgets: any[];
  currentWidgetId: string | null;
  closeWidget: (widgetId: string) => void;
  showTabs: boolean;
  contactSourceRenderer: any;
  navigateTo: (path: string) => void;
}) {
  if (widgets.length === 0 && variant === 'temporary') {
    return null;
  }
  const widget = widgets.find((w) => w.id === currentWidgetId);
  let showCloseButton = widget?.showCloseButton ?? true;
  return (
    <StyledDrawer
      anchor="right"
      variant={variant}
      open={variant === 'temporary' ? !!widget : undefined}
      keepMounted={variant === 'temporary' ? true : undefined}
    >
      {
        showCloseButton && !showTabs && (
          <ActionLine>
            <RcIconButton
              symbol={Close}
              onClick={() => closeWidget(currentWidgetId)}
              size="medium"
            />
          </ActionLine>
        )
      }
      {
        showTabs && (
          <StyledTabs value={currentWidgetId}>
            {
              widgets.map(w => (
                <StyledTab
                  value={w.id}
                  label={w.name}
                  key={w.id}
                />
              ))
            }
          </StyledTabs>
        )
      }
     <Widget
       widget={widget}
       contactSourceRenderer={contactSourceRenderer}
       navigateTo={navigateTo}
      />
    </StyledDrawer>
  );
}
