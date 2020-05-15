/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4091);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(26);
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !__webpack_require__(68), 'Object', { defineProperty: __webpack_require__(70).f });


/***/ }),

/***/ 10:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $at = __webpack_require__(368)(true);

// 21.1.3.27 String.prototype[@@iterator]()
__webpack_require__(227)(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});


/***/ }),

/***/ 103:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultGetFunction = defaultGetFunction;
exports.createHashMap = createHashMap;
exports["default"] = void 0;

__webpack_require__(39);

__webpack_require__(33);

__webpack_require__(32);

__webpack_require__(31);

__webpack_require__(14);

__webpack_require__(1);

__webpack_require__(366);

__webpack_require__(5);

__webpack_require__(6);

__webpack_require__(2);

__webpack_require__(10);

__webpack_require__(132);

__webpack_require__(77);

__webpack_require__(7);

__webpack_require__(4);

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var sDefinition = Symbol('definition');
var sValueMap = Symbol('valueMap');

function defaultGetFunction(item) {
  return item;
}
/**
 * @class HashMap
 * @description Simple hash map class
 */


var HashMap =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Object} definition
   */
  function HashMap(definition) {
    var _this = this;

    _classCallCheck(this, HashMap);

    this[sDefinition] = Object.assign({}, definition);
    this[sValueMap] = new Map();

    var _loop = function _loop(key) {
      /* istanbul ignore else */
      if (Object.prototype.hasOwnProperty.call(definition, key)) {
        Object.defineProperty(_this, key, {
          get: function get() {
            return this[sDefinition][key];
          },
          enumerable: true
        });

        _this[sValueMap].set(_this[sDefinition][key], key);
      }
    };

    for (var key in definition) {
      _loop(key);
    }

    Object.freeze(this);
  }

  _createClass(HashMap, null, [{
    key: "getKey",
    value: function getKey(map, value) {
      return map[sValueMap].get(value);
    }
  }, {
    key: "hasValue",
    value: function hasValue(map, value) {
      return map[sValueMap].has(value);
    }
  }, {
    key: "fromSet",
    value: function fromSet(_ref) {
      var set = _ref.set,
          _ref$getKey = _ref.getKey,
          getKey = _ref$getKey === void 0 ? defaultGetFunction : _ref$getKey,
          _ref$getValue = _ref.getValue,
          getValue = _ref$getValue === void 0 ? defaultGetFunction : _ref$getValue;
      var definition = {};

      _toConsumableArray(set).forEach(function (item) {
        var key = getKey(item);
        var value = getValue(item);

        if (typeof key !== 'undefined' && key !== null && key !== '') {
          definition[key] = value;
        }
      });

      return new HashMap(definition);
    }
  }]);

  return HashMap;
}();

exports["default"] = HashMap;

function createHashMap(definition) {
  return new HashMap(definition);
}
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 11:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = __webpack_require__(26);
$export($export.S, 'Object', { setPrototypeOf: __webpack_require__(313).set });


/***/ }),

/***/ 115:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = __webpack_require__(249);
var enumBugKeys = __webpack_require__(195);

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};


/***/ }),

/***/ 12:
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(26);
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: __webpack_require__(145) });


/***/ }),

/***/ 122:
/***/ (function(module, exports) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),

/***/ 123:
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),

/***/ 124:
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(175);
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),

/***/ 129:
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),

/***/ 13:
/***/ (function(module, exports) {

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;

/***/ }),

/***/ 130:
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),

/***/ 132:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strong = __webpack_require__(422);
var validate = __webpack_require__(208);
var MAP = 'Map';

// 23.1 Map Objects
module.exports = __webpack_require__(324)(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);


/***/ }),

/***/ 137:
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(65);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),

/***/ 138:
/***/ (function(module, exports) {

module.exports = false;


/***/ }),

/***/ 139:
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),

/***/ 14:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $export = __webpack_require__(26);
var $forEach = __webpack_require__(156)(0);
var STRICT = __webpack_require__(141)([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */) {
    return $forEach(this, callbackfn, arguments[1]);
  }
});


/***/ }),

/***/ 140:
/***/ (function(module, exports, __webpack_require__) {

var pIE = __webpack_require__(162);
var createDesc = __webpack_require__(122);
var toIObject = __webpack_require__(94);
var toPrimitive = __webpack_require__(137);
var has = __webpack_require__(90);
var IE8_DOM_DEFINE = __webpack_require__(248);
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = __webpack_require__(68) ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};


/***/ }),

/***/ 141:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__(61);

module.exports = function (method, arg) {
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call
    arg ? method.call(null, function () { /* empty */ }, 1) : method.call(null);
  });
};


/***/ }),

/***/ 145:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = __webpack_require__(64);
var dPs = __webpack_require__(276);
var enumBugKeys = __webpack_require__(195);
var IE_PROTO = __webpack_require__(194)('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(223)('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(277).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};


/***/ }),

/***/ 146:
/***/ (function(module, exports) {

module.exports = {};


/***/ }),

/***/ 152:
/***/ (function(module, exports, __webpack_require__) {

var META = __webpack_require__(123)('meta');
var isObject = __webpack_require__(65);
var has = __webpack_require__(90);
var setDesc = __webpack_require__(70).f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !__webpack_require__(61)(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};


/***/ }),

/***/ 153:
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(70).f;
var has = __webpack_require__(90);
var TAG = __webpack_require__(62)('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};


/***/ }),

/***/ 154:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = __webpack_require__(249);
var hiddenKeys = __webpack_require__(195).concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};


/***/ }),

/***/ 155:
/***/ (function(module, exports, __webpack_require__) {

// most Object methods by ES6 should accept primitives
var $export = __webpack_require__(26);
var core = __webpack_require__(87);
var fails = __webpack_require__(61);
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};


/***/ }),

/***/ 156:
/***/ (function(module, exports, __webpack_require__) {

// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = __webpack_require__(124);
var IObject = __webpack_require__(183);
var toObject = __webpack_require__(97);
var toLength = __webpack_require__(92);
var asc = __webpack_require__(371);
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};


/***/ }),

/***/ 161:
/***/ (function(module, exports, __webpack_require__) {

var core = __webpack_require__(87);
var global = __webpack_require__(56);
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: __webpack_require__(138) ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});


/***/ }),

/***/ 162:
/***/ (function(module, exports) {

exports.f = {}.propertyIsEnumerable;


/***/ }),

/***/ 166:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = debounce;

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @param {Function} func - target function
 * @param {Number} threshold - execution threshold
 * @param {Boolean} immediate - trigger on leading edge
 * @return {Function}
 */
function debounce(func) {
  var threshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
  var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (typeof func !== 'function') {
    throw new Error('First argument of debounce function should be a function');
  }

  var timer = null;
  return function debounced() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;
    var callNow = immediate && !timer;

    var later = function later() {
      timer = null;
      if (!immediate) func.apply(context, args);
    };

    clearTimeout(timer);
    timer = setTimeout(later, threshold);
    if (callNow) func.apply(context, args);
  };
}
//# sourceMappingURL=debounce.js.map


/***/ }),

/***/ 175:
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),

/***/ 177:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var punycode = __webpack_require__(284);
var util = __webpack_require__(285);

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = __webpack_require__(234);

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};


/***/ }),

/***/ 18:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return '@media ' + item[2] + '{' + content + '}';
      } else {
        return content;
      }
    }).join('');
  }; // import a list of modules into the list


  list.i = function (modules, mediaQuery) {
    if (typeof modules === 'string') {
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    for (var i = 0; i < this.length; i++) {
      var id = this[i][0];

      if (id != null) {
        alreadyImportedModules[id] = true;
      }
    }

    for (i = 0; i < modules.length; i++) {
      var item = modules[i]; // skip already imported module
      // this implementation is not 100% perfect for weird media query combinations
      // when a module is imported multiple times with different media queries.
      // I hope this will never occur (Hey this way we have smaller bundles)

      if (item[0] == null || !alreadyImportedModules[item[0]]) {
        if (mediaQuery && !item[2]) {
          item[2] = mediaQuery;
        } else if (mediaQuery) {
          item[2] = '(' + item[2] + ') and (' + mediaQuery + ')';
        }

        list.push(item);
      }
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || '';
  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */';
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;
  return '/*# ' + data + ' */';
}

/***/ }),

/***/ 183:
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(129);
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),

/***/ 184:
/***/ (function(module, exports) {

exports.f = Object.getOwnPropertySymbols;


/***/ }),

/***/ 185:
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ 19:
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getTarget = function (target, parent) {
  if (parent){
    return parent.querySelector(target);
  }
  return document.querySelector(target);
};

var getElement = (function (fn) {
	var memo = {};

	return function(target, parent) {
                // If passing function in options, then use it for resolve "head" element.
                // Useful for Shadow Root style i.e
                // {
                //   insertInto: function () { return document.querySelector("#foo").shadowRoot }
                // }
                if (typeof target === 'function') {
                        return target();
                }
                if (typeof memo[target] === "undefined") {
			var styleTarget = getTarget.call(this, target, parent);
			// Special case to return head of iframe instead of iframe itself
			if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[target] = styleTarget;
		}
		return memo[target]
	};
})();

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(534);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
        if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertAt.before, target);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}

	if(options.attrs.nonce === undefined) {
		var nonce = getNonce();
		if (nonce) {
			options.attrs.nonce = nonce;
		}
	}

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function getNonce() {
	if (false) {}

	return __webpack_require__.nc;
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = typeof options.transform === 'function'
		 ? options.transform(obj.css) 
		 : options.transform.default(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ 193:
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(139);
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),

/***/ 194:
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(161)('keys');
var uid = __webpack_require__(123);
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};


/***/ }),

/***/ 195:
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');


/***/ }),

/***/ 196:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = __webpack_require__(90);
var toObject = __webpack_require__(97);
var IE_PROTO = __webpack_require__(194)('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};


/***/ }),

/***/ 197:
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(129);
var TAG = __webpack_require__(62)('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};


/***/ }),

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.3.6 Object.prototype.toString()
var classof = __webpack_require__(197);
var test = {};
test[__webpack_require__(62)('toStringTag')] = 'z';
if (test + '' != '[object z]') {
  __webpack_require__(86)(Object.prototype, 'toString', function toString() {
    return '[object ' + classof(this) + ']';
  }, true);
}


/***/ }),

/***/ 20:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if ( true && module.exports) {
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
			return classNames;
		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}());


/***/ }),

/***/ 206:
/***/ (function(module, exports, __webpack_require__) {

// 7.2.2 IsArray(argument)
var cof = __webpack_require__(129);
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};


/***/ }),

/***/ 207:
/***/ (function(module, exports, __webpack_require__) {

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = __webpack_require__(62)('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) __webpack_require__(91)(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};


/***/ }),

/***/ 208:
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(65);
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};


/***/ }),

/***/ 213:
/***/ (function(module, exports, __webpack_require__) {

var superPropBase = __webpack_require__(536);

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    module.exports = _get = Reflect.get;
  } else {
    module.exports = _get = function _get(target, property, receiver) {
      var base = superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}

module.exports = _get;

/***/ }),

/***/ 223:
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(65);
var document = __webpack_require__(56).document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),

/***/ 224:
/***/ (function(module, exports, __webpack_require__) {

exports.f = __webpack_require__(62);


/***/ }),

/***/ 225:
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(94);
var toLength = __webpack_require__(92);
var toAbsoluteIndex = __webpack_require__(193);
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};


/***/ }),

/***/ 226:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(56);
var has = __webpack_require__(90);
var cof = __webpack_require__(129);
var inheritIfRequired = __webpack_require__(315);
var toPrimitive = __webpack_require__(137);
var fails = __webpack_require__(61);
var gOPN = __webpack_require__(154).f;
var gOPD = __webpack_require__(140).f;
var dP = __webpack_require__(70).f;
var $trim = __webpack_require__(314).trim;
var NUMBER = 'Number';
var $Number = global[NUMBER];
var Base = $Number;
var proto = $Number.prototype;
// Opera ~12 has broken Object#toString
var BROKEN_COF = cof(__webpack_require__(145)(proto)) == NUMBER;
var TRIM = 'trim' in String.prototype;

// 7.1.3 ToNumber(argument)
var toNumber = function (argument) {
  var it = toPrimitive(argument, false);
  if (typeof it == 'string' && it.length > 2) {
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0);
    var third, radix, maxCode;
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal /^0o[0-7]+$/i
        default: return +it;
      }
      for (var digits = it.slice(2), i = 0, l = digits.length, code; i < l; i++) {
        code = digits.charCodeAt(i);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

if (!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')) {
  $Number = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var that = this;
    return that instanceof $Number
      // check on 1..constructor(foo) case
      && (BROKEN_COF ? fails(function () { proto.valueOf.call(that); }) : cof(that) != NUMBER)
        ? inheritIfRequired(new Base(toNumber(it)), that, $Number) : toNumber(it);
  };
  for (var keys = __webpack_require__(68) ? gOPN(Base) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES6 (in case, if modules with ES6 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys.length > j; j++) {
    if (has(Base, key = keys[j]) && !has($Number, key)) {
      dP($Number, key, gOPD(Base, key));
    }
  }
  $Number.prototype = proto;
  proto.constructor = $Number;
  __webpack_require__(86)(global, NUMBER, $Number);
}


/***/ }),

/***/ 227:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(138);
var $export = __webpack_require__(26);
var redefine = __webpack_require__(86);
var hide = __webpack_require__(91);
var Iterators = __webpack_require__(146);
var $iterCreate = __webpack_require__(317);
var setToStringTag = __webpack_require__(153);
var getPrototypeOf = __webpack_require__(196);
var ITERATOR = __webpack_require__(62)('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};


/***/ }),

/***/ 228:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 21.2.5.3 get RegExp.prototype.flags
var anObject = __webpack_require__(64);
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};


/***/ }),

/***/ 230:
/***/ (function(module, exports) {

module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};


/***/ }),

/***/ 231:
/***/ (function(module, exports, __webpack_require__) {

var redefine = __webpack_require__(86);
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};


/***/ }),

/***/ 234:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.decode = exports.parse = __webpack_require__(286);
exports.encode = exports.stringify = __webpack_require__(287);


/***/ }),

/***/ 235:
/***/ (function(module, exports) {

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;

/***/ }),

/***/ 247:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HashMap = _interopRequireDefault(__webpack_require__(103));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = new _HashMap["default"]({
  takeAllCalls: 'TakeAllCalls',
  doNotAcceptAnyCalls: 'DoNotAcceptAnyCalls',
  doNotAcceptDepartmentCalls: 'DoNotAcceptDepartmentCalls',
  takeDepartmentCallsOnly: 'TakeDepartmentCallsOnly'
});

exports["default"] = _default;
//# sourceMappingURL=dndStatus.js.map


/***/ }),

/***/ 248:
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(68) && !__webpack_require__(61)(function () {
  return Object.defineProperty(__webpack_require__(223)('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ 249:
/***/ (function(module, exports, __webpack_require__) {

var has = __webpack_require__(90);
var toIObject = __webpack_require__(94);
var arrayIndexOf = __webpack_require__(225)(false);
var IE_PROTO = __webpack_require__(194)('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),

/***/ 25:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

__webpack_require__(31);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prefixEnum = prefixEnum;
exports.createEnum = createEnum;
exports["default"] = void 0;

__webpack_require__(39);

__webpack_require__(33);

__webpack_require__(32);

__webpack_require__(9);

__webpack_require__(5);

__webpack_require__(6);

__webpack_require__(2);

__webpack_require__(10);

__webpack_require__(132);

__webpack_require__(7);

__webpack_require__(4);

__webpack_require__(12);

__webpack_require__(11);

__webpack_require__(14);

var _HashMap2 = _interopRequireDefault(__webpack_require__(103));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * @class
 * @description helper class for creating redux action definition maps
 */

var Enum =
/*#__PURE__*/
function (_HashMap) {
  _inherits(Enum, _HashMap);

  /**
   * @constructor
   * @param {String[]} actions - list of action strings
   * @extends HashMap
   */
  function Enum() {
    var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    _classCallCheck(this, Enum);

    var definition = {};
    values.forEach(function (value) {
      definition[value] = prefix !== '' ? "".concat(prefix, "-").concat(value) : value;
    });
    return _possibleConstructorReturn(this, _getPrototypeOf(Enum).call(this, definition));
  }

  return Enum;
}(_HashMap2["default"]);

exports["default"] = Enum;
var prefixCache = new Map();
/**
 * @function
 * @description helper function to return a prefixed action definition maps
 */

function prefixEnum(_ref) {
  var enumMap = _ref.enumMap,
      prefix = _ref.prefix,
      _ref$base = _ref.base,
      base = _ref$base === void 0 ? enumMap : _ref$base;
  if (!prefix || prefix === '') return base;

  if (!prefixCache.has(prefix)) {
    prefixCache.set(prefix, new Map());
  }

  var cache = prefixCache.get(prefix);

  if (!cache.has(base)) {
    var definition = {};

    for (var type in base) {
      /* istanbul ignore else */
      if (hasOwnProperty.call(base, type)) {
        definition[type] = "".concat(prefix, "-").concat(base[type]);
      }
    }

    cache.set(base, new _HashMap2["default"](definition));
  }

  return cache.get(base);
}

function createEnum(values, prefix) {
  var enumMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return new Enum([].concat(_toConsumableArray(Object.keys(enumMap)), _toConsumableArray(values)), prefix);
}
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 250:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(56);
var dP = __webpack_require__(70);
var DESCRIPTORS = __webpack_require__(68);
var SPECIES = __webpack_require__(62)('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};


/***/ }),

/***/ 26:
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(56);
var core = __webpack_require__(87);
var hide = __webpack_require__(91);
var redefine = __webpack_require__(86);
var ctx = __webpack_require__(124);
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;


/***/ }),

/***/ 262:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatDuration;

__webpack_require__(226);

__webpack_require__(278);

var _padLeft = _interopRequireDefault(__webpack_require__(581));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function formatDuration(duration) {
  if (Number.isNaN(duration)) {
    return '--:--';
  }

  var intDuration = typeof duration === 'number' ? Math.round(duration) : parseInt(duration, 10);
  var seconds = (0, _padLeft["default"])(intDuration % 60, '0', 2);
  var minutes = (0, _padLeft["default"])(Math.floor(intDuration / 60) % 60, '0', 2);
  var hours = Math.floor(intDuration / 3600) % 24;
  return "".concat(hours > 0 ? "".concat((0, _padLeft["default"])(hours, '0', 2), ":") : '').concat(minutes, ":").concat(seconds);
}
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 275:
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(56);
var core = __webpack_require__(87);
var LIBRARY = __webpack_require__(138);
var wksExt = __webpack_require__(224);
var defineProperty = __webpack_require__(70).f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};


/***/ }),

/***/ 276:
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(70);
var anObject = __webpack_require__(64);
var getKeys = __webpack_require__(115);

module.exports = __webpack_require__(68) ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};


/***/ }),

/***/ 277:
/***/ (function(module, exports, __webpack_require__) {

var document = __webpack_require__(56).document;
module.exports = document && document.documentElement;


/***/ }),

/***/ 278:
/***/ (function(module, exports, __webpack_require__) {

// 20.1.2.4 Number.isNaN(number)
var $export = __webpack_require__(26);

$export($export.S, 'Number', {
  isNaN: function isNaN(number) {
    // eslint-disable-next-line no-self-compare
    return number != number;
  }
});


/***/ }),

/***/ 280:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $defineProperty = __webpack_require__(70);
var createDesc = __webpack_require__(122);

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};


/***/ }),

