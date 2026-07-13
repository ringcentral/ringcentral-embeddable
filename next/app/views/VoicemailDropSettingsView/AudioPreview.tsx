import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { PlayMd, StopMd } from '@ringcentral/spring-icon';
import { IconButton, Slider, Text } from '@ringcentral/spring-ui';
import React, { useEffect, useRef, useState } from 'react';

export function AudioPreview({
  source,
  name,
  playLabel,
  stopLabel,
}: {
  source?: string;
  name: string;
  playLabel: string;
  stopLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!source || typeof Audio === 'undefined') {
      audioRef.current = null;
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return undefined;
    }

    const audio = new Audio(source);
    audioRef.current = audio;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const stop = () => {
      setPlaying(false);
      setCurrentTime(audio.currentTime);
    };
    const finish = () => {
      setPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('pause', stop);
    audio.addEventListener('ended', finish);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('pause', stop);
      audio.removeEventListener('ended', finish);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [source]);

  const togglePlayback = (): void => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (playing) {
      audio.pause();
      return;
    }
    void audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const seek = (value: number): void => {
    const audio = audioRef.current;
    if (!audio || !duration) {
      return;
    }
    audio.currentTime = (value / 100) * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex min-w-0 items-center gap-2"
      role="group"
      aria-label={name}
    >
      <IconButton
        variant="icon"
        color="primary"
        size="small"
        symbol={playing ? StopMd : PlayMd}
        disabled={!source}
        TooltipProps={{ title: playing ? stopLabel : playLabel }}
        onClick={togglePlayback}
      />
      <Text component="span" className="typography-descriptor text-neutral-b2">
        {formatDuration(currentTime)}
      </Text>
      <Slider
        className="min-w-0 flex-1"
        aria-label={name}
        min={0}
        max={100}
        value={progress}
        disabled={!source || !duration}
        onChange={(_, value) => seek(value)}
      />
      <Text component="span" className="typography-descriptor text-neutral-b2">
        {formatDuration(duration, '00:00')}
      </Text>
    </div>
  );
}
