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

  async submitEmergencyAddress() {
    await this._targetPage.waitForFunction(
      'document.querySelector("body").innerText.includes("Registered Address");'
    );
    await this._targetPage.waitFor('input[name="name"]');
    await this._targetPage.type('input[name="name"]', 'Test Name');
    await this._targetPage.type('input[name="address"]', '20 Davis Drive');
    await this._targetPage.type('input[name="city"]', 'Belmont');
    await this._targetPage.select('#state', '16');
    await this._targetPage.type('input[name="zipCode"]', '94002');
    await this._targetPage.click('input[name="isAccepted"]');
    await this._targetPage.click('button.btn-primary');
  }

  async confirmEmergencyAddress() {
    await this._targetPage.waitForFunction(
      'document.querySelector("body").innerText.includes("Confirm");'
    );
    await this._targetPage.click('button.btn-primary');
  }

  async authorize() {
    await this._targetPage.waitForFunction(
      'document.querySelector("body").innerText.includes("Access Request");'
    );
    await this._targetPage.click('button.btn-primary');
    await this._targetPage.waitFor(200);
    await this.confirmEmergencyAddress();
  }
}