/***/ 281:
/***/ (function(module, exports, __webpack_require__) {

var ITERATOR = __webpack_require__(62)('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};


/***/ }),

/***/ 282:
/***/ (function(module, exports) {

module.exports = function (done, value) {
  return { value: value, done: !!done };
};


/***/ }),

/***/ 283:
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(124);
var call = __webpack_require__(370);
var isArrayIter = __webpack_require__(318);
var anObject = __webpack_require__(64);
var toLength = __webpack_require__(92);
var getIterFn = __webpack_require__(319);
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;


/***/ }),

/***/ 284:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports =  true && exports &&
		!exports.nodeType && exports;
	var freeModule =  true && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
			return punycode;
		}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}

}(this));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(185)(module), __webpack_require__(67)))

/***/ }),

/***/ 285:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};


/***/ }),

/***/ 286:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ 287:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};


/***/ }),

/***/ 291:
/***/ (function(module, exports, __webpack_require__) {

var arrayWithoutHoles = __webpack_require__(539);

var iterableToArray = __webpack_require__(540);

var nonIterableSpread = __webpack_require__(541);

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;

/***/ }),

/***/ 31:
/***/ (function(module, exports, __webpack_require__) {

// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = __webpack_require__(26);

$export($export.S, 'Array', { isArray: __webpack_require__(206) });


/***/ }),

/***/ 312:
/***/ (function(module, exports, __webpack_require__) {

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = __webpack_require__(94);
var gOPN = __webpack_require__(154).f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};


/***/ }),

/***/ 313:
/***/ (function(module, exports, __webpack_require__) {

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = __webpack_require__(65);
var anObject = __webpack_require__(64);
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = __webpack_require__(124)(Function.call, __webpack_require__(140).f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};


/***/ }),

/***/ 314:
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(26);
var defined = __webpack_require__(130);
var fails = __webpack_require__(61);
var spaces = __webpack_require__(367);
var space = '[' + spaces + ']';
var non = '\u200b\u0085';
var ltrim = RegExp('^' + space + space + '*');
var rtrim = RegExp(space + space + '*$');

var exporter = function (KEY, exec, ALIAS) {
  var exp = {};
  var FORCE = fails(function () {
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if (ALIAS) exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function (string, TYPE) {
  string = String(defined(string));
  if (TYPE & 1) string = string.replace(ltrim, '');
  if (TYPE & 2) string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;


/***/ }),

/***/ 315:
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(65);
var setPrototypeOf = __webpack_require__(313).set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};


/***/ }),

/***/ 317:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create = __webpack_require__(145);
var descriptor = __webpack_require__(122);
var setToStringTag = __webpack_require__(153);
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(91)(IteratorPrototype, __webpack_require__(62)('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};


/***/ }),

/***/ 318:
/***/ (function(module, exports, __webpack_require__) {

// check on default Array iterator
var Iterators = __webpack_require__(146);
var ITERATOR = __webpack_require__(62)('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};


/***/ }),

/***/ 319:
/***/ (function(module, exports, __webpack_require__) {

var classof = __webpack_require__(197);
var ITERATOR = __webpack_require__(62)('iterator');
var Iterators = __webpack_require__(146);
module.exports = __webpack_require__(87).getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),

/***/ 32:
/***/ (function(module, exports, __webpack_require__) {

var DateProto = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var $toString = DateProto[TO_STRING];
var getTime = DateProto.getTime;
if (new Date(NaN) + '' != INVALID_DATE) {
  __webpack_require__(86)(DateProto, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}


/***/ }),

/***/ 324:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(56);
var $export = __webpack_require__(26);
var redefine = __webpack_require__(86);
var redefineAll = __webpack_require__(231);
var meta = __webpack_require__(152);
var forOf = __webpack_require__(283);
var anInstance = __webpack_require__(230);
var isObject = __webpack_require__(65);
var fails = __webpack_require__(61);
var $iterDetect = __webpack_require__(281);
var setToStringTag = __webpack_require__(153);
var inheritIfRequired = __webpack_require__(315);

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};


/***/ }),

/***/ 326:
/***/ (function(module, exports) {

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;

/***/ }),

/***/ 33:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

__webpack_require__(420);
var anObject = __webpack_require__(64);
var $flags = __webpack_require__(228);
var DESCRIPTORS = __webpack_require__(68);
var TO_STRING = 'toString';
var $toString = /./[TO_STRING];

var define = function (fn) {
  __webpack_require__(86)(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if (__webpack_require__(61)(function () { return $toString.call({ source: 'a', flags: 'b' }) != '/a/b'; })) {
  define(function toString() {
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if ($toString.name != TO_STRING) {
  define(function toString() {
    return $toString.call(this);
  });
}


/***/ }),

/***/ 357:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.presenceStatus = void 0;

var _HashMap = __webpack_require__(103);

var presenceStatus = (0, _HashMap.createHashMap)({
  offline: 'Offline',
  busy: 'Busy',
  available: 'Available'
});
exports.presenceStatus = presenceStatus;
//# sourceMappingURL=presenceStatus.enum.js.map


/***/ }),

/***/ 364:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(161)('native-function-to-string', Function.toString);


/***/ }),

/***/ 365:
/***/ (function(module, exports, __webpack_require__) {

// all enumerable object keys, includes symbols
var getKeys = __webpack_require__(115);
var gOPS = __webpack_require__(184);
var pIE = __webpack_require__(162);
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};


/***/ }),

/***/ 366:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.5 Object.freeze(O)
var isObject = __webpack_require__(65);
var meta = __webpack_require__(152).onFreeze;

__webpack_require__(155)('freeze', function ($freeze) {
  return function freeze(it) {
    return $freeze && isObject(it) ? $freeze(meta(it)) : it;
  };
});


/***/ }),

/***/ 367:
/***/ (function(module, exports) {

module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';


/***/ }),

/***/ 368:
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(139);
var defined = __webpack_require__(130);
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};


/***/ }),

/***/ 370:
/***/ (function(module, exports, __webpack_require__) {

// call something on iterator step with safe closing on error
var anObject = __webpack_require__(64);
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};


/***/ }),

/***/ 371:
/***/ (function(module, exports, __webpack_require__) {

// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = __webpack_require__(372);

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};


/***/ }),

/***/ 372:
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(65);
var isArray = __webpack_require__(206);
var SPECIES = __webpack_require__(62)('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};


/***/ }),

/***/ 374:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    var obj;

    while (queue.length) {
        var item = queue.pop();
        obj = item.obj[item.prop];

        if (Array.isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }

    return obj;
};

exports.arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function merge(target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            if (options.plainObjects || options.allowPrototypes || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = exports.merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

exports.assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function encode(str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    return compactQueue(queue);
};

exports.isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function isBuffer(obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};


/***/ }),

/***/ 375:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};


/***/ }),

/***/ 376:
/***/ (function(module, exports) {

function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;

/***/ }),

/***/ 382:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Enum = _interopRequireDefault(__webpack_require__(25));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = new _Enum["default"](['syncClosed', 'syncMinimized', 'syncSize', 'syncPosition', 'pushPresence', 'pushAdapterState', 'pushLocale', 'presenceClicked', 'presenceItemClicked', 'clickToDial', 'clickToSms', 'pushRingState', 'pushCalls', 'pushOnCurrentCallPath', 'pushOnAllCallsPath', 'navigateToCurrentCall', 'navigateToViewCalls']);

exports["default"] = _default;
//# sourceMappingURL=baseMessageTypes.js.map


/***/ }),

/***/ 383:
/***/ (function(module, exports) {

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && msCrypto.getRandomValues.bind(msCrypto));
if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}


/***/ }),

/***/ 384:
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;


/***/ }),

/***/ 39:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var ctx = __webpack_require__(124);
var $export = __webpack_require__(26);
var toObject = __webpack_require__(97);
var call = __webpack_require__(370);
var isArrayIter = __webpack_require__(318);
var toLength = __webpack_require__(92);
var createProperty = __webpack_require__(280);
var getIterFn = __webpack_require__(319);

$export($export.S + $export.F * !__webpack_require__(281)(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});


/***/ }),

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// ECMAScript 6 symbols shim
var global = __webpack_require__(56);
var has = __webpack_require__(90);
var DESCRIPTORS = __webpack_require__(68);
var $export = __webpack_require__(26);
var redefine = __webpack_require__(86);
var META = __webpack_require__(152).KEY;
var $fails = __webpack_require__(61);
var shared = __webpack_require__(161);
var setToStringTag = __webpack_require__(153);
var uid = __webpack_require__(123);
var wks = __webpack_require__(62);
var wksExt = __webpack_require__(224);
var wksDefine = __webpack_require__(275);
var enumKeys = __webpack_require__(365);
var isArray = __webpack_require__(206);
var anObject = __webpack_require__(64);
var isObject = __webpack_require__(65);
var toObject = __webpack_require__(97);
var toIObject = __webpack_require__(94);
var toPrimitive = __webpack_require__(137);
var createDesc = __webpack_require__(122);
var _create = __webpack_require__(145);
var gOPNExt = __webpack_require__(312);
var $GOPD = __webpack_require__(140);
var $GOPS = __webpack_require__(184);
var $DP = __webpack_require__(70);
var $keys = __webpack_require__(115);
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function' && !!$GOPS.f;
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  __webpack_require__(154).f = gOPNExt.f = $getOwnPropertyNames;
  __webpack_require__(162).f = $propertyIsEnumerable;
  $GOPS.f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !__webpack_require__(138)) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
var FAILS_ON_PRIMITIVES = $fails(function () { $GOPS.f(1); });

$export($export.S + $export.F * FAILS_ON_PRIMITIVES, 'Object', {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    return $GOPS.f(toObject(it));
  }
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    $replacer = replacer = args[1];
    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || __webpack_require__(91)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);


/***/ }),

/***/ 4091:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

var _url = _interopRequireDefault(__webpack_require__(177));

var _logo = _interopRequireDefault(__webpack_require__(4092));

var _icon = _interopRequireDefault(__webpack_require__(4093));

var _parseUri2 = _interopRequireDefault(__webpack_require__(426));

var _Adapter = _interopRequireDefault(__webpack_require__(4094));

// eslint-disable-next-line
// eslint-disable-next-line
var defaultPrefix = "rc-widget"; // TODO: fix: polyfill NodeList forEach

if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

var version = "1.2.1";
var currentScript = document.currentScript;

if (!currentScript) {
  currentScript = document.querySelector('script[src*="adapter.js"]');
}

var appUrl =  false ? undefined : _url.default.resolve(currentScript.src, './app.html');

var _parseUri = (0, _parseUri2.default)(currentScript && currentScript.src || ''),
    appKey = _parseUri.appKey,
    appSecret = _parseUri.appSecret,
    appServer = _parseUri.appServer,
    appVersion = _parseUri.appVersion,
    redirectUri = _parseUri.redirectUri,
    proxyUri = _parseUri.proxyUri,
    stylesUri = _parseUri.stylesUri,
    notification = _parseUri.notification,
    disableCall = _parseUri.disableCall,
    disableMessages = _parseUri.disableMessages,
    disableConferenceInvite = _parseUri.disableConferenceInvite,
    disableGlip = _parseUri.disableGlip,
    disableConferenceCall = _parseUri.disableConferenceCall,
    authMode = _parseUri.authMode,
    prefix = _parseUri.prefix,
    userAgent = _parseUri.userAgent,
    newAdapterUI = _parseUri.newAdapterUI,
    analyticsKey = _parseUri.analyticsKey,
    enableErrorReport = _parseUri.enableErrorReport,
    errorReportToken = _parseUri.errorReportToken,
    errorReportSampleRate = _parseUri.errorReportSampleRate,
    errorReportProjectId = _parseUri.errorReportProjectId,
    authorizationCode = _parseUri.authorizationCode,
    defaultCallWith = _parseUri.defaultCallWith,
    enableFromNumberSetting = _parseUri.enableFromNumberSetting,
    disconnectInactiveWebphone = _parseUri.disconnectInactiveWebphone,
    disableInactiveTabCallEvent = _parseUri.disableInactiveTabCallEvent,
    zIndex = _parseUri.zIndex;

function obj2uri(obj) {
  if (!obj) {
    return '';
  }

  var urlParams = [];
  Object.keys(obj).forEach(function (key) {
    if (obj[key]) {
      urlParams.push("".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(obj[key])));
    }
  });
  return urlParams.join('&');
}

var appUri = "".concat(appUrl, "?").concat(obj2uri({
  appKey: appKey,
  appSecret: appSecret,
  appServer: appServer,
  appVersion: appVersion,
  redirectUri: redirectUri,
  proxyUri: proxyUri,
  stylesUri: stylesUri,
  disableCall: disableCall,
  disableMessages: disableMessages,
  disableConferenceInvite: disableConferenceInvite,
  disableGlip: disableGlip,
  disableConferenceCall: disableConferenceCall,
  authMode: authMode,
  prefix: prefix,
  userAgent: userAgent,
  analyticsKey: analyticsKey,
  enableErrorReport: enableErrorReport,
  errorReportToken: errorReportToken,
  errorReportSampleRate: errorReportSampleRate,
  errorReportProjectId: errorReportProjectId,
  authorizationCode: authorizationCode,
  defaultCallWith: defaultCallWith,
  enableFromNumberSetting: enableFromNumberSetting,
  disconnectInactiveWebphone: disconnectInactiveWebphone,
  disableInactiveTabCallEvent: disableInactiveTabCallEvent,
  fromAdapter: 1,
  _t: Date.now()
}));

function init() {
  if (window.RCAdapter) {
    return;
  }

  window.RCAdapter = new _Adapter.default({
    logoUrl: _logo.default,
    iconUrl: _icon.default,
    appUrl: appUri,
    version: version,
    prefix: prefix || defaultPrefix,
    enableNotification: !!notification,
    newAdapterUI: !!newAdapterUI,
    zIndex: zIndex ? Number.parseInt(zIndex, 10) : 999
  });
}

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}

/***/ }),

