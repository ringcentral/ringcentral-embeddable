import { clone, reduce } from 'ramda';

import type {
  CxAgentScriptResult,
  CxAgentScriptResultModel,
} from '../CxClient/interfaces';

/**
 * Normalize every answer to the `{ value, leadField }` shape the Engage
 * `saveScriptResult` API stores.
 */
export function formatAgentScriptResult(
  scriptResult: CxAgentScriptResult,
): CxAgentScriptResult {
  const resultCopy = clone(scriptResult);

  resultCopy.model = reduce(
    (output, [key, value]) => {
      const normalizedValue =
        value && typeof value === 'object' && 'value' in value
          ? value.value
          : value;

      output[key] = {
        value: normalizedValue,
        leadField:
          value && typeof value === 'object' && 'leadField' in value
            ? value.leadField ?? ''
            : '',
      };
      return output;
    },
    {} as CxAgentScriptResultModel,
    Object.entries(resultCopy.model ?? {}),
  );

  return resultCopy;
}
