export interface KrispNoiseFilterNode extends AudioNode {
  readonly isReady: boolean;
  enable(): void;
  disable(): void;
  dispose(): void;
}

export interface KrispSdk {
  init(): Promise<void>;
  createNoiseFilter(
    audioContext: AudioContext,
    onReady: () => void,
  ): Promise<KrispNoiseFilterNode>;
}

export interface KrispSdkConstructor {
  new (options: {
    params: {
      debugLogs: boolean;
      models: {
        model8: string;
        model16: string;
        model32: string;
      };
      workerUrl: string;
      workletUrl: string;
    };
  }): KrispSdk;
  isSupported(): boolean;
}

declare global {
  interface Window {
    KrispSDK?: KrispSdkConstructor;
  }
}
