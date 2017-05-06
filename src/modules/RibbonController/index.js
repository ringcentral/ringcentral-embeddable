import classnames from 'classnames';
import styles from './styles.scss';
// Hack to get compiled styles for injecting into dom
// eslint-disable-next-line
import ribbonStyles from '!css-loader?{"localIdentName":"[path]_[name]_[local]_[hash:base64:5]","modules":true}!postcss-loader?{}!sass-loader?{"outputStyle":"expanded","includePaths":["src","node_modules"]}!./styles.scss';


// instance methods are written to auto bind scope to avoid issues in dynamics environment

class RibbonController {
  constructor({
    adapterUrl,
    prefix = 'rc-integration',
   }) {
    this.adapterUrl = adapterUrl;
    this.prefix = prefix;

    // bind init function's scope due to how dynamics calls these functions
    this.init = this::this.init;
  }

  /**
   * @function
   * @description init is used as the enabling rule
   */
  init = () => {
    const topWindow = window.RC.getTopWindow();
    const topDocument = topWindow.document;
    let divEl = topDocument.querySelector(`#${this.prefix}`);

    if (divEl) return true;


    divEl = topDocument.createElement('div');
    divEl.id = this.prefix;
    divEl.setAttribute('class', classnames(styles.root, styles.loading));
    divEl.draggable = false;

    divEl.innerHTML = `
      <style>${ribbonStyles.toString()}</style>
      <header class="${styles.header}" draggable="false">
        <div class="${styles.presence} ${styles.NoPresence}">
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
        <iframe id="${this.prefix}-adapter-frame" class="${styles.frame}" src="${this.adapterUrl}">
        </iframe>
      </div>
      <div class="${styles.dragOverlay}"></div>
    `;

    topDocument.body.appendChild(divEl);

    return true;
  }

  getTopWindow = () => {
    let topWindow = window;
    while (topWindow.parent !== topWindow) {
      topWindow = topWindow.parent;
    }
    return topWindow;
  }

  defaultCommand = () => {
    const topWindow = window.RC.getTopWindow();
    const topDocument = topWindow.document;
    const adapterFrame = topDocument.querySelector(`#${this.prefix}-adapter-frame`);
    if (adapterFrame) {
      adapterFrame.contentWindow.postMessage({
        type: 'rc-ribbon-default',
      }, '*');
    }
  }
}

export default RibbonController;
