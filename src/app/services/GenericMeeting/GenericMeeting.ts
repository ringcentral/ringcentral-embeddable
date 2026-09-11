import { injectable, optional, delegate } from '@ringcentral-integration/next-core';
import { ExtensionInfo } from '@ringcentral-integration/micro-auth/src/app/services';
import { Brand } from '@ringcentral-integration/micro-core/src/app/services';
import {
  GenericMeeting as GenericMeetingBase,
  VideoConfiguration,
  Meeting,
  GenericMeetingOptions,
  RcVideo,
} from '@ringcentral-integration/micro-meeting/src/app/services';

interface FetchHistoryMeetingsParams {
  pageToken?: string;
  searchText?: string;
  type?: string;
}

interface EmbeddableRcVideo {
  readonly historyMeetings: unknown[];
  readonly upcomingMeetings: unknown[];
  addThirdPartyProvider(args: {
    name: string;
    fetchUpcomingMeetingList: () => Promise<unknown[]>;
  }): void;
  cleanHistoryMeetings(): Promise<void>;
  fetchHistoryMeetings(params: FetchHistoryMeetingsParams): Promise<unknown>;
  fetchUpcomingMeetings(): Promise<void>;
  removeThirdPartyProvider(args: { name: string }): void;
}

@injectable({
  name: 'GenericMeeting',
})
export class GenericMeeting extends GenericMeetingBase {
  constructor(
    protected _videoConfiguration: VideoConfiguration,
    protected _extensionInfo: ExtensionInfo,
    protected _brand: Brand,
    protected _meeting: Meeting,
    protected _rcVideo: RcVideo,
    @optional('GenericMeetingOptions')
    protected _genericMeetingOptions?: GenericMeetingOptions,
  ) {
    super(
      _videoConfiguration,
      _extensionInfo,
      _brand,
      _meeting,
      _rcVideo,
      _genericMeetingOptions,
    );
  }

  private get _embeddableRcVideo(): EmbeddableRcVideo {
    return this._rcVideo as unknown as EmbeddableRcVideo;
  }

  get historyMeetings(): unknown[] {
    if (this.isRCV) {
      return this._embeddableRcVideo.historyMeetings ?? [];
    }
    return [];
  }

  get upcomingMeetings(): unknown[] {
    if (this.isRCV) {
      return this._embeddableRcVideo.upcomingMeetings ?? [];
    }
    return [];
  }

  @delegate('server')
  async fetchHistoryMeetings(params: FetchHistoryMeetingsParams = {}): Promise<unknown> {
    if (this.isRCV) {
      return this._embeddableRcVideo.fetchHistoryMeetings(params);
    }
    return null;
  }

  @delegate('server')
  async cleanHistoryMeetings(): Promise<void> {
    if (this.isRCV) {
      await this._embeddableRcVideo.cleanHistoryMeetings();
    }
  }

  @delegate('server')
  async fetchUpcomingMeetings(): Promise<void> {
    if (this.isRCV) {
      return this._embeddableRcVideo.fetchUpcomingMeetings();
    }
  }

  addThirdPartyProvider(args: { name: string; fetchUpcomingMeetingList: () => Promise<unknown[]> }): void {
    if (this.isRCV) {
      this._embeddableRcVideo.addThirdPartyProvider(args);
    }
  }

  removeThirdPartyProvider(args: { name: string }): void {
    if (this.isRCV) {
      this._embeddableRcVideo.removeThirdPartyProvider(args);
    }
  }
}
