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

  get historyMeetings(): unknown[] {
    if (this.isRCV) {
      return (this._rcVideo as unknown as RcVideo).historyMeetings ?? [];
    }
    return [];
  }

  get upcomingMeetings(): unknown[] {
    if (this.isRCV) {
      return (this._rcVideo as unknown as RcVideo).upcomingMeetings ?? [];
    }
    return [];
  }

  @delegate('server')
  async fetchHistoryMeetings(params: FetchHistoryMeetingsParams = {}): Promise<unknown> {
    if (this.isRCV) {
      return (this._rcVideo as unknown as RcVideo).fetchHistoryMeetings(params);
    }
    return null;
  }

  @delegate('server')
  async cleanHistoryMeetings(): void {
    if (this.isRCV) {
      (this._rcVideo as unknown as RcVideo).cleanHistoryMeetings();
    }
  }

  @delegate('server')
  async fetchUpcomingMeetings(): Promise<void> {
    if (this.isRCV) {
      return (this._rcVideo as unknown as RcVideo).fetchUpcomingMeetings();
    }
  }

  addThirdPartyProvider(args: { name: string; fetchUpcomingMeetingList: () => Promise<unknown[]> }): void {
    if (this.isRCV) {
      (this._rcVideo as unknown as RcVideo).addThirdPartyProvider(args);
    }
  }

  removeThirdPartyProvider(args: { name: string }): void {
    if (this.isRCV) {
      (this._rcVideo as unknown as RcVideo).removeThirdPartyProvider(args);
    }
  }
}
