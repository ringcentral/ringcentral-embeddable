import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  storage,
} from '@ringcentral-integration/core';

type VoicemailMessage = {
  id: string;
  label: string;
  file: String; // Date URL
  fileName: string;
};

@Module({
  name: 'VoicemailDrop',
  deps: [
    'Client',
    'Storage',
    'AppFeatures',
  ],
})
export class VoicemailDrop extends RcModuleV2 {
  constructor(deps) {
    super({
      deps,
      storageKey: 'voicemailDrop',
      enableCache: true,
    });
  }

  @storage
  @state
  voicemailMessages: VoicemailMessage[] = [];

  @action
  addVoicemailMessage(voicemailMessage) {
    const id = voicemailMessage.id || `${Date.now()}`;
    const existingRecord = this.voicemailMessages.find((message) => message.id === id);
    if (existingRecord) {
      if (existingRecord.file !== voicemailMessage.file) {  
        existingRecord.file = voicemailMessage.file;
      }
      if (existingRecord.fileName !== voicemailMessage.fileName) {
        existingRecord.fileName = voicemailMessage.fileName;
      }
      existingRecord.label = voicemailMessage.label;
    } else {
      this.voicemailMessages.push({
        id,
        label: voicemailMessage.label,
        file: voicemailMessage.file,
        fileName: voicemailMessage.fileName,
      });
    }
  }

  @action
  deleteVoicemailMessage(voicemailMessage) {
    this.voicemailMessages = this.voicemailMessages.filter((message) => message.id !== voicemailMessage.id);
  }

  get hasVoicemailDropPermission() {
    return this._deps.appFeatures.isCallingEnabled;
  }
}
