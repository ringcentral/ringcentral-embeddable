import { VOICEMAIL_DROP_LIMITS } from './VoicemailDropSettings.constants';

const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
]);

export function validateVoicemailDropFile(file: {
  name: string;
  size: number;
  type: string;
}): 'invalidFileType' | 'fileTooLarge' | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtension = extension === 'mp3' || extension === 'wav';
  const supportedType = !file.type || SUPPORTED_AUDIO_TYPES.has(file.type);

  if (!supportedExtension || !supportedType) {
    return 'invalidFileType';
  }
  if (file.size > VOICEMAIL_DROP_LIMITS.maxFileSize) {
    return 'fileTooLarge';
  }
  return null;
}
