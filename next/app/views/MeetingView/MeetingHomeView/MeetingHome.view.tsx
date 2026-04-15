/* eslint-disable react-hooks/rules-of-hooks */
import {
  injectable,
  portal,
  RcViewModule,
  RouterPlugin,
  UIFunctions,
  UIProps,
  useConnector,
  delegate,
  state,
  action,
  PortManager,
} from '@ringcentral-integration/next-core';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  ModalView,
} from '@ringcentral-integration/micro-core/src/app/views';
import React, { useRef } from 'react';
import {
  StartVideoFilledMd,
  CalendarScheduleMd,
  ShareInRoomMd,
} from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  EmptyState,
  IconButton,
  IconButtonLabel,
  TextField,
} from '@ringcentral/spring-ui';
import { ExtensionInfo, AccountInfo } from '@ringcentral-integration/micro-auth/src/app/services';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import {
  delegateInActiveTab,
  setupActiveTabDelegate,
} from '../../../../lib/delegateInActiveTab';
import {
  UpcomingMeetingList,
  type UpcomingMeeting,
} from './components/UpcomingMeetingList';
import i18n from './i18n';

type JoinMeetingPayload = Record<string, never>;

interface MeetingHomePanelProps {
  isReady: boolean;
  isStarting: boolean;
  isLoadingUpcomingMeetings: boolean;
  upcomingMeetings: UpcomingMeeting[];
  currentLocale: string;
  onStart: () => Promise<void>;
  onFetchUpcoming: () => Promise<void>;
  onSchedule: () => void;
  onJoin: (meetingId: string) => void;
  onOpenJoinModal: () => void;
}

interface GenericMeetingWithUpcomingDeps extends GenericMeeting {
  readonly upcomingMeetings: UpcomingMeeting[];
  fetchUpcomingMeetings(): Promise<void>;
}

@injectable({
  name: 'MeetingHomeView',
})
export class MeetingHomeView extends RcViewModule {
  @state
  private isStarting = false;

  @state
  private isLoadingUpcomingMeetings = true;

  private get _genericMeetingWithUpcoming(): GenericMeetingWithUpcomingDeps {
    return this._genericMeeting as GenericMeetingWithUpcomingDeps;
  }

  constructor(
    private _genericMeeting: GenericMeeting,
    private _router: RouterPlugin,
    private _locale: Locale,
    private _modalView: ModalView,
    private _portManager: PortManager,
    private _extensionInfo: ExtensionInfo,
    private _accountInfo: AccountInfo,
  ) {
    super();
    setupActiveTabDelegate(this, this._portManager);
  }

  @state
  private meetingId = '';

  @action
  private _setMeetingId(meetingId: string): void {
    this.meetingId = meetingId;
  }

  @action
  private _setIsStarting(isStarting: boolean): void {
    this.isStarting = isStarting;
  }

  @action
  private _setIsLoadingUpcomingMeetings(isLoadingUpcomingMeetings: boolean): void {
    this.isLoadingUpcomingMeetings = isLoadingUpcomingMeetings;
  }

  @delegate('server')
  async setMeetingId(meetingId: string): Promise<void> {
    this._setMeetingId(meetingId);
  }

  @delegateInActiveTab
  async openMeetingLink(meetingId?: string): Promise<void> {
    const targetMeetingId = (meetingId ?? this.meetingId).trim();

    if (!targetMeetingId) return;

    if (targetMeetingId.startsWith('https://')) {
      window.open(targetMeetingId);
      return;
    }

    window.open(`https://v.ringcentral.com/join/${targetMeetingId}`);
  }

  @portal
  private joinMeetingModal = this._modalView.create<JoinMeetingPayload>({
    view: () => {
      const { t } = useLocale(i18n);

      return (
        <TextField
          fullWidth
          placeholder={t('joinMeetingId')}
          value={this.meetingId}
          onChange={(e) => this.setMeetingId(e.target.value)}
          autoFocus
          data-sign="joinMeetingInput"
        />
      );
    },
    props: () => ({
      header: i18n.getString('joinMeeting'),
      variant: 'confirm',
      confirmButtonText: i18n.getString('join'),
      ['data-sign']: 'joinMeetingModal',
      onConfirm: async () => {
        this.openMeetingLink();
      },
    }),
  });