/***/ 4092:
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB3aWR0aD0iNzRweCIgaGVpZ2h0PSIxMnB4IiB2aWV3Qm94PSIwIDAgNzQgMTIiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDc0IDEyIiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzFfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzJfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzJfKSIgZmlsbD0iIzAwNjA5QyIgZD0iTTMuMzkxLDYuNDA4TDIuODcsOS40NTNIMGwxLjUyMy04Ljc0NGg0LjEyOWMwLjYzNSwwLDEuMTc3LDAuMDQyLDEuNjIxLDAuMTE0CgkJCUM3LjcxMiwwLjksOC4wNzMsMS4wMiw4LjM1MiwxLjE3OGMwLjI3OCwwLjE1NSwwLjQ4LDAuMzUyLDAuNjA5LDAuNTlDOS4wODUsMiw5LjE0NywyLjI3Nyw5LjE0NywyLjYwNAoJCQljMCwwLjE3Mi0wLjAyMSwwLjM3My0wLjA2MiwwLjZDOC45OTcsMy43MDQsOC44MDEsNC4xNDgsOC40OTcsNC41NDZjLTAuMywwLjM5Mi0wLjcyMywwLjY1NS0xLjI1NCwwLjc4OQoJCQljMC4xNzUsMC4wNjcsMC4zNCwwLjEzNiwwLjQ4LDAuMjAyQzcuODYyLDUuNjA5LDcuOTg2LDUuNjk1LDguMDg5LDUuOGMwLjA5OCwwLjEwNCwwLjE3NiwwLjIzNywwLjIzMiwwLjM4OAoJCQljMC4wNTcsMC4xNTQsMC4wODgsMC4zNTUsMC4wODgsMC42YzAsMC4yNDctMC4wMzEsMC41NDEtMC4wODgsMC44NzJjLTAuMDU3LDAuMzEtMC4wOTgsMC41NjItMC4xMzQsMC43NjQKCQkJQzguMTU2LDguNjI5LDguMTQxLDguNzg0LDguMTQxLDguODk4YzAsMC4xOTUsMC4wNzIsMC4yOTUsMC4yMTcsMC4yOTVMOC4zMjIsOS40NTZINS40MkM1LjQwNCw5LjM3OSw1LjM5NCw5LjI3OSw1LjM5NCw5LjE3OAoJCQljMC0wLjE0LDAuMDEtMC4zMTQsMC4wMzEtMC41MjVDNS40NDYsOC40MzYsNS40ODIsOC4xOTcsNS41MjgsNy45M0M1LjU3NCw3LjY2LDUuNiw3LjQzNCw1LjYsNy4yNDcKCQkJYzAtMC4zMS0wLjA5My0wLjUyNi0wLjI4NC0wLjY0OUM1LjEyNSw2LjQ3Myw0Ljc3NCw2LjQxMSw0LjI2Myw2LjQxMUgzLjM5MVY2LjQwOHogTTMuNzMyLDQuNDg4aDEuMTMKCQkJYzAuNDQ0LDAsMC43OS0wLjA2MiwxLjA0My0wLjE4MmMwLjI1My0wLjEyMywwLjQwMi0wLjM0MSwwLjQ0OS0wLjY0NkM2LjM2NSwzLjYyLDYuMzY1LDMuNTU3LDYuMzY1LDMuNDgKCQkJYzAtMC4yNTQtMC4wOTMtMC40MzUtMC4yNzktMC41NTlDNS45LDIuODA5LDUuNjU3LDIuNzQ2LDUuMzU4LDIuNzQ2SDQuMDIxTDMuNzMyLDQuNDg4eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8zXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF80XyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF80XykiIGZpbGw9IiMwMDYwOUMiIGQ9Ik0xMy4xNzMsMy4wODloMi4zMDJMMTUuMzEsNC4wODVjMC4zNTEtMC4zODcsMC43MTItMC42ODEsMS4wODQtMC44NzcKCQkJYzAuMzYxLTAuMjAxLDAuNzg1LTAuMywxLjI3LTAuM2MwLjcxMiwwLDEuMjM5LDAuMTY1LDEuNTY5LDAuNDk2YzAuMzMxLDAuMzM1LDAuNDk2LDAuODE0LDAuNDk2LDEuNDQ5CgkJCWMwLDAuMjQ4LTAuMDIxLDAuNTEyLTAuMDcyLDAuNzg1bC0wLjY1LDMuODEzaC0yLjUyOWwwLjU3OC0zLjM2NWMwLjAzMS0wLjE0NiwwLjA0Mi0wLjI4NCwwLjA0Mi0wLjQyMwoJCQljMC0wLjIxNy0wLjA1Mi0wLjQwMy0wLjE1NS0wLjU0OGMtMC4xMDMtMC4xNDYtMC4yODktMC4yMTgtMC41NjctMC4yMThjLTAuMzgyLDAtMC42NzEsMC4xMTUtMC44NDcsMC4zNDgKCQkJYy0wLjE3NiwwLjIzLTAuMjk5LDAuNTUyLTAuMzYxLDAuOTY1TDE0LjYxLDkuNDUyaC0yLjUyOUwxMy4xNzMsMy4wODl6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzVfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfNV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzZfKSIgZmlsbD0iIzAwNjA5QyIgZD0iTTIyLjA5Myw5LjYyOXYwLjAzNmMwLDAuMDg4LDAuMDQxLDAuMTcsMC4xMTMsMC4yNDIKCQkJYzAuMDgzLDAuMTA0LDAuMjU4LDAuMTU1LDAuNTE2LDAuMTU1YzAuMzcyLDAsMC42NC0wLjA5NCwwLjgyNi0wLjI3OXMwLjMyLTAuNTA2LDAuNDAyLTAuOTZsMC4xMDQtMC41MjEKCQkJYy0wLjIxNywwLjE4OC0wLjQ3NSwwLjM1My0wLjc4NSwwLjQ4NWMtMC4zMiwwLjE0LTAuNzAyLDAuMjA3LTEuMTY3LDAuMjA3Yy0wLjM4MiwwLTAuNzEyLTAuMDYyLTEuMDAxLTAuMTgyCgkJCXMtMC41MjYtMC4yODktMC43MjMtMC40OTZjLTAuMTk2LTAuMjExLTAuMzQxLTAuNDYzLTAuNDM0LTAuNzUyYy0wLjEwMy0wLjI5NS0wLjE0NS0wLjYwNC0wLjE0NS0wLjkzOQoJCQljMC0wLjEwNCwwLTAuMjA3LDAuMDIxLTAuMzExYzAuMDEtMC4xMDcsMC4wMjEtMC4yMTcsMC4wNDItMC4zM2MwLjA2Mi0wLjM4NywwLjE3NS0wLjc3OSwwLjM0MS0xLjE2NgoJCQljMC4xNjUtMC4zODksMC4zOTItMC43MzMsMC42NzEtMS4wMzljMC4yNzktMC4zMDMsMC42MDktMC41NTEsMS4wMTItMC43NDJjMC4zOTItMC4xODYsMC44NDctMC4yODMsMS4zNzMtMC4yODMKCQkJYzAuMzkyLDAsMC43MzMsMC4wOTQsMS4wNDIsMC4yNzhjMC4yOTksMC4xODEsMC41MzcsMC40MjksMC43MjMsMC43MzNsMC4xMzQtMC44MzJoMi4yMkwyNi40OSw4LjA1OQoJCQljLTAuMDgzLDAuNDc2LTAuMTg2LDAuOTI0LTAuMzExLDEuMzM4Yy0wLjEyMywwLjQxMi0wLjMzLDAuNzczLTAuNTk5LDEuMDc4Yy0wLjI3OSwwLjMxMS0wLjY1LDAuNTUzLTEuMTM2LDAuNzI0CgkJCWMtMC40NzUsMC4xNzUtMS4xMDQsMC4yNjMtMS44ODksMC4yNjNjLTAuNTU4LDAtMS4wMjItMC4wNDYtMS4zOTQtMC4xNDVjLTAuMzgyLTAuMDk5LTAuNjkyLTAuMjI4LTAuOTI5LTAuMzg3CgkJCWMtMC4yMzctMC4xNjYtMC40MDMtMC4zNTMtMC41MTYtMC41NjJjLTAuMTA0LTAuMjA3LTAuMTY1LTAuNDMtMC4xNjUtMC42NTZWOS42MjlIMjIuMDkzeiBNMjMuNiw0LjU1CgkJCWMtMC4xODYsMC0wLjM1MSwwLjAzNi0wLjQ4NSwwLjExM2MtMC4xMzQsMC4wNzEtMC4yNTgsMC4xNzEtMC4zNTEsMC4zMDVjLTAuMTAzLDAuMTMtMC4xNzUsMC4yODQtMC4yMzcsMC40NgoJCQlDMjIuNDY1LDUuNjA5LDIyLjQxMyw1Ljc5OSwyMi4zODIsNmMtMC4wMSwwLjA2Mi0wLjAxLDAuMTE0LTAuMDEsMC4xNmMtMC4wMTEsMC4wNTItMC4wMTEsMC4wOTktMC4wMTEsMC4xNDUKCQkJYzAsMC4yNTQsMC4wNjIsMC40NzUsMC4xODYsMC42NTVjMC4xMjQsMC4xODcsMC4zMzEsMC4yNzksMC42MiwwLjI4OWgwLjA1MWMwLjE4NiwwLDAuMzQxLTAuMDQxLDAuNDg1LTAuMTEzCgkJCWMwLjE0NC0wLjA3MSwwLjI1OC0wLjE3MSwwLjM2MS0wLjI4OGMwLjEwMy0wLjEyNSwwLjE4Ni0wLjI2NCwwLjI0OC0wLjQyNGMwLjA3Mi0wLjE2LDAuMTE0LTAuMzIsMC4xNTUtMC40OTYKCQkJYzAuMDIxLTAuMTI5LDAuMDMxLTAuMjYzLDAuMDMxLTAuNDAyYzAtMC4yNjktMC4wNjItMC40OTQtMC4xOTYtMC42ODdjLTAuMTI0LTAuMTktMC4zNTEtMC4yODktMC42ODEtMC4yODlIMjMuNnoiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfN18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfOF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF83XyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cGF0aCBjbGlwLXBhdGg9InVybCgjU1ZHSURfOF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMzMuMjk0LDQuMTI3YzAtMC4wMzEsMC4wMTEtMC4wNTksMC4wMTEtMC4wODNjMC0wLjAyMSwwLjAxLTAuMDQ3LDAuMDEtMC4wNzcKCQkJYzAtMC4zODgtMC4xMTQtMC42ODItMC4zMzItMC44ODNjLTAuMjE3LTAuMjA3LTAuNTI1LTAuMzExLTAuOTI4LTAuMzExYy0wLjQ3NiwwLTAuODg5LDAuMTk3LTEuMjI5LDAuNgoJCQljLTAuMzMxLDAuNDAyLTAuNTY4LDEuMDA3LTAuNzEyLDEuODEyYy0wLjAzMSwwLjE0OC0wLjA1MywwLjI5OS0wLjA2MiwwLjQzOGMtMC4wMjEsMC4xNDUtMC4wMjEsMC4yNzktMC4wMjEsMC40MDgKCQkJYzAsMC4yMDEsMC4wMTEsMC4zODcsMC4wNjIsMC41NTNjMC4wNDIsMC4xNywwLjExNCwwLjMxNCwwLjIxNywwLjQ0M2MwLjEwNCwwLjEyMywwLjIzOCwwLjIyMiwwLjQwMywwLjI5OQoJCQljMC4xNzUsMC4wNzIsMC4zODIsMC4xMDcsMC42NCwwLjEwN2MwLjQ0NCwwLDAuNzk1LTAuMTM0LDEuMDUzLTAuNDAxYzAuMjctMC4yNjksMC40NjYtMC41OTksMC41NzgtMS4wMDFoMi42MTMKCQkJYy0wLjE1NCwwLjUzNy0wLjM3MSwxLjAxNy0wLjY2LDEuNDM1Yy0wLjI4OSwwLjQyNS0wLjYzMSwwLjc4NS0xLjAyMiwxLjA3OXMtMC44MzYsMC41MTYtMS4zMjEsMC42NzYKCQkJYy0wLjQ4NCwwLjE1NS0xLjAwMSwwLjIzMi0xLjU0OCwwLjIzMmMtMC41ODksMC0xLjEyNS0wLjA3Mi0xLjU4LTAuMjI3Yy0wLjQ2NS0wLjE1Ni0wLjg0Ny0wLjM3Ny0xLjE2Ny0wLjY2NgoJCQljLTAuMzItMC4yOTUtMC41NTktMC42NDYtMC43MjMtMS4wNjNjLTAuMTY2LTAuNDE4LTAuMjQ4LTAuODg4LTAuMjQ4LTEuNDE5YzAtMC4xNSwwLjAxLTAuMzExLDAuMDIxLTAuNDc3CgkJCWMwLjAyMS0wLjE2NCwwLjA0MS0wLjMzNCwwLjA3MS0wLjUxMWMwLjExNC0wLjY2NiwwLjMxOS0xLjI2NSwwLjYzLTEuODA3YzAuMzExLTAuNTMxLDAuNjgyLTAuOTkxLDEuMTE1LTEuMzYyCgkJCWMwLjQzNC0wLjM3NywwLjkyOS0wLjY2NiwxLjQ2Ni0wLjg2N3MxLjA5NS0wLjMwNSwxLjY3Mi0wLjMwNWMxLjE5OCwwLDIuMDk3LDAuMjY0LDIuNjk0LDAuNzk1CgkJCWMwLjU4OSwwLjUyNSwwLjg4OCwxLjI3LDAuODg4LDIuMjM0djAuMTc2YzAsMC4wNTItMC4wMSwwLjEwNy0wLjAxLDAuMTcxTDMzLjI5NCw0LjEyN0wzMy4yOTQsNC4xMjd6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzlfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzEwXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzlfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xMF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMzguNTE4LDYuNjYxYy0wLjAxMSwwLjA0MS0wLjAyMSwwLjA4Mi0wLjAyMSwwLjExOAoJCQljLTAuMDExLDAuMDQxLTAuMDExLDAuMDgyLTAuMDExLDAuMTIzYzAsMC4zMTEsMC4xMDQsMC41NTQsMC4zMSwwLjczOGMwLjE5NiwwLjE4MiwwLjQ1NSwwLjI3LDAuNzU0LDAuMjcKCQkJYzAuMTk2LDAsMC4zOTQtMC4wNDcsMC41NzgtMC4xNDFjMC4xODUtMC4wOTMsMC4zNDEtMC4yMzEsMC40NjUtMC40MThoMi40MTZjLTAuMTc2LDAuMzk3LTAuNDEzLDAuNzI5LTAuNzAyLDAuOTk2CgkJCWMtMC4yODksMC4yNjktMC41OTksMC40ODUtMC45NDksMC42NWMtMC4zNTIsMC4xNjUtMC43MTMsMC4yODQtMS4xMDQsMC4zNTJjLTAuMzgyLDAuMDcxLTAuNzU0LDAuMTA0LTEuMTI1LDAuMTA0CgkJCWMtMC40NTQsMC0wLjg3OC0wLjA1Ny0xLjI2LTAuMTdjLTAuMzgyLTAuMTE0LTAuNzAyLTAuMjg0LTAuOTc5LTAuNTEyYy0wLjI3OS0wLjIyMy0wLjQ4Ni0wLjUtMC42NDItMC44MzIKCQkJYy0wLjE1NC0wLjMyNC0wLjIzNy0wLjctMC4yMzctMS4xMzVjMC0wLjEwNCwwLjAxMi0wLjIxMiwwLjAyMS0wLjMyYzAuMDExLTAuMTA3LDAuMDMxLTAuMjIxLDAuMDQyLTAuMzM0CgkJCWMwLjA5My0wLjUxOCwwLjI2OC0wLjk5MSwwLjUyNi0xLjQxNmMwLjI1OC0wLjQyMiwwLjU3Ny0wLjc4MywwLjk0OC0xLjA3N2MwLjM4Mi0wLjMsMC43OTUtMC41MjcsMS4yNjEtMC42ODcKCQkJYzAuNDc1LTAuMTY2LDAuOTU5LTAuMjQ0LDEuNDY1LTAuMjQ0YzAuNTE4LDAsMC45NjEsMC4wNzIsMS4zNTQsMC4yMTdjMC4zOTMsMC4xNDYsMC43MzIsMC4zNDcsMC45OTEsMC42MDkKCQkJYzAuMjY5LDAuMjU4LDAuNDc1LDAuNTczLDAuNjA4LDAuOTQ0YzAuMTM1LDAuMzcyLDAuMjA3LDAuNzg1LDAuMjA3LDEuMjI5YzAsMC4yNzItMC4wMzEsMC41ODgtMC4wOTQsMC45MzVIMzguNTE4egoJCQkgTTQxLjAyNSw1LjM3NmMwLjAxMS0wLjA0MiwwLjAxMS0wLjEwNCwwLjAxMS0wLjE4N2MwLTAuMjU4LTAuMDgyLTAuNDc2LTAuMjY5LTAuNjU1Yy0wLjE3Ni0wLjE3Ny0wLjM5My0wLjI2My0wLjY2LTAuMjYzCgkJCWMtMC4zODMsMC0wLjY5MSwwLjA5OC0wLjkzLDAuMjkzYy0wLjIyOCwwLjIwMS0wLjM4MywwLjQ3MS0wLjQ0MywwLjgxMkg0MS4wMjV6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzExXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8xMl8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8xMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzEyXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik00NC4yNTgsMy4wODloMi4zMDNsLTAuMTc3LDAuOTk2YzAuMzYxLTAuMzg3LDAuNzI0LTAuNjgxLDEuMDg0LTAuODc3CgkJCWMwLjM3Mi0wLjIwMSwwLjc5Ni0wLjMsMS4yOC0wLjNjMC43MTMsMCwxLjIyOSwwLjE2NSwxLjU2OCwwLjQ5NmMwLjMzLDAuMzM1LDAuNDk2LDAuODE0LDAuNDk2LDEuNDQ5CgkJCWMwLDAuMjQ4LTAuMDMsMC41MTItMC4wNzEsMC43ODVMNTAuMDgsOS40NTJoLTIuNTI5bDAuNTktMy4zNjVjMC4wMjEtMC4xNDYsMC4wMjktMC4yODQsMC4wMjktMC40MjMKCQkJYzAtMC4yMTctMC4wNDEtMC40MDMtMC4xNDUtMC41NDhjLTAuMTA0LTAuMTQ2LTAuMjg5LTAuMjE4LTAuNTY3LTAuMjE4Yy0wLjM4MiwwLTAuNjcxLDAuMTE1LTAuODQ3LDAuMzQ4CgkJCWMtMC4xODcsMC4yMy0wLjMwMSwwLjU1Mi0wLjM3MywwLjk2NWwtMC41NTcsMy4yNDFoLTIuNTJMNDQuMjU4LDMuMDg5eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xM18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMTRfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xNF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNTQuNzU3LDkuNDA3Yy0wLjI4OSwwLjAxNS0wLjU0NywwLjAyNC0wLjc4NCwwLjAzNgoJCQljLTAuMjM4LDAuMDEtMC40NjUsMC4wMS0wLjY2LDAuMDFjLTAuMzgzLDAtMC43MDMtMC4wMTYtMC45NjEtMC4wNTNjLTAuMjU5LTAuMDM1LTAuNDY1LTAuMTAzLTAuNjE5LTAuMTk1CgkJCWMtMC4xNTQtMC4wOTQtMC4yNjktMC4yMTctMC4zMy0wLjM3MWMtMC4wNjItMC4xNDgtMC4wOTQtMC4zNDYtMC4wOTQtMC41ODNjMC0wLjE0NiwwLjAxMi0wLjMwNiwwLjAyMS0wLjQ5MQoJCQljMC4wMjEtMC4xODEsMC4wNTItMC4zODIsMC4wOTMtMC41OTlsMC40NjYtMi42NjNINTAuOTlsMC4yMzYtMS40NTVoMC45MzlsMC4zNTItMS45ODJoMi40ODhsLTAuMzUyLDEuOTgyaDEuMjE5bC0wLjI0OCwxLjQ1NQoJCQloLTEuMjA4bC0wLjQwMSwyLjMxNmMtMC4wMjEsMC4wNzgtMC4wMzEsMC4xNDEtMC4wNDMsMC4yMDFjLTAuMDEsMC4wNjItMC4wMSwwLjExOS0wLjAxLDAuMTY2YzAsMC4xNTQsMC4wNTMsMC4yNjQsMC4xNDUsMC4zMwoJCQljMC4xMDQsMC4wNjIsMC4yNzgsMC4wOTgsMC41NDcsMC4wOThoMC40MDJMNTQuNzU3LDkuNDA3eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xNV8iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMTZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTVfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xNl8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNTYuMzg5LDMuMDg5aDIuMzAzTDU4LjQ2Myw0LjM4aDAuMDMxQzU5LDMuMzk4LDU5LjczMiwyLjkwOCw2MC43MDMsMi45MDgKCQkJYzAuMDUyLDAsMC4xMTMsMC4wMDUsMC4xNjUsMC4wMTFjMC4wNTIsMC4wMTEsMC4xMDQsMC4wMjEsMC4xNjUsMC4wMjRsLTAuNDU0LDIuNTI5Yy0wLjA4Mi0wLjAyMS0wLjE2NS0wLjAzNS0wLjI0OC0wLjA1MgoJCQljLTAuMDgyLTAuMDE3LTAuMTc1LTAuMDI0LTAuMjU4LTAuMDI0Yy0wLjUxNywwLTAuOTI5LDAuMTQtMS4yMzgsMC40MTJjLTAuMywwLjI3OC0wLjUxNywwLjc2LTAuNjMsMS40NDRsLTAuMzgyLDIuMTk5aC0yLjUyOQoJCQlMNTYuMzg5LDMuMDg5eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xN18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMThfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTdfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xOF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNjQuNDA5LDkuNDY5bC0wLjAxMS0wLjg3OGMtMC40MTIsMC4zNDEtMC44MjUsMC41NjgtMS4yMTksMC42ODcKCQkJYy0wLjQwMiwwLjExOS0wLjg0NywwLjE3Ny0xLjMyLDAuMTc3Yy0wLjI3LDAtMC41MjYtMC4wMzEtMC43NjQtMC4wODhjLTAuMjQ4LTAuMDYyLTAuNDU1LTAuMTU0LTAuNjMxLTAuMjg5CgkJCWMtMC4xODYtMC4xMjktMC4zMi0wLjI4OS0wLjQzNC0wLjQ3OWMtMC4xMDQtMC4xODctMC4xNTUtMC40MTgtMC4xNTUtMC42ODdjMC0wLjExNCwwLjAxMS0wLjIzNywwLjA0Mi0wLjM3NwoJCQljMC4wNzItMC40NzYsMC4yNTgtMC44NTMsMC41MjUtMS4xMmMwLjI3LTAuMjczLDAuNTg5LTAuNDc1LDAuOTQ5LTAuNjE0YzAuMzUzLTAuMTQsMC43MzMtMC4yMzEsMS4xMzctMC4yODQKCQkJYzAuNDAyLTAuMDU3LDAuNzczLTAuMTAzLDEuMTE1LTAuMTQ4YzAuMzUxLTAuMDQxLDAuNjQtMC4xMDQsMC44NzctMC4xODJjMC4yMzctMC4wNzYsMC4zNzEtMC4yMTcsMC40MTItMC40MTgKCQkJYzAtMC4wMTYsMC0wLjAzMSwwLTAuMDQxYzAtMC4wMTYsMC4wMTItMC4wMjUsMC4wMTItMC4wNDFjMC0wLjA5OS0wLjAzMS0wLjE3Ni0wLjA5NC0wLjIzMWMtMC4wNTItMC4wNTgtMC4xMjMtMC4xMDQtMC4xOTUtMC4xMwoJCQlzLTAuMTU1LTAuMDQ3LTAuMjQ4LTAuMDYyYy0wLjA5NC0wLjAxMS0wLjE2NS0wLjAxNi0wLjIxNy0wLjAxNmMtMC4wOTQsMC0wLjE4NywwLjAwNS0wLjI4OSwwLjAxNgoJCQljLTAuMTA0LDAuMDE2LTAuMTk2LDAuMDQxLTAuMjc4LDAuMDg4Yy0wLjA5MywwLjA0Ny0wLjE3NiwwLjEwOC0wLjI1OSwwLjE4N2MtMC4wNzIsMC4wODMtMC4xMjMsMC4xOS0wLjE2NSwwLjMzaC0yLjQyNwoJCQljMC4wNjItMC4zNDEsMC4xNzctMC42NDYsMC4zNDItMC45MDNjMC4xNzYtMC4yNjMsMC40MTItMC40OSwwLjcyMy0wLjY3MXMwLjY5MS0wLjMxOSwxLjE0Ni0wLjQxOAoJCQljMC40NTMtMC4wOTksMS4wMDItMC4xNDYsMS42MzItMC4xNDZjMC41NzcsMCwxLjA0MiwwLjAzNywxLjQxMywwLjExM2MwLjM3MSwwLjA3OCwwLjY2LDAuMTkxLDAuODY3LDAuMzM2CgkJCWMwLjIxNywwLjE0NiwwLjM2MSwwLjMyLDAuNDQzLDAuNTIxYzAuMDcyLDAuMjAxLDAuMTE0LDAuNDI5LDAuMTE0LDAuNjgyYzAsMC4xNDgtMC4wMTEsMC4zMTEtMC4wMzEsMC40NzEKCQkJYy0wLjAyMSwwLjE2NC0wLjA0MSwwLjMzNC0wLjA3MSwwLjUxTDY2LjgzNCw4LjM0Yy0wLjAyMSwwLjEzNS0wLjAyOSwwLjI0OC0wLjAyOSwwLjM0MmMwLDAuMDg4LDAuMDEsMC4xNjQsMC4wNDEsMC4yMzEKCQkJYzAuMDQxLDAuMDcxLDAuMDkyLDAuMTQ5LDAuMTg2LDAuMjM3bC0wLjAxLDAuMzJoLTIuNjEyVjkuNDY5eiBNNjMuMjQzLDguMDJjMC4yMTcsMCwwLjQxMS0wLjAzNywwLjU3Ny0wLjExOQoJCQljMC4xNjYtMC4wNzcsMC4zMTEtMC4xOSwwLjQyNC0wLjMzNmMwLjExMy0wLjE0LDAuMTk1LTAuMzA1LDAuMjU4LTAuNDk2YzAuMDcyLTAuMTg5LDAuMTE0LTAuMzk2LDAuMTM1LTAuNjEzCgkJCWMtMC4yMjgsMC4xLTAuNDUzLDAuMTcxLTAuNjgyLDAuMjEyYy0wLjIyOSwwLjA0Ny0wLjQ0MywwLjA5My0wLjY1LDAuMTQ5Yy0wLjE5NSwwLjA1Mi0wLjM2MSwwLjEyMy0wLjUwNiwwLjIyMgoJCQlzLTAuMjI5LDAuMjQ4LTAuMjU4LDAuNDQ4djAuMDcyYzAsMC4xNDEsMC4wNTIsMC4yNTQsMC4xNzUsMC4zMzZDNjIuODMsNy45NzcsNjMuMDA1LDguMDIsNjMuMjQzLDguMDIiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfMTlfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzIwXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzE5XyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cG9seWdvbiBjbGlwLXBhdGg9InVybCgjU1ZHSURfMjBfKSIgZmlsbD0iI0YzOEIwMCIgcG9pbnRzPSI2Ny40NTUsOS40NTMgNjguOTczLDAuNzA5IDcxLjUwMiwwLjcwOSA2OS45ODQsOS40NTMgCQkiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfMjFfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzIyXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzIxXyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cG9seWdvbiBjbGlwLXBhdGg9InVybCgjU1ZHSURfMjJfKSIgZmlsbD0iIzAwNjA5QyIgcG9pbnRzPSI4Ljc5Niw5LjQ1MyAxMC4yMTUsNC4yODYgMTIuMDQ4LDQuMjg2IDExLjMwNCw5LjQ1MyAJCSIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8yM18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMjRfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMjNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8yNF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMTIuOTY2LDEuOTg0di0wLjAxYy0wLjAxLTAuMDExLTAuMDIxLTAuMDMxLTAuMDQxLTAuMDUyCgkJCWMtMC4wMzEtMC4wNTItMC4wOTMtMC4xMTgtMC4xODYtMC4yMDJjLTAuMTc1LTAuMTQ4LTAuNDU0LTAuMzMtMC45MjktMC40MThjLTAuMjI3LTAuMDQxLTAuNDIzLTAuMDQxLTAuNTg4LTAuMDI1CgkJCWMtMC40MTMsMC4wNDctMC42NjEsMC4yMDctMC43NDksMC4yNzljLTAuMDI1LDAuMDIxLTAuMDMxLDAuMDI1LTAuMDMxLDAuMDI1bDAsMGMtMC4xMTQsMC4xMTMtMC4zMDUsMC4xMTMtMC40MjMsMAoJCQljLTAuMTEzLTAuMTE5LTAuMTEzLTAuMzA1LDAtMC40MjRjMC4wMzEtMC4wMywwLjQxMy0wLjM5NywxLjE0MS0wLjQ3NWMwLjIyOC0wLjAyMSwwLjQ3NS0wLjAxNywwLjc2NCwwLjAzNQoJCQljMS4xNTYsMC4yMDEsMS41NTksMC45NDQsMS41OCwwLjk5NmMwLjA3MiwwLjE0NSwwLjAxLDAuMzI1LTAuMTM0LDAuNDAyYy0wLjAzMSwwLjAxNi0wLjA3MiwwLjAyNS0wLjEwMywwLjAyNQoJCQlDMTMuMTQyLDIuMTYsMTMuMDI4LDIuMDk4LDEyLjk2NiwxLjk4NCIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8yNV8iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMjZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMjVfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8yNl8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMTIuMjIzLDIuNjY2YzAsMCwwLTAuMDA2LTAuMDEtMC4wMzFjLTAuMDIxLTAuMDIxLTAuMDUyLTAuMDYyLTAuMTAzLTAuMTA0CgkJCWMtMC4wOTMtMC4wODItMC4yNTgtMC4xODYtMC41MTctMC4yMzJjLTAuMTM0LTAuMDI1LTAuMjQ4LTAuMDI1LTAuMzQtMC4wMTVjLTAuMjE3LDAuMDI0LTAuMzYxLDAuMTEyLTAuNDAzLDAuMTQ5CgkJCWMtMC4wMSwwLjAxLTAuMDEsMC4wMS0wLjAxLDAuMDFjLTAuMDkzLDAuMDk5LTAuMjU4LDAuMDk5LTAuMzUxLDBjLTAuMDk4LTAuMDk4LTAuMDk4LTAuMjU0LDAtMC4zNTIKCQkJYzAuMDIxLTAuMDI1LDAuMjU4LTAuMjU4LDAuNzIzLTAuMzA1YzAuMTM0LTAuMDE2LDAuMjg5LTAuMDEsMC40NjUsMC4wMjFjMC43MjMsMC4xMjksMC45OCwwLjU4OCwwLjk5MSwwLjYyOQoJCQljMC4wNjIsMC4xMjUsMC4wMjEsMC4yNzMtMC4xMDMsMC4zMzZjLTAuMDMxLDAuMDExLTAuMDYyLDAuMDIxLTAuMDkzLDAuMDI1QzEyLjM3OCwyLjgxMSwxMi4yNzUsMi43NTksMTIuMjIzLDIuNjY2Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzI3XyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8yOF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8yN18iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzI4XykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik0xMi4wMTcsMy4yNzNjMCwwLjMwNi0wLjI4OSwwLjU1NC0wLjY1LDAuNTQ5CgkJCWMtMC4zNjEsMC0wLjY1LTAuMjQ4LTAuNjQtMC41NTNjMC0wLjMxMSwwLjI4OS0wLjU1OSwwLjY0LTAuNTUzQzExLjcyOCwyLjcxOCwxMi4wMTcsMi45NzEsMTIuMDE3LDMuMjczIi8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzI5XyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8zMF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8yOV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzMwXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik03Mi40NDEsMS4wNzZoMC41MjVjMC4xMjQsMCwwLjIxNywwLjAyNSwwLjI3OCwwLjA3NgoJCQljMC4wNjIsMC4wNTgsMC4wOTMsMC4xMywwLjA5MywwLjIyM2MwLDAuMDUyLTAuMDEsMC4xLTAuMDI5LDAuMTM1Yy0wLjAxMiwwLjAzNi0wLjAzMSwwLjA2Mi0wLjA1MywwLjA4MgoJCQlzLTAuMDQxLDAuMDM2LTAuMDYyLDAuMDQ3Yy0wLjAyMSwwLjAxLTAuMDI5LDAuMDE2LTAuMDQxLDAuMDIxbDAsMGMwLjAxMiwwLjAwNSwwLjAzMSwwLjAxMSwwLjA1MywwLjAxNgoJCQljMC4wMjEsMC4wMSwwLjA0MSwwLjAyMSwwLjA1MiwwLjA0MWMwLjAyMSwwLjAxNiwwLjAzMSwwLjA0MSwwLjA0MSwwLjA2N2MwLjAxMSwwLjAzLDAuMDIxLDAuMDY3LDAuMDIxLDAuMTEyCgkJCWMwLDAuMDYyLDAsMC4xMjUsMC4wMTIsMC4xNzdjMC4wMSwwLjA1MiwwLjAzMSwwLjA5MywwLjA1MiwwLjExMmgtMC4yMDdjLTAuMDIxLTAuMDIxLTAuMDMtMC4wNDUtMC4wMy0wLjA3NnMwLTAuMDU4LDAtMC4wODQKCQkJYzAtMC4wNTEtMC4wMTEtMC4wOTgtMC4wMTEtMC4xMzNjLTAuMDExLTAuMDM3LTAuMDIxLTAuMDY3LTAuMDQxLTAuMDk0Yy0wLjAxMS0wLjAyMS0wLjAzLTAuMDQyLTAuMDYyLTAuMDUyCgkJCWMtMC4wMy0wLjAxMS0wLjA2Mi0wLjAxNy0wLjExMy0wLjAxN2gtMC4yNzd2MC40NTVoLTAuMTk3VjEuMDc2SDcyLjQ0MXogTTcyLjYzOSwxLjU4MmgwLjMxOGMwLjA2MiwwLDAuMTA0LTAuMDE2LDAuMTM1LTAuMDQ3CgkJCWMwLjAzLTAuMDI1LDAuMDUzLTAuMDcyLDAuMDUzLTAuMTI5YzAtMC4wMzYtMC4wMTItMC4wNjctMC4wMjEtMC4wODhjLTAuMDEtMC4wMjEtMC4wMjEtMC4wNDEtMC4wNDEtMC4wNTMKCQkJYy0wLjAyMS0wLjAxNi0wLjAzMS0wLjAyMS0wLjA2Mi0wLjAyNGMtMC4wMjEtMC4wMDUtMC4wNDEtMC4wMDUtMC4wNzEtMC4wMDVoLTAuMzFWMS41ODJ6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzMxXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8zMl8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8zMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzMyXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik03Mi44NTQsMi44MzZjLTAuNjI5LDAtMS4xNDYtMC41MTYtMS4xNDYtMS4xNQoJCQljMC0wLjYyOSwwLjUxNy0xLjE0NiwxLjE0Ni0xLjE0NlM3NCwxLjA1Nyw3NCwxLjY4NkM3NCwyLjMyLDczLjQ4MiwyLjgzNiw3Mi44NTQsMi44MzYgTTcyLjg1NCwwLjc0NQoJCQljLTAuNTE3LDAtMC45MzgsMC40MjQtMC45MzgsMC45MzhjMCwwLjUyMSwwLjQyMywwLjk0NSwwLjkzOCwwLjk0NWMwLjUxNywwLDAuOTM5LTAuNDI0LDAuOTM5LTAuOTQ1CgkJCUM3My43OTQsMS4xNjksNzMuMzcsMC43NDUsNzIuODU0LDAuNzQ1Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg=="

