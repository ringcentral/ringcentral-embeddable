/**
 * Resolves the legacy full-page transition target for the current layout.
 */
export function resolveDetailViewTransitionId(
  expanded: boolean,
  transitionId: string,
): string | undefined {
  return expanded ? undefined : transitionId;
}
