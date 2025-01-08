import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state } from '@ringcentral-integration/core';

@Module({
  name: 'SideDrawerUI',
  deps: [
    'Locale',
  ],
})
export class SideDrawerUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  onInitOnce() {
    const handleResize = () => {
      const newVariant = window.innerWidth > 500 ? 'permanent' : 'temporary';
      if (this.variant === newVariant) {
        return;
      }
      this.setVariant(newVariant);
    };
    window.addEventListener('resize', handleResize);
  }

  @state
  show = false;

  @action
  setShow(show: boolean) {
    this.show = show;
  }

  @state
  variant = 'permanent';

  @action
  setVariant(variant: 'permanent' | 'temporary') {
    this.variant = variant;
  }

  getUIProps() {
    const { locale } = this._deps;
    return {
      currentLocale: locale.currentLocale,
      show: this.show,
      variant: this.variant,
    };
  }

  getUIFunctions() {
    return {};
  }
}
