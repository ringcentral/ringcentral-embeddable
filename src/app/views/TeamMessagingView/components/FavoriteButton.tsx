import { StarFilledMd, StarMd } from '@ringcentral/spring-icon';
import { IconButton } from '@ringcentral/spring-ui';
import React from 'react';

import { t } from '../i18n';

/** A star that adds a chat to favorites, or removes it. */
export function FavoriteButton({
  isFavorite,
  size = 'small',
  onToggle,
}: {
  isFavorite: boolean;
  size?: 'small' | 'medium';
  onToggle: () => void;
}): React.ReactElement {
  return (
    <IconButton
      variant="icon"
      color="secondary"
      size={size}
      symbol={isFavorite ? StarFilledMd : StarMd}
      aria-pressed={isFavorite}
      data-sign={isFavorite ? 'removeFavoriteButton' : 'addFavoriteButton'}
      TooltipProps={{
        title: isFavorite ? t('removeFromFavorites') : t('addToFavorites'),
      }}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    />
  );
}
