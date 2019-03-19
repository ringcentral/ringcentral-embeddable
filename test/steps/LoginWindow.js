export class LoginWindow {
  constructor(targetPage, username, password) {
    this._targetPage = targetPage;
    this._username = username;
    this._password = password;
  }

  async submitCredential() {
    await this._targetPage.waitFor('button[type="submit"]');
    await this._targetPage.type('input[name="credential"]', this._username);
    await this._targetPage.click('button[type="submit"]');
    await this._targetPage.waitFor('input[name="Password"]');
    await this._targetPage.waitFor(1200);
    await this._targetPage.type('input[name="Password"]', this._password);
    await this._targetPage.waitFor(200);
    await this._targetPage.click('button[type="submit"]');
  }

  async authorize() {
    await this._targetPage.waitForFunction(
      'document.querySelector("body").innerText.includes("Access Request");'
    );
    await this._targetPage.click('button.btn-primary');
  }
}
