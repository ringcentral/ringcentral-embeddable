import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  computed,
  storage,
  track,
} from '@ringcentral-integration/core';
import { dynamicLoad } from '@ringcentral/mfe-react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { sleep } from '@ringcentral-integration/commons/utils';
import { trackEvents } from '../Analytics/trackEvents';

interface SmartNoteSession {
  id: string;
  status: string;
  phoneNumber?: string;
  contact?: {
    name?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
  };
  direction: string;
  startTime?: string;
}

interface CallMetaData {
  startTime: string;
  direction: string;
  from?: {
    phoneNumber: string;
    name: string;
  };
  to?: {
    phoneNumber: string;
    name: string;
  };
}

@Module({
  name: 'SmartNotes',
  deps: [
    'Client',
    'Auth',
    'AppFeatures',
    'Webphone',
    'ContactMatcher',
    'Storage',
    'Alert',
    'TabManager',
  ],
})
export class SmartNotes extends RcModuleV2 {
  protected SmartNoteClient: any;
  protected _smartNoteClientMap: { [key: string]: any };
  protected _smartNoteMFERemoteEntry: string;
  protected _smartNoteIframeUri: string;
  protected _webphoneHookAdded: boolean;
  protected _onSmartNoteUpdate?: (id: string) => void;
  protected _autoStartTimeout: NodeJS.Timeout;

  constructor(deps) {
    super({
      deps,
      storageKey: 'smartNotes',
      enableCache: true,
    });
    this.SmartNoteClient = null
    this._smartNoteClientMap = {};
    this._smartNoteIframeUri = '';
    this._smartNoteMFERemoteEntry = '';
    this._webphoneHookAdded = false;
    this._onSmartNoteUpdate = undefined;
  }

  async onInit() {
    if (!this.hasPermission) {
      return;
    }
    if (this.clientInitialized) {
      return;
    }
    if (!this._webphoneHookAdded) {
      this._deps.webphone.onCallStart((webphoneSession) => {
        if (!this.hasPermission) {
          return;
        }
        if (!this.showSmartNote) {
          return;
        }
        this._setWebphoneSession(webphoneSession);
      });
      this._deps.webphone.onCallResume((webphoneSession) => {
        if (!this.hasPermission) {
          return;
        }
        if (!this.showSmartNote) {
          return;
        }
        this._setWebphoneSession(webphoneSession);
      });
      this._deps.webphone.onCallEnd((webphoneSession) => {
        if (!this.hasPermission) {
          return;
        }
        if (!this.showSmartNote) {
          return;
        }
        if (!webphoneSession.partyData) {
          return;
        }
        this.setSessionDisconnected({
          id: webphoneSession.partyData.sessionId,
          status: 'Disconnected',
          direction: webphoneSession.direction,
        });
      });
      this._webphoneHookAdded = true
    }
    try {
      const plugins = await fetch('./plugins.json').then((res) => res.json());
      const smartNotesRemoteEntry = plugins.smartNotesMFE;
      if (!smartNotesRemoteEntry) {
        return;
      }
      this._smartNoteMFERemoteEntry = smartNotesRemoteEntry;
      this._smartNoteIframeUri = plugins.smartNotesIframe;
      const smartNotesModule = await dynamicLoad(
        '@ringcentral/smart-note-widget/src/bootstrap',
        smartNotesRemoteEntry,
      );
      this.SmartNoteClient = smartNotesModule.default.SmartNoteClient;
      this.setClientInitialized(true);
    } catch (e) {
      console.error(e);
      this.setClientInitialized(false);
    }
  }

  onReset() {
    this.clearStates()
  }

  @action
  clearStates() {
    this.callsQueryResults = [];
    this.smartNoteTextStore = [];
    this.session = null;
  }

  @state
  session = null;

  @action
  _setSession(session) {
    this.session = session;
  }

  @storage
  @state
  showSmartNote = false;

  @state
  showSmartNoteReadOnly = false;

