export interface TabManagerOptions {
  fromPopup?: boolean;
  autoMainTab?: boolean;
  isMainTab?: boolean;
}

export interface TabManagerEvent {
  name: string;
  args: unknown[];
}