/***/ }),

/***/ 4093:
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICAgIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjgwIiByeD0iMy43NSIvPgogICAgICAgIDxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik01Ljg0NiAyaDQuMzA4YzEuMzM3IDAgMS44MjIuMTQgMi4zMTEuNC40OS4yNjIuODczLjY0NiAxLjEzNCAxLjEzNS4yNjIuNDg5LjQwMS45NzQuNDAxIDIuMzF2Ny45NzZjMCAuMDYyLS4wMDYuMDg1LS4wMTkuMTA4YS4xMjcuMTI3IDAgMCAxLS4wNTIuMDUyYy0uMDIzLjAxMy0uMDQ2LjAxOS0uMTA4LjAxOUg1Ljg0NmMtMS4zMzcgMC0xLjgyMi0uMTQtMi4zMTEtLjRBMi43MjYgMi43MjYgMCAwIDEgMi40IDEyLjQ2NGMtLjI2Mi0uNDg5LS40MDEtLjk3NC0uNDAxLTIuMzF2LTQuMzFjMC0xLjMzNi4xNC0xLjgyMS40LTIuMzFBMi43MjYgMi43MjYgMCAwIDEgMy41MzYgMi40QzQuMDI0IDIuMTM5IDQuNTA5IDIgNS44NDUgMnoiLz4KICAgICAgICA8cGF0aCBmaWxsPSIjMDY4NEJEIiBkPSJNNS4wNzggMy44MTNoNS44NGMuNyAwIDEuMjY2LjU2NiAxLjI2NiAxLjI2NXYyLjk1M2MwIC45MjUtLjg3NCAxLjUwNS0xLjUxMSAxLjY5Mi4yODUuNTQuNzMzIDEuMzU2IDEuMzQzIDIuNDQ5SDkuOTUzTDguNTkyIDkuODE1aC0uMDg4YS4yOC4yOCAwIDAgMS0uMjgtLjI4VjcuODgzaDEuODk4VjUuODczSDUuODgxdjMuNjA0YzAgLjYuMTE4IDEuNjQgMS4wMjUgMi42OTVINC44NDNjLS43NTgtLjU1NS0xLjAzLTEuNjg5LTEuMDMtMi4zNTdWNS4wNzhjMC0uNjk5LjU2Ni0xLjI2NiAxLjI2NS0xLjI2NnoiLz4KICAgIDwvZz4KPC9zdmc+Cg=="

/***/ }),

/***/ 4094:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(__webpack_require__(74));

var _createClass2 = _interopRequireDefault(__webpack_require__(84));

var _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(81));

var _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(76));

var _get2 = _interopRequireDefault(__webpack_require__(213));

var _inherits2 = _interopRequireDefault(__webpack_require__(82));

var _classnames = _interopRequireDefault(__webpack_require__(20));

var _AdapterCore2 = _interopRequireDefault(__webpack_require__(4095));

var _url = _interopRequireDefault(__webpack_require__(177));

var _parseUri2 = _interopRequireDefault(__webpack_require__(426));

var _messageTypes = _interopRequireDefault(__webpack_require__(538));

var _requestWithPostMessage2 = _interopRequireDefault(__webpack_require__(542));

var _styles = _interopRequireDefault(__webpack_require__(4096));

var _notification = _interopRequireDefault(__webpack_require__(4098));

