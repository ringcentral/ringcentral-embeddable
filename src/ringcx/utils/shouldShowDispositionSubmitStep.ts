export interface DispositionStepCall {
  callType?: string | null;
  outdialDispositions?: {
    dispositions?: unknown[] | null;
  } | null;
}

export interface DispositionStepOptions {
  hideCallNote?: boolean;
}

/**
 * The submit step is only needed when the current configuration leaves
 * at least one actionable disposition input for the agent.
 */
export function shouldShowDispositionSubmitStep(
  call?: DispositionStepCall | null,
  options?: DispositionStepOptions,
): boolean {
  if (!options?.hideCallNote) {
    return true;
  }

  const dispositions = call?.outdialDispositions?.dispositions;
  if (!Array.isArray(dispositions) || dispositions.length === 0) {
    return false;
  }

  return call?.callType === 'INBOUND';
}
