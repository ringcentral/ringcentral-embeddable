/**
 * Options for the CxSessionRecovery module.
 */
export interface CxSessionRecoveryOptions {
  /**
   * Route prefix the disposition page lives under. The recovered call id and
   * `/disposition` are appended to it.
   */
  dispositionPathPrefix?: string;
}
