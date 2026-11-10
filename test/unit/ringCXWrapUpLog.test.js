const { CxWrapUpLog } = require('../../src/ringcx/services/CxWrapUpLog');

function createWrapUpLog() {
  return new CxWrapUpLog({ enable: jest.fn() });
}

describe('CxWrapUpLog', () => {
  test('starts a call once and keeps what its page already did', () => {
    const wrapUpLog = createWrapUpLog();

    wrapUpLog.open('call-1', true);
    wrapUpLog.update('call-1', { formStatus: 'ready', logStatus: 'queued' });
    wrapUpLog.open('call-1', false);

    expect(wrapUpLog.get('call-1')).toEqual({
      hasDispositionStep: true,
      formStatus: 'ready',
      logStatus: 'queued',
    });
    expect(wrapUpLog.lastCallId).toBe('call-1');
  });

  test('ignores updates for a call it does not know', () => {
    const wrapUpLog = createWrapUpLog();

    wrapUpLog.update('call-1', { logStatus: 'saved' });

    expect(wrapUpLog.get('call-1')).toBeUndefined();
    expect(wrapUpLog.get('')).toBeUndefined();
  });

  test.each([
    ['pending', true],
    ['queued', true],
    ['saving', true],
    ['failed', true],
    ['saved', false],
    ['skipped', false],
  ])('treats a %s call log as open: %s', (logStatus, open) => {
    const wrapUpLog = createWrapUpLog();
    wrapUpLog.open('call-1', true);
    wrapUpLog.update('call-1', { logStatus });

    expect(wrapUpLog.isLogOpen('call-1')).toBe(open);
  });

  test('keeps the last 20 calls', () => {
    const wrapUpLog = createWrapUpLog();

    for (let index = 0; index < 25; index += 1) {
      wrapUpLog.open(`call-${index}`, true);
    }

    expect(Object.keys(wrapUpLog.entries)).toHaveLength(20);
    expect(wrapUpLog.get('call-4')).toBeUndefined();
    expect(wrapUpLog.get('call-5')).toBeDefined();
    expect(wrapUpLog.lastCallId).toBe('call-24');
  });
});