var Adapter = /*#__PURE__*/function (_AdapterCore) {
  (0, _inherits2.default)(Adapter, _AdapterCore);

  function Adapter() {
    var _this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        logoUrl = _ref.logoUrl,
        appUrl = _ref.appUrl,
        iconUrl = _ref.iconUrl,
        _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === void 0 ? 'rc-widget' : _ref$prefix,
        version = _ref.version,
        _ref$appWidth = _ref.appWidth,
        appWidth = _ref$appWidth === void 0 ? 300 : _ref$appWidth,
        _ref$appHeight = _ref.appHeight,
        appHeight = _ref$appHeight === void 0 ? 500 : _ref$appHeight,
        _ref$zIndex = _ref.zIndex,
        zIndex = _ref$zIndex === void 0 ? 999 : _ref$zIndex,
        _ref$enableNotificati = _ref.enableNotification,
        enableNotification = _ref$enableNotificati === void 0 ? false : _ref$enableNotificati,
        _ref$newAdapterUI = _ref.newAdapterUI,
        newAdapterUI = _ref$newAdapterUI === void 0 ? false : _ref$newAdapterUI;

    (0, _classCallCheck2.default)(this, Adapter);
    var container = document.createElement('div');
    container.id = prefix;
    container.setAttribute('class', (0, _classnames.default)(_styles.default.root, _styles.default.loading));
    container.draggable = false;
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Adapter).call(this, {
      prefix: prefix,
      container: container,
      styles: _styles.default,
      messageTypes: _messageTypes.default,
      defaultDirection: 'right'
    }));
    _this._messageTypes = _messageTypes.default;
    _this._zIndex = zIndex;
    _this._appWidth = appWidth;
    _this._appHeight = appHeight;
    _this._strings = {};

    _this._generateContentDOM();

    var styleList = document.querySelectorAll('style');

    for (var i = 0; i < styleList.length; ++i) {
      var styleEl = styleList[i];

      if (styleEl.innerHTML.indexOf('https://{{rc-styles}}') > -1) {
        _this.styleEl = styleEl;
      }
    }

    if (_this.styleEl) {
      _this._root.appendChild(_this.styleEl.cloneNode(true));
    }

    _this._setAppUrl(appUrl);

    _this._setLogoUrl(logoUrl);

    _this._setIconUrl(iconUrl);

    _this._version = version;
    window.addEventListener('message', function (e) {
      var data = e.data;

      _this._onMessage(data);
    });
    document.addEventListener('click', function (event) {
      var target = event.target;

      if (!target) {
        return;
      }

      if (target && !target.href) {
        target = target.parentElement;
      }

      if (target && !target.href) {
        target = target.parentElement;
      }

      if (!target) {
        return;
      }

      if (target.matches('a[href^="sms:"]')) {
        event.preventDefault();
        var hrefStr = target.href;
        var pathStr = hrefStr.split('?')[0];

        var _parseUri = (0, _parseUri2.default)(hrefStr),
            text = _parseUri.text,
            body = _parseUri.body;

        var phoneNumber = pathStr.replace(/[^\d+*-]/g, '');

        _this.clickToSMS(phoneNumber, body || text);
      } else if (target.matches('a[href^="tel:"]')) {
        event.preventDefault();
        var _hrefStr = target.href;

        var _phoneNumber = _hrefStr.replace(/[^\d+*-]/g, '');

        _this.clickToCall(_phoneNumber, true);
      }
    }, false);

    if (enableNotification) {
      _this._notification = new _notification.default();
    }

    _this._widgetCurrentPath = '';
    _this._webphoneCalls = [];
    _this._currentStartTime = 0;
    _this._ringingCallsLength = 0;
    _this._onHoldCallsLength = 0;
    _this._hasActiveCalls = false;
    _this._showDockUI = newAdapterUI;
    return _this;
  }

  (0, _createClass2.default)(Adapter, [{
    key: "_onMessage",
    value: function _onMessage(data) {
      if (data) {
        switch (data.type) {
          case 'rc-call-ring-notify':
            console.log('ring call:');
            console.log(data.call);
            this.setMinimized(false);

            if (this._notification) {
              this._notification.notify({
                title: 'New Call',
                text: "Incoming Call from ".concat(data.call.fromUserName || data.call.from),
                onClick: function onClick() {
                  window.focus();
                }
              });
            }

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-init-notify':
            console.log('init call:');
            console.log(data.call);

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-start-notify':
            console.log('start call:');
            console.log(data.call);

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-end-notify':
            console.log('end call:');
            console.log(data.call);

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-hold-notify':
            console.log('hold call:');
            console.log(data.call);

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-resume-notify':
            console.log('resume call:');
            console.log(data.call);

            this._updateWebphoneCalls(data.call);

            break;

          case 'rc-call-mute-notify':
            // get call on call muted or unmuted event
            console.log('call muted changed:');
            console.log(data.call);
            break;

          case 'rc-login-status-notify':
            console.log('rc-login-status-notify:', data.loggedIn, data.loginNumber);
            break;

          case 'rc-calling-settings-notify':
            console.log('rc-calling-settings-notify:', data.callWith, data.callingMode);
            break;

          case 'rc-region-settings-notify':
            console.log('rc-region-settings-notify:', data.countryCode, data.areaCode);
            break;

          case 'rc-active-call-notify':
            console.log('rc-active-call-notify:', data.call);
            break;

          case 'rc-ringout-call-notify':
            console.log('rc-ringout-call-notify:', data.call);
            break;

          case 'rc-inbound-message-notify':
            console.log('rc-inbound-message-notify:', data.message.id);
            break;

          case 'rc-message-updated-notify':
            console.log('rc-message-updated-notify:', data.message.id);
            break;

          case 'rc-route-changed-notify':
            this._updateWidgetCurrentPath(data.path);

            console.log('rc-route-changed-notify:', data.path);
            break;

          case 'rc-callLogger-auto-log-notify':
            console.log('rc-callLogger-auto-log-notify:', data.autoLog);
            break;

          case 'rc-dialer-status-notify':
            console.log('rc-dialer-status-notify:', data.ready);
            break;

          case 'rc-meeting-status-notify':
            console.log('rc-meeting-status-notify:', data.ready, data.permission);
            break;

          default:
            (0, _get2.default)((0, _getPrototypeOf2.default)(Adapter.prototype), "_onMessage", this).call(this, data);
            break;
        }
      }
    }
  }, {
    key: "_getContentDOM",
    value: function _getContentDOM(sanboxAttributeValue, allowAttributeValue) {
      return "\n      <header class=\"".concat(this._styles.header, "\" draggable=\"false\">\n        <div class=\"").concat(this._styles.presence, " ").concat(this._styles.NoPresence, "\">\n          <div class=\"").concat(this._styles.presenceBar, "\">\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.iconContainer, "\">\n          <img class=\"").concat(this._styles.icon, "\" draggable=\"false\"></img>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.toggle, "\" data-sign=\"adapterToggle\">\n          <div class=\"").concat(this._styles.minimizeIcon, "\">\n            <div class=\"").concat(this._styles.minimizeIconBar, "\"></div>\n          </div>\n        </div>\n        <img class=\"").concat(this._styles.logo, "\" draggable=\"false\"></img>\n        <div class=\"").concat(this._styles.duration, "\"></div>\n        <div class=\"").concat(this._styles.ringingCalls, "\"></div>\n        <div class=\"").concat(this._styles.onHoldCalls, "\"></div>\n        <div class=\"").concat(this._styles.currentCallBtn, "\"></div>\n        <div class=\"").concat(this._styles.viewCallsBtn, "\"></div>\n      </header>\n      <div class=\"").concat(this._styles.dropdownPresence, "\">\n        <div class=\"").concat(this._styles.line, "\">\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"available\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Available, "\">\n            </div>\n            <span>").concat(this._strings.availableBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"busy\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Busy, "\">\n            </div>\n            <span>").concat(this._strings.busyBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"doNotAcceptAnyCalls\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.DoNotAcceptAnyCalls, "\">\n              <div class=\"").concat(this._styles.presenceBar, "\"></div>\n            </div>\n            <span>").concat(this._strings.doNotAcceptAnyCallsBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"offline\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Offline, "\">\n            </div>\n            <span>").concat(this._strings.offlineBtn, "</span>\n          </a>\n        </div>\n      </div>\n      <div class=\"").concat(this._styles.frameContainer, "\">\n        <iframe class=\"").concat(this._styles.contentFrame, "\" sandbox=\"").concat(sanboxAttributeValue, "\" allow=\"").concat(allowAttributeValue, "\" >\n        </iframe>\n      </div>");
    }
  }, {
    key: "_beforeRender",
    value: function _beforeRender() {
      this._iconEl = this._root.querySelector(".".concat(this._styles.icon));

      this._iconEl.addEventListener('dragstart', function () {
        return false;
      });

      this._iconContainerEl = this._root.querySelector(".".concat(this._styles.iconContainer));
    }
  }, {
    key: "_renderMainClass",
    value: function _renderMainClass() {
      this._container.setAttribute('class', (0, _classnames.default)(this._styles.root, this._styles[this._defaultDirection], this._closed && this._styles.closed, this._minimized && this._styles.minimized, this._dragging && this._styles.dragging, this._hover && this._styles.hover, this._loading && this._styles.loading, this._showDockUI && this._styles.dock, this._showDockUI && this._minimized && (this._hoverHeader || this._dragging) && this._styles.expandable, this._showDockUI && !(this._userStatus || this._dndStatus) && this._styles.noPresence));

      this._headerEl.setAttribute('class', (0, _classnames.default)(this._styles.header, this._minimized && this._styles.minimized, this._ringing && this._styles.ringing, this._showDockUI && this._minimized && (this._hoverHeader || this._dragging) && this._styles.iconTrans));

      this._iconContainerEl.setAttribute('class', (0, _classnames.default)(this._styles.iconContainer, !(this._userStatus || this._dndStatus) && this._styles.noPresence, !this._showDockUI && this._styles.hidden));
    }
  }, {
    key: "renderPosition",
    value: function renderPosition() {
      var factor = this._calculateFactor();

      if (this._minimized) {
        if (this._showDockUI) {
          this._container.setAttribute('style', "transform: translate(0px, ".concat(this._minTranslateY, "px)!important; z-index: ").concat(this._zIndex, ";"));
        } else {
          this._container.setAttribute('style', "transform: translate( ".concat(this._minTranslateX * factor, "px, ").concat(-this._padding, "px)!important;"));
        }
      } else {
        this._container.setAttribute('style', "transform: translate(".concat(this._translateX * factor, "px, ").concat(this._translateY, "px)!important; z-index: ").concat(this._zIndex, ";"));
      }
    }
  }, {
    key: "_onHeaderClicked",
    value: function _onHeaderClicked() {
      if (!this._minimized) return;
      this.toggleMinimized();
    }
  }, {
    key: "_setAppUrl",
    value: function _setAppUrl(appUrl) {
      this._appUrl = appUrl;

      var _url$parse = _url.default.parse(appUrl, false),
          protocol = _url$parse.protocol,
          host = _url$parse.host;

      this._appOrigin = "".concat(protocol, "//").concat(host);

      if (appUrl) {
        this.contentFrameEl.src = appUrl;
        this.contentFrameEl.id = "".concat(this._prefix, "-adapter-frame");
      }
    }
  }, {
    key: "_setIconUrl",
    value: function _setIconUrl(iconUrl) {
      this._iconEl.src = iconUrl;
    }
  }, {
    key: "_postMessage",
    value: function _postMessage(data) {
      if (this._contentFrameEl.contentWindow) {
        this._contentFrameEl.contentWindow.postMessage(data, this._appOrigin);
      }
    }
  }, {
    key: "_requestWithPostMessage",
    value: function _requestWithPostMessage(path, body) {
      return (0, _requestWithPostMessage2.default)(path, body, 5000, this._contentFrameEl.contentWindow, 'rc-adapter-message');
    }
  }, {
    key: "setRinging",
    value: function setRinging(ringing) {
      this._ringing = !!ringing;

      this._renderMainClass();
    }
  }, {
    key: "gotoPresence",
    value: function gotoPresence() {
      this._postMessage({
        type: 'rc-adapter-goto-presence',
        version: this._version
      });
    }
  }, {
    key: "setEnvironment",
    value: function setEnvironment() {
      this._postMessage({
        type: 'rc-adapter-set-environment'
      });
    }
  }, {
    key: "clickToSMS",
    value: function clickToSMS(phoneNumber, text) {
      this.setMinimized(false);

      this._postMessage({
        type: 'rc-adapter-new-sms',
        phoneNumber: phoneNumber,
        text: text
      });
    }
  }, {
    key: "clickToCall",
    value: function clickToCall(phoneNumber) {
      var toCall = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      this.setMinimized(false);

      this._postMessage({
        type: 'rc-adapter-new-call',
        phoneNumber: phoneNumber,
        toCall: toCall
      });
    }
  }, {
    key: "controlCall",
    value: function controlCall(action, id) {
      this._postMessage({
        type: 'rc-adapter-control-call',
        callAction: action,
        callId: id
      });
    }
  }, {
    key: "logoutUser",
    value: function logoutUser() {
      this._postMessage({
        type: 'rc-adapter-logout'
      });
    }
  }, {
    key: "updateCallingSetting",
    value: function updateCallingSetting(_ref2) {
      var callWith = _ref2.callWith,
          myLocation = _ref2.myLocation,
          ringoutPrompt = _ref2.ringoutPrompt,
          fromNumber = _ref2.fromNumber;

      this._postMessage({
        type: 'rc-calling-settings-update',
        callWith: callWith,
        myLocation: myLocation,
        ringoutPrompt: ringoutPrompt,
        fromNumber: fromNumber
      });
    }
  }, {
    key: "navigateTo",
    value: function navigateTo(path) {
      this._postMessage({
        type: 'rc-adapter-navigate-to',
        path: path
      });
    }
  }, {
    key: "scheduleMeeting",
    value: function scheduleMeeting(meetingInfo) {
      return this._requestWithPostMessage('/schedule-meeting', meetingInfo);
    }
  }, {
    key: "_updateWidgetCurrentPath",
    value: function _updateWidgetCurrentPath(path) {
      this._widgetCurrentPath = path;

      this._updateCallBarStatus();
    }
  }, {
    key: "_updateWebphoneCalls",
    value: function _updateWebphoneCalls(webphoneCall) {
      var cleanCalls = this._webphoneCalls.filter(function (c) {
        return c.id !== webphoneCall.id;
      }); // When call is ended


      if (webphoneCall.endTime) {
        if (webphoneCall.id === this._currentWebhoneCallId && cleanCalls.length > 0) {
          var currentCall = cleanCalls.find(function (c) {
            return c.callStatus !== 'webphone-session-connecting';
          });
          this._currentStartTime = currentCall && currentCall.startTime || 0;
          this._currentWebhoneCallId = currentCall && currentCall.id;
        }

        if (cleanCalls.length === 0) {
          this._currentStartTime = 0;
          this._currentWebhoneCallId = null;
        }

        this._webphoneCalls = cleanCalls;
      } else {
        this._webphoneCalls = [webphoneCall].concat(cleanCalls);

        if (webphoneCall.callStatus === 'webphone-session-connected') {
          this._currentWebhoneCallId = webphoneCall.id;
          this._currentStartTime = webphoneCall.startTime;
        }
      }

      this._updateCallBarStatus();
    }
  }, {
    key: "_updateCallBarStatus",
    value: function _updateCallBarStatus() {
      var activeCalls = this._webphoneCalls.filter(function (c) {
        return c.callStatus !== 'webphone-session-connecting' || c.direction === 'Inbound';
      });

      this._hasActiveCalls = activeCalls.length > 0;

      var ringingCalls = this._webphoneCalls.filter(function (c) {
        return c.callStatus === 'webphone-session-connecting' && c.direction === 'Inbound';
      });

      this._ringingCallsLength = ringingCalls.length;

      var holdedCalls = this._webphoneCalls.filter(function (c) {
        return c.callStatus === 'webphone-session-onHold';
      });

      this._onHoldCallsLength = holdedCalls.length;
      this.renderCallsBar();
    }
  }, {
    key: "_renderRingingCalls",
    value: function _renderRingingCalls() {
      if (!this._ringingCallsLength || !this._strings) {
        return;
      }

      var ringCallsStrings = this._strings.ringCallsInfo || '';
      ringCallsStrings = ringCallsStrings.replace('0', String(this._ringingCallsLength));
      this._ringingCallsEl.innerHTML = ringCallsStrings;
      this._ringingCallsEl.title = ringCallsStrings;
    }
  }, {
    key: "_renderOnHoldCalls",
    value: function _renderOnHoldCalls() {
      if (!this._onHoldCallsLength || !this._strings) {
        return;
      }

      var onHoldCallsInfo = this._strings.onHoldCallsInfo || '';
      onHoldCallsInfo = onHoldCallsInfo.replace('0', String(this._onHoldCallsLength));
      this._onHoldCallsEl.innerHTML = onHoldCallsInfo;
      this._onHoldCallsEl.title = onHoldCallsInfo;
    }
  }, {
    key: "_renderCallsBar",
    value: function _renderCallsBar() {
      (0, _get2.default)((0, _getPrototypeOf2.default)(Adapter.prototype), "_renderCallsBar", this).call(this);

      if (this._minimized) {
        return;
      }

      this._currentCallEl.setAttribute('class', (0, _classnames.default)(this._styles.currentCallBtn, this.showCurrentCallBtn && this._styles.visible, !this.centerDuration && this.moveOutCurrentCallBtn && this._styles.moveOut, !this.centerDuration && this.moveInCurrentCallBtn && this._styles.moveIn));
    }
  }, {
    key: "showCurrentCallBtn",
    get: function get() {
      return this._widgetCurrentPath.indexOf('/calls/active') === -1 && this.showDuration;
    }
  }, {
    key: "showViewCallsBtn",
    get: function get() {
      return this._widgetCurrentPath !== '/calls' && (this.showOnHoldCalls || this.showRingingCalls);
    }
  }, {
    key: "centerDuration",
    get: function get() {
      return this._widgetCurrentPath.indexOf('/calls/active') > -1;
    }
  }, {
    key: "centerCallInfo",
    get: function get() {
      return this._widgetCurrentPath === '/calls';
    }
  }]);
  return Adapter;
}(_AdapterCore2.default);

var _default = Adapter;
exports.default = _default;

/***/ }),

/***/ 4095:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

__webpack_require__(1);

__webpack_require__(14);

__webpack_require__(78);

var _classnames = _interopRequireDefault(__webpack_require__(20));

var _Enum = __webpack_require__(25);

var _ensureExist = _interopRequireDefault(__webpack_require__(72));

var _debounce = _interopRequireDefault(__webpack_require__(166));

var _presenceStatus = __webpack_require__(357);

var _dndStatus = _interopRequireDefault(__webpack_require__(247));

var _formatDuration = _interopRequireDefault(__webpack_require__(262));

var _baseMessageTypes = _interopRequireDefault(__webpack_require__(382));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SANDBOX_ATTRIBUTE_VALUE = ['allow-same-origin', 'allow-scripts', 'allow-forms', 'allow-popups'].join(' '); // chrome 63 mandate the declaration of this attribute for getUserMedia to work in iframes

var ALLOW_ATTRIBUTE_VALUE = ['microphone' // 'camera',
].join(' ');
var ON_HOLD_CALLS = 0;
var RINGING_CALLS = 1;
var CURRENT_CALL = 2;
var ROTATE_LENGTH = 3;
var ROTATE_INTERVAL = 5000;

