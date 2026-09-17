import { HeaderPanel as BaseHeaderPanel } from '@ringcentral-integration/micro-core/src/app/views/HeaderView/HeaderPanel';
import type { HeaderViewProps } from '@ringcentral-integration/micro-core/src/app/views/HeaderView/Header.view.interface';
import type { PropsWithChildren } from 'react';
import React from 'react';

export function HeaderPanel(
  props: PropsWithChildren<HeaderViewProps>,
): JSX.Element {
  return (
    <div
      className="contents [&>div>header>div]:gap-0 [&>div>header>div>div]:flex-shrink-0 [&>div>header>div>i]:hidden [&>div>header>div>nav]:flex-1 [&>div>header>div>nav]:min-w-0 [&>div>header>div>nav]:justify-end [&>div>header>div>nav]:gap-1"
      data-sign="embeddableHeaderPanel"
    >
      <BaseHeaderPanel {...props} />
    </div>
  );
}
