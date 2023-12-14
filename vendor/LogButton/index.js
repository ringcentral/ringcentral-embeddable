"use strict";

require("core-js/modules/es.array.slice");
require("core-js/modules/es.object.define-properties");
require("core-js/modules/es.object.freeze");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireDefault(require("react"));
var _juno = require("@ringcentral/juno");
var _foundation = require("@ringcentral/juno/foundation");
var _junoIcon = require("@ringcentral/juno-icon");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n  margin-right: 0;\n  position: absolute;\n  right: -4px;\n  bottom: 6px;\n"]);
  _templateObject2 = function _templateObject2() {
    return data;
  };
  return data;
}
function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  position: relative;\n  width: 16px;\n"]);
  _templateObject = function _templateObject() {
    return data;
  };
  return data;
}
function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }
var StyledWrapper = _foundation.styled.div(_templateObject());
var StyledSpinner = (0, _foundation.styled)(_juno.RcCircularProgress)(_templateObject2());
var LogButton = function LogButton(_ref) {
  var className = _ref.className,
    onLog = _ref.onLog,
    isLogged = _ref.isLogged,
    disableLinks = _ref.disableLinks,
    isLogging = _ref.isLogging;
  if (!isLogged) {
    return null;
  }
  var spinner = isLogging ? /*#__PURE__*/_react["default"].createElement(StyledSpinner, {
    size: 11
  }) : null;
  return /*#__PURE__*/_react["default"].createElement(StyledWrapper, {
    className: className
  }, /*#__PURE__*/_react["default"].createElement(_juno.RcIconButton, {
    symbol: _junoIcon.ViewLogBorder,
    disabled: disableLinks || isLogging,
    title: "View log details",
    onClick: function onClick(e) {
      e.stopPropagation();
      onLog();
    },
    color: "action.primary",
    variant: "plain",
    size: "small"
  }), spinner);
};
LogButton.defaultProps = {
  className: undefined,
  onLog: function onLog() {
    return null;
  },
  isLogged: false,
  disableLinks: false,
  isLogging: false
};
var _default = LogButton;
exports["default"] = _default;
//# sourceMappingURL=index.js.map
