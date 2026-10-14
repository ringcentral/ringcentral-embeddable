// Transfer to voicemail for RingCX calls. A corporate directory user can take
// the call in their voicemail: a cold transfer with transfer_type VOICEMAIL,
// offered only once the server confirms the user's extension takes voicemail.
// The footer offers Ask first (warm) and Transfer (cold) on every tab, and To
// voicemail on the manual tab only.

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: () => null,
  AppHeaderNav: () => null,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: () => null,
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallCtrlButton',
  () => ({
    CallCtrlButton: ({ label, disabled, onClick, ...props }) => (
      <button
        type="button"
        data-sign={props['data-sign']}
        data-size={props.size}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    ),
  }),
);

// The tab bodies are not under test here
jest.mock('../../src/ringcx/components/TransferPanel/InternalTransferTab', () => ({
  InternalTransferTab: () => null,
}));
jest.mock('../../src/ringcx/components/TransferPanel/PhoneBookTransferTab', () => ({
  PhoneBookTransferTab: () => null,
}));
jest.mock('../../src/ringcx/components/TransferPanel/ManualEntryTransferTab', () => ({
  ManualEntryTransferTab: () => null,
}));
jest.mock('../../src/ringcx/components/TransferPanel/QueueTransferTab', () => ({
  QueueTransferTab: () => null,
}));
jest.mock('../../src/ringcx/components/TransferPanel/i18n', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../../src/ringcx/views/CxTransferView/i18n', () => ({
  __esModule: true,
  default: {},
  t: (key) => key,
}));

