export default class Notification {
  private _enableNotification = false;

  constructor() {
    this._checkOrRequirePermission();
  }

  private _checkOrRequirePermission() {
    if (!this.nativeAPI) {
      console.log('This browser does not support system notifications.');
      return;
    }

    if (this.hasPermission) {
      this._enableNotification = true;
      return;
    }

    if (this.nativeAPI.permission === 'denied') {
      return;
    }

    const result = this.nativeAPI.requestPermission?.();
    if (result && typeof (result as Promise<NotificationPermission>).then === 'function') {
      void (result as Promise<NotificationPermission>).then(() => {
        if (this.hasPermission) {
          this._enableNotification = true;
        }
      });
    }
  }

  notify({
    title,
    text,
    icon,
    onClick,
  }: {
    title: string;
    text: string;
    icon?: string;
    onClick?: () => void;
  }) {
    if (!this._enableNotification) {
      return;
    }

    const notification = new window.Notification(title, {
      body: text,
      icon,
    });
    notification.onclick = onClick ?? null;
  }

  get hasPermission() {
    return this.nativeAPI?.permission === 'granted';
  }

  get nativeAPI() {
    return globalThis.window?.Notification;
  }
}
