"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

require("core-js/modules/es6.weak-map");

require("core-js/modules/es6.function.name");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es6.date.to-string");

require("core-js/modules/es6.array.from");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/es6.array.is-array");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tabbie = exports.getEventKey = exports.getPrefix = void 0;

require("core-js/modules/es6.object.define-property");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.string.iterator");

require("core-js/modules/es6.set");

require("core-js/modules/es6.regexp.replace");

require("core-js/modules/es6.array.some");

require("core-js/modules/es6.promise");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.array.slice");

require("core-js/modules/es6.regexp.constructor");

require("regenerator-runtime/runtime");

require("core-js/modules/es6.date.now");

require("core-js/modules/es6.array.filter");

require("core-js/modules/es6.array.map");

var _events = require("events");

var uuid = _interopRequireWildcard(require("uuid"));

var _ObjectMap = require("@ringcentral-integration/core/lib/ObjectMap");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var HEART_BEAT_INTERVAL = 1000; // heartbeat older than HEART_BEAT_EXPIRE will be gc'ed
// chrome and firefox throttles intervals when inactive expire time of 2000
// sometimes would kill live heartbeats and cause the mainTabId to change

var HEART_BEAT_EXPIRE = 3000;
var GC_INTERVAL = 5000;

var getPrefix = function getPrefix(prefix) {
  return prefix && prefix !== '' ? "".concat(prefix, "-") : '';
};

exports.getPrefix = getPrefix;

var getEventKey = function getEventKey(prefix) {
  return "".concat(prefix, "tabbie-event-");
};

exports.getEventKey = getEventKey;

var TabbieEvents = _ObjectMap.ObjectMap.fromKeys(['mainTabIdChanged', 'event']);
/**
 * @class
 * @description The base active tab and cross tab event handling class.
 */


