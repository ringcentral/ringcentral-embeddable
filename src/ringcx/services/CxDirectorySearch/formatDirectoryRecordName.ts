import type { DirectoryRecord } from './CxDirectorySearch.interface';

/**
 * Build a display name for a directory record.
 *
 * A standalone function rather than a module method because the presentational
 * components that render result lists have no module access.
 */
export const formatDirectoryRecordName = (record: DirectoryRecord): string => {
  const fullName = [record.firstName, record.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || record.name || record.extensionNumber;
};
