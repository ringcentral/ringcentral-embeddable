import React from 'react';

import {
  styled,
} from '@ringcentral/juno';

const StyledImage = styled.img`
  display: block;
  max-width: 100%;
  height: auto;
`;

export function Image({
  schema,
  uiSchema = {},
  formData,
  onFocus,
  name,
}) {
  const src = formData || uiSchema['ui:src'] || schema.default;
  const alt = uiSchema['ui:alt'] || schema.title || '';
  const clickable = uiSchema['ui:clickable'] || false;
  const customStyle = uiSchema['ui:style'] || {};

  if (!src) {
    return null;
  }

  const imageStyle: React.CSSProperties = {
    ...customStyle,
    cursor: clickable ? 'pointer' : customStyle.cursor,
  };

  const handleClick = () => {
    if (clickable) {
      onFocus(name, '$$clicked');
    }
  };

  return (
    <StyledImage
      src={src}
      alt={alt}
      style={imageStyle}
      onClick={clickable ? handleClick : undefined}
    />
  );
}
