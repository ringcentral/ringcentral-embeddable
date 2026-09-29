import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Announcement } from '@ringcentral/spring-ui';
import React, { type FunctionComponent } from 'react';

import type { AudioInitViewProps } from './AudioInitView.interface';
import i18n from './i18n';

export const AudioInitPanel: FunctionComponent<
  Omit<AudioInitViewProps, 'show'>
> = ({ onEnableAudio, ...rest }) => {
  const { t } = useLocale(i18n);
  return (
    <Announcement
      severity="info"
      className="rounded-none"
      classes={{
        body: 'gap-2',
        action: 'self-center',
      }}
      data-sign="initializeAudioBanner"
      action={
        <button
          className="typography-subtitleMini hover:underline active:opacity-80 shrink-0 whitespace-nowrap"
          onClick={onEnableAudio}
          data-sign="initializeAudioButton"
        >
          {t('initializeAudio')}
        </button>
      }
      {...rest}
    >
      {t('audioDisabled')}
    </Announcement>
  );
};
