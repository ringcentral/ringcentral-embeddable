import {
  AppExpandedContent,
  AppProvider,
  useAppFooter,
  useAppHeader,
} from '@ringcentral-integration/micro-core/src/app/components';
import {
  injectable,
  RcViewModule,
  Root,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { type ReactElement, type ReactNode } from 'react';

interface ExpandedRouteViewProps {
  background: ReactNode;
  detail: ReactElement;
}

interface ProjectedPageProps {
  children?: ReactNode;
}

function ProjectedPage({ children }: ProjectedPageProps) {
  const { nav } = useAppHeader({ defaultNav: null });
  const { footer } = useAppFooter({
    defaultFooter: null,
    calculateHeight: false,
  });

  return (
    <div
      data-sign="expandedRoutePage"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-neutral-base"
    >
      <header data-sign="expandedRouteHeader" className="flex-none">
        {nav}
      </header>
      <div
        data-sign="expandedRouteBody"
        className="flex min-h-0 flex-auto flex-col overflow-hidden"
      >
        {children}
      </div>
      <div data-sign="expandedRouteFooter" className="flex-none">
        {footer}
      </div>
    </div>
  );
}

@injectable({
  name: 'ExpandedRouteView',
})
export class ExpandedRouteView extends RcViewModule {
  constructor(private _root: Root) {
    super();
  }

  component({ background, detail }: ExpandedRouteViewProps): ReactElement {
    const expanded = useConnector(() => this._root.expanded);
    if (!expanded) {
      return detail;
    }
    const projectedDetail: ReactNode = (
      <AppProvider>
        <ProjectedPage>{detail}</ProjectedPage>
      </AppProvider>
    );
    return (
      <>
        {background}
        <AppExpandedContent>{projectedDetail}</AppExpandedContent>
      </>
    );
  }
}