  @state
  showSmartNoteReadOnlyReason = '';

  @track((that) =>
    that.showSmartNote ? [trackEvents.enableSmartNotes] : [trackEvents.disableSmartNotes],
  )
  @action
  toggleShowSmartNote() {
    this.showSmartNote = !this.showSmartNote;
  }

  @action
  setShowSmartNote(show, readOnly = false, reason = '') {
    this.showSmartNote = show;
    this.showSmartNoteReadOnly = readOnly;
    this.showSmartNoteReadOnlyReason = reason;
  }

  @storage
  @state
  autoStartSmartNote = false;

  @state
  autoStartSmartNoteReadOnly = false;

  @state
  autoStartSmartNoteReadOnlyReason = '';

  @track((that) =>
    that.autoStartSmartNote ? [trackEvents.enableSmartNotesAutoStart] : [trackEvents.disableSmartNotesAutoStart],
  )
  @action
  toggleAutoStartSmartNote() {
    this.autoStartSmartNote = !this.autoStartSmartNote;
  }

  @action
  setAutoStartSmartNote(autoStart, readOnly = false, reason = '') {
    this.autoStartSmartNote = autoStart;
    this.autoStartSmartNoteReadOnly = readOnly;
    this.autoStartSmartNoteReadOnlyReason = reason;
  }

  @state
  clientInitialized = false

  @action
  setClientInitialized(initialized) {
    this.clientInitialized = initialized;
  }

  _setWebphoneSession(webphoneSession) {
    if (!webphoneSession.partyData) {
      return;
    }
    const phoneNumber =
      webphoneSession.direction === callDirections.outbound ?
        webphoneSession.to :
        webphoneSession.from;
    const feedbackName =
      webphoneSession.direction === callDirections.outbound ?
        webphoneSession.toUserName :
        webphoneSession.fromUserName;
    const contactMatches = this._deps.contactMatcher.dataMapping[phoneNumber];
    this.setSession({
      id: webphoneSession.partyData.sessionId,
      status: 'Answered',
      phoneNumber: phoneNumber,
      contact: contactMatches && contactMatches.length > 0 ? contactMatches[0] : {
        name: feedbackName,
        phoneNumber,
      },
      direction: webphoneSession.direction,
      startTime: new Date(webphoneSession.startTime).toISOString(),
    });
  }

  async _startSmartNote(session, retry = false) {
    if (this._autoStartTimeout) {
      clearTimeout(this._autoStartTimeout);
    }
    const delayTime = retry ? 5000 : 2000;
    this._autoStartTimeout = setTimeout(async () => {
      const client = this._smartNoteClientMap[session.id];
      if (client && client.transcriptionStatus === 'idle') {
        try {
          await this._smartNoteClientMap[session.id].start();
        } catch (e) {
          if (!retry && e.message && (
            e.message.indexOf('CC-102') > -1 ||
            e.message.indexOf('CC-104') > -1
          )) {
            // if the session is not ready, retry once
            this._startSmartNote(session, true);
            return;
          }
          console.error(e);
          this._deps.alert.alert({
            message: 'showCustomAlertMessage',
            level: 'warning',
            payload: {
              alertMessage: 'Failed to auto start AI assistant, please start it manually after call answered',
            },
            ttl: 10000,
          });
        }
      }
    }, delayTime);
  }

