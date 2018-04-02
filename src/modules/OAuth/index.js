import ProxyFrameOAuth from 'ringcentral-widgets/modules/ProxyFrameOAuth';
import { Module } from 'ringcentral-integration/lib/di';
import qs from 'qs';

@Module({
  name: 'OAuth',
  deps: []
})
export default class OAuth extends ProxyFrameOAuth {
  get oAuthUri() {
    const extendedQuery = qs.stringify({
      localeId: this._locale.currentLocale,
      ui_options: 'hide_remember_me hide_tos',
    });
    return `${this._auth.getLoginUrl({
      redirectUri: this.redirectUri,
      brandId: this._brand.id,
      state: btoa(Date.now()),
      display: 'page',
      implicit: this._auth.isImplicit,
    })}&${extendedQuery}`;
  }
}
