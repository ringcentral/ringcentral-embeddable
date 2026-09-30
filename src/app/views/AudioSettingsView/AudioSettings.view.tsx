import { track } from '@ringcentral-integration/micro-auth/src/app/services';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { AudioSettingsView as AudioSettingsViewBase } from '@ringcentral-integration/micro-setting/src/app/views';
import type { AudioSettingsViewOptions } from '@ringcentral-integration/micro-setting/src/app/views/AudioSettingsView/AudioSettings.view.interface';
import {
  injectable,
  optional,
  RouterPlugin,
} from '@ringcentral-integration/next-core';

import { embeddableTrackEvents } from '../../services/Analytics/embeddableTrackEvents';

type AudioSettingsUIFunctions = ReturnType<
  AudioSettingsViewBase['getUIFunctions']
>;

/**
 * Tracks the ringtone change with the legacy `Save Ringtone` event.
 */
@injectable({
  name: 'AudioSettingsView',
})
export class AudioSettingsView extends AudioSettingsViewBase {
  constructor(
    locale: Locale,
    router: RouterPlugin,
    @optional('AudioSettingsViewOptions')
    audioSettingsViewOptions?: AudioSettingsViewOptions,
  ) {
    super(locale, router, audioSettingsViewOptions);
  }

  override getUIFunctions(): AudioSettingsUIFunctions {
    const functions = super.getUIFunctions();
    if (!('updateCurrentRingtone' in functions)) {
      return functions;
    }
    const { updateCurrentRingtone } = functions;
    return {
      ...functions,
      updateCurrentRingtone: (id: string) => {
        updateCurrentRingtone(id);
        this._trackSaveRingtone();
      },
    };
  }

  @track(embeddableTrackEvents.saveRingTone)
  private _trackSaveRingtone(): void {}
}