  // called when webphone session is started or user view the post-call note
  setSession(session: SmartNoteSession) {
    if (!this.SmartNoteClient) {
      return;
    }
    if (!session) {
      // Close smart note when session is null
      if (this.session) {
        const smartNoteClient = this._smartNoteClientMap[this.session.id];
        if (smartNoteClient) {
          smartNoteClient.stop();
          smartNoteClient.removeAllListeners();
          delete this._smartNoteClientMap[this.session.id];
        }
        this._setSession(null);
      }
      return;
    }
    let callMetaData: CallMetaData = {
      startTime: session.startTime,
      direction: session.direction,
    };
    if (session.direction === 'Outbound') {
      callMetaData.to = {
        phoneNumber: session.phoneNumber,
        name: session.contact ? session.contact.name : '',
      };
    } else {
      callMetaData.from = {
        phoneNumber: session.phoneNumber,
        name: session.contact ? session.contact.name : '',
      };
    }
    // if session is not the same as current session, create a new smart note client
    if (this.session?.id !== session.id) {
      if (!this._smartNoteClientMap[session.id]) {
        this._smartNoteClientMap[session.id] = new this.SmartNoteClient({
          sdk: this._deps.client.service,
          telephonySessionId: session.id,
          extensionId: this._deps.auth.ownerId,
          telephonySessionStatus: session.status,
          contact: session.contact ? {
            ...session.contact,
            phoneNumber: session.phoneNumber,
          } : {
            phoneNumber: session.phoneNumber,
          },
          smartNoteIframeUri: this._smartNoteIframeUri,
          callMetaData,
        });
        this._smartNoteClientMap[session.id].on('statusUpdate', (status) => {
          if (status === 'ready') {
            this.trackSmartNoteStart();
          }
        });
      } else {
        this._smartNoteClientMap[session.id].updateTelephonySessionStatus(session.status);
      }
      // if there is an old session, close it or stop it
      if (this.session) {
        const oldSmartNoteClient = this._smartNoteClientMap[this.session.id];
        // Pause old smart note client if it's not idle
        if (oldSmartNoteClient.transcriptionStatus !== 'idle') {
          // TODO: test with multiple sessions
          oldSmartNoteClient.pause();
        }
      }
      this._setSession(session);
      this._clearOtherIdleSmartNoteClient(session.id);
      const currentTabInteracting = this._deps.tabManager.interacting;
      if (session.status === 'Answered' && this.autoStartSmartNote) {
        const transcriptionStatus = this._smartNoteClientMap[session.id].transcriptionStatus;
        if (transcriptionStatus === 'idle') {
          if (currentTabInteracting) {
            this._startSmartNote(session);
          }
        } else if (transcriptionStatus === 'paused') {
          this._smartNoteClientMap[session.id].resume();
        }
      }
      return;
    }
    const smartNoteClient = this._smartNoteClientMap[session.id];
    if (!smartNoteClient) {
      return;
    }
    // Update the status of the current session
    smartNoteClient.updateTelephonySessionStatus(session.status);
    this._setSession(session);
    this._clearOtherIdleSmartNoteClient(session.id);
  }

  setSessionDisconnected(session) {
    if (!this.SmartNoteClient) {
      return;
    }
    if (!session) {
      return;
    }
    const smartNoteClient = this._smartNoteClientMap[session.id];
    if (!smartNoteClient) {
      return;
    }
    if (
      this.session &&
      this.session.id === session.id &&
      this.session.status === 'Disconnected'
    ) {
      // avoid duplicated call
      return;
    }
    if (smartNoteClient.transcriptions.length > 1) {
      this.addRecentNotedCall(session.id);
    }
    if (this.session?.id === session.id) {
      if (smartNoteClient.transcriptionStatus === 'idle') {
        // when smart note is not started, just remove the session to close the smart note widget
        this._smartNoteClientMap[session.id].removeAllListeners();
        delete this._smartNoteClientMap[session.id];
        this._setSession(null);
      } else {
        // when smart note is started, update the status to 'Disconnected' to redirect the smart note to post call page
        smartNoteClient.updateTelephonySessionStatus('Disconnected');
        this._setSession({
          ...this.session,
          ...session,
        });
      }
      return;
    }
    if (smartNoteClient.transcriptionStatus !== 'idle') {
      // when smart note is started, update the status to 'Disconnected' to stop the transcription
      smartNoteClient.updateTelephonySessionStatus('Disconnected');
    }
    this._smartNoteClientMap[session.id].removeAllListeners();
    delete this._smartNoteClientMap[session.id];
  }

