/** `surveyPopType` of a queue or campaign whose disposition is turned off. */
const SUPPRESSED_SURVEY_POP_TYPE = 'SUPPRESS';

export interface DispositionStepCall {
  surveyPopType?: string | null;
  outdialDispositions?: {
    dispositions?: unknown[] | null;
  } | null;
}

/**
 * The submit step is only needed when the call has dispositions for the agent
 * to pick from, as in Agent One. A call without any is logged when it ends.
 */
export function shouldShowDispositionSubmitStep(
  call?: DispositionStepCall | null,
): boolean {
  if (call?.surveyPopType === SUPPRESSED_SURVEY_POP_TYPE) {
    return false;
  }
  const dispositions = call?.outdialDispositions?.dispositions;
  return Array.isArray(dispositions) && dispositions.length > 0;
}
