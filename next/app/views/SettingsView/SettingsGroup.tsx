import { Line } from '@ringcentral-integration/next-widgets/components';
import { CaretDownMd, CaretUpMd } from '@ringcentral/spring-icon';
import { Icon } from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactNode } from 'react';
import React, { useState } from 'react';

interface SettingsGroupProps {
  readonly children: ReactNode;
  readonly dataSign: string;
  readonly itemCount: number;
  readonly label: string;
}

/** Renders a collapsible nested group inside a settings section. */
export const SettingsGroup: FunctionComponent<SettingsGroupProps> = ({
  children,
  dataSign,
  itemCount,
  label,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (itemCount === 1) {
    return <>{children}</>;
  }
  return (
    <>
      <Line
        aria-expanded={isExpanded}
        data-sign={dataSign}
        endAdornment={<Icon symbol={isExpanded ? CaretUpMd : CaretDownMd} />}
        onClick={() => setIsExpanded((value) => !value)}
      >
        <span className="truncate">{label}</span>
      </Line>
      {isExpanded ? (
        <div className="ml-3 overflow-hidden rounded-lg">{children}</div>
      ) : null}
    </>
  );
};
