import React from 'react';
import { styled } from '@ringcentral/juno';

const StyledImage = styled.img`
  padding: 0;
  border: 0;
  line-height: 1;
`;

export default function ThirdPartyContactSourceIcon({
  iconUri,
  sourceName,
  className = undefined,
  width = '100%',
  height = '100%',
}) {
  return (
    <StyledImage src={iconUri} alt={sourceName} className={className} width={width} height={height} />
  );
}