  _clearOtherIdleSmartNoteClient(sessionId) {
    Object.keys(this._smartNoteClientMap).forEach((id) => {
      if (id !== sessionId) {
        const smartNoteClient = this._smartNoteClientMap[id];
        if (
          smartNoteClient.transcriptionStatus === 'idle' ||
          smartNoteClient.transcriptionStatus === 'stopped'
        ) {
          smartNoteClient.removeAllListeners();
          delete this._smartNoteClientMap[id];
        }
      }
    });
  }

  get hasPermission() {
    return this._deps.appFeatures.hasSmartNotePermission;
  }

  get smartNoteClient() {
    if (!this.session) {
      return null;
    }
    return this._smartNoteClientMap[this.session.id];
  }

  @state
  recentNotedCalls = [];

  @action
  addRecentNotedCall(telephonySessionId) {
    let newRecentNotedCalls = [telephonySessionId].concat(
      this.recentNotedCalls.filter((id) => id !== telephonySessionId),
    );
    if (newRecentNotedCalls.length > 5) {
      newRecentNotedCalls = newRecentNotedCalls.slice(0, 5);
    }
    this.recentNotedCalls = newRecentNotedCalls;
  }

  @state
  callsQueryResults = [];

  @action
  addCallsQueryResults(calls) {
    // remote old calls
    let results = this.callsQueryResults.filter((call) => {
      return !calls.find((newCall) => newCall.id === call.id);
    });
    results = calls.concat(results);
    // only saved 100 calls
    if (results.length > 100) {
      results = results.slice(0, 100);
    }
    this.callsQueryResults = results;
  }

  async queryNotedCalls(telephonySessionIds) {
    if (!this.SmartNoteClient || !this.hasPermission) {
      return;
    }
    const noQueryIds = telephonySessionIds.filter((id) => {
      return !this.callsQueryResults.find((call) => call.id === id);
    });
    if (noQueryIds.length === 0) {
      return;
    }
    const sdk = this._deps.client.service
    try {
      const queryResult = await this.SmartNoteClient.querySmartNotes(sdk, noQueryIds);
      const notedResult = [];
      noQueryIds.forEach((id) => {
        let noted = !!queryResult.records.find((record) => record.telephonySessionId === id);
        if (!noted && this.recentNotedCalls.indexOf(id) > -1) {
          noted = true; // if it's in recentNotedCalls, it should be noted
        }
        notedResult.push({
          id,
          noted,
        });
      });
      this.addCallsQueryResults(notedResult);
    } catch (e) {
      console.error(e);
    }
  }

  @computed((that: SmartNotes) => [that.callsQueryResults])
  get aiNotedCallMapping() {
    return this.callsQueryResults.reduce((map, call) => {
      if (call.noted) {
        map[call.id] = true;
      }
      return map;
    }, {});
  }

  @state
  smartNoteTextStore = [];

  @action
  addSmartNoteTextStore(id, text) {
    let newStore = this.smartNoteTextStore.filter((item) => item.id !== id);
    newStore = [{ id, text }].concat(newStore);
    if (newStore.length > 20) {
      newStore = newStore.slice(0, 20);
    }
    this.smartNoteTextStore = newStore;
  }

  @action
  removeSmartNoteTextStore(id) {
    this.smartNoteTextStore = this.smartNoteTextStore.filter((item) => item.id !== id);
  }

  async _fetchNotesUntilFinished(telephonySessionId, retryCount = 0) {
    const sdk = this._deps.client.service;
    const result = await this.SmartNoteClient.getNotes(sdk, telephonySessionId);
    if (result.status !== 'InProgress') {
      return result;
    }
    if (retryCount > 3) {
      return result;
    }
    await sleep(5000);
    return this._fetchNotesUntilFinished(telephonySessionId, retryCount + 1);
  }

