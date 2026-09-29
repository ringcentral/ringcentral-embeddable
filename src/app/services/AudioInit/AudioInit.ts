import { injectable, RcModule } from '@ringcentral-integration/next-core';
import { DialerPadSoundsMPEG } from '@ringcentral/spring-ui';
import { BehaviorSubject, type Observable } from 'rxjs';

const UNLOCK_TONE_DURATION_MS = 1000;

/**
 * Tracks whether audio playback has been unlocked for the current document.
 */
@injectable({
  name: 'AudioInit',
})
export class AudioInit extends RcModule {
  private readonly _isAudioEnabled$ = new BehaviorSubject<boolean>(false);

  get isAudioEnabled$(): Observable<boolean> {
    return this._isAudioEnabled$.asObservable();
  }

  get isAudioEnabled(): boolean {
    return this._isAudioEnabled$.value;
  }

  /**
   * Plays a short tone from a user gesture to unlock future audio playback.
   */
  async enableAudio(): Promise<boolean> {
    let hasPlayed = false;
    try {
      const audio = new Audio(DialerPadSoundsMPEG['1']);
      audio.volume = 0.1;
      await audio.play();
      hasPlayed = true;
    } catch (error) {
      this.logger.warn('enableAudio failed to play unlock tone', error);
    }
    await new Promise<void>((resolve: () => void): void => {
      setTimeout(resolve, UNLOCK_TONE_DURATION_MS);
    });
    if (hasPlayed) {
      this._isAudioEnabled$.next(true);
    }
    return hasPlayed;
  }
}
