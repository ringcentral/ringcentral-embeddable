"use strict";

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.string.iterator");

require("core-js/modules/es6.weak-map");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.object.create");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es6.date.to-string");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.reflect.construct");

require("core-js/modules/es6.object.set-prototype-of");

require("core-js/modules/es6.array.index-of");

var _classnames = _interopRequireDefault(require("classnames"));

var _react = _interopRequireWildcard(require("react"));

var _audios = _interopRequireDefault(require("./audios"));

var _styles = _interopRequireDefault(require("./styles.scss"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var ALTERNATIVE_TIMEOUT = 1000;
var player = null;

var DialButton = /*#__PURE__*/function (_Component) {
  _inherits(DialButton, _Component);

  var _super = _createSuper(DialButton);

  function DialButton(props) {
    var _this;

    _classCallCheck(this, DialButton);

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this, props].concat(args));
    _this.state = {
      pressed: false
    };
    _this.timeout = void 0;
    _this.isEdge = window && window.navigator && window.navigator.userAgent.indexOf('Edge') > -1 || false;
    _this.audio = void 0;

    _this.onMouseDown = function (e) {
      var _this$props$btn;

      e.preventDefault();

      if (player && player.canPlayType('audio/ogg') !== '' && _audios["default"][(_this$props$btn = _this.props.btn) === null || _this$props$btn === void 0 ? void 0 : _this$props$btn.value]) {
        player.volume = _this.props.volume;
        player.muted = _this.props.muted;
        player.src = _audios["default"][_this.props.btn.value];
        player.currentTime = 0;
        player.play();
      }

      if (typeof _this.props.onPress === 'function') {
        _this.props.onPress(_this.props.btn.value);
      }

      _this.timeout = setTimeout(function () {
        if (_this.state.pressed) {
          if (_this.timeout) {
            clearTimeout(_this.timeout);
            _this.timeout = null;
          }

          if (typeof _this.props.onOutput === 'function') {
            _this.props.onOutput(_this.props.btn.alternativeValue || _this.props.btn.value);
          }

          _this.setState({
            pressed: false
          });
        }
      }, _this.props.alternativeTimeout || ALTERNATIVE_TIMEOUT);

      _this.setState({
        pressed: true
      });
    };

    _this.onMouseUp = function () {
      if (_this.state.pressed) {
        if (_this.timeout) {
          clearTimeout(_this.timeout);
          _this.timeout = null;
        }

        if (typeof _this.props.onOutput === 'function') {
          _this.props.onOutput(_this.props.btn.value);
        }

        _this.setState({
          pressed: false
        });
      }
    };

    _this.onMouseLeave = function () {
      if (_this.state.pressed) {
        if (_this.timeout) {
          clearTimeout(_this.timeout);
          _this.timeout = null;
        }

        _this.setState({
          pressed: false
        });
      }
    };

    if (typeof document !== 'undefined' && document.createElement && !player) {
      player = document.createElement('audio');
    }

    return _this;
  }

  _createClass(DialButton, [{
    key: "render",
    value: function render() {
      var isSpecial = this.props.btn.value === '*';
      return /*#__PURE__*/_react["default"].createElement("div", {
        "data-sign": "dialPadBtn".concat(this.props.btn.value),
        className: (0, _classnames["default"])(_styles["default"].root, this.props.className)
      }, /*#__PURE__*/_react["default"].createElement("svg", {
        className: _styles["default"].btnSvg,
        viewBox: "0 0 500 500"
      }, /*#__PURE__*/_react["default"].createElement("g", {
        className: (0, _classnames["default"])(_styles["default"].btnSvgGroup, this.state.pressed && _styles["default"].pressed),
        onMouseUp: this.onMouseUp,
        onMouseDown: this.onMouseDown,
        onMouseLeave: this.onMouseLeave
      }, /*#__PURE__*/_react["default"].createElement("circle", {
        className: _styles["default"].circle,
        cx: "250",
        cy: "250",
        r: "191"
      }), /*#__PURE__*/_react["default"].createElement("text", {
        className: (0, _classnames["default"])(_styles["default"].btnValue, isSpecial ? _styles["default"].special : null),
        x: "0",
        dx: "205",
        y: "0",
        dy: isSpecial ? 350 : 250
      }, this.props.btn.value), /*#__PURE__*/_react["default"].createElement("text", {
        className: _styles["default"].btnText,
        x: "0",
        dx: this.props.btn.dx,
        y: "0",
        dy: "360"
      }, this.props.btn.text))));
    }
  }]);

  return DialButton;
}(_react.Component);

exports["default"] = DialButton;
DialButton.defaultProps = {
  volume: 1,
  muted: false
};
//# sourceMappingURL=DialButton.js.map
