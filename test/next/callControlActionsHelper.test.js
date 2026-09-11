import {
  addEmbeddableCallActions,
  MAX_VISIBLE_CALL_ACTIONS,
  splitCallActions,
} from '../../next/app/views/CallView/CallControlView/CallControl.helper';

const baseActions = [
  { type: 'mute' },
  { type: 'keypad' },
  { type: 'hold' },
  { type: 'transfer' },
  { type: 'record' },
  { type: 'hangUp' },
];

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

  test('always moves flip into the overflow menu', () => {
    const { visible, overflow } = splitCallActions(
      createActions(['mute', 'flip']),
    );

    expect(visible.map((action) => action.actionType)).toEqual(['mute']);
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