var AdapterCore =
/*#__PURE__*/
function () {
  function AdapterCore(_ref) {
    var _this = this;

    var prefix = _ref.prefix,
        styles = _ref.styles,
        container = _ref.container,
        _ref$root = _ref.root,
        root = _ref$root === void 0 ? container : _ref$root,
        _ref$messageTypes = _ref.messageTypes,
        messageTypes = _ref$messageTypes === void 0 ? _baseMessageTypes["default"] : _ref$messageTypes,
        _ref$defaultDirection = _ref.defaultDirection,
        defaultDirection = _ref$defaultDirection === void 0 ? 'left' : _ref$defaultDirection,
        _ref$defaultPadding = _ref.defaultPadding,
        defaultPadding = _ref$defaultPadding === void 0 ? 15 : _ref$defaultPadding;

    _classCallCheck(this, AdapterCore);

    this._onWindowResize = function () {
      if (_this._dragging) {
        return;
      }

      if (_this._resizeTimeout) {
        clearTimeout(_this._resizeTimeout);
      }

      _this._resizeTimeout = setTimeout(function () {
        return _this._renderRestrictedPosition();
      }, 100);

      if (!_this._resizeTick || Date.now() - _this._resizeTick > 50) {
        _this._resizeTick = Date.now();

        _this._renderRestrictedPosition();
      }
    };

    this._onWindowMouseMove = function (e) {
      if (_this._dragging) {
        if (e.buttons === 0) {
          _this._dragging = false;

          _this._renderMainClass();

          return;
        }

        var factor = _this._calculateFactor();

        var delta = {
          x: e.clientX - _this._dragStartPosition.x,
          y: e.clientY - _this._dragStartPosition.y
        };

        if (_this._minimized) {
          _this._minTranslateX = _this._dragStartPosition.minTranslateX + delta.x * factor;
          _this._minTranslateY = _this._dragStartPosition.minTranslateY + delta.y;
        } else {
          _this._translateX = _this._dragStartPosition.translateX + delta.x * factor;
          _this._translateY = _this._dragStartPosition.translateY + delta.y;
        }

        if (delta.x !== 0 || delta.y !== 0) _this._isClick = false;

        _this._syncPosition();

        _this._renderRestrictedPosition();
      }
    };

    this._debouncedPostMessage = (0, _debounce["default"])(this._postMessage, 100);
    this._prefix = prefix;
    this._messageTypes = (0, _Enum.prefixEnum)({
      enumMap: messageTypes,
      prefix: prefix
    });
    this._container = _ensureExist["default"].call(this, container, 'container');
    this._root = root;
    this._styles = styles;
    this._defaultDirection = defaultDirection;
    this._padding = defaultPadding;
    this._minTranslateX = 0;
    this._minTranslateY = 0;
    this._translateX = 0;
    this._translateY = 0;
    this._appWidth = 0;
    this._appHeight = 0;
    this._dragStartPosition = null;
    this._closed = true;
    this._minimized = true;
    this._dragging = false;
    this._hover = false;
    this._hoverHeader = false;
    this._loading = true;
    this._userStatus = null;
    this._dndStatus = null;
    this._telephonyStatus = null;
    this._presenceOption = null;
    this.currentState = -1;
    this._scrollale = false;
    this._strings = {};
  }

  _createClass(AdapterCore, [{
    key: "_onMessage",
    value: function _onMessage(msg) {
      if (msg) {
        switch (msg.type) {
          case this._messageTypes.syncClosed:
            this._onSyncClosed(msg.closed);

            break;

          case this._messageTypes.syncMinimized:
            this._onSyncMinimized(msg.minimized);

            break;

          case this._messageTypes.syncSize:
            this._onSyncSize(msg.size);

            break;

          case this._messageTypes.syncPresence:
            this._onPushPresence(msg);

            break;

          case this._messageTypes.pushAdapterState:
            this._onPushAdapterState(msg);

            break;

          case this._messageTypes.pushLocale:
            this._onPushLocale(msg);

            break;

          case this._messageTypes.pushRingState:
            this._onPushRingState(msg);

            break;

          case this._messageTypes.pushCalls:
            this._onPushCallsInfo(msg);

            break;

          case this._messageTypes.pushOnCurrentCallPath:
            this._onPushOnCurrentCallPath(msg);

            break;

          case this._messageTypes.pushOnAllCallsPath:
            this._onPushOnAllCallsPath(msg);

            break;

          default:
            break;
        }
      }
    }
  }, {
    key: "_getContentDOM",
    value: function _getContentDOM(sanboxAttributeValue, allowAttributeValue) {
      return "\n      <header class=\"".concat(this._styles.header, "\" draggable=\"false\">\n        <div class=\"").concat(this._styles.presence, " ").concat(this._styles.NoPresence, "\">\n          <div class=\"").concat(this._styles.presenceBar, "\">\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.toggle, "\">\n          <div class=\"").concat(this._styles.minimizeIcon, "\">\n            <div class=\"").concat(this._styles.minimizeIconBar, "\"></div>\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.close, "\">\n          <div class=\"").concat(this._styles.closeIcon, "\">\n            <div></div><div></div>\n          </div>\n        </div>\n        <img class=\"").concat(this._styles.logo, "\" draggable=\"false\"></img>\n        <div class=\"").concat(this._styles.duration, "\"></div>\n        <div class=\"").concat(this._styles.ringingCalls, "\"></div>\n        <div class=\"").concat(this._styles.onHoldCalls, "\"></div>\n        <div class=\"").concat(this._styles.currentCallBtn, "\">").concat(this._strings.currentCallBtn, "</div>\n        <div class=\"").concat(this._styles.viewCallsBtn, "\">").concat(this._strings.viewCallsBtn, "</div>\n      </header>\n      <div class=\"").concat(this._styles.dropdownPresence, "\">\n        <div class=\"").concat(this._styles.line, "\">\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"available\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Available, "\">\n            </div>\n            <span>").concat(this._strings.availableBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"busy\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Busy, "\">\n            </div>\n            <span>").concat(this._strings.busyBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"doNotAcceptAnyCalls\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.DoNotAcceptAnyCalls, "\">\n              <div class=\"").concat(this._styles.presenceBar, "\"></div>\n            </div>\n            <span>").concat(this._strings.doNotAcceptAnyCallsBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"offline\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Offline, "\">\n            </div>\n            <span>").concat(this._strings.offlineBtn, "</span>\n          </a>\n        </div>\n      </div>\n      <div class=\"").concat(this._styles.frameContainer, "\">\n        <iframe class=\"").concat(this._styles.contentFrame, "\" sandbox=\"").concat(sanboxAttributeValue, "\" allow=\"").concat(allowAttributeValue, "\" >\n        </iframe>\n      </div>");
    }
  }, {
    key: "_generateContentDOM",
    value: function _generateContentDOM() {
      var _this2 = this;

      this._root.innerHTML = this._getContentDOM(SANDBOX_ATTRIBUTE_VALUE, ALLOW_ATTRIBUTE_VALUE);
      this._headerEl = this._root.querySelector(".".concat(this._styles.header));
      this._logoEl = this._root.querySelector(".".concat(this._styles.logo));

      this._logoEl.addEventListener('dragstart', function () {
        return false;
      });

      this._contentFrameContainerEl = this._root.querySelector(".".concat(this._styles.frameContainer)); // toggle button

      this._toggleEl = this._root.querySelector(".".concat(this._styles.toggle));

      this._toggleEl.addEventListener('click', function (evt) {
        evt.stopPropagation();

        _this2.toggleMinimized();
      }); // close button


      this._closeEl = this._root.querySelector(".".concat(this._styles.close));

      if (this._closeEl) {
        this._closeEl.addEventListener('click', function () {
          _this2.setClosed(true);
        });
      }

      this._presenceEl = this._root.querySelector(".".concat(this._styles.presence));

      this._presenceEl.addEventListener('click', function (evt) {
        evt.stopPropagation();

        _this2.togglePresenceDropdown();
      });

      this._presenceItemEls = this._root.querySelectorAll(".".concat(this._styles.presenceItem));

      this._presenceItemEls.forEach(function (itemEl) {
        var dataPresence = itemEl.getAttribute('data-presence');
        itemEl.addEventListener('click', function (evt) {
          evt.stopPropagation();

          _this2.togglePresenceDropdown();

          _this2._postMessage({
            type: _this2._messageTypes.presenceItemClicked,
            presenceType: _presenceStatus.presenceStatus[dataPresence] || _dndStatus["default"][dataPresence]
          });
        });
      });

      if (this._dropdownPresence) {
        this._dropdownPresence.addEventListener('click', function (evt) {
          evt.stopPropagation();

          _this2.togglePresenceDropdown();
        });
      }

      this._contentFrameEl = this._root.querySelector(".".concat(this._styles.contentFrame));
      this._durationEl = this._root.querySelector(".".concat(this._styles.duration));

      this._durationEl.addEventListener('click', function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToCurrentCall
        });
      });

      this._currentCallEl = this._root.querySelector(".".concat(this._styles.currentCallBtn));

      this._currentCallEl.addEventListener('click', function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToCurrentCall
        });
      });

      this._viewCallsEl = this._root.querySelector(".".concat(this._styles.viewCallsBtn));

      this._viewCallsEl.addEventListener('click', function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToViewCalls
        });
      });

      this._ringingCallsEl = this._root.querySelector(".".concat(this._styles.ringingCalls));
      this._onHoldCallsEl = this._root.querySelector(".".concat(this._styles.onHoldCalls));

      this._headerEl.addEventListener('mousedown', function (e) {
        _this2._dragging = true;
        _this2._isClick = true;
        _this2._dragStartPosition = {
          x: e.clientX,
          y: e.clientY,
          translateX: _this2._translateX,
          translateY: _this2._translateY,
          minTranslateX: _this2._minTranslateX,
          minTranslateY: _this2._minTranslateY
        };

        _this2._renderMainClass();
      });

      this._headerEl.addEventListener('mouseup', function () {
        _this2._dragging = false;

        _this2._renderMainClass();
      });

      window.addEventListener('mousemove', this._onWindowMouseMove);

      this._headerEl.addEventListener('mouseenter', function () {
        if (!_this2._minimized) {
          if (_this2._currentStartTime > 0) {
            _this2._hoverBar = true;
            _this2._scrollable = false;

            _this2._renderCallsBar();
          }

          return;
        }

        _this2._hoverHeader = true;

        _this2._renderMainClass();
      });

      this._headerEl.addEventListener('mouseleave', function () {
        _this2._hoverHeader = false;
        _this2._hoverBar = false;
        _this2._scrollable = false;

        _this2._renderCallsBar();

        _this2._renderMainClass();
      });

      this._isClick = true;

      this._headerEl.addEventListener('click', function (evt) {
        if (!_this2._isClick) return;

        _this2._onHeaderClicked(evt);
      });

      this._resizeTimeout = null;
      this._resizeTick = null;
      window.addEventListener('resize', this._onWindowResize); // hover detection for ie

      this._container.addEventListener('mouseenter', function () {
        _this2._hover = true;

        _this2._renderMainClass();
      });

      this._container.addEventListener('mouseleave', function () {
        _this2._hover = false;

        _this2._renderMainClass();
      });

      if (document.readyState === 'loading') {
        window.addEventListener('load', function () {
          document.body.appendChild(_this2._container);
        });
      } else {
        document.body.appendChild(this._container);
      }

      if (typeof this._beforeRender === 'function') {
        this._beforeRender();
      }

      this._render();
    }
  }, {
    key: "togglePresenceDropdown",
    value: function togglePresenceDropdown() {
      if (this.dropdownPresence) {
        this.dropdownPresence.classList.toggle("".concat(this._styles.showDropdown));
        this.setMinimized(false);
      }
    }
  }, {
    key: "_postMessage",
    value: function _postMessage(data) {
      this.messageTransport.postMessage(data);
    }
  }, {
    key: "_setLogoUrl",
    value: function _setLogoUrl(logoUrl) {
      this._logoUrl = logoUrl;
      this._logoEl.src = logoUrl;

      this._logoEl.setAttribute('class', (0, _classnames["default"])(this._styles.logo, this._logoUrl && this._logoUrl !== '' && this._styles.visible));
    }
  }, {
    key: "_setAppUrl",
    value: function _setAppUrl(appUrl) {
      this._appUrl = appUrl;

      if (appUrl) {
        this.contentFrameEl.src = appUrl;
      }
    }
  }, {
    key: "_onSyncMinimized",
    value: function _onSyncMinimized(minimized) {
      this._minimized = !!minimized;

      this._renderMainClass();

      this.renderAdapterSize();

      this._renderRestrictedPosition();
    }
  }, {
    key: "setMinimized",
    value: function setMinimized(minimized) {
      this._onSyncMinimized(minimized);

      this._postMessage({
        type: this._messageTypes.syncMinimized,
        minimized: this._minimized
      });

      if (minimized && this.dropdownPresence) {
        this.dropdownPresence.classList.remove("".concat(this._styles.showDropdown));
      }
    }
  }, {
    key: "toggleMinimized",
    value: function toggleMinimized() {
      this.setMinimized(!this._minimized);
    }
  }, {
    key: "_calculateMinMaxPosition",
    value: function _calculateMinMaxPosition() {
      var maximumX = window.innerWidth - (this._minimized ? this._headerEl.clientWidth : this._appWidth) - 2 * this._padding;
      var maximumY = window.innerHeight - (this._minimized ? this._headerEl.clientHeight : this._headerEl.clientHeight + this._appHeight) - this._padding;
      return {
        minimumX: this._padding,
        minimumY: this._padding,
        maximumX: maximumX,
        maximumY: maximumY
      };
    }
  }, {
    key: "_onSyncClosed",
    value: function _onSyncClosed(closed) {
      this._closed = !!closed;

      this._renderMainClass();
    }
  }, {
    key: "setClosed",
    value: function setClosed(closed) {
      this._onSyncClosed(closed);

      this._postMessage({
        type: this._messageTypes.syncClosed,
        closed: this.closed
      });
    }
  }, {
    key: "toggleClosed",
    value: function toggleClosed() {
      this.setClosed(!this.closed);
    }
  }, {
    key: "_onSyncSize",
    value: function _onSyncSize(_ref2) {
      var width = _ref2.width,
          height = _ref2.height;
      this._appWidth = width;
      this._appHeight = height;
      this._contentFrameEl.style.width = "".concat(width, "px");
      this._contentFrameEl.style.height = "".concat(height, "px");
      this.renderAdapterSize();
    }
  }, {
    key: "setSize",
    value: function setSize(size) {
      this._onSyncSize(size);

      this._postMessage({
        type: this._messageTypes.syncSize,
        size: size
      });
    }
  }, {
    key: "_onPushRingState",
    value: function _onPushRingState(_ref3) {
      var ringing = _ref3.ringing;
      this._ringing = ringing;

      this._render();
    }
  }, {
    key: "_onPushCallsInfo",
    value: function _onPushCallsInfo(_ref4) {
      var ringingCallsLength = _ref4.ringingCallsLength,
          onHoldCallsLength = _ref4.onHoldCallsLength,
          currentStartTime = _ref4.currentStartTime;
      this._currentStartTime = currentStartTime;
      this._ringingCallsLength = ringingCallsLength;
      this._onHoldCallsLength = onHoldCallsLength;
      this._hasActiveCalls = this._currentStartTime > 0 || this._ringingCallsLength > 0 || this._onHoldCallsLength > 0;
      this.renderCallsBar();
    }
  }, {
    key: "_onPushOnCurrentCallPath",
    value: function _onPushOnCurrentCallPath(_ref5) {
      var onCurrentCallPath = _ref5.onCurrentCallPath;
      this._onCurrentCallPath = onCurrentCallPath;

      this._render();
    }
  }, {
    key: "_onPushOnAllCallsPath",
    value: function _onPushOnAllCallsPath(_ref6) {
      var onAllCallsPath = _ref6.onAllCallsPath;
      this._onAllCallsPath = onAllCallsPath;

      this._render();
    }
  }, {
    key: "_onPushPresence",
    value: function _onPushPresence(_ref7) {
      var dndStatus = _ref7.dndStatus,
          userStatus = _ref7.userStatus,
          telephonyStatus = _ref7.telephonyStatus,
          presenceOption = _ref7.presenceOption;

      if (dndStatus !== this._dndStatus || userStatus !== this._userStatus || telephonyStatus !== this._telephonyStatus) {
        this._dndStatus = dndStatus;
        this._userStatus = userStatus;
        this._telephonyStatus = telephonyStatus;
        this._presenceOption = presenceOption;
        this.renderPresence();
      }
    }
  }, {
    key: "_onPushLocale",
    value: function _onPushLocale(_ref8) {
      var locale = _ref8.locale,
          _ref8$strings = _ref8.strings,
          strings = _ref8$strings === void 0 ? {} : _ref8$strings;
      this._locale = locale;
      this._strings = strings;

      this._renderString();
    }
  }, {
    key: "_renderString",
    value: function _renderString() {
      this._renderCallBarBtn();

      this._renderRingingCalls();

      this._renderOnHoldCalls();

      this._renderPresenceItem();
    }
  }, {
    key: "_syncPosition",
    value: function _syncPosition() {
      this._debouncedPostMessage.call(this, {
        type: this._messageTypes.syncPosition,
        position: {
          translateX: this._translateX,
          translateY: this._translateY,
          minTranslateX: this._minTranslateX,
          minTranslateY: this._minTranslateY
        }
      });
    }
  }, {
    key: "_onPushAdapterState",
    value: function _onPushAdapterState(_ref9) {
      var _ref9$size = _ref9.size,
          width = _ref9$size.width,
          height = _ref9$size.height,
          minimized = _ref9.minimized,
          closed = _ref9.closed,
          _ref9$position = _ref9.position,
          translateX = _ref9$position.translateX,
          translateY = _ref9$position.translateY,
          minTranslateX = _ref9$position.minTranslateX,
          minTranslateY = _ref9$position.minTranslateY,
          dndStatus = _ref9.dndStatus,
          userStatus = _ref9.userStatus,
          telephonyStatus = _ref9.telephonyStatus;
      this._minimized = minimized;
      this._closed = closed;

      if (!this._dragging) {
        this._translateX = translateX;
        this._translateY = translateY;
        this._minTranslateX = minTranslateX;
        this._minTranslateY = minTranslateY;
      }

      this._appWidth = width;
      this._appHeight = height;
      this._dndStatus = dndStatus;
      this._userStatus = userStatus;
      this._telephonyStatus = telephonyStatus;
      this._loading = false;

      this._render();
    }
  }, {
    key: "_calculateFactor",
    value: function _calculateFactor() {
      return this._defaultDirection === 'right' ? -1 : 1;
    }
  }, {
    key: "renderPosition",
    value: function renderPosition() {
      var factor = this._calculateFactor();

      if (this._minimized) {
        this._container.setAttribute('style', "transform: translate( ".concat(this._minTranslateX * factor, "px, ").concat(-this._padding, "px)!important;"));
      } else {
        this._container.setAttribute('style', "transform: translate( ".concat(this._translateX * factor, "px, ").concat(this._translateY, "px)!important;"));
      }
    }
  }, {
    key: "_renderRestrictedPosition",
    value: function _renderRestrictedPosition() {
      var _this$_calculateMinMa = this._calculateMinMaxPosition(),
          minimumX = _this$_calculateMinMa.minimumX,
          minimumY = _this$_calculateMinMa.minimumY,
          maximumX = _this$_calculateMinMa.maximumX,
          maximumY = _this$_calculateMinMa.maximumY;

      if (this._minimized) {
        var newMinTranslateX = Math.max(Math.min(this._minTranslateX, maximumX), minimumX);

        if (newMinTranslateX !== this._minTranslateX) {
          this._minTranslateX = newMinTranslateX;
        }

        var newMinTranslateY = Math.max(Math.min(this._minTranslateY, -minimumY), -maximumY);

        if (newMinTranslateY !== this._minTranslateY) {
          this._minTranslateY = newMinTranslateY;
        }
      } else {
        var newTranslateX = Math.max(Math.min(this._translateX, maximumX), minimumX);
        var newTranslateY = Math.max(Math.min(this._translateY, -minimumY), -maximumY);

        if (this._translateX !== newTranslateX || this._translateY !== newTranslateY) {
          this._translateX = newTranslateX;
          this._translateY = newTranslateY;
        }
      }

      this.renderPosition();
    }
  }, {
    key: "renderAdapterSize",
    value: function renderAdapterSize() {
      if (this._minimized) {
        this._contentFrameContainerEl.style.width = 0;
        this._contentFrameContainerEl.style.height = 0;
      } else {
        this._contentFrameContainerEl.style.width = "".concat(this._appWidth, "px");
        this._contentFrameContainerEl.style.height = "".concat(this._appHeight, "px");
        this._contentFrameEl.style.width = "".concat(this._appWidth, "px");
        this._contentFrameEl.style.height = "".concat(this._appHeight, "px");
      }
    }
  }, {
    key: "_renderMainClass",
    value: function _renderMainClass() {
      this._container.setAttribute('class', (0, _classnames["default"])(this._styles.root, this._styles[this._defaultDirection], this._closed && this._styles.closed, this._minimized && this._styles.minimized, this._dragging && this._styles.dragging, this._hover && this._styles.hover, this._loading && this._styles.loading));

      this._headerEl.setAttribute('class', (0, _classnames["default"])(this._styles.header, this._minimized && this._styles.minimized, this._ringing && this._styles.ringing));
    }
  }, {
    key: "renderPresence",
    value: function renderPresence() {
      var _this3 = this;

      this._presenceEl.setAttribute('class', (0, _classnames["default"])(this._minimized && this._styles.minimized, this._styles.presence, this._userStatus && this._styles[this._userStatus], this._dndStatus && this._styles[this._dndStatus]));

      this._presenceItemEls.forEach(function (presenceItem) {
        var dataPresence = presenceItem.getAttribute('data-presence');

        if (_presenceStatus.presenceStatus[dataPresence] === _this3._presenceOption || _dndStatus["default"][dataPresence] === _this3._presenceOption) {
          presenceItem.setAttribute('class', (0, _classnames["default"])(_this3._styles.presenceItem, _this3._styles.selected));
        } else {
          presenceItem.setAttribute('class', (0, _classnames["default"])(_this3._styles.presenceItem));
        }
      });
    }
  }, {
    key: "calculateState",
    value: function calculateState() {
      var startTime = this._currentStartTime;
      return Math.round((new Date().getTime() - startTime) / 1000);
    }
  }, {
    key: "renderCallsBar",
    value: function renderCallsBar() {
      var _this$callInfoMap,
          _this4 = this;

      // should clean up rotate duration when call info changed
      if (this.rotateInterval) {
        clearInterval(this.rotateInterval);
        this.rotateInterval = null;
      } // when there is no call


      if (!this._hasActiveCalls) {
        this.currentState = -1;
        this._scrollable = false;
        this._hoverBar = false;

        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = null;
        }

        this._renderCallsBar();

        return;
      } // when there is only one active call, only need to display call duration


      if (this._currentStartTime > 0 && this._ringingCallsLength === 0 && this._onHoldCallsLength === 0) {
        this.currentState = CURRENT_CALL;
        this._scrollable = false;

        this._renderCallDuration();

        this._renderCallsBar();

        return;
      } // when there are only ringing calls(no onhold or active calls)
      // only need to display incoming call inco


      if (this._currentStartTime === 0 && this._ringingCallsLength > 0) {
        this.currentState = RINGING_CALLS;
        this._scrollable = false;
        this._hoverBar = false;

        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = null;
        }

        this._renderRingingCalls();

        this._renderCallsBar();

        return;
      }

      this.callInfoMap = (_this$callInfoMap = {}, _defineProperty(_this$callInfoMap, CURRENT_CALL, this._currentStartTime > 0), _defineProperty(_this$callInfoMap, RINGING_CALLS, this._ringingCallsLength > 0), _defineProperty(_this$callInfoMap, ON_HOLD_CALLS, this._onHoldCallsLength > 0), _this$callInfoMap); // when multiple calls, should scroll with call info

      this.rotateCallInfo();
      this.rotateInterval = setInterval(function () {
        _this4.rotateCallInfo();
      }, ROTATE_INTERVAL);
    }
  }, {
    key: "rotateCallInfo",
    value: function rotateCallInfo() {
      if (this._hoverBar && this.callInfoMap[this.currentState]) {
        return;
      }

      this.lastState = this.currentState;
      this.currentState = this.increment(this.currentState);

      while (!this.callInfoMap[this.currentState]) {
        this.currentState = this.increment(this.currentState);
      }

      switch (this.currentState) {
        case ON_HOLD_CALLS:
          this._renderOnHoldCalls();

          break;

        case RINGING_CALLS:
          this._renderRingingCalls();

          break;

        case CURRENT_CALL:
          this._renderCallDuration();

          break;

        default:
          break;
      }

      this._scrollable = true;

      this._renderCallsBar();

      this._scrollable = false;
    }
  }, {
    key: "increment",
    value: function increment(state) {
      var newState = state + 1;

      if (state >= ROTATE_LENGTH - 1) {
        return 0;
      }

      return newState;
    }
  }, {
    key: "_renderMinimizedBar",
    value: function _renderMinimizedBar() {
      this._logoEl.setAttribute('class', (0, _classnames["default"])(this._styles.logo, this._logoUrl && this._logoUrl !== '' && this._styles.visible));

      this._durationEl.setAttribute('class', (0, _classnames["default"])(this._styles.duration));

      this._ringingCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.ringingCalls));

      this._onHoldCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.onHoldCalls));

      this._currentCallEl.setAttribute('class', (0, _classnames["default"])(this._styles.currentCallBtn));

      this._viewCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.viewCallsBtn));
    }
  }, {
    key: "_renderCallsBar",
    value: function _renderCallsBar() {
      if (this._minimized) {
        this._renderMinimizedBar();

        return;
      }

      this._logoEl.setAttribute('class', (0, _classnames["default"])(this._styles.logo, !this._hasActiveCalls && this._logoUrl && this._logoUrl !== '' && this._styles.visible));

      this._durationEl.setAttribute('class', (0, _classnames["default"])(this._styles.duration, this.showDuration && this._styles.visible, this.centerDuration && this._styles.center, this.moveOutDuration && this._styles.moveOut, this.moveInDuration && this._styles.moveIn));

      this._ringingCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.ringingCalls, this.showRingingCalls && this._styles.visible, this.centerCallInfo && this._styles.center, this.moveOutRingingInfo && this._styles.moveOut, this.moveInRingingInfo && this._styles.moveIn));

      this._onHoldCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.onHoldCalls, this.showOnHoldCalls && this._styles.visible, this.centerCallInfo && this._styles.center, this.moveOutOnHoldInfo && this._styles.moveOut, this.moveInOnHoldInfo && this._styles.moveIn));

      this._currentCallEl.setAttribute('class', (0, _classnames["default"])(this._styles.currentCallBtn, this.showCurrentCallBtn && this._styles.visible, this.moveOutCurrentCallBtn && this._styles.moveOut, this.moveInCurrentCallBtn && this._styles.moveIn));

      this._viewCallsEl.setAttribute('class', (0, _classnames["default"])(this._styles.viewCallsBtn, this.showViewCallsBtn && this._styles.visible, !this.moveInViewCallsBtn && this.moveOutViewCallsBtn && this._styles.moveOut, this.moveInViewCallsBtn && this._styles.moveIn));
    }
  }, {
    key: "_renderCallDuration",
    value: function _renderCallDuration() {
      var _this5 = this;

      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      var duration = (0, _formatDuration["default"])(this.calculateState());
      this._durationEl.innerHTML = duration;
      this.durationInterval = setInterval(function () {
        var duration = (0, _formatDuration["default"])(_this5.calculateState());
        _this5._durationEl.innerHTML = duration;
      }, 1000);
    }
  }, {
    key: "_renderRingingCalls",
    value: function _renderRingingCalls() {
      if (!this._ringingCallsLength || !this._strings) {
        return;
      }

      this._ringingCallsEl.innerHTML = this._strings.ringCallsInfo;
      this._ringingCallsEl.title = this._strings.ringCallsInfo;
    }
  }, {
    key: "_renderOnHoldCalls",
    value: function _renderOnHoldCalls() {
      if (!this._onHoldCallsLength || !this._strings) {
        return;
      }

      this._onHoldCallsEl.innerHTML = this._strings.onHoldCallsInfo;
      this._onHoldCallsEl.title = this._strings.onHoldCallsInfo;
    }
  }, {
    key: "_renderCallBarBtn",
    value: function _renderCallBarBtn() {
      if (!this._strings) {
        return;
      }

      this._currentCallEl.innerHTML = this._strings.currentCallBtn;
      this._viewCallsEl.innerHTML = this._strings.viewCallsBtn;
    }
  }, {
    key: "_renderPresenceItem",
    value: function _renderPresenceItem() {
      var _this6 = this;

      if (!this._strings) {
        return;
      }

      this._presenceItemEls.forEach(function (presenceItem) {
        var dataPresence = presenceItem.getAttribute('data-presence');
        presenceItem.querySelector('span').innerHTML = _this6._strings["".concat(dataPresence, "Btn")];
      });
    }
  }, {
    key: "_render",
    value: function _render() {
      this.renderPresence();
      this.renderAdapterSize();

      this._renderRestrictedPosition();

      this._renderMainClass();

      this._renderCallsBar();
    }
  }, {
    key: "dispose",
    value: function dispose() {
      // TODO clean up
      window.removeEventListener('mousemove', this._onWindowMouseMove);
      window.removeEventListener('resize', this._onWindowResize);

      if (this._resizeTimeout) {
        clearTimeout(this._resizeTick);
      }

      this._container.remove();
    }
  }, {
    key: "messageTransport",
    get: function get() {
      return this._messageTransport;
    }
  }, {
    key: "container",
    get: function get() {
      return this._container;
    }
  }, {
    key: "root",
    get: function get() {
      return this._root;
    }
  }, {
    key: "headerEl",
    get: function get() {
      return this._headerEl;
    }
  }, {
    key: "contentFrameContainerEl",
    get: function get() {
      return this._contentFrameContainerEl;
    }
  }, {
    key: "toggleEl",
    get: function get() {
      return this._toggleEl;
    }
  }, {
    key: "closeEl",
    get: function get() {
      return this._closeEl;
    }
  }, {
    key: "presenceEl",
    get: function get() {
      return this._presenceEl;
    }
  }, {
    key: "contentFrameEl",
    get: function get() {
      return this._contentFrameEl;
    }
  }, {
    key: "minTranslateX",
    get: function get() {
      return this._minTranslateX;
    }
  }, {
    key: "minTranslateY",
    get: function get() {
      return this._minTranslateY;
    }
  }, {
    key: "translateX",
    get: function get() {
      return this._translateX;
    }
  }, {
    key: "translateY",
    get: function get() {
      return this._translateY;
    }
  }, {
    key: "appWidth",
    get: function get() {
      return this._appWidth;
    }
  }, {
    key: "appHeight",
    get: function get() {
      return this._appHeight;
    }
  }, {
    key: "dragStartPosition",
    get: function get() {
      return this._dragStartPosition;
    }
  }, {
    key: "closed",
    get: function get() {
      return this._closed;
    }
  }, {
    key: "minimized",
    get: function get() {
      return this._minimized;
    }
  }, {
    key: "dragging",
    get: function get() {
      return this._dragging;
    }
  }, {
    key: "hover",
    get: function get() {
      return this._hover;
    }
  }, {
    key: "loading",
    get: function get() {
      return this._loading;
    }
  }, {
    key: "userStatus",
    get: function get() {
      return this._userStatus;
    }
  }, {
    key: "dndStatus",
    get: function get() {
      return this._dndStatus;
    }
  }, {
    key: "ringing",
    get: function get() {
      return this._ringing;
    }
  }, {
    key: "showDuration",
    get: function get() {
      return !this._scrollable && this.currentState === CURRENT_CALL;
    }
  }, {
    key: "showRingingCalls",
    get: function get() {
      return !this._scrollable && this.currentState === RINGING_CALLS;
    }
  }, {
    key: "showOnHoldCalls",
    get: function get() {
      return !this._scrollable && this.currentState === ON_HOLD_CALLS;
    }
  }, {
    key: "showCurrentCallBtn",
    get: function get() {
      return !this._onCurrentCallPath && this.showDuration;
    }
  }, {
    key: "showViewCallsBtn",
    get: function get() {
      return !this._onAllCallsPath && (this.showOnHoldCalls || this.showRingingCalls);
    }
  }, {
    key: "centerDuration",
    get: function get() {
      return this._onCurrentCallPath;
    }
  }, {
    key: "centerCallInfo",
    get: function get() {
      return this._onAllCallsPath;
    }
  }, {
    key: "moveInDuration",
    get: function get() {
      return !this._hoverBar && this.currentState === CURRENT_CALL && this._scrollable;
    }
  }, {
    key: "moveOutDuration",
    get: function get() {
      return !this._hoverBar && this._scrollable && this.lastState === CURRENT_CALL;
    }
  }, {
    key: "moveInRingingInfo",
    get: function get() {
      return !this._hoverBar && this.currentState === RINGING_CALLS && this._scrollable;
    }
  }, {
    key: "moveOutRingingInfo",
    get: function get() {
      return !this._hoverBar && this._scrollable && this.lastState === RINGING_CALLS;
    }
  }, {
    key: "moveInOnHoldInfo",
    get: function get() {
      return !this._hoverBar && this.currentState === ON_HOLD_CALLS && this._scrollable;
    }
  }, {
    key: "moveOutOnHoldInfo",
    get: function get() {
      return !this._hoverBar && this._scrollable && this.lastState === ON_HOLD_CALLS;
    }
  }, {
    key: "moveInCurrentCallBtn",
    get: function get() {
      return !this._onCurrentCallPath && this.moveInDuration;
    }
  }, {
    key: "moveOutCurrentCallBtn",
    get: function get() {
      return !this._onCurrentCallPath && this.moveOutDuration;
    }
  }, {
    key: "moveInViewCallsBtn",
    get: function get() {
      return !this._onAllCallsPath && (this.moveInRingingInfo || this.moveInOnHoldInfo);
    }
  }, {
    key: "moveOutViewCallsBtn",
    get: function get() {
      return !this._onAllCallsPath && (this.moveOutRingingInfo || this.moveOutOnHoldInfo);
    }
  }, {
    key: "dropdownPresence",
    get: function get() {
      return this._root.querySelector(".".concat(this._styles.dropdownPresence));
    }
  }]);

  return AdapterCore;
}();

