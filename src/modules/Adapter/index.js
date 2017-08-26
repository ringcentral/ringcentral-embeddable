import classnames from 'classnames';
import styles from './styles.scss';
// eslint-disable-next-line
import ribbonStyles from '!css-loader?{"localIdentName":"[path]_[name]_[local]_[hash:base64:5]","modules":true}!postcss-loader?{}!sass-loader?{"outputStyle":"expanded","includePaths":["src","node_modules"]}!./styles.scss';

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
    this._appUrl = appUrl;
    this._root = this._initContentDOM(prefix, appUrl);
    this._headerEl = this._root.querySelector(
      `.${styles.header}`
    );
    this._logoEl = this._root.querySelector(
      `.${styles.logo}`
    );
    this._contentFrameEl = this._root.querySelector(
      `.${styles.contentFrame}`
    );
    this._contentFrameContainerEl = this._root.querySelector(
      `.${styles.frameContainer}`
    );
    this._toggleEl = this._root.querySelector(
      `.${styles.toggle}`
    );
    this._closeEl = this._root.querySelector(
      `.${styles.close}`
    );
    this._presenceEl = this._root.querySelector(
      `.${styles.presence}`
    );

    this._minTranslateX = 0;
    this._translateX = 0;
    this._translateY = 0;
    this._appWidth = 0;
    this._appHeight = 0;
    this._dragStartPosition = null;

    this._closed = true;
    this._minimized = false;
    this._appFocus = false;
    this._dragging = false;
    this._hover = false;
    this._testMode = testMode;

    this._version = version;
    this._loading = true;

    // logo_
    this._logoUrl = logoUrl;
    if (logoUrl) {
      this._logoEl.src = logoUrl;
    }
    this._logoEl.addEventListener('dragstart', () => false);

    // content
    this._contentFrameEl
      .setAttribute('class', `${[styles.contentFrame, className].join(' ')}`);

    // toggle button
    this._toggleEl.addEventListener('click', () => {
      this.toggleMinimized();
    });

    // close button
    this._closeEl.addEventListener('click', () => {
      this.setClosed(true);
    });

    this._presenceEl.addEventListener('click', () => {
      this.gotoPresence();
    });

    this.syncClass();
    this.setPresence({});
    this.setSize({ width: this._appWidth, height: this._appHeight });
    this.renderRestrictedPosition();

    this._headerEl.addEventListener('mousedown', (e) => {
      this._dragging = true;
      this._dragStartPosition = {
        x: e.clientX,
        y: e.clientY,
        translateX: this._translateX,
        translateY: this._translateY,
        minTranslateX: this._minTranslateX,
      };
      this.syncClass();
    });
    this._headerEl.addEventListener('mouseup', () => {
      this._dragging = false;
      this.syncClass();
    });
    window.parent.addEventListener('mousemove', (e) => {
      if (this._dragging) {
        if (e.buttons === 0) {
          this._dragging = false;
          this.syncClass();
          return;
        }
        const delta = {
          x: e.clientX - this._dragStartPosition.x,
          y: e.clientY - this._dragStartPosition.y,
        };
        if (this._minimized) {
          this._minTranslateX = this._dragStartPosition.minTranslateX + delta.x;
        } else {
          this._translateX = this._dragStartPosition.translateX + delta.x;
          this._translateY = this._dragStartPosition.translateY + delta.y;
        }
        this.renderRestrictedPosition();
      }
    });

    this._resizeTimeout = null;
    this._resizeTick = null;
    window.parent.addEventListener('resize', () => {
      if (this._dragging) { return; }
      if (this._resizeTimeout) { clearTimeout(this._resizeTimeout); }
      this._resizeTimeout = setTimeout(() => this.renderRestrictedPosition(), 100);
      if (!this._resizeTick || Date.now() - this._resizeTick > 50) {
        this._resizeTick = Date.now();
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
          case 'rc-call-ring-notify':
            console.log('new ring call:');
            console.log(data.call);
            break;
          case 'rc-call-end-notify':
            console.log('new end call:');
            console.log(data.call);
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

    this._root.addEventListener('mouseenter', () => {
      this._hover = true;
      this.syncClass();
    });
    this._root.addEventListener('mouseleave', () => {
      this._hover = false;
      this.syncClass();
    });

    const phoneCallTags = window.document.querySelectorAll('a[href^="tel:"]');
    phoneCallTags.forEach((phoneTag) => {
      phoneTag.addEventListener('click', () => {
        const hrefStr = phoneTag.getAttribute('href');
        const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
        this.clickToCall(phoneNumber);
      });
    });
    const phoneSMSTags = window.document.querySelectorAll('a[href^="sms:"]');
    phoneSMSTags.forEach((phoneTag) => {
      phoneTag.addEventListener('click', () => {
        const hrefStr = phoneTag.getAttribute('href');
        const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
        this.clickToSMS(phoneNumber);
      });
    });
  }

  _initContentDOM(prefix, appUrl) {
    const topDocument = window.document;
    let divEl = topDocument.querySelector(`#${prefix}`);
    const iframeSrc = `${appUrl}?_t=${Date.now()}`;
    if (divEl) return divEl;
    divEl = this._generateContentDOM(topDocument, prefix, iframeSrc);
    topDocument.body.appendChild(divEl);
    return divEl;
  }

  // eslint-disable-next-line
  _generateContentDOM(topDocument, prefix, iframeSrc) {
    const divEl = topDocument.createElement('div');
    divEl.id = prefix;
    divEl.setAttribute('class', classnames(styles.root, styles.loading));
    divEl.draggable = false;

    divEl.innerHTML = `
      <style>${ribbonStyles.toString()}</style>
      <header class="${styles.header}" draggable="false">
        <div class="${styles.presence}">
          <div class="${styles.presenceBar}">
          </div>
        </div>
        <div class="${styles.button} ${styles.toggle}">
          <div class="${styles.minimizeIcon}">
            <div class="${styles.minimizeIconBar}"></div>
          </div>
        </div>
        <div class="${styles.button} ${styles.close}">
          <div class="${styles.closeIcon}">
            <div></div><div></div>
          </div>
        </div>
        <img class="${styles.logo}" draggable="false"></img>
      </header>
      <div class="${styles.frameContainer}">
        <iframe id="${prefix}-adapter-frame" class="${styles.contentFrame}" src="${iframeSrc}">
        </iframe>
      </div>
    `;
    return divEl;
  }

  _postMessage(data) {
    if (this._contentFrameEl.contentWindow) {
      this._contentFrameEl.contentWindow.postMessage(data, '*');
    }
  }

  renderPosition() {
    this._postMessage({
      type: 'rc-adapter-sync-position',
      translateX: this._translateX,
      translateY: this._translateY,
      minTranslateX: this._minTranslateX,
    });
    if (this._minimized) {
      this._root.setAttribute(
        'style',
        `transform: translate( ${this._minTranslateX}px, 0)!important;`
      );
    } else {
      this._root.setAttribute(
        'style',
        `transform: translate(${this._translateX}px, ${this._translateY}px)!important;`
      );
    }
  }

  renderRestrictedPosition() {
    const style = document.defaultView.getComputedStyle(this._root, null);
    const paddingX = (parseFloat(style.paddingLeft, 10) || 0) +
      (parseFloat(style.paddingRight, 10) || 0);
    const paddingY = (parseFloat(style.paddingTop, 10) || 0) +
      (parseFloat(style.paddingBottom, 10) || 0);
    const borderX = (parseFloat(style.borderLeftWidth, 10) || 0) +
      (parseFloat(style.borderRightWidth, 10) || 0);
    const borderY = (parseFloat(style.borderTopWidth, 10) || 0) +
      (parseFloat(style.borderBottomWidth, 10) || 0);
    const maximumX = window.parent.innerWidth -
      (this._minimized ? this._headerEl.clientWidth : this._appWidth) - paddingX - borderX;
    const maximumY = window.parent.innerHeight -
      (this._minimized ?
        this._headerEl.clientHeight :
        this._headerEl.clientHeight + this._appHeight) - paddingY - borderY;

    if (this._minimized) {
      let x = this._minTranslateX;
      x = Math.min(x, maximumX);
      this._minTranslateX = Math.max(x, 0);
    } else {
      let x = this._translateX;
      let y = this._translateY;
      x = Math.min(x, maximumX);
      x = Math.max(x, 0);
      y = Math.min(y, 0);
      y = Math.max(y, -maximumY);
      this._translateX = x;
      this._translateY = y;
    }
    //
    this.renderPosition();
  }

  renderAdapterSize() {
    if (this._minimized) {
      this._contentFrameEl.style.width = 0;
      this._contentFrameEl.style.height = 0;
      this._contentFrameContainerEl.style.width = 0;
      this._contentFrameContainerEl.style.height = 0;
    } else {
      this._contentFrameEl.style.width = `${this._appWidth}px`;
      this._contentFrameEl.style.height = `${this._appHeight}px`;
      this._contentFrameContainerEl.style.width = `${this._appWidth}px`;
      this._contentFrameContainerEl.style.height = `${this._appHeight}px`;
    }
  }

  syncClass() {
    //  console.debug('this.sparkled>>>', this.sparkled);
    this._root.setAttribute('class', classnames(
      styles.root,
      this._closed && styles.closed,
      this._minimized && styles.minimized,
      this._appFocus && styles.focus,
      this._dragging && styles.dragging,
      this._hover && styles.hover,
      this._loading && styles.loading,
      this._ringing && styles.ringing,
    ));
  }

  setClosed(closed) {
    this._closed = !!closed;
    this.syncClass();
    this._postMessage({
      type: 'rc-adapter-closed',
      closed: this._closed,
    });
  }

  toggleClosed() {
    this.setClosed(!this._closed);
  }

  setMinimized(minimized) {
    this._minimized = !!minimized;
    this.syncClass();
    this.renderAdapterSize();
    this.renderRestrictedPosition();
    this._postMessage({
      type: 'rc-adapter-minimized',
      minimized: this._minimized,
    });
  }

  toggleMinimized() {
    this.setMinimized(!this._minimized);
  }

  setRinging(ringing) {
    this._ringing = !!ringing;
    this.syncClass();
  }

  setFocus(focus) {
    this._appFocus = !!focus;
    this.syncClass();
    this._postMessage({
      type: 'rc-adapter-focus',
      focus: this._appFocus,
    });
  }

  setSize({ width, height }) {
    this._appWidth = width;
    this._appHeight = height;
    this._contentFrameEl.style.width = `${width}px`;
    this._contentFrameEl.style.height = `${height}px`;
    this.renderAdapterSize();
    this._postMessage({
      type: 'rc-adapter-size',
      size: {
        width: this._appWidth,
        height: this._appHeight,
      },
    });
  }

  setPresence(presence) {
    if (presence !== this.presence) {
      this.presence = presence;
      this._presenceEl.setAttribute('class', classnames(
        this._minimized && styles.minimized,
        styles.presence,
        styles[presence.userStatus],
        styles[presence.dndStatus],
      ));
    }
  }

  gotoPresence() {
    this._postMessage({
      type: 'rc-adapter-goto-presence',
      version: this._version,
    });
  }

  reportVersion() {
    this._postMessage({
      type: 'rc-version-response',
      version: this._version,
    });
  }

  setEnvironment() {
    this._postMessage({
      type: 'rc-adapter-set-environment',
    });
  }

  clickToSMS(phoneNumber) {
    this._postMessage({
      type: 'rc-adapter-new-sms',
      phoneNumber,
    });
  }

  clickToCall(phoneNumber, toCall = false) {
    this._postMessage({
      type: 'rc-adapter-new-call',
      phoneNumber,
      toCall,
    });
  }

  init({ size, minimized, closed, position: { translateX, translateY, minTranslateX } }) {
    this._postMessage({
      type: 'rc-adapter-mode',
      testMode: this._testMode,
    });
    this._minimized = minimized;
    this._closed = closed;
    this._translateX = translateX;
    this._translateY = translateY;
    this._minTranslateX = minTranslateX;
    this._loading = false;
    this.syncClass();
    this.setSize(size);
    this.renderRestrictedPosition();
  }
}

export default Adapter;