var Tabbie = /*#__PURE__*/function () {
  _createClass(Tabbie, [{
    key: "events",
    get: function get() {
      return TabbieEvents;
    }
  }, {
    key: "mainTabId",
    get: function get() {
      return localStorage.getItem(this._mainTabKey);
    }
  }, {
    key: "isMainTab",
    get: function get() {
      return this.mainTabId === this.id;
    }
  }, {
    key: "tabs",
    get: function get() {
      return this._getHeartBeatKeys();
    }
  }, {
    key: "actualTabIds",
    get: function get() {
      var _this = this;

      return this.tabs.map(function (tab) {
        return _this._getActualId(tab);
      });
    }
  }, {
    key: "firstTabId",
    get: function get() {
      var tabs = this.tabs;

      if (tabs.length) {
        return this._getActualId(tabs[0]);
      }

      return null;
    }
  }, {
    key: "isFirstTab",
    get: function get() {
      return this.id === this.firstTabId;
    }
  }, {
    key: "hasMultipleTabs",
    get: function get() {
      var _this2 = this;

      return this.enabled && this.tabs.filter(function (key) {
        return Date.now() - Math.floor(+localStorage.getItem(key)) < _this2._heartBeatInterval * 2 - 100;
      }).length > 1;
    }
  }]);

  function Tabbie(_ref) {
    var _this3 = this;

    var _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === void 0 ? '' : _ref$prefix,
        _ref$heartBeatInterva = _ref.heartBeatInterval,
        heartBeatInterval = _ref$heartBeatInterva === void 0 ? HEART_BEAT_INTERVAL : _ref$heartBeatInterva,
        _ref$heartBeatExpire = _ref.heartBeatExpire,
        heartBeatExpire = _ref$heartBeatExpire === void 0 ? HEART_BEAT_EXPIRE : _ref$heartBeatExpire,
        _ref$gcInterval = _ref.gcInterval,
        gcInterval = _ref$gcInterval === void 0 ? GC_INTERVAL : _ref$gcInterval;

    _classCallCheck(this, Tabbie);

    this.id = uuid.v4();
    this.enabled = void 0;
    this.prefix = void 0;
    this._emitter = new _events.EventEmitter();
    this._mainTabKey = void 0;
    this._heartBeatKey = void 0;
    this._heartBeatRegExp = void 0;
    this._eventKey = void 0;
    this._eventRegExp = void 0;
    this._heartBeatExpire = void 0;
    this._heartBeatInterval = void 0;
    this._gcInterval = void 0;
    this._heartBeatIntervalId = void 0;
    this._gcIntervalId = void 0;

    this._heartBeat = function () {
      localStorage.setItem(_this3._heartBeatKey, "".concat(Date.now()));
    };

    this._gc = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var expiredCut, isMainTabAlive, mainTabId, tabs, i, len, key, isExpired, isMainTab;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              expiredCut = Date.now() - _this3._heartBeatExpire;
              isMainTabAlive = false;
              _context.next = 4;
              return _this3.getMainTabId();

            case 4:
              mainTabId = _context.sent;
              tabs = _this3.tabs;

              for (i = 0, len = tabs.length; i < len; i++) {
                key = tabs[i];
                isExpired = +localStorage.getItem(key) < expiredCut;
                isMainTab = _this3._getActualId(key) === mainTabId;

                if (isExpired) {
                  localStorage.removeItem(key);
                }

                if (isMainTab) {
                  isMainTabAlive = !isExpired;
                }
              } // if mainTab is not alive reset mainTab to firstTab


              if (!isMainTabAlive) {
                _this3._setFirstTabAsMainTab();
              }

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    this._setAsVisibleTab = function () {
      // avoid setting mainTabId repeatedly which may result in forced rendering
      if (!document.hidden && !_this3.isMainTab) {
        _this3.setAsMainTab();
      }
    };

    this.prefix = getPrefix(prefix);
    this._heartBeatInterval = heartBeatInterval;
    this._heartBeatExpire = heartBeatExpire;
    this._gcInterval = gcInterval;
    this.enabled = typeof window !== 'undefined' && typeof document.visibilityState !== 'undefined' && typeof localStorage !== 'undefined';
    var preFixHeartBeatKey = "".concat(this.prefix, "tabbie-heartBeat-");
    this._heartBeatKey = "".concat(preFixHeartBeatKey).concat(this.id);
    this._mainTabKey = "".concat(this.prefix, "tabbie-mainTab-id");
    this._eventKey = getEventKey(this.prefix);
    this._heartBeatRegExp = new RegExp("^".concat(preFixHeartBeatKey));
    this._eventRegExp = new RegExp("^".concat(this._eventKey));

    if (this.enabled) {
      this._bindInterval();

      this._bindListener();

      if (!document.hidden) {
        this.setAsMainTab();
      } else if (!this.mainTabId) {
        this._setFirstTabAsMainTab();
      }

    // TODO: fix at widgets lib
    //  window.addEventListener('unload', function () {
    //    if (_this3.isMainTab) {
    //      localStorage.removeItem(_this3._mainTabKey);
    //    }
    // });
    }
  }

  _createClass(Tabbie, [{
    key: "_bindInterval",
    value: function _bindInterval() {
      this._heartBeat();

      this._heartBeatIntervalId = setInterval(this._heartBeat, this._heartBeatInterval);
      this._gcIntervalId = setInterval(this._gc, this._gcInterval);
    }
  }, {
    key: "_bindListener",
    value: function _bindListener() {
      var _this4 = this;

      document.addEventListener('visibilitychange', this._setAsVisibleTab);
      window.addEventListener('focus', this._setAsVisibleTab);
      window.addEventListener('storage', /*#__PURE__*/function () {
        var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref3) {
          var key, newValue, payload, _payload, id, event, args, _this4$_emitter;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  key = _ref3.key, newValue = _ref3.newValue;

                  if (!(key === _this4._mainTabKey)) {
                    _context2.next = 10;
                    break;
                  }

                  _context2.t0 = _this4._emitter;
                  _context2.t1 = _this4.events.mainTabIdChanged;
                  _context2.next = 6;
                  return _this4.getMainTabId();

                case 6:
                  _context2.t2 = _context2.sent;

                  _context2.t0.emit.call(_context2.t0, _context2.t1, _context2.t2);

                  _context2.next = 20;
                  break;

                case 10:
                  if (!(_this4._heartBeatRegExp.test(key) && (!newValue || newValue === ''))) {
                    _context2.next = 19;
                    break;
                  }

                  _context2.t3 = _this4._getActualId(key);
                  _context2.next = 14;
                  return _this4.getMainTabId();

                case 14:
                  _context2.t4 = _context2.sent;

                  if (!(_context2.t3 === _context2.t4)) {
                    _context2.next = 17;
                    break;
                  }

                  _this4._setFirstTabAsMainTab();

                case 17:
                  _context2.next = 20;
                  break;

                case 19:
                  if (_this4._eventRegExp.test(key) && newValue && newValue !== '') {
                    payload = JSON.parse(newValue);
                    _payload = _toArray(payload), id = _payload[0], event = _payload[1], args = _payload.slice(2);

                    if (id !== _this4.id) {
                      // ie fires storage event on original
                      (_this4$_emitter = _this4._emitter).emit.apply(_this4$_emitter, [_this4.events.event, event].concat(_toConsumableArray(args)));
                    }
                  }

                case 20:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function (_x) {
          return _ref4.apply(this, arguments);
        };
      }());
      window.addEventListener('unload', function () {
        clearInterval(_this4._gcIntervalId);
        clearInterval(_this4._heartBeatIntervalId);
        localStorage.removeItem(_this4._heartBeatKey);

        // TODO: fix this at widgets lib
        if (_this3.isMainTab) {
          localStorage.removeItem(_this3._mainTabKey);
        }
      });
    }
  }, {
    key: "send",
    value: function send(event) {
      if (!this.enabled) {
        return;
      }

      var key = "".concat(this._eventKey).concat(uuid.v4());

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var payload = [this.id, event].concat(args);
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.removeItem(key);
    }
    /**
     * @function
     * @return {Promise} - Resolves to current main tab id
     */

  }, {
    key: "getMainTabId",
    value: function () {
      var _getMainTabId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var _this5 = this;

        var mainTabId;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                mainTabId = this.mainTabId;

                if (!mainTabId) {
                  _context3.next = 3;
                  break;
                }

                return _context3.abrupt("return", mainTabId);

              case 3:
                return _context3.abrupt("return", new Promise(function (resolve) {
                  _this5._emitter.once(_this5.events.mainTabIdChanged, resolve);
                }));

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getMainTabId() {
        return _getMainTabId.apply(this, arguments);
      }

      return getMainTabId;
    }()
    /**
     * check current tab is main tab.
     */

  }, {
    key: "checkIsMain",
    value: function () {
      var _checkIsMain = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.t0 = !this.enabled;

                if (_context4.t0) {
                  _context4.next = 7;
                  break;
                }

                _context4.next = 4;
                return this.getMainTabId();

              case 4:
                _context4.t1 = _context4.sent;
                _context4.t2 = this.id;
                _context4.t0 = _context4.t1 === _context4.t2;

              case 7:
                return _context4.abrupt("return", _context4.t0);

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function checkIsMain() {
        return _checkIsMain.apply(this, arguments);
      }

      return checkIsMain;
    }()
    /**
     * check tab alive state by tabId
     * @param id tabId you want to check
     */

  }, {
    key: "checkTabAliveById",
    value: function checkTabAliveById(id) {
      var _this6 = this;

      return this.tabs.some(function (key) {
        return _this6._getActualId(key) === id;
      });
    }
  }, {
    key: "on",
    value: function on() {
      var _this$_emitter;

      return (_this$_emitter = this._emitter).on.apply(_this$_emitter, arguments);
    }
  }, {
    key: "_getActualId",
    value: function _getActualId(key) {
      return key.replace(this._heartBeatRegExp, '');
    }
  }, {
    key: "_getHeartBeatKeys",
    value: function _getHeartBeatKeys() {
      var results = new Set();

      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);

        if (key && key !== '' && this._heartBeatRegExp.test(key)) {
          results.add(key);
        }
      }

      return _toConsumableArray(results);
    }
  }, {
    key: "setAsMainTab",
    value: function setAsMainTab() {
      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.id;
      localStorage.setItem(this._mainTabKey, id);

      this._emitter.emit(this.events.mainTabIdChanged, id);
    }
  }, {
    key: "_setFirstTabAsMainTab",
    value: function _setFirstTabAsMainTab() {
      if (this.isFirstTab) {
        localStorage.removeItem(this._mainTabKey);
        this.setAsMainTab();
      }
    }
  }]);

  return Tabbie;
}();

exports.Tabbie = Tabbie;
