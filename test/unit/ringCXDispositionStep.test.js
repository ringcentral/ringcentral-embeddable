// A RingCX call asks for a disposition after it ends only when it has
// dispositions for the agent to pick from, as in Agent One.

const {
  shouldShowDispositionSubmitStep,
} = require('../../src/ringcx/utils/shouldShowDispositionSubmitStep');

const DISPOSITIONS = { dispositions: [{ dispositionId: '10' }] };

describe('shouldShowDispositionSubmitStep', () => {
  test.each(['INBOUND', 'OUTBOUND'])('shows the step for a %s call with dispositions', (callType) => {
    expect(
      shouldShowDispositionSubmitStep({
        callType,
        outdialDispositions: DISPOSITIONS,
      }),
    ).toBe(true);
  });

  test.each([
    ['no call', undefined],
    ['no disposition list', {}],
    ['an empty disposition list', { outdialDispositions: { dispositions: [] } }],
    [
      'dispositions turned off for its queue',
      { outdialDispositions: DISPOSITIONS, surveyPopType: 'SUPPRESS' },
    ],
  ])('skips the step for %s', (_name, call) => {
    expect(shouldShowDispositionSubmitStep(call)).toBe(false);
  });
});
