import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  computed,
  storage,
} from '@ringcentral-integration/core';
import { dynamicLoad } from '@ringcentral/mfe-react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

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
@Module({
  name: 'SmartNotes',
  deps: [
    'Client',
    'Auth',
    'AppFeatures',
    'Webphone',
    'ContactMatcher',
    'Storage',
  ],
})
export class SmartNotes extends RcModuleV2 {
  protected SmartNoteClient: any;
  protected _smartNoteClient: any;
  protected _smartNoteMFERemoteEntry: string;
  protected _smartNoteIframeUri: string;
  protected _webphoneHookAdded: boolean;

  constructor(deps) {
    super({
      deps,
      storageKey: 'smartNotes',
      enableCache: true,
    });
    this.SmartNoteClient = null
    this._smartNoteClient = null;
    this._smartNoteIframeUri = '';
    this._smartNoteMFERemoteEntry = '';
    this._webphoneHookAdded = false;
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
          },
          direction: webphoneSession.direction,
          startTime: new Date(webphoneSession.startTime).toISOString(),
        });
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
        if (this.session?.id === webphoneSession.partyData.sessionId) {
          this.setSession({
            id: webphoneSession.partyData.sessionId,
            status: 'Disconnected',
            direction: webphoneSession.direction,
          });
        }
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

  @action
  toggleShowSmartNote() {
    this.showSmartNote = !this.showSmartNote;
  }

  @state
  clientInitialized = false

  @action
  setClientInitialized(initialized) {
    this.clientInitialized = initialized;
  }

  setSession(session: SmartNoteSession) {
    if (!this.SmartNoteClient) {
      return;
    }
    let callMetaData
    if (session) {
      callMetaData = {
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
    }
    if (!this.session) {
      this._smartNoteClient = new this.SmartNoteClient({
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
      this._setSession(session);
    } else {
      // Close smart note when session is null
      if (!session) {
        this._smartNoteClient.stop();
        this._smartNoteClient = null;
        this._setSession(null);
        return;
      }
      if (session.id === this.session.id) {
        if (this._smartNoteClient.transcriptionStatus !== 'idle') {
          this._setSession(session);
          this._smartNoteClient.updateTelephonySessionStatus(session.status);
        } else {
          this._smartNoteClient = null;
          this._setSession(null);
        }
      } else {
        this._setSession(session);
        this._smartNoteClient.switchSession({
          telephonySessionId: session.id,
          telephonySessionStatus: session.status,
          contact: session.contact ? {
            ...session.contact,
            phoneNumber: session.phoneNumber,
          } : {
            phoneNumber: session.phoneNumber,
          },
          callMetaData,
        });
      }
    }
  }

  get hasPermission() {
    return this._deps.appFeatures.hasSmartNotePermission;
  }

  get smartNoteClient() {
    return this._smartNoteClient;
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
        const noted = !!queryResult.records.find((record) => record.telephonySessionId === id);
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
    const sdk = this._deps.client.service;
    try {
      const note = await this.SmartNoteClient.getNotes(sdk, telephonySessionId);
      let noteHTMLString = note.data || '';
      noteHTMLString = noteHTMLString.replaceAll('<strong>', '**').replaceAll('</strong>', '**');
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
}
