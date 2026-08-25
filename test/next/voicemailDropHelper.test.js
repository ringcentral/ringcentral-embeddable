import { addEmbeddableCallActions } from '../../next/app/views/CallView/CallControlView/CallControl.helper';
import { VOICEMAIL_DROP_LIMITS } from '../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettings.constants';
import { validateVoicemailDropFile } from '../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettings.helper';

describe('Voicemail drop helpers', () => {
  test('accepts supported audio files within the size limit', () => {
    expect(
      validateVoicemailDropFile({
        name: 'greeting.mp3',
        size: VOICEMAIL_DROP_LIMITS.maxFileSize,
        type: 'audio/mpeg',
      }),
    ).toBeNull();
    expect(
      validateVoicemailDropFile({
        name: 'greeting.wav',
        size: 1024,
        type: '',
      }),
    ).toBeNull();
  });

  test('rejects unsupported and oversized audio files', () => {
    expect(
      validateVoicemailDropFile({
        name: 'greeting.m4a',
        size: 1024,
        type: 'audio/mp4',
      }),
    ).toBe('invalidFileType');
    expect(
      validateVoicemailDropFile({
        name: 'greeting.wav',
        size: VOICEMAIL_DROP_LIMITS.maxFileSize + 1,
        type: 'audio/wav',
      }),
    ).toBe('fileTooLarge');
  });

  test('inserts voicemail drop and park before hang up', () => {
    expect(
      addEmbeddableCallActions(
        [
          { type: 'mute', disabled: false },
          { type: 'hangUp', disabled: false },
        ],
        { parkDisabled: true, voicemailDropDisabled: false },
      ),
    ).toEqual([
      { type: 'mute', disabled: false },
      { type: 'voicemail', disabled: false },
      { type: 'park', disabled: true },
      { type: 'hangUp', disabled: false },
    ]);
  });

  test('omits voicemail drop when the feature is unavailable', () => {
    expect(
      addEmbeddableCallActions([{ type: 'hangUp' }], {
        parkDisabled: false,
      }).map(({ type }) => type),
    ).toEqual(['park', 'hangUp']);
  });
});