exports["default"] = AdapterCore;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 4096:
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(4097);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(19)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ 4097:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(18)(false);
// Module
exports.push([module.i, ".Adapter_centerStyle, .Adapter_logo, .Adapter_presence, .Adapter_button {\n  top: 50%;\n  position: absolute;\n}\n\n.Adapter_root {\n  -webkit-user-select: none;\n     -moz-user-select: none;\n      -ms-user-select: none;\n          user-select: none;\n  user-drag: none;\n  box-sizing: border-box;\n  padding: 0;\n  border-radius: 3px;\n  position: fixed;\n  display: block;\n  visibility: visible;\n  bottom: 0;\n  background-color: #f3f3f3;\n  -webkit-transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, -webkit-transform 0.1s 0s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, -webkit-transform 0.1s 0s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, transform 0.1s 0s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, transform 0.1s 0s ease-in-out, -webkit-transform 0.1s 0s ease-in-out;\n  z-index: 99999;\n  box-shadow: 0px 0px 5px 1px rgba(0, 0, 0, 0.18);\n  overflow: hidden;\n}\n\n.Adapter_root.Adapter_left {\n  left: 0;\n}\n\n.Adapter_root.Adapter_right {\n  right: 0;\n}\n\n.Adapter_root.Adapter_left {\n  left: 0;\n}\n\n.Adapter_root.Adapter_right {\n  right: 0;\n}\n\n.Adapter_root.Adapter_left {\n  left: 0;\n}\n\n.Adapter_root.Adapter_right {\n  right: 0;\n}\n\n.Adapter_root.Adapter_dragging {\n  -webkit-transition: opacity 0.1s 0s linear;\n  transition: opacity 0.1s 0s linear;\n}\n\n.Adapter_root.Adapter_closed {\n  visibility: hidden;\n  opacity: 0;\n}\n\n.Adapter_root.Adapter_loading {\n  display: none;\n}\n\n.Adapter_header {\n  -webkit-user-select: none;\n     -moz-user-select: none;\n      -ms-user-select: none;\n          user-select: none;\n  user-drag: none;\n  position: relative;\n  height: 35px;\n  line-height: 35px;\n  min-width: 165px;\n  text-align: center;\n  cursor: move;\n  z-index: 11;\n  overflow: hidden;\n  font-family: Helvetica;\n  font-weight: normal;\n}\n\n.Adapter_minimized.Adapter_header {\n  cursor: ew-resize;\n}\n\n.Adapter_logo {\n  -webkit-user-select: none;\n     -moz-user-select: none;\n      -ms-user-select: none;\n          user-select: none;\n  user-drag: none;\n  left: 50%;\n  height: 16px;\n  width: 100px;\n  margin-top: -8px;\n  margin-left: -50px;\n  display: none;\n}\n\n.Adapter_logo.Adapter_visible {\n  display: inline-block;\n}\n\n.Adapter_presence {\n  left: 20px;\n  height: 14px;\n  width: 14px;\n  border-radius: 8px;\n  margin-top: -7px;\n  display: none;\n  cursor: pointer;\n}\n\n.Adapter_dropdownPresence {\n  display: none;\n  position: absolute;\n  width: 100%;\n  height: 100vh;\n}\n\n.Adapter_showDropdown {\n  display: block;\n}\n\n.Adapter_presenceItem {\n  padding: 10px 15px;\n  display: block;\n  cursor: pointer;\n  text-decoration: none;\n  text-align: left;\n}\n\n.Adapter_presenceItem:hover {\n  background-color: #f5f5f5;\n}\n\n.Adapter_selected {\n  color: #0684bd;\n}\n\n.Adapter_line {\n  position: relative;\n  width: 160px;\n  min-width: 165px;\n  left: 5px;\n  padding: 0;\n  min-height: 30px;\n  box-sizing: border-box;\n  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffffff;\n  border-style: solid;\n  border-width: 0;\n  border-top-width: 1px;\n  border-bottom-width: 0px;\n  border-color: #eeeeee;\n  border-radius: 4px;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-size: 14px;\n  color: #2F2F2F;\n}\n\n.Adapter_line .Adapter_horizontal {\n  display: -webkit-inline-box;\n  display: inline-flex;\n}\n\n.Adapter_line .Adapter_clickable {\n  cursor: pointer;\n}\n\n.Adapter_line .Adapter_noborder {\n  border: none;\n}\n\n.Adapter_minimized .Adapter_presence {\n  left: 10px;\n}\n\n.Adapter_Offline {\n  display: block;\n  background: #cdcdcd;\n}\n\n.Adapter_Busy {\n  display: block;\n  background: #f95b5c;\n}\n\n.Adapter_Available {\n  display: block;\n  background-color: #32ae31;\n}\n\n.Adapter_presenceBar {\n  display: none;\n  position: absolute;\n  width: 8px;\n  height: 2px;\n  border-radius: 1.5px;\n  background-color: #ffffff;\n  -webkit-transform-origin: 50% 50%;\n          transform-origin: 50% 50%;\n  -webkit-transform: translate(3px, 6px);\n          transform: translate(3px, 6px);\n}\n\n.Adapter_DoNotAcceptAnyCalls {\n  display: block;\n  background: #f95b5c;\n}\n\n.Adapter_DoNotAcceptAnyCalls .Adapter_presenceBar {\n  display: block;\n}\n\n.Adapter_statusIcon {\n  display: inline-block;\n  position: relative;\n  margin-right: 5px;\n  top: 2px;\n  left: 0;\n  margin-top: 0;\n}\n\n.Adapter_button {\n  box-sizing: border-box;\n  height: 20px;\n  width: 20px;\n  margin-top: -12px;\n  border-radius: 3px;\n  cursor: pointer;\n  border-style: solid;\n  border-width: 1px;\n  border-color: transparent;\n}\n\n.Adapter_button:hover {\n  border-color: #cccccc;\n}\n\n.Adapter_toggle {\n  right: 40px;\n}\n\n.Adapter_minimized .Adapter_toggle {\n  right: 3px;\n}\n\n.Adapter_minimizeIcon {\n  position: absolute;\n  box-sizing: border-box;\n  left: 3px;\n  bottom: 7px;\n  width: 12px;\n  height: 2px;\n  border: 1px solid #888888;\n}\n\n.Adapter_minimized .Adapter_minimizeIcon {\n  height: 12px;\n  bottom: 3px;\n}\n\n.Adapter_minimizeIconBar {\n  width: 100%;\n  height: 1px;\n  background-color: #888888;\n}\n\n.Adapter_close {\n  right: 16px;\n}\n\n.Adapter_minimized .Adapter_close {\n  display: none;\n}\n\n.Adapter_closeIcon {\n  position: relative;\n  overflow: hidden;\n  margin: 2px;\n  width: 14px;\n  height: 14px;\n}\n\n.Adapter_closeIcon :first-child, .Adapter_closeIcon :last-child {\n  position: absolute;\n  height: 2px;\n  width: 100%;\n  top: 6px;\n  left: 0;\n  background: #888888;\n  border-radius: 1px;\n}\n\n.Adapter_closeIcon :first-child {\n  -webkit-transform: rotate(45deg);\n          transform: rotate(45deg);\n}\n\n.Adapter_closeIcon :last-child {\n  -webkit-transform: rotate(-45deg);\n          transform: rotate(-45deg);\n}\n\n.Adapter_contentFrame {\n  display: block;\n  border: none;\n  width: 0;\n  height: 0;\n}\n\n.Adapter_frameContainer {\n  overflow: hidden;\n  -webkit-transition: width 0.1s 0s ease-in-out, height 0.1s 0s ease-in-out;\n  transition: width 0.1s 0s ease-in-out, height 0.1s 0s ease-in-out;\n}\n\n@-webkit-keyframes Adapter_glow {\n  0% {\n    box-shadow: inset 0 0 7px -10px #0684bd;\n  }\n  40%, 50% {\n    box-shadow: inset 0 0 7px 0px #0684bd;\n  }\n  100% {\n    box-shadow: inset 0 0 7px -10px #0684bd;\n  }\n}\n\n@keyframes Adapter_glow {\n  0% {\n    box-shadow: inset 0 0 7px -10px #0684bd;\n  }\n  40%, 50% {\n    box-shadow: inset 0 0 7px 0px #0684bd;\n  }\n  100% {\n    box-shadow: inset 0 0 7px -10px #0684bd;\n  }\n}\n\n.Adapter_minimized.Adapter_ringing {\n  -webkit-animation-name: Adapter_glow;\n          animation-name: Adapter_glow;\n  -webkit-animation-duration: 2s;\n          animation-duration: 2s;\n  -webkit-animation-timing-function: ease-in-out;\n          animation-timing-function: ease-in-out;\n  -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n}\n\n@-webkit-keyframes Adapter_moveIn {\n  0% {\n    display: none;\n    top: -50%;\n  }\n  100% {\n    display: inline-block;\n    top: 50%;\n  }\n}\n\n@keyframes Adapter_moveIn {\n  0% {\n    display: none;\n    top: -50%;\n  }\n  100% {\n    display: inline-block;\n    top: 50%;\n  }\n}\n\n@-webkit-keyframes Adapter_moveOut {\n  0% {\n    display: inline-block;\n    top: 50%;\n  }\n  100% {\n    top: 150%;\n    display: none;\n  }\n}\n\n@keyframes Adapter_moveOut {\n  0% {\n    display: inline-block;\n    top: 50%;\n  }\n  100% {\n    top: 150%;\n    display: none;\n  }\n}\n\n.Adapter_moveIn {\n  -webkit-animation-name: Adapter_moveIn;\n          animation-name: Adapter_moveIn;\n  -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n  -webkit-animation-timing-function: ease-in-out;\n          animation-timing-function: ease-in-out;\n  -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n  -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n}\n\n.Adapter_moveOut {\n  -webkit-animation-name: Adapter_moveOut;\n          animation-name: Adapter_moveOut;\n  -webkit-animation-duration: 1s;\n          animation-duration: 1s;\n  -webkit-animation-timing-function: ease-in-out;\n          animation-timing-function: ease-in-out;\n  -webkit-animation-iteration-count: 1;\n          animation-iteration-count: 1;\n  -webkit-animation-fill-mode: forwards;\n          animation-fill-mode: forwards;\n}\n\n.Adapter_duration.Adapter_visible, .Adapter_ringingCalls.Adapter_visible, .Adapter_onHoldCalls.Adapter_visible {\n  top: 50%;\n}\n\n.Adapter_duration {\n  position: absolute;\n  top: -50%;\n  left: 50%;\n  height: 16px;\n  line-height: 16px;\n  margin-top: -8px;\n  color: #666666;\n  font-size: 12px;\n  white-space: nowrap;\n  width: 33px;\n  margin-left: -60px;\n  cursor: pointer;\n}\n\n.Adapter_duration.Adapter_center {\n  margin-left: -16px;\n}\n\n.Adapter_ringingCalls, .Adapter_onHoldCalls {\n  position: absolute;\n  top: -50%;\n  left: 50%;\n  height: 16px;\n  line-height: 16px;\n  margin-top: -8px;\n  color: #666666;\n  font-size: 12px;\n  white-space: nowrap;\n  width: 100px;\n  margin-left: -100px;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  text-align: center;\n}\n\n.Adapter_ringingCalls.Adapter_center, .Adapter_onHoldCalls.Adapter_center {\n  margin-left: -50px;\n}\n\n.Adapter_currentCallBtn {\n  position: absolute;\n  top: -50%;\n  left: 50%;\n  padding: 0 5px;\n  height: 18px;\n  line-height: 18px;\n  border-radius: 10.5px;\n  font-size: 11px;\n  margin-top: -10px;\n  margin-left: -13px;\n  overflow: hidden;\n  white-space: nowrap;\n  min-width: 66px;\n  max-width: 110px;\n  cursor: pointer;\n  border: solid 1px #5FB95C;\n  color: #5FB95C;\n}\n\n.Adapter_currentCallBtn.Adapter_visible {\n  display: inline-block;\n  margin-top: -10px;\n  top: 50%;\n}\n\n.Adapter_currentCallBtn:hover {\n  color: #5FB95C;\n}\n\n.Adapter_currentCallBtn.Adapter_left {\n  margin-left: -80px;\n}\n\n.Adapter_viewCallsBtn {\n  position: absolute;\n  top: -50%;\n  left: 50%;\n  padding: 0 5px;\n  height: 18px;\n  line-height: 18px;\n  border-radius: 10.5px;\n  font-size: 11px;\n  margin-top: -10px;\n  margin-left: -13px;\n  overflow: hidden;\n  white-space: nowrap;\n  min-width: 66px;\n  max-width: 110px;\n  cursor: pointer;\n  border: solid 1px #FF8800;\n  color: #FF8800;\n  margin-left: 0;\n}\n\n.Adapter_viewCallsBtn:hover {\n  color: #FF8800;\n}\n\n.Adapter_viewCallsBtn.Adapter_visible {\n  display: inline-block;\n  margin-top: -10px;\n  top: 50%;\n}\n\n.Adapter_hack {\n  background: url(\"https://{{rc-styles}}\");\n}\n\n.Adapter_root {\n  -webkit-transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, width 0.2s ease-in-out, -webkit-transform 0.2s 0s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, width 0.2s ease-in-out, -webkit-transform 0.2s 0s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, transform 0.2s 0s ease-in-out, width 0.2s ease-in-out;\n  transition: visibility 0.2s 0s linear, opacity 0.2s 0s linear, transform 0.2s 0s ease-in-out, width 0.2s ease-in-out, -webkit-transform 0.2s 0s ease-in-out;\n}\n\n.Adapter_root.Adapter_dock {\n  top: initial !important;\n  width: 300px;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n\n.Adapter_root.Adapter_dock.Adapter_minimized {\n  width: 60px;\n}\n\n.Adapter_root.Adapter_dock.Adapter_minimized.Adapter_noPresence {\n  width: 35px;\n}\n\n.Adapter_iconTrans .Adapter_presence {\n  opacity: 1 !important;\n}\n\n.Adapter_iconTrans .Adapter_iconContainer {\n  opacity: 0 !important;\n}\n\n.Adapter_iconTrans .Adapter_logo {\n  opacity: 1 !important;\n}\n\n.Adapter_iconContainer {\n  display: none;\n}\n\n.Adapter_close {\n  display: none;\n}\n\n.Adapter_toggle {\n  right: 10px;\n}\n\n.Adapter_dock.Adapter_minimized.Adapter_expandable {\n  width: 140px !important;\n}\n\n.Adapter_dock .Adapter_minimized.Adapter_header {\n  line-height: initial;\n  cursor: pointer;\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_presence {\n  width: 12px;\n  height: 12px;\n  margin-top: -6px;\n  z-index: 2;\n  -webkit-transition: .2s;\n  transition: .2s;\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_presenceBar {\n  -webkit-transform: translate(2px, 5px);\n          transform: translate(2px, 5px);\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_logo {\n  opacity: 0;\n  -webkit-transition: opacity .2s;\n  transition: opacity .2s;\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_iconContainer {\n  z-index: 2147483648;\n  top: 7px;\n  position: absolute;\n  left: 30px;\n  height: 22px;\n  width: 22px;\n  display: block;\n  cursor: pointer;\n  opacity: 1;\n  -webkit-transition: .2s;\n  transition: .2s;\n  display: -webkit-box;\n  display: flex;\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_iconContainer .Adapter_icon {\n  width: 22px;\n  height: 22px;\n  display: inline-block;\n}\n\n.Adapter_dock .Adapter_minimized .Adapter_noPresence {\n  left: 7px !important;\n}\n\n.Adapter_iconContainer.Adapter_hidden {\n  display: none;\n}\n\n.Adapter_viewCallsBtn.Adapter_visible {\n  margin-left: 20px;\n}\n\n.Adapter_viewCallsBtn.Adapter_moveIn {\n  margin-left: 20px;\n}\n\n.Adapter_viewCallsBtn.Adapter_moveOut {\n  margin-left: 20px;\n}\n\n.Adapter_ringingCalls.Adapter_visible, .Adapter_onHoldCalls.Adapter_visible {\n  margin-left: -80px;\n}\n\n.Adapter_ringingCalls.Adapter_moveIn, .Adapter_onHoldCalls.Adapter_moveIn {\n  margin-left: -80px;\n}\n\n.Adapter_ringingCalls.Adapter_moveOut, .Adapter_onHoldCalls.Adapter_moveOut {\n  margin-left: -80px;\n}\n", ""]);

