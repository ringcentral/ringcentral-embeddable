import {
  addEmbeddableCallActions,
  MAX_VISIBLE_CALL_ACTIONS,
  splitCallActions,
} from '../../src/app/views/CallView/CallControlView/CallControl.helper';

const baseActions = [
  { type: 'mute' },
  { type: 'keypad' },
  { type: 'hold' },
  { type: 'transfer' },
  { type: 'record' },
  { type: 'hangUp' },
];

describe('addEmbeddableCallActions while dropping voicemail', () => {
  const dropping = () =>
    addEmbeddableCallActions(baseActions, {
      parkDisabled: false,
      voicemailDropDisabled: false,
      flipDisabled: false,
      droppingVoicemail: true,
    });

  test('disables every action except ending the call', () => {
    // Matches legacy's ActiveCallPad, which greyed out mute, keypad, hold,
    // transfer, merge, add, flip, park and voicemail drop while dropping.
    const actions = dropping();
    const enabled = actions
      .filter((action) => !action.disabled)
      .map((action) => action.type);

    expect(enabled).toEqual(['hangUp']);
    expect(actions.length).toBeGreaterThan(1);
  });

  test('keeps the hangUp action untouched', () => {
    const hangUp = dropping().find((action) => action.type === 'hangUp');
    expect(hangUp).toEqual({ type: 'hangUp' });
  });

  test('leaves actions enabled when not dropping', () => {
    const actions = addEmbeddableCallActions(baseActions, {
      parkDisabled: false,
      voicemailDropDisabled: false,
      flipDisabled: false,
      droppingVoicemail: false,
    });
    expect(actions.find((action) => action.type === 'mute')?.disabled).toBeUndefined();
  });
});

describe('addEmbeddableCallActions', () => {
  test('renders the voicemail drop before park and flip, in front of the end action', () => {
    const actions = addEmbeddableCallActions(baseActions, {
      parkDisabled: false,
      voicemailDropDisabled: false,
      flipDisabled: false,
    });

    expect(actions.map((action) => action.type)).toEqual([
      'mute',
      'keypad',
      'hold',
      'transfer',
      'record',
      'voicemail',
      'park',
      'flip',
      'hangUp',
    ]);
  });

  test('omits the voicemail drop and flip actions when they are not supported', () => {
    const actions = addEmbeddableCallActions(baseActions, {
      parkDisabled: true,
    });

    expect(actions.map((action) => action.type)).toEqual([
      'mute',
      'keypad',
      'hold',
      'transfer',
      'record',
      'park',
      'hangUp',
    ]);
    expect(actions.find((action) => action.type === 'park').disabled).toBe(true);
  });

  test('keeps a disabled flip action available for overflow', () => {
    const actions = addEmbeddableCallActions(baseActions, {
      parkDisabled: false,
      flipDisabled: true,
    });

    expect(actions.at(-2)).toEqual({ type: 'flip', disabled: true });
  });

  test('keeps the existing actions untouched', () => {
    const actions = addEmbeddableCallActions(
      [...baseActions.slice(0, -1), { type: 'park' }, { type: 'hangUp' }],
      { parkDisabled: true },
    );

    expect(actions.filter((action) => action.type === 'park')).toHaveLength(1);
    expect(actions.find((action) => action.type === 'park').disabled).toBe(
      undefined,
    );
  });

  test('appends the actions when there is no end action', () => {
    const actions = addEmbeddableCallActions([{ type: 'mute' }], {
      parkDisabled: false,
    });

    expect(actions.map((action) => action.type)).toEqual(['mute', 'park']);
  });

  test('keeps telephony controls and removes local-only other-device actions', () => {
    const actions = addEmbeddableCallActions(
      [
        { type: 'unmute' },
        { type: 'keypad' },
        { type: 'audio' },
        { type: 'add' },
        { type: 'unHold' },
        { type: 'transfer' },
        { type: 'stopRecord' },
        { type: 'aiNotes' },
        { type: 'hangUp' },
      ],
      {
        parkDisabled: false,
        voicemailDropDisabled: false,
        flipDisabled: false,
        isOtherDeviceCall: true,
        switchDisabled: false,
      },
    );

    expect(actions.map((action) => action.type)).toEqual([
      'unmute',
      'unHold',
      'transfer',
      'stopRecord',
      'switch',
      'hangUp',
    ]);
  });
});

describe('splitCallActions', () => {
  const createActions = (types) => types.map((actionType) => ({ actionType }));

  test('keeps every action visible when they fit', () => {
    const actions = createActions(['mute', 'keypad', 'hold']);

    expect(splitCallActions(actions)).toEqual({
      visible: actions,
      overflow: [],
    });
  });

  test('keeps all nine actions visible, flip included', () => {
    const types = [
      'mute',
      'keypad',
      'audio',
      'add',
      'hold',
      'transfer',
      'record',
      'park',
      'flip',
    ];
    const actions = createActions(types);

    expect(splitCallActions(actions)).toEqual({
      visible: actions,
      overflow: [],
    });
  });

  test('moves only the actions beyond nine into the overflow', () => {
    const types = [
      'mute',
      'keypad',
      'audio',
      'add',
      'hold',
      'transfer',
      'record',
      'voicemail',
      'park',
      'flip',
    ];
    const { visible, overflow } = splitCallActions(createActions(types));

    expect(visible.map((action) => action.actionType)).toEqual(
      types.slice(0, 9),
    );
    expect(overflow.map((action) => action.actionType)).toEqual(['flip']);
  });

  test('moves the trailing actions into the overflow', () => {
    const types = [
      'mute',
      'keypad',
      'audio',
      'add',
      'hold',
      'transfer',
      'record',
      'aiNotes',
      'voicemail',
      'park',
      'flip',
    ];
    const { visible, overflow } = splitCallActions(createActions(types));

    expect(visible).toHaveLength(MAX_VISIBLE_CALL_ACTIONS);
    expect(visible.map((action) => action.actionType)).toEqual(
      types.slice(0, 9),
    );
    expect(overflow.map((action) => action.actionType)).toEqual([
      'park',
      'flip',
    ]);
  });

  test('keeps the audio action visible, its card cannot render in the menu', () => {
    const { visible, overflow } = splitCallActions(
      createActions(['mute', 'keypad', 'audio']),
      2,
    );

    expect(visible.map((action) => action.actionType)).toEqual([
      'mute',
      'audio',
    ]);
    expect(overflow.map((action) => action.actionType)).toEqual(['keypad']);
  });
});
