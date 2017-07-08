import classnames from 'classnames';
import styles from './styles.scss';
import ribbonStyles from '../RibbonController/styles.scss';

class Adapter {
  constructor({
    logoUrl,
    appUrl,
    prefix = 'rc-integration',
    brand,
    className,
    testMode = false,
    version,
  } = {}) {
    this._prefix = prefix;
    this._brand = brand;
    this.mainEl = window.parent.document.querySelector(`#${prefix}`);
    this.headerEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.header}`
    );
    this.logoEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.logo}`
    );
    this.adapterFrameEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.frame}`
    );
    this.adapterFrameContainerEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.frameContainer}`
    );
    this.toggleEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.toggle}`
    );
    this.closeEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.close}`
    );
    this.presenceEl = window.parent.document.querySelector(
      `#${prefix} .${ribbonStyles.presence}`
    );
    this.contentFrameEl = document.createElement('iframe');
    this.contentFrameEl.id = `${prefix}-cti-frame`;

    this.minTranslateX = 0;
    this.translateX = 0;
    this.translateY = 0;
    this.appWidth = 0;
    this.appHeight = 0;
    this.dragStartPosition = null;

    this.closed = true;
    this.minimized = false;
    this.appFocus = false;
    this.dragging = false;
    this.hover = false;
    this.testMode = testMode;

    this.version = version;
    this.loading = true;

    // logo
    if (logoUrl) {
      this.logoEl.src = logoUrl;
    }
    this.logoEl.addEventListener('dragstart', () => false);

    // content
    this.contentFrameEl
      .setAttribute('class', `${[styles.contentFrame, className].join(' ')}`);
    if (appUrl) {
      this.contentFrameEl.src = `${appUrl}?_t=${Date.now()}`;
    }

    // toggle button
    this.toggleEl.addEventListener('click', () => {
      this.toggleMinimized();
    });

    // close button
    this.closeEl.addEventListener('click', () => {
      this.setClosed(true);
    });

    this.presenceEl.addEventListener('click', () => {
      this.gotoPresence();
    });

    this.syncClass();
    this.setPresence({});
    this.setSize({ width: this.appWidth, height: this.appHeight });
    this.renderRestrictedPosition();

    document.body.appendChild(this.contentFrameEl);
    this.headerEl.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.dragStartPosition = {
        x: e.clientX,
        y: e.clientY,
        translateX: this.translateX,
        translateY: this.translateY,
        minTranslateX: this.minTranslateX,
      };
      this.syncClass();
    });
    this.headerEl.addEventListener('mouseup', () => {
      this.dragging = false;
      this.syncClass();
    });
    window.parent.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        if (e.buttons === 0) {
          this.dragging = false;
          this.syncClass();
          return;
        }
        const delta = {
          x: e.clientX - this.dragStartPosition.x,
          y: e.clientY - this.dragStartPosition.y,
        };
        if (this.minimized) {
          this.minTranslateX = this.dragStartPosition.minTranslateX + delta.x;
        } else {
          this.translateX = this.dragStartPosition.translateX + delta.x;
          this.translateY = this.dragStartPosition.translateY + delta.y;
        }
        this.renderRestrictedPosition();
      }
    });

    let [resizeTimeout, resizeTick] = [];
    window.parent.addEventListener('resize', () => {
      if (this.dragging) { return; }
      if (resizeTimeout) { clearTimeout(resizeTimeout); }
      resizeTimeout = setTimeout(() => this.renderRestrictedPosition(), 100);
      if (!resizeTick || Date.now() - resizeTick > 50) {
        resizeTick = Date.now();
        this.renderRestrictedPosition();
      }
    });

    window.addEventListener('message', (e) => {
      const data = e.data;
      if (data) {
        switch (data.type) {
          case 'rc-set-closed':
            this.setClosed(data.closed);
            break;
          case 'rc-set-minimized':
            this.setMinimized(data.minimized);
            break;
          case 'rc-set-ringing':
            this.setRinging(data.ringing);
            break;
          case 'rc-set-size':
            this.setSize(data.size);
            break;
          case 'rc-set-focus':
            this.setFocus(data.focus);
            break;
          case 'rc-set-presence':
            this.setPresence(data.presence);
            break;
          case 'rc-version':
            this.reportVersion();
            break;
          case 'rc-adapter-init':
            this.init(data);
            break;
          case 'rc-ribbon-default':
            this.setClosed(false);
            this.setMinimized(false);
            break;
          default:
            break;
        }
      }
    });

    this.mainEl.addEventListener('mouseenter', () => {
      this.hover = true;
      this.syncClass();
    });
    this.mainEl.addEventListener('mouseleave', () => {
      this.hover = false;
      this.syncClass();
    });
  }

  _postMessage(data) {
    if (this.contentFrameEl.contentWindow) {
      this.contentFrameEl.contentWindow.postMessage(data, '*');
    }
  }

  renderPosition() {
    this._postMessage({
      type: 'rc-adapter-sync-position',
      translateX: this.translateX,
      translateY: this.translateY,
      minTranslateX: this.minTranslateX,
    });
    if (this.minimized) {
      this.mainEl.style.transform = `translate( ${this.minTranslateX}px, 0)`;
    } else {
      this.mainEl.style.transform = `translate( ${this.translateX}px, ${this.translateY}px)`;
    }
  }

  renderRestrictedPosition() {
    const style = document.defaultView.getComputedStyle(this.mainEl, null);
    const paddingX = (parseFloat(style.paddingLeft, 10) || 0) +
      (parseFloat(style.paddingRight, 10) || 0);
    const paddingY = (parseFloat(style.paddingTop, 10) || 0) +
      (parseFloat(style.paddingBottom, 10) || 0);
    const borderX = (parseFloat(style.borderLeftWidth, 10) || 0) +
      (parseFloat(style.borderRightWidth, 10) || 0);
    const borderY = (parseFloat(style.borderTopWidth, 10) || 0) +
      (parseFloat(style.borderBottomWidth, 10) || 0);
    const maximumX = window.parent.innerWidth -
      (this.minimized ? this.headerEl.clientWidth : this.appWidth) - paddingX - borderX;
    const maximumY = window.parent.innerHeight -
      (this.minimized ?
        this.headerEl.clientHeight :
        this.headerEl.clientHeight + this.appHeight) - paddingY - borderY;

    if (this.minimized) {
      let x = this.minTranslateX;
      x = Math.min(x, maximumX);
      this.minTranslateX = Math.max(x, 0);
    } else {
      let x = this.translateX;
      let y = this.translateY;
      x = Math.min(x, maximumX);
      x = Math.max(x, 0);
      y = Math.min(y, 0);
      y = Math.max(y, -maximumY);
      this.translateX = x;
      this.translateY = y;
    }
    //
    this.renderPosition();
  }

  renderAdapterSize() {
    if (this.minimized) {
      this.adapterFrameEl.style.width = 0;
      this.adapterFrameEl.style.height = 0;
      this.adapterFrameContainerEl.style.width = 0;
      this.adapterFrameContainerEl.style.height = 0;
    } else {
      this.adapterFrameEl.style.width = `${this.appWidth}px`;
      this.adapterFrameEl.style.height = `${this.appHeight}px`;
      this.adapterFrameContainerEl.style.width = `${this.appWidth}px`;
      this.adapterFrameContainerEl.style.height = `${this.appHeight}px`;
    }
  }

  syncClass() {
    //  console.debug('this.sparkled>>>', this.sparkled);
    this.mainEl.setAttribute('class', classnames(
      ribbonStyles.root,
      this.closed && ribbonStyles.closed,
      this.minimized && ribbonStyles.minimized,
      this.appFocus && ribbonStyles.focus,
      this.dragging && ribbonStyles.dragging,
      this.hover && ribbonStyles.hover,
      this.loading && ribbonStyles.loading,
      this.ringing && ribbonStyles.ringing,
    ));
  }

  setClosed(closed) {
    this.closed = !!closed;
    this.syncClass();
    this._postMessage({
      type: 'rc-adapter-closed',
      closed: this.closed,
    });
  }

  toggleClosed() {
    this.setClosed(!this.closed);
  }

  setMinimized(minimized) {
    this.minimized = !!minimized;
    this.syncClass();
    this.renderAdapterSize();
    this.renderRestrictedPosition();
    this._postMessage({
      type: 'rc-adapter-minimized',
      minimized: this.minimized,
    });
  }

  toggleMinimized() {
    this.setMinimized(!this.minimized);
  }

  setRinging(ringing) {
    this.ringing = !!ringing;
    this.syncClass();
  }

  setFocus(focus) {
    this.appFocus = !!focus;
    this.syncClass();
    this._postMessage({
      type: 'rc-adapter-focus',
      focus: this.appFocus,
    });
  }

  setSize({ width, height }) {
    this.appWidth = width;
    this.appHeight = height;
    this.contentFrameEl.style.width = `${width}px`;
    this.contentFrameEl.style.height = `${height}px`;
    this.renderAdapterSize();
    this._postMessage({
      type: 'rc-adapter-size',
      size: {
        width: this.appWidth,
        height: this.appHeight,
      },
    });
  }

  setPresence(presence) {
    if (presence !== this.presence) {
      this.presence = presence;
      this.presenceEl.setAttribute('class', classnames(
        this.minimized && ribbonStyles.minimized,
        ribbonStyles.presence,
        ribbonStyles[presence.userStatus],
        ribbonStyles[presence.dndStatus],
      ));
    }
  }

  gotoPresence() {
    this._postMessage({
      type: 'rc-adapter-goto-presence',
      version: this.version,
    });
  }

  reportVersion() {
    this._postMessage({
      type: 'rc-version-response',
      version: this.version,
    });
  }

  init({ size, minimized, closed, position: { translateX, translateY, minTranslateX } }) {
    this._postMessage({
      type: 'rc-adapter-mode',
      testMode: this.testMode,
    });
    this.minimized = minimized;
    this.closed = closed;
    this.translateX = translateX;
    this.translateY = translateY;
    this.minTranslateX = minTranslateX;
    this.loading = false;
    this.syncClass();
    this.setSize(size);
    this.renderRestrictedPosition();
  }
}

export default Adapter;
