import Brand from 'ringcentral-integration/modules/Brand';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewBrand',
  deps: []
})
export default class NewBrand extends Brand {
  constructor({
    teleconference,
    ...options
  }) {
    super(options);
    
   this._teleconference = teleconference;
  }

  get teleconference() {
    return this._teleconference;
  }

  get brandConfig() {
    return {
      name: this.name,
      id: this.id,
      teleconference: this.teleconference,
      brandCode: this.code,
      code: this.code,
      appName: this.appName,
      fullName: this.fullName,
      application: this.application,
    }
  }
}
