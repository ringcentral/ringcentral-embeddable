import { Xmd } from '@ringcentral/spring-icon';
import {
  IconButton,
  PageHeader,
  PageHeaderCenter,
  PageHeaderLeft,
  PageHeaderRight,
  PageHeaderTitle,
} from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { type ReactNode } from 'react';

interface SideWidgetPageHeaderProps {
  title?: ReactNode;
  /** Shows the close button when set, such as when no tab bar is shown. */
  onClose?: () => void;
  closeLabel?: string;
  /** Marks the header; its center is marked with a `Center` suffix. */
  'data-sign'?: string;
  closeDataSign?: string;
  /** Separates the header from the page below it. @default true */
  bordered?: boolean;
}

/**
 * The header of a side widget page: a centered title and, while no tab bar
 * names the page, a close button.
 */
export function SideWidgetPageHeader({
  title,
  onClose,
  closeLabel,
  'data-sign': dataSign,
  closeDataSign,
  bordered = true,
}: SideWidgetPageHeaderProps): React.ReactElement {
  return (
    <PageHeader
      variant="detached"
      className={clsx('flex-none', bordered && 'border-b border-neutral-b4')}
      data-sign={dataSign}
    >
      <PageHeaderLeft />
      <PageHeaderCenter data-sign={dataSign ? `${dataSign}Center` : undefined}>
        {title ? <PageHeaderTitle>{title}</PageHeaderTitle> : null}
      </PageHeaderCenter>
      <PageHeaderRight>
        {onClose ? (
          <IconButton
            variant="icon"
            color="secondary"
            size="medium"
            symbol={Xmd}
            data-sign={closeDataSign}
            TooltipProps={{ title: closeLabel }}
            onClick={onClose}
          />
        ) : null}
      </PageHeaderRight>
    </PageHeader>
  );
}