// Exports
exports.locals = {
	"centerStyle": "Adapter_centerStyle",
	"logo": "Adapter_logo",
	"presence": "Adapter_presence",
	"button": "Adapter_button",
	"root": "Adapter_root",
	"left": "Adapter_left",
	"right": "Adapter_right",
	"dragging": "Adapter_dragging",
	"closed": "Adapter_closed",
	"loading": "Adapter_loading",
	"header": "Adapter_header",
	"minimized": "Adapter_minimized",
	"visible": "Adapter_visible",
	"dropdownPresence": "Adapter_dropdownPresence",
	"showDropdown": "Adapter_showDropdown",
	"presenceItem": "Adapter_presenceItem",
	"selected": "Adapter_selected",
	"line": "Adapter_line",
	"horizontal": "Adapter_horizontal",
	"clickable": "Adapter_clickable",
	"noborder": "Adapter_noborder",
	"Offline": "Adapter_Offline",
	"Busy": "Adapter_Busy",
	"Available": "Adapter_Available",
	"presenceBar": "Adapter_presenceBar",
	"DoNotAcceptAnyCalls": "Adapter_DoNotAcceptAnyCalls",
	"statusIcon": "Adapter_statusIcon",
	"toggle": "Adapter_toggle",
	"minimizeIcon": "Adapter_minimizeIcon",
	"minimizeIconBar": "Adapter_minimizeIconBar",
	"close": "Adapter_close",
	"closeIcon": "Adapter_closeIcon",
	"contentFrame": "Adapter_contentFrame",
	"frameContainer": "Adapter_frameContainer",
	"ringing": "Adapter_ringing",
	"glow": "Adapter_glow",
	"moveIn": "Adapter_moveIn",
	"moveOut": "Adapter_moveOut",
	"duration": "Adapter_duration",
	"ringingCalls": "Adapter_ringingCalls",
	"onHoldCalls": "Adapter_onHoldCalls",
	"center": "Adapter_center",
	"currentCallBtn": "Adapter_currentCallBtn",
	"viewCallsBtn": "Adapter_viewCallsBtn",
	"hack": "Adapter_hack",
	"dock": "Adapter_dock",
	"noPresence": "Adapter_noPresence",
	"iconTrans": "Adapter_iconTrans",
	"iconContainer": "Adapter_iconContainer",
	"expandable": "Adapter_expandable",
	"icon": "Adapter_icon",
	"hidden": "Adapter_hidden"
};

/***/ }),

/***/ 4098:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(__webpack_require__(74));

var _createClass2 = _interopRequireDefault(__webpack_require__(84));

var Notification = /*#__PURE__*/function () {
  function Notification() {
    (0, _classCallCheck2.default)(this, Notification);
    this._enableNotification = false;
    this._notification = null;

    this._checkOrRequirePermission();
  }

  (0, _createClass2.default)(Notification, [{
    key: "_checkOrRequirePermission",
    value: function _checkOrRequirePermission() {
      var _this = this;

      if (!this.nativeAPI) {
        console.log('This browser does not support system notifications.');
        return;
      }

      if (this.hasPermission) {
        this._enableNotification = true;
        return;
      }

      if (this.nativeAPI.permission !== 'denied') {
        this.nativeAPI.requestPermission(function () {
          if (_this.hasPermission) {
            _this._enableNotification = true;
          }
        });
      }
    }
  }, {
    key: "notify",
    value: function notify(_ref) {
      var title = _ref.title,
          text = _ref.text,
          icon = _ref.icon,
          onClick = _ref.onClick;

      if (!this._enableNotification) {
        return;
      }

      var n = new window.Notification(title, {
        body: text,
        icon: icon
      });
      n.onclick = onClick;
    }
  }, {
    key: "hasPermission",
    get: function get() {
      return this.nativeAPI.permission === 'granted';
    }
  }, {
    key: "nativeAPI",
    get: function get() {
      return window.Notification;
    }
  }]);
  return Notification;
}();

exports.default = Notification;

/***/ }),

/***/ 416:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.2.1 Object.assign(target, source, ...)
var DESCRIPTORS = __webpack_require__(68);
var getKeys = __webpack_require__(115);
var gOPS = __webpack_require__(184);
var pIE = __webpack_require__(162);
var toObject = __webpack_require__(97);
var IObject = __webpack_require__(183);
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || __webpack_require__(61)(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!DESCRIPTORS || isEnum.call(S, key)) T[key] = S[key];
    }
  } return T;
} : $assign;


/***/ }),

/***/ 420:
/***/ (function(module, exports, __webpack_require__) {

// 21.2.5.3 get RegExp.prototype.flags()
if (__webpack_require__(68) && /./g.flags != 'g') __webpack_require__(70).f(RegExp.prototype, 'flags', {
  configurable: true,
  get: __webpack_require__(228)
});


/***/ }),

/***/ 422:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var dP = __webpack_require__(70).f;
var create = __webpack_require__(145);
var redefineAll = __webpack_require__(231);
var ctx = __webpack_require__(124);
var anInstance = __webpack_require__(230);
var forOf = __webpack_require__(283);
var $iterDefine = __webpack_require__(227);
var step = __webpack_require__(282);
var setSpecies = __webpack_require__(250);
var DESCRIPTORS = __webpack_require__(68);
var fastKey = __webpack_require__(152).fastKey;
var validate = __webpack_require__(208);
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};


/***/ }),

/***/ 426:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseCallbackUri;

var _objectSpread2 = _interopRequireDefault(__webpack_require__(88));

var _url = _interopRequireDefault(__webpack_require__(177));

var _qs = _interopRequireDefault(__webpack_require__(427));

function parseCallbackUri(callbackUri) {
  var _url$parse = _url.default.parse(callbackUri, true),
      query = _url$parse.query,
      hash = _url$parse.hash;

  var hashObject = hash ? _qs.default.parse(hash.replace(/^#/, '')) : {};

  if (query.error) {
    var error = new Error(query.error);

    for (var key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        error[key] = query[key];
      }
    }

    throw error;
  }

  return (0, _objectSpread2.default)({}, query, hashObject);
}

/***/ }),

/***/ 427:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var stringify = __webpack_require__(511);
var parse = __webpack_require__(512);
var formats = __webpack_require__(375);

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};


/***/ }),

/***/ 48:
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(70).f;
var FProto = Function.prototype;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// 19.2.4.2 name
NAME in FProto || __webpack_require__(68) && dP(FProto, NAME, {
  configurable: true,
  get: function () {
    try {
      return ('' + this).match(nameRE)[1];
    } catch (e) {
      return '';
    }
  }
});


/***/ }),

/***/ 5:
/***/ (function(module, exports, __webpack_require__) {

var $iterators = __webpack_require__(6);
var getKeys = __webpack_require__(115);
var redefine = __webpack_require__(86);
var global = __webpack_require__(56);
var hide = __webpack_require__(91);
var Iterators = __webpack_require__(146);
var wks = __webpack_require__(62);
var ITERATOR = wks('iterator');
var TO_STRING_TAG = wks('toStringTag');
var ArrayValues = Iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
  var NAME = collections[i];
  var explicit = DOMIterables[NAME];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  var key;
  if (proto) {
    if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
    if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
  }
}


/***/ }),

/***/ 510:
/***/ (function(module, exports) {

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;

/***/ }),

/***/ 511:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(374);
var formats = __webpack_require__(375);

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
        return prefix + '[]';
    },
    indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
        return prefix;
    }
};

var toISO = Date.prototype.toISOString;

var defaults = {
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    serializeDate: function serializeDate(date) { // eslint-disable-line func-name-matching
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify( // eslint-disable-line func-name-matching
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    formatter,
    encodeValuesOnly
) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly
            ));
        } else {
            values = values.concat(stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts ? utils.assign({}, opts) : {};

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = typeof options.encoder === 'function' ? options.encoder : defaults.encoder;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    var encodeValuesOnly = typeof options.encodeValuesOnly === 'boolean' ? options.encodeValuesOnly : defaults.encodeValuesOnly;
    if (typeof options.format === 'undefined') {
        options.format = formats['default'];
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encode ? encoder : null,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter,
            encodeValuesOnly
        ));
    }

    var joined = keys.join(delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    return joined.length > 0 ? prefix + joined : '';
};


/***/ }),

/***/ 512:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(374);

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    parameterLimit: 1000,
    plainObjects: false,
    strictNullHandling: false
};

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder);
            val = options.decoder(part.slice(pos + 1), defaults.decoder);
        }
        if (has.call(obj, key)) {
            obj[key] = [].concat(obj[key]).concat(val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options) {
    var leaf = val;

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]') {
            obj = [];
            obj = obj.concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts ? utils.assign({}, opts) : {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.ignoreQueryPrefix = options.ignoreQueryPrefix === true;
    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};


/***/ }),

/***/ 534:
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),

/***/ 536:
/***/ (function(module, exports, __webpack_require__) {

var getPrototypeOf = __webpack_require__(76);

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

module.exports = _superPropBase;

/***/ }),

/***/ 538:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(291));

var _Enum = _interopRequireDefault(__webpack_require__(25));

var _baseMessageTypes = _interopRequireDefault(__webpack_require__(382));

var _default = new _Enum.default([].concat((0, _toConsumableArray2.default)(Object.keys(_baseMessageTypes.default)), ['syncPresence']), 'rc-adapter');

exports.default = _default;

/***/ }),

/***/ 539:
/***/ (function(module, exports) {

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

module.exports = _arrayWithoutHoles;

/***/ }),

/***/ 540:
/***/ (function(module, exports) {

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

module.exports = _iterableToArray;

/***/ }),

/***/ 541:
/***/ (function(module, exports) {

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

module.exports = _nonIterableSpread;

/***/ }),

/***/ 542:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requestWithPostMessage;

var _uuid = _interopRequireDefault(__webpack_require__(543));

function requestWithPostMessage(path, body) {
  var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;
  var target = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : window.parent;
  var prefix = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'rc-post-message';
  return new Promise(function (resolve, reject) {
    var id = _uuid.default.v4();

    var _responseFunc;

    var catchTimeout = setTimeout(function () {
      window.removeEventListener('message', _responseFunc);
      reject(Error('Time out'));
    }, timeout);

    _responseFunc = function responseFunc(e) {
      var data = e.data;

      if (data && data.type === "".concat(prefix, "-response") && data.responseId === id) {
        clearTimeout(catchTimeout);
        window.removeEventListener('message', _responseFunc);
        resolve(data.response);
      }
    };

    target.postMessage({
      type: "".concat(prefix, "-request"),
      requestId: id,
      path: path,
      body: body
    }, '*');
    window.addEventListener('message', _responseFunc);
  });
}

/***/ }),

/***/ 543:
/***/ (function(module, exports, __webpack_require__) {

var v1 = __webpack_require__(544);
var v4 = __webpack_require__(545);

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;


/***/ }),

/***/ 544:
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(383);
var bytesToUuid = __webpack_require__(384);

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;


/***/ }),

/***/ 545:
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(383);
var bytesToUuid = __webpack_require__(384);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),

/***/ 56:
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),

/***/ 581:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = padLeft;

function padLeft(input, _char, length) {
  var str = "".concat(input);
  var padding = [];

  for (var i = str.length; i < length; i += 1) {
    padding.push(_char);
  }

  return "".concat(padding.join('')).concat(str);
}
//# sourceMappingURL=padLeft.js.map


/***/ }),

/***/ 6:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var addToUnscopables = __webpack_require__(207);
var step = __webpack_require__(282);
var Iterators = __webpack_require__(146);
var toIObject = __webpack_require__(94);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = __webpack_require__(227)(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');


/***/ }),

/***/ 61:
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),

/***/ 62:
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__(161)('wks');
var uid = __webpack_require__(123);
var Symbol = __webpack_require__(56).Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),

/***/ 64:
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(65);
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),

/***/ 65:
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),

/***/ 67:
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ 68:
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(61)(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(275)('asyncIterator');


/***/ }),

/***/ 70:
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(64);
var IE8_DOM_DEFINE = __webpack_require__(248);
var toPrimitive = __webpack_require__(137);
var dP = Object.defineProperty;

exports.f = __webpack_require__(68) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),

/***/ 72:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ensureExist;

__webpack_require__(48);

function ensureExist(module, moduleName) {
  if (!module) {
    throw new Error("'".concat(moduleName, "' is a required dependency for '").concat(this.constructor.name, "'"));
  }

  return module;
}
//# sourceMappingURL=ensureExist.js.map


/***/ }),

/***/ 74:
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

/***/ }),

/***/ 76:
/***/ (function(module, exports) {

function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;

/***/ }),

/***/ 77:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.3.1 Object.assign(target, source)
var $export = __webpack_require__(26);

$export($export.S + $export.F, 'Object', { assign: __webpack_require__(416) });


/***/ }),

/***/ 78:
/***/ (function(module, exports, __webpack_require__) {

// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = __webpack_require__(26);

$export($export.S, 'Date', { now: function () { return new Date().getTime(); } });


/***/ }),

/***/ 81:
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(326);

var assertThisInitialized = __webpack_require__(235);

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;

/***/ }),

/***/ 82:
/***/ (function(module, exports, __webpack_require__) {

var setPrototypeOf = __webpack_require__(376);

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

module.exports = _inherits;

/***/ }),

/***/ 84:
/***/ (function(module, exports) {

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;

/***/ }),

/***/ 86:
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(56);
var hide = __webpack_require__(91);
var has = __webpack_require__(90);
var SRC = __webpack_require__(123)('src');
var $toString = __webpack_require__(364);
var TO_STRING = 'toString';
var TPL = ('' + $toString).split(TO_STRING);

__webpack_require__(87).inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});


/***/ }),

/***/ 87:
/***/ (function(module, exports) {

var core = module.exports = { version: '2.6.9' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),

/***/ 88:
/***/ (function(module, exports, __webpack_require__) {

var defineProperty = __webpack_require__(510);

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      defineProperty(target, key, source[key]);
    });
  }

  return target;
}

module.exports = _objectSpread;

/***/ }),

/***/ 9:
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 Object.keys(O)
var toObject = __webpack_require__(97);
var $keys = __webpack_require__(115);

__webpack_require__(155)('keys', function () {
  return function keys(it) {
    return $keys(toObject(it));
  };
});


/***/ }),

/***/ 90:
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),

/***/ 91:
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(70);
var createDesc = __webpack_require__(122);
module.exports = __webpack_require__(68) ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),

/***/ 92:
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(139);
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),

/***/ 94:
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(183);
var defined = __webpack_require__(130);
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),

/***/ 97:
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(130);
module.exports = function (it) {
  return Object(defined(it));
};


/***/ })

/******/ });