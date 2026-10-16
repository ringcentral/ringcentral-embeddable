import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

export interface DetailFieldProps {
  label: string;
  value?: string;
  /** Rendered instead of `value`, such as a player. */
  children?: ReactNode;
  className?: string;
  'data-sign'?: string;
}

/**
 * A label over a one-line value, truncated with the full value as a tooltip.
 * Renders nothing when it has neither a value nor children.
 */
export const DetailField: FunctionComponent<DetailFieldProps> = ({
  label,
  value,
  children,
  className = '',
  'data-sign': dataSign,
}) => {
  if (!value && !children) {
    return null;
  }
  return (
    <div className={`min-w-0 ${className}`} data-sign={dataSign}>
      <div
        className="typography-descriptorMini text-neutral-b2 truncate"
        title={label}
      >
        {label}
      </div>
      {children ?? (
        <div
          className="typography-mainText text-neutral-b1 truncate"
          title={value}
        >
          {value}
        </div>
      )}
    </div>
  );
};
