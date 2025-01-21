import type { ReactNode } from 'react';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state } from '@ringcentral-integration/core';

interface Widget {
  id: string;
  name: string;
  icon?: string;
  node?: ReactNode;
  onClose?: () => void;
}

@Module({
  name: 'SideDrawerUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'SideDrawerUIOptions',
  ],
})
export class SideDrawerUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  get enabled() {
    return this._deps.sideDrawerUIOptions.enableSideWidget;
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
  showTabs = false;

  @state
  variant = 'permanent';

  @action
  setVariant(variant: 'permanent' | 'temporary') {
    this.variant = variant;
  }

  @state
  widgets: Widget[] = [];

  @state
  currentWidgetId: String | null = null;

  @action
  openWidget(widget: Widget, clearOther = false) {
    if (clearOther) {
      this.widgets = [widget];
    } else {
      const index = this.widgets.findIndex((w) => w.name === widget.name);
      if (index === -1) {
        this.widgets.push(widget);
      } else {
        this.widgets[index] = widget;
      }
      this.showTabs = true;
    }
    this.currentWidgetId = widget.id;
    if (!this.show) {
      this.show = true;
    }
  }

  @action
  closeWidget(widgetId: string) {
    const index = this.widgets.findIndex((w) => w.id === widgetId);
    if (index > -1) {
      const widget = this.widgets[index];
      if (typeof widget.onClose === 'function') {
        widget.onClose();
      }
    }
    this.widgets = this.widgets.filter((w) => w.id !== widgetId);
    if (this.widgets.length === 0) {
      this.currentWidgetId = null;
      this.show = false;
    } else {
      if (index === -1) {
        return;
      }
      if (index < this.widgets.length) {
        this.currentWidgetId = this.widgets[index].id;
      } else {
        this.currentWidgetId = this.widgets[this.widgets.length - 1].id;
      }
    }
  }

  getUIProps() {
    const { locale } = this._deps;
    return {
      currentLocale: locale.currentLocale,
      show: this.show,
      variant: this.variant,
      widgets: this.widgets,
      currentWidgetId: this.currentWidgetId,
      showTabs: this.showTabs,
    };
  }

  getUIFunctions() {
    return {
      closeWidget: (widgetName: string) => this.closeWidget(widgetName),
      navigateTo: (path) => {
        this._deps.routerInteraction.push(path);
      },
    };
  }
}
