/**
 * CxDirectorySearch options for configuration
 */
export interface CxDirectorySearchOptions {
  // Optional configuration options
}

/**
 * Main number information for a directory record's account
 */
export interface DirectoryAccountMainNumber {
  formattedPhoneNumber?: string;
  phoneNumber?: string;
  type?: string | null;
  label?: string | null;
}

/**
 * Account information attached to a directory record
 */
export interface DirectoryRecordAccount {
  id?: string;
  mainNumber?: DirectoryAccountMainNumber | null;
}

/**
 * A single corporate directory search record
 */
export interface DirectoryRecord {
  id: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  name?: string | null;
  extensionNumber: string;
  presenceStatus?: string;
  phoneNumbers?: unknown;
  type?: string;
  account?: DirectoryRecordAccount;
}

/**
 * Response shape of cxClient.searchDirectory
 */
export interface SearchDirectoryResponse {
  rcAccountId?: string;
  pbxDirectoryEnable?: boolean;
  mainNumber?: string;
  records?: DirectoryRecord[];
}

/**
 * Consumers of the directory search each get their own slice of results.
 *
 * There is a single CxDirectorySearch instance on the server port, so without a
 * key the dial page and the transfer panel would share one result list: opening
 * the transfer panel would show whatever the dialer last searched, and typing in
 * either one would wipe the other's results out from under it.
 */
export const directorySearchScopes = {
  dialer: 'dialer',
  transferManualEntry: 'transferManualEntry',
} as const;

export type DirectorySearchScope =
  (typeof directorySearchScopes)[keyof typeof directorySearchScopes];

/**
 * Per-scope search state; only what the UI reads lives here.
 */
export interface DirectorySearchScopeState {
  records: DirectoryRecord[];
  mainNumber: string;
  isSearching: boolean;
}