  @delegate('server')
  async _openJoinMeetingModal(): Promise<void> {
    this._modalView.open(this.joinMeetingModal);
  }

  getUIProps(): UIProps<MeetingHomePanelProps> {
    return {
      isReady: this._genericMeeting.ready && this._locale.ready,
      isStarting: this.isStarting,
      isLoadingUpcomingMeetings: this.isLoadingUpcomingMeetings,
      upcomingMeetings: this._genericMeetingWithUpcoming.upcomingMeetings ?? [],
      currentLocale: this._locale.currentLocale,
    };
  }

  getUIFunctions(): UIFunctions<MeetingHomePanelProps> {
    return {
      onStart: async (): Promise<void> => {
        this._setIsStarting(true);
        try {
          const result = (await this._genericMeeting.startMeeting({
            accountId: this._accountInfo.id,
            extensionId: this._extensionInfo.info.id,
            name: 'RingCentral Video meeting',
          })) as any;
          if (result?.meeting?.joinUri) {
            window.open(result.meeting.joinUri);
          } else if (result?.joinUri) {
            window.open(result.joinUri);
          }
        } catch (err) {
          console.error('Failed to start meeting:', err);
        } finally {
          this._setIsStarting(false);
        }
      },
      onFetchUpcoming: async (): Promise<void> => {
        this._setIsLoadingUpcomingMeetings(true);
        try {
          await this._genericMeetingWithUpcoming.fetchUpcomingMeetings();
        } finally {
          this._setIsLoadingUpcomingMeetings(false);
        }
      },
      onSchedule: (): void => {
        this._router.push('/meeting/schedule');
      },
      onJoin: (meetingId: string): void => {
        void this.openMeetingLink(meetingId);
      },
      onOpenJoinModal: () => this._openJoinMeetingModal(),
    };
  }

  component() {
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const uiProps = useConnector(() => this.getUIProps());

    const {
      isReady,
      upcomingMeetings,
      currentLocale,
      isStarting,
      isLoadingUpcomingMeetings,
    } = uiProps;

    React.useEffect(() => {
      if (isReady) {
        void uiFunctions.onFetchUpcoming();
      }
    }, [isReady, uiFunctions]);

    if (!isReady) {
      return (
        <div className="flex items-center justify-center h-full">
          <CircularProgressIndicator
            size="large"
            color="primary"
            data-sign="meetingHomeLoading"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-neutral-l01 justify-around">
          <IconButtonLabel label={t('startMeeting')}>
            <IconButton
              symbol={StartVideoFilledMd}
              variant="contained"
              color="primary"
              size="xxlarge"
              shape="squircle"
              onClick={uiFunctions.onStart}
              disabled={isStarting}
              data-sign="startMeetingButton"
            />
          </IconButtonLabel>
          <IconButtonLabel label={t('schedule')}>
            <IconButton
              symbol={CalendarScheduleMd}
              variant="outlined"
              color="neutral"
              size="xxlarge"
              shape="squircle"
              onClick={uiFunctions.onSchedule}
              data-sign="scheduleMeetingButton"
            />
          </IconButtonLabel>
          <IconButtonLabel label={t('joinMeeting')}>
            <IconButton
              symbol={ShareInRoomMd}
              variant="outlined"
              color="neutral"
              size="xxlarge"
              shape="squircle"
              onClick={uiFunctions.onOpenJoinModal}
              data-sign="joinMeetingButton"
            />
          </IconButtonLabel>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingUpcomingMeetings ? (
            <div className="flex h-full items-center justify-center">
              <CircularProgressIndicator
                size="large"
                color="primary"
                data-sign="meetingUpcomingListLoading"
              />
            </div>
          ) : upcomingMeetings.length > 0 ? (
            <UpcomingMeetingList
              meetings={upcomingMeetings}
              onJoin={uiFunctions.onJoin}
              currentLocale={currentLocale}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <EmptyState
                icon={CalendarScheduleMd}
                title={t('noUpcomingMeetings')}
                data-sign="meetingHomeEmptyState"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}
