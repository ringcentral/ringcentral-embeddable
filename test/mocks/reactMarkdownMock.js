const React = require('react');

function ReactMarkdownMock({ children }) {
  return React.createElement('div', null, children);
}

module.exports = ReactMarkdownMock;
module.exports.default = ReactMarkdownMock;
