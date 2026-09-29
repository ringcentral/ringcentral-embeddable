import {
  useAppFooter,
  useAppHeader,
} from '@ringcentral-integration/micro-core/src/app/components';
import React, { type ReactNode } from 'react';

interface SideWidgetContentPageProps {
  children: ReactNode;
  onBack?: () => void;
  showCloseButton: boolean;
}

/**
 * Frames a content tab: the page's own header and footer, which it renders
 * through `AppHeaderNav` and `AppFooterNav`, around its body.
 */
export function SideWidgetContentPage({
  children,
  onBack,
  showCloseButton,
}: SideWidgetContentPageProps): React.ReactElement {
  const { nav } = useAppHeader({ defaultNav: null });
  const { footer } = useAppFooter({
    defaultFooter: null,
    calculateHeight: false,
  });
  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      !onBack ||
      !(event.target as Element).closest?.('[data-sign="backButton"]')
    ) {
      return;
    }
    // The page's back would navigate the router back through history, which
    // can reopen a tab the user already closed.
    event.preventDefault();
    event.stopPropagation();
    onBack();
  };
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-neutral-base"
      onClickCapture={handleClickCapture}
    >
      <header
        className={
          showCloseButton
            ? 'flex-none'
            : 'flex-none [&_[data-sign=backButton]]:hidden'
        }
      >
        {nav}
      </header>
      <div className="flex min-h-0 flex-auto flex-col overflow-hidden">
        {children}
      </div>
      <footer className="flex-none">{footer}</footer>
    </div>
  );
}
