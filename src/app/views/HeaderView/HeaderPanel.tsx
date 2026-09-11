import { HeaderPanel as BaseHeaderPanel } from '@ringcentral-integration/micro-core/src/app/views/HeaderView/HeaderPanel';
import type { HeaderViewProps } from '@ringcentral-integration/micro-core/src/app/views/HeaderView/Header.view.interface';
import type { PropsWithChildren } from 'react';
import React from 'react';

export function HeaderPanel(
  props: PropsWithChildren<HeaderViewProps>,
): JSX.Element {
  return (
    <div
      className="contents [&>div>header>div]:gap-3"
      data-sign="embeddableHeaderPanel"
    >
      <BaseHeaderPanel {...props} />
    </div>
  );
}
