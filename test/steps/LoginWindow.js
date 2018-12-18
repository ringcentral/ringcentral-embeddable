export class LoginWindow {
  constructor(targetPage) {
    this._targetPage = targetPage;
  }

  async submitCredential() {
    await this._targetPage.waitFor('button[type="submit"]');
    await this._targetPage.type('input[name="credential"]', __USER_NAME__);
    await this._targetPage.click('button[type="submit"]');
    await this._targetPage.waitFor('input[name="Password"]');
    await this._targetPage.waitFor(1200);
    await this._targetPage.type('input[name="Password"]', __USER_PASSWORD__);
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
