import React from 'react';
import { RcDrawer, RcTypography, RcIconButton, styled } from '@ringcentral/juno';
import { Close } from '@ringcentral/juno-icon';
import { CallDetailsPage } from '../../containers/CallDetailsPage';
import { SmartNotesPage } from '../../containers/SmartNotesPage';

const StyledDrawer = styled(RcDrawer)`
  .RcDrawer-paper {
    width: 100%;
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

function EmptyView() {
  return (
    <StyledTypography>
      No widget view
    </StyledTypography>
  );
}

function Widget({ widget }) {
  if (!widget) {
    return <EmptyView />;
  }
  if (widget.id === 'callDetails') {
    return <CallDetailsPage params={widget.params} />;
  }
  if (widget.id === 'smartNotes') {
    return <SmartNotesPage />;
  }
  return <EmptyView />;
}

export function SideDrawerView({
  show,
  variant = 'permanent',
  widgets,
  currentWidgetId,
  closeWidget,
}) {

  if (!show && variant === 'permanent') {
    return null;
  }
  const widget = widgets.find((w) => w.id === currentWidgetId);
  let showCloseButton = widget?.showCloseButton ?? true;
  return (
    <StyledDrawer
      anchor="right"
      variant={variant as "permanent" | "temporary"}
      open={show}
      keepMounted={variant === 'temporary' ? true : undefined}
    >
      {
        showCloseButton && (
          <ActionLine>
            <RcIconButton
              symbol={Close}
              onClick={() => closeWidget(currentWidgetId)}
              size="medium"
            />
          </ActionLine>
        )
      }
     <Widget widget={widget} />
    </StyledDrawer>
  );
}