  async fetchSmartNoteText(telephonySessionId) {
    if (!this.SmartNoteClient || !this.hasPermission) {
      return null;
    }
    if (!telephonySessionId) {
      return null;
    }
    if (this.smartNoteTextMapping[telephonySessionId]) {
      return this.smartNoteTextMapping[telephonySessionId];
    }
    await this.queryNotedCalls([telephonySessionId]);
    const noted = this.callsQueryResults.find((call) => call.id === telephonySessionId);
    if (!noted || !noted.noted) {
      return null;
    }
    try {
      const note = await this._fetchNotesUntilFinished(telephonySessionId);
      let noteHTMLString = note.data || '';
      noteHTMLString = noteHTMLString.replaceAll('<strong>', '**').replaceAll('</strong>', '**');
      if (noteHTMLString.indexOf('</p>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('</p>', '</p>\n');
      }
      if (noteHTMLString.indexOf('</li>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('</li>', '</li>\n');
      }
      if (noteHTMLString.indexOf('<ul>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('<ul>', '<ul>\n');
      }
      if (noteHTMLString.indexOf('</ul>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('</ul>', '</ul>\n');
      }
      if (noteHTMLString.indexOf('<ol>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('<ol>', '<ol>\n');
      }
      if (noteHTMLString.indexOf('</ol>\n') === -1) {
        noteHTMLString = noteHTMLString.replaceAll('</ol>', '</ol>\n');
      }
      const doc = new DOMParser().parseFromString(noteHTMLString, 'text/html');
      const purgedText = doc.body.textContent || '';
      this.addSmartNoteTextStore(telephonySessionId, purgedText);
      return purgedText;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  @computed((that: SmartNotes) => [that.smartNoteTextStore])
  get smartNoteTextMapping() {
    return this.smartNoteTextStore.reduce((map, item) => {
      map[item.id] = item.text;
      return map;
    }, {});
  }

  get smartNoteMFERemoteEntry() {
    return this._smartNoteMFERemoteEntry;
  }

  @state
  transcriptStore = [];

  @action
  addTranscriptStore(id, transcript) {
    let newStore = this.transcriptStore.filter((item) => item.id !== id);
    newStore = [{ id, transcript }].concat(newStore);
    if (newStore.length > 20) {
      newStore = newStore.slice(0, 20);
    }
    this.transcriptStore = newStore;
  }

  async fetchTranscript(telephonySessionId) {
    if (!this.SmartNoteClient || !this.hasPermission) {
      return null;
    }
    if (!telephonySessionId) {
      return null;
    }
    if (this.transcriptMapping[telephonySessionId]) {
      return this.transcriptMapping[telephonySessionId];
    }
    await this.queryNotedCalls([telephonySessionId]);
    const noted = this.callsQueryResults.find((call) => call.id === telephonySessionId);
    if (!noted || !noted.noted) {
      return null;
    }
    const sdk = this._deps.client.service;
    try {
      const transcript = await this.SmartNoteClient.getTranscripts(sdk, telephonySessionId);
      this.addTranscriptStore(telephonySessionId, transcript);
      return transcript;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  @computed((that: SmartNotes) => [that.transcriptStore])
  get transcriptMapping() {
    return this.transcriptStore.reduce((map, item) => {
      map[item.id] = item.transcript;
      return map;
    }, {});
  }

  onSmartNoteSave = async () => {
    if (!this.session) {
      return;
    }
    this.removeSmartNoteTextStore(this.session.id);
    if (this._onSmartNoteUpdate) {
      this._onSmartNoteUpdate(this.session.id);
    }
  }

  onSmartNoteUpdate(onSmartNoteUpdate) {
    this._onSmartNoteUpdate = onSmartNoteUpdate;
  }

  @track(() => [trackEvents.viewSmartNotes])
  viewSmartNote(session) {
    return this.setSession(session);
  }

  @track(() => [trackEvents.startSmartNotes])
  trackSmartNoteStart() {
    return null;
  }
}
