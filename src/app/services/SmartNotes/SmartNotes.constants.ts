export const SMART_NOTES_CONFIG = {
  autoStartDelay: 2000,
  autoStartRetryDelay: 5000,
  callQueryLimit: 100,
  recentCallLimit: 5,
  storeLimit: 20,
  noteFetchRetryCount: 3,
  noteFetchRetryDelay: 5000,
  trackEvents: {
    view: 'View smart notes',
    start: 'Start smart notes',
    enable: 'Enable smart note widget',
    disable: 'Disable smart note widget',
    enableAutoStart: 'Enable smart note auto start',
    disableAutoStart: 'Disable smart note auto start',
  },
} as const;
