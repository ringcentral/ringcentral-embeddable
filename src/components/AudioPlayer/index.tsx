import React, { useState, useEffect } from 'react';
import {
  useAudio,
  RcIconButton,
  RcSlider,
  RcTypography,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';
import { Play, Pause } from '@ringcentral/juno-icon';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import i18n from '@ringcentral-integration/widgets/components/VoicemailPlayer/i18n';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledRcIconButton = styled(RcIconButton)`
  margin-right: 10px;
`;

const StyledProgress = styled(RcSlider)`
  margin: 0 10px;
`;

export function AudioPlayer({
  uri,
  disabled,
  currentLocale,
  onPlay = () => {},
  className = undefined,
  duration: propDuration = 0,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration);
  const audio = useAudio();
  useEffect(() => {
    // reset audio when uri changed
    audio.src = uri;
    audio.currentTime = 0;
    return () => {
      setIsPlaying(false);
      audio.pause();
    }
  }, [uri]);

  useEffect(() => {
    const onAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onAudioPause = () => {
      setIsPlaying(false);
    };
    const onAudioPlay = () => {
      setIsPlaying(true);
    };
    const onAudioError = () => {
      setIsPlaying(false);
    };
    const onAudioTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    audio.addEventListener('ended', onAudioEnded);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('error', onAudioError);
    audio.addEventListener('timeupdate', onAudioTimeUpdate);
    if (audio.readyState >= 2 && audio.duration) {
      setDuration(audio.duration);
    }
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('ended', onAudioEnded);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('error', onAudioError);
      audio.removeEventListener('timeupdate', onAudioTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [audio]);
  
  return(
    <Container className={className}>
      <StyledRcIconButton
        variant="plain"
        focusVariant="focusRing"
        symbol={isPlaying ? Pause : Play}
        size="small"
        onClick={() => {
          if (isPlaying) {
            audio.pause();
          } else {
            audio.play();
            onPlay();
          }
        }}
        color="action.primary"
        disabled={!uri || disabled}
        title={i18n.getString(isPlaying ? 'pause' : 'play', currentLocale)}
      />
      <RcTypography variant="caption1">
        {formatDuration(currentTime)}
      </RcTypography>
      <StyledProgress
        color="action.primary"
        value={duration ? Math.round(currentTime / duration * 100) : 0}
        onChange={(e, value) => {
          audio.currentTime = Math.round((value as number) / 100 * duration);
        }}
        disabled={!uri}
        valueLabelDisplay="off"
      />
      {
        duration ? (
          <RcTypography variant="caption1">
            {formatDuration(duration)}
          </RcTypography>
        ) : null
      }
    </Container>
  );
}
