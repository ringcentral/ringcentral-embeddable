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
}
