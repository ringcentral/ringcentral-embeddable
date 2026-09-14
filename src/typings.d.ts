interface Window {
  __rc_shared_worker__?: {
    /** Relative versioned worker URL used by next-core for cross-tab checks. */
    url: string;
    worker: SharedWorker;
  };
  workerScriptsFail?: {
    renderLoadFail?: () => void;
  };
}
