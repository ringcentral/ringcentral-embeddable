import { resolveDetailViewTransitionId } from '../src/app/AppView.helper';

describe('resolveDetailViewTransitionId', () => {
  const transitionId = 'view-transition-detail';

  test('keeps the legacy full-page transition target when folded', () => {
    expect(resolveDetailViewTransitionId(false, transitionId)).toBe(
      transitionId,
    );
  });

  test('removes the legacy full-page transition target when expanded', () => {
    expect(resolveDetailViewTransitionId(true, transitionId)).toBeUndefined();
  });
});
