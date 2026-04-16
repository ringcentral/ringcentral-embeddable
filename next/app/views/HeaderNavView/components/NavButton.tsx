import { Badge, Icon, Tooltip } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { forwardRef } from 'react';

import type { NavButtonProps } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';

export const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  (
    {
      active,
      activeSymbol,
      symbol,
      title,
      tooltip,
      dataSign,
      onClick,
      className,
      id,
      to,
      BadgeProps,
      TooltipProps,
      ...rest
    },
    ref,
  ) => {
    const currentIcon = active ? activeSymbol : symbol;
    const Button = (
      <button
        ref={ref}
        type="button"
        onClick={(e) => onClick?.(e, to)}
        className={clsx(
          'flex flex-col items-center justify-center',
          active ? 'text-cobranding-f' : 'text-neutral-b0',
          className,
        )}
        id={id}
        data-sign={dataSign}
        {...rest}
      >
        <div className="relative flex">
          <Icon symbol={currentIcon} size="medium" />
          <div className="absolute top-2 left-6">
            <Badge
              variant="outlined"
              overlap="rectangular"
              forceOverlap
              {...BadgeProps}
            />
          </div>
        </div>
        <div className="w-full overflow-hidden text-ellipsis typography-mainText">
          <span
            className="typography-descriptorMini whitespace-normal text-center"
            title={!tooltip ? title : undefined}
          >
            {title}
          </span>
        </div>
      </button>
    );

    if (!tooltip) {
      return Button;
    }

    return (
      <Tooltip title={tooltip} {...TooltipProps}>
        {Button}
      </Tooltip>
    );
  },
);
