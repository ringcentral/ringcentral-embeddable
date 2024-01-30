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
  duration,
  disabled,
  currentLocale,
  onPlay,
  className,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audio = useAudio((instance) => {
    instance.src = uri;
  });
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
    audio.addEventListener('ended', onAudioEnded);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('error', onAudioError);
    audio.addEventListener('timeupdate', onAudioTimeUpdate);
    return () => {
      audio.removeEventListener('ended', onAudioEnded);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('error', onAudioError);
      audio.removeEventListener('timeupdate', onAudioTimeUpdate);
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
        value={Math.round(currentTime / duration * 100)}
        onChange={(e, value) => {
          audio.currentTime = Math.round((value as number) / 100 * duration);
        }}
        disabled={!uri}
        valueLabelDisplay="off"
      />
      <RcTypography variant="caption1">
        {formatDuration(duration)}
      </RcTypography>
    </Container>
  );
}
