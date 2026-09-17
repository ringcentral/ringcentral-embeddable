import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const sfSearchTypes = ObjectMap.prefixKeys(
  ['recordId', 'caseId', 'objectValue'],
  'sfSearch',
);

export type SfSearchType = keyof typeof sfSearchTypes;