// Module barrels stand in for DI tokens only. The real CxTransferCall and
// CxClient are imported from their own files below, which these do not cover.
jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));
jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));
jest.mock('../../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class CxActiveCallControl {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class CxSubscription {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class CxAgentSession {},
}));
jest.mock('../../src/ringcx/services/CxRequeueCall', () => ({
  CxRequeueCall: class CxRequeueCall {},
}));
jest.mock('../../src/ringcx/services/CxTransferCall', () => ({
  CxTransferCall: class CxTransferCall {},
}));
jest.mock('../../src/ringcx/services/CxDirectorySearch', () => ({
  CxDirectorySearch: class CxDirectorySearch {},
  ...jest.requireActual(
    '../../src/ringcx/services/CxDirectorySearch/CxDirectorySearch.interface',
  ),
  ...jest.requireActual(
    '../../src/ringcx/services/CxDirectorySearch/formatDirectoryRecordName',
  ),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { watch } from '@ringcentral-integration/next-core';

import { CxClient } from '../../src/ringcx/services/CxClient/CxClient';
import { CxTransferCall } from '../../src/ringcx/services/CxTransferCall/CxTransferCall';
import { CxTransferView } from '../../src/ringcx/views/CxTransferView/CxTransferView.view';
import { TransferPanel } from '../../src/ringcx/components/TransferPanel/TransferPanel';
import {
  directTransferTypes,
  transferErrors,
  transferTypes,
} from '../../src/ringcx/enums';

const AUTH_HOST = 'https://ringcx.example.test';
const RC_ACCOUNT_ID = '37233001';
const EXTENSION_ID = '265162001';
const VOICEMAIL_DEST = `+16504360000*101@RC_EXT`;

/** Settle the promise chains a fire-and-forget call leaves behind */
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('CxClient voicemail transfer', () => {
  function createClientContext(sdk = {}) {
    return {
      _sdk: {
        getAuthenticateRequest: () => ({ engageAccessToken: 'engage-token' }),
        ...sdk,
      },
      _options: { authHost: AUTH_HOST },
      logger: { error: jest.fn() },
      getFullUserDetails: jest.fn(() => ({ rcAccountId: RC_ACCOUNT_ID })),
    };
  }

  afterEach(() => {
    delete global.fetch;
  });

  test('sends the destination as a cold transfer to voicemail', async () => {
    const sendToVoicemailForRingEXNumber = jest.fn((_dest, callback) =>
      callback({ status: 'OK' }),
    );
    const context = createClientContext({ sendToVoicemailForRingEXNumber });

    await expect(
      CxClient.prototype.voicemailTransferCall.call(context, VOICEMAIL_DEST),
    ).resolves.toEqual({ status: 'OK' });
    expect(sendToVoicemailForRingEXNumber).toHaveBeenCalledWith(
      VOICEMAIL_DEST,
      expect.any(Function),
    );
  });

  test('rejects a voicemail transfer the server refuses', async () => {
    const context = createClientContext({
      sendToVoicemailForRingEXNumber: (_dest, callback) =>
        callback({ status: 'FAILURE', message: 'refused' }),
    });

    await expect(
      CxClient.prototype.voicemailTransferCall.call(context, VOICEMAIL_DEST),
    ).rejects.toEqual({ status: 'FAILURE', message: 'refused' });
  });

  test('asks the permission endpoint about the extension of the agent account', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ voiceMailEnabled: true }),
    });

    const result = await CxClient.prototype.checkVoicemail.call(
      createClientContext(),
      EXTENSION_ID,
    );

    expect(result).toEqual({ status: 200, voiceMailEnabled: true });
    const [url, init] = global.fetch.mock.calls[0];
    const { origin, pathname, searchParams } = new URL(url);
    expect(`${origin}${pathname}`).toBe(
      `${AUTH_HOST}/api/v1/extension-permissions/check-voicemail`,
    );
    expect(searchParams.get('targetExtensionId')).toBe(EXTENSION_ID);
    expect(searchParams.get('targetAccountId')).toBe(RC_ACCOUNT_ID);
    expect(init.headers.Authorization).toBe('Bearer engage-token');
  });

  test('returns an error status as a value so the caller can refresh on 401', async () => {
    const json = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json });

    await expect(
      CxClient.prototype.checkVoicemail.call(createClientContext(), EXTENSION_ID),
    ).resolves.toEqual({ status: 401, voiceMailEnabled: false });
    expect(json).not.toHaveBeenCalled();
  });

  test('reports status 0 when the request cannot be made', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('offline'));
    const context = createClientContext();

    await expect(
      CxClient.prototype.checkVoicemail.call(context, EXTENSION_ID),
    ).resolves.toEqual({ status: 0, voiceMailEnabled: false });
    expect(context.logger.error).toHaveBeenCalled();
  });

  test('does not call the endpoint without an RC account', async () => {
    global.fetch = jest.fn();
    const context = createClientContext();
    context.getFullUserDetails.mockReturnValue(undefined);

    await expect(
      CxClient.prototype.checkVoicemail.call(context, EXTENSION_ID),
    ).resolves.toEqual({ status: 0, voiceMailEnabled: false });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('CxTransferCall voicemail', () => {
  function createTransferCall() {
    const cxClient = {
      checkVoicemail: jest.fn(),
      voicemailTransferCall: jest.fn().mockResolvedValue({ status: 'OK' }),
      coldTransferCall: jest.fn(),
      warmTransferCall: jest.fn(),
      coldDirectAgentTransfer: jest.fn(),
      warmDirectAgentTransfer: jest.fn(),
      fetchDirectAgentList: jest.fn().mockResolvedValue({ agents: [] }),
    };
    const cxAuth = {
      refreshEvToken: jest.fn().mockResolvedValue(true),
      // The agent config always lists USA, the country a directory
      // destination is dialed under
      availableCountries: [{ countryId: 'USA', countryCode: '1' }],
      agentPermissions: {},
    };
    const transferCall = new CxTransferCall(
      cxClient,
      cxAuth,
      { currentCall: null },
      { holdAndConfirm: jest.fn(), setUnholdOnHangup: jest.fn() },
      {},
      {},
      {},
      {},
      {},
      { enable: jest.fn() },
    );
    return { transferCall, cxClient, cxAuth };
  }

  function pickDirectoryUser(transferCall) {
    transferCall.changeTransferType(transferTypes.manualEntry);
    transferCall.changeRecipientNumber(VOICEMAIL_DEST, { skipParse: true });
  }

  test('caches a confirmed voicemail permission per extension', async () => {
    const { transferCall, cxClient } = createTransferCall();
    cxClient.checkVoicemail.mockResolvedValue({
      status: 200,
      voiceMailEnabled: true,
    });

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(true);
    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(true);

    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(1);
    expect(transferCall.voicemailEnabledByExtension).toEqual({
      [EXTENSION_ID]: true,
    });
  });

  test('caches a voicemail the server says is off', async () => {
    const { transferCall, cxClient } = createTransferCall();
    cxClient.checkVoicemail.mockResolvedValue({
      status: 200,
      voiceMailEnabled: false,
    });

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(false);
    expect(transferCall.voicemailEnabledByExtension).toEqual({
      [EXTENSION_ID]: false,
    });
  });

  test('shares one request between concurrent checks of an extension', async () => {
    const { transferCall, cxClient } = createTransferCall();
    const response = deferred();
    cxClient.checkVoicemail.mockReturnValue(response.promise);

    const first = transferCall.checkVoicemail(EXTENSION_ID);
    const second = transferCall.checkVoicemail(EXTENSION_ID);
    response.resolve({ status: 200, voiceMailEnabled: true });

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(1);
  });

  test('refreshes the Engage token on 401 and checks again', async () => {
    const { transferCall, cxClient, cxAuth } = createTransferCall();
    cxClient.checkVoicemail
      .mockResolvedValueOnce({ status: 401, voiceMailEnabled: false })
      .mockResolvedValueOnce({ status: 200, voiceMailEnabled: true });

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(true);

    expect(cxAuth.refreshEvToken).toHaveBeenCalledTimes(1);
    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(2);
    expect(transferCall.voicemailEnabledByExtension[EXTENSION_ID]).toBe(true);
  });

  test('gives up without caching when the token cannot be refreshed', async () => {
    const { transferCall, cxClient, cxAuth } = createTransferCall();
    cxClient.checkVoicemail.mockResolvedValue({
      status: 401,
      voiceMailEnabled: false,
    });
    cxAuth.refreshEvToken.mockResolvedValue(false);

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(false);

    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(1);
    expect(transferCall.voicemailEnabledByExtension).toEqual({});
  });

  test('refreshes only once when the retry is still unauthorized', async () => {
    const { transferCall, cxClient, cxAuth } = createTransferCall();
    cxClient.checkVoicemail.mockResolvedValue({
      status: 401,
      voiceMailEnabled: false,
    });

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(false);

    expect(cxAuth.refreshEvToken).toHaveBeenCalledTimes(1);
    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(2);
    expect(transferCall.voicemailEnabledByExtension).toEqual({});
  });

  test('does not cache a failed check, so the next check asks again', async () => {
    const { transferCall, cxClient } = createTransferCall();
    cxClient.checkVoicemail
      .mockResolvedValueOnce({ status: 500, voiceMailEnabled: false })
      .mockResolvedValueOnce({ status: 200, voiceMailEnabled: true });

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(false);
    expect(transferCall.voicemailEnabledByExtension).toEqual({});

    await expect(transferCall.checkVoicemail(EXTENSION_ID)).resolves.toBe(true);
    expect(cxClient.checkVoicemail).toHaveBeenCalledTimes(2);
  });

  test('a reset forgets checked extensions and drops one in flight', async () => {
    const { transferCall, cxClient } = createTransferCall();
    cxClient.checkVoicemail.mockResolvedValueOnce({
      status: 200,
      voiceMailEnabled: true,
    });
    await transferCall.checkVoicemail(EXTENSION_ID);

    const response = deferred();
    cxClient.checkVoicemail.mockReturnValueOnce(response.promise);
    transferCall.resetTransferStatus();
    expect(transferCall.voicemailEnabledByExtension).toEqual({});

    const pending = transferCall.checkVoicemail(EXTENSION_ID);
    transferCall.resetTransferStatus();
    response.resolve({ status: 200, voiceMailEnabled: true });
    await pending;

    expect(transferCall.voicemailEnabledByExtension).toEqual({});
  });

  test('sends a directory destination to voicemail', async () => {
    const { transferCall, cxClient } = createTransferCall();
    pickDirectoryUser(transferCall);

    await transferCall.transfer(directTransferTypes.VOICEMAIL);

    expect(cxClient.voicemailTransferCall).toHaveBeenCalledWith(VOICEMAIL_DEST);
    expect(cxClient.coldTransferCall).not.toHaveBeenCalled();
    expect(cxClient.warmTransferCall).not.toHaveBeenCalled();
  });

  test('refuses voicemail for a destination outside the directory', async () => {
    const { transferCall, cxClient } = createTransferCall();
    transferCall.changeTransferType(transferTypes.manualEntry);
    transferCall.changeRecipientNumber('+16505550100');

    await expect(
      transferCall.voicemailTransferCall('+16505550100'),
    ).rejects.toMatchObject({ type: transferErrors.SEND_VOICEMAIL_ERROR });
    expect(cxClient.voicemailTransferCall).not.toHaveBeenCalled();
  });

  test('refuses voicemail for an agent transfer', async () => {
    const { transferCall, cxClient } = createTransferCall();
    transferCall.changeTransferType(transferTypes.internal);
    transferCall.changeTransferAgentId('1001');

    await expect(
      transferCall.transfer(directTransferTypes.VOICEMAIL),
    ).rejects.toMatchObject({ type: transferErrors.TYPE_ERROR });
    expect(cxClient.coldDirectAgentTransfer).not.toHaveBeenCalled();
    expect(cxClient.warmDirectAgentTransfer).not.toHaveBeenCalled();
  });

  test('Ask first and Transfer still route warm and cold', async () => {
    const { transferCall, cxClient } = createTransferCall();
    pickDirectoryUser(transferCall);

    await transferCall.transfer(directTransferTypes.WARM);
    await transferCall.transfer(directTransferTypes.COLD);

    expect(cxClient.warmTransferCall).toHaveBeenCalledWith({
      dialDest: VOICEMAIL_DEST,
    });
    expect(cxClient.coldTransferCall).toHaveBeenCalledWith({
      dialDest: VOICEMAIL_DEST,
    });
    expect(cxClient.voicemailTransferCall).not.toHaveBeenCalled();
  });
});

describe('CxTransferView voicemail', () => {
  const userRecord = {
    id: EXTENSION_ID,
    firstName: 'Ada',
    lastName: 'Lovelace',
    extensionNumber: '101',
    type: 'User',
  };
  const queueRecord = {
    id: '265162999',
    name: 'Support',
    extensionNumber: '200',
    type: 'Department',
  };

  function createView({ records = [userRecord, queueRecord] } = {}) {
    const transferCall = {
      transferType: transferTypes.manualEntry,
      transferring: false,
      voicemailEnabledByExtension: {},
      allowInternalTransfer: true,
      transferPhoneBook: [],
      changeTransferType: jest.fn((type) => {
        transferCall.transferType = type;
      }),
      changeRecipientNumber: jest.fn(),
      checkVoicemail: jest.fn().mockResolvedValue(true),
      transfer: jest.fn().mockResolvedValue(undefined),
      resetTransferStatus: jest.fn(),
    };
    const requeueCall = {
      requeuing: false,
      selectedGateId: 'gate-1',
      allowRequeueCall: true,
      requeueCall: jest.fn().mockResolvedValue(undefined),
    };
    const directorySearch = {
      getRecords: jest.fn(() => records),
      isSearching: jest.fn(() => false),
      hasResults: jest.fn(() => records.length > 0),
      findExactExtensionMatch: jest.fn(() => null),
      buildRecordDestination: jest.fn(
        (_scope, record) => `+16504360000*${record.extensionNumber}@RC_EXT`,
      ),
      cancel: jest.fn(),
      clear: jest.fn(),
      search: jest.fn(),
    };
    const router = {
      currentPath: '/agent/calls/call-1/transfer',
      replace: jest.fn(),
    };
    const toast = { success: jest.fn(), danger: jest.fn() };
    const view = new CxTransferView(
      transferCall,
      requeueCall,
      { currentCall: { allowTransfer: true }, activityCallId: 'call-1' },
      { availableRequeueQueues: [] },
      directorySearch,
      router,
      toast,
    );
    return { view, transferCall, requeueCall, router, toast };
  }

  test('a picked directory user is the voicemail candidate', async () => {
    const { view } = createView();

    await view.selectDirectoryRecord(userRecord);

    expect(view.voicemailCandidateExtensionId).toBe(EXTENSION_ID);
  });

  test('other directory extensions and other tabs have no voicemail', async () => {
    const { view, transferCall } = createView();

    await view.selectDirectoryRecord(queueRecord);
    expect(view.voicemailCandidateExtensionId).toBeNull();

    await view.selectDirectoryRecord(userRecord);
    transferCall.transferType = transferTypes.phoneBook;
    expect(view.voicemailCandidateExtensionId).toBeNull();
  });

  test('To voicemail stays disabled until the server confirms voicemail', async () => {
    const { view, transferCall } = createView();
    await view.selectDirectoryRecord(userRecord);

    expect(view.isVoicemailDestination).toBe(false);
    expect(view.isVoicemailDisabled).toBe(true);

    transferCall.voicemailEnabledByExtension = { [EXTENSION_ID]: false };
    expect(view.isVoicemailDisabled).toBe(true);

    transferCall.voicemailEnabledByExtension = { [EXTENSION_ID]: true };
    expect(view.isVoicemailDestination).toBe(true);
    expect(view.isVoicemailDisabled).toBe(false);
  });

  test('picking a directory user checks voicemail, every time it is picked', async () => {
    const { view, transferCall } = createView();

    await view.selectDirectoryRecord(userRecord);
    await view.selectDirectoryRecord(userRecord);
    await view.selectDirectoryRecord(queueRecord);

    expect(transferCall.checkVoicemail).toHaveBeenCalledTimes(2);
    expect(transferCall.checkVoicemail).toHaveBeenCalledWith(EXTENSION_ID);
  });

  test('checks voicemail when the candidate changes, keypad matches included', () => {
    const { view, transferCall } = createView();
    watch.mockClear();

    view.onInitOnce();

    const [, selector, callback] = watch.mock.calls[0];
    expect(selector()).toBeNull();
    // An extension typed on the keypad that matches a directory user
    view._setManualEntryNumber('101');
    view._cxDirectorySearch.findExactExtensionMatch.mockReturnValue(userRecord);
    expect(selector()).toBe(EXTENSION_ID);
    callback(selector());
    expect(transferCall.checkVoicemail).toHaveBeenCalledWith(EXTENSION_ID);
  });

  test('a failed check is logged rather than thrown', async () => {
    const { view, transferCall } = createView();
    transferCall.checkVoicemail.mockRejectedValue(new Error('port gone'));

    await view.selectDirectoryRecord(userRecord);
    await flushPromises();

    expect(view.logger.warn).toHaveBeenCalledWith(
      'checkVoicemail failed',
      expect.any(Error),
    );
  });

  test('transfers to voicemail and confirms it', async () => {
    const { view, transferCall, router, toast } = createView();
    await view.selectDirectoryRecord(userRecord);
    transferCall.voicemailEnabledByExtension = { [EXTENSION_ID]: true };

    await view.executeTransfer(directTransferTypes.VOICEMAIL);

    expect(transferCall.changeRecipientNumber).toHaveBeenCalledWith(
      '+16504360000*101@RC_EXT',
      { skipParse: true },
    );
    expect(transferCall.transfer).toHaveBeenCalledWith(
      directTransferTypes.VOICEMAIL,
    );
    expect(toast.success).toHaveBeenCalledWith({
      message: 'voicemailTransferSuccess',
    });
    expect(router.replace).toHaveBeenCalledWith(
      expect.stringContaining('call-1'),
    );
  });

  test('reports a voicemail transfer that fails and stays on the page', async () => {
    const { view, transferCall, router, toast } = createView();
    await view.selectDirectoryRecord(userRecord);
    transferCall.voicemailEnabledByExtension = { [EXTENSION_ID]: true };
    transferCall.transfer.mockRejectedValue({ status: 'FAILURE' });

    await view.executeTransfer(directTransferTypes.VOICEMAIL);

    expect(toast.danger).toHaveBeenCalledWith({
      message: 'voicemailTransferFailed',
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('does not transfer to voicemail before it is confirmed', async () => {
    const { view, transferCall, toast } = createView();
    await view.selectDirectoryRecord(userRecord);

    await view.executeTransfer(directTransferTypes.VOICEMAIL);

    expect(transferCall.transfer).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.danger).not.toHaveBeenCalled();
  });

  test('the queue tab ignores voicemail and maps Ask first to maintain', async () => {
    const { view, transferCall, requeueCall } = createView();
    transferCall.transferType = transferTypes.queue;

    await view.executeTransfer(directTransferTypes.VOICEMAIL);
    expect(requeueCall.requeueCall).not.toHaveBeenCalled();

    await view.executeTransfer(directTransferTypes.WARM);
    await view.executeTransfer(directTransferTypes.COLD);
    expect(requeueCall.requeueCall.mock.calls).toEqual([
      [{ maintain: true }],
      [{ maintain: false }],
    ]);
  });
});

describe('TransferPanel footer', () => {
  const allTabs = [
    { value: transferTypes.internal, label: 'internal', disabled: false },
    { value: transferTypes.queue, label: 'queue', disabled: false },
    { value: transferTypes.phoneBook, label: 'phoneBook', disabled: false },
    { value: transferTypes.manualEntry, label: 'manual', disabled: false },
  ];

  const byDataSign = (dataSign) =>
    document.querySelector(`[data-sign="${dataSign}"]`);

  function renderPanel(props = {}) {
    const onTransfer = jest.fn().mockResolvedValue(undefined);
    render(
      <TransferPanel
        allTabs={allTabs}
        defaultTab={transferTypes.manualEntry}
        isTransferring={false}
        isDisabled={false}
        isVoicemailDisabled={false}
        agentList={[]}
        phoneBook={[]}
        selectedAgentId={null}
        selectedPhoneBookIndex={null}
        manualEntryNumber=""
        manualEntryDirectoryRecords={[]}
        selectedDirectoryRecordId={null}
        matchedDirectoryName=""
        transferDestinationLabel=""
        isSearchingDirectory={false}
        showManualEntryKeypad
        queueGroups={[]}
        selectedQueueGroupId=""
        selectedGateId=""
        onTabChange={jest.fn()}
        onSelectAgent={jest.fn()}
        onSelectPhoneBookContact={jest.fn()}
        onManualEntryChange={jest.fn()}
        onManualEntryKeypadPress={jest.fn()}
        onManualEntryBackspace={jest.fn()}
        onManualEntryClear={jest.fn()}
        onSelectDirectoryRecord={jest.fn()}
        onQueueGroupChange={jest.fn()}
        onGateChange={jest.fn()}
        onTransfer={onTransfer}
        fetchAgentList={jest.fn()}
        {...props}
      />,
    );
    return { onTransfer };
  }

  test('the manual tab offers Ask first, Transfer and To voicemail', () => {
    const { onTransfer } = renderPanel();

    fireEvent.click(byDataSign('askFirstTransfer'));
    fireEvent.click(byDataSign('executeTransfer'));
    fireEvent.click(byDataSign('voicemailTransfer'));

    expect(onTransfer.mock.calls).toEqual([
      [directTransferTypes.WARM],
      [directTransferTypes.COLD],
      [directTransferTypes.VOICEMAIL],
    ]);
    expect(byDataSign('voicemailTransfer').textContent).toBe('toVoicemail');
    expect(byDataSign('stayOnCall')).toBeNull();
    expect(byDataSign('cancelTransfer')).toBeNull();
  });

  test('uses smaller buttons than the call page', () => {
    renderPanel();

    expect(byDataSign('executeTransfer').getAttribute('data-size')).toBe(
      'large',
    );
  });

  test('To voicemail follows its own gate', () => {
    renderPanel({ isVoicemailDisabled: true });

    expect(byDataSign('voicemailTransfer').disabled).toBe(true);
    expect(byDataSign('askFirstTransfer').disabled).toBe(false);
    expect(byDataSign('executeTransfer').disabled).toBe(false);
  });

  test('every button is disabled while a transfer is in progress', () => {
    renderPanel({ isTransferring: true });

    expect(byDataSign('askFirstTransfer').disabled).toBe(true);
    expect(byDataSign('executeTransfer').disabled).toBe(true);
    expect(byDataSign('voicemailTransfer').disabled).toBe(true);
  });

  test.each([
    transferTypes.internal,
    transferTypes.phoneBook,
    transferTypes.queue,
  ])('the %s tab has no To voicemail', (tab) => {
    renderPanel({ defaultTab: tab });

    expect(byDataSign('voicemailTransfer')).toBeNull();
    expect(byDataSign('askFirstTransfer')).not.toBeNull();
    expect(byDataSign('executeTransfer')).not.toBeNull();
  });
});
