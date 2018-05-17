export default class Notification {
  constructor() {
    this._enableNotification = false;
    this._notification = null;
    this._checkOrRequirePermission();
  }

  _checkOrRequirePermission() {
    if (!this.nativeAPI) {
      console.log('This browser does not support system notifications.');
      return;
    }
    if (this.hasPermission) {
      this._enableNotification = true;
      return;
    }
    if (this.nativeAPI.permission !== 'denied') {
      this.nativeAPI.requestPermission(() => {
        if (this.hasPermission) {
          this._enableNotification = true;
        }
      });
    }
  }

  notify({ title, text, icon, onClick }) {
    if (!this._enableNotification) {
      return;
    }
    const n = new window.Notification(title, { body: text, icon });
    n.onclick = onClick;
  }

  get hasPermission() {
    return this.nativeAPI.permission === 'granted';
  }

  get nativeAPI() {
    return window.Notification;
  }
}
