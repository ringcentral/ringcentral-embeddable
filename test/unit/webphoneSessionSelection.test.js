const {
  selectSessionIds,
} = require('../../src/app/services/WebphoneV2/WebphoneV2Session');
const {
  sessionStatus,
} = require('../../src/app/services/WebphoneV2/sessionStatus');
const {
  voicemailDropStatus,
} = require('../../src/app/services/WebphoneV2/voicemailDropStatus');

const session = (overrides) => ({
  id: 'wp-1',
  direction: 'Outbound',
  callStatus: sessionStatus.connected,
  lastActiveTime: 1,
  ...overrides,
});

it('selects an ordinary outbound call as active', () => {
  expect(selectSessionIds([session()])).toEqual({
    activeSessionId: 'wp-1',
    ringSessionId: null,
  });
});

it('selects an inbound ringing call as the ring session', () => {
  const ringing = session({
    id: 'wp-2',
    direction: 'Inbound',
    callStatus: sessionStatus.connecting,
  });
  expect(selectSessionIds([ringing])).toEqual({
    activeSessionId: null,
    ringSessionId: 'wp-2',
  });
});

it.each([
  ['waitingForGreetingEnd', voicemailDropStatus.waitingForGreetingEnd],
  ['sending', voicemailDropStatus.sending],
])(
  'does not treat a call dropping voicemail (%s) as the active call',
  (_label, status) => {
    // Otherwise the UI stays "in a call" and the user cannot place the next
    // one; legacy allows several drops in flight for this reason.
    const dropping = session({ voicemailDropStatus: status });
    expect(selectSessionIds([dropping]).activeSessionId).toBeNull();
  },
);

it.each([
  ['finished', voicemailDropStatus.finished],
  ['terminated', voicemailDropStatus.terminated],
  ['greetingDetectionFailed', voicemailDropStatus.greetingDetectionFailed],
])(
  'keeps a call out of the active slot after the drop settles (%s)',
  (_label, status) => {
    // `isDroppingVoicemail` covers every drop status, in this app and in
    // legacy: once a drop has started the call is hung up, so it never needs
    // the active slot back.
    const settled = session({ voicemailDropStatus: status });
    expect(selectSessionIds([settled]).activeSessionId).toBeNull();
  },
);

it('prefers a normal call over one dropping voicemail', () => {
  const dropping = session({
    id: 'wp-dropping',
    lastActiveTime: 20,
    voicemailDropStatus: voicemailDropStatus.sending,
  });
  const normal = session({ id: 'wp-normal', lastActiveTime: 10 });

  expect(selectSessionIds([dropping, normal]).activeSessionId).toBe(
    'wp-normal',
  );
});

it('picks the most recently active of several normal calls', () => {
  const older = session({ id: 'wp-old', lastActiveTime: 5 });
  const newer = session({ id: 'wp-new', lastActiveTime: 50 });
  expect(selectSessionIds([older, newer]).activeSessionId).toBe('wp-new');
});
