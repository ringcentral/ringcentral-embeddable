import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  VoicemailPlayer,
  type VoicemailAudioStatus,
} from '@ringcentral-integration/micro-message/src/app/components';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { LeadRecordingPlayerProps } from './LeadInfoPanel.interface';
import i18n from './i18n';

const BLOB_URL_PREFIX = 'blob:';

/**
 * Plays a lead field's VRU recording, loaded only once the agent presses play,
 * as Agent One's "Play recording" popover does.
 */
export const LeadRecordingPlayer: FunctionComponent<
  LeadRecordingPlayerProps
> = ({ value, loadRecording }) => {
  const { t } = useLocale(i18n);
  const [audioStatus, setAudioStatus] = useState<VoicemailAudioStatus>();
  const sourceRef = useRef<string>();
  useEffect(
    () => () => {
      if (sourceRef.current?.startsWith(BLOB_URL_PREFIX)) {
        URL.revokeObjectURL(sourceRef.current);
      }
    },
    [],
  );
  const onStartLoad = useCallback(async () => {
    try {
      const source = await loadRecording(value);
      sourceRef.current = source;
      setAudioStatus((status) => ({ ...status, blobUrl: source }));
    } catch {
      setAudioStatus((status) => ({
        ...status,
        loading: false,
        isPlaying: false,
        isNetworkError: true,
      }));
    }
  }, [loadRecording, value]);
  return (
    <div aria-label={t('playRecording')}>
      <VoicemailPlayer
        data-sign="leadRecordingPlayer"
        uri={value}
        audioStatus={audioStatus}
        updateAudioStatus={setAudioStatus}
        onStartLoad={onStartLoad}
        loadSourceExternally
      />
      {audioStatus?.isNetworkError ? (
        <div
          className="typography-descriptorMini text-danger-f"
          data-sign="leadRecordingError"
        >
          {t('recordingUnavailable')}
        </div>
      ) : null}
    </div>
  );
};
