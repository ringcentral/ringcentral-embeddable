import { Block } from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

export interface DetailCardProps {
  children: ReactNode;
  'data-sign'?: string;
}

/**
 * A bordered card of detail fields, as the RingCX call detail pages stack
 * them under their contact header.
 */
export const DetailCard: FunctionComponent<DetailCardProps> = ({
  children,
  'data-sign': dataSign,
}) => (
  <Block className="mb-2" borderRadius="medium" data-sign={dataSign}>
    {children}
  </Block>
);
