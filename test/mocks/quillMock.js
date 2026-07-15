class QuillMock {
  constructor(element) {
    this.root = element || document.createElement('div');
    this.scroll = {
      domNode: this.root,
    };
    this.clipboard = {
      convert: ({ text } = {}) => ({
        ops: [{ insert: text || '' }],
      }),
    };
  }

  static register() {}

  getLength() {
    return 1;
  }

  getText() {
    return '';
  }

  getContents() {
    return { ops: [{ insert: '\n' }] };
  }

  getSelection() {
    return null;
  }

  getBounds() {
    return {};
  }

  setContents() {}

  setSelection() {}

  enable() {}

  on() {}

  off() {}
}

module.exports = QuillMock;
module.exports.default = QuillMock;
