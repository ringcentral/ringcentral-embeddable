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
/******/ 	return __webpack_require__(__webpack_require__.s = 678);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(30);
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !__webpack_require__(57), 'Object', { defineProperty: __webpack_require__(60).f });


/***/ }),
/* 2 */,
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.3.6 Object.prototype.toString()
var classof = __webpack_require__(165);
var test = {};
test[__webpack_require__(51)('toStringTag')] = 'z';
if (test + '' != '[object z]') {
  __webpack_require__(78)(Object.prototype, 'toString', function toString() {
    return '[object ' + classof(this) + ']';
  }, true);
}


/***/ }),
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var $iterators = __webpack_require__(6);
var getKeys = __webpack_require__(104);
var redefine = __webpack_require__(78);
var global = __webpack_require__(49);
var hide = __webpack_require__(87);
var Iterators = __webpack_require__(119);
var wks = __webpack_require__(51);
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
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var addToUnscopables = __webpack_require__(167);
var step = __webpack_require__(221);
var Iterators = __webpack_require__(119);
var toIObject = __webpack_require__(88);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = __webpack_require__(176)(Array, 'Array', function (iterated, kind) {
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// ECMAScript 6 symbols shim
var global = __webpack_require__(49);
var has = __webpack_require__(85);
var DESCRIPTORS = __webpack_require__(57);
var $export = __webpack_require__(30);
var redefine = __webpack_require__(78);
var META = __webpack_require__(140).KEY;
var $fails = __webpack_require__(55);
var shared = __webpack_require__(134);
var setToStringTag = __webpack_require__(130);
var uid = __webpack_require__(103);
var wks = __webpack_require__(51);
var wksExt = __webpack_require__(187);
var wksDefine = __webpack_require__(217);
var enumKeys = __webpack_require__(301);
var isArray = __webpack_require__(164);
var anObject = __webpack_require__(56);
var isObject = __webpack_require__(58);
var toObject = __webpack_require__(91);
var toIObject = __webpack_require__(88);
var toPrimitive = __webpack_require__(117);
var createDesc = __webpack_require__(102);
var _create = __webpack_require__(131);
var gOPNExt = __webpack_require__(260);
var $GOPD = __webpack_require__(112);
var $GOPS = __webpack_require__(152);
var $DP = __webpack_require__(60);
var $keys = __webpack_require__(104);
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
  __webpack_require__(127).f = gOPNExt.f = $getOwnPropertyNames;
  __webpack_require__(145).f = $propertyIsEnumerable;
  $GOPS.f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !__webpack_require__(118)) {
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
$Symbol[PROTOTYPE][TO_PRIMITIVE] || __webpack_require__(87)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(217)('asyncIterator');


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var DateProto = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var $toString = DateProto[TO_STRING];
var getTime = DateProto.getTime;
if (new Date(NaN) + '' != INVALID_DATE) {
  __webpack_require__(78)(DateProto, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

__webpack_require__(341);
var anObject = __webpack_require__(56);
var $flags = __webpack_require__(188);
var DESCRIPTORS = __webpack_require__(57);
var TO_STRING = 'toString';
var $toString = /./[TO_STRING];

var define = function (fn) {
  __webpack_require__(78)(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if (__webpack_require__(55)(function () { return $toString.call({ source: 'a', flags: 'b' }) != '/a/b'; })) {
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
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 Object.keys(O)
var toObject = __webpack_require__(91);
var $keys = __webpack_require__(104);

__webpack_require__(153)('keys', function () {
  return function keys(it) {
    return $keys(toObject(it));
  };
});


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $export = __webpack_require__(30);
var $forEach = __webpack_require__(128)(0);
var STRICT = __webpack_require__(113)([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */) {
    return $forEach(this, callbackfn, arguments[1]);
  }
});


/***/ }),
/* 13 */
/***/ (function(module, exports) {

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $at = __webpack_require__(304)(true);

// 21.1.3.27 String.prototype[@@iterator]()
__webpack_require__(176)(String, 'String', function (iterated) {
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
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $export = __webpack_require__(30);
var $filter = __webpack_require__(128)(2);

$export($export.P + $export.F * !__webpack_require__(113)([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments[1]);
  }
});


/***/ }),
/* 19 */,
/* 20 */,
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(60).f;
var FProto = Function.prototype;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// 19.2.4.2 name
NAME in FProto || __webpack_require__(57) && dP(FProto, NAME, {
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
/* 22 */,
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
  Copyright (c) 2017 Jed Watson.
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
			} else if (Array.isArray(arg) && arg.length) {
				var inner = classNames.apply(null, arg);
				if (inner) {
					classes.push(inner);
				}
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
		classNames.default = classNames;
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
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(30);
// 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
$export($export.S + $export.F * !__webpack_require__(57), 'Object', { defineProperties: __webpack_require__(203) });


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

// https://github.com/tc39/proposal-object-getownpropertydescriptors
var $export = __webpack_require__(30);
var ownKeys = __webpack_require__(266);
var toIObject = __webpack_require__(88);
var gOPD = __webpack_require__(112);
var createProperty = __webpack_require__(204);

$export($export.S, 'Object', {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    var O = toIObject(object);
    var getDesc = gOPD.f;
    var keys = ownKeys(O);
    var result = {};
    var i = 0;
    var key, desc;
    while (keys.length > i) {
      desc = getDesc(O, key = keys[i++]);
      if (desc !== undefined) createProperty(result, key, desc);
    }
    return result;
  }
});


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(5);

__webpack_require__(6);

__webpack_require__(3);

__webpack_require__(11);

__webpack_require__(12);

__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ObjectMap = __webpack_require__(396);

Object.keys(_ObjectMap).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _ObjectMap[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _ObjectMap[key];
    }
  });
});
//# sourceMappingURL=index.js.map


/***/ }),
/* 27 */
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
/* 28 */
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

var	fixUrls = __webpack_require__(401);

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
/* 29 */,
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(49);
var core = __webpack_require__(86);
var hide = __webpack_require__(87);
var redefine = __webpack_require__(78);
var ctx = __webpack_require__(99);
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
/* 31 */,
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = __webpack_require__(30);

$export($export.S, 'Array', { isArray: __webpack_require__(164) });


/***/ }),
/* 33 */,
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var ctx = __webpack_require__(99);
var $export = __webpack_require__(30);
var toObject = __webpack_require__(91);
var call = __webpack_require__(263);
var isArrayIter = __webpack_require__(241);
var toLength = __webpack_require__(90);
var createProperty = __webpack_require__(204);
var getIterFn = __webpack_require__(242);

$export($export.S + $export.F * !__webpack_require__(219)(function (iter) { Array.from(iter); }), 'Array', {
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
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $export = __webpack_require__(30);
var $reduce = __webpack_require__(339);

$export($export.P + $export.F * !__webpack_require__(113)([].reduce, true), 'Array', {
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }
});


/***/ }),
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),
/* 50 */,
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__(134)('wks');
var uid = __webpack_require__(103);
var Symbol = __webpack_require__(49).Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = __webpack_require__(30);
var $find = __webpack_require__(128)(5);
var KEY = 'find';
var forced = true;
// Shouldn't skip holes
if (KEY in []) Array(1)[KEY](function () { forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
__webpack_require__(167)(KEY);


/***/ }),
/* 53 */,
/* 54 */,
/* 55 */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(58);
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(55)(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 58 */
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),
/* 59 */,
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(56);
var IE8_DOM_DEFINE = __webpack_require__(200);
var toPrimitive = __webpack_require__(117);
var dP = Object.defineProperty;

exports.f = __webpack_require__(57) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
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
/* 61 */,
/* 62 */,
/* 63 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "F", function() { return /* reexport */ es_F; });
__webpack_require__.d(__webpack_exports__, "T", function() { return /* reexport */ es_T; });
__webpack_require__.d(__webpack_exports__, "__", function() { return /* reexport */ _; });
__webpack_require__.d(__webpack_exports__, "add", function() { return /* reexport */ es_add; });
__webpack_require__.d(__webpack_exports__, "addIndex", function() { return /* reexport */ es_addIndex; });
__webpack_require__.d(__webpack_exports__, "adjust", function() { return /* reexport */ es_adjust; });
__webpack_require__.d(__webpack_exports__, "all", function() { return /* reexport */ es_all; });
__webpack_require__.d(__webpack_exports__, "allPass", function() { return /* reexport */ es_allPass; });
__webpack_require__.d(__webpack_exports__, "always", function() { return /* reexport */ es_always; });
__webpack_require__.d(__webpack_exports__, "and", function() { return /* reexport */ es_and; });
__webpack_require__.d(__webpack_exports__, "any", function() { return /* reexport */ es_any; });
__webpack_require__.d(__webpack_exports__, "anyPass", function() { return /* reexport */ es_anyPass; });
__webpack_require__.d(__webpack_exports__, "ap", function() { return /* reexport */ es_ap; });
__webpack_require__.d(__webpack_exports__, "aperture", function() { return /* reexport */ es_aperture; });
__webpack_require__.d(__webpack_exports__, "append", function() { return /* reexport */ es_append; });
__webpack_require__.d(__webpack_exports__, "apply", function() { return /* reexport */ es_apply; });
__webpack_require__.d(__webpack_exports__, "applySpec", function() { return /* reexport */ es_applySpec; });
__webpack_require__.d(__webpack_exports__, "applyTo", function() { return /* reexport */ es_applyTo; });
__webpack_require__.d(__webpack_exports__, "ascend", function() { return /* reexport */ es_ascend; });
__webpack_require__.d(__webpack_exports__, "assoc", function() { return /* reexport */ es_assoc; });
__webpack_require__.d(__webpack_exports__, "assocPath", function() { return /* reexport */ es_assocPath; });
__webpack_require__.d(__webpack_exports__, "binary", function() { return /* reexport */ es_binary; });
__webpack_require__.d(__webpack_exports__, "bind", function() { return /* reexport */ es_bind; });
__webpack_require__.d(__webpack_exports__, "both", function() { return /* reexport */ es_both; });
__webpack_require__.d(__webpack_exports__, "call", function() { return /* reexport */ es_call; });
__webpack_require__.d(__webpack_exports__, "chain", function() { return /* reexport */ es_chain; });
__webpack_require__.d(__webpack_exports__, "clamp", function() { return /* reexport */ es_clamp; });
__webpack_require__.d(__webpack_exports__, "clone", function() { return /* reexport */ es_clone; });
__webpack_require__.d(__webpack_exports__, "comparator", function() { return /* reexport */ es_comparator; });
__webpack_require__.d(__webpack_exports__, "complement", function() { return /* reexport */ es_complement; });
__webpack_require__.d(__webpack_exports__, "compose", function() { return /* reexport */ compose; });
__webpack_require__.d(__webpack_exports__, "composeK", function() { return /* reexport */ composeK; });
__webpack_require__.d(__webpack_exports__, "composeP", function() { return /* reexport */ composeP; });
__webpack_require__.d(__webpack_exports__, "composeWith", function() { return /* reexport */ es_composeWith; });
__webpack_require__.d(__webpack_exports__, "concat", function() { return /* reexport */ es_concat; });
__webpack_require__.d(__webpack_exports__, "cond", function() { return /* reexport */ es_cond; });
__webpack_require__.d(__webpack_exports__, "construct", function() { return /* reexport */ es_construct; });
__webpack_require__.d(__webpack_exports__, "constructN", function() { return /* reexport */ es_constructN; });
__webpack_require__.d(__webpack_exports__, "contains", function() { return /* reexport */ es_contains; });
__webpack_require__.d(__webpack_exports__, "converge", function() { return /* reexport */ es_converge; });
__webpack_require__.d(__webpack_exports__, "countBy", function() { return /* reexport */ es_countBy; });
__webpack_require__.d(__webpack_exports__, "curry", function() { return /* reexport */ es_curry; });
__webpack_require__.d(__webpack_exports__, "curryN", function() { return /* reexport */ es_curryN; });
__webpack_require__.d(__webpack_exports__, "dec", function() { return /* reexport */ es_dec; });
__webpack_require__.d(__webpack_exports__, "defaultTo", function() { return /* reexport */ es_defaultTo; });
__webpack_require__.d(__webpack_exports__, "descend", function() { return /* reexport */ es_descend; });
__webpack_require__.d(__webpack_exports__, "difference", function() { return /* reexport */ es_difference; });
__webpack_require__.d(__webpack_exports__, "differenceWith", function() { return /* reexport */ es_differenceWith; });
__webpack_require__.d(__webpack_exports__, "dissoc", function() { return /* reexport */ es_dissoc; });
__webpack_require__.d(__webpack_exports__, "dissocPath", function() { return /* reexport */ es_dissocPath; });
__webpack_require__.d(__webpack_exports__, "divide", function() { return /* reexport */ es_divide; });
__webpack_require__.d(__webpack_exports__, "drop", function() { return /* reexport */ es_drop; });
__webpack_require__.d(__webpack_exports__, "dropLast", function() { return /* reexport */ es_dropLast; });
__webpack_require__.d(__webpack_exports__, "dropLastWhile", function() { return /* reexport */ es_dropLastWhile; });
__webpack_require__.d(__webpack_exports__, "dropRepeats", function() { return /* reexport */ es_dropRepeats; });
__webpack_require__.d(__webpack_exports__, "dropRepeatsWith", function() { return /* reexport */ es_dropRepeatsWith; });
__webpack_require__.d(__webpack_exports__, "dropWhile", function() { return /* reexport */ es_dropWhile; });
__webpack_require__.d(__webpack_exports__, "either", function() { return /* reexport */ es_either; });
__webpack_require__.d(__webpack_exports__, "empty", function() { return /* reexport */ es_empty; });
__webpack_require__.d(__webpack_exports__, "endsWith", function() { return /* reexport */ es_endsWith; });
__webpack_require__.d(__webpack_exports__, "eqBy", function() { return /* reexport */ es_eqBy; });
__webpack_require__.d(__webpack_exports__, "eqProps", function() { return /* reexport */ es_eqProps; });
__webpack_require__.d(__webpack_exports__, "equals", function() { return /* reexport */ es_equals; });
__webpack_require__.d(__webpack_exports__, "evolve", function() { return /* reexport */ es_evolve; });
__webpack_require__.d(__webpack_exports__, "filter", function() { return /* reexport */ es_filter; });
__webpack_require__.d(__webpack_exports__, "find", function() { return /* reexport */ es_find; });
__webpack_require__.d(__webpack_exports__, "findIndex", function() { return /* reexport */ es_findIndex; });
__webpack_require__.d(__webpack_exports__, "findLast", function() { return /* reexport */ es_findLast; });
__webpack_require__.d(__webpack_exports__, "findLastIndex", function() { return /* reexport */ es_findLastIndex; });
__webpack_require__.d(__webpack_exports__, "flatten", function() { return /* reexport */ es_flatten; });
__webpack_require__.d(__webpack_exports__, "flip", function() { return /* reexport */ es_flip; });
__webpack_require__.d(__webpack_exports__, "forEach", function() { return /* reexport */ es_forEach; });
__webpack_require__.d(__webpack_exports__, "forEachObjIndexed", function() { return /* reexport */ es_forEachObjIndexed; });
__webpack_require__.d(__webpack_exports__, "fromPairs", function() { return /* reexport */ es_fromPairs; });
__webpack_require__.d(__webpack_exports__, "groupBy", function() { return /* reexport */ es_groupBy; });
__webpack_require__.d(__webpack_exports__, "groupWith", function() { return /* reexport */ es_groupWith; });
__webpack_require__.d(__webpack_exports__, "gt", function() { return /* reexport */ es_gt; });
__webpack_require__.d(__webpack_exports__, "gte", function() { return /* reexport */ es_gte; });
__webpack_require__.d(__webpack_exports__, "has", function() { return /* reexport */ es_has; });
__webpack_require__.d(__webpack_exports__, "hasIn", function() { return /* reexport */ es_hasIn; });
__webpack_require__.d(__webpack_exports__, "hasPath", function() { return /* reexport */ es_hasPath; });
__webpack_require__.d(__webpack_exports__, "head", function() { return /* reexport */ es_head; });
__webpack_require__.d(__webpack_exports__, "identical", function() { return /* reexport */ es_identical; });
__webpack_require__.d(__webpack_exports__, "identity", function() { return /* reexport */ es_identity; });
__webpack_require__.d(__webpack_exports__, "ifElse", function() { return /* reexport */ es_ifElse; });
__webpack_require__.d(__webpack_exports__, "inc", function() { return /* reexport */ es_inc; });
__webpack_require__.d(__webpack_exports__, "includes", function() { return /* reexport */ es_includes; });
__webpack_require__.d(__webpack_exports__, "indexBy", function() { return /* reexport */ es_indexBy; });
__webpack_require__.d(__webpack_exports__, "indexOf", function() { return /* reexport */ es_indexOf; });
__webpack_require__.d(__webpack_exports__, "init", function() { return /* reexport */ es_init; });
__webpack_require__.d(__webpack_exports__, "innerJoin", function() { return /* reexport */ es_innerJoin; });
__webpack_require__.d(__webpack_exports__, "insert", function() { return /* reexport */ es_insert; });
__webpack_require__.d(__webpack_exports__, "insertAll", function() { return /* reexport */ es_insertAll; });
__webpack_require__.d(__webpack_exports__, "intersection", function() { return /* reexport */ es_intersection; });
__webpack_require__.d(__webpack_exports__, "intersperse", function() { return /* reexport */ es_intersperse; });
__webpack_require__.d(__webpack_exports__, "into", function() { return /* reexport */ es_into; });
__webpack_require__.d(__webpack_exports__, "invert", function() { return /* reexport */ es_invert; });
__webpack_require__.d(__webpack_exports__, "invertObj", function() { return /* reexport */ es_invertObj; });
__webpack_require__.d(__webpack_exports__, "invoker", function() { return /* reexport */ es_invoker; });
__webpack_require__.d(__webpack_exports__, "is", function() { return /* reexport */ es_is; });
__webpack_require__.d(__webpack_exports__, "isEmpty", function() { return /* reexport */ es_isEmpty; });
__webpack_require__.d(__webpack_exports__, "isNil", function() { return /* reexport */ es_isNil; });
__webpack_require__.d(__webpack_exports__, "join", function() { return /* reexport */ es_join; });
__webpack_require__.d(__webpack_exports__, "juxt", function() { return /* reexport */ es_juxt; });
__webpack_require__.d(__webpack_exports__, "keys", function() { return /* reexport */ es_keys; });
__webpack_require__.d(__webpack_exports__, "keysIn", function() { return /* reexport */ es_keysIn; });
__webpack_require__.d(__webpack_exports__, "last", function() { return /* reexport */ es_last; });
__webpack_require__.d(__webpack_exports__, "lastIndexOf", function() { return /* reexport */ es_lastIndexOf; });
__webpack_require__.d(__webpack_exports__, "length", function() { return /* reexport */ es_length; });
__webpack_require__.d(__webpack_exports__, "lens", function() { return /* reexport */ es_lens; });
__webpack_require__.d(__webpack_exports__, "lensIndex", function() { return /* reexport */ es_lensIndex; });
__webpack_require__.d(__webpack_exports__, "lensPath", function() { return /* reexport */ es_lensPath; });
__webpack_require__.d(__webpack_exports__, "lensProp", function() { return /* reexport */ es_lensProp; });
__webpack_require__.d(__webpack_exports__, "lift", function() { return /* reexport */ es_lift; });
__webpack_require__.d(__webpack_exports__, "liftN", function() { return /* reexport */ es_liftN; });
__webpack_require__.d(__webpack_exports__, "lt", function() { return /* reexport */ es_lt; });
__webpack_require__.d(__webpack_exports__, "lte", function() { return /* reexport */ es_lte; });
__webpack_require__.d(__webpack_exports__, "map", function() { return /* reexport */ es_map; });
__webpack_require__.d(__webpack_exports__, "mapAccum", function() { return /* reexport */ es_mapAccum; });
__webpack_require__.d(__webpack_exports__, "mapAccumRight", function() { return /* reexport */ es_mapAccumRight; });
__webpack_require__.d(__webpack_exports__, "mapObjIndexed", function() { return /* reexport */ es_mapObjIndexed; });
__webpack_require__.d(__webpack_exports__, "match", function() { return /* reexport */ es_match; });
__webpack_require__.d(__webpack_exports__, "mathMod", function() { return /* reexport */ es_mathMod; });
__webpack_require__.d(__webpack_exports__, "max", function() { return /* reexport */ es_max; });
__webpack_require__.d(__webpack_exports__, "maxBy", function() { return /* reexport */ es_maxBy; });
__webpack_require__.d(__webpack_exports__, "mean", function() { return /* reexport */ es_mean; });
__webpack_require__.d(__webpack_exports__, "median", function() { return /* reexport */ es_median; });
__webpack_require__.d(__webpack_exports__, "memoizeWith", function() { return /* reexport */ es_memoizeWith; });
__webpack_require__.d(__webpack_exports__, "merge", function() { return /* reexport */ es_merge; });
__webpack_require__.d(__webpack_exports__, "mergeAll", function() { return /* reexport */ es_mergeAll; });
__webpack_require__.d(__webpack_exports__, "mergeDeepLeft", function() { return /* reexport */ es_mergeDeepLeft; });
__webpack_require__.d(__webpack_exports__, "mergeDeepRight", function() { return /* reexport */ es_mergeDeepRight; });
__webpack_require__.d(__webpack_exports__, "mergeDeepWith", function() { return /* reexport */ es_mergeDeepWith; });
__webpack_require__.d(__webpack_exports__, "mergeDeepWithKey", function() { return /* reexport */ es_mergeDeepWithKey; });
__webpack_require__.d(__webpack_exports__, "mergeLeft", function() { return /* reexport */ es_mergeLeft; });
__webpack_require__.d(__webpack_exports__, "mergeRight", function() { return /* reexport */ es_mergeRight; });
__webpack_require__.d(__webpack_exports__, "mergeWith", function() { return /* reexport */ es_mergeWith; });
__webpack_require__.d(__webpack_exports__, "mergeWithKey", function() { return /* reexport */ es_mergeWithKey; });
__webpack_require__.d(__webpack_exports__, "min", function() { return /* reexport */ es_min; });
__webpack_require__.d(__webpack_exports__, "minBy", function() { return /* reexport */ es_minBy; });
__webpack_require__.d(__webpack_exports__, "modulo", function() { return /* reexport */ es_modulo; });
__webpack_require__.d(__webpack_exports__, "move", function() { return /* reexport */ es_move; });
__webpack_require__.d(__webpack_exports__, "multiply", function() { return /* reexport */ es_multiply; });
__webpack_require__.d(__webpack_exports__, "nAry", function() { return /* reexport */ es_nAry; });
__webpack_require__.d(__webpack_exports__, "negate", function() { return /* reexport */ es_negate; });
__webpack_require__.d(__webpack_exports__, "none", function() { return /* reexport */ es_none; });
__webpack_require__.d(__webpack_exports__, "not", function() { return /* reexport */ es_not; });
__webpack_require__.d(__webpack_exports__, "nth", function() { return /* reexport */ es_nth; });
__webpack_require__.d(__webpack_exports__, "nthArg", function() { return /* reexport */ es_nthArg; });
__webpack_require__.d(__webpack_exports__, "o", function() { return /* reexport */ es_o; });
__webpack_require__.d(__webpack_exports__, "objOf", function() { return /* reexport */ es_objOf; });
__webpack_require__.d(__webpack_exports__, "of", function() { return /* reexport */ es_of; });
__webpack_require__.d(__webpack_exports__, "omit", function() { return /* reexport */ es_omit; });
__webpack_require__.d(__webpack_exports__, "once", function() { return /* reexport */ es_once; });
__webpack_require__.d(__webpack_exports__, "or", function() { return /* reexport */ es_or; });
__webpack_require__.d(__webpack_exports__, "otherwise", function() { return /* reexport */ es_otherwise; });
__webpack_require__.d(__webpack_exports__, "over", function() { return /* reexport */ es_over; });
__webpack_require__.d(__webpack_exports__, "pair", function() { return /* reexport */ es_pair; });
__webpack_require__.d(__webpack_exports__, "partial", function() { return /* reexport */ es_partial; });
__webpack_require__.d(__webpack_exports__, "partialRight", function() { return /* reexport */ es_partialRight; });
__webpack_require__.d(__webpack_exports__, "partition", function() { return /* reexport */ es_partition; });
__webpack_require__.d(__webpack_exports__, "path", function() { return /* reexport */ es_path; });
__webpack_require__.d(__webpack_exports__, "paths", function() { return /* reexport */ es_paths; });
__webpack_require__.d(__webpack_exports__, "pathEq", function() { return /* reexport */ es_pathEq; });
__webpack_require__.d(__webpack_exports__, "pathOr", function() { return /* reexport */ es_pathOr; });
__webpack_require__.d(__webpack_exports__, "pathSatisfies", function() { return /* reexport */ es_pathSatisfies; });
__webpack_require__.d(__webpack_exports__, "pick", function() { return /* reexport */ es_pick; });
__webpack_require__.d(__webpack_exports__, "pickAll", function() { return /* reexport */ es_pickAll; });
__webpack_require__.d(__webpack_exports__, "pickBy", function() { return /* reexport */ es_pickBy; });
__webpack_require__.d(__webpack_exports__, "pipe", function() { return /* reexport */ pipe; });
__webpack_require__.d(__webpack_exports__, "pipeK", function() { return /* reexport */ pipeK; });
__webpack_require__.d(__webpack_exports__, "pipeP", function() { return /* reexport */ pipeP; });
__webpack_require__.d(__webpack_exports__, "pipeWith", function() { return /* reexport */ es_pipeWith; });
__webpack_require__.d(__webpack_exports__, "pluck", function() { return /* reexport */ es_pluck; });
__webpack_require__.d(__webpack_exports__, "prepend", function() { return /* reexport */ es_prepend; });
__webpack_require__.d(__webpack_exports__, "product", function() { return /* reexport */ es_product; });
__webpack_require__.d(__webpack_exports__, "project", function() { return /* reexport */ es_project; });
__webpack_require__.d(__webpack_exports__, "prop", function() { return /* reexport */ es_prop; });
__webpack_require__.d(__webpack_exports__, "propEq", function() { return /* reexport */ es_propEq; });
__webpack_require__.d(__webpack_exports__, "propIs", function() { return /* reexport */ es_propIs; });
__webpack_require__.d(__webpack_exports__, "propOr", function() { return /* reexport */ es_propOr; });
__webpack_require__.d(__webpack_exports__, "propSatisfies", function() { return /* reexport */ es_propSatisfies; });
__webpack_require__.d(__webpack_exports__, "props", function() { return /* reexport */ es_props; });
__webpack_require__.d(__webpack_exports__, "range", function() { return /* reexport */ es_range; });
__webpack_require__.d(__webpack_exports__, "reduce", function() { return /* reexport */ es_reduce; });
__webpack_require__.d(__webpack_exports__, "reduceBy", function() { return /* reexport */ es_reduceBy; });
__webpack_require__.d(__webpack_exports__, "reduceRight", function() { return /* reexport */ es_reduceRight; });
__webpack_require__.d(__webpack_exports__, "reduceWhile", function() { return /* reexport */ es_reduceWhile; });
__webpack_require__.d(__webpack_exports__, "reduced", function() { return /* reexport */ es_reduced; });
__webpack_require__.d(__webpack_exports__, "reject", function() { return /* reexport */ es_reject; });
__webpack_require__.d(__webpack_exports__, "remove", function() { return /* reexport */ es_remove; });
__webpack_require__.d(__webpack_exports__, "repeat", function() { return /* reexport */ es_repeat; });
__webpack_require__.d(__webpack_exports__, "replace", function() { return /* reexport */ es_replace; });
__webpack_require__.d(__webpack_exports__, "reverse", function() { return /* reexport */ es_reverse; });
__webpack_require__.d(__webpack_exports__, "scan", function() { return /* reexport */ es_scan; });
__webpack_require__.d(__webpack_exports__, "sequence", function() { return /* reexport */ es_sequence; });
__webpack_require__.d(__webpack_exports__, "set", function() { return /* reexport */ es_set; });
__webpack_require__.d(__webpack_exports__, "slice", function() { return /* reexport */ es_slice; });
__webpack_require__.d(__webpack_exports__, "sort", function() { return /* reexport */ es_sort; });
__webpack_require__.d(__webpack_exports__, "sortBy", function() { return /* reexport */ es_sortBy; });
__webpack_require__.d(__webpack_exports__, "sortWith", function() { return /* reexport */ es_sortWith; });
__webpack_require__.d(__webpack_exports__, "split", function() { return /* reexport */ es_split; });
__webpack_require__.d(__webpack_exports__, "splitAt", function() { return /* reexport */ es_splitAt; });
__webpack_require__.d(__webpack_exports__, "splitEvery", function() { return /* reexport */ es_splitEvery; });
__webpack_require__.d(__webpack_exports__, "splitWhen", function() { return /* reexport */ es_splitWhen; });
__webpack_require__.d(__webpack_exports__, "startsWith", function() { return /* reexport */ es_startsWith; });
__webpack_require__.d(__webpack_exports__, "subtract", function() { return /* reexport */ es_subtract; });
__webpack_require__.d(__webpack_exports__, "sum", function() { return /* reexport */ es_sum; });
__webpack_require__.d(__webpack_exports__, "symmetricDifference", function() { return /* reexport */ es_symmetricDifference; });
__webpack_require__.d(__webpack_exports__, "symmetricDifferenceWith", function() { return /* reexport */ es_symmetricDifferenceWith; });
__webpack_require__.d(__webpack_exports__, "tail", function() { return /* reexport */ es_tail; });
__webpack_require__.d(__webpack_exports__, "take", function() { return /* reexport */ es_take; });
__webpack_require__.d(__webpack_exports__, "takeLast", function() { return /* reexport */ es_takeLast; });
__webpack_require__.d(__webpack_exports__, "takeLastWhile", function() { return /* reexport */ es_takeLastWhile; });
__webpack_require__.d(__webpack_exports__, "takeWhile", function() { return /* reexport */ es_takeWhile; });
__webpack_require__.d(__webpack_exports__, "tap", function() { return /* reexport */ es_tap; });
__webpack_require__.d(__webpack_exports__, "test", function() { return /* reexport */ es_test; });
__webpack_require__.d(__webpack_exports__, "andThen", function() { return /* reexport */ es_andThen; });
__webpack_require__.d(__webpack_exports__, "times", function() { return /* reexport */ es_times; });
__webpack_require__.d(__webpack_exports__, "toLower", function() { return /* reexport */ es_toLower; });
__webpack_require__.d(__webpack_exports__, "toPairs", function() { return /* reexport */ es_toPairs; });
__webpack_require__.d(__webpack_exports__, "toPairsIn", function() { return /* reexport */ es_toPairsIn; });
__webpack_require__.d(__webpack_exports__, "toString", function() { return /* reexport */ es_toString; });
__webpack_require__.d(__webpack_exports__, "toUpper", function() { return /* reexport */ es_toUpper; });
__webpack_require__.d(__webpack_exports__, "transduce", function() { return /* reexport */ es_transduce; });
__webpack_require__.d(__webpack_exports__, "transpose", function() { return /* reexport */ es_transpose; });
__webpack_require__.d(__webpack_exports__, "traverse", function() { return /* reexport */ es_traverse; });
__webpack_require__.d(__webpack_exports__, "trim", function() { return /* reexport */ es_trim; });
__webpack_require__.d(__webpack_exports__, "tryCatch", function() { return /* reexport */ es_tryCatch; });
__webpack_require__.d(__webpack_exports__, "type", function() { return /* reexport */ es_type; });
__webpack_require__.d(__webpack_exports__, "unapply", function() { return /* reexport */ es_unapply; });
__webpack_require__.d(__webpack_exports__, "unary", function() { return /* reexport */ es_unary; });
__webpack_require__.d(__webpack_exports__, "uncurryN", function() { return /* reexport */ es_uncurryN; });
__webpack_require__.d(__webpack_exports__, "unfold", function() { return /* reexport */ es_unfold; });
__webpack_require__.d(__webpack_exports__, "union", function() { return /* reexport */ es_union; });
__webpack_require__.d(__webpack_exports__, "unionWith", function() { return /* reexport */ es_unionWith; });
__webpack_require__.d(__webpack_exports__, "uniq", function() { return /* reexport */ es_uniq; });
__webpack_require__.d(__webpack_exports__, "uniqBy", function() { return /* reexport */ es_uniqBy; });
__webpack_require__.d(__webpack_exports__, "uniqWith", function() { return /* reexport */ es_uniqWith; });
__webpack_require__.d(__webpack_exports__, "unless", function() { return /* reexport */ es_unless; });
__webpack_require__.d(__webpack_exports__, "unnest", function() { return /* reexport */ es_unnest; });
__webpack_require__.d(__webpack_exports__, "until", function() { return /* reexport */ es_until; });
__webpack_require__.d(__webpack_exports__, "update", function() { return /* reexport */ es_update; });
__webpack_require__.d(__webpack_exports__, "useWith", function() { return /* reexport */ es_useWith; });
__webpack_require__.d(__webpack_exports__, "values", function() { return /* reexport */ es_values; });
__webpack_require__.d(__webpack_exports__, "valuesIn", function() { return /* reexport */ es_valuesIn; });
__webpack_require__.d(__webpack_exports__, "view", function() { return /* reexport */ es_view; });
__webpack_require__.d(__webpack_exports__, "when", function() { return /* reexport */ es_when; });
__webpack_require__.d(__webpack_exports__, "where", function() { return /* reexport */ es_where; });
__webpack_require__.d(__webpack_exports__, "whereEq", function() { return /* reexport */ es_whereEq; });
__webpack_require__.d(__webpack_exports__, "without", function() { return /* reexport */ es_without; });
__webpack_require__.d(__webpack_exports__, "xor", function() { return /* reexport */ es_xor; });
__webpack_require__.d(__webpack_exports__, "xprod", function() { return /* reexport */ es_xprod; });
__webpack_require__.d(__webpack_exports__, "zip", function() { return /* reexport */ es_zip; });
__webpack_require__.d(__webpack_exports__, "zipObj", function() { return /* reexport */ es_zipObj; });
__webpack_require__.d(__webpack_exports__, "zipWith", function() { return /* reexport */ es_zipWith; });
__webpack_require__.d(__webpack_exports__, "thunkify", function() { return /* reexport */ es_thunkify; });

// CONCATENATED MODULE: ./node_modules/ramda/es/F.js
/**
 * A function that always returns `false`. Any passed in parameters are ignored.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Function
 * @sig * -> Boolean
 * @param {*}
 * @return {Boolean}
 * @see R.T
 * @example
 *
 *      R.F(); //=> false
 */
var F = function () {
  return false;
};

/* harmony default export */ var es_F = (F);
// CONCATENATED MODULE: ./node_modules/ramda/es/T.js
/**
 * A function that always returns `true`. Any passed in parameters are ignored.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Function
 * @sig * -> Boolean
 * @param {*}
 * @return {Boolean}
 * @see R.F
 * @example
 *
 *      R.T(); //=> true
 */
var T = function () {
  return true;
};

/* harmony default export */ var es_T = (T);
// CONCATENATED MODULE: ./node_modules/ramda/es/__.js
/**
 * A special placeholder value used to specify "gaps" within curried functions,
 * allowing partial application of any combination of arguments, regardless of
 * their positions.
 *
 * If `g` is a curried ternary function and `_` is `R.__`, the following are
 * equivalent:
 *
 *   - `g(1, 2, 3)`
 *   - `g(_, 2, 3)(1)`
 *   - `g(_, _, 3)(1)(2)`
 *   - `g(_, _, 3)(1, 2)`
 *   - `g(_, 2, _)(1, 3)`
 *   - `g(_, 2)(1)(3)`
 *   - `g(_, 2)(1, 3)`
 *   - `g(_, 2)(_, 3)(1)`
 *
 * @name __
 * @constant
 * @memberOf R
 * @since v0.6.0
 * @category Function
 * @example
 *
 *      const greet = R.replace('{name}', R.__, 'Hello, {name}!');
 *      greet('Alice'); //=> 'Hello, Alice!'
 */
/* harmony default export */ var _ = ({
  '@@functional/placeholder': true
});
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isPlaceholder.js
function _isPlaceholder(a) {
  return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_curry1.js

/**
 * Optimized internal one-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */

function _curry1(fn) {
  return function f1(a) {
    if (arguments.length === 0 || _isPlaceholder(a)) {
      return f1;
    } else {
      return fn.apply(this, arguments);
    }
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_curry2.js


/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */

function _curry2(fn) {
  return function f2(a, b) {
    switch (arguments.length) {
      case 0:
        return f2;

      case 1:
        return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
          return fn(a, _b);
        });

      default:
        return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
          return fn(_a, b);
        }) : _isPlaceholder(b) ? _curry1(function (_b) {
          return fn(a, _b);
        }) : fn(a, b);
    }
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/add.js

/**
 * Adds two values.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 * @see R.subtract
 * @example
 *
 *      R.add(2, 3);       //=>  5
 *      R.add(7)(10);      //=> 17
 */

var add =
/*#__PURE__*/
_curry2(function add(a, b) {
  return Number(a) + Number(b);
});

/* harmony default export */ var es_add = (add);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_concat.js
/**
 * Private `concat` function to merge two array-like objects.
 *
 * @private
 * @param {Array|Arguments} [set1=[]] An array-like object.
 * @param {Array|Arguments} [set2=[]] An array-like object.
 * @return {Array} A new, merged array.
 * @example
 *
 *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
 */
function _concat(set1, set2) {
  set1 = set1 || [];
  set2 = set2 || [];
  var idx;
  var len1 = set1.length;
  var len2 = set2.length;
  var result = [];
  idx = 0;

  while (idx < len1) {
    result[result.length] = set1[idx];
    idx += 1;
  }

  idx = 0;

  while (idx < len2) {
    result[result.length] = set2[idx];
    idx += 1;
  }

  return result;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_arity.js
function _arity(n, fn) {
  /* eslint-disable no-unused-vars */
  switch (n) {
    case 0:
      return function () {
        return fn.apply(this, arguments);
      };

    case 1:
      return function (a0) {
        return fn.apply(this, arguments);
      };

    case 2:
      return function (a0, a1) {
        return fn.apply(this, arguments);
      };

    case 3:
      return function (a0, a1, a2) {
        return fn.apply(this, arguments);
      };

    case 4:
      return function (a0, a1, a2, a3) {
        return fn.apply(this, arguments);
      };

    case 5:
      return function (a0, a1, a2, a3, a4) {
        return fn.apply(this, arguments);
      };

    case 6:
      return function (a0, a1, a2, a3, a4, a5) {
        return fn.apply(this, arguments);
      };

    case 7:
      return function (a0, a1, a2, a3, a4, a5, a6) {
        return fn.apply(this, arguments);
      };

    case 8:
      return function (a0, a1, a2, a3, a4, a5, a6, a7) {
        return fn.apply(this, arguments);
      };

    case 9:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
        return fn.apply(this, arguments);
      };

    case 10:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        return fn.apply(this, arguments);
      };

    default:
      throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
  }
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_curryN.js


/**
 * Internal curryN function.
 *
 * @private
 * @category Function
 * @param {Number} length The arity of the curried function.
 * @param {Array} received An array of arguments received thus far.
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */

function _curryN(length, received, fn) {
  return function () {
    var combined = [];
    var argsIdx = 0;
    var left = length;
    var combinedIdx = 0;

    while (combinedIdx < received.length || argsIdx < arguments.length) {
      var result;

      if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
        result = received[combinedIdx];
      } else {
        result = arguments[argsIdx];
        argsIdx += 1;
      }

      combined[combinedIdx] = result;

      if (!_isPlaceholder(result)) {
        left -= 1;
      }

      combinedIdx += 1;
    }

    return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/curryN.js




/**
 * Returns a curried equivalent of the provided function, with the specified
 * arity. The curried function has two unusual capabilities. First, its
 * arguments needn't be provided one at a time. If `g` is `R.curryN(3, f)`, the
 * following are equivalent:
 *
 *   - `g(1)(2)(3)`
 *   - `g(1)(2, 3)`
 *   - `g(1, 2)(3)`
 *   - `g(1, 2, 3)`
 *
 * Secondly, the special placeholder value [`R.__`](#__) may be used to specify
 * "gaps", allowing partial application of any combination of arguments,
 * regardless of their positions. If `g` is as above and `_` is [`R.__`](#__),
 * the following are equivalent:
 *
 *   - `g(1, 2, 3)`
 *   - `g(_, 2, 3)(1)`
 *   - `g(_, _, 3)(1)(2)`
 *   - `g(_, _, 3)(1, 2)`
 *   - `g(_, 2)(1)(3)`
 *   - `g(_, 2)(1, 3)`
 *   - `g(_, 2)(_, 3)(1)`
 *
 * @func
 * @memberOf R
 * @since v0.5.0
 * @category Function
 * @sig Number -> (* -> a) -> (* -> a)
 * @param {Number} length The arity for the returned function.
 * @param {Function} fn The function to curry.
 * @return {Function} A new, curried function.
 * @see R.curry
 * @example
 *
 *      const sumArgs = (...args) => R.sum(args);
 *
 *      const curriedAddFourNumbers = R.curryN(4, sumArgs);
 *      const f = curriedAddFourNumbers(1, 2);
 *      const g = f(3);
 *      g(4); //=> 10
 */

var curryN_curryN =
/*#__PURE__*/
_curry2(function curryN(length, fn) {
  if (length === 1) {
    return _curry1(fn);
  }

  return _arity(length, _curryN(length, [], fn));
});

/* harmony default export */ var es_curryN = (curryN_curryN);
// CONCATENATED MODULE: ./node_modules/ramda/es/addIndex.js



/**
 * Creates a new list iteration function from an existing one by adding two new
 * parameters to its callback function: the current index, and the entire list.
 *
 * This would turn, for instance, [`R.map`](#map) function into one that
 * more closely resembles `Array.prototype.map`. Note that this will only work
 * for functions in which the iteration callback function is the first
 * parameter, and where the list is the last parameter. (This latter might be
 * unimportant if the list parameter is not used.)
 *
 * @func
 * @memberOf R
 * @since v0.15.0
 * @category Function
 * @category List
 * @sig ((a ... -> b) ... -> [a] -> *) -> ((a ..., Int, [a] -> b) ... -> [a] -> *)
 * @param {Function} fn A list iteration function that does not pass index or list to its callback
 * @return {Function} An altered list iteration function that passes (item, index, list) to its callback
 * @example
 *
 *      const mapIndexed = R.addIndex(R.map);
 *      mapIndexed((val, idx) => idx + '-' + val, ['f', 'o', 'o', 'b', 'a', 'r']);
 *      //=> ['0-f', '1-o', '2-o', '3-b', '4-a', '5-r']
 */

var addIndex_addIndex =
/*#__PURE__*/
_curry1(function addIndex(fn) {
  return es_curryN(fn.length, function () {
    var idx = 0;
    var origFn = arguments[0];
    var list = arguments[arguments.length - 1];
    var args = Array.prototype.slice.call(arguments, 0);

    args[0] = function () {
      var result = origFn.apply(this, _concat(arguments, [idx, list]));
      idx += 1;
      return result;
    };

    return fn.apply(this, args);
  });
});

/* harmony default export */ var es_addIndex = (addIndex_addIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_curry3.js



/**
 * Optimized internal three-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */

function _curry3(fn) {
  return function f3(a, b, c) {
    switch (arguments.length) {
      case 0:
        return f3;

      case 1:
        return _isPlaceholder(a) ? f3 : _curry2(function (_b, _c) {
          return fn(a, _b, _c);
        });

      case 2:
        return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function (_a, _c) {
          return fn(_a, b, _c);
        }) : _isPlaceholder(b) ? _curry2(function (_b, _c) {
          return fn(a, _b, _c);
        }) : _curry1(function (_c) {
          return fn(a, b, _c);
        });

      default:
        return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function (_a, _b) {
          return fn(_a, _b, c);
        }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function (_a, _c) {
          return fn(_a, b, _c);
        }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function (_b, _c) {
          return fn(a, _b, _c);
        }) : _isPlaceholder(a) ? _curry1(function (_a) {
          return fn(_a, b, c);
        }) : _isPlaceholder(b) ? _curry1(function (_b) {
          return fn(a, _b, c);
        }) : _isPlaceholder(c) ? _curry1(function (_c) {
          return fn(a, b, _c);
        }) : fn(a, b, c);
    }
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/adjust.js


/**
 * Applies a function to the value at the given index of an array, returning a
 * new copy of the array with the element at the given index replaced with the
 * result of the function application.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category List
 * @sig Number -> (a -> a) -> [a] -> [a]
 * @param {Number} idx The index.
 * @param {Function} fn The function to apply.
 * @param {Array|Arguments} list An array-like object whose value
 *        at the supplied index will be replaced.
 * @return {Array} A copy of the supplied array-like object with
 *         the element at index `idx` replaced with the value
 *         returned by applying `fn` to the existing element.
 * @see R.update
 * @example
 *
 *      R.adjust(1, R.toUpper, ['a', 'b', 'c', 'd']);      //=> ['a', 'B', 'c', 'd']
 *      R.adjust(-1, R.toUpper, ['a', 'b', 'c', 'd']);     //=> ['a', 'b', 'c', 'D']
 * @symb R.adjust(-1, f, [a, b]) = [a, f(b)]
 * @symb R.adjust(0, f, [a, b]) = [f(a), b]
 */

var adjust_adjust =
/*#__PURE__*/
_curry3(function adjust(idx, fn, list) {
  if (idx >= list.length || idx < -list.length) {
    return list;
  }

  var start = idx < 0 ? list.length : 0;

  var _idx = start + idx;

  var _list = _concat(list);

  _list[_idx] = fn(list[_idx]);
  return _list;
});

/* harmony default export */ var es_adjust = (adjust_adjust);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isArray.js
/**
 * Tests whether or not an object is an array.
 *
 * @private
 * @param {*} val The object to test.
 * @return {Boolean} `true` if `val` is an array, `false` otherwise.
 * @example
 *
 *      _isArray([]); //=> true
 *      _isArray(null); //=> false
 *      _isArray({}); //=> false
 */
/* harmony default export */ var _isArray = (Array.isArray || function _isArray(val) {
  return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
});
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isTransformer.js
function _isTransformer(obj) {
  return obj != null && typeof obj['@@transducer/step'] === 'function';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_dispatchable.js


/**
 * Returns a function that dispatches with different strategies based on the
 * object in list position (last argument). If it is an array, executes [fn].
 * Otherwise, if it has a function with one of the given method names, it will
 * execute that function (functor case). Otherwise, if it is a transformer,
 * uses transducer [xf] to return a new transformer (transducer case).
 * Otherwise, it will default to executing [fn].
 *
 * @private
 * @param {Array} methodNames properties to check for a custom implementation
 * @param {Function} xf transducer to initialize if object is transformer
 * @param {Function} fn default ramda implementation
 * @return {Function} A function that dispatches on object in list position
 */

function _dispatchable(methodNames, xf, fn) {
  return function () {
    if (arguments.length === 0) {
      return fn();
    }

    var args = Array.prototype.slice.call(arguments, 0);
    var obj = args.pop();

    if (!_isArray(obj)) {
      var idx = 0;

      while (idx < methodNames.length) {
        if (typeof obj[methodNames[idx]] === 'function') {
          return obj[methodNames[idx]].apply(obj, args);
        }

        idx += 1;
      }

      if (_isTransformer(obj)) {
        var transducer = xf.apply(null, args);
        return transducer(obj);
      }
    }

    return fn.apply(this, arguments);
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_reduced.js
function _reduced(x) {
  return x && x['@@transducer/reduced'] ? x : {
    '@@transducer/value': x,
    '@@transducer/reduced': true
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfBase.js
/* harmony default export */ var _xfBase = ({
  init: function () {
    return this.xf['@@transducer/init']();
  },
  result: function (result) {
    return this.xf['@@transducer/result'](result);
  }
});
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xall.js




var _xall_XAll =
/*#__PURE__*/
function () {
  function XAll(f, xf) {
    this.xf = xf;
    this.f = f;
    this.all = true;
  }

  XAll.prototype['@@transducer/init'] = _xfBase.init;

  XAll.prototype['@@transducer/result'] = function (result) {
    if (this.all) {
      result = this.xf['@@transducer/step'](result, true);
    }

    return this.xf['@@transducer/result'](result);
  };

  XAll.prototype['@@transducer/step'] = function (result, input) {
    if (!this.f(input)) {
      this.all = false;
      result = _reduced(this.xf['@@transducer/step'](result, false));
    }

    return result;
  };

  return XAll;
}();

var _xall =
/*#__PURE__*/
_curry2(function _xall(f, xf) {
  return new _xall_XAll(f, xf);
});

/* harmony default export */ var internal_xall = (_xall);
// CONCATENATED MODULE: ./node_modules/ramda/es/all.js



/**
 * Returns `true` if all elements of the list match the predicate, `false` if
 * there are any that don't.
 *
 * Dispatches to the `all` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> Boolean
 * @param {Function} fn The predicate function.
 * @param {Array} list The array to consider.
 * @return {Boolean} `true` if the predicate is satisfied by every element, `false`
 *         otherwise.
 * @see R.any, R.none, R.transduce
 * @example
 *
 *      const equals3 = R.equals(3);
 *      R.all(equals3)([3, 3, 3, 3]); //=> true
 *      R.all(equals3)([3, 3, 1, 3]); //=> false
 */

var all_all =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['all'], internal_xall, function all(fn, list) {
  var idx = 0;

  while (idx < list.length) {
    if (!fn(list[idx])) {
      return false;
    }

    idx += 1;
  }

  return true;
}));

/* harmony default export */ var es_all = (all_all);
// CONCATENATED MODULE: ./node_modules/ramda/es/max.js

/**
 * Returns the larger of its two arguments.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> a
 * @param {*} a
 * @param {*} b
 * @return {*}
 * @see R.maxBy, R.min
 * @example
 *
 *      R.max(789, 123); //=> 789
 *      R.max('a', 'b'); //=> 'b'
 */

var max =
/*#__PURE__*/
_curry2(function max(a, b) {
  return b > a ? b : a;
});

/* harmony default export */ var es_max = (max);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_map.js
function _map(fn, functor) {
  var idx = 0;
  var len = functor.length;
  var result = Array(len);

  while (idx < len) {
    result[idx] = fn(functor[idx]);
    idx += 1;
  }

  return result;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isString.js
function _isString(x) {
  return Object.prototype.toString.call(x) === '[object String]';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isArrayLike.js



/**
 * Tests whether or not an object is similar to an array.
 *
 * @private
 * @category Type
 * @category List
 * @sig * -> Boolean
 * @param {*} x The object to test.
 * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
 * @example
 *
 *      _isArrayLike([]); //=> true
 *      _isArrayLike(true); //=> false
 *      _isArrayLike({}); //=> false
 *      _isArrayLike({length: 10}); //=> false
 *      _isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
 */

var _isArrayLike =
/*#__PURE__*/
_curry1(function isArrayLike(x) {
  if (_isArray(x)) {
    return true;
  }

  if (!x) {
    return false;
  }

  if (typeof x !== 'object') {
    return false;
  }

  if (_isString(x)) {
    return false;
  }

  if (x.nodeType === 1) {
    return !!x.length;
  }

  if (x.length === 0) {
    return true;
  }

  if (x.length > 0) {
    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
  }

  return false;
});

/* harmony default export */ var internal_isArrayLike = (_isArrayLike);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xwrap.js
var XWrap =
/*#__PURE__*/
function () {
  function XWrap(fn) {
    this.f = fn;
  }

  XWrap.prototype['@@transducer/init'] = function () {
    throw new Error('init not implemented on XWrap');
  };

  XWrap.prototype['@@transducer/result'] = function (acc) {
    return acc;
  };

  XWrap.prototype['@@transducer/step'] = function (acc, x) {
    return this.f(acc, x);
  };

  return XWrap;
}();

function _xwrap(fn) {
  return new XWrap(fn);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/bind.js


/**
 * Creates a function that is bound to a context.
 * Note: `R.bind` does not provide the additional argument-binding capabilities of
 * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
 *
 * @func
 * @memberOf R
 * @since v0.6.0
 * @category Function
 * @category Object
 * @sig (* -> *) -> {*} -> (* -> *)
 * @param {Function} fn The function to bind to context
 * @param {Object} thisObj The context to bind `fn` to
 * @return {Function} A function that will execute in the context of `thisObj`.
 * @see R.partial
 * @example
 *
 *      const log = R.bind(console.log, console);
 *      R.pipe(R.assoc('a', 2), R.tap(log), R.assoc('a', 3))({a: 1}); //=> {a: 3}
 *      // logs {a: 2}
 * @symb R.bind(f, o)(a, b) = f.call(o, a, b)
 */

var bind_bind =
/*#__PURE__*/
_curry2(function bind(fn, thisObj) {
  return _arity(fn.length, function () {
    return fn.apply(thisObj, arguments);
  });
});

/* harmony default export */ var es_bind = (bind_bind);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_reduce.js




function _arrayReduce(xf, acc, list) {
  var idx = 0;
  var len = list.length;

  while (idx < len) {
    acc = xf['@@transducer/step'](acc, list[idx]);

    if (acc && acc['@@transducer/reduced']) {
      acc = acc['@@transducer/value'];
      break;
    }

    idx += 1;
  }

  return xf['@@transducer/result'](acc);
}

function _iterableReduce(xf, acc, iter) {
  var step = iter.next();

  while (!step.done) {
    acc = xf['@@transducer/step'](acc, step.value);

    if (acc && acc['@@transducer/reduced']) {
      acc = acc['@@transducer/value'];
      break;
    }

    step = iter.next();
  }

  return xf['@@transducer/result'](acc);
}

function _methodReduce(xf, acc, obj, methodName) {
  return xf['@@transducer/result'](obj[methodName](es_bind(xf['@@transducer/step'], xf), acc));
}

var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
function _reduce(fn, acc, list) {
  if (typeof fn === 'function') {
    fn = _xwrap(fn);
  }

  if (internal_isArrayLike(list)) {
    return _arrayReduce(fn, acc, list);
  }

  if (typeof list['fantasy-land/reduce'] === 'function') {
    return _methodReduce(fn, acc, list, 'fantasy-land/reduce');
  }

  if (list[symIterator] != null) {
    return _iterableReduce(fn, acc, list[symIterator]());
  }

  if (typeof list.next === 'function') {
    return _iterableReduce(fn, acc, list);
  }

  if (typeof list.reduce === 'function') {
    return _methodReduce(fn, acc, list, 'reduce');
  }

  throw new TypeError('reduce: list must be array or iterable');
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xmap.js



var _xmap_XMap =
/*#__PURE__*/
function () {
  function XMap(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XMap.prototype['@@transducer/init'] = _xfBase.init;
  XMap.prototype['@@transducer/result'] = _xfBase.result;

  XMap.prototype['@@transducer/step'] = function (result, input) {
    return this.xf['@@transducer/step'](result, this.f(input));
  };

  return XMap;
}();

var _xmap =
/*#__PURE__*/
_curry2(function _xmap(f, xf) {
  return new _xmap_XMap(f, xf);
});

/* harmony default export */ var internal_xmap = (_xmap);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_has.js
function _has(prop, obj) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isArguments.js

var _isArguments_toString = Object.prototype.toString;

var _isArguments_isArguments =
/*#__PURE__*/
function () {
  return _isArguments_toString.call(arguments) === '[object Arguments]' ? function _isArguments(x) {
    return _isArguments_toString.call(x) === '[object Arguments]';
  } : function _isArguments(x) {
    return _has('callee', x);
  };
}();

/* harmony default export */ var internal_isArguments = (_isArguments_isArguments);
// CONCATENATED MODULE: ./node_modules/ramda/es/keys.js


 // cover IE < 9 keys issues

var hasEnumBug = !
/*#__PURE__*/
{
  toString: null
}.propertyIsEnumerable('toString');
var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString']; // Safari bug

var hasArgsEnumBug =
/*#__PURE__*/
function () {
  'use strict';

  return arguments.propertyIsEnumerable('length');
}();

var contains = function contains(list, item) {
  var idx = 0;

  while (idx < list.length) {
    if (list[idx] === item) {
      return true;
    }

    idx += 1;
  }

  return false;
};
/**
 * Returns a list containing the names of all the enumerable own properties of
 * the supplied object.
 * Note that the order of the output array is not guaranteed to be consistent
 * across different JS platforms.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig {k: v} -> [k]
 * @param {Object} obj The object to extract properties from
 * @return {Array} An array of the object's own properties.
 * @see R.keysIn, R.values
 * @example
 *
 *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
 */


var keys_keys = typeof Object.keys === 'function' && !hasArgsEnumBug ?
/*#__PURE__*/
_curry1(function keys(obj) {
  return Object(obj) !== obj ? [] : Object.keys(obj);
}) :
/*#__PURE__*/
_curry1(function keys(obj) {
  if (Object(obj) !== obj) {
    return [];
  }

  var prop, nIdx;
  var ks = [];

  var checkArgsLength = hasArgsEnumBug && internal_isArguments(obj);

  for (prop in obj) {
    if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
      ks[ks.length] = prop;
    }
  }

  if (hasEnumBug) {
    nIdx = nonEnumerableProps.length - 1;

    while (nIdx >= 0) {
      prop = nonEnumerableProps[nIdx];

      if (_has(prop, obj) && !contains(ks, prop)) {
        ks[ks.length] = prop;
      }

      nIdx -= 1;
    }
  }

  return ks;
});
/* harmony default export */ var es_keys = (keys_keys);
// CONCATENATED MODULE: ./node_modules/ramda/es/map.js







/**
 * Takes a function and
 * a [functor](https://github.com/fantasyland/fantasy-land#functor),
 * applies the function to each of the functor's values, and returns
 * a functor of the same shape.
 *
 * Ramda provides suitable `map` implementations for `Array` and `Object`,
 * so this function may be applied to `[1, 2, 3]` or `{x: 1, y: 2, z: 3}`.
 *
 * Dispatches to the `map` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * Also treats functions as functors and will compose them together.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Functor f => (a -> b) -> f a -> f b
 * @param {Function} fn The function to be called on every element of the input `list`.
 * @param {Array} list The list to be iterated over.
 * @return {Array} The new list.
 * @see R.transduce, R.addIndex
 * @example
 *
 *      const double = x => x * 2;
 *
 *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
 *
 *      R.map(double, {x: 1, y: 2, z: 3}); //=> {x: 2, y: 4, z: 6}
 * @symb R.map(f, [a, b]) = [f(a), f(b)]
 * @symb R.map(f, { x: a, y: b }) = { x: f(a), y: f(b) }
 * @symb R.map(f, functor_o) = functor_o.map(f)
 */

var map_map =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['fantasy-land/map', 'map'], internal_xmap, function map(fn, functor) {
  switch (Object.prototype.toString.call(functor)) {
    case '[object Function]':
      return es_curryN(functor.length, function () {
        return fn.call(this, functor.apply(this, arguments));
      });

    case '[object Object]':
      return _reduce(function (acc, key) {
        acc[key] = fn(functor[key]);
        return acc;
      }, {}, es_keys(functor));

    default:
      return _map(fn, functor);
  }
}));

/* harmony default export */ var es_map = (map_map);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isInteger.js
/**
 * Determine if the passed argument is an integer.
 *
 * @private
 * @param {*} n
 * @category Type
 * @return {Boolean}
 */
/* harmony default export */ var _isInteger = (Number.isInteger || function _isInteger(n) {
  return n << 0 === n;
});
// CONCATENATED MODULE: ./node_modules/ramda/es/nth.js


/**
 * Returns the nth element of the given list or string. If n is negative the
 * element at index length + n is returned.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Number -> [a] -> a | Undefined
 * @sig Number -> String -> String
 * @param {Number} offset
 * @param {*} list
 * @return {*}
 * @example
 *
 *      const list = ['foo', 'bar', 'baz', 'quux'];
 *      R.nth(1, list); //=> 'bar'
 *      R.nth(-1, list); //=> 'quux'
 *      R.nth(-99, list); //=> undefined
 *
 *      R.nth(2, 'abc'); //=> 'c'
 *      R.nth(3, 'abc'); //=> ''
 * @symb R.nth(-1, [a, b, c]) = c
 * @symb R.nth(0, [a, b, c]) = a
 * @symb R.nth(1, [a, b, c]) = b
 */

var nth_nth =
/*#__PURE__*/
_curry2(function nth(offset, list) {
  var idx = offset < 0 ? list.length + offset : offset;
  return _isString(list) ? list.charAt(idx) : list[idx];
});

/* harmony default export */ var es_nth = (nth_nth);
// CONCATENATED MODULE: ./node_modules/ramda/es/paths.js



/**
 * Retrieves the values at given paths of an object.
 *
 * @func
 * @memberOf R
 * @since v0.27.1
 * @category Object
 * @typedefn Idx = [String | Int]
 * @sig [Idx] -> {a} -> [a | Undefined]
 * @param {Array} pathsArray The array of paths to be fetched.
 * @param {Object} obj The object to retrieve the nested properties from.
 * @return {Array} A list consisting of values at paths specified by "pathsArray".
 * @see R.path
 * @example
 *
 *      R.paths([['a', 'b'], ['p', 0, 'q']], {a: {b: 2}, p: [{q: 3}]}); //=> [2, 3]
 *      R.paths([['a', 'b'], ['p', 'r']], {a: {b: 2}, p: [{q: 3}]}); //=> [2, undefined]
 */

var paths_paths =
/*#__PURE__*/
_curry2(function paths(pathsArray, obj) {
  return pathsArray.map(function (paths) {
    var val = obj;
    var idx = 0;
    var p;

    while (idx < paths.length) {
      if (val == null) {
        return;
      }

      p = paths[idx];
      val = _isInteger(p) ? es_nth(p, val) : val[p];
      idx += 1;
    }

    return val;
  });
});

/* harmony default export */ var es_paths = (paths_paths);
// CONCATENATED MODULE: ./node_modules/ramda/es/path.js


/**
 * Retrieve the value at a given path.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig [Idx] -> {a} -> a | Undefined
 * @param {Array} path The path to use.
 * @param {Object} obj The object to retrieve the nested property from.
 * @return {*} The data at `path`.
 * @see R.prop, R.nth
 * @example
 *
 *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
 *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
 *      R.path(['a', 'b', 0], {a: {b: [1, 2, 3]}}); //=> 1
 *      R.path(['a', 'b', -2], {a: {b: [1, 2, 3]}}); //=> 2
 */

var path_path =
/*#__PURE__*/
_curry2(function path(pathAr, obj) {
  return es_paths([pathAr], obj)[0];
});

/* harmony default export */ var es_path = (path_path);
// CONCATENATED MODULE: ./node_modules/ramda/es/prop.js


/**
 * Returns a function that when supplied an object returns the indicated
 * property of that object, if it exists.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig Idx -> {s: a} -> a | Undefined
 * @param {String|Number} p The property name or array index
 * @param {Object} obj The object to query
 * @return {*} The value at `obj.p`.
 * @see R.path, R.nth
 * @example
 *
 *      R.prop('x', {x: 100}); //=> 100
 *      R.prop('x', {}); //=> undefined
 *      R.prop(0, [100]); //=> 100
 *      R.compose(R.inc, R.prop('x'))({ x: 3 }) //=> 4
 */

var prop_prop =
/*#__PURE__*/
_curry2(function prop(p, obj) {
  return es_path([p], obj);
});

/* harmony default export */ var es_prop = (prop_prop);
// CONCATENATED MODULE: ./node_modules/ramda/es/pluck.js



/**
 * Returns a new list by plucking the same named property off all objects in
 * the list supplied.
 *
 * `pluck` will work on
 * any [functor](https://github.com/fantasyland/fantasy-land#functor) in
 * addition to arrays, as it is equivalent to `R.map(R.prop(k), f)`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Functor f => k -> f {k: v} -> f v
 * @param {Number|String} key The key name to pluck off of each object.
 * @param {Array} f The array or functor to consider.
 * @return {Array} The list of values for the given key.
 * @see R.props
 * @example
 *
 *      var getAges = R.pluck('age');
 *      getAges([{name: 'fred', age: 29}, {name: 'wilma', age: 27}]); //=> [29, 27]
 *
 *      R.pluck(0, [[1, 2], [3, 4]]);               //=> [1, 3]
 *      R.pluck('val', {a: {val: 3}, b: {val: 5}}); //=> {a: 3, b: 5}
 * @symb R.pluck('x', [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}]) = [1, 3, 5]
 * @symb R.pluck(0, [[1, 2], [3, 4], [5, 6]]) = [1, 3, 5]
 */

var pluck_pluck =
/*#__PURE__*/
_curry2(function pluck(p, list) {
  return es_map(es_prop(p), list);
});

/* harmony default export */ var es_pluck = (pluck_pluck);
// CONCATENATED MODULE: ./node_modules/ramda/es/reduce.js


/**
 * Returns a single item by iterating through the list, successively calling
 * the iterator function and passing it an accumulator value and the current
 * value from the array, and then passing the result to the next call.
 *
 * The iterator function receives two values: *(acc, value)*. It may use
 * [`R.reduced`](#reduced) to shortcut the iteration.
 *
 * The arguments' order of [`reduceRight`](#reduceRight)'s iterator function
 * is *(value, acc)*.
 *
 * Note: `R.reduce` does not skip deleted or unassigned indices (sparse
 * arrays), unlike the native `Array.prototype.reduce` method. For more details
 * on this behavior, see:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
 *
 * Dispatches to the `reduce` method of the third argument, if present. When
 * doing so, it is up to the user to handle the [`R.reduced`](#reduced)
 * shortcuting, as this is not implemented by `reduce`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig ((a, b) -> a) -> a -> [b] -> a
 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
 *        current element from the array.
 * @param {*} acc The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.reduced, R.addIndex, R.reduceRight
 * @example
 *
 *      R.reduce(R.subtract, 0, [1, 2, 3, 4]) // => ((((0 - 1) - 2) - 3) - 4) = -10
 *      //          -               -10
 *      //         / \              / \
 *      //        -   4           -6   4
 *      //       / \              / \
 *      //      -   3   ==>     -3   3
 *      //     / \              / \
 *      //    -   2           -1   2
 *      //   / \              / \
 *      //  0   1            0   1
 *
 * @symb R.reduce(f, a, [b, c, d]) = f(f(f(a, b), c), d)
 */

var reduce =
/*#__PURE__*/
_curry3(_reduce);

/* harmony default export */ var es_reduce = (reduce);
// CONCATENATED MODULE: ./node_modules/ramda/es/allPass.js





/**
 * Takes a list of predicates and returns a predicate that returns true for a
 * given list of arguments if every one of the provided predicates is satisfied
 * by those arguments.
 *
 * The function returned is a curried function whose arity matches that of the
 * highest-arity predicate.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Logic
 * @sig [(*... -> Boolean)] -> (*... -> Boolean)
 * @param {Array} predicates An array of predicates to check
 * @return {Function} The combined predicate
 * @see R.anyPass
 * @example
 *
 *      const isQueen = R.propEq('rank', 'Q');
 *      const isSpade = R.propEq('suit', '♠︎');
 *      const isQueenOfSpades = R.allPass([isQueen, isSpade]);
 *
 *      isQueenOfSpades({rank: 'Q', suit: '♣︎'}); //=> false
 *      isQueenOfSpades({rank: 'Q', suit: '♠︎'}); //=> true
 */

var allPass_allPass =
/*#__PURE__*/
_curry1(function allPass(preds) {
  return es_curryN(es_reduce(es_max, 0, es_pluck('length', preds)), function () {
    var idx = 0;
    var len = preds.length;

    while (idx < len) {
      if (!preds[idx].apply(this, arguments)) {
        return false;
      }

      idx += 1;
    }

    return true;
  });
});

/* harmony default export */ var es_allPass = (allPass_allPass);
// CONCATENATED MODULE: ./node_modules/ramda/es/always.js

/**
 * Returns a function that always returns the given value. Note that for
 * non-primitives the value returned is a reference to the original value.
 *
 * This function is known as `const`, `constant`, or `K` (for K combinator) in
 * other languages and libraries.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig a -> (* -> a)
 * @param {*} val The value to wrap in a function
 * @return {Function} A Function :: * -> val.
 * @example
 *
 *      const t = R.always('Tee');
 *      t(); //=> 'Tee'
 */

var always =
/*#__PURE__*/
_curry1(function always(val) {
  return function () {
    return val;
  };
});

/* harmony default export */ var es_always = (always);
// CONCATENATED MODULE: ./node_modules/ramda/es/and.js

/**
 * Returns `true` if both arguments are `true`; `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Logic
 * @sig a -> b -> a | b
 * @param {Any} a
 * @param {Any} b
 * @return {Any} the first argument if it is falsy, otherwise the second argument.
 * @see R.both, R.xor
 * @example
 *
 *      R.and(true, true); //=> true
 *      R.and(true, false); //=> false
 *      R.and(false, true); //=> false
 *      R.and(false, false); //=> false
 */

var and =
/*#__PURE__*/
_curry2(function and(a, b) {
  return a && b;
});

/* harmony default export */ var es_and = (and);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xany.js




var _xany_XAny =
/*#__PURE__*/
function () {
  function XAny(f, xf) {
    this.xf = xf;
    this.f = f;
    this.any = false;
  }

  XAny.prototype['@@transducer/init'] = _xfBase.init;

  XAny.prototype['@@transducer/result'] = function (result) {
    if (!this.any) {
      result = this.xf['@@transducer/step'](result, false);
    }

    return this.xf['@@transducer/result'](result);
  };

  XAny.prototype['@@transducer/step'] = function (result, input) {
    if (this.f(input)) {
      this.any = true;
      result = _reduced(this.xf['@@transducer/step'](result, true));
    }

    return result;
  };

  return XAny;
}();

var _xany =
/*#__PURE__*/
_curry2(function _xany(f, xf) {
  return new _xany_XAny(f, xf);
});

/* harmony default export */ var internal_xany = (_xany);
// CONCATENATED MODULE: ./node_modules/ramda/es/any.js



/**
 * Returns `true` if at least one of the elements of the list match the predicate,
 * `false` otherwise.
 *
 * Dispatches to the `any` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> Boolean
 * @param {Function} fn The predicate function.
 * @param {Array} list The array to consider.
 * @return {Boolean} `true` if the predicate is satisfied by at least one element, `false`
 *         otherwise.
 * @see R.all, R.none, R.transduce
 * @example
 *
 *      const lessThan0 = R.flip(R.lt)(0);
 *      const lessThan2 = R.flip(R.lt)(2);
 *      R.any(lessThan0)([1, 2]); //=> false
 *      R.any(lessThan2)([1, 2]); //=> true
 */

var any =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['any'], internal_xany, function any(fn, list) {
  var idx = 0;

  while (idx < list.length) {
    if (fn(list[idx])) {
      return true;
    }

    idx += 1;
  }

  return false;
}));

/* harmony default export */ var es_any = (any);
// CONCATENATED MODULE: ./node_modules/ramda/es/anyPass.js





/**
 * Takes a list of predicates and returns a predicate that returns true for a
 * given list of arguments if at least one of the provided predicates is
 * satisfied by those arguments.
 *
 * The function returned is a curried function whose arity matches that of the
 * highest-arity predicate.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Logic
 * @sig [(*... -> Boolean)] -> (*... -> Boolean)
 * @param {Array} predicates An array of predicates to check
 * @return {Function} The combined predicate
 * @see R.allPass
 * @example
 *
 *      const isClub = R.propEq('suit', '♣');
 *      const isSpade = R.propEq('suit', '♠');
 *      const isBlackCard = R.anyPass([isClub, isSpade]);
 *
 *      isBlackCard({rank: '10', suit: '♣'}); //=> true
 *      isBlackCard({rank: 'Q', suit: '♠'}); //=> true
 *      isBlackCard({rank: 'Q', suit: '♦'}); //=> false
 */

var anyPass_anyPass =
/*#__PURE__*/
_curry1(function anyPass(preds) {
  return es_curryN(es_reduce(es_max, 0, es_pluck('length', preds)), function () {
    var idx = 0;
    var len = preds.length;

    while (idx < len) {
      if (preds[idx].apply(this, arguments)) {
        return true;
      }

      idx += 1;
    }

    return false;
  });
});

/* harmony default export */ var es_anyPass = (anyPass_anyPass);
// CONCATENATED MODULE: ./node_modules/ramda/es/ap.js




/**
 * ap applies a list of functions to a list of values.
 *
 * Dispatches to the `ap` method of the second argument, if present. Also
 * treats curried functions as applicatives.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category Function
 * @sig [a -> b] -> [a] -> [b]
 * @sig Apply f => f (a -> b) -> f a -> f b
 * @sig (r -> a -> b) -> (r -> a) -> (r -> b)
 * @param {*} applyF
 * @param {*} applyX
 * @return {*}
 * @example
 *
 *      R.ap([R.multiply(2), R.add(3)], [1,2,3]); //=> [2, 4, 6, 4, 5, 6]
 *      R.ap([R.concat('tasty '), R.toUpper], ['pizza', 'salad']); //=> ["tasty pizza", "tasty salad", "PIZZA", "SALAD"]
 *
 *      // R.ap can also be used as S combinator
 *      // when only two functions are passed
 *      R.ap(R.concat, R.toUpper)('Ramda') //=> 'RamdaRAMDA'
 * @symb R.ap([f, g], [a, b]) = [f(a), f(b), g(a), g(b)]
 */

var ap_ap =
/*#__PURE__*/
_curry2(function ap(applyF, applyX) {
  return typeof applyX['fantasy-land/ap'] === 'function' ? applyX['fantasy-land/ap'](applyF) : typeof applyF.ap === 'function' ? applyF.ap(applyX) : typeof applyF === 'function' ? function (x) {
    return applyF(x)(applyX(x));
  } : _reduce(function (acc, f) {
    return _concat(acc, es_map(f, applyX));
  }, [], applyF);
});

/* harmony default export */ var es_ap = (ap_ap);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_aperture.js
function _aperture(n, list) {
  var idx = 0;
  var limit = list.length - (n - 1);
  var acc = new Array(limit >= 0 ? limit : 0);

  while (idx < limit) {
    acc[idx] = Array.prototype.slice.call(list, idx, idx + n);
    idx += 1;
  }

  return acc;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xaperture.js




var _xaperture_XAperture =
/*#__PURE__*/
function () {
  function XAperture(n, xf) {
    this.xf = xf;
    this.pos = 0;
    this.full = false;
    this.acc = new Array(n);
  }

  XAperture.prototype['@@transducer/init'] = _xfBase.init;

  XAperture.prototype['@@transducer/result'] = function (result) {
    this.acc = null;
    return this.xf['@@transducer/result'](result);
  };

  XAperture.prototype['@@transducer/step'] = function (result, input) {
    this.store(input);
    return this.full ? this.xf['@@transducer/step'](result, this.getCopy()) : result;
  };

  XAperture.prototype.store = function (input) {
    this.acc[this.pos] = input;
    this.pos += 1;

    if (this.pos === this.acc.length) {
      this.pos = 0;
      this.full = true;
    }
  };

  XAperture.prototype.getCopy = function () {
    return _concat(Array.prototype.slice.call(this.acc, this.pos), Array.prototype.slice.call(this.acc, 0, this.pos));
  };

  return XAperture;
}();

var _xaperture =
/*#__PURE__*/
_curry2(function _xaperture(n, xf) {
  return new _xaperture_XAperture(n, xf);
});

/* harmony default export */ var internal_xaperture = (_xaperture);
// CONCATENATED MODULE: ./node_modules/ramda/es/aperture.js




/**
 * Returns a new list, composed of n-tuples of consecutive elements. If `n` is
 * greater than the length of the list, an empty list is returned.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category List
 * @sig Number -> [a] -> [[a]]
 * @param {Number} n The size of the tuples to create
 * @param {Array} list The list to split into `n`-length tuples
 * @return {Array} The resulting list of `n`-length tuples
 * @see R.transduce
 * @example
 *
 *      R.aperture(2, [1, 2, 3, 4, 5]); //=> [[1, 2], [2, 3], [3, 4], [4, 5]]
 *      R.aperture(3, [1, 2, 3, 4, 5]); //=> [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 *      R.aperture(7, [1, 2, 3, 4, 5]); //=> []
 */

var aperture =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xaperture, _aperture));

/* harmony default export */ var es_aperture = (aperture);
// CONCATENATED MODULE: ./node_modules/ramda/es/append.js


/**
 * Returns a new list containing the contents of the given list, followed by
 * the given element.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig a -> [a] -> [a]
 * @param {*} el The element to add to the end of the new list.
 * @param {Array} list The list of elements to add a new item to.
 *        list.
 * @return {Array} A new list containing the elements of the old list followed by `el`.
 * @see R.prepend
 * @example
 *
 *      R.append('tests', ['write', 'more']); //=> ['write', 'more', 'tests']
 *      R.append('tests', []); //=> ['tests']
 *      R.append(['tests'], ['write', 'more']); //=> ['write', 'more', ['tests']]
 */

var append_append =
/*#__PURE__*/
_curry2(function append(el, list) {
  return _concat(list, [el]);
});

/* harmony default export */ var es_append = (append_append);
// CONCATENATED MODULE: ./node_modules/ramda/es/apply.js

/**
 * Applies function `fn` to the argument list `args`. This is useful for
 * creating a fixed-arity function from a variadic function. `fn` should be a
 * bound function if context is significant.
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Function
 * @sig (*... -> a) -> [*] -> a
 * @param {Function} fn The function which will be called with `args`
 * @param {Array} args The arguments to call `fn` with
 * @return {*} result The result, equivalent to `fn(...args)`
 * @see R.call, R.unapply
 * @example
 *
 *      const nums = [1, 2, 3, -99, 42, 6, 7];
 *      R.apply(Math.max, nums); //=> 42
 * @symb R.apply(f, [a, b, c]) = f(a, b, c)
 */

var apply =
/*#__PURE__*/
_curry2(function apply(fn, args) {
  return fn.apply(this, args);
});

/* harmony default export */ var es_apply = (apply);
// CONCATENATED MODULE: ./node_modules/ramda/es/values.js


/**
 * Returns a list of all the enumerable own properties of the supplied object.
 * Note that the order of the output array is not guaranteed across different
 * JS platforms.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig {k: v} -> [v]
 * @param {Object} obj The object to extract values from
 * @return {Array} An array of the values of the object's own properties.
 * @see R.valuesIn, R.keys
 * @example
 *
 *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
 */

var values_values =
/*#__PURE__*/
_curry1(function values(obj) {
  var props = es_keys(obj);
  var len = props.length;
  var vals = [];
  var idx = 0;

  while (idx < len) {
    vals[idx] = obj[props[idx]];
    idx += 1;
  }

  return vals;
});

/* harmony default export */ var es_values = (values_values);
// CONCATENATED MODULE: ./node_modules/ramda/es/applySpec.js







 // Use custom mapValues function to avoid issues with specs that include a "map" key and R.map
// delegating calls to .map

function mapValues(fn, obj) {
  return es_keys(obj).reduce(function (acc, key) {
    acc[key] = fn(obj[key]);
    return acc;
  }, {});
}
/**
 * Given a spec object recursively mapping properties to functions, creates a
 * function producing an object of the same structure, by mapping each property
 * to the result of calling its associated function with the supplied arguments.
 *
 * @func
 * @memberOf R
 * @since v0.20.0
 * @category Function
 * @sig {k: ((a, b, ..., m) -> v)} -> ((a, b, ..., m) -> {k: v})
 * @param {Object} spec an object recursively mapping properties to functions for
 *        producing the values for these properties.
 * @return {Function} A function that returns an object of the same structure
 * as `spec', with each property set to the value returned by calling its
 * associated function with the supplied arguments.
 * @see R.converge, R.juxt
 * @example
 *
 *      const getMetrics = R.applySpec({
 *        sum: R.add,
 *        nested: { mul: R.multiply }
 *      });
 *      getMetrics(2, 4); // => { sum: 6, nested: { mul: 8 } }
 * @symb R.applySpec({ x: f, y: { z: g } })(a, b) = { x: f(a, b), y: { z: g(a, b) } }
 */


var applySpec_applySpec =
/*#__PURE__*/
_curry1(function applySpec(spec) {
  spec = mapValues(function (v) {
    return typeof v == 'function' ? v : applySpec(v);
  }, spec);
  return es_curryN(es_reduce(es_max, 0, es_pluck('length', es_values(spec))), function () {
    var args = arguments;
    return mapValues(function (f) {
      return es_apply(f, args);
    }, spec);
  });
});

/* harmony default export */ var es_applySpec = (applySpec_applySpec);
// CONCATENATED MODULE: ./node_modules/ramda/es/applyTo.js

/**
 * Takes a value and applies a function to it.
 *
 * This function is also known as the `thrush` combinator.
 *
 * @func
 * @memberOf R
 * @since v0.25.0
 * @category Function
 * @sig a -> (a -> b) -> b
 * @param {*} x The value
 * @param {Function} f The function to apply
 * @return {*} The result of applying `f` to `x`
 * @example
 *
 *      const t42 = R.applyTo(42);
 *      t42(R.identity); //=> 42
 *      t42(R.add(1)); //=> 43
 */

var applyTo =
/*#__PURE__*/
_curry2(function applyTo(x, f) {
  return f(x);
});

/* harmony default export */ var es_applyTo = (applyTo);
// CONCATENATED MODULE: ./node_modules/ramda/es/ascend.js

/**
 * Makes an ascending comparator function out of a function that returns a value
 * that can be compared with `<` and `>`.
 *
 * @func
 * @memberOf R
 * @since v0.23.0
 * @category Function
 * @sig Ord b => (a -> b) -> a -> a -> Number
 * @param {Function} fn A function of arity one that returns a value that can be compared
 * @param {*} a The first item to be compared.
 * @param {*} b The second item to be compared.
 * @return {Number} `-1` if fn(a) < fn(b), `1` if fn(b) < fn(a), otherwise `0`
 * @see R.descend
 * @example
 *
 *      const byAge = R.ascend(R.prop('age'));
 *      const people = [
 *        { name: 'Emma', age: 70 },
 *        { name: 'Peter', age: 78 },
 *        { name: 'Mikhail', age: 62 },
 *      ];
 *      const peopleByYoungestFirst = R.sort(byAge, people);
 *        //=> [{ name: 'Mikhail', age: 62 },{ name: 'Emma', age: 70 }, { name: 'Peter', age: 78 }]
 */

var ascend =
/*#__PURE__*/
_curry3(function ascend(fn, a, b) {
  var aa = fn(a);
  var bb = fn(b);
  return aa < bb ? -1 : aa > bb ? 1 : 0;
});

/* harmony default export */ var es_ascend = (ascend);
// CONCATENATED MODULE: ./node_modules/ramda/es/assoc.js

/**
 * Makes a shallow clone of an object, setting or overriding the specified
 * property with the given value. Note that this copies and flattens prototype
 * properties onto the new object as well. All non-primitive properties are
 * copied by reference.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Object
 * @sig String -> a -> {k: v} -> {k: v}
 * @param {String} prop The property name to set
 * @param {*} val The new value
 * @param {Object} obj The object to clone
 * @return {Object} A new object equivalent to the original except for the changed property.
 * @see R.dissoc, R.pick
 * @example
 *
 *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
 */

var assoc =
/*#__PURE__*/
_curry3(function assoc(prop, val, obj) {
  var result = {};

  for (var p in obj) {
    result[p] = obj[p];
  }

  result[prop] = val;
  return result;
});

/* harmony default export */ var es_assoc = (assoc);
// CONCATENATED MODULE: ./node_modules/ramda/es/isNil.js

/**
 * Checks if the input value is `null` or `undefined`.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Type
 * @sig * -> Boolean
 * @param {*} x The value to test.
 * @return {Boolean} `true` if `x` is `undefined` or `null`, otherwise `false`.
 * @example
 *
 *      R.isNil(null); //=> true
 *      R.isNil(undefined); //=> true
 *      R.isNil(0); //=> false
 *      R.isNil([]); //=> false
 */

var isNil =
/*#__PURE__*/
_curry1(function isNil(x) {
  return x == null;
});

/* harmony default export */ var es_isNil = (isNil);
// CONCATENATED MODULE: ./node_modules/ramda/es/assocPath.js






/**
 * Makes a shallow clone of an object, setting or overriding the nodes required
 * to create the given path, and placing the specific value at the tail end of
 * that path. Note that this copies and flattens prototype properties onto the
 * new object as well. All non-primitive properties are copied by reference.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig [Idx] -> a -> {a} -> {a}
 * @param {Array} path the path to set
 * @param {*} val The new value
 * @param {Object} obj The object to clone
 * @return {Object} A new object equivalent to the original except along the specified path.
 * @see R.dissocPath
 * @example
 *
 *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
 *
 *      // Any missing or non-object keys in path will be overridden
 *      R.assocPath(['a', 'b', 'c'], 42, {a: 5}); //=> {a: {b: {c: 42}}}
 */

var assocPath_assocPath =
/*#__PURE__*/
_curry3(function assocPath(path, val, obj) {
  if (path.length === 0) {
    return val;
  }

  var idx = path[0];

  if (path.length > 1) {
    var nextObj = !es_isNil(obj) && _has(idx, obj) ? obj[idx] : _isInteger(path[1]) ? [] : {};
    val = assocPath(Array.prototype.slice.call(path, 1), val, nextObj);
  }

  if (_isInteger(idx) && _isArray(obj)) {
    var arr = [].concat(obj);
    arr[idx] = val;
    return arr;
  } else {
    return es_assoc(idx, val, obj);
  }
});

/* harmony default export */ var es_assocPath = (assocPath_assocPath);
// CONCATENATED MODULE: ./node_modules/ramda/es/nAry.js

/**
 * Wraps a function of any arity (including nullary) in a function that accepts
 * exactly `n` parameters. Any extraneous parameters will not be passed to the
 * supplied function.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig Number -> (* -> a) -> (* -> a)
 * @param {Number} n The desired arity of the new function.
 * @param {Function} fn The function to wrap.
 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
 *         arity `n`.
 * @see R.binary, R.unary
 * @example
 *
 *      const takesTwoArgs = (a, b) => [a, b];
 *
 *      takesTwoArgs.length; //=> 2
 *      takesTwoArgs(1, 2); //=> [1, 2]
 *
 *      const takesOneArg = R.nAry(1, takesTwoArgs);
 *      takesOneArg.length; //=> 1
 *      // Only `n` arguments are passed to the wrapped function
 *      takesOneArg(1, 2); //=> [1, undefined]
 * @symb R.nAry(0, f)(a, b) = f()
 * @symb R.nAry(1, f)(a, b) = f(a)
 * @symb R.nAry(2, f)(a, b) = f(a, b)
 */

var nAry =
/*#__PURE__*/
_curry2(function nAry(n, fn) {
  switch (n) {
    case 0:
      return function () {
        return fn.call(this);
      };

    case 1:
      return function (a0) {
        return fn.call(this, a0);
      };

    case 2:
      return function (a0, a1) {
        return fn.call(this, a0, a1);
      };

    case 3:
      return function (a0, a1, a2) {
        return fn.call(this, a0, a1, a2);
      };

    case 4:
      return function (a0, a1, a2, a3) {
        return fn.call(this, a0, a1, a2, a3);
      };

    case 5:
      return function (a0, a1, a2, a3, a4) {
        return fn.call(this, a0, a1, a2, a3, a4);
      };

    case 6:
      return function (a0, a1, a2, a3, a4, a5) {
        return fn.call(this, a0, a1, a2, a3, a4, a5);
      };

    case 7:
      return function (a0, a1, a2, a3, a4, a5, a6) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
      };

    case 8:
      return function (a0, a1, a2, a3, a4, a5, a6, a7) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
      };

    case 9:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
      };

    case 10:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
      };

    default:
      throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
  }
});

/* harmony default export */ var es_nAry = (nAry);
// CONCATENATED MODULE: ./node_modules/ramda/es/binary.js


/**
 * Wraps a function of any arity (including nullary) in a function that accepts
 * exactly 2 parameters. Any extraneous parameters will not be passed to the
 * supplied function.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category Function
 * @sig (* -> c) -> (a, b -> c)
 * @param {Function} fn The function to wrap.
 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
 *         arity 2.
 * @see R.nAry, R.unary
 * @example
 *
 *      const takesThreeArgs = function(a, b, c) {
 *        return [a, b, c];
 *      };
 *      takesThreeArgs.length; //=> 3
 *      takesThreeArgs(1, 2, 3); //=> [1, 2, 3]
 *
 *      const takesTwoArgs = R.binary(takesThreeArgs);
 *      takesTwoArgs.length; //=> 2
 *      // Only 2 arguments are passed to the wrapped function
 *      takesTwoArgs(1, 2, 3); //=> [1, 2, undefined]
 * @symb R.binary(f)(a, b, c) = f(a, b)
 */

var binary_binary =
/*#__PURE__*/
_curry1(function binary(fn) {
  return es_nAry(2, fn);
});

/* harmony default export */ var es_binary = (binary_binary);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isFunction.js
function _isFunction(x) {
  var type = Object.prototype.toString.call(x);
  return type === '[object Function]' || type === '[object AsyncFunction]' || type === '[object GeneratorFunction]' || type === '[object AsyncGeneratorFunction]';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/liftN.js





/**
 * "lifts" a function to be the specified arity, so that it may "map over" that
 * many lists, Functions or other objects that satisfy the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Function
 * @sig Number -> (*... -> *) -> ([*]... -> [*])
 * @param {Function} fn The function to lift into higher context
 * @return {Function} The lifted function.
 * @see R.lift, R.ap
 * @example
 *
 *      const madd3 = R.liftN(3, (...args) => R.sum(args));
 *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
 */

var liftN_liftN =
/*#__PURE__*/
_curry2(function liftN(arity, fn) {
  var lifted = es_curryN(arity, fn);
  return es_curryN(arity, function () {
    return _reduce(es_ap, es_map(lifted, arguments[0]), Array.prototype.slice.call(arguments, 1));
  });
});

/* harmony default export */ var es_liftN = (liftN_liftN);
// CONCATENATED MODULE: ./node_modules/ramda/es/lift.js


/**
 * "lifts" a function of arity > 1 so that it may "map over" a list, Function or other
 * object that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Function
 * @sig (*... -> *) -> ([*]... -> [*])
 * @param {Function} fn The function to lift into higher context
 * @return {Function} The lifted function.
 * @see R.liftN
 * @example
 *
 *      const madd3 = R.lift((a, b, c) => a + b + c);
 *
 *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
 *
 *      const madd5 = R.lift((a, b, c, d, e) => a + b + c + d + e);
 *
 *      madd5([1,2], [3], [4, 5], [6], [7, 8]); //=> [21, 22, 22, 23, 22, 23, 23, 24]
 */

var lift_lift =
/*#__PURE__*/
_curry1(function lift(fn) {
  return es_liftN(fn.length, fn);
});

/* harmony default export */ var es_lift = (lift_lift);
// CONCATENATED MODULE: ./node_modules/ramda/es/both.js




/**
 * A function which calls the two provided functions and returns the `&&`
 * of the results.
 * It returns the result of the first function if it is false-y and the result
 * of the second function otherwise. Note that this is short-circuited,
 * meaning that the second function will not be invoked if the first returns a
 * false-y value.
 *
 * In addition to functions, `R.both` also accepts any fantasy-land compatible
 * applicative functor.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category Logic
 * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
 * @param {Function} f A predicate
 * @param {Function} g Another predicate
 * @return {Function} a function that applies its arguments to `f` and `g` and `&&`s their outputs together.
 * @see R.and
 * @example
 *
 *      const gt10 = R.gt(R.__, 10)
 *      const lt20 = R.lt(R.__, 20)
 *      const f = R.both(gt10, lt20);
 *      f(15); //=> true
 *      f(30); //=> false
 *
 *      R.both(Maybe.Just(false), Maybe.Just(55)); // => Maybe.Just(false)
 *      R.both([false, false, 'a'], [11]); //=> [false, false, 11]
 */

var both_both =
/*#__PURE__*/
_curry2(function both(f, g) {
  return _isFunction(f) ? function _both() {
    return f.apply(this, arguments) && g.apply(this, arguments);
  } : es_lift(es_and)(f, g);
});

/* harmony default export */ var es_both = (both_both);
// CONCATENATED MODULE: ./node_modules/ramda/es/curry.js


/**
 * Returns a curried equivalent of the provided function. The curried function
 * has two unusual capabilities. First, its arguments needn't be provided one
 * at a time. If `f` is a ternary function and `g` is `R.curry(f)`, the
 * following are equivalent:
 *
 *   - `g(1)(2)(3)`
 *   - `g(1)(2, 3)`
 *   - `g(1, 2)(3)`
 *   - `g(1, 2, 3)`
 *
 * Secondly, the special placeholder value [`R.__`](#__) may be used to specify
 * "gaps", allowing partial application of any combination of arguments,
 * regardless of their positions. If `g` is as above and `_` is [`R.__`](#__),
 * the following are equivalent:
 *
 *   - `g(1, 2, 3)`
 *   - `g(_, 2, 3)(1)`
 *   - `g(_, _, 3)(1)(2)`
 *   - `g(_, _, 3)(1, 2)`
 *   - `g(_, 2)(1)(3)`
 *   - `g(_, 2)(1, 3)`
 *   - `g(_, 2)(_, 3)(1)`
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig (* -> a) -> (* -> a)
 * @param {Function} fn The function to curry.
 * @return {Function} A new, curried function.
 * @see R.curryN, R.partial
 * @example
 *
 *      const addFourNumbers = (a, b, c, d) => a + b + c + d;
 *
 *      const curriedAddFourNumbers = R.curry(addFourNumbers);
 *      const f = curriedAddFourNumbers(1, 2);
 *      const g = f(3);
 *      g(4); //=> 10
 */

var curry_curry =
/*#__PURE__*/
_curry1(function curry(fn) {
  return es_curryN(fn.length, fn);
});

/* harmony default export */ var es_curry = (curry_curry);
// CONCATENATED MODULE: ./node_modules/ramda/es/call.js

/**
 * Returns the result of calling its first argument with the remaining
 * arguments. This is occasionally useful as a converging function for
 * [`R.converge`](#converge): the first branch can produce a function while the
 * remaining branches produce values to be passed to that function as its
 * arguments.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Function
 * @sig (*... -> a),*... -> a
 * @param {Function} fn The function to apply to the remaining arguments.
 * @param {...*} args Any number of positional arguments.
 * @return {*}
 * @see R.apply
 * @example
 *
 *      R.call(R.add, 1, 2); //=> 3
 *
 *      const indentN = R.pipe(R.repeat(' '),
 *                           R.join(''),
 *                           R.replace(/^(?!$)/gm));
 *
 *      const format = R.converge(R.call, [
 *                                  R.pipe(R.prop('indent'), indentN),
 *                                  R.prop('value')
 *                              ]);
 *
 *      format({indent: 2, value: 'foo\nbar\nbaz\n'}); //=> '  foo\n  bar\n  baz\n'
 * @symb R.call(f, a, b) = f(a, b)
 */

var call =
/*#__PURE__*/
es_curry(function call(fn) {
  return fn.apply(this, Array.prototype.slice.call(arguments, 1));
});
/* harmony default export */ var es_call = (call);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_makeFlat.js

/**
 * `_makeFlat` is a helper function that returns a one-level or fully recursive
 * function based on the flag passed in.
 *
 * @private
 */

function _makeFlat(recursive) {
  return function flatt(list) {
    var value, jlen, j;
    var result = [];
    var idx = 0;
    var ilen = list.length;

    while (idx < ilen) {
      if (internal_isArrayLike(list[idx])) {
        value = recursive ? flatt(list[idx]) : list[idx];
        j = 0;
        jlen = value.length;

        while (j < jlen) {
          result[result.length] = value[j];
          j += 1;
        }
      } else {
        result[result.length] = list[idx];
      }

      idx += 1;
    }

    return result;
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_forceReduced.js
function _forceReduced(x) {
  return {
    '@@transducer/value': x,
    '@@transducer/reduced': true
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_flatCat.js





var preservingReduced = function (xf) {
  return {
    '@@transducer/init': _xfBase.init,
    '@@transducer/result': function (result) {
      return xf['@@transducer/result'](result);
    },
    '@@transducer/step': function (result, input) {
      var ret = xf['@@transducer/step'](result, input);
      return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
    }
  };
};

var _flatCat = function _xcat(xf) {
  var rxf = preservingReduced(xf);
  return {
    '@@transducer/init': _xfBase.init,
    '@@transducer/result': function (result) {
      return rxf['@@transducer/result'](result);
    },
    '@@transducer/step': function (result, input) {
      return !internal_isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
    }
  };
};

/* harmony default export */ var internal_flatCat = (_flatCat);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xchain.js




var _xchain_xchain =
/*#__PURE__*/
_curry2(function _xchain(f, xf) {
  return es_map(f, internal_flatCat(xf));
});

/* harmony default export */ var internal_xchain = (_xchain_xchain);
// CONCATENATED MODULE: ./node_modules/ramda/es/chain.js





/**
 * `chain` maps a function over a list and concatenates the results. `chain`
 * is also known as `flatMap` in some libraries.
 *
 * Dispatches to the `chain` method of the second argument, if present,
 * according to the [FantasyLand Chain spec](https://github.com/fantasyland/fantasy-land#chain).
 *
 * If second argument is a function, `chain(f, g)(x)` is equivalent to `f(g(x), x)`.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category List
 * @sig Chain m => (a -> m b) -> m a -> m b
 * @param {Function} fn The function to map with
 * @param {Array} list The list to map over
 * @return {Array} The result of flat-mapping `list` with `fn`
 * @example
 *
 *      const duplicate = n => [n, n];
 *      R.chain(duplicate, [1, 2, 3]); //=> [1, 1, 2, 2, 3, 3]
 *
 *      R.chain(R.append, R.head)([1, 2, 3]); //=> [1, 2, 3, 1]
 */

var chain_chain =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['fantasy-land/chain', 'chain'], internal_xchain, function chain(fn, monad) {
  if (typeof monad === 'function') {
    return function (x) {
      return fn(monad(x))(x);
    };
  }

  return _makeFlat(false)(es_map(fn, monad));
}));

/* harmony default export */ var es_chain = (chain_chain);
// CONCATENATED MODULE: ./node_modules/ramda/es/clamp.js

/**
 * Restricts a number to be within a range.
 *
 * Also works for other ordered types such as Strings and Dates.
 *
 * @func
 * @memberOf R
 * @since v0.20.0
 * @category Relation
 * @sig Ord a => a -> a -> a -> a
 * @param {Number} minimum The lower limit of the clamp (inclusive)
 * @param {Number} maximum The upper limit of the clamp (inclusive)
 * @param {Number} value Value to be clamped
 * @return {Number} Returns `minimum` when `val < minimum`, `maximum` when `val > maximum`, returns `val` otherwise
 * @example
 *
 *      R.clamp(1, 10, -5) // => 1
 *      R.clamp(1, 10, 15) // => 10
 *      R.clamp(1, 10, 4)  // => 4
 */

var clamp =
/*#__PURE__*/
_curry3(function clamp(min, max, value) {
  if (min > max) {
    throw new Error('min must not be greater than max in clamp(min, max, value)');
  }

  return value < min ? min : value > max ? max : value;
});

/* harmony default export */ var es_clamp = (clamp);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_cloneRegExp.js
function _cloneRegExp(pattern) {
  return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/type.js

/**
 * Gives a single-word string description of the (native) type of a value,
 * returning such answers as 'Object', 'Number', 'Array', or 'Null'. Does not
 * attempt to distinguish user Object types any further, reporting them all as
 * 'Object'.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Type
 * @sig (* -> {*}) -> String
 * @param {*} val The value to test
 * @return {String}
 * @example
 *
 *      R.type({}); //=> "Object"
 *      R.type(1); //=> "Number"
 *      R.type(false); //=> "Boolean"
 *      R.type('s'); //=> "String"
 *      R.type(null); //=> "Null"
 *      R.type([]); //=> "Array"
 *      R.type(/[A-z]/); //=> "RegExp"
 *      R.type(() => {}); //=> "Function"
 *      R.type(undefined); //=> "Undefined"
 */

var type_type =
/*#__PURE__*/
_curry1(function type(val) {
  return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
});

/* harmony default export */ var es_type = (type_type);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_clone.js


/**
 * Copies an object.
 *
 * @private
 * @param {*} value The value to be copied
 * @param {Array} refFrom Array containing the source references
 * @param {Array} refTo Array containing the copied source references
 * @param {Boolean} deep Whether or not to perform deep cloning.
 * @return {*} The copied value.
 */

function _clone(value, refFrom, refTo, deep) {
  var copy = function copy(copiedValue) {
    var len = refFrom.length;
    var idx = 0;

    while (idx < len) {
      if (value === refFrom[idx]) {
        return refTo[idx];
      }

      idx += 1;
    }

    refFrom[idx + 1] = value;
    refTo[idx + 1] = copiedValue;

    for (var key in value) {
      copiedValue[key] = deep ? _clone(value[key], refFrom, refTo, true) : value[key];
    }

    return copiedValue;
  };

  switch (es_type(value)) {
    case 'Object':
      return copy({});

    case 'Array':
      return copy([]);

    case 'Date':
      return new Date(value.valueOf());

    case 'RegExp':
      return _cloneRegExp(value);

    default:
      return value;
  }
}
// CONCATENATED MODULE: ./node_modules/ramda/es/clone.js


/**
 * Creates a deep copy of the value which may contain (nested) `Array`s and
 * `Object`s, `Number`s, `String`s, `Boolean`s and `Date`s. `Function`s are
 * assigned by reference rather than copied
 *
 * Dispatches to a `clone` method if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig {*} -> {*}
 * @param {*} value The object or array to clone
 * @return {*} A deeply cloned copy of `val`
 * @example
 *
 *      const objects = [{}, {}, {}];
 *      const objectsClone = R.clone(objects);
 *      objects === objectsClone; //=> false
 *      objects[0] === objectsClone[0]; //=> false
 */

var clone_clone =
/*#__PURE__*/
_curry1(function clone(value) {
  return value != null && typeof value.clone === 'function' ? value.clone() : _clone(value, [], [], true);
});

/* harmony default export */ var es_clone = (clone_clone);
// CONCATENATED MODULE: ./node_modules/ramda/es/comparator.js

/**
 * Makes a comparator function out of a function that reports whether the first
 * element is less than the second.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig ((a, b) -> Boolean) -> ((a, b) -> Number)
 * @param {Function} pred A predicate function of arity two which will return `true` if the first argument
 * is less than the second, `false` otherwise
 * @return {Function} A Function :: a -> b -> Int that returns `-1` if a < b, `1` if b < a, otherwise `0`
 * @example
 *
 *      const byAge = R.comparator((a, b) => a.age < b.age);
 *      const people = [
 *        { name: 'Emma', age: 70 },
 *        { name: 'Peter', age: 78 },
 *        { name: 'Mikhail', age: 62 },
 *      ];
 *      const peopleByIncreasingAge = R.sort(byAge, people);
 *        //=> [{ name: 'Mikhail', age: 62 },{ name: 'Emma', age: 70 }, { name: 'Peter', age: 78 }]
 */

var comparator =
/*#__PURE__*/
_curry1(function comparator(pred) {
  return function (a, b) {
    return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
  };
});

/* harmony default export */ var es_comparator = (comparator);
// CONCATENATED MODULE: ./node_modules/ramda/es/not.js

/**
 * A function that returns the `!` of its argument. It will return `true` when
 * passed false-y value, and `false` when passed a truth-y one.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Logic
 * @sig * -> Boolean
 * @param {*} a any value
 * @return {Boolean} the logical inverse of passed argument.
 * @see R.complement
 * @example
 *
 *      R.not(true); //=> false
 *      R.not(false); //=> true
 *      R.not(0); //=> true
 *      R.not(1); //=> false
 */

var not =
/*#__PURE__*/
_curry1(function not(a) {
  return !a;
});

/* harmony default export */ var es_not = (not);
// CONCATENATED MODULE: ./node_modules/ramda/es/complement.js


/**
 * Takes a function `f` and returns a function `g` such that if called with the same arguments
 * when `f` returns a "truthy" value, `g` returns `false` and when `f` returns a "falsy" value `g` returns `true`.
 *
 * `R.complement` may be applied to any functor
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category Logic
 * @sig (*... -> *) -> (*... -> Boolean)
 * @param {Function} f
 * @return {Function}
 * @see R.not
 * @example
 *
 *      const isNotNil = R.complement(R.isNil);
 *      isNil(null); //=> true
 *      isNotNil(null); //=> false
 *      isNil(7); //=> false
 *      isNotNil(7); //=> true
 */

var complement =
/*#__PURE__*/
es_lift(es_not);
/* harmony default export */ var es_complement = (complement);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_pipe.js
function _pipe(f, g) {
  return function () {
    return g.call(this, f.apply(this, arguments));
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_checkForMethod.js

/**
 * This checks whether a function has a [methodname] function. If it isn't an
 * array it will execute that function otherwise it will default to the ramda
 * implementation.
 *
 * @private
 * @param {Function} fn ramda implemtation
 * @param {String} methodname property to check for a custom implementation
 * @return {Object} Whatever the return value of the method is.
 */

function _checkForMethod(methodname, fn) {
  return function () {
    var length = arguments.length;

    if (length === 0) {
      return fn();
    }

    var obj = arguments[length - 1];
    return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, Array.prototype.slice.call(arguments, 0, length - 1));
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/slice.js


/**
 * Returns the elements of the given list or string (or object with a `slice`
 * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
 *
 * Dispatches to the `slice` method of the third argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.4
 * @category List
 * @sig Number -> Number -> [a] -> [a]
 * @sig Number -> Number -> String -> String
 * @param {Number} fromIndex The start index (inclusive).
 * @param {Number} toIndex The end index (exclusive).
 * @param {*} list
 * @return {*}
 * @example
 *
 *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
 *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
 *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
 *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
 *      R.slice(0, 3, 'ramda');                     //=> 'ram'
 */

var slice =
/*#__PURE__*/
_curry3(
/*#__PURE__*/
_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
  return Array.prototype.slice.call(list, fromIndex, toIndex);
}));

/* harmony default export */ var es_slice = (slice);
// CONCATENATED MODULE: ./node_modules/ramda/es/tail.js



/**
 * Returns all but the first element of the given list or string (or object
 * with a `tail` method).
 *
 * Dispatches to the `slice` method of the first argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [a]
 * @sig String -> String
 * @param {*} list
 * @return {*}
 * @see R.head, R.init, R.last
 * @example
 *
 *      R.tail([1, 2, 3]);  //=> [2, 3]
 *      R.tail([1, 2]);     //=> [2]
 *      R.tail([1]);        //=> []
 *      R.tail([]);         //=> []
 *
 *      R.tail('abc');  //=> 'bc'
 *      R.tail('ab');   //=> 'b'
 *      R.tail('a');    //=> ''
 *      R.tail('');     //=> ''
 */

var tail_tail =
/*#__PURE__*/
_curry1(
/*#__PURE__*/
_checkForMethod('tail',
/*#__PURE__*/
es_slice(1, Infinity)));

/* harmony default export */ var es_tail = (tail_tail);
// CONCATENATED MODULE: ./node_modules/ramda/es/pipe.js




/**
 * Performs left-to-right function composition. The first argument may have
 * any arity; the remaining arguments must be unary.
 *
 * In some libraries this function is named `sequence`.
 *
 * **Note:** The result of pipe is not automatically curried.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> ((a, b, ..., n) -> z)
 * @param {...Function} functions
 * @return {Function}
 * @see R.compose
 * @example
 *
 *      const f = R.pipe(Math.pow, R.negate, R.inc);
 *
 *      f(3, 4); // -(3^4) + 1
 * @symb R.pipe(f, g, h)(a, b) = h(g(f(a, b)))
 */

function pipe() {
  if (arguments.length === 0) {
    throw new Error('pipe requires at least one argument');
  }

  return _arity(arguments[0].length, es_reduce(_pipe, arguments[0], es_tail(arguments)));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/reverse.js


/**
 * Returns a new list or string with the elements or characters in reverse
 * order.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [a]
 * @sig String -> String
 * @param {Array|String} list
 * @return {Array|String}
 * @example
 *
 *      R.reverse([1, 2, 3]);  //=> [3, 2, 1]
 *      R.reverse([1, 2]);     //=> [2, 1]
 *      R.reverse([1]);        //=> [1]
 *      R.reverse([]);         //=> []
 *
 *      R.reverse('abc');      //=> 'cba'
 *      R.reverse('ab');       //=> 'ba'
 *      R.reverse('a');        //=> 'a'
 *      R.reverse('');         //=> ''
 */

var reverse_reverse =
/*#__PURE__*/
_curry1(function reverse(list) {
  return _isString(list) ? list.split('').reverse().join('') : Array.prototype.slice.call(list, 0).reverse();
});

/* harmony default export */ var es_reverse = (reverse_reverse);
// CONCATENATED MODULE: ./node_modules/ramda/es/compose.js


/**
 * Performs right-to-left function composition. The last argument may have
 * any arity; the remaining arguments must be unary.
 *
 * **Note:** The result of compose is not automatically curried.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig ((y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)) -> ((a, b, ..., n) -> z)
 * @param {...Function} ...functions The functions to compose
 * @return {Function}
 * @see R.pipe
 * @example
 *
 *      const classyGreeting = (firstName, lastName) => "The name's " + lastName + ", " + firstName + " " + lastName
 *      const yellGreeting = R.compose(R.toUpper, classyGreeting);
 *      yellGreeting('James', 'Bond'); //=> "THE NAME'S BOND, JAMES BOND"
 *
 *      R.compose(Math.abs, R.add(1), R.multiply(2))(-4) //=> 7
 *
 * @symb R.compose(f, g, h)(a, b) = f(g(h(a, b)))
 */

function compose() {
  if (arguments.length === 0) {
    throw new Error('compose requires at least one argument');
  }

  return pipe.apply(this, es_reverse(arguments));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/composeK.js



/**
 * Returns the right-to-left Kleisli composition of the provided functions,
 * each of which must return a value of a type supported by [`chain`](#chain).
 *
 * `R.composeK(h, g, f)` is equivalent to `R.compose(R.chain(h), R.chain(g), f)`.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Function
 * @sig Chain m => ((y -> m z), (x -> m y), ..., (a -> m b)) -> (a -> m z)
 * @param {...Function} ...functions The functions to compose
 * @return {Function}
 * @see R.pipeK
 * @deprecated since v0.26.0
 * @example
 *
 *       //  get :: String -> Object -> Maybe *
 *       const get = R.curry((propName, obj) => Maybe(obj[propName]))
 *
 *       //  getStateCode :: Maybe String -> Maybe String
 *       const getStateCode = R.composeK(
 *         R.compose(Maybe.of, R.toUpper),
 *         get('state'),
 *         get('address'),
 *         get('user'),
 *       );
 *       getStateCode({"user":{"address":{"state":"ny"}}}); //=> Maybe.Just("NY")
 *       getStateCode({}); //=> Maybe.Nothing()
 * @symb R.composeK(f, g, h)(a) = R.chain(f, R.chain(g, h(a)))
 */

function composeK() {
  if (arguments.length === 0) {
    throw new Error('composeK requires at least one argument');
  }

  var init = Array.prototype.slice.call(arguments);
  var last = init.pop();
  return compose(compose.apply(this, es_map(es_chain, init)), last);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_pipeP.js
function _pipeP(f, g) {
  return function () {
    var ctx = this;
    return f.apply(ctx, arguments).then(function (x) {
      return g.call(ctx, x);
    });
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/pipeP.js




/**
 * Performs left-to-right composition of one or more Promise-returning
 * functions. The first argument may have any arity; the remaining arguments
 * must be unary.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Function
 * @sig ((a -> Promise b), (b -> Promise c), ..., (y -> Promise z)) -> (a -> Promise z)
 * @param {...Function} functions
 * @return {Function}
 * @see R.composeP
 * @deprecated since v0.26.0
 * @example
 *
 *      //  followersForUser :: String -> Promise [User]
 *      const followersForUser = R.pipeP(db.getUserById, db.getFollowers);
 */

function pipeP() {
  if (arguments.length === 0) {
    throw new Error('pipeP requires at least one argument');
  }

  return _arity(arguments[0].length, es_reduce(_pipeP, arguments[0], es_tail(arguments)));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/composeP.js


/**
 * Performs right-to-left composition of one or more Promise-returning
 * functions. The last arguments may have any arity; the remaining
 * arguments must be unary.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Function
 * @sig ((y -> Promise z), (x -> Promise y), ..., (a -> Promise b)) -> (a -> Promise z)
 * @param {...Function} functions The functions to compose
 * @return {Function}
 * @see R.pipeP
 * @deprecated since v0.26.0
 * @example
 *
 *      const db = {
 *        users: {
 *          JOE: {
 *            name: 'Joe',
 *            followers: ['STEVE', 'SUZY']
 *          }
 *        }
 *      }
 *
 *      // We'll pretend to do a db lookup which returns a promise
 *      const lookupUser = (userId) => Promise.resolve(db.users[userId])
 *      const lookupFollowers = (user) => Promise.resolve(user.followers)
 *      lookupUser('JOE').then(lookupFollowers)
 *
 *      //  followersForUser :: String -> Promise [UserId]
 *      const followersForUser = R.composeP(lookupFollowers, lookupUser);
 *      followersForUser('JOE').then(followers => console.log('Followers:', followers))
 *      // Followers: ["STEVE","SUZY"]
 */

function composeP() {
  if (arguments.length === 0) {
    throw new Error('composeP requires at least one argument');
  }

  return pipeP.apply(this, es_reverse(arguments));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/head.js

/**
 * Returns the first element of the given list or string. In some libraries
 * this function is named `first`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> a | Undefined
 * @sig String -> String
 * @param {Array|String} list
 * @return {*}
 * @see R.tail, R.init, R.last
 * @example
 *
 *      R.head(['fi', 'fo', 'fum']); //=> 'fi'
 *      R.head([]); //=> undefined
 *
 *      R.head('abc'); //=> 'a'
 *      R.head(''); //=> ''
 */

var head_head =
/*#__PURE__*/
es_nth(0);
/* harmony default export */ var es_head = (head_head);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_identity.js
function _identity(x) {
  return x;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/identity.js


/**
 * A function that does nothing but return the parameter supplied to it. Good
 * as a default or placeholder function.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig a -> a
 * @param {*} x The value to return.
 * @return {*} The input value, `x`.
 * @example
 *
 *      R.identity(1); //=> 1
 *
 *      const obj = {};
 *      R.identity(obj) === obj; //=> true
 * @symb R.identity(a) = a
 */

var identity =
/*#__PURE__*/
_curry1(_identity);

/* harmony default export */ var es_identity = (identity);
// CONCATENATED MODULE: ./node_modules/ramda/es/pipeWith.js






/**
 * Performs left-to-right function composition using transforming function. The first argument may have
 * any arity; the remaining arguments must be unary.
 *
 * **Note:** The result of pipeWith is not automatically curried. Transforming function is not used on the
 * first argument.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Function
 * @sig ((* -> *), [((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)]) -> ((a, b, ..., n) -> z)
 * @param {...Function} functions
 * @return {Function}
 * @see R.composeWith, R.pipe
 * @example
 *
 *      const pipeWhileNotNil = R.pipeWith((f, res) => R.isNil(res) ? res : f(res));
 *      const f = pipeWhileNotNil([Math.pow, R.negate, R.inc])
 *
 *      f(3, 4); // -(3^4) + 1
 * @symb R.pipeWith(f)([g, h, i])(...args) = f(i, f(h, g(...args)))
 */

var pipeWith_pipeWith =
/*#__PURE__*/
_curry2(function pipeWith(xf, list) {
  if (list.length <= 0) {
    return es_identity;
  }

  var headList = es_head(list);
  var tailList = es_tail(list);
  return _arity(headList.length, function () {
    return _reduce(function (result, f) {
      return xf.call(this, f, result);
    }, headList.apply(this, arguments), tailList);
  });
});

/* harmony default export */ var es_pipeWith = (pipeWith_pipeWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/composeWith.js



/**
 * Performs right-to-left function composition using transforming function. The last argument may have
 * any arity; the remaining arguments must be unary.
 *
 * **Note:** The result of compose is not automatically curried. Transforming function is not used on the
 * last argument.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Function
 * @sig ((* -> *), [(y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)]) -> ((a, b, ..., n) -> z)
 * @param {...Function} ...functions The functions to compose
 * @return {Function}
 * @see R.compose, R.pipeWith
 * @example
 *
 *      const composeWhileNotNil = R.composeWith((f, res) => R.isNil(res) ? res : f(res));
 *
 *      composeWhileNotNil([R.inc, R.prop('age')])({age: 1}) //=> 2
 *      composeWhileNotNil([R.inc, R.prop('age')])({}) //=> undefined
 *
 * @symb R.composeWith(f)([g, h, i])(...args) = f(g, f(h, i(...args)))
 */

var composeWith_composeWith =
/*#__PURE__*/
_curry2(function composeWith(xf, list) {
  return es_pipeWith.apply(this, [xf, es_reverse(list)]);
});

/* harmony default export */ var es_composeWith = (composeWith_composeWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_arrayFromIterator.js
function _arrayFromIterator(iter) {
  var list = [];
  var next;

  while (!(next = iter.next()).done) {
    list.push(next.value);
  }

  return list;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_includesWith.js
function _includesWith(pred, x, list) {
  var idx = 0;
  var len = list.length;

  while (idx < len) {
    if (pred(x, list[idx])) {
      return true;
    }

    idx += 1;
  }

  return false;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_functionName.js
function _functionName(f) {
  // String(x => x) evaluates to "x => x", so the pattern may not match.
  var match = String(f).match(/^function (\w*)/);
  return match == null ? '' : match[1];
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_objectIs.js
// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function _objectIs(a, b) {
  // SameValue algorithm
  if (a === b) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return a !== 0 || 1 / a === 1 / b;
  } else {
    // Step 6.a: NaN == NaN
    return a !== a && b !== b;
  }
}

/* harmony default export */ var internal_objectIs = (typeof Object.is === 'function' ? Object.is : _objectIs);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_equals.js







/**
 * private _uniqContentEquals function.
 * That function is checking equality of 2 iterator contents with 2 assumptions
 * - iterators lengths are the same
 * - iterators values are unique
 *
 * false-positive result will be returned for comparision of, e.g.
 * - [1,2,3] and [1,2,3,4]
 * - [1,1,1] and [1,2,3]
 * */

function _uniqContentEquals(aIterator, bIterator, stackA, stackB) {
  var a = _arrayFromIterator(aIterator);

  var b = _arrayFromIterator(bIterator);

  function eq(_a, _b) {
    return _equals(_a, _b, stackA.slice(), stackB.slice());
  } // if *a* array contains any element that is not included in *b*


  return !_includesWith(function (b, aItem) {
    return !_includesWith(eq, aItem, b);
  }, b, a);
}

function _equals(a, b, stackA, stackB) {
  if (internal_objectIs(a, b)) {
    return true;
  }

  var typeA = es_type(a);

  if (typeA !== es_type(b)) {
    return false;
  }

  if (a == null || b == null) {
    return false;
  }

  if (typeof a['fantasy-land/equals'] === 'function' || typeof b['fantasy-land/equals'] === 'function') {
    return typeof a['fantasy-land/equals'] === 'function' && a['fantasy-land/equals'](b) && typeof b['fantasy-land/equals'] === 'function' && b['fantasy-land/equals'](a);
  }

  if (typeof a.equals === 'function' || typeof b.equals === 'function') {
    return typeof a.equals === 'function' && a.equals(b) && typeof b.equals === 'function' && b.equals(a);
  }

  switch (typeA) {
    case 'Arguments':
    case 'Array':
    case 'Object':
      if (typeof a.constructor === 'function' && _functionName(a.constructor) === 'Promise') {
        return a === b;
      }

      break;

    case 'Boolean':
    case 'Number':
    case 'String':
      if (!(typeof a === typeof b && internal_objectIs(a.valueOf(), b.valueOf()))) {
        return false;
      }

      break;

    case 'Date':
      if (!internal_objectIs(a.valueOf(), b.valueOf())) {
        return false;
      }

      break;

    case 'Error':
      return a.name === b.name && a.message === b.message;

    case 'RegExp':
      if (!(a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode)) {
        return false;
      }

      break;
  }

  var idx = stackA.length - 1;

  while (idx >= 0) {
    if (stackA[idx] === a) {
      return stackB[idx] === b;
    }

    idx -= 1;
  }

  switch (typeA) {
    case 'Map':
      if (a.size !== b.size) {
        return false;
      }

      return _uniqContentEquals(a.entries(), b.entries(), stackA.concat([a]), stackB.concat([b]));

    case 'Set':
      if (a.size !== b.size) {
        return false;
      }

      return _uniqContentEquals(a.values(), b.values(), stackA.concat([a]), stackB.concat([b]));

    case 'Arguments':
    case 'Array':
    case 'Object':
    case 'Boolean':
    case 'Number':
    case 'String':
    case 'Date':
    case 'Error':
    case 'RegExp':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'ArrayBuffer':
      break;

    default:
      // Values of other types are only equal if identical.
      return false;
  }

  var keysA = es_keys(a);

  if (keysA.length !== es_keys(b).length) {
    return false;
  }

  var extendedStackA = stackA.concat([a]);
  var extendedStackB = stackB.concat([b]);
  idx = keysA.length - 1;

  while (idx >= 0) {
    var key = keysA[idx];

    if (!(_has(key, b) && _equals(b[key], a[key], extendedStackA, extendedStackB))) {
      return false;
    }

    idx -= 1;
  }

  return true;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/equals.js


/**
 * Returns `true` if its arguments are equivalent, `false` otherwise. Handles
 * cyclical data structures.
 *
 * Dispatches symmetrically to the `equals` methods of both arguments, if
 * present.
 *
 * @func
 * @memberOf R
 * @since v0.15.0
 * @category Relation
 * @sig a -> b -> Boolean
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 * @example
 *
 *      R.equals(1, 1); //=> true
 *      R.equals(1, '1'); //=> false
 *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
 *
 *      const a = {}; a.v = a;
 *      const b = {}; b.v = b;
 *      R.equals(a, b); //=> true
 */

var equals_equals =
/*#__PURE__*/
_curry2(function equals(a, b) {
  return _equals(a, b, [], []);
});

/* harmony default export */ var es_equals = (equals_equals);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_indexOf.js

function _indexOf(list, a, idx) {
  var inf, item; // Array.prototype.indexOf doesn't exist below IE9

  if (typeof list.indexOf === 'function') {
    switch (typeof a) {
      case 'number':
        if (a === 0) {
          // manually crawl the list to distinguish between +0 and -0
          inf = 1 / a;

          while (idx < list.length) {
            item = list[idx];

            if (item === 0 && 1 / item === inf) {
              return idx;
            }

            idx += 1;
          }

          return -1;
        } else if (a !== a) {
          // NaN
          while (idx < list.length) {
            item = list[idx];

            if (typeof item === 'number' && item !== item) {
              return idx;
            }

            idx += 1;
          }

          return -1;
        } // non-zero numbers can utilise Set


        return list.indexOf(a, idx);
      // all these types can utilise Set

      case 'string':
      case 'boolean':
      case 'function':
      case 'undefined':
        return list.indexOf(a, idx);

      case 'object':
        if (a === null) {
          // null can utilise Set
          return list.indexOf(a, idx);
        }

    }
  } // anything else not covered above, defer to R.equals


  while (idx < list.length) {
    if (es_equals(list[idx], a)) {
      return idx;
    }

    idx += 1;
  }

  return -1;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_includes.js

function _includes(a, list) {
  return _indexOf(list, a, 0) >= 0;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_quote.js
function _quote(s) {
  var escaped = s.replace(/\\/g, '\\\\').replace(/[\b]/g, '\\b') // \b matches word boundary; [\b] matches backspace
  .replace(/\f/g, '\\f').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\v/g, '\\v').replace(/\0/g, '\\0');
  return '"' + escaped.replace(/"/g, '\\"') + '"';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_toISOString.js
/**
 * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
 */
var pad = function pad(n) {
  return (n < 10 ? '0' : '') + n;
};

var _toISOString = typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
  return d.toISOString();
} : function _toISOString(d) {
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
};

/* harmony default export */ var internal_toISOString = (_toISOString);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_complement.js
function _complement(f) {
  return function () {
    return !f.apply(this, arguments);
  };
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_filter.js
function _filter(fn, list) {
  var idx = 0;
  var len = list.length;
  var result = [];

  while (idx < len) {
    if (fn(list[idx])) {
      result[result.length] = list[idx];
    }

    idx += 1;
  }

  return result;
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isObject.js
function _isObject(x) {
  return Object.prototype.toString.call(x) === '[object Object]';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfilter.js



var _xfilter_XFilter =
/*#__PURE__*/
function () {
  function XFilter(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XFilter.prototype['@@transducer/init'] = _xfBase.init;
  XFilter.prototype['@@transducer/result'] = _xfBase.result;

  XFilter.prototype['@@transducer/step'] = function (result, input) {
    return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
  };

  return XFilter;
}();

var _xfilter =
/*#__PURE__*/
_curry2(function _xfilter(f, xf) {
  return new _xfilter_XFilter(f, xf);
});

/* harmony default export */ var internal_xfilter = (_xfilter);
// CONCATENATED MODULE: ./node_modules/ramda/es/filter.js







/**
 * Takes a predicate and a `Filterable`, and returns a new filterable of the
 * same type containing the members of the given filterable which satisfy the
 * given predicate. Filterable objects include plain objects or any object
 * that has a filter method such as `Array`.
 *
 * Dispatches to the `filter` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Filterable f => (a -> Boolean) -> f a -> f a
 * @param {Function} pred
 * @param {Array} filterable
 * @return {Array} Filterable
 * @see R.reject, R.transduce, R.addIndex
 * @example
 *
 *      const isEven = n => n % 2 === 0;
 *
 *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
 *
 *      R.filter(isEven, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
 */

var filter =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['filter'], internal_xfilter, function (pred, filterable) {
  return _isObject(filterable) ? _reduce(function (acc, key) {
    if (pred(filterable[key])) {
      acc[key] = filterable[key];
    }

    return acc;
  }, {}, es_keys(filterable)) : // else
  _filter(pred, filterable);
}));

/* harmony default export */ var es_filter = (filter);
// CONCATENATED MODULE: ./node_modules/ramda/es/reject.js



/**
 * The complement of [`filter`](#filter).
 *
 * Acts as a transducer if a transformer is given in list position. Filterable
 * objects include plain objects or any object that has a filter method such
 * as `Array`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Filterable f => (a -> Boolean) -> f a -> f a
 * @param {Function} pred
 * @param {Array} filterable
 * @return {Array}
 * @see R.filter, R.transduce, R.addIndex
 * @example
 *
 *      const isOdd = (n) => n % 2 === 1;
 *
 *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
 *
 *      R.reject(isOdd, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
 */

var reject_reject =
/*#__PURE__*/
_curry2(function reject(pred, filterable) {
  return es_filter(_complement(pred), filterable);
});

/* harmony default export */ var es_reject = (reject_reject);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_toString.js






function _toString(x, seen) {
  var recur = function recur(y) {
    var xs = seen.concat([x]);
    return _includes(y, xs) ? '<Circular>' : _toString(y, xs);
  }; //  mapPairs :: (Object, [String]) -> [String]


  var mapPairs = function (obj, keys) {
    return _map(function (k) {
      return _quote(k) + ': ' + recur(obj[k]);
    }, keys.slice().sort());
  };

  switch (Object.prototype.toString.call(x)) {
    case '[object Arguments]':
      return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';

    case '[object Array]':
      return '[' + _map(recur, x).concat(mapPairs(x, es_reject(function (k) {
        return /^\d+$/.test(k);
      }, es_keys(x)))).join(', ') + ']';

    case '[object Boolean]':
      return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();

    case '[object Date]':
      return 'new Date(' + (isNaN(x.valueOf()) ? recur(NaN) : _quote(internal_toISOString(x))) + ')';

    case '[object Null]':
      return 'null';

    case '[object Number]':
      return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);

    case '[object String]':
      return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);

    case '[object Undefined]':
      return 'undefined';

    default:
      if (typeof x.toString === 'function') {
        var repr = x.toString();

        if (repr !== '[object Object]') {
          return repr;
        }
      }

      return '{' + mapPairs(x, es_keys(x)).join(', ') + '}';
  }
}
// CONCATENATED MODULE: ./node_modules/ramda/es/toString.js


/**
 * Returns the string representation of the given value. `eval`'ing the output
 * should result in a value equivalent to the input value. Many of the built-in
 * `toString` methods do not satisfy this requirement.
 *
 * If the given value is an `[object Object]` with a `toString` method other
 * than `Object.prototype.toString`, this method is invoked with no arguments
 * to produce the return value. This means user-defined constructor functions
 * can provide a suitable `toString` method. For example:
 *
 *     function Point(x, y) {
 *       this.x = x;
 *       this.y = y;
 *     }
 *
 *     Point.prototype.toString = function() {
 *       return 'new Point(' + this.x + ', ' + this.y + ')';
 *     };
 *
 *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category String
 * @sig * -> String
 * @param {*} val
 * @return {String}
 * @example
 *
 *      R.toString(42); //=> '42'
 *      R.toString('abc'); //=> '"abc"'
 *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
 *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
 *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
 */

var toString_toString =
/*#__PURE__*/
_curry1(function toString(val) {
  return _toString(val, []);
});

/* harmony default export */ var es_toString = (toString_toString);
// CONCATENATED MODULE: ./node_modules/ramda/es/concat.js





/**
 * Returns the result of concatenating the given lists or strings.
 *
 * Note: `R.concat` expects both arguments to be of the same type,
 * unlike the native `Array.prototype.concat` method. It will throw
 * an error if you `concat` an Array with a non-Array value.
 *
 * Dispatches to the `concat` method of the first argument, if present.
 * Can also concatenate two members of a [fantasy-land
 * compatible semigroup](https://github.com/fantasyland/fantasy-land#semigroup).
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [a] -> [a]
 * @sig String -> String -> String
 * @param {Array|String} firstList The first list
 * @param {Array|String} secondList The second list
 * @return {Array|String} A list consisting of the elements of `firstList` followed by the elements of
 * `secondList`.
 *
 * @example
 *
 *      R.concat('ABC', 'DEF'); // 'ABCDEF'
 *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
 *      R.concat([], []); //=> []
 */

var concat_concat =
/*#__PURE__*/
_curry2(function concat(a, b) {
  if (_isArray(a)) {
    if (_isArray(b)) {
      return a.concat(b);
    }

    throw new TypeError(es_toString(b) + ' is not an array');
  }

  if (_isString(a)) {
    if (_isString(b)) {
      return a + b;
    }

    throw new TypeError(es_toString(b) + ' is not a string');
  }

  if (a != null && _isFunction(a['fantasy-land/concat'])) {
    return a['fantasy-land/concat'](b);
  }

  if (a != null && _isFunction(a.concat)) {
    return a.concat(b);
  }

  throw new TypeError(es_toString(a) + ' does not have a method named "concat" or "fantasy-land/concat"');
});

/* harmony default export */ var es_concat = (concat_concat);
// CONCATENATED MODULE: ./node_modules/ramda/es/cond.js





/**
 * Returns a function, `fn`, which encapsulates `if/else, if/else, ...` logic.
 * `R.cond` takes a list of [predicate, transformer] pairs. All of the arguments
 * to `fn` are applied to each of the predicates in turn until one returns a
 * "truthy" value, at which point `fn` returns the result of applying its
 * arguments to the corresponding transformer. If none of the predicates
 * matches, `fn` returns undefined.
 *
 * @func
 * @memberOf R
 * @since v0.6.0
 * @category Logic
 * @sig [[(*... -> Boolean),(*... -> *)]] -> (*... -> *)
 * @param {Array} pairs A list of [predicate, transformer]
 * @return {Function}
 * @see R.ifElse, R.unless, R.when
 * @example
 *
 *      const fn = R.cond([
 *        [R.equals(0),   R.always('water freezes at 0°C')],
 *        [R.equals(100), R.always('water boils at 100°C')],
 *        [R.T,           temp => 'nothing special happens at ' + temp + '°C']
 *      ]);
 *      fn(0); //=> 'water freezes at 0°C'
 *      fn(50); //=> 'nothing special happens at 50°C'
 *      fn(100); //=> 'water boils at 100°C'
 */

var cond_cond =
/*#__PURE__*/
_curry1(function cond(pairs) {
  var arity = es_reduce(es_max, 0, es_map(function (pair) {
    return pair[0].length;
  }, pairs));
  return _arity(arity, function () {
    var idx = 0;

    while (idx < pairs.length) {
      if (pairs[idx][0].apply(this, arguments)) {
        return pairs[idx][1].apply(this, arguments);
      }

      idx += 1;
    }
  });
});

/* harmony default export */ var es_cond = (cond_cond);
// CONCATENATED MODULE: ./node_modules/ramda/es/constructN.js



/**
 * Wraps a constructor function inside a curried function that can be called
 * with the same arguments and returns the same type. The arity of the function
 * returned is specified to allow using variadic constructor functions.
 *
 * @func
 * @memberOf R
 * @since v0.4.0
 * @category Function
 * @sig Number -> (* -> {*}) -> (* -> {*})
 * @param {Number} n The arity of the constructor function.
 * @param {Function} Fn The constructor function to wrap.
 * @return {Function} A wrapped, curried constructor function.
 * @example
 *
 *      // Variadic Constructor function
 *      function Salad() {
 *        this.ingredients = arguments;
 *      }
 *
 *      Salad.prototype.recipe = function() {
 *        const instructions = R.map(ingredient => 'Add a dollop of ' + ingredient, this.ingredients);
 *        return R.join('\n', instructions);
 *      };
 *
 *      const ThreeLayerSalad = R.constructN(3, Salad);
 *
 *      // Notice we no longer need the 'new' keyword, and the constructor is curried for 3 arguments.
 *      const salad = ThreeLayerSalad('Mayonnaise')('Potato Chips')('Ketchup');
 *
 *      console.log(salad.recipe());
 *      // Add a dollop of Mayonnaise
 *      // Add a dollop of Potato Chips
 *      // Add a dollop of Ketchup
 */

var constructN_constructN =
/*#__PURE__*/
_curry2(function constructN(n, Fn) {
  if (n > 10) {
    throw new Error('Constructor with greater than ten arguments');
  }

  if (n === 0) {
    return function () {
      return new Fn();
    };
  }

  return es_curry(es_nAry(n, function ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
    switch (arguments.length) {
      case 1:
        return new Fn($0);

      case 2:
        return new Fn($0, $1);

      case 3:
        return new Fn($0, $1, $2);

      case 4:
        return new Fn($0, $1, $2, $3);

      case 5:
        return new Fn($0, $1, $2, $3, $4);

      case 6:
        return new Fn($0, $1, $2, $3, $4, $5);

      case 7:
        return new Fn($0, $1, $2, $3, $4, $5, $6);

      case 8:
        return new Fn($0, $1, $2, $3, $4, $5, $6, $7);

      case 9:
        return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);

      case 10:
        return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
    }
  }));
});

/* harmony default export */ var es_constructN = (constructN_constructN);
// CONCATENATED MODULE: ./node_modules/ramda/es/construct.js


/**
 * Wraps a constructor function inside a curried function that can be called
 * with the same arguments and returns the same type.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig (* -> {*}) -> (* -> {*})
 * @param {Function} fn The constructor function to wrap.
 * @return {Function} A wrapped, curried constructor function.
 * @see R.invoker
 * @example
 *
 *      // Constructor function
 *      function Animal(kind) {
 *        this.kind = kind;
 *      };
 *      Animal.prototype.sighting = function() {
 *        return "It's a " + this.kind + "!";
 *      }
 *
 *      const AnimalConstructor = R.construct(Animal)
 *
 *      // Notice we no longer need the 'new' keyword:
 *      AnimalConstructor('Pig'); //=> {"kind": "Pig", "sighting": function (){...}};
 *
 *      const animalTypes = ["Lion", "Tiger", "Bear"];
 *      const animalSighting = R.invoker(0, 'sighting');
 *      const sightNewAnimal = R.compose(animalSighting, AnimalConstructor);
 *      R.map(sightNewAnimal, animalTypes); //=> ["It's a Lion!", "It's a Tiger!", "It's a Bear!"]
 */

var construct_construct =
/*#__PURE__*/
_curry1(function construct(Fn) {
  return es_constructN(Fn.length, Fn);
});

/* harmony default export */ var es_construct = (construct_construct);
// CONCATENATED MODULE: ./node_modules/ramda/es/contains.js


/**
 * Returns `true` if the specified value is equal, in [`R.equals`](#equals)
 * terms, to at least one element of the given list; `false` otherwise.
 * Works also with strings.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig a -> [a] -> Boolean
 * @param {Object} a The item to compare against.
 * @param {Array} list The array to consider.
 * @return {Boolean} `true` if an equivalent item is in the list, `false` otherwise.
 * @see R.includes
 * @deprecated since v0.26.0
 * @example
 *
 *      R.contains(3, [1, 2, 3]); //=> true
 *      R.contains(4, [1, 2, 3]); //=> false
 *      R.contains({ name: 'Fred' }, [{ name: 'Fred' }]); //=> true
 *      R.contains([42], [[42]]); //=> true
 *      R.contains('ba', 'banana'); //=>true
 */

var contains_contains =
/*#__PURE__*/
_curry2(_includes);

/* harmony default export */ var es_contains = (contains_contains);
// CONCATENATED MODULE: ./node_modules/ramda/es/converge.js






/**
 * Accepts a converging function and a list of branching functions and returns
 * a new function. The arity of the new function is the same as the arity of
 * the longest branching function. When invoked, this new function is applied
 * to some arguments, and each branching function is applied to those same
 * arguments. The results of each branching function are passed as arguments
 * to the converging function to produce the return value.
 *
 * @func
 * @memberOf R
 * @since v0.4.2
 * @category Function
 * @sig ((x1, x2, ...) -> z) -> [((a, b, ...) -> x1), ((a, b, ...) -> x2), ...] -> (a -> b -> ... -> z)
 * @param {Function} after A function. `after` will be invoked with the return values of
 *        `fn1` and `fn2` as its arguments.
 * @param {Array} functions A list of functions.
 * @return {Function} A new function.
 * @see R.useWith
 * @example
 *
 *      const average = R.converge(R.divide, [R.sum, R.length])
 *      average([1, 2, 3, 4, 5, 6, 7]) //=> 4
 *
 *      const strangeConcat = R.converge(R.concat, [R.toUpper, R.toLower])
 *      strangeConcat("Yodel") //=> "YODELyodel"
 *
 * @symb R.converge(f, [g, h])(a, b) = f(g(a, b), h(a, b))
 */

var converge_converge =
/*#__PURE__*/
_curry2(function converge(after, fns) {
  return es_curryN(es_reduce(es_max, 0, es_pluck('length', fns)), function () {
    var args = arguments;
    var context = this;
    return after.apply(context, _map(function (fn) {
      return fn.apply(context, args);
    }, fns));
  });
});

/* harmony default export */ var es_converge = (converge_converge);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xreduceBy.js




var _xreduceBy_XReduceBy =
/*#__PURE__*/
function () {
  function XReduceBy(valueFn, valueAcc, keyFn, xf) {
    this.valueFn = valueFn;
    this.valueAcc = valueAcc;
    this.keyFn = keyFn;
    this.xf = xf;
    this.inputs = {};
  }

  XReduceBy.prototype['@@transducer/init'] = _xfBase.init;

  XReduceBy.prototype['@@transducer/result'] = function (result) {
    var key;

    for (key in this.inputs) {
      if (_has(key, this.inputs)) {
        result = this.xf['@@transducer/step'](result, this.inputs[key]);

        if (result['@@transducer/reduced']) {
          result = result['@@transducer/value'];
          break;
        }
      }
    }

    this.inputs = null;
    return this.xf['@@transducer/result'](result);
  };

  XReduceBy.prototype['@@transducer/step'] = function (result, input) {
    var key = this.keyFn(input);
    this.inputs[key] = this.inputs[key] || [key, this.valueAcc];
    this.inputs[key][1] = this.valueFn(this.inputs[key][1], input);
    return result;
  };

  return XReduceBy;
}();

var _xreduceBy =
/*#__PURE__*/
_curryN(4, [], function _xreduceBy(valueFn, valueAcc, keyFn, xf) {
  return new _xreduceBy_XReduceBy(valueFn, valueAcc, keyFn, xf);
});

/* harmony default export */ var internal_xreduceBy = (_xreduceBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/reduceBy.js






/**
 * Groups the elements of the list according to the result of calling
 * the String-returning function `keyFn` on each element and reduces the elements
 * of each group to a single value via the reducer function `valueFn`.
 *
 * This function is basically a more general [`groupBy`](#groupBy) function.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.20.0
 * @category List
 * @sig ((a, b) -> a) -> a -> (b -> String) -> [b] -> {String: a}
 * @param {Function} valueFn The function that reduces the elements of each group to a single
 *        value. Receives two values, accumulator for a particular group and the current element.
 * @param {*} acc The (initial) accumulator value for each group.
 * @param {Function} keyFn The function that maps the list's element into a key.
 * @param {Array} list The array to group.
 * @return {Object} An object with the output of `keyFn` for keys, mapped to the output of
 *         `valueFn` for elements which produced that key when passed to `keyFn`.
 * @see R.groupBy, R.reduce
 * @example
 *
 *      const groupNames = (acc, {name}) => acc.concat(name)
 *      const toGrade = ({score}) =>
 *        score < 65 ? 'F' :
 *        score < 70 ? 'D' :
 *        score < 80 ? 'C' :
 *        score < 90 ? 'B' : 'A'
 *
 *      var students = [
 *        {name: 'Abby', score: 83},
 *        {name: 'Bart', score: 62},
 *        {name: 'Curt', score: 88},
 *        {name: 'Dora', score: 92},
 *      ]
 *
 *      reduceBy(groupNames, [], toGrade, students)
 *      //=> {"A": ["Dora"], "B": ["Abby", "Curt"], "F": ["Bart"]}
 */

var reduceBy_reduceBy =
/*#__PURE__*/
_curryN(4, [],
/*#__PURE__*/
_dispatchable([], internal_xreduceBy, function reduceBy(valueFn, valueAcc, keyFn, list) {
  return _reduce(function (acc, elt) {
    var key = keyFn(elt);
    acc[key] = valueFn(_has(key, acc) ? acc[key] : _clone(valueAcc, [], [], false), elt);
    return acc;
  }, {}, list);
}));

/* harmony default export */ var es_reduceBy = (reduceBy_reduceBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/countBy.js

/**
 * Counts the elements of a list according to how many match each value of a
 * key generated by the supplied function. Returns an object mapping the keys
 * produced by `fn` to the number of occurrences in the list. Note that all
 * keys are coerced to strings because of how JavaScript objects work.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig (a -> String) -> [a] -> {*}
 * @param {Function} fn The function used to map values to keys.
 * @param {Array} list The list to count elements from.
 * @return {Object} An object mapping keys to number of occurrences in the list.
 * @example
 *
 *      const numbers = [1.0, 1.1, 1.2, 2.0, 3.0, 2.2];
 *      R.countBy(Math.floor)(numbers);    //=> {'1': 3, '2': 2, '3': 1}
 *
 *      const letters = ['a', 'b', 'A', 'a', 'B', 'c'];
 *      R.countBy(R.toLower)(letters);   //=> {'a': 3, 'b': 2, 'c': 1}
 */

var countBy =
/*#__PURE__*/
es_reduceBy(function (acc, elem) {
  return acc + 1;
}, 0);
/* harmony default export */ var es_countBy = (countBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/dec.js

/**
 * Decrements its argument.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Math
 * @sig Number -> Number
 * @param {Number} n
 * @return {Number} n - 1
 * @see R.inc
 * @example
 *
 *      R.dec(42); //=> 41
 */

var dec =
/*#__PURE__*/
es_add(-1);
/* harmony default export */ var es_dec = (dec);
// CONCATENATED MODULE: ./node_modules/ramda/es/defaultTo.js

/**
 * Returns the second argument if it is not `null`, `undefined` or `NaN`;
 * otherwise the first argument is returned.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Logic
 * @sig a -> b -> a | b
 * @param {a} default The default value.
 * @param {b} val `val` will be returned instead of `default` unless `val` is `null`, `undefined` or `NaN`.
 * @return {*} The second value if it is not `null`, `undefined` or `NaN`, otherwise the default value
 * @example
 *
 *      const defaultTo42 = R.defaultTo(42);
 *
 *      defaultTo42(null);  //=> 42
 *      defaultTo42(undefined);  //=> 42
 *      defaultTo42(false);  //=> false
 *      defaultTo42('Ramda');  //=> 'Ramda'
 *      // parseInt('string') results in NaN
 *      defaultTo42(parseInt('string')); //=> 42
 */

var defaultTo =
/*#__PURE__*/
_curry2(function defaultTo(d, v) {
  return v == null || v !== v ? d : v;
});

/* harmony default export */ var es_defaultTo = (defaultTo);
// CONCATENATED MODULE: ./node_modules/ramda/es/descend.js

/**
 * Makes a descending comparator function out of a function that returns a value
 * that can be compared with `<` and `>`.
 *
 * @func
 * @memberOf R
 * @since v0.23.0
 * @category Function
 * @sig Ord b => (a -> b) -> a -> a -> Number
 * @param {Function} fn A function of arity one that returns a value that can be compared
 * @param {*} a The first item to be compared.
 * @param {*} b The second item to be compared.
 * @return {Number} `-1` if fn(a) > fn(b), `1` if fn(b) > fn(a), otherwise `0`
 * @see R.ascend
 * @example
 *
 *      const byAge = R.descend(R.prop('age'));
 *      const people = [
 *        { name: 'Emma', age: 70 },
 *        { name: 'Peter', age: 78 },
 *        { name: 'Mikhail', age: 62 },
 *      ];
 *      const peopleByOldestFirst = R.sort(byAge, people);
 *        //=> [{ name: 'Peter', age: 78 }, { name: 'Emma', age: 70 }, { name: 'Mikhail', age: 62 }]
 */

var descend =
/*#__PURE__*/
_curry3(function descend(fn, a, b) {
  var aa = fn(a);
  var bb = fn(b);
  return aa > bb ? -1 : aa < bb ? 1 : 0;
});

/* harmony default export */ var es_descend = (descend);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_Set.js


var _Set =
/*#__PURE__*/
function () {
  function _Set() {
    /* globals Set */
    this._nativeSet = typeof Set === 'function' ? new Set() : null;
    this._items = {};
  }

  // until we figure out why jsdoc chokes on this
  // @param item The item to add to the Set
  // @returns {boolean} true if the item did not exist prior, otherwise false
  //
  _Set.prototype.add = function (item) {
    return !hasOrAdd(item, true, this);
  }; //
  // @param item The item to check for existence in the Set
  // @returns {boolean} true if the item exists in the Set, otherwise false
  //


  _Set.prototype.has = function (item) {
    return hasOrAdd(item, false, this);
  }; //
  // Combines the logic for checking whether an item is a member of the set and
  // for adding a new item to the set.
  //
  // @param item       The item to check or add to the Set instance.
  // @param shouldAdd  If true, the item will be added to the set if it doesn't
  //                   already exist.
  // @param set        The set instance to check or add to.
  // @return {boolean} true if the item already existed, otherwise false.
  //


  return _Set;
}();

function hasOrAdd(item, shouldAdd, set) {
  var type = typeof item;
  var prevSize, newSize;

  switch (type) {
    case 'string':
    case 'number':
      // distinguish between +0 and -0
      if (item === 0 && 1 / item === -Infinity) {
        if (set._items['-0']) {
          return true;
        } else {
          if (shouldAdd) {
            set._items['-0'] = true;
          }

          return false;
        }
      } // these types can all utilise the native Set


      if (set._nativeSet !== null) {
        if (shouldAdd) {
          prevSize = set._nativeSet.size;

          set._nativeSet.add(item);

          newSize = set._nativeSet.size;
          return newSize === prevSize;
        } else {
          return set._nativeSet.has(item);
        }
      } else {
        if (!(type in set._items)) {
          if (shouldAdd) {
            set._items[type] = {};
            set._items[type][item] = true;
          }

          return false;
        } else if (item in set._items[type]) {
          return true;
        } else {
          if (shouldAdd) {
            set._items[type][item] = true;
          }

          return false;
        }
      }

    case 'boolean':
      // set._items['boolean'] holds a two element array
      // representing [ falseExists, trueExists ]
      if (type in set._items) {
        var bIdx = item ? 1 : 0;

        if (set._items[type][bIdx]) {
          return true;
        } else {
          if (shouldAdd) {
            set._items[type][bIdx] = true;
          }

          return false;
        }
      } else {
        if (shouldAdd) {
          set._items[type] = item ? [false, true] : [true, false];
        }

        return false;
      }

    case 'function':
      // compare functions for reference equality
      if (set._nativeSet !== null) {
        if (shouldAdd) {
          prevSize = set._nativeSet.size;

          set._nativeSet.add(item);

          newSize = set._nativeSet.size;
          return newSize === prevSize;
        } else {
          return set._nativeSet.has(item);
        }
      } else {
        if (!(type in set._items)) {
          if (shouldAdd) {
            set._items[type] = [item];
          }

          return false;
        }

        if (!_includes(item, set._items[type])) {
          if (shouldAdd) {
            set._items[type].push(item);
          }

          return false;
        }

        return true;
      }

    case 'undefined':
      if (set._items[type]) {
        return true;
      } else {
        if (shouldAdd) {
          set._items[type] = true;
        }

        return false;
      }

    case 'object':
      if (item === null) {
        if (!set._items['null']) {
          if (shouldAdd) {
            set._items['null'] = true;
          }

          return false;
        }

        return true;
      }

    /* falls through */

    default:
      // reduce the search size of heterogeneous sets by creating buckets
      // for each type.
      type = Object.prototype.toString.call(item);

      if (!(type in set._items)) {
        if (shouldAdd) {
          set._items[type] = [item];
        }

        return false;
      } // scan through all previously applied items


      if (!_includes(item, set._items[type])) {
        if (shouldAdd) {
          set._items[type].push(item);
        }

        return false;
      }

      return true;
  }
} // A simple Set type that honours R.equals semantics


/* harmony default export */ var internal_Set = (_Set);
// CONCATENATED MODULE: ./node_modules/ramda/es/difference.js


/**
 * Finds the set (i.e. no duplicates) of all elements in the first list not
 * contained in the second list. Objects and Arrays are compared in terms of
 * value equality, not reference equality.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig [*] -> [*] -> [*]
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The elements in `list1` that are not in `list2`.
 * @see R.differenceWith, R.symmetricDifference, R.symmetricDifferenceWith, R.without
 * @example
 *
 *      R.difference([1,2,3,4], [7,6,5,4,3]); //=> [1,2]
 *      R.difference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5]
 *      R.difference([{a: 1}, {b: 2}], [{a: 1}, {c: 3}]) //=> [{b: 2}]
 */

var difference_difference =
/*#__PURE__*/
_curry2(function difference(first, second) {
  var out = [];
  var idx = 0;
  var firstLen = first.length;
  var secondLen = second.length;
  var toFilterOut = new internal_Set();

  for (var i = 0; i < secondLen; i += 1) {
    toFilterOut.add(second[i]);
  }

  while (idx < firstLen) {
    if (toFilterOut.add(first[idx])) {
      out[out.length] = first[idx];
    }

    idx += 1;
  }

  return out;
});

/* harmony default export */ var es_difference = (difference_difference);
// CONCATENATED MODULE: ./node_modules/ramda/es/differenceWith.js


/**
 * Finds the set (i.e. no duplicates) of all elements in the first list not
 * contained in the second list. Duplication is determined according to the
 * value returned by applying the supplied predicate to two list elements.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig ((a, a) -> Boolean) -> [a] -> [a] -> [a]
 * @param {Function} pred A predicate used to test whether two items are equal.
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The elements in `list1` that are not in `list2`.
 * @see R.difference, R.symmetricDifference, R.symmetricDifferenceWith
 * @example
 *
 *      const cmp = (x, y) => x.a === y.a;
 *      const l1 = [{a: 1}, {a: 2}, {a: 3}];
 *      const l2 = [{a: 3}, {a: 4}];
 *      R.differenceWith(cmp, l1, l2); //=> [{a: 1}, {a: 2}]
 */

var differenceWith_differenceWith =
/*#__PURE__*/
_curry3(function differenceWith(pred, first, second) {
  var out = [];
  var idx = 0;
  var firstLen = first.length;

  while (idx < firstLen) {
    if (!_includesWith(pred, first[idx], second) && !_includesWith(pred, first[idx], out)) {
      out.push(first[idx]);
    }

    idx += 1;
  }

  return out;
});

/* harmony default export */ var es_differenceWith = (differenceWith_differenceWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/dissoc.js

/**
 * Returns a new object that does not contain a `prop` property.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Object
 * @sig String -> {k: v} -> {k: v}
 * @param {String} prop The name of the property to dissociate
 * @param {Object} obj The object to clone
 * @return {Object} A new object equivalent to the original but without the specified property
 * @see R.assoc, R.omit
 * @example
 *
 *      R.dissoc('b', {a: 1, b: 2, c: 3}); //=> {a: 1, c: 3}
 */

var dissoc =
/*#__PURE__*/
_curry2(function dissoc(prop, obj) {
  var result = {};

  for (var p in obj) {
    result[p] = obj[p];
  }

  delete result[prop];
  return result;
});

/* harmony default export */ var es_dissoc = (dissoc);
// CONCATENATED MODULE: ./node_modules/ramda/es/remove.js

/**
 * Removes the sub-list of `list` starting at index `start` and containing
 * `count` elements. _Note that this is not destructive_: it returns a copy of
 * the list with the changes.
 * <small>No lists have been harmed in the application of this function.</small>
 *
 * @func
 * @memberOf R
 * @since v0.2.2
 * @category List
 * @sig Number -> Number -> [a] -> [a]
 * @param {Number} start The position to start removing elements
 * @param {Number} count The number of elements to remove
 * @param {Array} list The list to remove from
 * @return {Array} A new Array with `count` elements from `start` removed.
 * @see R.without
 * @example
 *
 *      R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
 */

var remove =
/*#__PURE__*/
_curry3(function remove(start, count, list) {
  var result = Array.prototype.slice.call(list, 0);
  result.splice(start, count);
  return result;
});

/* harmony default export */ var es_remove = (remove);
// CONCATENATED MODULE: ./node_modules/ramda/es/update.js



/**
 * Returns a new copy of the array with the element at the provided index
 * replaced with the given value.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category List
 * @sig Number -> a -> [a] -> [a]
 * @param {Number} idx The index to update.
 * @param {*} x The value to exist at the given index of the returned array.
 * @param {Array|Arguments} list The source array-like object to be updated.
 * @return {Array} A copy of `list` with the value at index `idx` replaced with `x`.
 * @see R.adjust
 * @example
 *
 *      R.update(1, '_', ['a', 'b', 'c']);      //=> ['a', '_', 'c']
 *      R.update(-1, '_', ['a', 'b', 'c']);     //=> ['a', 'b', '_']
 * @symb R.update(-1, a, [b, c]) = [b, a]
 * @symb R.update(0, a, [b, c]) = [a, c]
 * @symb R.update(1, a, [b, c]) = [b, a]
 */

var update_update =
/*#__PURE__*/
_curry3(function update(idx, x, list) {
  return es_adjust(idx, es_always(x), list);
});

/* harmony default export */ var es_update = (update_update);
// CONCATENATED MODULE: ./node_modules/ramda/es/dissocPath.js







/**
 * Makes a shallow clone of an object, omitting the property at the given path.
 * Note that this copies and flattens prototype properties onto the new object
 * as well. All non-primitive properties are copied by reference.
 *
 * @func
 * @memberOf R
 * @since v0.11.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig [Idx] -> {k: v} -> {k: v}
 * @param {Array} path The path to the value to omit
 * @param {Object} obj The object to clone
 * @return {Object} A new object without the property at path
 * @see R.assocPath
 * @example
 *
 *      R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}}); //=> {a: {b: {}}}
 */

var dissocPath_dissocPath =
/*#__PURE__*/
_curry2(function dissocPath(path, obj) {
  switch (path.length) {
    case 0:
      return obj;

    case 1:
      return _isInteger(path[0]) && _isArray(obj) ? es_remove(path[0], 1, obj) : es_dissoc(path[0], obj);

    default:
      var head = path[0];
      var tail = Array.prototype.slice.call(path, 1);

      if (obj[head] == null) {
        return obj;
      } else if (_isInteger(head) && _isArray(obj)) {
        return es_update(head, dissocPath(tail, obj[head]), obj);
      } else {
        return es_assoc(head, dissocPath(tail, obj[head]), obj);
      }

  }
});

/* harmony default export */ var es_dissocPath = (dissocPath_dissocPath);
// CONCATENATED MODULE: ./node_modules/ramda/es/divide.js

/**
 * Divides two numbers. Equivalent to `a / b`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} a The first value.
 * @param {Number} b The second value.
 * @return {Number} The result of `a / b`.
 * @see R.multiply
 * @example
 *
 *      R.divide(71, 100); //=> 0.71
 *
 *      const half = R.divide(R.__, 2);
 *      half(42); //=> 21
 *
 *      const reciprocal = R.divide(1);
 *      reciprocal(4);   //=> 0.25
 */

var divide =
/*#__PURE__*/
_curry2(function divide(a, b) {
  return a / b;
});

/* harmony default export */ var es_divide = (divide);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xdrop.js



var _xdrop_XDrop =
/*#__PURE__*/
function () {
  function XDrop(n, xf) {
    this.xf = xf;
    this.n = n;
  }

  XDrop.prototype['@@transducer/init'] = _xfBase.init;
  XDrop.prototype['@@transducer/result'] = _xfBase.result;

  XDrop.prototype['@@transducer/step'] = function (result, input) {
    if (this.n > 0) {
      this.n -= 1;
      return result;
    }

    return this.xf['@@transducer/step'](result, input);
  };

  return XDrop;
}();

var _xdrop =
/*#__PURE__*/
_curry2(function _xdrop(n, xf) {
  return new _xdrop_XDrop(n, xf);
});

/* harmony default export */ var internal_xdrop = (_xdrop);
// CONCATENATED MODULE: ./node_modules/ramda/es/drop.js




/**
 * Returns all but the first `n` elements of the given list, string, or
 * transducer/transformer (or object with a `drop` method).
 *
 * Dispatches to the `drop` method of the second argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Number -> [a] -> [a]
 * @sig Number -> String -> String
 * @param {Number} n
 * @param {*} list
 * @return {*} A copy of list without the first `n` elements
 * @see R.take, R.transduce, R.dropLast, R.dropWhile
 * @example
 *
 *      R.drop(1, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
 *      R.drop(2, ['foo', 'bar', 'baz']); //=> ['baz']
 *      R.drop(3, ['foo', 'bar', 'baz']); //=> []
 *      R.drop(4, ['foo', 'bar', 'baz']); //=> []
 *      R.drop(3, 'ramda');               //=> 'da'
 */

var drop_drop =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['drop'], internal_xdrop, function drop(n, xs) {
  return es_slice(Math.max(0, n), Infinity, xs);
}));

/* harmony default export */ var es_drop = (drop_drop);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xtake.js




var _xtake_XTake =
/*#__PURE__*/
function () {
  function XTake(n, xf) {
    this.xf = xf;
    this.n = n;
    this.i = 0;
  }

  XTake.prototype['@@transducer/init'] = _xfBase.init;
  XTake.prototype['@@transducer/result'] = _xfBase.result;

  XTake.prototype['@@transducer/step'] = function (result, input) {
    this.i += 1;
    var ret = this.n === 0 ? result : this.xf['@@transducer/step'](result, input);
    return this.n >= 0 && this.i >= this.n ? _reduced(ret) : ret;
  };

  return XTake;
}();

var _xtake =
/*#__PURE__*/
_curry2(function _xtake(n, xf) {
  return new _xtake_XTake(n, xf);
});

/* harmony default export */ var internal_xtake = (_xtake);
// CONCATENATED MODULE: ./node_modules/ramda/es/take.js




/**
 * Returns the first `n` elements of the given list, string, or
 * transducer/transformer (or object with a `take` method).
 *
 * Dispatches to the `take` method of the second argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Number -> [a] -> [a]
 * @sig Number -> String -> String
 * @param {Number} n
 * @param {*} list
 * @return {*}
 * @see R.drop
 * @example
 *
 *      R.take(1, ['foo', 'bar', 'baz']); //=> ['foo']
 *      R.take(2, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
 *      R.take(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
 *      R.take(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
 *      R.take(3, 'ramda');               //=> 'ram'
 *
 *      const personnel = [
 *        'Dave Brubeck',
 *        'Paul Desmond',
 *        'Eugene Wright',
 *        'Joe Morello',
 *        'Gerry Mulligan',
 *        'Bob Bates',
 *        'Joe Dodge',
 *        'Ron Crotty'
 *      ];
 *
 *      const takeFive = R.take(5);
 *      takeFive(personnel);
 *      //=> ['Dave Brubeck', 'Paul Desmond', 'Eugene Wright', 'Joe Morello', 'Gerry Mulligan']
 * @symb R.take(-1, [a, b]) = [a, b]
 * @symb R.take(0, [a, b]) = []
 * @symb R.take(1, [a, b]) = [a]
 * @symb R.take(2, [a, b]) = [a, b]
 */

var take_take =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['take'], internal_xtake, function take(n, xs) {
  return es_slice(0, n < 0 ? Infinity : n, xs);
}));

/* harmony default export */ var es_take = (take_take);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_dropLast.js

function dropLast(n, xs) {
  return es_take(n < xs.length ? xs.length - n : 0, xs);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xdropLast.js



var _xdropLast_XDropLast =
/*#__PURE__*/
function () {
  function XDropLast(n, xf) {
    this.xf = xf;
    this.pos = 0;
    this.full = false;
    this.acc = new Array(n);
  }

  XDropLast.prototype['@@transducer/init'] = _xfBase.init;

  XDropLast.prototype['@@transducer/result'] = function (result) {
    this.acc = null;
    return this.xf['@@transducer/result'](result);
  };

  XDropLast.prototype['@@transducer/step'] = function (result, input) {
    if (this.full) {
      result = this.xf['@@transducer/step'](result, this.acc[this.pos]);
    }

    this.store(input);
    return result;
  };

  XDropLast.prototype.store = function (input) {
    this.acc[this.pos] = input;
    this.pos += 1;

    if (this.pos === this.acc.length) {
      this.pos = 0;
      this.full = true;
    }
  };

  return XDropLast;
}();

var _xdropLast =
/*#__PURE__*/
_curry2(function _xdropLast(n, xf) {
  return new _xdropLast_XDropLast(n, xf);
});

/* harmony default export */ var internal_xdropLast = (_xdropLast);
// CONCATENATED MODULE: ./node_modules/ramda/es/dropLast.js




/**
 * Returns a list containing all but the last `n` elements of the given `list`.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig Number -> [a] -> [a]
 * @sig Number -> String -> String
 * @param {Number} n The number of elements of `list` to skip.
 * @param {Array} list The list of elements to consider.
 * @return {Array} A copy of the list with only the first `list.length - n` elements
 * @see R.takeLast, R.drop, R.dropWhile, R.dropLastWhile
 * @example
 *
 *      R.dropLast(1, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
 *      R.dropLast(2, ['foo', 'bar', 'baz']); //=> ['foo']
 *      R.dropLast(3, ['foo', 'bar', 'baz']); //=> []
 *      R.dropLast(4, ['foo', 'bar', 'baz']); //=> []
 *      R.dropLast(3, 'ramda');               //=> 'ra'
 */

var dropLast_dropLast =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xdropLast, dropLast));

/* harmony default export */ var es_dropLast = (dropLast_dropLast);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_dropLastWhile.js

function dropLastWhile(pred, xs) {
  var idx = xs.length - 1;

  while (idx >= 0 && pred(xs[idx])) {
    idx -= 1;
  }

  return es_slice(0, idx + 1, xs);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xdropLastWhile.js




var _xdropLastWhile_XDropLastWhile =
/*#__PURE__*/
function () {
  function XDropLastWhile(fn, xf) {
    this.f = fn;
    this.retained = [];
    this.xf = xf;
  }

  XDropLastWhile.prototype['@@transducer/init'] = _xfBase.init;

  XDropLastWhile.prototype['@@transducer/result'] = function (result) {
    this.retained = null;
    return this.xf['@@transducer/result'](result);
  };

  XDropLastWhile.prototype['@@transducer/step'] = function (result, input) {
    return this.f(input) ? this.retain(result, input) : this.flush(result, input);
  };

  XDropLastWhile.prototype.flush = function (result, input) {
    result = _reduce(this.xf['@@transducer/step'], result, this.retained);
    this.retained = [];
    return this.xf['@@transducer/step'](result, input);
  };

  XDropLastWhile.prototype.retain = function (result, input) {
    this.retained.push(input);
    return result;
  };

  return XDropLastWhile;
}();

var _xdropLastWhile =
/*#__PURE__*/
_curry2(function _xdropLastWhile(fn, xf) {
  return new _xdropLastWhile_XDropLastWhile(fn, xf);
});

/* harmony default export */ var internal_xdropLastWhile = (_xdropLastWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/dropLastWhile.js




/**
 * Returns a new list excluding all the tailing elements of a given list which
 * satisfy the supplied predicate function. It passes each value from the right
 * to the supplied predicate function, skipping elements until the predicate
 * function returns a `falsy` value. The predicate function is applied to one argument:
 * *(value)*.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> [a]
 * @sig (a -> Boolean) -> String -> String
 * @param {Function} predicate The function to be called on each element
 * @param {Array} xs The collection to iterate over.
 * @return {Array} A new array without any trailing elements that return `falsy` values from the `predicate`.
 * @see R.takeLastWhile, R.addIndex, R.drop, R.dropWhile
 * @example
 *
 *      const lteThree = x => x <= 3;
 *
 *      R.dropLastWhile(lteThree, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3, 4]
 *
 *      R.dropLastWhile(x => x !== 'd' , 'Ramda'); //=> 'Ramd'
 */

var dropLastWhile_dropLastWhile =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xdropLastWhile, dropLastWhile));

/* harmony default export */ var es_dropLastWhile = (dropLastWhile_dropLastWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xdropRepeatsWith.js



var _xdropRepeatsWith_XDropRepeatsWith =
/*#__PURE__*/
function () {
  function XDropRepeatsWith(pred, xf) {
    this.xf = xf;
    this.pred = pred;
    this.lastValue = undefined;
    this.seenFirstValue = false;
  }

  XDropRepeatsWith.prototype['@@transducer/init'] = _xfBase.init;
  XDropRepeatsWith.prototype['@@transducer/result'] = _xfBase.result;

  XDropRepeatsWith.prototype['@@transducer/step'] = function (result, input) {
    var sameAsLast = false;

    if (!this.seenFirstValue) {
      this.seenFirstValue = true;
    } else if (this.pred(this.lastValue, input)) {
      sameAsLast = true;
    }

    this.lastValue = input;
    return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
  };

  return XDropRepeatsWith;
}();

var _xdropRepeatsWith =
/*#__PURE__*/
_curry2(function _xdropRepeatsWith(pred, xf) {
  return new _xdropRepeatsWith_XDropRepeatsWith(pred, xf);
});

/* harmony default export */ var internal_xdropRepeatsWith = (_xdropRepeatsWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/last.js

/**
 * Returns the last element of the given list or string.
 *
 * @func
 * @memberOf R
 * @since v0.1.4
 * @category List
 * @sig [a] -> a | Undefined
 * @sig String -> String
 * @param {*} list
 * @return {*}
 * @see R.init, R.head, R.tail
 * @example
 *
 *      R.last(['fi', 'fo', 'fum']); //=> 'fum'
 *      R.last([]); //=> undefined
 *
 *      R.last('abc'); //=> 'c'
 *      R.last(''); //=> ''
 */

var last_last =
/*#__PURE__*/
es_nth(-1);
/* harmony default export */ var es_last = (last_last);
// CONCATENATED MODULE: ./node_modules/ramda/es/dropRepeatsWith.js




/**
 * Returns a new list without any consecutively repeating elements. Equality is
 * determined by applying the supplied predicate to each pair of consecutive elements. The
 * first element in a series of equal elements will be preserved.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category List
 * @sig ((a, a) -> Boolean) -> [a] -> [a]
 * @param {Function} pred A predicate used to test whether two items are equal.
 * @param {Array} list The array to consider.
 * @return {Array} `list` without repeating elements.
 * @see R.transduce
 * @example
 *
 *      const l = [1, -1, 1, 3, 4, -4, -4, -5, 5, 3, 3];
 *      R.dropRepeatsWith(R.eqBy(Math.abs), l); //=> [1, 3, 4, -5, 3]
 */

var dropRepeatsWith_dropRepeatsWith =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xdropRepeatsWith, function dropRepeatsWith(pred, list) {
  var result = [];
  var idx = 1;
  var len = list.length;

  if (len !== 0) {
    result[0] = list[0];

    while (idx < len) {
      if (!pred(es_last(result), list[idx])) {
        result[result.length] = list[idx];
      }

      idx += 1;
    }
  }

  return result;
}));

/* harmony default export */ var es_dropRepeatsWith = (dropRepeatsWith_dropRepeatsWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/dropRepeats.js





/**
 * Returns a new list without any consecutively repeating elements.
 * [`R.equals`](#equals) is used to determine equality.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category List
 * @sig [a] -> [a]
 * @param {Array} list The array to consider.
 * @return {Array} `list` without repeating elements.
 * @see R.transduce
 * @example
 *
 *     R.dropRepeats([1, 1, 1, 2, 3, 4, 4, 2, 2]); //=> [1, 2, 3, 4, 2]
 */

var dropRepeats =
/*#__PURE__*/
_curry1(
/*#__PURE__*/
_dispatchable([],
/*#__PURE__*/
internal_xdropRepeatsWith(es_equals),
/*#__PURE__*/
es_dropRepeatsWith(es_equals)));

/* harmony default export */ var es_dropRepeats = (dropRepeats);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xdropWhile.js



var _xdropWhile_XDropWhile =
/*#__PURE__*/
function () {
  function XDropWhile(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
  XDropWhile.prototype['@@transducer/result'] = _xfBase.result;

  XDropWhile.prototype['@@transducer/step'] = function (result, input) {
    if (this.f) {
      if (this.f(input)) {
        return result;
      }

      this.f = null;
    }

    return this.xf['@@transducer/step'](result, input);
  };

  return XDropWhile;
}();

var _xdropWhile =
/*#__PURE__*/
_curry2(function _xdropWhile(f, xf) {
  return new _xdropWhile_XDropWhile(f, xf);
});

/* harmony default export */ var internal_xdropWhile = (_xdropWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/dropWhile.js




/**
 * Returns a new list excluding the leading elements of a given list which
 * satisfy the supplied predicate function. It passes each value to the supplied
 * predicate function, skipping elements while the predicate function returns
 * `true`. The predicate function is applied to one argument: *(value)*.
 *
 * Dispatches to the `dropWhile` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> [a]
 * @sig (a -> Boolean) -> String -> String
 * @param {Function} fn The function called per iteration.
 * @param {Array} xs The collection to iterate over.
 * @return {Array} A new array.
 * @see R.takeWhile, R.transduce, R.addIndex
 * @example
 *
 *      const lteTwo = x => x <= 2;
 *
 *      R.dropWhile(lteTwo, [1, 2, 3, 4, 3, 2, 1]); //=> [3, 4, 3, 2, 1]
 *
 *      R.dropWhile(x => x !== 'd' , 'Ramda'); //=> 'da'
 */

var dropWhile_dropWhile =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['dropWhile'], internal_xdropWhile, function dropWhile(pred, xs) {
  var idx = 0;
  var len = xs.length;

  while (idx < len && pred(xs[idx])) {
    idx += 1;
  }

  return es_slice(idx, Infinity, xs);
}));

/* harmony default export */ var es_dropWhile = (dropWhile_dropWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/or.js

/**
 * Returns `true` if one or both of its arguments are `true`. Returns `false`
 * if both arguments are `false`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Logic
 * @sig a -> b -> a | b
 * @param {Any} a
 * @param {Any} b
 * @return {Any} the first argument if truthy, otherwise the second argument.
 * @see R.either, R.xor
 * @example
 *
 *      R.or(true, true); //=> true
 *      R.or(true, false); //=> true
 *      R.or(false, true); //=> true
 *      R.or(false, false); //=> false
 */

var or =
/*#__PURE__*/
_curry2(function or(a, b) {
  return a || b;
});

/* harmony default export */ var es_or = (or);
// CONCATENATED MODULE: ./node_modules/ramda/es/either.js




/**
 * A function wrapping calls to the two functions in an `||` operation,
 * returning the result of the first function if it is truth-y and the result
 * of the second function otherwise. Note that this is short-circuited,
 * meaning that the second function will not be invoked if the first returns a
 * truth-y value.
 *
 * In addition to functions, `R.either` also accepts any fantasy-land compatible
 * applicative functor.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category Logic
 * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
 * @param {Function} f a predicate
 * @param {Function} g another predicate
 * @return {Function} a function that applies its arguments to `f` and `g` and `||`s their outputs together.
 * @see R.or
 * @example
 *
 *      const gt10 = x => x > 10;
 *      const even = x => x % 2 === 0;
 *      const f = R.either(gt10, even);
 *      f(101); //=> true
 *      f(8); //=> true
 *
 *      R.either(Maybe.Just(false), Maybe.Just(55)); // => Maybe.Just(55)
 *      R.either([false, false, 'a'], [11]) // => [11, 11, "a"]
 */

var either_either =
/*#__PURE__*/
_curry2(function either(f, g) {
  return _isFunction(f) ? function _either() {
    return f.apply(this, arguments) || g.apply(this, arguments);
  } : es_lift(es_or)(f, g);
});

/* harmony default export */ var es_either = (either_either);
// CONCATENATED MODULE: ./node_modules/ramda/es/empty.js





/**
 * Returns the empty value of its argument's type. Ramda defines the empty
 * value of Array (`[]`), Object (`{}`), String (`''`), and Arguments. Other
 * types are supported if they define `<Type>.empty`,
 * `<Type>.prototype.empty` or implement the
 * [FantasyLand Monoid spec](https://github.com/fantasyland/fantasy-land#monoid).
 *
 * Dispatches to the `empty` method of the first argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category Function
 * @sig a -> a
 * @param {*} x
 * @return {*}
 * @example
 *
 *      R.empty(Just(42));      //=> Nothing()
 *      R.empty([1, 2, 3]);     //=> []
 *      R.empty('unicorns');    //=> ''
 *      R.empty({x: 1, y: 2});  //=> {}
 */

var empty_empty =
/*#__PURE__*/
_curry1(function empty(x) {
  return x != null && typeof x['fantasy-land/empty'] === 'function' ? x['fantasy-land/empty']() : x != null && x.constructor != null && typeof x.constructor['fantasy-land/empty'] === 'function' ? x.constructor['fantasy-land/empty']() : x != null && typeof x.empty === 'function' ? x.empty() : x != null && x.constructor != null && typeof x.constructor.empty === 'function' ? x.constructor.empty() : _isArray(x) ? [] : _isString(x) ? '' : _isObject(x) ? {} : internal_isArguments(x) ? function () {
    return arguments;
  }() : void 0 // else
  ;
});

/* harmony default export */ var es_empty = (empty_empty);
// CONCATENATED MODULE: ./node_modules/ramda/es/takeLast.js


/**
 * Returns a new list containing the last `n` elements of the given list.
 * If `n > list.length`, returns a list of `list.length` elements.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig Number -> [a] -> [a]
 * @sig Number -> String -> String
 * @param {Number} n The number of elements to return.
 * @param {Array} xs The collection to consider.
 * @return {Array}
 * @see R.dropLast
 * @example
 *
 *      R.takeLast(1, ['foo', 'bar', 'baz']); //=> ['baz']
 *      R.takeLast(2, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
 *      R.takeLast(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
 *      R.takeLast(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
 *      R.takeLast(3, 'ramda');               //=> 'mda'
 */

var takeLast_takeLast =
/*#__PURE__*/
_curry2(function takeLast(n, xs) {
  return es_drop(n >= 0 ? xs.length - n : 0, xs);
});

/* harmony default export */ var es_takeLast = (takeLast_takeLast);
// CONCATENATED MODULE: ./node_modules/ramda/es/endsWith.js



/**
 * Checks if a list ends with the provided sublist.
 *
 * Similarly, checks if a string ends with the provided substring.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category List
 * @sig [a] -> [a] -> Boolean
 * @sig String -> String -> Boolean
 * @param {*} suffix
 * @param {*} list
 * @return {Boolean}
 * @see R.startsWith
 * @example
 *
 *      R.endsWith('c', 'abc')                //=> true
 *      R.endsWith('b', 'abc')                //=> false
 *      R.endsWith(['c'], ['a', 'b', 'c'])    //=> true
 *      R.endsWith(['b'], ['a', 'b', 'c'])    //=> false
 */

var endsWith =
/*#__PURE__*/
_curry2(function (suffix, list) {
  return es_equals(es_takeLast(suffix.length, list), suffix);
});

/* harmony default export */ var es_endsWith = (endsWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/eqBy.js


/**
 * Takes a function and two values in its domain and returns `true` if the
 * values map to the same value in the codomain; `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category Relation
 * @sig (a -> b) -> a -> a -> Boolean
 * @param {Function} f
 * @param {*} x
 * @param {*} y
 * @return {Boolean}
 * @example
 *
 *      R.eqBy(Math.abs, 5, -5); //=> true
 */

var eqBy_eqBy =
/*#__PURE__*/
_curry3(function eqBy(f, x, y) {
  return es_equals(f(x), f(y));
});

/* harmony default export */ var es_eqBy = (eqBy_eqBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/eqProps.js


/**
 * Reports whether two objects have the same value, in [`R.equals`](#equals)
 * terms, for the specified property. Useful as a curried predicate.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig k -> {k: v} -> {k: v} -> Boolean
 * @param {String} prop The name of the property to compare
 * @param {Object} obj1
 * @param {Object} obj2
 * @return {Boolean}
 *
 * @example
 *
 *      const o1 = { a: 1, b: 2, c: 3, d: 4 };
 *      const o2 = { a: 10, b: 20, c: 3, d: 40 };
 *      R.eqProps('a', o1, o2); //=> false
 *      R.eqProps('c', o1, o2); //=> true
 */

var eqProps_eqProps =
/*#__PURE__*/
_curry3(function eqProps(prop, obj1, obj2) {
  return es_equals(obj1[prop], obj2[prop]);
});

/* harmony default export */ var es_eqProps = (eqProps_eqProps);
// CONCATENATED MODULE: ./node_modules/ramda/es/evolve.js

/**
 * Creates a new object by recursively evolving a shallow copy of `object`,
 * according to the `transformation` functions. All non-primitive properties
 * are copied by reference.
 *
 * A `transformation` function will not be invoked if its corresponding key
 * does not exist in the evolved object.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Object
 * @sig {k: (v -> v)} -> {k: v} -> {k: v}
 * @param {Object} transformations The object specifying transformation functions to apply
 *        to the object.
 * @param {Object} object The object to be transformed.
 * @return {Object} The transformed object.
 * @example
 *
 *      const tomato = {firstName: '  Tomato ', data: {elapsed: 100, remaining: 1400}, id:123};
 *      const transformations = {
 *        firstName: R.trim,
 *        lastName: R.trim, // Will not get invoked.
 *        data: {elapsed: R.add(1), remaining: R.add(-1)}
 *      };
 *      R.evolve(transformations, tomato); //=> {firstName: 'Tomato', data: {elapsed: 101, remaining: 1399}, id:123}
 */

var evolve =
/*#__PURE__*/
_curry2(function evolve(transformations, object) {
  var result = object instanceof Array ? [] : {};
  var transformation, key, type;

  for (key in object) {
    transformation = transformations[key];
    type = typeof transformation;
    result[key] = type === 'function' ? transformation(object[key]) : transformation && type === 'object' ? evolve(transformation, object[key]) : object[key];
  }

  return result;
});

/* harmony default export */ var es_evolve = (evolve);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfind.js




var _xfind_XFind =
/*#__PURE__*/
function () {
  function XFind(f, xf) {
    this.xf = xf;
    this.f = f;
    this.found = false;
  }

  XFind.prototype['@@transducer/init'] = _xfBase.init;

  XFind.prototype['@@transducer/result'] = function (result) {
    if (!this.found) {
      result = this.xf['@@transducer/step'](result, void 0);
    }

    return this.xf['@@transducer/result'](result);
  };

  XFind.prototype['@@transducer/step'] = function (result, input) {
    if (this.f(input)) {
      this.found = true;
      result = _reduced(this.xf['@@transducer/step'](result, input));
    }

    return result;
  };

  return XFind;
}();

var _xfind =
/*#__PURE__*/
_curry2(function _xfind(f, xf) {
  return new _xfind_XFind(f, xf);
});

/* harmony default export */ var internal_xfind = (_xfind);
// CONCATENATED MODULE: ./node_modules/ramda/es/find.js



/**
 * Returns the first element of the list which matches the predicate, or
 * `undefined` if no element matches.
 *
 * Dispatches to the `find` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> a | undefined
 * @param {Function} fn The predicate function used to determine if the element is the
 *        desired one.
 * @param {Array} list The array to consider.
 * @return {Object} The element found, or `undefined`.
 * @see R.transduce
 * @example
 *
 *      const xs = [{a: 1}, {a: 2}, {a: 3}];
 *      R.find(R.propEq('a', 2))(xs); //=> {a: 2}
 *      R.find(R.propEq('a', 4))(xs); //=> undefined
 */

var find =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['find'], internal_xfind, function find(fn, list) {
  var idx = 0;
  var len = list.length;

  while (idx < len) {
    if (fn(list[idx])) {
      return list[idx];
    }

    idx += 1;
  }
}));

/* harmony default export */ var es_find = (find);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfindIndex.js




var _xfindIndex_XFindIndex =
/*#__PURE__*/
function () {
  function XFindIndex(f, xf) {
    this.xf = xf;
    this.f = f;
    this.idx = -1;
    this.found = false;
  }

  XFindIndex.prototype['@@transducer/init'] = _xfBase.init;

  XFindIndex.prototype['@@transducer/result'] = function (result) {
    if (!this.found) {
      result = this.xf['@@transducer/step'](result, -1);
    }

    return this.xf['@@transducer/result'](result);
  };

  XFindIndex.prototype['@@transducer/step'] = function (result, input) {
    this.idx += 1;

    if (this.f(input)) {
      this.found = true;
      result = _reduced(this.xf['@@transducer/step'](result, this.idx));
    }

    return result;
  };

  return XFindIndex;
}();

var _xfindIndex =
/*#__PURE__*/
_curry2(function _xfindIndex(f, xf) {
  return new _xfindIndex_XFindIndex(f, xf);
});

/* harmony default export */ var internal_xfindIndex = (_xfindIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/findIndex.js



/**
 * Returns the index of the first element of the list which matches the
 * predicate, or `-1` if no element matches.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category List
 * @sig (a -> Boolean) -> [a] -> Number
 * @param {Function} fn The predicate function used to determine if the element is the
 * desired one.
 * @param {Array} list The array to consider.
 * @return {Number} The index of the element found, or `-1`.
 * @see R.transduce
 * @example
 *
 *      const xs = [{a: 1}, {a: 2}, {a: 3}];
 *      R.findIndex(R.propEq('a', 2))(xs); //=> 1
 *      R.findIndex(R.propEq('a', 4))(xs); //=> -1
 */

var findIndex =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xfindIndex, function findIndex(fn, list) {
  var idx = 0;
  var len = list.length;

  while (idx < len) {
    if (fn(list[idx])) {
      return idx;
    }

    idx += 1;
  }

  return -1;
}));

/* harmony default export */ var es_findIndex = (findIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfindLast.js



var _xfindLast_XFindLast =
/*#__PURE__*/
function () {
  function XFindLast(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XFindLast.prototype['@@transducer/init'] = _xfBase.init;

  XFindLast.prototype['@@transducer/result'] = function (result) {
    return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
  };

  XFindLast.prototype['@@transducer/step'] = function (result, input) {
    if (this.f(input)) {
      this.last = input;
    }

    return result;
  };

  return XFindLast;
}();

var _xfindLast =
/*#__PURE__*/
_curry2(function _xfindLast(f, xf) {
  return new _xfindLast_XFindLast(f, xf);
});

/* harmony default export */ var internal_xfindLast = (_xfindLast);
// CONCATENATED MODULE: ./node_modules/ramda/es/findLast.js



/**
 * Returns the last element of the list which matches the predicate, or
 * `undefined` if no element matches.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category List
 * @sig (a -> Boolean) -> [a] -> a | undefined
 * @param {Function} fn The predicate function used to determine if the element is the
 * desired one.
 * @param {Array} list The array to consider.
 * @return {Object} The element found, or `undefined`.
 * @see R.transduce
 * @example
 *
 *      const xs = [{a: 1, b: 0}, {a:1, b: 1}];
 *      R.findLast(R.propEq('a', 1))(xs); //=> {a: 1, b: 1}
 *      R.findLast(R.propEq('a', 4))(xs); //=> undefined
 */

var findLast =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xfindLast, function findLast(fn, list) {
  var idx = list.length - 1;

  while (idx >= 0) {
    if (fn(list[idx])) {
      return list[idx];
    }

    idx -= 1;
  }
}));

/* harmony default export */ var es_findLast = (findLast);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xfindLastIndex.js



var _xfindLastIndex_XFindLastIndex =
/*#__PURE__*/
function () {
  function XFindLastIndex(f, xf) {
    this.xf = xf;
    this.f = f;
    this.idx = -1;
    this.lastIdx = -1;
  }

  XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;

  XFindLastIndex.prototype['@@transducer/result'] = function (result) {
    return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
  };

  XFindLastIndex.prototype['@@transducer/step'] = function (result, input) {
    this.idx += 1;

    if (this.f(input)) {
      this.lastIdx = this.idx;
    }

    return result;
  };

  return XFindLastIndex;
}();

var _xfindLastIndex =
/*#__PURE__*/
_curry2(function _xfindLastIndex(f, xf) {
  return new _xfindLastIndex_XFindLastIndex(f, xf);
});

/* harmony default export */ var internal_xfindLastIndex = (_xfindLastIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/findLastIndex.js



/**
 * Returns the index of the last element of the list which matches the
 * predicate, or `-1` if no element matches.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category List
 * @sig (a -> Boolean) -> [a] -> Number
 * @param {Function} fn The predicate function used to determine if the element is the
 * desired one.
 * @param {Array} list The array to consider.
 * @return {Number} The index of the element found, or `-1`.
 * @see R.transduce
 * @example
 *
 *      const xs = [{a: 1, b: 0}, {a:1, b: 1}];
 *      R.findLastIndex(R.propEq('a', 1))(xs); //=> 1
 *      R.findLastIndex(R.propEq('a', 4))(xs); //=> -1
 */

var findLastIndex =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xfindLastIndex, function findLastIndex(fn, list) {
  var idx = list.length - 1;

  while (idx >= 0) {
    if (fn(list[idx])) {
      return idx;
    }

    idx -= 1;
  }

  return -1;
}));

/* harmony default export */ var es_findLastIndex = (findLastIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/flatten.js


/**
 * Returns a new list by pulling every item out of it (and all its sub-arrays)
 * and putting them in a new array, depth-first.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [b]
 * @param {Array} list The array to consider.
 * @return {Array} The flattened list.
 * @see R.unnest
 * @example
 *
 *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
 *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
 */

var flatten =
/*#__PURE__*/
_curry1(
/*#__PURE__*/
_makeFlat(true));

/* harmony default export */ var es_flatten = (flatten);
// CONCATENATED MODULE: ./node_modules/ramda/es/flip.js


/**
 * Returns a new function much like the supplied one, except that the first two
 * arguments' order is reversed.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig ((a, b, c, ...) -> z) -> (b -> a -> c -> ... -> z)
 * @param {Function} fn The function to invoke with its first two parameters reversed.
 * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
 * @example
 *
 *      const mergeThree = (a, b, c) => [].concat(a, b, c);
 *
 *      mergeThree(1, 2, 3); //=> [1, 2, 3]
 *
 *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
 * @symb R.flip(f)(a, b, c) = f(b, a, c)
 */

var flip_flip =
/*#__PURE__*/
_curry1(function flip(fn) {
  return es_curryN(fn.length, function (a, b) {
    var args = Array.prototype.slice.call(arguments, 0);
    args[0] = b;
    args[1] = a;
    return fn.apply(this, args);
  });
});

/* harmony default export */ var es_flip = (flip_flip);
// CONCATENATED MODULE: ./node_modules/ramda/es/forEach.js


/**
 * Iterate over an input `list`, calling a provided function `fn` for each
 * element in the list.
 *
 * `fn` receives one argument: *(value)*.
 *
 * Note: `R.forEach` does not skip deleted or unassigned indices (sparse
 * arrays), unlike the native `Array.prototype.forEach` method. For more
 * details on this behavior, see:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Description
 *
 * Also note that, unlike `Array.prototype.forEach`, Ramda's `forEach` returns
 * the original array. In some libraries this function is named `each`.
 *
 * Dispatches to the `forEach` method of the second argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category List
 * @sig (a -> *) -> [a] -> [a]
 * @param {Function} fn The function to invoke. Receives one argument, `value`.
 * @param {Array} list The list to iterate over.
 * @return {Array} The original list.
 * @see R.addIndex
 * @example
 *
 *      const printXPlusFive = x => console.log(x + 5);
 *      R.forEach(printXPlusFive, [1, 2, 3]); //=> [1, 2, 3]
 *      // logs 6
 *      // logs 7
 *      // logs 8
 * @symb R.forEach(f, [a, b, c]) = [a, b, c]
 */

var forEach =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_checkForMethod('forEach', function forEach(fn, list) {
  var len = list.length;
  var idx = 0;

  while (idx < len) {
    fn(list[idx]);
    idx += 1;
  }

  return list;
}));

/* harmony default export */ var es_forEach = (forEach);
// CONCATENATED MODULE: ./node_modules/ramda/es/forEachObjIndexed.js


/**
 * Iterate over an input `object`, calling a provided function `fn` for each
 * key and value in the object.
 *
 * `fn` receives three argument: *(value, key, obj)*.
 *
 * @func
 * @memberOf R
 * @since v0.23.0
 * @category Object
 * @sig ((a, String, StrMap a) -> Any) -> StrMap a -> StrMap a
 * @param {Function} fn The function to invoke. Receives three argument, `value`, `key`, `obj`.
 * @param {Object} obj The object to iterate over.
 * @return {Object} The original object.
 * @example
 *
 *      const printKeyConcatValue = (value, key) => console.log(key + ':' + value);
 *      R.forEachObjIndexed(printKeyConcatValue, {x: 1, y: 2}); //=> {x: 1, y: 2}
 *      // logs x:1
 *      // logs y:2
 * @symb R.forEachObjIndexed(f, {x: a, y: b}) = {x: a, y: b}
 */

var forEachObjIndexed_forEachObjIndexed =
/*#__PURE__*/
_curry2(function forEachObjIndexed(fn, obj) {
  var keyList = es_keys(obj);
  var idx = 0;

  while (idx < keyList.length) {
    var key = keyList[idx];
    fn(obj[key], key, obj);
    idx += 1;
  }

  return obj;
});

/* harmony default export */ var es_forEachObjIndexed = (forEachObjIndexed_forEachObjIndexed);
// CONCATENATED MODULE: ./node_modules/ramda/es/fromPairs.js

/**
 * Creates a new object from a list key-value pairs. If a key appears in
 * multiple pairs, the rightmost pair is included in the object.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category List
 * @sig [[k,v]] -> {k: v}
 * @param {Array} pairs An array of two-element arrays that will be the keys and values of the output object.
 * @return {Object} The object made by pairing up `keys` and `values`.
 * @see R.toPairs, R.pair
 * @example
 *
 *      R.fromPairs([['a', 1], ['b', 2], ['c', 3]]); //=> {a: 1, b: 2, c: 3}
 */

var fromPairs =
/*#__PURE__*/
_curry1(function fromPairs(pairs) {
  var result = {};
  var idx = 0;

  while (idx < pairs.length) {
    result[pairs[idx][0]] = pairs[idx][1];
    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_fromPairs = (fromPairs);
// CONCATENATED MODULE: ./node_modules/ramda/es/groupBy.js



/**
 * Splits a list into sub-lists stored in an object, based on the result of
 * calling a String-returning function on each element, and grouping the
 * results according to values returned.
 *
 * Dispatches to the `groupBy` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig (a -> String) -> [a] -> {String: [a]}
 * @param {Function} fn Function :: a -> String
 * @param {Array} list The array to group
 * @return {Object} An object with the output of `fn` for keys, mapped to arrays of elements
 *         that produced that key when passed to `fn`.
 * @see R.reduceBy, R.transduce
 * @example
 *
 *      const byGrade = R.groupBy(function(student) {
 *        const score = student.score;
 *        return score < 65 ? 'F' :
 *               score < 70 ? 'D' :
 *               score < 80 ? 'C' :
 *               score < 90 ? 'B' : 'A';
 *      });
 *      const students = [{name: 'Abby', score: 84},
 *                      {name: 'Eddy', score: 58},
 *                      // ...
 *                      {name: 'Jack', score: 69}];
 *      byGrade(students);
 *      // {
 *      //   'A': [{name: 'Dianne', score: 99}],
 *      //   'B': [{name: 'Abby', score: 84}]
 *      //   // ...,
 *      //   'F': [{name: 'Eddy', score: 58}]
 *      // }
 */

var groupBy =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_checkForMethod('groupBy',
/*#__PURE__*/
es_reduceBy(function (acc, item) {
  if (acc == null) {
    acc = [];
  }

  acc.push(item);
  return acc;
}, null)));

/* harmony default export */ var es_groupBy = (groupBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/groupWith.js

/**
 * Takes a list and returns a list of lists where each sublist's elements are
 * all satisfied pairwise comparison according to the provided function.
 * Only adjacent elements are passed to the comparison function.
 *
 * @func
 * @memberOf R
 * @since v0.21.0
 * @category List
 * @sig ((a, a) → Boolean) → [a] → [[a]]
 * @param {Function} fn Function for determining whether two given (adjacent)
 *        elements should be in the same group
 * @param {Array} list The array to group. Also accepts a string, which will be
 *        treated as a list of characters.
 * @return {List} A list that contains sublists of elements,
 *         whose concatenations are equal to the original list.
 * @example
 *
 * R.groupWith(R.equals, [0, 1, 1, 2, 3, 5, 8, 13, 21])
 * //=> [[0], [1, 1], [2], [3], [5], [8], [13], [21]]
 *
 * R.groupWith((a, b) => a + 1 === b, [0, 1, 1, 2, 3, 5, 8, 13, 21])
 * //=> [[0, 1], [1, 2, 3], [5], [8], [13], [21]]
 *
 * R.groupWith((a, b) => a % 2 === b % 2, [0, 1, 1, 2, 3, 5, 8, 13, 21])
 * //=> [[0], [1, 1], [2], [3, 5], [8], [13, 21]]
 *
 * R.groupWith(R.eqBy(isVowel), 'aestiou')
 * //=> ['ae', 'st', 'iou']
 */

var groupWith =
/*#__PURE__*/
_curry2(function (fn, list) {
  var res = [];
  var idx = 0;
  var len = list.length;

  while (idx < len) {
    var nextidx = idx + 1;

    while (nextidx < len && fn(list[nextidx - 1], list[nextidx])) {
      nextidx += 1;
    }

    res.push(list.slice(idx, nextidx));
    idx = nextidx;
  }

  return res;
});

/* harmony default export */ var es_groupWith = (groupWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/gt.js

/**
 * Returns `true` if the first argument is greater than the second; `false`
 * otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> Boolean
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 * @see R.lt
 * @example
 *
 *      R.gt(2, 1); //=> true
 *      R.gt(2, 2); //=> false
 *      R.gt(2, 3); //=> false
 *      R.gt('a', 'z'); //=> false
 *      R.gt('z', 'a'); //=> true
 */

var gt =
/*#__PURE__*/
_curry2(function gt(a, b) {
  return a > b;
});

/* harmony default export */ var es_gt = (gt);
// CONCATENATED MODULE: ./node_modules/ramda/es/gte.js

/**
 * Returns `true` if the first argument is greater than or equal to the second;
 * `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> Boolean
 * @param {Number} a
 * @param {Number} b
 * @return {Boolean}
 * @see R.lte
 * @example
 *
 *      R.gte(2, 1); //=> true
 *      R.gte(2, 2); //=> true
 *      R.gte(2, 3); //=> false
 *      R.gte('a', 'z'); //=> false
 *      R.gte('z', 'a'); //=> true
 */

var gte =
/*#__PURE__*/
_curry2(function gte(a, b) {
  return a >= b;
});

/* harmony default export */ var es_gte = (gte);
// CONCATENATED MODULE: ./node_modules/ramda/es/hasPath.js



/**
 * Returns whether or not a path exists in an object. Only the object's
 * own properties are checked.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig [Idx] -> {a} -> Boolean
 * @param {Array} path The path to use.
 * @param {Object} obj The object to check the path in.
 * @return {Boolean} Whether the path exists.
 * @see R.has
 * @example
 *
 *      R.hasPath(['a', 'b'], {a: {b: 2}});         // => true
 *      R.hasPath(['a', 'b'], {a: {b: undefined}}); // => true
 *      R.hasPath(['a', 'b'], {a: {c: 2}});         // => false
 *      R.hasPath(['a', 'b'], {});                  // => false
 */

var hasPath_hasPath =
/*#__PURE__*/
_curry2(function hasPath(_path, obj) {
  if (_path.length === 0 || es_isNil(obj)) {
    return false;
  }

  var val = obj;
  var idx = 0;

  while (idx < _path.length) {
    if (!es_isNil(val) && _has(_path[idx], val)) {
      val = val[_path[idx]];
      idx += 1;
    } else {
      return false;
    }
  }

  return true;
});

/* harmony default export */ var es_hasPath = (hasPath_hasPath);
// CONCATENATED MODULE: ./node_modules/ramda/es/has.js


/**
 * Returns whether or not an object has an own property with the specified name
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Object
 * @sig s -> {s: x} -> Boolean
 * @param {String} prop The name of the property to check for.
 * @param {Object} obj The object to query.
 * @return {Boolean} Whether the property exists.
 * @example
 *
 *      const hasName = R.has('name');
 *      hasName({name: 'alice'});   //=> true
 *      hasName({name: 'bob'});     //=> true
 *      hasName({});                //=> false
 *
 *      const point = {x: 0, y: 0};
 *      const pointHas = R.has(R.__, point);
 *      pointHas('x');  //=> true
 *      pointHas('y');  //=> true
 *      pointHas('z');  //=> false
 */

var has_has =
/*#__PURE__*/
_curry2(function has(prop, obj) {
  return es_hasPath([prop], obj);
});

/* harmony default export */ var es_has = (has_has);
// CONCATENATED MODULE: ./node_modules/ramda/es/hasIn.js

/**
 * Returns whether or not an object or its prototype chain has a property with
 * the specified name
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Object
 * @sig s -> {s: x} -> Boolean
 * @param {String} prop The name of the property to check for.
 * @param {Object} obj The object to query.
 * @return {Boolean} Whether the property exists.
 * @example
 *
 *      function Rectangle(width, height) {
 *        this.width = width;
 *        this.height = height;
 *      }
 *      Rectangle.prototype.area = function() {
 *        return this.width * this.height;
 *      };
 *
 *      const square = new Rectangle(2, 2);
 *      R.hasIn('width', square);  //=> true
 *      R.hasIn('area', square);  //=> true
 */

var hasIn =
/*#__PURE__*/
_curry2(function hasIn(prop, obj) {
  return prop in obj;
});

/* harmony default export */ var es_hasIn = (hasIn);
// CONCATENATED MODULE: ./node_modules/ramda/es/identical.js


/**
 * Returns true if its arguments are identical, false otherwise. Values are
 * identical if they reference the same memory. `NaN` is identical to `NaN`;
 * `0` and `-0` are not identical.
 *
 * Note this is merely a curried version of ES6 `Object.is`.
 *
 * @func
 * @memberOf R
 * @since v0.15.0
 * @category Relation
 * @sig a -> a -> Boolean
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 * @example
 *
 *      const o = {};
 *      R.identical(o, o); //=> true
 *      R.identical(1, 1); //=> true
 *      R.identical(1, '1'); //=> false
 *      R.identical([], []); //=> false
 *      R.identical(0, -0); //=> false
 *      R.identical(NaN, NaN); //=> true
 */

var identical =
/*#__PURE__*/
_curry2(internal_objectIs);

/* harmony default export */ var es_identical = (identical);
// CONCATENATED MODULE: ./node_modules/ramda/es/ifElse.js


/**
 * Creates a function that will process either the `onTrue` or the `onFalse`
 * function depending upon the result of the `condition` predicate.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Logic
 * @sig (*... -> Boolean) -> (*... -> *) -> (*... -> *) -> (*... -> *)
 * @param {Function} condition A predicate function
 * @param {Function} onTrue A function to invoke when the `condition` evaluates to a truthy value.
 * @param {Function} onFalse A function to invoke when the `condition` evaluates to a falsy value.
 * @return {Function} A new function that will process either the `onTrue` or the `onFalse`
 *                    function depending upon the result of the `condition` predicate.
 * @see R.unless, R.when, R.cond
 * @example
 *
 *      const incCount = R.ifElse(
 *        R.has('count'),
 *        R.over(R.lensProp('count'), R.inc),
 *        R.assoc('count', 1)
 *      );
 *      incCount({});           //=> { count: 1 }
 *      incCount({ count: 1 }); //=> { count: 2 }
 */

var ifElse_ifElse =
/*#__PURE__*/
_curry3(function ifElse(condition, onTrue, onFalse) {
  return es_curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
    return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
  });
});

/* harmony default export */ var es_ifElse = (ifElse_ifElse);
// CONCATENATED MODULE: ./node_modules/ramda/es/inc.js

/**
 * Increments its argument.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Math
 * @sig Number -> Number
 * @param {Number} n
 * @return {Number} n + 1
 * @see R.dec
 * @example
 *
 *      R.inc(42); //=> 43
 */

var inc =
/*#__PURE__*/
es_add(1);
/* harmony default export */ var es_inc = (inc);
// CONCATENATED MODULE: ./node_modules/ramda/es/includes.js


/**
 * Returns `true` if the specified value is equal, in [`R.equals`](#equals)
 * terms, to at least one element of the given list; `false` otherwise.
 * Works also with strings.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category List
 * @sig a -> [a] -> Boolean
 * @param {Object} a The item to compare against.
 * @param {Array} list The array to consider.
 * @return {Boolean} `true` if an equivalent item is in the list, `false` otherwise.
 * @see R.any
 * @example
 *
 *      R.includes(3, [1, 2, 3]); //=> true
 *      R.includes(4, [1, 2, 3]); //=> false
 *      R.includes({ name: 'Fred' }, [{ name: 'Fred' }]); //=> true
 *      R.includes([42], [[42]]); //=> true
 *      R.includes('ba', 'banana'); //=>true
 */

var includes =
/*#__PURE__*/
_curry2(_includes);

/* harmony default export */ var es_includes = (includes);
// CONCATENATED MODULE: ./node_modules/ramda/es/indexBy.js

/**
 * Given a function that generates a key, turns a list of objects into an
 * object indexing the objects by the given key. Note that if multiple
 * objects generate the same value for the indexing key only the last value
 * will be included in the generated object.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig (a -> String) -> [{k: v}] -> {k: {k: v}}
 * @param {Function} fn Function :: a -> String
 * @param {Array} array The array of objects to index
 * @return {Object} An object indexing each array element by the given property.
 * @example
 *
 *      const list = [{id: 'xyz', title: 'A'}, {id: 'abc', title: 'B'}];
 *      R.indexBy(R.prop('id'), list);
 *      //=> {abc: {id: 'abc', title: 'B'}, xyz: {id: 'xyz', title: 'A'}}
 */

var indexBy =
/*#__PURE__*/
es_reduceBy(function (acc, elem) {
  return elem;
}, null);
/* harmony default export */ var es_indexBy = (indexBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/indexOf.js



/**
 * Returns the position of the first occurrence of an item in an array, or -1
 * if the item is not included in the array. [`R.equals`](#equals) is used to
 * determine equality.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig a -> [a] -> Number
 * @param {*} target The item to find.
 * @param {Array} xs The array to search in.
 * @return {Number} the index of the target, or -1 if the target is not found.
 * @see R.lastIndexOf
 * @example
 *
 *      R.indexOf(3, [1,2,3,4]); //=> 2
 *      R.indexOf(10, [1,2,3,4]); //=> -1
 */

var indexOf_indexOf =
/*#__PURE__*/
_curry2(function indexOf(target, xs) {
  return typeof xs.indexOf === 'function' && !_isArray(xs) ? xs.indexOf(target) : _indexOf(xs, target, 0);
});

/* harmony default export */ var es_indexOf = (indexOf_indexOf);
// CONCATENATED MODULE: ./node_modules/ramda/es/init.js

/**
 * Returns all but the last element of the given list or string.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category List
 * @sig [a] -> [a]
 * @sig String -> String
 * @param {*} list
 * @return {*}
 * @see R.last, R.head, R.tail
 * @example
 *
 *      R.init([1, 2, 3]);  //=> [1, 2]
 *      R.init([1, 2]);     //=> [1]
 *      R.init([1]);        //=> []
 *      R.init([]);         //=> []
 *
 *      R.init('abc');  //=> 'ab'
 *      R.init('ab');   //=> 'a'
 *      R.init('a');    //=> ''
 *      R.init('');     //=> ''
 */

var init_init =
/*#__PURE__*/
es_slice(0, -1);
/* harmony default export */ var es_init = (init_init);
// CONCATENATED MODULE: ./node_modules/ramda/es/innerJoin.js



/**
 * Takes a predicate `pred`, a list `xs`, and a list `ys`, and returns a list
 * `xs'` comprising each of the elements of `xs` which is equal to one or more
 * elements of `ys` according to `pred`.
 *
 * `pred` must be a binary function expecting an element from each list.
 *
 * `xs`, `ys`, and `xs'` are treated as sets, semantically, so ordering should
 * not be significant, but since `xs'` is ordered the implementation guarantees
 * that its values are in the same order as they appear in `xs`. Duplicates are
 * not removed, so `xs'` may contain duplicates if `xs` contains duplicates.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Relation
 * @sig ((a, b) -> Boolean) -> [a] -> [b] -> [a]
 * @param {Function} pred
 * @param {Array} xs
 * @param {Array} ys
 * @return {Array}
 * @see R.intersection
 * @example
 *
 *      R.innerJoin(
 *        (record, id) => record.id === id,
 *        [{id: 824, name: 'Richie Furay'},
 *         {id: 956, name: 'Dewey Martin'},
 *         {id: 313, name: 'Bruce Palmer'},
 *         {id: 456, name: 'Stephen Stills'},
 *         {id: 177, name: 'Neil Young'}],
 *        [177, 456, 999]
 *      );
 *      //=> [{id: 456, name: 'Stephen Stills'}, {id: 177, name: 'Neil Young'}]
 */

var innerJoin_innerJoin =
/*#__PURE__*/
_curry3(function innerJoin(pred, xs, ys) {
  return _filter(function (x) {
    return _includesWith(pred, x, ys);
  }, xs);
});

/* harmony default export */ var es_innerJoin = (innerJoin_innerJoin);
// CONCATENATED MODULE: ./node_modules/ramda/es/insert.js

/**
 * Inserts the supplied element into the list, at the specified `index`. _Note that

 * this is not destructive_: it returns a copy of the list with the changes.
 * <small>No lists have been harmed in the application of this function.</small>
 *
 * @func
 * @memberOf R
 * @since v0.2.2
 * @category List
 * @sig Number -> a -> [a] -> [a]
 * @param {Number} index The position to insert the element
 * @param {*} elt The element to insert into the Array
 * @param {Array} list The list to insert into
 * @return {Array} A new Array with `elt` inserted at `index`.
 * @example
 *
 *      R.insert(2, 'x', [1,2,3,4]); //=> [1,2,'x',3,4]
 */

var insert =
/*#__PURE__*/
_curry3(function insert(idx, elt, list) {
  idx = idx < list.length && idx >= 0 ? idx : list.length;
  var result = Array.prototype.slice.call(list, 0);
  result.splice(idx, 0, elt);
  return result;
});

/* harmony default export */ var es_insert = (insert);
// CONCATENATED MODULE: ./node_modules/ramda/es/insertAll.js

/**
 * Inserts the sub-list into the list, at the specified `index`. _Note that this is not
 * destructive_: it returns a copy of the list with the changes.
 * <small>No lists have been harmed in the application of this function.</small>
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category List
 * @sig Number -> [a] -> [a] -> [a]
 * @param {Number} index The position to insert the sub-list
 * @param {Array} elts The sub-list to insert into the Array
 * @param {Array} list The list to insert the sub-list into
 * @return {Array} A new Array with `elts` inserted starting at `index`.
 * @example
 *
 *      R.insertAll(2, ['x','y','z'], [1,2,3,4]); //=> [1,2,'x','y','z',3,4]
 */

var insertAll =
/*#__PURE__*/
_curry3(function insertAll(idx, elts, list) {
  idx = idx < list.length && idx >= 0 ? idx : list.length;
  return [].concat(Array.prototype.slice.call(list, 0, idx), elts, Array.prototype.slice.call(list, idx));
});

/* harmony default export */ var es_insertAll = (insertAll);
// CONCATENATED MODULE: ./node_modules/ramda/es/uniqBy.js


/**
 * Returns a new list containing only one copy of each element in the original
 * list, based upon the value returned by applying the supplied function to
 * each list element. Prefers the first item if the supplied function produces
 * the same value on two items. [`R.equals`](#equals) is used for comparison.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig (a -> b) -> [a] -> [a]
 * @param {Function} fn A function used to produce a value to use during comparisons.
 * @param {Array} list The array to consider.
 * @return {Array} The list of unique items.
 * @example
 *
 *      R.uniqBy(Math.abs, [-1, -5, 2, 10, 1, 2]); //=> [-1, -5, 2, 10]
 */

var uniqBy_uniqBy =
/*#__PURE__*/
_curry2(function uniqBy(fn, list) {
  var set = new internal_Set();
  var result = [];
  var idx = 0;
  var appliedItem, item;

  while (idx < list.length) {
    item = list[idx];
    appliedItem = fn(item);

    if (set.add(appliedItem)) {
      result.push(item);
    }

    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_uniqBy = (uniqBy_uniqBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/uniq.js


/**
 * Returns a new list containing only one copy of each element in the original
 * list. [`R.equals`](#equals) is used to determine equality.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [a]
 * @param {Array} list The array to consider.
 * @return {Array} The list of unique items.
 * @example
 *
 *      R.uniq([1, 1, 2, 1]); //=> [1, 2]
 *      R.uniq([1, '1']);     //=> [1, '1']
 *      R.uniq([[42], [42]]); //=> [[42]]
 */

var uniq =
/*#__PURE__*/
es_uniqBy(es_identity);
/* harmony default export */ var es_uniq = (uniq);
// CONCATENATED MODULE: ./node_modules/ramda/es/intersection.js





/**
 * Combines two lists into a set (i.e. no duplicates) composed of those
 * elements common to both lists.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig [*] -> [*] -> [*]
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The list of elements found in both `list1` and `list2`.
 * @see R.innerJoin
 * @example
 *
 *      R.intersection([1,2,3,4], [7,6,5,4,3]); //=> [4, 3]
 */

var intersection_intersection =
/*#__PURE__*/
_curry2(function intersection(list1, list2) {
  var lookupList, filteredList;

  if (list1.length > list2.length) {
    lookupList = list1;
    filteredList = list2;
  } else {
    lookupList = list2;
    filteredList = list1;
  }

  return es_uniq(_filter(es_flip(_includes)(lookupList), filteredList));
});

/* harmony default export */ var es_intersection = (intersection_intersection);
// CONCATENATED MODULE: ./node_modules/ramda/es/intersperse.js


/**
 * Creates a new list with the separator interposed between elements.
 *
 * Dispatches to the `intersperse` method of the second argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category List
 * @sig a -> [a] -> [a]
 * @param {*} separator The element to add to the list.
 * @param {Array} list The list to be interposed.
 * @return {Array} The new list.
 * @example
 *
 *      R.intersperse('a', ['b', 'n', 'n', 's']); //=> ['b', 'a', 'n', 'a', 'n', 'a', 's']
 */

var intersperse =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_checkForMethod('intersperse', function intersperse(separator, list) {
  var out = [];
  var idx = 0;
  var length = list.length;

  while (idx < length) {
    if (idx === length - 1) {
      out.push(list[idx]);
    } else {
      out.push(list[idx], separator);
    }

    idx += 1;
  }

  return out;
}));

/* harmony default export */ var es_intersperse = (intersperse);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_objectAssign.js
 // Based on https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

function _objectAssign(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var output = Object(target);
  var idx = 1;
  var length = arguments.length;

  while (idx < length) {
    var source = arguments[idx];

    if (source != null) {
      for (var nextKey in source) {
        if (_has(nextKey, source)) {
          output[nextKey] = source[nextKey];
        }
      }
    }

    idx += 1;
  }

  return output;
}

/* harmony default export */ var internal_objectAssign = (typeof Object.assign === 'function' ? Object.assign : _objectAssign);
// CONCATENATED MODULE: ./node_modules/ramda/es/objOf.js

/**
 * Creates an object containing a single key:value pair.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category Object
 * @sig String -> a -> {String:a}
 * @param {String} key
 * @param {*} val
 * @return {Object}
 * @see R.pair
 * @example
 *
 *      const matchPhrases = R.compose(
 *        R.objOf('must'),
 *        R.map(R.objOf('match_phrase'))
 *      );
 *      matchPhrases(['foo', 'bar', 'baz']); //=> {must: [{match_phrase: 'foo'}, {match_phrase: 'bar'}, {match_phrase: 'baz'}]}
 */

var objOf =
/*#__PURE__*/
_curry2(function objOf(key, val) {
  var obj = {};
  obj[key] = val;
  return obj;
});

/* harmony default export */ var es_objOf = (objOf);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_stepCat.js





var _stepCatArray = {
  '@@transducer/init': Array,
  '@@transducer/step': function (xs, x) {
    xs.push(x);
    return xs;
  },
  '@@transducer/result': _identity
};
var _stepCatString = {
  '@@transducer/init': String,
  '@@transducer/step': function (a, b) {
    return a + b;
  },
  '@@transducer/result': _identity
};
var _stepCatObject = {
  '@@transducer/init': Object,
  '@@transducer/step': function (result, input) {
    return internal_objectAssign(result, internal_isArrayLike(input) ? es_objOf(input[0], input[1]) : input);
  },
  '@@transducer/result': _identity
};
function _stepCat(obj) {
  if (_isTransformer(obj)) {
    return obj;
  }

  if (internal_isArrayLike(obj)) {
    return _stepCatArray;
  }

  if (typeof obj === 'string') {
    return _stepCatString;
  }

  if (typeof obj === 'object') {
    return _stepCatObject;
  }

  throw new Error('Cannot create transformer for ' + obj);
}
// CONCATENATED MODULE: ./node_modules/ramda/es/into.js





/**
 * Transforms the items of the list with the transducer and appends the
 * transformed items to the accumulator using an appropriate iterator function
 * based on the accumulator type.
 *
 * The accumulator can be an array, string, object or a transformer. Iterated
 * items will be appended to arrays and concatenated to strings. Objects will
 * be merged directly or 2-item arrays will be merged as key, value pairs.
 *
 * The accumulator can also be a transformer object that provides a 2-arity
 * reducing iterator function, step, 0-arity initial value function, init, and
 * 1-arity result extraction function result. The step function is used as the
 * iterator function in reduce. The result function is used to convert the
 * final accumulator into the return type and in most cases is R.identity. The
 * init function is used to provide the initial accumulator.
 *
 * The iteration is performed with [`R.reduce`](#reduce) after initializing the
 * transducer.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category List
 * @sig a -> (b -> b) -> [c] -> a
 * @param {*} acc The initial accumulator value.
 * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.transduce
 * @example
 *
 *      const numbers = [1, 2, 3, 4];
 *      const transducer = R.compose(R.map(R.add(1)), R.take(2));
 *
 *      R.into([], transducer, numbers); //=> [2, 3]
 *
 *      const intoArray = R.into([]);
 *      intoArray(transducer, numbers); //=> [2, 3]
 */

var into_into =
/*#__PURE__*/
_curry3(function into(acc, xf, list) {
  return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), _clone(acc, [], [], false), list);
});

/* harmony default export */ var es_into = (into_into);
// CONCATENATED MODULE: ./node_modules/ramda/es/invert.js



/**
 * Same as [`R.invertObj`](#invertObj), however this accounts for objects with
 * duplicate values by putting the values into an array.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Object
 * @sig {s: x} -> {x: [ s, ... ]}
 * @param {Object} obj The object or array to invert
 * @return {Object} out A new object with keys in an array.
 * @see R.invertObj
 * @example
 *
 *      const raceResultsByFirstName = {
 *        first: 'alice',
 *        second: 'jake',
 *        third: 'alice',
 *      };
 *      R.invert(raceResultsByFirstName);
 *      //=> { 'alice': ['first', 'third'], 'jake':['second'] }
 */

var invert_invert =
/*#__PURE__*/
_curry1(function invert(obj) {
  var props = es_keys(obj);
  var len = props.length;
  var idx = 0;
  var out = {};

  while (idx < len) {
    var key = props[idx];
    var val = obj[key];
    var list = _has(val, out) ? out[val] : out[val] = [];
    list[list.length] = key;
    idx += 1;
  }

  return out;
});

/* harmony default export */ var es_invert = (invert_invert);
// CONCATENATED MODULE: ./node_modules/ramda/es/invertObj.js


/**
 * Returns a new object with the keys of the given object as values, and the
 * values of the given object, which are coerced to strings, as keys. Note
 * that the last key found is preferred when handling the same value.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Object
 * @sig {s: x} -> {x: s}
 * @param {Object} obj The object or array to invert
 * @return {Object} out A new object
 * @see R.invert
 * @example
 *
 *      const raceResults = {
 *        first: 'alice',
 *        second: 'jake'
 *      };
 *      R.invertObj(raceResults);
 *      //=> { 'alice': 'first', 'jake':'second' }
 *
 *      // Alternatively:
 *      const raceResults = ['alice', 'jake'];
 *      R.invertObj(raceResults);
 *      //=> { 'alice': '0', 'jake':'1' }
 */

var invertObj_invertObj =
/*#__PURE__*/
_curry1(function invertObj(obj) {
  var props = es_keys(obj);
  var len = props.length;
  var idx = 0;
  var out = {};

  while (idx < len) {
    var key = props[idx];
    out[obj[key]] = key;
    idx += 1;
  }

  return out;
});

/* harmony default export */ var es_invertObj = (invertObj_invertObj);
// CONCATENATED MODULE: ./node_modules/ramda/es/invoker.js




/**
 * Turns a named method with a specified arity into a function that can be
 * called directly supplied with arguments and a target object.
 *
 * The returned function is curried and accepts `arity + 1` parameters where
 * the final parameter is the target object.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
 * @param {Number} arity Number of arguments the returned function should take
 *        before the target object.
 * @param {String} method Name of any of the target object's methods to call.
 * @return {Function} A new curried function.
 * @see R.construct
 * @example
 *
 *      const sliceFrom = R.invoker(1, 'slice');
 *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
 *      const sliceFrom6 = R.invoker(2, 'slice')(6);
 *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
 *
 *      const dog = {
 *        speak: async () => 'Woof!'
 *      };
 *      const speak = R.invoker(0, 'speak');
 *      speak(dog).then(console.log) //~> 'Woof!'
 *
 * @symb R.invoker(0, 'method')(o) = o['method']()
 * @symb R.invoker(1, 'method')(a, o) = o['method'](a)
 * @symb R.invoker(2, 'method')(a, b, o) = o['method'](a, b)
 */

var invoker_invoker =
/*#__PURE__*/
_curry2(function invoker(arity, method) {
  return es_curryN(arity + 1, function () {
    var target = arguments[arity];

    if (target != null && _isFunction(target[method])) {
      return target[method].apply(target, Array.prototype.slice.call(arguments, 0, arity));
    }

    throw new TypeError(es_toString(target) + ' does not have a method named "' + method + '"');
  });
});

/* harmony default export */ var es_invoker = (invoker_invoker);
// CONCATENATED MODULE: ./node_modules/ramda/es/is.js

/**
 * See if an object (`val`) is an instance of the supplied constructor. This
 * function will check up the inheritance chain, if any.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category Type
 * @sig (* -> {*}) -> a -> Boolean
 * @param {Object} ctor A constructor
 * @param {*} val The value to test
 * @return {Boolean}
 * @example
 *
 *      R.is(Object, {}); //=> true
 *      R.is(Number, 1); //=> true
 *      R.is(Object, 1); //=> false
 *      R.is(String, 's'); //=> true
 *      R.is(String, new String('')); //=> true
 *      R.is(Object, new String('')); //=> true
 *      R.is(Object, 's'); //=> false
 *      R.is(Number, {}); //=> false
 */

var is =
/*#__PURE__*/
_curry2(function is(Ctor, val) {
  return val != null && val.constructor === Ctor || val instanceof Ctor;
});

/* harmony default export */ var es_is = (is);
// CONCATENATED MODULE: ./node_modules/ramda/es/isEmpty.js



/**
 * Returns `true` if the given value is its type's empty value; `false`
 * otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Logic
 * @sig a -> Boolean
 * @param {*} x
 * @return {Boolean}
 * @see R.empty
 * @example
 *
 *      R.isEmpty([1, 2, 3]);   //=> false
 *      R.isEmpty([]);          //=> true
 *      R.isEmpty('');          //=> true
 *      R.isEmpty(null);        //=> false
 *      R.isEmpty({});          //=> true
 *      R.isEmpty({length: 0}); //=> false
 */

var isEmpty_isEmpty =
/*#__PURE__*/
_curry1(function isEmpty(x) {
  return x != null && es_equals(x, es_empty(x));
});

/* harmony default export */ var es_isEmpty = (isEmpty_isEmpty);
// CONCATENATED MODULE: ./node_modules/ramda/es/join.js

/**
 * Returns a string made by inserting the `separator` between each element and
 * concatenating all the elements into a single string.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig String -> [a] -> String
 * @param {Number|String} separator The string used to separate the elements.
 * @param {Array} xs The elements to join into a string.
 * @return {String} str The string made by concatenating `xs` with `separator`.
 * @see R.split
 * @example
 *
 *      const spacer = R.join(' ');
 *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
 *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
 */

var join =
/*#__PURE__*/
es_invoker(1, 'join');
/* harmony default export */ var es_join = (join);
// CONCATENATED MODULE: ./node_modules/ramda/es/juxt.js


/**
 * juxt applies a list of functions to a list of values.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Function
 * @sig [(a, b, ..., m) -> n] -> ((a, b, ..., m) -> [n])
 * @param {Array} fns An array of functions
 * @return {Function} A function that returns a list of values after applying each of the original `fns` to its parameters.
 * @see R.applySpec
 * @example
 *
 *      const getRange = R.juxt([Math.min, Math.max]);
 *      getRange(3, 4, 9, -3); //=> [-3, 9]
 * @symb R.juxt([f, g, h])(a, b) = [f(a, b), g(a, b), h(a, b)]
 */

var juxt_juxt =
/*#__PURE__*/
_curry1(function juxt(fns) {
  return es_converge(function () {
    return Array.prototype.slice.call(arguments, 0);
  }, fns);
});

/* harmony default export */ var es_juxt = (juxt_juxt);
// CONCATENATED MODULE: ./node_modules/ramda/es/keysIn.js

/**
 * Returns a list containing the names of all the properties of the supplied
 * object, including prototype properties.
 * Note that the order of the output array is not guaranteed to be consistent
 * across different JS platforms.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category Object
 * @sig {k: v} -> [k]
 * @param {Object} obj The object to extract properties from
 * @return {Array} An array of the object's own and prototype properties.
 * @see R.keys, R.valuesIn
 * @example
 *
 *      const F = function() { this.x = 'X'; };
 *      F.prototype.y = 'Y';
 *      const f = new F();
 *      R.keysIn(f); //=> ['x', 'y']
 */

var keysIn =
/*#__PURE__*/
_curry1(function keysIn(obj) {
  var prop;
  var ks = [];

  for (prop in obj) {
    ks[ks.length] = prop;
  }

  return ks;
});

/* harmony default export */ var es_keysIn = (keysIn);
// CONCATENATED MODULE: ./node_modules/ramda/es/lastIndexOf.js



/**
 * Returns the position of the last occurrence of an item in an array, or -1 if
 * the item is not included in the array. [`R.equals`](#equals) is used to
 * determine equality.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig a -> [a] -> Number
 * @param {*} target The item to find.
 * @param {Array} xs The array to search in.
 * @return {Number} the index of the target, or -1 if the target is not found.
 * @see R.indexOf
 * @example
 *
 *      R.lastIndexOf(3, [-1,3,3,0,1,2,3,4]); //=> 6
 *      R.lastIndexOf(10, [1,2,3,4]); //=> -1
 */

var lastIndexOf_lastIndexOf =
/*#__PURE__*/
_curry2(function lastIndexOf(target, xs) {
  if (typeof xs.lastIndexOf === 'function' && !_isArray(xs)) {
    return xs.lastIndexOf(target);
  } else {
    var idx = xs.length - 1;

    while (idx >= 0) {
      if (es_equals(xs[idx], target)) {
        return idx;
      }

      idx -= 1;
    }

    return -1;
  }
});

/* harmony default export */ var es_lastIndexOf = (lastIndexOf_lastIndexOf);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isNumber.js
function _isNumber(x) {
  return Object.prototype.toString.call(x) === '[object Number]';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/length.js


/**
 * Returns the number of elements in the array by returning `list.length`.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category List
 * @sig [a] -> Number
 * @param {Array} list The array to inspect.
 * @return {Number} The length of the array.
 * @example
 *
 *      R.length([]); //=> 0
 *      R.length([1, 2, 3]); //=> 3
 */

var length_length =
/*#__PURE__*/
_curry1(function length(list) {
  return list != null && _isNumber(list.length) ? list.length : NaN;
});

/* harmony default export */ var es_length = (length_length);
// CONCATENATED MODULE: ./node_modules/ramda/es/lens.js


/**
 * Returns a lens for the given getter and setter functions. The getter "gets"
 * the value of the focus; the setter "sets" the value of the focus. The setter
 * should not mutate the data structure.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig (s -> a) -> ((a, s) -> s) -> Lens s a
 * @param {Function} getter
 * @param {Function} setter
 * @return {Lens}
 * @see R.view, R.set, R.over, R.lensIndex, R.lensProp
 * @example
 *
 *      const xLens = R.lens(R.prop('x'), R.assoc('x'));
 *
 *      R.view(xLens, {x: 1, y: 2});            //=> 1
 *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
 *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
 */

var lens_lens =
/*#__PURE__*/
_curry2(function lens(getter, setter) {
  return function (toFunctorFn) {
    return function (target) {
      return es_map(function (focus) {
        return setter(focus, target);
      }, toFunctorFn(getter(target)));
    };
  };
});

/* harmony default export */ var es_lens = (lens_lens);
// CONCATENATED MODULE: ./node_modules/ramda/es/lensIndex.js




/**
 * Returns a lens whose focus is the specified index.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig Number -> Lens s a
 * @param {Number} n
 * @return {Lens}
 * @see R.view, R.set, R.over, R.nth
 * @example
 *
 *      const headLens = R.lensIndex(0);
 *
 *      R.view(headLens, ['a', 'b', 'c']);            //=> 'a'
 *      R.set(headLens, 'x', ['a', 'b', 'c']);        //=> ['x', 'b', 'c']
 *      R.over(headLens, R.toUpper, ['a', 'b', 'c']); //=> ['A', 'b', 'c']
 */

var lensIndex_lensIndex =
/*#__PURE__*/
_curry1(function lensIndex(n) {
  return es_lens(es_nth(n), es_update(n));
});

/* harmony default export */ var es_lensIndex = (lensIndex_lensIndex);
// CONCATENATED MODULE: ./node_modules/ramda/es/lensPath.js




/**
 * Returns a lens whose focus is the specified path.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Object
 * @typedefn Idx = String | Int
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig [Idx] -> Lens s a
 * @param {Array} path The path to use.
 * @return {Lens}
 * @see R.view, R.set, R.over
 * @example
 *
 *      const xHeadYLens = R.lensPath(['x', 0, 'y']);
 *
 *      R.view(xHeadYLens, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
 *      //=> 2
 *      R.set(xHeadYLens, 1, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
 *      //=> {x: [{y: 1, z: 3}, {y: 4, z: 5}]}
 *      R.over(xHeadYLens, R.negate, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
 *      //=> {x: [{y: -2, z: 3}, {y: 4, z: 5}]}
 */

var lensPath_lensPath =
/*#__PURE__*/
_curry1(function lensPath(p) {
  return es_lens(es_path(p), es_assocPath(p));
});

/* harmony default export */ var es_lensPath = (lensPath_lensPath);
// CONCATENATED MODULE: ./node_modules/ramda/es/lensProp.js




/**
 * Returns a lens whose focus is the specified property.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig String -> Lens s a
 * @param {String} k
 * @return {Lens}
 * @see R.view, R.set, R.over
 * @example
 *
 *      const xLens = R.lensProp('x');
 *
 *      R.view(xLens, {x: 1, y: 2});            //=> 1
 *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
 *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
 */

var lensProp_lensProp =
/*#__PURE__*/
_curry1(function lensProp(k) {
  return es_lens(es_prop(k), es_assoc(k));
});

/* harmony default export */ var es_lensProp = (lensProp_lensProp);
// CONCATENATED MODULE: ./node_modules/ramda/es/lt.js

/**
 * Returns `true` if the first argument is less than the second; `false`
 * otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> Boolean
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 * @see R.gt
 * @example
 *
 *      R.lt(2, 1); //=> false
 *      R.lt(2, 2); //=> false
 *      R.lt(2, 3); //=> true
 *      R.lt('a', 'z'); //=> true
 *      R.lt('z', 'a'); //=> false
 */

var lt =
/*#__PURE__*/
_curry2(function lt(a, b) {
  return a < b;
});

/* harmony default export */ var es_lt = (lt);
// CONCATENATED MODULE: ./node_modules/ramda/es/lte.js

/**
 * Returns `true` if the first argument is less than or equal to the second;
 * `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> Boolean
 * @param {Number} a
 * @param {Number} b
 * @return {Boolean}
 * @see R.gte
 * @example
 *
 *      R.lte(2, 1); //=> false
 *      R.lte(2, 2); //=> true
 *      R.lte(2, 3); //=> true
 *      R.lte('a', 'z'); //=> true
 *      R.lte('z', 'a'); //=> false
 */

var lte =
/*#__PURE__*/
_curry2(function lte(a, b) {
  return a <= b;
});

/* harmony default export */ var es_lte = (lte);
// CONCATENATED MODULE: ./node_modules/ramda/es/mapAccum.js

/**
 * The `mapAccum` function behaves like a combination of map and reduce; it
 * applies a function to each element of a list, passing an accumulating
 * parameter from left to right, and returning a final value of this
 * accumulator together with the new list.
 *
 * The iterator function receives two arguments, *acc* and *value*, and should
 * return a tuple *[acc, value]*.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category List
 * @sig ((acc, x) -> (acc, y)) -> acc -> [x] -> (acc, [y])
 * @param {Function} fn The function to be called on every element of the input `list`.
 * @param {*} acc The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.scan, R.addIndex, R.mapAccumRight
 * @example
 *
 *      const digits = ['1', '2', '3', '4'];
 *      const appender = (a, b) => [a + b, a + b];
 *
 *      R.mapAccum(appender, 0, digits); //=> ['01234', ['01', '012', '0123', '01234']]
 * @symb R.mapAccum(f, a, [b, c, d]) = [
 *   f(f(f(a, b)[0], c)[0], d)[0],
 *   [
 *     f(a, b)[1],
 *     f(f(a, b)[0], c)[1],
 *     f(f(f(a, b)[0], c)[0], d)[1]
 *   ]
 * ]
 */

var mapAccum =
/*#__PURE__*/
_curry3(function mapAccum(fn, acc, list) {
  var idx = 0;
  var len = list.length;
  var result = [];
  var tuple = [acc];

  while (idx < len) {
    tuple = fn(tuple[0], list[idx]);
    result[idx] = tuple[1];
    idx += 1;
  }

  return [tuple[0], result];
});

/* harmony default export */ var es_mapAccum = (mapAccum);
// CONCATENATED MODULE: ./node_modules/ramda/es/mapAccumRight.js

/**
 * The `mapAccumRight` function behaves like a combination of map and reduce; it
 * applies a function to each element of a list, passing an accumulating
 * parameter from right to left, and returning a final value of this
 * accumulator together with the new list.
 *
 * Similar to [`mapAccum`](#mapAccum), except moves through the input list from
 * the right to the left.
 *
 * The iterator function receives two arguments, *acc* and *value*, and should
 * return a tuple *[acc, value]*.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category List
 * @sig ((acc, x) -> (acc, y)) -> acc -> [x] -> (acc, [y])
 * @param {Function} fn The function to be called on every element of the input `list`.
 * @param {*} acc The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.addIndex, R.mapAccum
 * @example
 *
 *      const digits = ['1', '2', '3', '4'];
 *      const appender = (a, b) => [b + a, b + a];
 *
 *      R.mapAccumRight(appender, 5, digits); //=> ['12345', ['12345', '2345', '345', '45']]
 * @symb R.mapAccumRight(f, a, [b, c, d]) = [
 *   f(f(f(a, d)[0], c)[0], b)[0],
 *   [
 *     f(a, d)[1],
 *     f(f(a, d)[0], c)[1],
 *     f(f(f(a, d)[0], c)[0], b)[1]
 *   ]
 * ]
 */

var mapAccumRight =
/*#__PURE__*/
_curry3(function mapAccumRight(fn, acc, list) {
  var idx = list.length - 1;
  var result = [];
  var tuple = [acc];

  while (idx >= 0) {
    tuple = fn(tuple[0], list[idx]);
    result[idx] = tuple[1];
    idx -= 1;
  }

  return [tuple[0], result];
});

/* harmony default export */ var es_mapAccumRight = (mapAccumRight);
// CONCATENATED MODULE: ./node_modules/ramda/es/mapObjIndexed.js



/**
 * An Object-specific version of [`map`](#map). The function is applied to three
 * arguments: *(value, key, obj)*. If only the value is significant, use
 * [`map`](#map) instead.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Object
 * @sig ((*, String, Object) -> *) -> Object -> Object
 * @param {Function} fn
 * @param {Object} obj
 * @return {Object}
 * @see R.map
 * @example
 *
 *      const xyz = { x: 1, y: 2, z: 3 };
 *      const prependKeyAndDouble = (num, key, obj) => key + (num * 2);
 *
 *      R.mapObjIndexed(prependKeyAndDouble, xyz); //=> { x: 'x2', y: 'y4', z: 'z6' }
 */

var mapObjIndexed_mapObjIndexed =
/*#__PURE__*/
_curry2(function mapObjIndexed(fn, obj) {
  return _reduce(function (acc, key) {
    acc[key] = fn(obj[key], key, obj);
    return acc;
  }, {}, es_keys(obj));
});

/* harmony default export */ var es_mapObjIndexed = (mapObjIndexed_mapObjIndexed);
// CONCATENATED MODULE: ./node_modules/ramda/es/match.js

/**
 * Tests a regular expression against a String. Note that this function will
 * return an empty array when there are no matches. This differs from
 * [`String.prototype.match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
 * which returns `null` when there are no matches.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category String
 * @sig RegExp -> String -> [String | Undefined]
 * @param {RegExp} rx A regular expression.
 * @param {String} str The string to match against
 * @return {Array} The list of matches or empty array.
 * @see R.test
 * @example
 *
 *      R.match(/([a-z]a)/g, 'bananas'); //=> ['ba', 'na', 'na']
 *      R.match(/a/, 'b'); //=> []
 *      R.match(/a/, null); //=> TypeError: null does not have a method named "match"
 */

var match =
/*#__PURE__*/
_curry2(function match(rx, str) {
  return str.match(rx) || [];
});

/* harmony default export */ var es_match = (match);
// CONCATENATED MODULE: ./node_modules/ramda/es/mathMod.js


/**
 * `mathMod` behaves like the modulo operator should mathematically, unlike the
 * `%` operator (and by extension, [`R.modulo`](#modulo)). So while
 * `-17 % 5` is `-2`, `mathMod(-17, 5)` is `3`. `mathMod` requires Integer
 * arguments, and returns NaN when the modulus is zero or negative.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} m The dividend.
 * @param {Number} p the modulus.
 * @return {Number} The result of `b mod a`.
 * @see R.modulo
 * @example
 *
 *      R.mathMod(-17, 5);  //=> 3
 *      R.mathMod(17, 5);   //=> 2
 *      R.mathMod(17, -5);  //=> NaN
 *      R.mathMod(17, 0);   //=> NaN
 *      R.mathMod(17.2, 5); //=> NaN
 *      R.mathMod(17, 5.3); //=> NaN
 *
 *      const clock = R.mathMod(R.__, 12);
 *      clock(15); //=> 3
 *      clock(24); //=> 0
 *
 *      const seventeenMod = R.mathMod(17);
 *      seventeenMod(3);  //=> 2
 *      seventeenMod(4);  //=> 1
 *      seventeenMod(10); //=> 7
 */

var mathMod_mathMod =
/*#__PURE__*/
_curry2(function mathMod(m, p) {
  if (!_isInteger(m)) {
    return NaN;
  }

  if (!_isInteger(p) || p < 1) {
    return NaN;
  }

  return (m % p + p) % p;
});

/* harmony default export */ var es_mathMod = (mathMod_mathMod);
// CONCATENATED MODULE: ./node_modules/ramda/es/maxBy.js

/**
 * Takes a function and two values, and returns whichever value produces the
 * larger result when passed to the provided function.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Relation
 * @sig Ord b => (a -> b) -> a -> a -> a
 * @param {Function} f
 * @param {*} a
 * @param {*} b
 * @return {*}
 * @see R.max, R.minBy
 * @example
 *
 *      //  square :: Number -> Number
 *      const square = n => n * n;
 *
 *      R.maxBy(square, -3, 2); //=> -3
 *
 *      R.reduce(R.maxBy(square), 0, [3, -5, 4, 1, -2]); //=> -5
 *      R.reduce(R.maxBy(square), 0, []); //=> 0
 */

var maxBy =
/*#__PURE__*/
_curry3(function maxBy(f, a, b) {
  return f(b) > f(a) ? b : a;
});

/* harmony default export */ var es_maxBy = (maxBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/sum.js


/**
 * Adds together all the elements of a list.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig [Number] -> Number
 * @param {Array} list An array of numbers
 * @return {Number} The sum of all the numbers in the list.
 * @see R.reduce
 * @example
 *
 *      R.sum([2,4,6,8,100,1]); //=> 121
 */

var sum =
/*#__PURE__*/
es_reduce(es_add, 0);
/* harmony default export */ var es_sum = (sum);
// CONCATENATED MODULE: ./node_modules/ramda/es/mean.js


/**
 * Returns the mean of the given list of numbers.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Math
 * @sig [Number] -> Number
 * @param {Array} list
 * @return {Number}
 * @see R.median
 * @example
 *
 *      R.mean([2, 7, 9]); //=> 6
 *      R.mean([]); //=> NaN
 */

var mean_mean =
/*#__PURE__*/
_curry1(function mean(list) {
  return es_sum(list) / list.length;
});

/* harmony default export */ var es_mean = (mean_mean);
// CONCATENATED MODULE: ./node_modules/ramda/es/median.js


/**
 * Returns the median of the given list of numbers.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Math
 * @sig [Number] -> Number
 * @param {Array} list
 * @return {Number}
 * @see R.mean
 * @example
 *
 *      R.median([2, 9, 7]); //=> 7
 *      R.median([7, 2, 10, 9]); //=> 8
 *      R.median([]); //=> NaN
 */

var median_median =
/*#__PURE__*/
_curry1(function median(list) {
  var len = list.length;

  if (len === 0) {
    return NaN;
  }

  var width = 2 - len % 2;
  var idx = (len - width) / 2;
  return es_mean(Array.prototype.slice.call(list, 0).sort(function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  }).slice(idx, idx + width));
});

/* harmony default export */ var es_median = (median_median);
// CONCATENATED MODULE: ./node_modules/ramda/es/memoizeWith.js



/**
 * Creates a new function that, when invoked, caches the result of calling `fn`
 * for a given argument set and returns the result. Subsequent calls to the
 * memoized `fn` with the same argument set will not result in an additional
 * call to `fn`; instead, the cached result for that set of arguments will be
 * returned.
 *
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Function
 * @sig (*... -> String) -> (*... -> a) -> (*... -> a)
 * @param {Function} fn The function to generate the cache key.
 * @param {Function} fn The function to memoize.
 * @return {Function} Memoized version of `fn`.
 * @example
 *
 *      let count = 0;
 *      const factorial = R.memoizeWith(R.identity, n => {
 *        count += 1;
 *        return R.product(R.range(1, n + 1));
 *      });
 *      factorial(5); //=> 120
 *      factorial(5); //=> 120
 *      factorial(5); //=> 120
 *      count; //=> 1
 */

var memoizeWith_memoizeWith =
/*#__PURE__*/
_curry2(function memoizeWith(mFn, fn) {
  var cache = {};
  return _arity(fn.length, function () {
    var key = mFn.apply(this, arguments);

    if (!_has(key, cache)) {
      cache[key] = fn.apply(this, arguments);
    }

    return cache[key];
  });
});

/* harmony default export */ var es_memoizeWith = (memoizeWith_memoizeWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/merge.js


/**
 * Create a new object with the own properties of the first object merged with
 * the own properties of the second object. If a key exists in both objects,
 * the value from the second object will be used.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} l
 * @param {Object} r
 * @return {Object}
 * @see R.mergeRight, R.mergeDeepRight, R.mergeWith, R.mergeWithKey
 * @deprecated since v0.26.0
 * @example
 *
 *      R.merge({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
 *      //=> { 'name': 'fred', 'age': 40 }
 *
 *      const withDefaults = R.merge({x: 0, y: 0});
 *      withDefaults({y: 2}); //=> {x: 0, y: 2}
 * @symb R.merge(a, b) = {...a, ...b}
 */

var merge_merge =
/*#__PURE__*/
_curry2(function merge(l, r) {
  return internal_objectAssign({}, l, r);
});

/* harmony default export */ var es_merge = (merge_merge);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeAll.js


/**
 * Merges a list of objects together into one object.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category List
 * @sig [{k: v}] -> {k: v}
 * @param {Array} list An array of objects
 * @return {Object} A merged object.
 * @see R.reduce
 * @example
 *
 *      R.mergeAll([{foo:1},{bar:2},{baz:3}]); //=> {foo:1,bar:2,baz:3}
 *      R.mergeAll([{foo:1},{foo:2},{bar:2}]); //=> {foo:2,bar:2}
 * @symb R.mergeAll([{ x: 1 }, { y: 2 }, { z: 3 }]) = { x: 1, y: 2, z: 3 }
 */

var mergeAll_mergeAll =
/*#__PURE__*/
_curry1(function mergeAll(list) {
  return internal_objectAssign.apply(null, [{}].concat(list));
});

/* harmony default export */ var es_mergeAll = (mergeAll_mergeAll);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeWithKey.js


/**
 * Creates a new object with the own properties of the two provided objects. If
 * a key exists in both objects, the provided function is applied to the key
 * and the values associated with the key in each object, with the result being
 * used as the value associated with the key in the returned object.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Object
 * @sig ((String, a, a) -> a) -> {a} -> {a} -> {a}
 * @param {Function} fn
 * @param {Object} l
 * @param {Object} r
 * @return {Object}
 * @see R.mergeDeepWithKey, R.merge, R.mergeWith
 * @example
 *
 *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
 *      R.mergeWithKey(concatValues,
 *                     { a: true, thing: 'foo', values: [10, 20] },
 *                     { b: true, thing: 'bar', values: [15, 35] });
 *      //=> { a: true, b: true, thing: 'bar', values: [10, 20, 15, 35] }
 * @symb R.mergeWithKey(f, { x: 1, y: 2 }, { y: 5, z: 3 }) = { x: 1, y: f('y', 2, 5), z: 3 }
 */

var mergeWithKey_mergeWithKey =
/*#__PURE__*/
_curry3(function mergeWithKey(fn, l, r) {
  var result = {};
  var k;

  for (k in l) {
    if (_has(k, l)) {
      result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
    }
  }

  for (k in r) {
    if (_has(k, r) && !_has(k, result)) {
      result[k] = r[k];
    }
  }

  return result;
});

/* harmony default export */ var es_mergeWithKey = (mergeWithKey_mergeWithKey);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeDeepWithKey.js



/**
 * Creates a new object with the own properties of the two provided objects.
 * If a key exists in both objects:
 * - and both associated values are also objects then the values will be
 *   recursively merged.
 * - otherwise the provided function is applied to the key and associated values
 *   using the resulting value as the new value associated with the key.
 * If a key only exists in one object, the value will be associated with the key
 * of the resulting object.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Object
 * @sig ((String, a, a) -> a) -> {a} -> {a} -> {a}
 * @param {Function} fn
 * @param {Object} lObj
 * @param {Object} rObj
 * @return {Object}
 * @see R.mergeWithKey, R.mergeDeepWith
 * @example
 *
 *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
 *      R.mergeDeepWithKey(concatValues,
 *                         { a: true, c: { thing: 'foo', values: [10, 20] }},
 *                         { b: true, c: { thing: 'bar', values: [15, 35] }});
 *      //=> { a: true, b: true, c: { thing: 'bar', values: [10, 20, 15, 35] }}
 */

var mergeDeepWithKey_mergeDeepWithKey =
/*#__PURE__*/
_curry3(function mergeDeepWithKey(fn, lObj, rObj) {
  return es_mergeWithKey(function (k, lVal, rVal) {
    if (_isObject(lVal) && _isObject(rVal)) {
      return mergeDeepWithKey(fn, lVal, rVal);
    } else {
      return fn(k, lVal, rVal);
    }
  }, lObj, rObj);
});

/* harmony default export */ var es_mergeDeepWithKey = (mergeDeepWithKey_mergeDeepWithKey);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeDeepLeft.js


/**
 * Creates a new object with the own properties of the first object merged with
 * the own properties of the second object. If a key exists in both objects:
 * - and both values are objects, the two values will be recursively merged
 * - otherwise the value from the first object will be used.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Object
 * @sig {a} -> {a} -> {a}
 * @param {Object} lObj
 * @param {Object} rObj
 * @return {Object}
 * @see R.merge, R.mergeDeepRight, R.mergeDeepWith, R.mergeDeepWithKey
 * @example
 *
 *      R.mergeDeepLeft({ name: 'fred', age: 10, contact: { email: 'moo@example.com' }},
 *                      { age: 40, contact: { email: 'baa@example.com' }});
 *      //=> { name: 'fred', age: 10, contact: { email: 'moo@example.com' }}
 */

var mergeDeepLeft_mergeDeepLeft =
/*#__PURE__*/
_curry2(function mergeDeepLeft(lObj, rObj) {
  return es_mergeDeepWithKey(function (k, lVal, rVal) {
    return lVal;
  }, lObj, rObj);
});

/* harmony default export */ var es_mergeDeepLeft = (mergeDeepLeft_mergeDeepLeft);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeDeepRight.js


/**
 * Creates a new object with the own properties of the first object merged with
 * the own properties of the second object. If a key exists in both objects:
 * - and both values are objects, the two values will be recursively merged
 * - otherwise the value from the second object will be used.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Object
 * @sig {a} -> {a} -> {a}
 * @param {Object} lObj
 * @param {Object} rObj
 * @return {Object}
 * @see R.merge, R.mergeDeepLeft, R.mergeDeepWith, R.mergeDeepWithKey
 * @example
 *
 *      R.mergeDeepRight({ name: 'fred', age: 10, contact: { email: 'moo@example.com' }},
 *                       { age: 40, contact: { email: 'baa@example.com' }});
 *      //=> { name: 'fred', age: 40, contact: { email: 'baa@example.com' }}
 */

var mergeDeepRight_mergeDeepRight =
/*#__PURE__*/
_curry2(function mergeDeepRight(lObj, rObj) {
  return es_mergeDeepWithKey(function (k, lVal, rVal) {
    return rVal;
  }, lObj, rObj);
});

/* harmony default export */ var es_mergeDeepRight = (mergeDeepRight_mergeDeepRight);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeDeepWith.js


/**
 * Creates a new object with the own properties of the two provided objects.
 * If a key exists in both objects:
 * - and both associated values are also objects then the values will be
 *   recursively merged.
 * - otherwise the provided function is applied to associated values using the
 *   resulting value as the new value associated with the key.
 * If a key only exists in one object, the value will be associated with the key
 * of the resulting object.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Object
 * @sig ((a, a) -> a) -> {a} -> {a} -> {a}
 * @param {Function} fn
 * @param {Object} lObj
 * @param {Object} rObj
 * @return {Object}
 * @see R.mergeWith, R.mergeDeepWithKey
 * @example
 *
 *      R.mergeDeepWith(R.concat,
 *                      { a: true, c: { values: [10, 20] }},
 *                      { b: true, c: { values: [15, 35] }});
 *      //=> { a: true, b: true, c: { values: [10, 20, 15, 35] }}
 */

var mergeDeepWith_mergeDeepWith =
/*#__PURE__*/
_curry3(function mergeDeepWith(fn, lObj, rObj) {
  return es_mergeDeepWithKey(function (k, lVal, rVal) {
    return fn(lVal, rVal);
  }, lObj, rObj);
});

/* harmony default export */ var es_mergeDeepWith = (mergeDeepWith_mergeDeepWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeLeft.js


/**
 * Create a new object with the own properties of the first object merged with
 * the own properties of the second object. If a key exists in both objects,
 * the value from the first object will be used.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Object
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} l
 * @param {Object} r
 * @return {Object}
 * @see R.mergeRight, R.mergeDeepLeft, R.mergeWith, R.mergeWithKey
 * @example
 *
 *      R.mergeLeft({ 'age': 40 }, { 'name': 'fred', 'age': 10 });
 *      //=> { 'name': 'fred', 'age': 40 }
 *
 *      const resetToDefault = R.mergeLeft({x: 0});
 *      resetToDefault({x: 5, y: 2}); //=> {x: 0, y: 2}
 * @symb R.mergeLeft(a, b) = {...b, ...a}
 */

var mergeLeft_mergeLeft =
/*#__PURE__*/
_curry2(function mergeLeft(l, r) {
  return internal_objectAssign({}, r, l);
});

/* harmony default export */ var es_mergeLeft = (mergeLeft_mergeLeft);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeRight.js


/**
 * Create a new object with the own properties of the first object merged with
 * the own properties of the second object. If a key exists in both objects,
 * the value from the second object will be used.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Object
 * @sig {k: v} -> {k: v} -> {k: v}
 * @param {Object} l
 * @param {Object} r
 * @return {Object}
 * @see R.mergeLeft, R.mergeDeepRight, R.mergeWith, R.mergeWithKey
 * @example
 *
 *      R.mergeRight({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
 *      //=> { 'name': 'fred', 'age': 40 }
 *
 *      const withDefaults = R.mergeRight({x: 0, y: 0});
 *      withDefaults({y: 2}); //=> {x: 0, y: 2}
 * @symb R.mergeRight(a, b) = {...a, ...b}
 */

var mergeRight_mergeRight =
/*#__PURE__*/
_curry2(function mergeRight(l, r) {
  return internal_objectAssign({}, l, r);
});

/* harmony default export */ var es_mergeRight = (mergeRight_mergeRight);
// CONCATENATED MODULE: ./node_modules/ramda/es/mergeWith.js


/**
 * Creates a new object with the own properties of the two provided objects. If
 * a key exists in both objects, the provided function is applied to the values
 * associated with the key in each object, with the result being used as the
 * value associated with the key in the returned object.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Object
 * @sig ((a, a) -> a) -> {a} -> {a} -> {a}
 * @param {Function} fn
 * @param {Object} l
 * @param {Object} r
 * @return {Object}
 * @see R.mergeDeepWith, R.merge, R.mergeWithKey
 * @example
 *
 *      R.mergeWith(R.concat,
 *                  { a: true, values: [10, 20] },
 *                  { b: true, values: [15, 35] });
 *      //=> { a: true, b: true, values: [10, 20, 15, 35] }
 */

var mergeWith_mergeWith =
/*#__PURE__*/
_curry3(function mergeWith(fn, l, r) {
  return es_mergeWithKey(function (_, _l, _r) {
    return fn(_l, _r);
  }, l, r);
});

/* harmony default export */ var es_mergeWith = (mergeWith_mergeWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/min.js

/**
 * Returns the smaller of its two arguments.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord a => a -> a -> a
 * @param {*} a
 * @param {*} b
 * @return {*}
 * @see R.minBy, R.max
 * @example
 *
 *      R.min(789, 123); //=> 123
 *      R.min('a', 'b'); //=> 'a'
 */

var min =
/*#__PURE__*/
_curry2(function min(a, b) {
  return b < a ? b : a;
});

/* harmony default export */ var es_min = (min);
// CONCATENATED MODULE: ./node_modules/ramda/es/minBy.js

/**
 * Takes a function and two values, and returns whichever value produces the
 * smaller result when passed to the provided function.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Relation
 * @sig Ord b => (a -> b) -> a -> a -> a
 * @param {Function} f
 * @param {*} a
 * @param {*} b
 * @return {*}
 * @see R.min, R.maxBy
 * @example
 *
 *      //  square :: Number -> Number
 *      const square = n => n * n;
 *
 *      R.minBy(square, -3, 2); //=> 2
 *
 *      R.reduce(R.minBy(square), Infinity, [3, -5, 4, 1, -2]); //=> 1
 *      R.reduce(R.minBy(square), Infinity, []); //=> Infinity
 */

var minBy =
/*#__PURE__*/
_curry3(function minBy(f, a, b) {
  return f(b) < f(a) ? b : a;
});

/* harmony default export */ var es_minBy = (minBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/modulo.js

/**
 * Divides the first parameter by the second and returns the remainder. Note
 * that this function preserves the JavaScript-style behavior for modulo. For
 * mathematical modulo see [`mathMod`](#mathMod).
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} a The value to the divide.
 * @param {Number} b The pseudo-modulus
 * @return {Number} The result of `b % a`.
 * @see R.mathMod
 * @example
 *
 *      R.modulo(17, 3); //=> 2
 *      // JS behavior:
 *      R.modulo(-17, 3); //=> -2
 *      R.modulo(17, -3); //=> 2
 *
 *      const isOdd = R.modulo(R.__, 2);
 *      isOdd(42); //=> 0
 *      isOdd(21); //=> 1
 */

var modulo =
/*#__PURE__*/
_curry2(function modulo(a, b) {
  return a % b;
});

/* harmony default export */ var es_modulo = (modulo);
// CONCATENATED MODULE: ./node_modules/ramda/es/move.js

/**
 * Move an item, at index `from`, to index `to`, in a list of elements.
 * A new list will be created containing the new elements order.
 *
 * @func
 * @memberOf R
 * @since v0.27.1
 * @category List
 * @sig Number -> Number -> [a] -> [a]
 * @param {Number} from The source index
 * @param {Number} to The destination index
 * @param {Array} list The list which will serve to realise the move
 * @return {Array} The new list reordered
 * @example
 *
 *      R.move(0, 2, ['a', 'b', 'c', 'd', 'e', 'f']); //=> ['b', 'c', 'a', 'd', 'e', 'f']
 *      R.move(-1, 0, ['a', 'b', 'c', 'd', 'e', 'f']); //=> ['f', 'a', 'b', 'c', 'd', 'e'] list rotation
 */

var move =
/*#__PURE__*/
_curry3(function (from, to, list) {
  var length = list.length;
  var result = list.slice();
  var positiveFrom = from < 0 ? length + from : from;
  var positiveTo = to < 0 ? length + to : to;
  var item = result.splice(positiveFrom, 1);
  return positiveFrom < 0 || positiveFrom >= list.length || positiveTo < 0 || positiveTo >= list.length ? list : [].concat(result.slice(0, positiveTo)).concat(item).concat(result.slice(positiveTo, list.length));
});

/* harmony default export */ var es_move = (move);
// CONCATENATED MODULE: ./node_modules/ramda/es/multiply.js

/**
 * Multiplies two numbers. Equivalent to `a * b` but curried.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} a The first value.
 * @param {Number} b The second value.
 * @return {Number} The result of `a * b`.
 * @see R.divide
 * @example
 *
 *      const double = R.multiply(2);
 *      const triple = R.multiply(3);
 *      double(3);       //=>  6
 *      triple(4);       //=> 12
 *      R.multiply(2, 5);  //=> 10
 */

var multiply =
/*#__PURE__*/
_curry2(function multiply(a, b) {
  return a * b;
});

/* harmony default export */ var es_multiply = (multiply);
// CONCATENATED MODULE: ./node_modules/ramda/es/negate.js

/**
 * Negates its argument.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Math
 * @sig Number -> Number
 * @param {Number} n
 * @return {Number}
 * @example
 *
 *      R.negate(42); //=> -42
 */

var negate =
/*#__PURE__*/
_curry1(function negate(n) {
  return -n;
});

/* harmony default export */ var es_negate = (negate);
// CONCATENATED MODULE: ./node_modules/ramda/es/none.js



/**
 * Returns `true` if no elements of the list match the predicate, `false`
 * otherwise.
 *
 * Dispatches to the `all` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> Boolean
 * @param {Function} fn The predicate function.
 * @param {Array} list The array to consider.
 * @return {Boolean} `true` if the predicate is not satisfied by every element, `false` otherwise.
 * @see R.all, R.any
 * @example
 *
 *      const isEven = n => n % 2 === 0;
 *      const isOdd = n => n % 2 === 1;
 *
 *      R.none(isEven, [1, 3, 5, 7, 9, 11]); //=> true
 *      R.none(isOdd, [1, 3, 5, 7, 8, 11]); //=> false
 */

var none_none =
/*#__PURE__*/
_curry2(function none(fn, input) {
  return es_all(_complement(fn), input);
});

/* harmony default export */ var es_none = (none_none);
// CONCATENATED MODULE: ./node_modules/ramda/es/nthArg.js



/**
 * Returns a function which returns its nth argument.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category Function
 * @sig Number -> *... -> *
 * @param {Number} n
 * @return {Function}
 * @example
 *
 *      R.nthArg(1)('a', 'b', 'c'); //=> 'b'
 *      R.nthArg(-1)('a', 'b', 'c'); //=> 'c'
 * @symb R.nthArg(-1)(a, b, c) = c
 * @symb R.nthArg(0)(a, b, c) = a
 * @symb R.nthArg(1)(a, b, c) = b
 */

var nthArg_nthArg =
/*#__PURE__*/
_curry1(function nthArg(n) {
  var arity = n < 0 ? 1 : n + 1;
  return es_curryN(arity, function () {
    return es_nth(n, arguments);
  });
});

/* harmony default export */ var es_nthArg = (nthArg_nthArg);
// CONCATENATED MODULE: ./node_modules/ramda/es/o.js

/**
 * `o` is a curried composition function that returns a unary function.
 * Like [`compose`](#compose), `o` performs right-to-left function composition.
 * Unlike [`compose`](#compose), the rightmost function passed to `o` will be
 * invoked with only one argument. Also, unlike [`compose`](#compose), `o` is
 * limited to accepting only 2 unary functions. The name o was chosen because
 * of its similarity to the mathematical composition operator ∘.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category Function
 * @sig (b -> c) -> (a -> b) -> a -> c
 * @param {Function} f
 * @param {Function} g
 * @return {Function}
 * @see R.compose, R.pipe
 * @example
 *
 *      const classyGreeting = name => "The name's " + name.last + ", " + name.first + " " + name.last
 *      const yellGreeting = R.o(R.toUpper, classyGreeting);
 *      yellGreeting({first: 'James', last: 'Bond'}); //=> "THE NAME'S BOND, JAMES BOND"
 *
 *      R.o(R.multiply(10), R.add(10))(-4) //=> 60
 *
 * @symb R.o(f, g, x) = f(g(x))
 */

var o =
/*#__PURE__*/
_curry3(function o(f, g, x) {
  return f(g(x));
});

/* harmony default export */ var es_o = (o);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_of.js
function _of(x) {
  return [x];
}
// CONCATENATED MODULE: ./node_modules/ramda/es/of.js


/**
 * Returns a singleton array containing the value provided.
 *
 * Note this `of` is different from the ES6 `of`; See
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category Function
 * @sig a -> [a]
 * @param {*} x any value
 * @return {Array} An array wrapping `x`.
 * @example
 *
 *      R.of(null); //=> [null]
 *      R.of([42]); //=> [[42]]
 */

var of_of =
/*#__PURE__*/
_curry1(_of);

/* harmony default export */ var es_of = (of_of);
// CONCATENATED MODULE: ./node_modules/ramda/es/omit.js

/**
 * Returns a partial copy of an object omitting the keys specified.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig [String] -> {String: *} -> {String: *}
 * @param {Array} names an array of String property names to omit from the new object
 * @param {Object} obj The object to copy from
 * @return {Object} A new object with properties from `names` not on it.
 * @see R.pick
 * @example
 *
 *      R.omit(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, c: 3}
 */

var omit =
/*#__PURE__*/
_curry2(function omit(names, obj) {
  var result = {};
  var index = {};
  var idx = 0;
  var len = names.length;

  while (idx < len) {
    index[names[idx]] = 1;
    idx += 1;
  }

  for (var prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop];
    }
  }

  return result;
});

/* harmony default export */ var es_omit = (omit);
// CONCATENATED MODULE: ./node_modules/ramda/es/once.js


/**
 * Accepts a function `fn` and returns a function that guards invocation of
 * `fn` such that `fn` can only ever be called once, no matter how many times
 * the returned function is invoked. The first value calculated is returned in
 * subsequent invocations.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig (a... -> b) -> (a... -> b)
 * @param {Function} fn The function to wrap in a call-only-once wrapper.
 * @return {Function} The wrapped function.
 * @example
 *
 *      const addOneOnce = R.once(x => x + 1);
 *      addOneOnce(10); //=> 11
 *      addOneOnce(addOneOnce(50)); //=> 11
 */

var once_once =
/*#__PURE__*/
_curry1(function once(fn) {
  var called = false;
  var result;
  return _arity(fn.length, function () {
    if (called) {
      return result;
    }

    called = true;
    result = fn.apply(this, arguments);
    return result;
  });
});

/* harmony default export */ var es_once = (once_once);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_assertPromise.js


function _assertPromise(name, p) {
  if (p == null || !_isFunction(p.then)) {
    throw new TypeError('`' + name + '` expected a Promise, received ' + _toString(p, []));
  }
}
// CONCATENATED MODULE: ./node_modules/ramda/es/otherwise.js


/**
 * Returns the result of applying the onFailure function to the value inside
 * a failed promise. This is useful for handling rejected promises
 * inside function compositions.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Function
 * @sig (e -> b) -> (Promise e a) -> (Promise e b)
 * @sig (e -> (Promise f b)) -> (Promise e a) -> (Promise f b)
 * @param {Function} onFailure The function to apply. Can return a value or a promise of a value.
 * @param {Promise} p
 * @return {Promise} The result of calling `p.then(null, onFailure)`
 * @see R.then
 * @example
 *
 *      var failedFetch = (id) => Promise.reject('bad ID');
 *      var useDefault = () => ({ firstName: 'Bob', lastName: 'Loblaw' })
 *
 *      //recoverFromFailure :: String -> Promise ({firstName, lastName})
 *      var recoverFromFailure = R.pipe(
 *        failedFetch,
 *        R.otherwise(useDefault),
 *        R.then(R.pick(['firstName', 'lastName'])),
 *      );
 *      recoverFromFailure(12345).then(console.log)
 */

var otherwise_otherwise =
/*#__PURE__*/
_curry2(function otherwise(f, p) {
  _assertPromise('otherwise', p);

  return p.then(null, f);
});

/* harmony default export */ var es_otherwise = (otherwise_otherwise);
// CONCATENATED MODULE: ./node_modules/ramda/es/over.js
 // `Identity` is a functor that holds a single value, where `map` simply
// transforms the held value with the provided function.

var Identity = function (x) {
  return {
    value: x,
    map: function (f) {
      return Identity(f(x));
    }
  };
};
/**
 * Returns the result of "setting" the portion of the given data structure
 * focused by the given lens to the result of applying the given function to
 * the focused value.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig Lens s a -> (a -> a) -> s -> s
 * @param {Lens} lens
 * @param {*} v
 * @param {*} x
 * @return {*}
 * @see R.prop, R.lensIndex, R.lensProp
 * @example
 *
 *      const headLens = R.lensIndex(0);
 *
 *      R.over(headLens, R.toUpper, ['foo', 'bar', 'baz']); //=> ['FOO', 'bar', 'baz']
 */


var over =
/*#__PURE__*/
_curry3(function over(lens, f, x) {
  // The value returned by the getter function is first transformed with `f`,
  // then set as the value of an `Identity`. This is then mapped over with the
  // setter function of the lens.
  return lens(function (y) {
    return Identity(f(y));
  })(x).value;
});

/* harmony default export */ var es_over = (over);
// CONCATENATED MODULE: ./node_modules/ramda/es/pair.js

/**
 * Takes two arguments, `fst` and `snd`, and returns `[fst, snd]`.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category List
 * @sig a -> b -> (a,b)
 * @param {*} fst
 * @param {*} snd
 * @return {Array}
 * @see R.objOf, R.of
 * @example
 *
 *      R.pair('foo', 'bar'); //=> ['foo', 'bar']
 */

var pair =
/*#__PURE__*/
_curry2(function pair(fst, snd) {
  return [fst, snd];
});

/* harmony default export */ var es_pair = (pair);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_createPartialApplicator.js


function _createPartialApplicator(concat) {
  return _curry2(function (fn, args) {
    return _arity(Math.max(0, fn.length - args.length), function () {
      return fn.apply(this, concat(args, arguments));
    });
  });
}
// CONCATENATED MODULE: ./node_modules/ramda/es/partial.js


/**
 * Takes a function `f` and a list of arguments, and returns a function `g`.
 * When applied, `g` returns the result of applying `f` to the arguments
 * provided initially followed by the arguments provided to `g`.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Function
 * @sig ((a, b, c, ..., n) -> x) -> [a, b, c, ...] -> ((d, e, f, ..., n) -> x)
 * @param {Function} f
 * @param {Array} args
 * @return {Function}
 * @see R.partialRight, R.curry
 * @example
 *
 *      const multiply2 = (a, b) => a * b;
 *      const double = R.partial(multiply2, [2]);
 *      double(2); //=> 4
 *
 *      const greet = (salutation, title, firstName, lastName) =>
 *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
 *
 *      const sayHello = R.partial(greet, ['Hello']);
 *      const sayHelloToMs = R.partial(sayHello, ['Ms.']);
 *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
 * @symb R.partial(f, [a, b])(c, d) = f(a, b, c, d)
 */

var partial =
/*#__PURE__*/
_createPartialApplicator(_concat);

/* harmony default export */ var es_partial = (partial);
// CONCATENATED MODULE: ./node_modules/ramda/es/partialRight.js



/**
 * Takes a function `f` and a list of arguments, and returns a function `g`.
 * When applied, `g` returns the result of applying `f` to the arguments
 * provided to `g` followed by the arguments provided initially.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category Function
 * @sig ((a, b, c, ..., n) -> x) -> [d, e, f, ..., n] -> ((a, b, c, ...) -> x)
 * @param {Function} f
 * @param {Array} args
 * @return {Function}
 * @see R.partial
 * @example
 *
 *      const greet = (salutation, title, firstName, lastName) =>
 *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
 *
 *      const greetMsJaneJones = R.partialRight(greet, ['Ms.', 'Jane', 'Jones']);
 *
 *      greetMsJaneJones('Hello'); //=> 'Hello, Ms. Jane Jones!'
 * @symb R.partialRight(f, [a, b])(c, d) = f(c, d, a, b)
 */

var partialRight =
/*#__PURE__*/
_createPartialApplicator(
/*#__PURE__*/
es_flip(_concat));

/* harmony default export */ var es_partialRight = (partialRight);
// CONCATENATED MODULE: ./node_modules/ramda/es/partition.js



/**
 * Takes a predicate and a list or other `Filterable` object and returns the
 * pair of filterable objects of the same type of elements which do and do not
 * satisfy, the predicate, respectively. Filterable objects include plain objects or any object
 * that has a filter method such as `Array`.
 *
 * @func
 * @memberOf R
 * @since v0.1.4
 * @category List
 * @sig Filterable f => (a -> Boolean) -> f a -> [f a, f a]
 * @param {Function} pred A predicate to determine which side the element belongs to.
 * @param {Array} filterable the list (or other filterable) to partition.
 * @return {Array} An array, containing first the subset of elements that satisfy the
 *         predicate, and second the subset of elements that do not satisfy.
 * @see R.filter, R.reject
 * @example
 *
 *      R.partition(R.includes('s'), ['sss', 'ttt', 'foo', 'bars']);
 *      // => [ [ 'sss', 'bars' ],  [ 'ttt', 'foo' ] ]
 *
 *      R.partition(R.includes('s'), { a: 'sss', b: 'ttt', foo: 'bars' });
 *      // => [ { a: 'sss', foo: 'bars' }, { b: 'ttt' }  ]
 */

var partition =
/*#__PURE__*/
es_juxt([es_filter, es_reject]);
/* harmony default export */ var es_partition = (partition);
// CONCATENATED MODULE: ./node_modules/ramda/es/pathEq.js



/**
 * Determines whether a nested path on an object has a specific value, in
 * [`R.equals`](#equals) terms. Most likely used to filter a list.
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category Relation
 * @typedefn Idx = String | Int
 * @sig [Idx] -> a -> {a} -> Boolean
 * @param {Array} path The path of the nested property to use
 * @param {*} val The value to compare the nested property with
 * @param {Object} obj The object to check the nested property in
 * @return {Boolean} `true` if the value equals the nested object property,
 *         `false` otherwise.
 * @example
 *
 *      const user1 = { address: { zipCode: 90210 } };
 *      const user2 = { address: { zipCode: 55555 } };
 *      const user3 = { name: 'Bob' };
 *      const users = [ user1, user2, user3 ];
 *      const isFamous = R.pathEq(['address', 'zipCode'], 90210);
 *      R.filter(isFamous, users); //=> [ user1 ]
 */

var pathEq_pathEq =
/*#__PURE__*/
_curry3(function pathEq(_path, val, obj) {
  return es_equals(es_path(_path, obj), val);
});

/* harmony default export */ var es_pathEq = (pathEq_pathEq);
// CONCATENATED MODULE: ./node_modules/ramda/es/pathOr.js



/**
 * If the given, non-null object has a value at the given path, returns the
 * value at that path. Otherwise returns the provided default value.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category Object
 * @typedefn Idx = String | Int
 * @sig a -> [Idx] -> {a} -> a
 * @param {*} d The default value.
 * @param {Array} p The path to use.
 * @param {Object} obj The object to retrieve the nested property from.
 * @return {*} The data at `path` of the supplied object or the default value.
 * @example
 *
 *      R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
 *      R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
 */

var pathOr_pathOr =
/*#__PURE__*/
_curry3(function pathOr(d, p, obj) {
  return es_defaultTo(d, es_path(p, obj));
});

/* harmony default export */ var es_pathOr = (pathOr_pathOr);
// CONCATENATED MODULE: ./node_modules/ramda/es/pathSatisfies.js


/**
 * Returns `true` if the specified object property at given path satisfies the
 * given predicate; `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Logic
 * @typedefn Idx = String | Int
 * @sig (a -> Boolean) -> [Idx] -> {a} -> Boolean
 * @param {Function} pred
 * @param {Array} propPath
 * @param {*} obj
 * @return {Boolean}
 * @see R.propSatisfies, R.path
 * @example
 *
 *      R.pathSatisfies(y => y > 0, ['x', 'y'], {x: {y: 2}}); //=> true
 *      R.pathSatisfies(R.is(Object), [], {x: {y: 2}}); //=> true
 */

var pathSatisfies_pathSatisfies =
/*#__PURE__*/
_curry3(function pathSatisfies(pred, propPath, obj) {
  return pred(es_path(propPath, obj));
});

/* harmony default export */ var es_pathSatisfies = (pathSatisfies_pathSatisfies);
// CONCATENATED MODULE: ./node_modules/ramda/es/pick.js

/**
 * Returns a partial copy of an object containing only the keys specified. If
 * the key does not exist, the property is ignored.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig [k] -> {k: v} -> {k: v}
 * @param {Array} names an array of String property names to copy onto a new object
 * @param {Object} obj The object to copy from
 * @return {Object} A new object with only properties from `names` on it.
 * @see R.omit, R.props
 * @example
 *
 *      R.pick(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
 *      R.pick(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1}
 */

var pick =
/*#__PURE__*/
_curry2(function pick(names, obj) {
  var result = {};
  var idx = 0;

  while (idx < names.length) {
    if (names[idx] in obj) {
      result[names[idx]] = obj[names[idx]];
    }

    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_pick = (pick);
// CONCATENATED MODULE: ./node_modules/ramda/es/pickAll.js

/**
 * Similar to `pick` except that this one includes a `key: undefined` pair for
 * properties that don't exist.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig [k] -> {k: v} -> {k: v}
 * @param {Array} names an array of String property names to copy onto a new object
 * @param {Object} obj The object to copy from
 * @return {Object} A new object with only properties from `names` on it.
 * @see R.pick
 * @example
 *
 *      R.pickAll(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
 *      R.pickAll(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, e: undefined, f: undefined}
 */

var pickAll =
/*#__PURE__*/
_curry2(function pickAll(names, obj) {
  var result = {};
  var idx = 0;
  var len = names.length;

  while (idx < len) {
    var name = names[idx];
    result[name] = obj[name];
    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_pickAll = (pickAll);
// CONCATENATED MODULE: ./node_modules/ramda/es/pickBy.js

/**
 * Returns a partial copy of an object containing only the keys that satisfy
 * the supplied predicate.
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Object
 * @sig ((v, k) -> Boolean) -> {k: v} -> {k: v}
 * @param {Function} pred A predicate to determine whether or not a key
 *        should be included on the output object.
 * @param {Object} obj The object to copy from
 * @return {Object} A new object with only properties that satisfy `pred`
 *         on it.
 * @see R.pick, R.filter
 * @example
 *
 *      const isUpperCase = (val, key) => key.toUpperCase() === key;
 *      R.pickBy(isUpperCase, {a: 1, b: 2, A: 3, B: 4}); //=> {A: 3, B: 4}
 */

var pickBy =
/*#__PURE__*/
_curry2(function pickBy(test, obj) {
  var result = {};

  for (var prop in obj) {
    if (test(obj[prop], prop, obj)) {
      result[prop] = obj[prop];
    }
  }

  return result;
});

/* harmony default export */ var es_pickBy = (pickBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/pipeK.js


/**
 * Returns the left-to-right Kleisli composition of the provided functions,
 * each of which must return a value of a type supported by [`chain`](#chain).
 *
 * `R.pipeK(f, g, h)` is equivalent to `R.pipe(f, R.chain(g), R.chain(h))`.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Function
 * @sig Chain m => ((a -> m b), (b -> m c), ..., (y -> m z)) -> (a -> m z)
 * @param {...Function}
 * @return {Function}
 * @see R.composeK
 * @deprecated since v0.26.0
 * @example
 *
 *      //  parseJson :: String -> Maybe *
 *      //  get :: String -> Object -> Maybe *
 *
 *      //  getStateCode :: Maybe String -> Maybe String
 *      const getStateCode = R.pipeK(
 *        parseJson,
 *        get('user'),
 *        get('address'),
 *        get('state'),
 *        R.compose(Maybe.of, R.toUpper)
 *      );
 *
 *      getStateCode('{"user":{"address":{"state":"ny"}}}');
 *      //=> Just('NY')
 *      getStateCode('[Invalid JSON]');
 *      //=> Nothing()
 * @symb R.pipeK(f, g, h)(a) = R.chain(h, R.chain(g, f(a)))
 */

function pipeK() {
  if (arguments.length === 0) {
    throw new Error('pipeK requires at least one argument');
  }

  return composeK.apply(this, es_reverse(arguments));
}
// CONCATENATED MODULE: ./node_modules/ramda/es/prepend.js


/**
 * Returns a new list with the given element at the front, followed by the
 * contents of the list.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig a -> [a] -> [a]
 * @param {*} el The item to add to the head of the output list.
 * @param {Array} list The array to add to the tail of the output list.
 * @return {Array} A new array.
 * @see R.append
 * @example
 *
 *      R.prepend('fee', ['fi', 'fo', 'fum']); //=> ['fee', 'fi', 'fo', 'fum']
 */

var prepend_prepend =
/*#__PURE__*/
_curry2(function prepend(el, list) {
  return _concat([el], list);
});

/* harmony default export */ var es_prepend = (prepend_prepend);
// CONCATENATED MODULE: ./node_modules/ramda/es/product.js


/**
 * Multiplies together all the elements of a list.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig [Number] -> Number
 * @param {Array} list An array of numbers
 * @return {Number} The product of all the numbers in the list.
 * @see R.reduce
 * @example
 *
 *      R.product([2,4,6,8,100,1]); //=> 38400
 */

var product =
/*#__PURE__*/
es_reduce(es_multiply, 1);
/* harmony default export */ var es_product = (product);
// CONCATENATED MODULE: ./node_modules/ramda/es/useWith.js


/**
 * Accepts a function `fn` and a list of transformer functions and returns a
 * new curried function. When the new function is invoked, it calls the
 * function `fn` with parameters consisting of the result of calling each
 * supplied handler on successive arguments to the new function.
 *
 * If more arguments are passed to the returned function than transformer
 * functions, those arguments are passed directly to `fn` as additional
 * parameters. If you expect additional arguments that don't need to be
 * transformed, although you can ignore them, it's best to pass an identity
 * function so that the new function reports the correct arity.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig ((x1, x2, ...) -> z) -> [(a -> x1), (b -> x2), ...] -> (a -> b -> ... -> z)
 * @param {Function} fn The function to wrap.
 * @param {Array} transformers A list of transformer functions
 * @return {Function} The wrapped function.
 * @see R.converge
 * @example
 *
 *      R.useWith(Math.pow, [R.identity, R.identity])(3, 4); //=> 81
 *      R.useWith(Math.pow, [R.identity, R.identity])(3)(4); //=> 81
 *      R.useWith(Math.pow, [R.dec, R.inc])(3, 4); //=> 32
 *      R.useWith(Math.pow, [R.dec, R.inc])(3)(4); //=> 32
 * @symb R.useWith(f, [g, h])(a, b) = f(g(a), h(b))
 */

var useWith_useWith =
/*#__PURE__*/
_curry2(function useWith(fn, transformers) {
  return es_curryN(transformers.length, function () {
    var args = [];
    var idx = 0;

    while (idx < transformers.length) {
      args.push(transformers[idx].call(this, arguments[idx]));
      idx += 1;
    }

    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, transformers.length)));
  });
});

/* harmony default export */ var es_useWith = (useWith_useWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/project.js




/**
 * Reasonable analog to SQL `select` statement.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @category Relation
 * @sig [k] -> [{k: v}] -> [{k: v}]
 * @param {Array} props The property names to project
 * @param {Array} objs The objects to query
 * @return {Array} An array of objects with just the `props` properties.
 * @example
 *
 *      const abby = {name: 'Abby', age: 7, hair: 'blond', grade: 2};
 *      const fred = {name: 'Fred', age: 12, hair: 'brown', grade: 7};
 *      const kids = [abby, fred];
 *      R.project(['name', 'grade'], kids); //=> [{name: 'Abby', grade: 2}, {name: 'Fred', grade: 7}]
 */

var project =
/*#__PURE__*/
es_useWith(_map, [es_pickAll, es_identity]); // passing `identity` gives correct arity

/* harmony default export */ var es_project = (project);
// CONCATENATED MODULE: ./node_modules/ramda/es/propEq.js


/**
 * Returns `true` if the specified object property is equal, in
 * [`R.equals`](#equals) terms, to the given value; `false` otherwise.
 * You can test multiple properties with [`R.whereEq`](#whereEq).
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig String -> a -> Object -> Boolean
 * @param {String} name
 * @param {*} val
 * @param {*} obj
 * @return {Boolean}
 * @see R.whereEq, R.propSatisfies, R.equals
 * @example
 *
 *      const abby = {name: 'Abby', age: 7, hair: 'blond'};
 *      const fred = {name: 'Fred', age: 12, hair: 'brown'};
 *      const rusty = {name: 'Rusty', age: 10, hair: 'brown'};
 *      const alois = {name: 'Alois', age: 15, disposition: 'surly'};
 *      const kids = [abby, fred, rusty, alois];
 *      const hasBrownHair = R.propEq('hair', 'brown');
 *      R.filter(hasBrownHair, kids); //=> [fred, rusty]
 */

var propEq_propEq =
/*#__PURE__*/
_curry3(function propEq(name, val, obj) {
  return es_equals(val, obj[name]);
});

/* harmony default export */ var es_propEq = (propEq_propEq);
// CONCATENATED MODULE: ./node_modules/ramda/es/propIs.js


/**
 * Returns `true` if the specified object property is of the given type;
 * `false` otherwise.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Type
 * @sig Type -> String -> Object -> Boolean
 * @param {Function} type
 * @param {String} name
 * @param {*} obj
 * @return {Boolean}
 * @see R.is, R.propSatisfies
 * @example
 *
 *      R.propIs(Number, 'x', {x: 1, y: 2});  //=> true
 *      R.propIs(Number, 'x', {x: 'foo'});    //=> false
 *      R.propIs(Number, 'x', {});            //=> false
 */

var propIs_propIs =
/*#__PURE__*/
_curry3(function propIs(type, name, obj) {
  return es_is(type, obj[name]);
});

/* harmony default export */ var es_propIs = (propIs_propIs);
// CONCATENATED MODULE: ./node_modules/ramda/es/propOr.js


/**
 * If the given, non-null object has an own property with the specified name,
 * returns the value of that property. Otherwise returns the provided default
 * value.
 *
 * @func
 * @memberOf R
 * @since v0.6.0
 * @category Object
 * @sig a -> String -> Object -> a
 * @param {*} val The default value.
 * @param {String} p The name of the property to return.
 * @param {Object} obj The object to query.
 * @return {*} The value of given property of the supplied object or the default value.
 * @example
 *
 *      const alice = {
 *        name: 'ALICE',
 *        age: 101
 *      };
 *      const favorite = R.prop('favoriteLibrary');
 *      const favoriteWithDefault = R.propOr('Ramda', 'favoriteLibrary');
 *
 *      favorite(alice);  //=> undefined
 *      favoriteWithDefault(alice);  //=> 'Ramda'
 */

var propOr_propOr =
/*#__PURE__*/
_curry3(function propOr(val, p, obj) {
  return es_pathOr(val, [p], obj);
});

/* harmony default export */ var es_propOr = (propOr_propOr);
// CONCATENATED MODULE: ./node_modules/ramda/es/propSatisfies.js

/**
 * Returns `true` if the specified object property satisfies the given
 * predicate; `false` otherwise. You can test multiple properties with
 * [`R.where`](#where).
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Logic
 * @sig (a -> Boolean) -> String -> {String: a} -> Boolean
 * @param {Function} pred
 * @param {String} name
 * @param {*} obj
 * @return {Boolean}
 * @see R.where, R.propEq, R.propIs
 * @example
 *
 *      R.propSatisfies(x => x > 0, 'x', {x: 1, y: 2}); //=> true
 */

var propSatisfies =
/*#__PURE__*/
_curry3(function propSatisfies(pred, name, obj) {
  return pred(obj[name]);
});

/* harmony default export */ var es_propSatisfies = (propSatisfies);
// CONCATENATED MODULE: ./node_modules/ramda/es/props.js


/**
 * Acts as multiple `prop`: array of keys in, array of values out. Preserves
 * order.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Object
 * @sig [k] -> {k: v} -> [v]
 * @param {Array} ps The property names to fetch
 * @param {Object} obj The object to query
 * @return {Array} The corresponding values or partially applied function.
 * @example
 *
 *      R.props(['x', 'y'], {x: 1, y: 2}); //=> [1, 2]
 *      R.props(['c', 'a', 'b'], {b: 2, a: 1}); //=> [undefined, 1, 2]
 *
 *      const fullName = R.compose(R.join(' '), R.props(['first', 'last']));
 *      fullName({last: 'Bullet-Tooth', age: 33, first: 'Tony'}); //=> 'Tony Bullet-Tooth'
 */

var props_props =
/*#__PURE__*/
_curry2(function props(ps, obj) {
  return ps.map(function (p) {
    return es_path([p], obj);
  });
});

/* harmony default export */ var es_props = (props_props);
// CONCATENATED MODULE: ./node_modules/ramda/es/range.js


/**
 * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig Number -> Number -> [Number]
 * @param {Number} from The first number in the list.
 * @param {Number} to One more than the last number in the list.
 * @return {Array} The list of numbers in the set `[a, b)`.
 * @example
 *
 *      R.range(1, 5);    //=> [1, 2, 3, 4]
 *      R.range(50, 53);  //=> [50, 51, 52]
 */

var range_range =
/*#__PURE__*/
_curry2(function range(from, to) {
  if (!(_isNumber(from) && _isNumber(to))) {
    throw new TypeError('Both arguments to range must be numbers');
  }

  var result = [];
  var n = from;

  while (n < to) {
    result.push(n);
    n += 1;
  }

  return result;
});

/* harmony default export */ var es_range = (range_range);
// CONCATENATED MODULE: ./node_modules/ramda/es/reduceRight.js

/**
 * Returns a single item by iterating through the list, successively calling
 * the iterator function and passing it an accumulator value and the current
 * value from the array, and then passing the result to the next call.
 *
 * Similar to [`reduce`](#reduce), except moves through the input list from the
 * right to the left.
 *
 * The iterator function receives two values: *(value, acc)*, while the arguments'
 * order of `reduce`'s iterator function is *(acc, value)*.
 *
 * Note: `R.reduceRight` does not skip deleted or unassigned indices (sparse
 * arrays), unlike the native `Array.prototype.reduceRight` method. For more details
 * on this behavior, see:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight#Description
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig ((a, b) -> b) -> b -> [a] -> b
 * @param {Function} fn The iterator function. Receives two values, the current element from the array
 *        and the accumulator.
 * @param {*} acc The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.reduce, R.addIndex
 * @example
 *
 *      R.reduceRight(R.subtract, 0, [1, 2, 3, 4]) // => (1 - (2 - (3 - (4 - 0)))) = -2
 *      //    -               -2
 *      //   / \              / \
 *      //  1   -            1   3
 *      //     / \              / \
 *      //    2   -     ==>    2  -1
 *      //       / \              / \
 *      //      3   -            3   4
 *      //         / \              / \
 *      //        4   0            4   0
 *
 * @symb R.reduceRight(f, a, [b, c, d]) = f(b, f(c, f(d, a)))
 */

var reduceRight =
/*#__PURE__*/
_curry3(function reduceRight(fn, acc, list) {
  var idx = list.length - 1;

  while (idx >= 0) {
    acc = fn(list[idx], acc);
    idx -= 1;
  }

  return acc;
});

/* harmony default export */ var es_reduceRight = (reduceRight);
// CONCATENATED MODULE: ./node_modules/ramda/es/reduceWhile.js



/**
 * Like [`reduce`](#reduce), `reduceWhile` returns a single item by iterating
 * through the list, successively calling the iterator function. `reduceWhile`
 * also takes a predicate that is evaluated before each step. If the predicate
 * returns `false`, it "short-circuits" the iteration and returns the current
 * value of the accumulator.
 *
 * @func
 * @memberOf R
 * @since v0.22.0
 * @category List
 * @sig ((a, b) -> Boolean) -> ((a, b) -> a) -> a -> [b] -> a
 * @param {Function} pred The predicate. It is passed the accumulator and the
 *        current element.
 * @param {Function} fn The iterator function. Receives two values, the
 *        accumulator and the current element.
 * @param {*} a The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.reduce, R.reduced
 * @example
 *
 *      const isOdd = (acc, x) => x % 2 === 1;
 *      const xs = [1, 3, 5, 60, 777, 800];
 *      R.reduceWhile(isOdd, R.add, 0, xs); //=> 9
 *
 *      const ys = [2, 4, 6]
 *      R.reduceWhile(isOdd, R.add, 111, ys); //=> 111
 */

var reduceWhile =
/*#__PURE__*/
_curryN(4, [], function _reduceWhile(pred, fn, a, list) {
  return _reduce(function (acc, x) {
    return pred(acc, x) ? fn(acc, x) : _reduced(acc);
  }, a, list);
});

/* harmony default export */ var es_reduceWhile = (reduceWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/reduced.js


/**
 * Returns a value wrapped to indicate that it is the final value of the reduce
 * and transduce functions. The returned value should be considered a black
 * box: the internal structure is not guaranteed to be stable.
 *
 * Note: this optimization is only available to the below functions:
 * - [`reduce`](#reduce)
 * - [`reduceWhile`](#reduceWhile)
 * - [`transduce`](#transduce)
 *
 * @func
 * @memberOf R
 * @since v0.15.0
 * @category List
 * @sig a -> *
 * @param {*} x The final value of the reduce.
 * @return {*} The wrapped value.
 * @see R.reduce, R.reduceWhile, R.transduce
 * @example
 *
 *     R.reduce(
 *       (acc, item) => item > 3 ? R.reduced(acc) : acc.concat(item),
 *       [],
 *       [1, 2, 3, 4, 5]) // [1, 2, 3]
 */

var reduced =
/*#__PURE__*/
_curry1(_reduced);

/* harmony default export */ var es_reduced = (reduced);
// CONCATENATED MODULE: ./node_modules/ramda/es/times.js

/**
 * Calls an input function `n` times, returning an array containing the results
 * of those function calls.
 *
 * `fn` is passed one argument: The current value of `n`, which begins at `0`
 * and is gradually incremented to `n - 1`.
 *
 * @func
 * @memberOf R
 * @since v0.2.3
 * @category List
 * @sig (Number -> a) -> Number -> [a]
 * @param {Function} fn The function to invoke. Passed one argument, the current value of `n`.
 * @param {Number} n A value between `0` and `n - 1`. Increments after each function call.
 * @return {Array} An array containing the return values of all calls to `fn`.
 * @see R.repeat
 * @example
 *
 *      R.times(R.identity, 5); //=> [0, 1, 2, 3, 4]
 * @symb R.times(f, 0) = []
 * @symb R.times(f, 1) = [f(0)]
 * @symb R.times(f, 2) = [f(0), f(1)]
 */

var times =
/*#__PURE__*/
_curry2(function times(fn, n) {
  var len = Number(n);
  var idx = 0;
  var list;

  if (len < 0 || isNaN(len)) {
    throw new RangeError('n must be a non-negative number');
  }

  list = new Array(len);

  while (idx < len) {
    list[idx] = fn(idx);
    idx += 1;
  }

  return list;
});

/* harmony default export */ var es_times = (times);
// CONCATENATED MODULE: ./node_modules/ramda/es/repeat.js



/**
 * Returns a fixed list of size `n` containing a specified identical value.
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category List
 * @sig a -> n -> [a]
 * @param {*} value The value to repeat.
 * @param {Number} n The desired size of the output list.
 * @return {Array} A new array containing `n` `value`s.
 * @see R.times
 * @example
 *
 *      R.repeat('hi', 5); //=> ['hi', 'hi', 'hi', 'hi', 'hi']
 *
 *      const obj = {};
 *      const repeatedObjs = R.repeat(obj, 5); //=> [{}, {}, {}, {}, {}]
 *      repeatedObjs[0] === repeatedObjs[1]; //=> true
 * @symb R.repeat(a, 0) = []
 * @symb R.repeat(a, 1) = [a]
 * @symb R.repeat(a, 2) = [a, a]
 */

var repeat_repeat =
/*#__PURE__*/
_curry2(function repeat(value, n) {
  return es_times(es_always(value), n);
});

/* harmony default export */ var es_repeat = (repeat_repeat);
// CONCATENATED MODULE: ./node_modules/ramda/es/replace.js

/**
 * Replace a substring or regex match in a string with a replacement.
 *
 * The first two parameters correspond to the parameters of the
 * `String.prototype.replace()` function, so the second parameter can also be a
 * function.
 *
 * @func
 * @memberOf R
 * @since v0.7.0
 * @category String
 * @sig RegExp|String -> String -> String -> String
 * @param {RegExp|String} pattern A regular expression or a substring to match.
 * @param {String} replacement The string to replace the matches with.
 * @param {String} str The String to do the search and replacement in.
 * @return {String} The result.
 * @example
 *
 *      R.replace('foo', 'bar', 'foo foo foo'); //=> 'bar foo foo'
 *      R.replace(/foo/, 'bar', 'foo foo foo'); //=> 'bar foo foo'
 *
 *      // Use the "g" (global) flag to replace all occurrences:
 *      R.replace(/foo/g, 'bar', 'foo foo foo'); //=> 'bar bar bar'
 */

var replace =
/*#__PURE__*/
_curry3(function replace(regex, replacement, str) {
  return str.replace(regex, replacement);
});

/* harmony default export */ var es_replace = (replace);
// CONCATENATED MODULE: ./node_modules/ramda/es/scan.js

/**
 * Scan is similar to [`reduce`](#reduce), but returns a list of successively
 * reduced values from the left
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category List
 * @sig ((a, b) -> a) -> a -> [b] -> [a]
 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
 *        current element from the array
 * @param {*} acc The accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {Array} A list of all intermediately reduced values.
 * @see R.reduce, R.mapAccum
 * @example
 *
 *      const numbers = [1, 2, 3, 4];
 *      const factorials = R.scan(R.multiply, 1, numbers); //=> [1, 1, 2, 6, 24]
 * @symb R.scan(f, a, [b, c]) = [a, f(a, b), f(f(a, b), c)]
 */

var scan =
/*#__PURE__*/
_curry3(function scan(fn, acc, list) {
  var idx = 0;
  var len = list.length;
  var result = [acc];

  while (idx < len) {
    acc = fn(acc, list[idx]);
    result[idx + 1] = acc;
    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_scan = (scan);
// CONCATENATED MODULE: ./node_modules/ramda/es/sequence.js





/**
 * Transforms a [Traversable](https://github.com/fantasyland/fantasy-land#traversable)
 * of [Applicative](https://github.com/fantasyland/fantasy-land#applicative) into an
 * Applicative of Traversable.
 *
 * Dispatches to the `sequence` method of the second argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
 * @param {Function} of
 * @param {*} traversable
 * @return {*}
 * @see R.traverse
 * @example
 *
 *      R.sequence(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
 *      R.sequence(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
 *
 *      R.sequence(R.of, Just([1, 2, 3])); //=> [Just(1), Just(2), Just(3)]
 *      R.sequence(R.of, Nothing());       //=> [Nothing()]
 */

var sequence_sequence =
/*#__PURE__*/
_curry2(function sequence(of, traversable) {
  return typeof traversable.sequence === 'function' ? traversable.sequence(of) : es_reduceRight(function (x, acc) {
    return es_ap(es_map(es_prepend, x), acc);
  }, of([]), traversable);
});

/* harmony default export */ var es_sequence = (sequence_sequence);
// CONCATENATED MODULE: ./node_modules/ramda/es/set.js



/**
 * Returns the result of "setting" the portion of the given data structure
 * focused by the given lens to the given value.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig Lens s a -> a -> s -> s
 * @param {Lens} lens
 * @param {*} v
 * @param {*} x
 * @return {*}
 * @see R.prop, R.lensIndex, R.lensProp
 * @example
 *
 *      const xLens = R.lensProp('x');
 *
 *      R.set(xLens, 4, {x: 1, y: 2});  //=> {x: 4, y: 2}
 *      R.set(xLens, 8, {x: 1, y: 2});  //=> {x: 8, y: 2}
 */

var set_set =
/*#__PURE__*/
_curry3(function set(lens, v, x) {
  return es_over(lens, es_always(v), x);
});

/* harmony default export */ var es_set = (set_set);
// CONCATENATED MODULE: ./node_modules/ramda/es/sort.js

/**
 * Returns a copy of the list, sorted according to the comparator function,
 * which should accept two values at a time and return a negative number if the
 * first value is smaller, a positive number if it's larger, and zero if they
 * are equal. Please note that this is a **copy** of the list. It does not
 * modify the original.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig ((a, a) -> Number) -> [a] -> [a]
 * @param {Function} comparator A sorting function :: a -> b -> Int
 * @param {Array} list The list to sort
 * @return {Array} a new array with its elements sorted by the comparator function.
 * @example
 *
 *      const diff = function(a, b) { return a - b; };
 *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
 */

var sort =
/*#__PURE__*/
_curry2(function sort(comparator, list) {
  return Array.prototype.slice.call(list, 0).sort(comparator);
});

/* harmony default export */ var es_sort = (sort);
// CONCATENATED MODULE: ./node_modules/ramda/es/sortBy.js

/**
 * Sorts the list according to the supplied function.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig Ord b => (a -> b) -> [a] -> [a]
 * @param {Function} fn
 * @param {Array} list The list to sort.
 * @return {Array} A new list sorted by the keys generated by `fn`.
 * @example
 *
 *      const sortByFirstItem = R.sortBy(R.prop(0));
 *      const pairs = [[-1, 1], [-2, 2], [-3, 3]];
 *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
 *
 *      const sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')));
 *      const alice = {
 *        name: 'ALICE',
 *        age: 101
 *      };
 *      const bob = {
 *        name: 'Bob',
 *        age: -10
 *      };
 *      const clara = {
 *        name: 'clara',
 *        age: 314.159
 *      };
 *      const people = [clara, bob, alice];
 *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
 */

var sortBy =
/*#__PURE__*/
_curry2(function sortBy(fn, list) {
  return Array.prototype.slice.call(list, 0).sort(function (a, b) {
    var aa = fn(a);
    var bb = fn(b);
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
});

/* harmony default export */ var es_sortBy = (sortBy);
// CONCATENATED MODULE: ./node_modules/ramda/es/sortWith.js

/**
 * Sorts a list according to a list of comparators.
 *
 * @func
 * @memberOf R
 * @since v0.23.0
 * @category Relation
 * @sig [(a, a) -> Number] -> [a] -> [a]
 * @param {Array} functions A list of comparator functions.
 * @param {Array} list The list to sort.
 * @return {Array} A new list sorted according to the comarator functions.
 * @example
 *
 *      const alice = {
 *        name: 'alice',
 *        age: 40
 *      };
 *      const bob = {
 *        name: 'bob',
 *        age: 30
 *      };
 *      const clara = {
 *        name: 'clara',
 *        age: 40
 *      };
 *      const people = [clara, bob, alice];
 *      const ageNameSort = R.sortWith([
 *        R.descend(R.prop('age')),
 *        R.ascend(R.prop('name'))
 *      ]);
 *      ageNameSort(people); //=> [alice, clara, bob]
 */

var sortWith =
/*#__PURE__*/
_curry2(function sortWith(fns, list) {
  return Array.prototype.slice.call(list, 0).sort(function (a, b) {
    var result = 0;
    var i = 0;

    while (result === 0 && i < fns.length) {
      result = fns[i](a, b);
      i += 1;
    }

    return result;
  });
});

/* harmony default export */ var es_sortWith = (sortWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/split.js

/**
 * Splits a string into an array of strings based on the given
 * separator.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category String
 * @sig (String | RegExp) -> String -> [String]
 * @param {String|RegExp} sep The pattern.
 * @param {String} str The string to separate into an array.
 * @return {Array} The array of strings from `str` separated by `sep`.
 * @see R.join
 * @example
 *
 *      const pathComponents = R.split('/');
 *      R.tail(pathComponents('/usr/local/bin/node')); //=> ['usr', 'local', 'bin', 'node']
 *
 *      R.split('.', 'a.b.c.xyz.d'); //=> ['a', 'b', 'c', 'xyz', 'd']
 */

var split =
/*#__PURE__*/
es_invoker(1, 'split');
/* harmony default export */ var es_split = (split);
// CONCATENATED MODULE: ./node_modules/ramda/es/splitAt.js



/**
 * Splits a given list or string at a given index.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig Number -> [a] -> [[a], [a]]
 * @sig Number -> String -> [String, String]
 * @param {Number} index The index where the array/string is split.
 * @param {Array|String} array The array/string to be split.
 * @return {Array}
 * @example
 *
 *      R.splitAt(1, [1, 2, 3]);          //=> [[1], [2, 3]]
 *      R.splitAt(5, 'hello world');      //=> ['hello', ' world']
 *      R.splitAt(-1, 'foobar');          //=> ['fooba', 'r']
 */

var splitAt_splitAt =
/*#__PURE__*/
_curry2(function splitAt(index, array) {
  return [es_slice(0, index, array), es_slice(index, es_length(array), array)];
});

/* harmony default export */ var es_splitAt = (splitAt_splitAt);
// CONCATENATED MODULE: ./node_modules/ramda/es/splitEvery.js


/**
 * Splits a collection into slices of the specified length.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig Number -> [a] -> [[a]]
 * @sig Number -> String -> [String]
 * @param {Number} n
 * @param {Array} list
 * @return {Array}
 * @example
 *
 *      R.splitEvery(3, [1, 2, 3, 4, 5, 6, 7]); //=> [[1, 2, 3], [4, 5, 6], [7]]
 *      R.splitEvery(3, 'foobarbaz'); //=> ['foo', 'bar', 'baz']
 */

var splitEvery_splitEvery =
/*#__PURE__*/
_curry2(function splitEvery(n, list) {
  if (n <= 0) {
    throw new Error('First argument to splitEvery must be a positive integer');
  }

  var result = [];
  var idx = 0;

  while (idx < list.length) {
    result.push(es_slice(idx, idx += n, list));
  }

  return result;
});

/* harmony default export */ var es_splitEvery = (splitEvery_splitEvery);
// CONCATENATED MODULE: ./node_modules/ramda/es/splitWhen.js

/**
 * Takes a list and a predicate and returns a pair of lists with the following properties:
 *
 *  - the result of concatenating the two output lists is equivalent to the input list;
 *  - none of the elements of the first output list satisfies the predicate; and
 *  - if the second output list is non-empty, its first element satisfies the predicate.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> [[a], [a]]
 * @param {Function} pred The predicate that determines where the array is split.
 * @param {Array} list The array to be split.
 * @return {Array}
 * @example
 *
 *      R.splitWhen(R.equals(2), [1, 2, 3, 1, 2, 3]);   //=> [[1], [2, 3, 1, 2, 3]]
 */

var splitWhen =
/*#__PURE__*/
_curry2(function splitWhen(pred, list) {
  var idx = 0;
  var len = list.length;
  var prefix = [];

  while (idx < len && !pred(list[idx])) {
    prefix.push(list[idx]);
    idx += 1;
  }

  return [prefix, Array.prototype.slice.call(list, idx)];
});

/* harmony default export */ var es_splitWhen = (splitWhen);
// CONCATENATED MODULE: ./node_modules/ramda/es/startsWith.js



/**
 * Checks if a list starts with the provided sublist.
 *
 * Similarly, checks if a string starts with the provided substring.
 *
 * @func
 * @memberOf R
 * @since v0.24.0
 * @category List
 * @sig [a] -> [a] -> Boolean
 * @sig String -> String -> Boolean
 * @param {*} prefix
 * @param {*} list
 * @return {Boolean}
 * @see R.endsWith
 * @example
 *
 *      R.startsWith('a', 'abc')                //=> true
 *      R.startsWith('b', 'abc')                //=> false
 *      R.startsWith(['a'], ['a', 'b', 'c'])    //=> true
 *      R.startsWith(['b'], ['a', 'b', 'c'])    //=> false
 */

var startsWith =
/*#__PURE__*/
_curry2(function (prefix, list) {
  return es_equals(es_take(prefix.length, list), prefix);
});

/* harmony default export */ var es_startsWith = (startsWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/subtract.js

/**
 * Subtracts its second argument from its first argument.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Math
 * @sig Number -> Number -> Number
 * @param {Number} a The first value.
 * @param {Number} b The second value.
 * @return {Number} The result of `a - b`.
 * @see R.add
 * @example
 *
 *      R.subtract(10, 8); //=> 2
 *
 *      const minus5 = R.subtract(R.__, 5);
 *      minus5(17); //=> 12
 *
 *      const complementaryAngle = R.subtract(90);
 *      complementaryAngle(30); //=> 60
 *      complementaryAngle(72); //=> 18
 */

var subtract =
/*#__PURE__*/
_curry2(function subtract(a, b) {
  return Number(a) - Number(b);
});

/* harmony default export */ var es_subtract = (subtract);
// CONCATENATED MODULE: ./node_modules/ramda/es/symmetricDifference.js



/**
 * Finds the set (i.e. no duplicates) of all elements contained in the first or
 * second list, but not both.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Relation
 * @sig [*] -> [*] -> [*]
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The elements in `list1` or `list2`, but not both.
 * @see R.symmetricDifferenceWith, R.difference, R.differenceWith
 * @example
 *
 *      R.symmetricDifference([1,2,3,4], [7,6,5,4,3]); //=> [1,2,7,6,5]
 *      R.symmetricDifference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5,1,2]
 */

var symmetricDifference_symmetricDifference =
/*#__PURE__*/
_curry2(function symmetricDifference(list1, list2) {
  return es_concat(es_difference(list1, list2), es_difference(list2, list1));
});

/* harmony default export */ var es_symmetricDifference = (symmetricDifference_symmetricDifference);
// CONCATENATED MODULE: ./node_modules/ramda/es/symmetricDifferenceWith.js



/**
 * Finds the set (i.e. no duplicates) of all elements contained in the first or
 * second list, but not both. Duplication is determined according to the value
 * returned by applying the supplied predicate to two list elements.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category Relation
 * @sig ((a, a) -> Boolean) -> [a] -> [a] -> [a]
 * @param {Function} pred A predicate used to test whether two items are equal.
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The elements in `list1` or `list2`, but not both.
 * @see R.symmetricDifference, R.difference, R.differenceWith
 * @example
 *
 *      const eqA = R.eqBy(R.prop('a'));
 *      const l1 = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
 *      const l2 = [{a: 3}, {a: 4}, {a: 5}, {a: 6}];
 *      R.symmetricDifferenceWith(eqA, l1, l2); //=> [{a: 1}, {a: 2}, {a: 5}, {a: 6}]
 */

var symmetricDifferenceWith_symmetricDifferenceWith =
/*#__PURE__*/
_curry3(function symmetricDifferenceWith(pred, list1, list2) {
  return es_concat(es_differenceWith(pred, list1, list2), es_differenceWith(pred, list2, list1));
});

/* harmony default export */ var es_symmetricDifferenceWith = (symmetricDifferenceWith_symmetricDifferenceWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/takeLastWhile.js


/**
 * Returns a new list containing the last `n` elements of a given list, passing
 * each value to the supplied predicate function, and terminating when the
 * predicate function returns `false`. Excludes the element that caused the
 * predicate function to fail. The predicate function is passed one argument:
 * *(value)*.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> [a]
 * @sig (a -> Boolean) -> String -> String
 * @param {Function} fn The function called per iteration.
 * @param {Array} xs The collection to iterate over.
 * @return {Array} A new array.
 * @see R.dropLastWhile, R.addIndex
 * @example
 *
 *      const isNotOne = x => x !== 1;
 *
 *      R.takeLastWhile(isNotOne, [1, 2, 3, 4]); //=> [2, 3, 4]
 *
 *      R.takeLastWhile(x => x !== 'R' , 'Ramda'); //=> 'amda'
 */

var takeLastWhile_takeLastWhile =
/*#__PURE__*/
_curry2(function takeLastWhile(fn, xs) {
  var idx = xs.length - 1;

  while (idx >= 0 && fn(xs[idx])) {
    idx -= 1;
  }

  return es_slice(idx + 1, Infinity, xs);
});

/* harmony default export */ var es_takeLastWhile = (takeLastWhile_takeLastWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xtakeWhile.js




var _xtakeWhile_XTakeWhile =
/*#__PURE__*/
function () {
  function XTakeWhile(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
  XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;

  XTakeWhile.prototype['@@transducer/step'] = function (result, input) {
    return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
  };

  return XTakeWhile;
}();

var _xtakeWhile =
/*#__PURE__*/
_curry2(function _xtakeWhile(f, xf) {
  return new _xtakeWhile_XTakeWhile(f, xf);
});

/* harmony default export */ var internal_xtakeWhile = (_xtakeWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/takeWhile.js




/**
 * Returns a new list containing the first `n` elements of a given list,
 * passing each value to the supplied predicate function, and terminating when
 * the predicate function returns `false`. Excludes the element that caused the
 * predicate function to fail. The predicate function is passed one argument:
 * *(value)*.
 *
 * Dispatches to the `takeWhile` method of the second argument, if present.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig (a -> Boolean) -> [a] -> [a]
 * @sig (a -> Boolean) -> String -> String
 * @param {Function} fn The function called per iteration.
 * @param {Array} xs The collection to iterate over.
 * @return {Array} A new array.
 * @see R.dropWhile, R.transduce, R.addIndex
 * @example
 *
 *      const isNotFour = x => x !== 4;
 *
 *      R.takeWhile(isNotFour, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3]
 *
 *      R.takeWhile(x => x !== 'd' , 'Ramda'); //=> 'Ram'
 */

var takeWhile_takeWhile =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable(['takeWhile'], internal_xtakeWhile, function takeWhile(fn, xs) {
  var idx = 0;
  var len = xs.length;

  while (idx < len && fn(xs[idx])) {
    idx += 1;
  }

  return es_slice(0, idx, xs);
}));

/* harmony default export */ var es_takeWhile = (takeWhile_takeWhile);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_xtap.js



var _xtap_XTap =
/*#__PURE__*/
function () {
  function XTap(f, xf) {
    this.xf = xf;
    this.f = f;
  }

  XTap.prototype['@@transducer/init'] = _xfBase.init;
  XTap.prototype['@@transducer/result'] = _xfBase.result;

  XTap.prototype['@@transducer/step'] = function (result, input) {
    this.f(input);
    return this.xf['@@transducer/step'](result, input);
  };

  return XTap;
}();

var _xtap =
/*#__PURE__*/
_curry2(function _xtap(f, xf) {
  return new _xtap_XTap(f, xf);
});

/* harmony default export */ var internal_xtap = (_xtap);
// CONCATENATED MODULE: ./node_modules/ramda/es/tap.js



/**
 * Runs the given function with the supplied object, then returns the object.
 *
 * Acts as a transducer if a transformer is given as second parameter.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Function
 * @sig (a -> *) -> a -> a
 * @param {Function} fn The function to call with `x`. The return value of `fn` will be thrown away.
 * @param {*} x
 * @return {*} `x`.
 * @example
 *
 *      const sayX = x => console.log('x is ' + x);
 *      R.tap(sayX, 100); //=> 100
 *      // logs 'x is 100'
 * @symb R.tap(f, a) = a
 */

var tap =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
_dispatchable([], internal_xtap, function tap(fn, x) {
  fn(x);
  return x;
}));

/* harmony default export */ var es_tap = (tap);
// CONCATENATED MODULE: ./node_modules/ramda/es/internal/_isRegExp.js
function _isRegExp(x) {
  return Object.prototype.toString.call(x) === '[object RegExp]';
}
// CONCATENATED MODULE: ./node_modules/ramda/es/test.js




/**
 * Determines whether a given string matches a given regular expression.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category String
 * @sig RegExp -> String -> Boolean
 * @param {RegExp} pattern
 * @param {String} str
 * @return {Boolean}
 * @see R.match
 * @example
 *
 *      R.test(/^x/, 'xyz'); //=> true
 *      R.test(/^y/, 'xyz'); //=> false
 */

var test_test =
/*#__PURE__*/
_curry2(function test(pattern, str) {
  if (!_isRegExp(pattern)) {
    throw new TypeError('‘test’ requires a value of type RegExp as its first argument; received ' + es_toString(pattern));
  }

  return _cloneRegExp(pattern).test(str);
});

/* harmony default export */ var es_test = (test_test);
// CONCATENATED MODULE: ./node_modules/ramda/es/andThen.js


/**
 * Returns the result of applying the onSuccess function to the value inside
 * a successfully resolved promise. This is useful for working with promises
 * inside function compositions.
 *
 * @func
 * @memberOf R
 * @since v0.27.1
 * @category Function
 * @sig (a -> b) -> (Promise e a) -> (Promise e b)
 * @sig (a -> (Promise e b)) -> (Promise e a) -> (Promise e b)
 * @param {Function} onSuccess The function to apply. Can return a value or a promise of a value.
 * @param {Promise} p
 * @return {Promise} The result of calling `p.then(onSuccess)`
 * @see R.otherwise
 * @example
 *
 *      var makeQuery = (email) => ({ query: { email }});
 *
 *      //getMemberName :: String -> Promise ({firstName, lastName})
 *      var getMemberName = R.pipe(
 *        makeQuery,
 *        fetchMember,
 *        R.andThen(R.pick(['firstName', 'lastName']))
 *      );
 */

var andThen_andThen =
/*#__PURE__*/
_curry2(function andThen(f, p) {
  _assertPromise('andThen', p);

  return p.then(f);
});

/* harmony default export */ var es_andThen = (andThen_andThen);
// CONCATENATED MODULE: ./node_modules/ramda/es/toLower.js

/**
 * The lower case version of a string.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category String
 * @sig String -> String
 * @param {String} str The string to lower case.
 * @return {String} The lower case version of `str`.
 * @see R.toUpper
 * @example
 *
 *      R.toLower('XYZ'); //=> 'xyz'
 */

var toLower =
/*#__PURE__*/
es_invoker(0, 'toLowerCase');
/* harmony default export */ var es_toLower = (toLower);
// CONCATENATED MODULE: ./node_modules/ramda/es/toPairs.js


/**
 * Converts an object into an array of key, value arrays. Only the object's
 * own properties are used.
 * Note that the order of the output array is not guaranteed to be consistent
 * across different JS platforms.
 *
 * @func
 * @memberOf R
 * @since v0.4.0
 * @category Object
 * @sig {String: *} -> [[String,*]]
 * @param {Object} obj The object to extract from
 * @return {Array} An array of key, value arrays from the object's own properties.
 * @see R.fromPairs
 * @example
 *
 *      R.toPairs({a: 1, b: 2, c: 3}); //=> [['a', 1], ['b', 2], ['c', 3]]
 */

var toPairs_toPairs =
/*#__PURE__*/
_curry1(function toPairs(obj) {
  var pairs = [];

  for (var prop in obj) {
    if (_has(prop, obj)) {
      pairs[pairs.length] = [prop, obj[prop]];
    }
  }

  return pairs;
});

/* harmony default export */ var es_toPairs = (toPairs_toPairs);
// CONCATENATED MODULE: ./node_modules/ramda/es/toPairsIn.js

/**
 * Converts an object into an array of key, value arrays. The object's own
 * properties and prototype properties are used. Note that the order of the
 * output array is not guaranteed to be consistent across different JS
 * platforms.
 *
 * @func
 * @memberOf R
 * @since v0.4.0
 * @category Object
 * @sig {String: *} -> [[String,*]]
 * @param {Object} obj The object to extract from
 * @return {Array} An array of key, value arrays from the object's own
 *         and prototype properties.
 * @example
 *
 *      const F = function() { this.x = 'X'; };
 *      F.prototype.y = 'Y';
 *      const f = new F();
 *      R.toPairsIn(f); //=> [['x','X'], ['y','Y']]
 */

var toPairsIn =
/*#__PURE__*/
_curry1(function toPairsIn(obj) {
  var pairs = [];

  for (var prop in obj) {
    pairs[pairs.length] = [prop, obj[prop]];
  }

  return pairs;
});

/* harmony default export */ var es_toPairsIn = (toPairsIn);
// CONCATENATED MODULE: ./node_modules/ramda/es/toUpper.js

/**
 * The upper case version of a string.
 *
 * @func
 * @memberOf R
 * @since v0.9.0
 * @category String
 * @sig String -> String
 * @param {String} str The string to upper case.
 * @return {String} The upper case version of `str`.
 * @see R.toLower
 * @example
 *
 *      R.toUpper('abc'); //=> 'ABC'
 */

var toUpper =
/*#__PURE__*/
es_invoker(0, 'toUpperCase');
/* harmony default export */ var es_toUpper = (toUpper);
// CONCATENATED MODULE: ./node_modules/ramda/es/transduce.js



/**
 * Initializes a transducer using supplied iterator function. Returns a single
 * item by iterating through the list, successively calling the transformed
 * iterator function and passing it an accumulator value and the current value
 * from the array, and then passing the result to the next call.
 *
 * The iterator function receives two values: *(acc, value)*. It will be
 * wrapped as a transformer to initialize the transducer. A transformer can be
 * passed directly in place of an iterator function. In both cases, iteration
 * may be stopped early with the [`R.reduced`](#reduced) function.
 *
 * A transducer is a function that accepts a transformer and returns a
 * transformer and can be composed directly.
 *
 * A transformer is an an object that provides a 2-arity reducing iterator
 * function, step, 0-arity initial value function, init, and 1-arity result
 * extraction function, result. The step function is used as the iterator
 * function in reduce. The result function is used to convert the final
 * accumulator into the return type and in most cases is
 * [`R.identity`](#identity). The init function can be used to provide an
 * initial accumulator, but is ignored by transduce.
 *
 * The iteration is performed with [`R.reduce`](#reduce) after initializing the transducer.
 *
 * @func
 * @memberOf R
 * @since v0.12.0
 * @category List
 * @sig (c -> c) -> ((a, b) -> a) -> a -> [b] -> a
 * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
 *        current element from the array. Wrapped as transformer, if necessary, and used to
 *        initialize the transducer
 * @param {*} acc The initial accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @see R.reduce, R.reduced, R.into
 * @example
 *
 *      const numbers = [1, 2, 3, 4];
 *      const transducer = R.compose(R.map(R.add(1)), R.take(2));
 *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
 *
 *      const isOdd = (x) => x % 2 === 1;
 *      const firstOddTransducer = R.compose(R.filter(isOdd), R.take(1));
 *      R.transduce(firstOddTransducer, R.flip(R.append), [], R.range(0, 100)); //=> [1]
 */

var transduce_transduce =
/*#__PURE__*/
es_curryN(4, function transduce(xf, fn, acc, list) {
  return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
});
/* harmony default export */ var es_transduce = (transduce_transduce);
// CONCATENATED MODULE: ./node_modules/ramda/es/transpose.js

/**
 * Transposes the rows and columns of a 2D list.
 * When passed a list of `n` lists of length `x`,
 * returns a list of `x` lists of length `n`.
 *
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig [[a]] -> [[a]]
 * @param {Array} list A 2D list
 * @return {Array} A 2D list
 * @example
 *
 *      R.transpose([[1, 'a'], [2, 'b'], [3, 'c']]) //=> [[1, 2, 3], ['a', 'b', 'c']]
 *      R.transpose([[1, 2, 3], ['a', 'b', 'c']]) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
 *
 *      // If some of the rows are shorter than the following rows, their elements are skipped:
 *      R.transpose([[10, 11], [20], [], [30, 31, 32]]) //=> [[10, 20, 30], [11, 31], [32]]
 * @symb R.transpose([[a], [b], [c]]) = [a, b, c]
 * @symb R.transpose([[a, b], [c, d]]) = [[a, c], [b, d]]
 * @symb R.transpose([[a, b], [c]]) = [[a, c], [b]]
 */

var transpose =
/*#__PURE__*/
_curry1(function transpose(outerlist) {
  var i = 0;
  var result = [];

  while (i < outerlist.length) {
    var innerlist = outerlist[i];
    var j = 0;

    while (j < innerlist.length) {
      if (typeof result[j] === 'undefined') {
        result[j] = [];
      }

      result[j].push(innerlist[j]);
      j += 1;
    }

    i += 1;
  }

  return result;
});

/* harmony default export */ var es_transpose = (transpose);
// CONCATENATED MODULE: ./node_modules/ramda/es/traverse.js



/**
 * Maps an [Applicative](https://github.com/fantasyland/fantasy-land#applicative)-returning
 * function over a [Traversable](https://github.com/fantasyland/fantasy-land#traversable),
 * then uses [`sequence`](#sequence) to transform the resulting Traversable of Applicative
 * into an Applicative of Traversable.
 *
 * Dispatches to the `traverse` method of the third argument, if present.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
 * @param {Function} of
 * @param {Function} f
 * @param {*} traversable
 * @return {*}
 * @see R.sequence
 * @example
 *
 *      // Returns `Maybe.Nothing` if the given divisor is `0`
 *      const safeDiv = n => d => d === 0 ? Maybe.Nothing() : Maybe.Just(n / d)
 *
 *      R.traverse(Maybe.of, safeDiv(10), [2, 4, 5]); //=> Maybe.Just([5, 2.5, 2])
 *      R.traverse(Maybe.of, safeDiv(10), [2, 0, 5]); //=> Maybe.Nothing
 */

var traverse_traverse =
/*#__PURE__*/
_curry3(function traverse(of, f, traversable) {
  return typeof traversable['fantasy-land/traverse'] === 'function' ? traversable['fantasy-land/traverse'](f, of) : es_sequence(of, es_map(f, traversable));
});

/* harmony default export */ var es_traverse = (traverse_traverse);
// CONCATENATED MODULE: ./node_modules/ramda/es/trim.js

var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
var zeroWidth = '\u200b';
var hasProtoTrim = typeof String.prototype.trim === 'function';
/**
 * Removes (strips) whitespace from both ends of the string.
 *
 * @func
 * @memberOf R
 * @since v0.6.0
 * @category String
 * @sig String -> String
 * @param {String} str The string to trim.
 * @return {String} Trimmed version of `str`.
 * @example
 *
 *      R.trim('   xyz  '); //=> 'xyz'
 *      R.map(R.trim, R.split(',', 'x, y, z')); //=> ['x', 'y', 'z']
 */

var trim = !hasProtoTrim ||
/*#__PURE__*/
ws.trim() || !
/*#__PURE__*/
zeroWidth.trim() ?
/*#__PURE__*/
_curry1(function trim(str) {
  var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
  var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
  return str.replace(beginRx, '').replace(endRx, '');
}) :
/*#__PURE__*/
_curry1(function trim(str) {
  return str.trim();
});
/* harmony default export */ var es_trim = (trim);
// CONCATENATED MODULE: ./node_modules/ramda/es/tryCatch.js



/**
 * `tryCatch` takes two functions, a `tryer` and a `catcher`. The returned
 * function evaluates the `tryer`; if it does not throw, it simply returns the
 * result. If the `tryer` *does* throw, the returned function evaluates the
 * `catcher` function and returns its result. Note that for effective
 * composition with this function, both the `tryer` and `catcher` functions
 * must return the same type of results.
 *
 * @func
 * @memberOf R
 * @since v0.20.0
 * @category Function
 * @sig (...x -> a) -> ((e, ...x) -> a) -> (...x -> a)
 * @param {Function} tryer The function that may throw.
 * @param {Function} catcher The function that will be evaluated if `tryer` throws.
 * @return {Function} A new function that will catch exceptions and send then to the catcher.
 * @example
 *
 *      R.tryCatch(R.prop('x'), R.F)({x: true}); //=> true
 *      R.tryCatch(() => { throw 'foo'}, R.always('catched'))('bar') // => 'catched'
 *      R.tryCatch(R.times(R.identity), R.always([]))('s') // => []
 *      R.tryCatch(() => { throw 'this is not a valid value'}, (err, value)=>({error : err,  value }))('bar') // => {'error': 'this is not a valid value', 'value': 'bar'}
 */

var tryCatch =
/*#__PURE__*/
_curry2(function _tryCatch(tryer, catcher) {
  return _arity(tryer.length, function () {
    try {
      return tryer.apply(this, arguments);
    } catch (e) {
      return catcher.apply(this, _concat([e], arguments));
    }
  });
});

/* harmony default export */ var es_tryCatch = (tryCatch);
// CONCATENATED MODULE: ./node_modules/ramda/es/unapply.js

/**
 * Takes a function `fn`, which takes a single array argument, and returns a
 * function which:
 *
 *   - takes any number of positional arguments;
 *   - passes these arguments to `fn` as an array; and
 *   - returns the result.
 *
 * In other words, `R.unapply` derives a variadic function from a function which
 * takes an array. `R.unapply` is the inverse of [`R.apply`](#apply).
 *
 * @func
 * @memberOf R
 * @since v0.8.0
 * @category Function
 * @sig ([*...] -> a) -> (*... -> a)
 * @param {Function} fn
 * @return {Function}
 * @see R.apply
 * @example
 *
 *      R.unapply(JSON.stringify)(1, 2, 3); //=> '[1,2,3]'
 * @symb R.unapply(f)(a, b) = f([a, b])
 */

var unapply =
/*#__PURE__*/
_curry1(function unapply(fn) {
  return function () {
    return fn(Array.prototype.slice.call(arguments, 0));
  };
});

/* harmony default export */ var es_unapply = (unapply);
// CONCATENATED MODULE: ./node_modules/ramda/es/unary.js


/**
 * Wraps a function of any arity (including nullary) in a function that accepts
 * exactly 1 parameter. Any extraneous parameters will not be passed to the
 * supplied function.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category Function
 * @sig (* -> b) -> (a -> b)
 * @param {Function} fn The function to wrap.
 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
 *         arity 1.
 * @see R.binary, R.nAry
 * @example
 *
 *      const takesTwoArgs = function(a, b) {
 *        return [a, b];
 *      };
 *      takesTwoArgs.length; //=> 2
 *      takesTwoArgs(1, 2); //=> [1, 2]
 *
 *      const takesOneArg = R.unary(takesTwoArgs);
 *      takesOneArg.length; //=> 1
 *      // Only 1 argument is passed to the wrapped function
 *      takesOneArg(1, 2); //=> [1, undefined]
 * @symb R.unary(f)(a, b, c) = f(a)
 */

var unary_unary =
/*#__PURE__*/
_curry1(function unary(fn) {
  return es_nAry(1, fn);
});

/* harmony default export */ var es_unary = (unary_unary);
// CONCATENATED MODULE: ./node_modules/ramda/es/uncurryN.js


/**
 * Returns a function of arity `n` from a (manually) curried function.
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Function
 * @sig Number -> (a -> b) -> (a -> c)
 * @param {Number} length The arity for the returned function.
 * @param {Function} fn The function to uncurry.
 * @return {Function} A new function.
 * @see R.curry
 * @example
 *
 *      const addFour = a => b => c => d => a + b + c + d;
 *
 *      const uncurriedAddFour = R.uncurryN(4, addFour);
 *      uncurriedAddFour(1, 2, 3, 4); //=> 10
 */

var uncurryN_uncurryN =
/*#__PURE__*/
_curry2(function uncurryN(depth, fn) {
  return es_curryN(depth, function () {
    var currentDepth = 1;
    var value = fn;
    var idx = 0;
    var endIdx;

    while (currentDepth <= depth && typeof value === 'function') {
      endIdx = currentDepth === depth ? arguments.length : idx + value.length;
      value = value.apply(this, Array.prototype.slice.call(arguments, idx, endIdx));
      currentDepth += 1;
      idx = endIdx;
    }

    return value;
  });
});

/* harmony default export */ var es_uncurryN = (uncurryN_uncurryN);
// CONCATENATED MODULE: ./node_modules/ramda/es/unfold.js

/**
 * Builds a list from a seed value. Accepts an iterator function, which returns
 * either false to stop iteration or an array of length 2 containing the value
 * to add to the resulting list and the seed to be used in the next call to the
 * iterator function.
 *
 * The iterator function receives one argument: *(seed)*.
 *
 * @func
 * @memberOf R
 * @since v0.10.0
 * @category List
 * @sig (a -> [b]) -> * -> [b]
 * @param {Function} fn The iterator function. receives one argument, `seed`, and returns
 *        either false to quit iteration or an array of length two to proceed. The element
 *        at index 0 of this array will be added to the resulting array, and the element
 *        at index 1 will be passed to the next call to `fn`.
 * @param {*} seed The seed value.
 * @return {Array} The final list.
 * @example
 *
 *      const f = n => n > 50 ? false : [-n, n + 10];
 *      R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]
 * @symb R.unfold(f, x) = [f(x)[0], f(f(x)[1])[0], f(f(f(x)[1])[1])[0], ...]
 */

var unfold =
/*#__PURE__*/
_curry2(function unfold(fn, seed) {
  var pair = fn(seed);
  var result = [];

  while (pair && pair.length) {
    result[result.length] = pair[0];
    pair = fn(pair[1]);
  }

  return result;
});

/* harmony default export */ var es_unfold = (unfold);
// CONCATENATED MODULE: ./node_modules/ramda/es/union.js




/**
 * Combines two lists into a set (i.e. no duplicates) composed of the elements
 * of each list.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig [*] -> [*] -> [*]
 * @param {Array} as The first list.
 * @param {Array} bs The second list.
 * @return {Array} The first and second lists concatenated, with
 *         duplicates removed.
 * @example
 *
 *      R.union([1, 2, 3], [2, 3, 4]); //=> [1, 2, 3, 4]
 */

var union =
/*#__PURE__*/
_curry2(
/*#__PURE__*/
compose(es_uniq, _concat));

/* harmony default export */ var es_union = (union);
// CONCATENATED MODULE: ./node_modules/ramda/es/uniqWith.js


/**
 * Returns a new list containing only one copy of each element in the original
 * list, based upon the value returned by applying the supplied predicate to
 * two list elements. Prefers the first item if two items compare equal based
 * on the predicate.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category List
 * @sig ((a, a) -> Boolean) -> [a] -> [a]
 * @param {Function} pred A predicate used to test whether two items are equal.
 * @param {Array} list The array to consider.
 * @return {Array} The list of unique items.
 * @example
 *
 *      const strEq = R.eqBy(String);
 *      R.uniqWith(strEq)([1, '1', 2, 1]); //=> [1, 2]
 *      R.uniqWith(strEq)([{}, {}]);       //=> [{}]
 *      R.uniqWith(strEq)([1, '1', 1]);    //=> [1]
 *      R.uniqWith(strEq)(['1', 1, 1]);    //=> ['1']
 */

var uniqWith_uniqWith =
/*#__PURE__*/
_curry2(function uniqWith(pred, list) {
  var idx = 0;
  var len = list.length;
  var result = [];
  var item;

  while (idx < len) {
    item = list[idx];

    if (!_includesWith(pred, item, result)) {
      result[result.length] = item;
    }

    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_uniqWith = (uniqWith_uniqWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/unionWith.js



/**
 * Combines two lists into a set (i.e. no duplicates) composed of the elements
 * of each list. Duplication is determined according to the value returned by
 * applying the supplied predicate to two list elements.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category Relation
 * @sig ((a, a) -> Boolean) -> [*] -> [*] -> [*]
 * @param {Function} pred A predicate used to test whether two items are equal.
 * @param {Array} list1 The first list.
 * @param {Array} list2 The second list.
 * @return {Array} The first and second lists concatenated, with
 *         duplicates removed.
 * @see R.union
 * @example
 *
 *      const l1 = [{a: 1}, {a: 2}];
 *      const l2 = [{a: 1}, {a: 4}];
 *      R.unionWith(R.eqBy(R.prop('a')), l1, l2); //=> [{a: 1}, {a: 2}, {a: 4}]
 */

var unionWith_unionWith =
/*#__PURE__*/
_curry3(function unionWith(pred, list1, list2) {
  return es_uniqWith(pred, _concat(list1, list2));
});

/* harmony default export */ var es_unionWith = (unionWith_unionWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/unless.js

/**
 * Tests the final argument by passing it to the given predicate function. If
 * the predicate is not satisfied, the function will return the result of
 * calling the `whenFalseFn` function with the same argument. If the predicate
 * is satisfied, the argument is returned as is.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category Logic
 * @sig (a -> Boolean) -> (a -> a) -> a -> a
 * @param {Function} pred        A predicate function
 * @param {Function} whenFalseFn A function to invoke when the `pred` evaluates
 *                               to a falsy value.
 * @param {*}        x           An object to test with the `pred` function and
 *                               pass to `whenFalseFn` if necessary.
 * @return {*} Either `x` or the result of applying `x` to `whenFalseFn`.
 * @see R.ifElse, R.when, R.cond
 * @example
 *
 *      let safeInc = R.unless(R.isNil, R.inc);
 *      safeInc(null); //=> null
 *      safeInc(1); //=> 2
 */

var unless =
/*#__PURE__*/
_curry3(function unless(pred, whenFalseFn, x) {
  return pred(x) ? x : whenFalseFn(x);
});

/* harmony default export */ var es_unless = (unless);
// CONCATENATED MODULE: ./node_modules/ramda/es/unnest.js


/**
 * Shorthand for `R.chain(R.identity)`, which removes one level of nesting from
 * any [Chain](https://github.com/fantasyland/fantasy-land#chain).
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category List
 * @sig Chain c => c (c a) -> c a
 * @param {*} list
 * @return {*}
 * @see R.flatten, R.chain
 * @example
 *
 *      R.unnest([1, [2], [[3]]]); //=> [1, 2, [3]]
 *      R.unnest([[1, 2], [3, 4], [5, 6]]); //=> [1, 2, 3, 4, 5, 6]
 */

var unnest =
/*#__PURE__*/
es_chain(_identity);
/* harmony default export */ var es_unnest = (unnest);
// CONCATENATED MODULE: ./node_modules/ramda/es/until.js

/**
 * Takes a predicate, a transformation function, and an initial value,
 * and returns a value of the same type as the initial value.
 * It does so by applying the transformation until the predicate is satisfied,
 * at which point it returns the satisfactory value.
 *
 * @func
 * @memberOf R
 * @since v0.20.0
 * @category Logic
 * @sig (a -> Boolean) -> (a -> a) -> a -> a
 * @param {Function} pred A predicate function
 * @param {Function} fn The iterator function
 * @param {*} init Initial value
 * @return {*} Final value that satisfies predicate
 * @example
 *
 *      R.until(R.gt(R.__, 100), R.multiply(2))(1) // => 128
 */

var until =
/*#__PURE__*/
_curry3(function until(pred, fn, init) {
  var val = init;

  while (!pred(val)) {
    val = fn(val);
  }

  return val;
});

/* harmony default export */ var es_until = (until);
// CONCATENATED MODULE: ./node_modules/ramda/es/valuesIn.js

/**
 * Returns a list of all the properties, including prototype properties, of the
 * supplied object.
 * Note that the order of the output array is not guaranteed to be consistent
 * across different JS platforms.
 *
 * @func
 * @memberOf R
 * @since v0.2.0
 * @category Object
 * @sig {k: v} -> [v]
 * @param {Object} obj The object to extract values from
 * @return {Array} An array of the values of the object's own and prototype properties.
 * @see R.values, R.keysIn
 * @example
 *
 *      const F = function() { this.x = 'X'; };
 *      F.prototype.y = 'Y';
 *      const f = new F();
 *      R.valuesIn(f); //=> ['X', 'Y']
 */

var valuesIn =
/*#__PURE__*/
_curry1(function valuesIn(obj) {
  var prop;
  var vs = [];

  for (prop in obj) {
    vs[vs.length] = obj[prop];
  }

  return vs;
});

/* harmony default export */ var es_valuesIn = (valuesIn);
// CONCATENATED MODULE: ./node_modules/ramda/es/view.js
 // `Const` is a functor that effectively ignores the function given to `map`.

var Const = function (x) {
  return {
    value: x,
    'fantasy-land/map': function () {
      return this;
    }
  };
};
/**
 * Returns a "view" of the given data structure, determined by the given lens.
 * The lens's focus determines which portion of the data structure is visible.
 *
 * @func
 * @memberOf R
 * @since v0.16.0
 * @category Object
 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
 * @sig Lens s a -> s -> a
 * @param {Lens} lens
 * @param {*} x
 * @return {*}
 * @see R.prop, R.lensIndex, R.lensProp
 * @example
 *
 *      const xLens = R.lensProp('x');
 *
 *      R.view(xLens, {x: 1, y: 2});  //=> 1
 *      R.view(xLens, {x: 4, y: 2});  //=> 4
 */


var view =
/*#__PURE__*/
_curry2(function view(lens, x) {
  // Using `Const` effectively ignores the setter function of the `lens`,
  // leaving the value returned by the getter function unmodified.
  return lens(Const)(x).value;
});

/* harmony default export */ var es_view = (view);
// CONCATENATED MODULE: ./node_modules/ramda/es/when.js

/**
 * Tests the final argument by passing it to the given predicate function. If
 * the predicate is satisfied, the function will return the result of calling
 * the `whenTrueFn` function with the same argument. If the predicate is not
 * satisfied, the argument is returned as is.
 *
 * @func
 * @memberOf R
 * @since v0.18.0
 * @category Logic
 * @sig (a -> Boolean) -> (a -> a) -> a -> a
 * @param {Function} pred       A predicate function
 * @param {Function} whenTrueFn A function to invoke when the `condition`
 *                              evaluates to a truthy value.
 * @param {*}        x          An object to test with the `pred` function and
 *                              pass to `whenTrueFn` if necessary.
 * @return {*} Either `x` or the result of applying `x` to `whenTrueFn`.
 * @see R.ifElse, R.unless, R.cond
 * @example
 *
 *      // truncate :: String -> String
 *      const truncate = R.when(
 *        R.propSatisfies(R.gt(R.__, 10), 'length'),
 *        R.pipe(R.take(10), R.append('…'), R.join(''))
 *      );
 *      truncate('12345');         //=> '12345'
 *      truncate('0123456789ABC'); //=> '0123456789…'
 */

var when =
/*#__PURE__*/
_curry3(function when(pred, whenTrueFn, x) {
  return pred(x) ? whenTrueFn(x) : x;
});

/* harmony default export */ var es_when = (when);
// CONCATENATED MODULE: ./node_modules/ramda/es/where.js


/**
 * Takes a spec object and a test object; returns true if the test satisfies
 * the spec. Each of the spec's own properties must be a predicate function.
 * Each predicate is applied to the value of the corresponding property of the
 * test object. `where` returns true if all the predicates return true, false
 * otherwise.
 *
 * `where` is well suited to declaratively expressing constraints for other
 * functions such as [`filter`](#filter) and [`find`](#find).
 *
 * @func
 * @memberOf R
 * @since v0.1.1
 * @category Object
 * @sig {String: (* -> Boolean)} -> {String: *} -> Boolean
 * @param {Object} spec
 * @param {Object} testObj
 * @return {Boolean}
 * @see R.propSatisfies, R.whereEq
 * @example
 *
 *      // pred :: Object -> Boolean
 *      const pred = R.where({
 *        a: R.equals('foo'),
 *        b: R.complement(R.equals('bar')),
 *        x: R.gt(R.__, 10),
 *        y: R.lt(R.__, 20)
 *      });
 *
 *      pred({a: 'foo', b: 'xxx', x: 11, y: 19}); //=> true
 *      pred({a: 'xxx', b: 'xxx', x: 11, y: 19}); //=> false
 *      pred({a: 'foo', b: 'bar', x: 11, y: 19}); //=> false
 *      pred({a: 'foo', b: 'xxx', x: 10, y: 19}); //=> false
 *      pred({a: 'foo', b: 'xxx', x: 11, y: 20}); //=> false
 */

var where_where =
/*#__PURE__*/
_curry2(function where(spec, testObj) {
  for (var prop in spec) {
    if (_has(prop, spec) && !spec[prop](testObj[prop])) {
      return false;
    }
  }

  return true;
});

/* harmony default export */ var es_where = (where_where);
// CONCATENATED MODULE: ./node_modules/ramda/es/whereEq.js




/**
 * Takes a spec object and a test object; returns true if the test satisfies
 * the spec, false otherwise. An object satisfies the spec if, for each of the
 * spec's own properties, accessing that property of the object gives the same
 * value (in [`R.equals`](#equals) terms) as accessing that property of the
 * spec.
 *
 * `whereEq` is a specialization of [`where`](#where).
 *
 * @func
 * @memberOf R
 * @since v0.14.0
 * @category Object
 * @sig {String: *} -> {String: *} -> Boolean
 * @param {Object} spec
 * @param {Object} testObj
 * @return {Boolean}
 * @see R.propEq, R.where
 * @example
 *
 *      // pred :: Object -> Boolean
 *      const pred = R.whereEq({a: 1, b: 2});
 *
 *      pred({a: 1});              //=> false
 *      pred({a: 1, b: 2});        //=> true
 *      pred({a: 1, b: 2, c: 3});  //=> true
 *      pred({a: 1, b: 1});        //=> false
 */

var whereEq_whereEq =
/*#__PURE__*/
_curry2(function whereEq(spec, testObj) {
  return es_where(es_map(es_equals, spec), testObj);
});

/* harmony default export */ var es_whereEq = (whereEq_whereEq);
// CONCATENATED MODULE: ./node_modules/ramda/es/without.js




/**
 * Returns a new list without values in the first argument.
 * [`R.equals`](#equals) is used to determine equality.
 *
 * Acts as a transducer if a transformer is given in list position.
 *
 * @func
 * @memberOf R
 * @since v0.19.0
 * @category List
 * @sig [a] -> [a] -> [a]
 * @param {Array} list1 The values to be removed from `list2`.
 * @param {Array} list2 The array to remove values from.
 * @return {Array} The new array without values in `list1`.
 * @see R.transduce, R.difference, R.remove
 * @example
 *
 *      R.without([1, 2], [1, 2, 1, 3, 4]); //=> [3, 4]
 */

var without =
/*#__PURE__*/
_curry2(function (xs, list) {
  return es_reject(es_flip(_includes)(xs), list);
});

/* harmony default export */ var es_without = (without);
// CONCATENATED MODULE: ./node_modules/ramda/es/xor.js

/**
 * Exclusive disjunction logical operation.
 * Returns `true` if one of the arguments is truthy and the other is falsy.
 * Otherwise, it returns `false`.
 *
 * @func
 * @memberOf R
 * @since v0.27.1
 * @category Logic
 * @sig a -> b -> Boolean
 * @param {Any} a
 * @param {Any} b
 * @return {Boolean} true if one of the arguments is truthy and the other is falsy
 * @see R.or, R.and
 * @example
 *
 *      R.xor(true, true); //=> false
 *      R.xor(true, false); //=> true
 *      R.xor(false, true); //=> true
 *      R.xor(false, false); //=> false
 */

var xor =
/*#__PURE__*/
_curry2(function xor(a, b) {
  return Boolean(!a ^ !b);
});

/* harmony default export */ var es_xor = (xor);
// CONCATENATED MODULE: ./node_modules/ramda/es/xprod.js

/**
 * Creates a new list out of the two supplied by creating each possible pair
 * from the lists.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [b] -> [[a,b]]
 * @param {Array} as The first list.
 * @param {Array} bs The second list.
 * @return {Array} The list made by combining each possible pair from
 *         `as` and `bs` into pairs (`[a, b]`).
 * @example
 *
 *      R.xprod([1, 2], ['a', 'b']); //=> [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 * @symb R.xprod([a, b], [c, d]) = [[a, c], [a, d], [b, c], [b, d]]
 */

var xprod =
/*#__PURE__*/
_curry2(function xprod(a, b) {
  // = xprodWith(prepend); (takes about 3 times as long...)
  var idx = 0;
  var ilen = a.length;
  var j;
  var jlen = b.length;
  var result = [];

  while (idx < ilen) {
    j = 0;

    while (j < jlen) {
      result[result.length] = [a[idx], b[j]];
      j += 1;
    }

    idx += 1;
  }

  return result;
});

/* harmony default export */ var es_xprod = (xprod);
// CONCATENATED MODULE: ./node_modules/ramda/es/zip.js

/**
 * Creates a new list out of the two supplied by pairing up equally-positioned
 * items from both lists. The returned list is truncated to the length of the
 * shorter of the two input lists.
 * Note: `zip` is equivalent to `zipWith(function(a, b) { return [a, b] })`.
 *
 * @func
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig [a] -> [b] -> [[a,b]]
 * @param {Array} list1 The first array to consider.
 * @param {Array} list2 The second array to consider.
 * @return {Array} The list made by pairing up same-indexed elements of `list1` and `list2`.
 * @example
 *
 *      R.zip([1, 2, 3], ['a', 'b', 'c']); //=> [[1, 'a'], [2, 'b'], [3, 'c']]
 * @symb R.zip([a, b, c], [d, e, f]) = [[a, d], [b, e], [c, f]]
 */

var zip =
/*#__PURE__*/
_curry2(function zip(a, b) {
  var rv = [];
  var idx = 0;
  var len = Math.min(a.length, b.length);

  while (idx < len) {
    rv[idx] = [a[idx], b[idx]];
    idx += 1;
  }

  return rv;
});

/* harmony default export */ var es_zip = (zip);
// CONCATENATED MODULE: ./node_modules/ramda/es/zipObj.js

/**
 * Creates a new object out of a list of keys and a list of values.
 * Key/value pairing is truncated to the length of the shorter of the two lists.
 * Note: `zipObj` is equivalent to `pipe(zip, fromPairs)`.
 *
 * @func
 * @memberOf R
 * @since v0.3.0
 * @category List
 * @sig [String] -> [*] -> {String: *}
 * @param {Array} keys The array that will be properties on the output object.
 * @param {Array} values The list of values on the output object.
 * @return {Object} The object made by pairing up same-indexed elements of `keys` and `values`.
 * @example
 *
 *      R.zipObj(['a', 'b', 'c'], [1, 2, 3]); //=> {a: 1, b: 2, c: 3}
 */

var zipObj =
/*#__PURE__*/
_curry2(function zipObj(keys, values) {
  var idx = 0;
  var len = Math.min(keys.length, values.length);
  var out = {};

  while (idx < len) {
    out[keys[idx]] = values[idx];
    idx += 1;
  }

  return out;
});

/* harmony default export */ var es_zipObj = (zipObj);
// CONCATENATED MODULE: ./node_modules/ramda/es/zipWith.js

/**
 * Creates a new list out of the two supplied by applying the function to each
 * equally-positioned pair in the lists. The returned list is truncated to the
 * length of the shorter of the two input lists.
 *
 * @function
 * @memberOf R
 * @since v0.1.0
 * @category List
 * @sig ((a, b) -> c) -> [a] -> [b] -> [c]
 * @param {Function} fn The function used to combine the two elements into one value.
 * @param {Array} list1 The first array to consider.
 * @param {Array} list2 The second array to consider.
 * @return {Array} The list made by combining same-indexed elements of `list1` and `list2`
 *         using `fn`.
 * @example
 *
 *      const f = (x, y) => {
 *        // ...
 *      };
 *      R.zipWith(f, [1, 2, 3], ['a', 'b', 'c']);
 *      //=> [f(1, 'a'), f(2, 'b'), f(3, 'c')]
 * @symb R.zipWith(fn, [a, b, c], [d, e, f]) = [fn(a, d), fn(b, e), fn(c, f)]
 */

var zipWith =
/*#__PURE__*/
_curry3(function zipWith(fn, a, b) {
  var rv = [];
  var idx = 0;
  var len = Math.min(a.length, b.length);

  while (idx < len) {
    rv[idx] = fn(a[idx], b[idx]);
    idx += 1;
  }

  return rv;
});

/* harmony default export */ var es_zipWith = (zipWith);
// CONCATENATED MODULE: ./node_modules/ramda/es/thunkify.js


/**
 * Creates a thunk out of a function. A thunk delays a calculation until
 * its result is needed, providing lazy evaluation of arguments.
 *
 * @func
 * @memberOf R
 * @since v0.26.0
 * @category Function
 * @sig ((a, b, ..., j) -> k) -> (a, b, ..., j) -> (() -> k)
 * @param {Function} fn A function to wrap in a thunk
 * @return {Function} Expects arguments for `fn` and returns a new function
 *  that, when called, applies those arguments to `fn`.
 * @see R.partial, R.partialRight
 * @example
 *
 *      R.thunkify(R.identity)(42)(); //=> 42
 *      R.thunkify((a, b) => a + b)(25, 17)(); //=> 42
 */

var thunkify_thunkify =
/*#__PURE__*/
_curry1(function thunkify(fn) {
  return es_curryN(fn.length, function createThunk() {
    var fnArgs = arguments;
    return function invokeThunk() {
      return fn.apply(this, fnArgs);
    };
  });
});

/* harmony default export */ var es_thunkify = (thunkify_thunkify);
// CONCATENATED MODULE: ./node_modules/ramda/es/index.js


































































































































































































































































/***/ }),
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

/***/ }),
/* 69 */,
/* 70 */
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
/* 71 */
/***/ (function(module, exports) {

function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;

/***/ }),
/* 72 */,
/* 73 */,
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(251);

var assertThisInitialized = __webpack_require__(191);

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

var setPrototypeOf = __webpack_require__(311);

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
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = __webpack_require__(30);

$export($export.S, 'Date', { now: function () { return new Date().getTime(); } });


/***/ }),
/* 77 */,
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(49);
var hide = __webpack_require__(87);
var has = __webpack_require__(85);
var SRC = __webpack_require__(103)('src');
var $toString = __webpack_require__(300);
var TO_STRING = 'toString';
var TPL = ('' + $toString).split(TO_STRING);

__webpack_require__(86).inspectSource = function (it) {
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
/* 79 */
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
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ensureExist;

__webpack_require__(21);

function ensureExist(module, moduleName) {
  if (!module) {
    throw new Error("'".concat(moduleName, "' is a required dependency for '").concat(this.constructor.name, "'"));
  }

  return module;
}
//# sourceMappingURL=ensureExist.js.map


/***/ }),
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),
/* 86 */
/***/ (function(module, exports) {

var core = module.exports = { version: '2.6.9' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(60);
var createDesc = __webpack_require__(102);
module.exports = __webpack_require__(57) ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(151);
var defined = __webpack_require__(111);
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),
/* 89 */,
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(126);
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(111);
module.exports = function (it) {
  return Object(defined(it));
};


/***/ }),
/* 92 */,
/* 93 */,
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

var defineProperty = __webpack_require__(384);

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? Object(arguments[i]) : {};
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
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(144);
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
/* 100 */,
/* 101 */,
/* 102 */
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
/* 103 */
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = __webpack_require__(201);
var enumBugKeys = __webpack_require__(157);

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};


/***/ }),
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),
/* 111 */
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

var pIE = __webpack_require__(145);
var createDesc = __webpack_require__(102);
var toIObject = __webpack_require__(88);
var toPrimitive = __webpack_require__(117);
var has = __webpack_require__(85);
var IE8_DOM_DEFINE = __webpack_require__(200);
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = __webpack_require__(57) ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__(55);

module.exports = function (method, arg) {
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call
    arg ? method.call(null, function () { /* empty */ }, 1) : method.call(null);
  });
};


/***/ }),
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(58);
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
/* 118 */
/***/ (function(module, exports) {

module.exports = false;


/***/ }),
/* 119 */
/***/ (function(module, exports) {

module.exports = {};


/***/ }),
/* 120 */,
/* 121 */,
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = __webpack_require__(201);
var hiddenKeys = __webpack_require__(157).concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};


/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = __webpack_require__(99);
var IObject = __webpack_require__(151);
var toObject = __webpack_require__(91);
var toLength = __webpack_require__(90);
var asc = __webpack_require__(306);
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
/* 129 */,
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(60).f;
var has = __webpack_require__(85);
var TAG = __webpack_require__(51)('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = __webpack_require__(56);
var dPs = __webpack_require__(203);
var enumBugKeys = __webpack_require__(157);
var IE_PROTO = __webpack_require__(156)('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(186)('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(238).appendChild(iframe);
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
/* 132 */,
/* 133 */,
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

var core = __webpack_require__(86);
var global = __webpack_require__(49);
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: __webpack_require__(118) ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});


/***/ }),
/* 135 */,
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strong = __webpack_require__(344);
var validate = __webpack_require__(178);
var MAP = 'Map';

// 23.1 Map Objects
module.exports = __webpack_require__(265)(MAP, function (get) {
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
/* 137 */,
/* 138 */,
/* 139 */,
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

var META = __webpack_require__(103)('meta');
var isObject = __webpack_require__(58);
var has = __webpack_require__(85);
var setDesc = __webpack_require__(60).f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !__webpack_require__(55)(function () {
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
/* 141 */,
/* 142 */,
/* 143 */,
/* 144 */
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),
/* 145 */
/***/ (function(module, exports) {

exports.f = {}.propertyIsEnumerable;


/***/ }),
/* 146 */,
/* 147 */
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



var punycode = __webpack_require__(247);
var util = __webpack_require__(248);

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
    querystring = __webpack_require__(205);

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
/* 148 */,
/* 149 */
/***/ (function(module, exports, __webpack_require__) {

var superPropBase = __webpack_require__(406);

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
/* 150 */,
/* 151 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(110);
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),
/* 152 */
/***/ (function(module, exports) {

exports.f = Object.getOwnPropertySymbols;


/***/ }),
/* 153 */
/***/ (function(module, exports, __webpack_require__) {

// most Object methods by ES6 should accept primitives
var $export = __webpack_require__(30);
var core = __webpack_require__(86);
var fails = __webpack_require__(55);
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};


/***/ }),
/* 154 */,
/* 155 */,
/* 156 */
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(134)('keys');
var uid = __webpack_require__(103);
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};


/***/ }),
/* 157 */
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');


/***/ }),
/* 158 */,
/* 159 */,
/* 160 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = debounce;

/**
 * ## @deprecated
 * ## Please using ringcentral-js-widgets/ringcentral-integration/lib/debounce-throttle/debounce.ts
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
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
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */
/***/ (function(module, exports, __webpack_require__) {

// 7.2.2 IsArray(argument)
var cof = __webpack_require__(110);
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};


/***/ }),
/* 165 */
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(110);
var TAG = __webpack_require__(51)('toStringTag');
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
/* 166 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(49);
var has = __webpack_require__(85);
var cof = __webpack_require__(110);
var inheritIfRequired = __webpack_require__(239);
var toPrimitive = __webpack_require__(117);
var fails = __webpack_require__(55);
var gOPN = __webpack_require__(127).f;
var gOPD = __webpack_require__(112).f;
var dP = __webpack_require__(60).f;
var $trim = __webpack_require__(261).trim;
var NUMBER = 'Number';
var $Number = global[NUMBER];
var Base = $Number;
var proto = $Number.prototype;
// Opera ~12 has broken Object#toString
var BROKEN_COF = cof(__webpack_require__(131)(proto)) == NUMBER;
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
  for (var keys = __webpack_require__(57) ? gOPN(Base) : (
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
  __webpack_require__(78)(global, NUMBER, $Number);
}


/***/ }),
/* 167 */
/***/ (function(module, exports, __webpack_require__) {

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = __webpack_require__(51)('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) __webpack_require__(87)(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};


/***/ }),
/* 168 */
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
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(126);
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),
/* 175 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = __webpack_require__(85);
var toObject = __webpack_require__(91);
var IE_PROTO = __webpack_require__(156)('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};


/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(118);
var $export = __webpack_require__(30);
var redefine = __webpack_require__(78);
var hide = __webpack_require__(87);
var Iterators = __webpack_require__(119);
var $iterCreate = __webpack_require__(262);
var setToStringTag = __webpack_require__(130);
var getPrototypeOf = __webpack_require__(175);
var ITERATOR = __webpack_require__(51)('iterator');
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
/* 177 */,
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(58);
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};


/***/ }),
/* 179 */,
/* 180 */,
/* 181 */,
/* 182 */,
/* 183 */,
/* 184 */,
/* 185 */,
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(58);
var document = __webpack_require__(49).document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

exports.f = __webpack_require__(51);


/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 21.2.5.3 get RegExp.prototype.flags
var anObject = __webpack_require__(56);
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
/* 189 */
/***/ (function(module, exports) {

module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};


/***/ }),
/* 190 */
/***/ (function(module, exports, __webpack_require__) {

var redefine = __webpack_require__(78);
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};


/***/ }),
/* 191 */
/***/ (function(module, exports) {

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;

/***/ }),
/* 192 */,
/* 193 */,
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithoutHoles = __webpack_require__(408);

var iterableToArray = __webpack_require__(409);

var unsupportedIterableToArray = __webpack_require__(360);

var nonIterableSpread = __webpack_require__(410);

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;

/***/ }),
/* 195 */,
/* 196 */,
/* 197 */,
/* 198 */,
/* 199 */,
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(57) && !__webpack_require__(55)(function () {
  return Object.defineProperty(__webpack_require__(186)('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

var has = __webpack_require__(85);
var toIObject = __webpack_require__(88);
var arrayIndexOf = __webpack_require__(202)(false);
var IE_PROTO = __webpack_require__(156)('IE_PROTO');

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
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(88);
var toLength = __webpack_require__(90);
var toAbsoluteIndex = __webpack_require__(174);
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
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(60);
var anObject = __webpack_require__(56);
var getKeys = __webpack_require__(104);

module.exports = __webpack_require__(57) ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};


/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $defineProperty = __webpack_require__(60);
var createDesc = __webpack_require__(102);

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};


/***/ }),
/* 205 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.decode = exports.parse = __webpack_require__(249);
exports.encode = exports.stringify = __webpack_require__(250);


/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
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
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

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

var compact = function compact(value) {
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

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};


/***/ }),
/* 207 */,
/* 208 */,
/* 209 */,
/* 210 */,
/* 211 */,
/* 212 */,
/* 213 */,
/* 214 */,
/* 215 */,
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.dndStatus = void 0;

var _ObjectMap = __webpack_require__(26);

var dndStatus = _ObjectMap.ObjectMap.fromObject({
  takeAllCalls: 'TakeAllCalls',
  doNotAcceptAnyCalls: 'DoNotAcceptAnyCalls',
  doNotAcceptDepartmentCalls: 'DoNotAcceptDepartmentCalls',
  takeDepartmentCallsOnly: 'TakeDepartmentCallsOnly'
});

exports.dndStatus = dndStatus;
var _default = dndStatus;
exports["default"] = _default;
//# sourceMappingURL=dndStatus.js.map


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(49);
var core = __webpack_require__(86);
var LIBRARY = __webpack_require__(118);
var wksExt = __webpack_require__(187);
var defineProperty = __webpack_require__(60).f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};


/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

// 20.1.2.4 Number.isNaN(number)
var $export = __webpack_require__(30);

$export($export.S, 'Number', {
  isNaN: function isNaN(number) {
    // eslint-disable-next-line no-self-compare
    return number != number;
  }
});


/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

var ITERATOR = __webpack_require__(51)('iterator');
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
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(49);
var dP = __webpack_require__(60);
var DESCRIPTORS = __webpack_require__(57);
var SPECIES = __webpack_require__(51)('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};


/***/ }),
/* 221 */
/***/ (function(module, exports) {

module.exports = function (done, value) {
  return { value: value, done: !!done };
};


/***/ }),
/* 222 */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(99);
var call = __webpack_require__(263);
var isArrayIter = __webpack_require__(241);
var anObject = __webpack_require__(56);
var toLength = __webpack_require__(90);
var getIterFn = __webpack_require__(242);
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
/* 223 */,
/* 224 */,
/* 225 */,
/* 226 */,
/* 227 */,
/* 228 */,
/* 229 */,
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = formatDuration;

__webpack_require__(166);

__webpack_require__(218);

var _padLeft = _interopRequireDefault(__webpack_require__(421));

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
/* 231 */,
/* 232 */,
/* 233 */,
/* 234 */,
/* 235 */,
/* 236 */,
/* 237 */,
/* 238 */
/***/ (function(module, exports, __webpack_require__) {

var document = __webpack_require__(49).document;
module.exports = document && document.documentElement;


/***/ }),
/* 239 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(58);
var setPrototypeOf = __webpack_require__(302).set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};


/***/ }),
/* 240 */,
/* 241 */
/***/ (function(module, exports, __webpack_require__) {

// check on default Array iterator
var Iterators = __webpack_require__(119);
var ITERATOR = __webpack_require__(51)('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};


/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

var classof = __webpack_require__(165);
var ITERATOR = __webpack_require__(51)('iterator');
var Iterators = __webpack_require__(119);
module.exports = __webpack_require__(86).getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),
/* 243 */,
/* 244 */,
/* 245 */,
/* 246 */,
/* 247 */
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

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(168)(module), __webpack_require__(70)))

/***/ }),
/* 248 */
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
/* 249 */
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
/* 250 */
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
/* 251 */
/***/ (function(module, exports) {

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;

/***/ }),
/* 252 */,
/* 253 */,
/* 254 */,
/* 255 */,
/* 256 */,
/* 257 */,
/* 258 */,
/* 259 */,
/* 260 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = __webpack_require__(88);
var gOPN = __webpack_require__(127).f;
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
/* 261 */
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__(30);
var defined = __webpack_require__(111);
var fails = __webpack_require__(55);
var spaces = __webpack_require__(303);
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
/* 262 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create = __webpack_require__(131);
var descriptor = __webpack_require__(102);
var setToStringTag = __webpack_require__(130);
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(87)(IteratorPrototype, __webpack_require__(51)('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};


/***/ }),
/* 263 */
/***/ (function(module, exports, __webpack_require__) {

// call something on iterator step with safe closing on error
var anObject = __webpack_require__(56);
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
/* 264 */,
/* 265 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(49);
var $export = __webpack_require__(30);
var redefine = __webpack_require__(78);
var redefineAll = __webpack_require__(190);
var meta = __webpack_require__(140);
var forOf = __webpack_require__(222);
var anInstance = __webpack_require__(189);
var isObject = __webpack_require__(58);
var fails = __webpack_require__(55);
var $iterDetect = __webpack_require__(219);
var setToStringTag = __webpack_require__(130);
var inheritIfRequired = __webpack_require__(239);

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
/* 266 */
/***/ (function(module, exports, __webpack_require__) {

// all object keys, includes non-enumerable and symbols
var gOPN = __webpack_require__(127);
var gOPS = __webpack_require__(152);
var anObject = __webpack_require__(56);
var Reflect = __webpack_require__(49).Reflect;
module.exports = Reflect && Reflect.ownKeys || function ownKeys(it) {
  var keys = gOPN.f(anObject(it));
  var getSymbols = gOPS.f;
  return getSymbols ? keys.concat(getSymbols(it)) : keys;
};


/***/ }),
/* 267 */,
/* 268 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var stringify = __webpack_require__(385);
var parse = __webpack_require__(386);
var formats = __webpack_require__(269);

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};


/***/ }),
/* 269 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var util = __webpack_require__(206);

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = util.assign(
    {
        'default': Format.RFC3986,
        formatters: {
            RFC1738: function (value) {
                return replace.call(value, percentTwenties, '+');
            },
            RFC3986: function (value) {
                return String(value);
            }
        }
    },
    Format
);


/***/ }),
/* 270 */,
/* 271 */,
/* 272 */,
/* 273 */,
/* 274 */,
/* 275 */,
/* 276 */,
/* 277 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.baseMessageTypes = void 0;

var _ObjectMap = __webpack_require__(26);

var baseMessageTypes = _ObjectMap.ObjectMap.fromKeys(['syncClosed', 'syncMinimized', 'syncSize', 'syncPosition', 'pushPresence', 'pushAdapterState', 'pushLocale', 'presenceClicked', 'presenceItemClicked', 'clickToDial', 'clickToSms', 'pushRingState', 'pushCalls', 'pushOnCurrentCallPath', 'pushOnAllCallsPath', 'navigateToCurrentCall', 'navigateToViewCalls']);

exports.baseMessageTypes = baseMessageTypes;
var _default = baseMessageTypes;
exports["default"] = _default;
//# sourceMappingURL=baseMessageTypes.js.map


/***/ }),
/* 278 */
/***/ (function(module, exports) {

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

module.exports = _arrayLikeToArray;

/***/ }),
/* 279 */
/***/ (function(module, exports) {

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

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
/* 280 */
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
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

module.exports = bytesToUuid;


/***/ }),
/* 281 */,
/* 282 */,
/* 283 */,
/* 284 */,
/* 285 */,
/* 286 */,
/* 287 */,
/* 288 */,
/* 289 */,
/* 290 */,
/* 291 */,
/* 292 */,
/* 293 */,
/* 294 */,
/* 295 */,
/* 296 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.presenceStatus = void 0;

var _ObjectMap = __webpack_require__(26);

var presenceStatus = _ObjectMap.ObjectMap.fromObject({
  offline: 'Offline',
  busy: 'Busy',
  available: 'Available'
});

exports.presenceStatus = presenceStatus;
//# sourceMappingURL=presenceStatus.enum.js.map


/***/ }),
/* 297 */,
/* 298 */,
/* 299 */,
/* 300 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(134)('native-function-to-string', Function.toString);


/***/ }),
/* 301 */
/***/ (function(module, exports, __webpack_require__) {

// all enumerable object keys, includes symbols
var getKeys = __webpack_require__(104);
var gOPS = __webpack_require__(152);
var pIE = __webpack_require__(145);
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
/* 302 */
/***/ (function(module, exports, __webpack_require__) {

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = __webpack_require__(58);
var anObject = __webpack_require__(56);
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = __webpack_require__(99)(Function.call, __webpack_require__(112).f(Object.prototype, '__proto__').set, 2);
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
/* 303 */
/***/ (function(module, exports) {

module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';


/***/ }),
/* 304 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(126);
var defined = __webpack_require__(111);
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
/* 305 */,
/* 306 */
/***/ (function(module, exports, __webpack_require__) {

// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = __webpack_require__(307);

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};


/***/ }),
/* 307 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(58);
var isArray = __webpack_require__(164);
var SPECIES = __webpack_require__(51)('species');

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
/* 308 */,
/* 309 */,
/* 310 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseCallbackUri;

var _objectSpread2 = _interopRequireDefault(__webpack_require__(94));

var _url = _interopRequireDefault(__webpack_require__(147));

var _qs = _interopRequireDefault(__webpack_require__(268));

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
/* 311 */
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
/* 312 */,
/* 313 */,
/* 314 */,
/* 315 */,
/* 316 */,
/* 317 */,
/* 318 */,
/* 319 */,
/* 320 */,
/* 321 */,
/* 322 */,
/* 323 */,
/* 324 */,
/* 325 */,
/* 326 */,
/* 327 */,
/* 328 */,
/* 329 */,
/* 330 */,
/* 331 */,
/* 332 */,
/* 333 */,
/* 334 */,
/* 335 */,
/* 336 */,
/* 337 */,
/* 338 */,
/* 339 */
/***/ (function(module, exports, __webpack_require__) {

var aFunction = __webpack_require__(144);
var toObject = __webpack_require__(91);
var IObject = __webpack_require__(151);
var toLength = __webpack_require__(90);

module.exports = function (that, callbackfn, aLen, memo, isRight) {
  aFunction(callbackfn);
  var O = toObject(that);
  var self = IObject(O);
  var length = toLength(O.length);
  var index = isRight ? length - 1 : 0;
  var i = isRight ? -1 : 1;
  if (aLen < 2) for (;;) {
    if (index in self) {
      memo = self[index];
      index += i;
      break;
    }
    index += i;
    if (isRight ? index < 0 : length <= index) {
      throw TypeError('Reduce of empty array with no initial value');
    }
  }
  for (;isRight ? index >= 0 : length > index; index += i) if (index in self) {
    memo = callbackfn(memo, self[index], index, O);
  }
  return memo;
};


/***/ }),
/* 340 */,
/* 341 */
/***/ (function(module, exports, __webpack_require__) {

// 21.2.5.3 get RegExp.prototype.flags()
if (__webpack_require__(57) && /./g.flags != 'g') __webpack_require__(60).f(RegExp.prototype, 'flags', {
  configurable: true,
  get: __webpack_require__(188)
});


/***/ }),
/* 342 */,
/* 343 */,
/* 344 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var dP = __webpack_require__(60).f;
var create = __webpack_require__(131);
var redefineAll = __webpack_require__(190);
var ctx = __webpack_require__(99);
var anInstance = __webpack_require__(189);
var forOf = __webpack_require__(222);
var $iterDefine = __webpack_require__(176);
var step = __webpack_require__(221);
var setSpecies = __webpack_require__(220);
var DESCRIPTORS = __webpack_require__(57);
var fastKey = __webpack_require__(140).fastKey;
var validate = __webpack_require__(178);
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
/* 345 */,
/* 346 */,
/* 347 */,
/* 348 */,
/* 349 */,
/* 350 */,
/* 351 */,
/* 352 */,
/* 353 */,
/* 354 */,
/* 355 */,
/* 356 */,
/* 357 */,
/* 358 */,
/* 359 */,
/* 360 */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(278);

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

module.exports = _unsupportedIterableToArray;

/***/ }),
/* 361 */
/***/ (function(module, exports, __webpack_require__) {

var v1 = __webpack_require__(412);
var v4 = __webpack_require__(413);

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;


/***/ }),
/* 362 */,
/* 363 */,
/* 364 */,
/* 365 */,
/* 366 */,
/* 367 */,
/* 368 */,
/* 369 */,
/* 370 */,
/* 371 */,
/* 372 */,
/* 373 */,
/* 374 */,
/* 375 */,
/* 376 */,
/* 377 */,
/* 378 */,
/* 379 */,
/* 380 */,
/* 381 */,
/* 382 */,
/* 383 */,
/* 384 */
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
/* 385 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(206);
var formats = __webpack_require__(269);
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var stringify = function stringify(
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
    encodeValuesOnly,
    charset
) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        }).join(',');
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key') : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key');
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value'))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        var value = obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
            : prefix + (allowDots ? '.' + key : '[' + key + ']');

        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter,
            encodeValuesOnly,
            charset
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.formatter,
            options.encodeValuesOnly,
            options.charset
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};


/***/ }),
/* 386 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(206);

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
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

        leaf = obj; // eslint-disable-line no-param-reassign
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
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

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};


/***/ }),
/* 387 */,
/* 388 */,
/* 389 */,
/* 390 */,
/* 391 */,
/* 392 */,
/* 393 */,
/* 394 */,
/* 395 */,
/* 396 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(52);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prefixString = prefixString;
exports.ObjectMap = void 0;

__webpack_require__(32);

__webpack_require__(34);

__webpack_require__(21);

__webpack_require__(10);

__webpack_require__(9);

__webpack_require__(42);

__webpack_require__(24);

__webpack_require__(25);

__webpack_require__(18);

__webpack_require__(11);

__webpack_require__(12);

__webpack_require__(1);

__webpack_require__(5);

__webpack_require__(6);

__webpack_require__(3);

__webpack_require__(14);

__webpack_require__(136);

__webpack_require__(8);

__webpack_require__(7);

var _ramda = __webpack_require__(63);

var _class, _temp;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var sDefinition = Symbol('definition');
var RUNTIME = {
  usingFactory: false,
  prefixCache: new Map()
};

function factory(prototype, property, descriptor) {
  var baseFunction = descriptor.value;
  return _objectSpread(_objectSpread({}, descriptor), {}, {
    value: function value() {
      RUNTIME.usingFactory = true;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var result = baseFunction.call.apply(baseFunction, [this].concat(args));
      RUNTIME.usingFactory = false;
      return result;
    }
  });
}

function prefixString(str) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return prefix === '' ? str : "".concat(prefix, "-").concat(str);
}

var ObjectMap = (_class = (_temp = /*#__PURE__*/function () {
  function ObjectMap(definition) {
    var _this = this;

    _classCallCheck(this, ObjectMap);

    this[sDefinition] = new Map();

    if (!RUNTIME.usingFactory) {
      throw TypeError('Instantiating ObjectMap with `new ObjectMap(definition)` is not recommended. ' + 'Please use one of the ObjectMap factory functions.');
    }

    if (definition) {
      var _loop = function _loop(_key2) {
        if (Object.prototype.hasOwnProperty.call(definition, _key2)) {
          _this[sDefinition].set(_key2, definition[_key2]);

          Object.defineProperty(_this, _key2, {
            get: function get() {
              return this[sDefinition].get(_key2);
            },
            enumerable: true
          });
        }
      };

      for (var _key2 in definition) {
        _loop(_key2);
      }
    }
  }

  _createClass(ObjectMap, null, [{
    key: "fromObject",
    value: function fromObject(definition) {
      return new ObjectMap(definition);
    }
  }, {
    key: "fromKeys",
    value: function fromKeys(keys) {
      var definition = {};

      var _iterator = _createForOfIteratorHelper(keys),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _key3 = _step.value;
          definition[_key3] = _key3;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return new ObjectMap(definition);
    }
  }, {
    key: "prefixKeys",
    value: function prefixKeys(keys) {
      var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var definition = {};

      var _iterator2 = _createForOfIteratorHelper(keys),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _key4 = _step2.value;
          definition[_key4] = prefixString(_key4, prefix);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return new ObjectMap(definition);
    }
  }, {
    key: "getKey",
    value: function getKey(instance, value) {
      var _ref = (0, _ramda.find)(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            v = _ref4[1];

        return v === value;
      }, _toConsumableArray(ObjectMap.entries(instance))) || [],
          _ref2 = _slicedToArray(_ref, 1),
          _ref2$ = _ref2[0],
          key = _ref2$ === void 0 ? null : _ref2$;

      return key;
    }
  }, {
    key: "entries",
    value: function entries(instance) {
      return instance[sDefinition].entries();
    }
  }, {
    key: "size",
    value: function size(instance) {
      return instance[sDefinition].size;
    }
  }, {
    key: "has",
    value: function has(instance, key) {
      return instance[sDefinition].has(key);
    }
  }, {
    key: "hasValue",
    value: function hasValue(instance, value) {
      return !!ObjectMap.getKey(instance, value);
    }
  }, {
    key: "keys",
    value: function keys(instance) {
      return instance[sDefinition].keys();
    }
  }, {
    key: "values",
    value: function values(instance) {
      return instance[sDefinition].values();
    }
  }, {
    key: "forEach",
    value: function forEach(fn, instance) {
      return instance[sDefinition].forEach(function (v, k) {
        return fn(v, k, instance);
      });
    }
  }, {
    key: "filter",
    value: function filter(fn, instance) {
      var obj = {};
      ObjectMap.forEach(function (v, k) {
        if (fn(v, k)) {
          obj[k] = v;
        }
      }, instance);
      return ObjectMap.fromObject(obj);
    }
  }, {
    key: "prefixValues",
    value: function prefixValues(instance) {
      var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      if (prefix === '') {
        return instance;
      }

      if (!RUNTIME.prefixCache.has(prefix)) {
        RUNTIME.prefixCache.set(prefix, new Map());
      }

      if (!RUNTIME.prefixCache.get(prefix).has(instance)) {
        var definition = {};
        ObjectMap.forEach(function (value, key) {
          definition[key] = prefixString(value, prefix);
        }, instance);
        var prefixedInstance = ObjectMap.fromObject(definition);
        RUNTIME.prefixCache.get(prefix).set(instance, prefixedInstance);
      }

      return RUNTIME.prefixCache.get(prefix).get(instance);
    }
  }]);

  return ObjectMap;
}(), _temp), (_applyDecoratedDescriptor(_class, "fromObject", [factory], Object.getOwnPropertyDescriptor(_class, "fromObject"), _class), _applyDecoratedDescriptor(_class, "fromKeys", [factory], Object.getOwnPropertyDescriptor(_class, "fromKeys"), _class), _applyDecoratedDescriptor(_class, "prefixKeys", [factory], Object.getOwnPropertyDescriptor(_class, "prefixKeys"), _class)), _class);
exports.ObjectMap = ObjectMap;
//# sourceMappingURL=ObjectMap.js.map


/***/ }),
/* 397 */,
/* 398 */,
/* 399 */,
/* 400 */,
/* 401 */
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
/* 402 */,
/* 403 */,
/* 404 */,
/* 405 */,
/* 406 */
/***/ (function(module, exports, __webpack_require__) {

var getPrototypeOf = __webpack_require__(71);

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

module.exports = _superPropBase;

/***/ }),
/* 407 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(194));

var _ObjectMap = __webpack_require__(26);

var _baseMessageTypes = _interopRequireDefault(__webpack_require__(277));

var messageTypes = _ObjectMap.ObjectMap.prefixKeys([].concat((0, _toConsumableArray2.default)(_ObjectMap.ObjectMap.keys(_baseMessageTypes.default)), ['syncPresence']), 'rc-adapter');

var _default = messageTypes;
exports.default = _default;

/***/ }),
/* 408 */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(278);

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
}

module.exports = _arrayWithoutHoles;

/***/ }),
/* 409 */
/***/ (function(module, exports) {

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

module.exports = _iterableToArray;

/***/ }),
/* 410 */
/***/ (function(module, exports) {

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

module.exports = _nonIterableSpread;

/***/ }),
/* 411 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = requestWithPostMessage;

var _uuid = _interopRequireDefault(__webpack_require__(361));

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
/* 412 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(279);
var bytesToUuid = __webpack_require__(280);

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/uuidjs/uuid for API details
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
/* 413 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(279);
var bytesToUuid = __webpack_require__(280);

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
/* 414 */,
/* 415 */,
/* 416 */,
/* 417 */,
/* 418 */,
/* 419 */,
/* 420 */,
/* 421 */
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
/* 422 */,
/* 423 */,
/* 424 */,
/* 425 */,
/* 426 */,
/* 427 */,
/* 428 */,
/* 429 */,
/* 430 */,
/* 431 */,
/* 432 */,
/* 433 */,
/* 434 */,
/* 435 */,
/* 436 */,
/* 437 */,
/* 438 */,
/* 439 */,
/* 440 */,
/* 441 */,
/* 442 */,
/* 443 */,
/* 444 */,
/* 445 */,
/* 446 */,
/* 447 */,
/* 448 */,
/* 449 */,
/* 450 */,
/* 451 */,
/* 452 */,
/* 453 */,
/* 454 */,
/* 455 */,
/* 456 */,
/* 457 */,
/* 458 */,
/* 459 */,
/* 460 */,
/* 461 */,
/* 462 */,
/* 463 */,
/* 464 */,
/* 465 */,
/* 466 */,
/* 467 */,
/* 468 */,
/* 469 */,
/* 470 */,
/* 471 */,
/* 472 */,
/* 473 */,
/* 474 */,
/* 475 */,
/* 476 */,
/* 477 */,
/* 478 */,
/* 479 */,
/* 480 */,
/* 481 */,
/* 482 */,
/* 483 */,
/* 484 */,
/* 485 */,
/* 486 */,
/* 487 */,
/* 488 */,
/* 489 */,
/* 490 */,
/* 491 */,
/* 492 */,
/* 493 */,
/* 494 */,
/* 495 */,
/* 496 */,
/* 497 */,
/* 498 */,
/* 499 */,
/* 500 */,
/* 501 */,
/* 502 */,
/* 503 */,
/* 504 */,
/* 505 */,
/* 506 */,
/* 507 */,
/* 508 */,
/* 509 */,
/* 510 */,
/* 511 */,
/* 512 */,
/* 513 */,
/* 514 */,
/* 515 */,
/* 516 */,
/* 517 */,
/* 518 */,
/* 519 */,
/* 520 */,
/* 521 */,
/* 522 */,
/* 523 */,
/* 524 */,
/* 525 */,
/* 526 */,
/* 527 */,
/* 528 */,
/* 529 */,
/* 530 */,
/* 531 */,
/* 532 */,
/* 533 */,
/* 534 */,
/* 535 */,
/* 536 */,
/* 537 */,
/* 538 */,
/* 539 */,
/* 540 */,
/* 541 */,
/* 542 */,
/* 543 */,
/* 544 */,
/* 545 */,
/* 546 */,
/* 547 */,
/* 548 */,
/* 549 */,
/* 550 */,
/* 551 */,
/* 552 */,
/* 553 */,
/* 554 */,
/* 555 */,
/* 556 */,
/* 557 */,
/* 558 */,
/* 559 */,
/* 560 */,
/* 561 */,
/* 562 */,
/* 563 */,
/* 564 */,
/* 565 */,
/* 566 */,
/* 567 */,
/* 568 */,
/* 569 */,
/* 570 */,
/* 571 */,
/* 572 */,
/* 573 */,
/* 574 */,
/* 575 */,
/* 576 */,
/* 577 */,
/* 578 */,
/* 579 */,
/* 580 */,
/* 581 */,
/* 582 */,
/* 583 */,
/* 584 */,
/* 585 */,
/* 586 */,
/* 587 */,
/* 588 */,
/* 589 */,
/* 590 */,
/* 591 */,
/* 592 */,
/* 593 */,
/* 594 */,
/* 595 */,
/* 596 */,
/* 597 */,
/* 598 */,
/* 599 */,
/* 600 */,
/* 601 */,
/* 602 */,
/* 603 */,
/* 604 */,
/* 605 */,
/* 606 */,
/* 607 */,
/* 608 */,
/* 609 */,
/* 610 */,
/* 611 */,
/* 612 */,
/* 613 */,
/* 614 */,
/* 615 */,
/* 616 */,
/* 617 */,
/* 618 */,
/* 619 */,
/* 620 */,
/* 621 */,
/* 622 */,
/* 623 */,
/* 624 */,
/* 625 */,
/* 626 */,
/* 627 */,
/* 628 */,
/* 629 */,
/* 630 */,
/* 631 */,
/* 632 */,
/* 633 */,
/* 634 */,
/* 635 */,
/* 636 */,
/* 637 */,
/* 638 */,
/* 639 */,
/* 640 */,
/* 641 */,
/* 642 */,
/* 643 */,
/* 644 */,
/* 645 */,
/* 646 */,
/* 647 */,
/* 648 */,
/* 649 */,
/* 650 */,
/* 651 */,
/* 652 */,
/* 653 */,
/* 654 */,
/* 655 */,
/* 656 */,
/* 657 */,
/* 658 */,
/* 659 */,
/* 660 */,
/* 661 */,
/* 662 */,
/* 663 */,
/* 664 */,
/* 665 */,
/* 666 */,
/* 667 */,
/* 668 */,
/* 669 */,
/* 670 */,
/* 671 */,
/* 672 */,
/* 673 */,
/* 674 */,
/* 675 */,
/* 676 */,
/* 677 */,
/* 678 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

var _url = _interopRequireDefault(__webpack_require__(147));

var _logo = _interopRequireDefault(__webpack_require__(679));

var _icon = _interopRequireDefault(__webpack_require__(680));

var _parseUri2 = _interopRequireDefault(__webpack_require__(310));

var _Adapter = _interopRequireDefault(__webpack_require__(681));

// eslint-disable-next-line
// eslint-disable-next-line
var defaultPrefix = "rc-widget"; // TODO: fix: polyfill NodeList forEach

if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

var version = "1.5.0";
var currentScript = document.currentScript;

if (!currentScript) {
  currentScript = document.querySelector('script[src*="adapter.js"]');
}

var appUrl =  true ? "".concat("https://ringcentral.github.io/ringcentral-embeddable", "/app.html") : undefined;

var _parseUri = (0, _parseUri2.default)(currentScript && currentScript.src || ''),
    appKey = _parseUri.appKey,
    clientId = _parseUri.clientId,
    appSecret = _parseUri.appSecret,
    clientSecret = _parseUri.clientSecret,
    appServer = _parseUri.appServer,
    appVersion = _parseUri.appVersion,
    redirectUri = _parseUri.redirectUri,
    proxyUri = _parseUri.proxyUri,
    stylesUri = _parseUri.stylesUri,
    notification = _parseUri.notification,
    disableCall = _parseUri.disableCall,
    disableMessages = _parseUri.disableMessages,
    disableReadText = _parseUri.disableReadText,
    disableConferenceInvite = _parseUri.disableConferenceInvite,
    disableGlip = _parseUri.disableGlip,
    disableConferenceCall = _parseUri.disableConferenceCall,
    disableMeeting = _parseUri.disableMeeting,
    authProxy = _parseUri.authProxy,
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
    multipleTabsSupport = _parseUri.multipleTabsSupport,
    disableInactiveTabCallEvent = _parseUri.disableInactiveTabCallEvent,
    disableLoginPopup = _parseUri.disableLoginPopup,
    enableWebRTCPlanB = _parseUri.enableWebRTCPlanB,
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
  clientId: clientId,
  appSecret: appSecret,
  clientSecret: clientSecret,
  appServer: appServer,
  appVersion: appVersion,
  redirectUri: redirectUri,
  proxyUri: proxyUri,
  stylesUri: stylesUri,
  disableCall: disableCall,
  disableMessages: disableMessages,
  disableReadText: disableReadText,
  disableConferenceInvite: disableConferenceInvite,
  disableGlip: disableGlip,
  disableConferenceCall: disableConferenceCall,
  disableMeeting: disableMeeting,
  authProxy: authProxy,
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
  multipleTabsSupport: multipleTabsSupport,
  disableInactiveTabCallEvent: disableInactiveTabCallEvent,
  disableLoginPopup: disableLoginPopup,
  enableWebRTCPlanB: enableWebRTCPlanB,
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
/* 679 */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB3aWR0aD0iNzRweCIgaGVpZ2h0PSIxMnB4IiB2aWV3Qm94PSIwIDAgNzQgMTIiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDc0IDEyIiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzFfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzJfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzJfKSIgZmlsbD0iIzAwNjA5QyIgZD0iTTMuMzkxLDYuNDA4TDIuODcsOS40NTNIMGwxLjUyMy04Ljc0NGg0LjEyOWMwLjYzNSwwLDEuMTc3LDAuMDQyLDEuNjIxLDAuMTE0CgkJCUM3LjcxMiwwLjksOC4wNzMsMS4wMiw4LjM1MiwxLjE3OGMwLjI3OCwwLjE1NSwwLjQ4LDAuMzUyLDAuNjA5LDAuNTlDOS4wODUsMiw5LjE0NywyLjI3Nyw5LjE0NywyLjYwNAoJCQljMCwwLjE3Mi0wLjAyMSwwLjM3My0wLjA2MiwwLjZDOC45OTcsMy43MDQsOC44MDEsNC4xNDgsOC40OTcsNC41NDZjLTAuMywwLjM5Mi0wLjcyMywwLjY1NS0xLjI1NCwwLjc4OQoJCQljMC4xNzUsMC4wNjcsMC4zNCwwLjEzNiwwLjQ4LDAuMjAyQzcuODYyLDUuNjA5LDcuOTg2LDUuNjk1LDguMDg5LDUuOGMwLjA5OCwwLjEwNCwwLjE3NiwwLjIzNywwLjIzMiwwLjM4OAoJCQljMC4wNTcsMC4xNTQsMC4wODgsMC4zNTUsMC4wODgsMC42YzAsMC4yNDctMC4wMzEsMC41NDEtMC4wODgsMC44NzJjLTAuMDU3LDAuMzEtMC4wOTgsMC41NjItMC4xMzQsMC43NjQKCQkJQzguMTU2LDguNjI5LDguMTQxLDguNzg0LDguMTQxLDguODk4YzAsMC4xOTUsMC4wNzIsMC4yOTUsMC4yMTcsMC4yOTVMOC4zMjIsOS40NTZINS40MkM1LjQwNCw5LjM3OSw1LjM5NCw5LjI3OSw1LjM5NCw5LjE3OAoJCQljMC0wLjE0LDAuMDEtMC4zMTQsMC4wMzEtMC41MjVDNS40NDYsOC40MzYsNS40ODIsOC4xOTcsNS41MjgsNy45M0M1LjU3NCw3LjY2LDUuNiw3LjQzNCw1LjYsNy4yNDcKCQkJYzAtMC4zMS0wLjA5My0wLjUyNi0wLjI4NC0wLjY0OUM1LjEyNSw2LjQ3Myw0Ljc3NCw2LjQxMSw0LjI2Myw2LjQxMUgzLjM5MVY2LjQwOHogTTMuNzMyLDQuNDg4aDEuMTMKCQkJYzAuNDQ0LDAsMC43OS0wLjA2MiwxLjA0My0wLjE4MmMwLjI1My0wLjEyMywwLjQwMi0wLjM0MSwwLjQ0OS0wLjY0NkM2LjM2NSwzLjYyLDYuMzY1LDMuNTU3LDYuMzY1LDMuNDgKCQkJYzAtMC4yNTQtMC4wOTMtMC40MzUtMC4yNzktMC41NTlDNS45LDIuODA5LDUuNjU3LDIuNzQ2LDUuMzU4LDIuNzQ2SDQuMDIxTDMuNzMyLDQuNDg4eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8zXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF80XyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF80XykiIGZpbGw9IiMwMDYwOUMiIGQ9Ik0xMy4xNzMsMy4wODloMi4zMDJMMTUuMzEsNC4wODVjMC4zNTEtMC4zODcsMC43MTItMC42ODEsMS4wODQtMC44NzcKCQkJYzAuMzYxLTAuMjAxLDAuNzg1LTAuMywxLjI3LTAuM2MwLjcxMiwwLDEuMjM5LDAuMTY1LDEuNTY5LDAuNDk2YzAuMzMxLDAuMzM1LDAuNDk2LDAuODE0LDAuNDk2LDEuNDQ5CgkJCWMwLDAuMjQ4LTAuMDIxLDAuNTEyLTAuMDcyLDAuNzg1bC0wLjY1LDMuODEzaC0yLjUyOWwwLjU3OC0zLjM2NWMwLjAzMS0wLjE0NiwwLjA0Mi0wLjI4NCwwLjA0Mi0wLjQyMwoJCQljMC0wLjIxNy0wLjA1Mi0wLjQwMy0wLjE1NS0wLjU0OGMtMC4xMDMtMC4xNDYtMC4yODktMC4yMTgtMC41NjctMC4yMThjLTAuMzgyLDAtMC42NzEsMC4xMTUtMC44NDcsMC4zNDgKCQkJYy0wLjE3NiwwLjIzLTAuMjk5LDAuNTUyLTAuMzYxLDAuOTY1TDE0LjYxLDkuNDUyaC0yLjUyOUwxMy4xNzMsMy4wODl6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzVfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfNV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzZfKSIgZmlsbD0iIzAwNjA5QyIgZD0iTTIyLjA5Myw5LjYyOXYwLjAzNmMwLDAuMDg4LDAuMDQxLDAuMTcsMC4xMTMsMC4yNDIKCQkJYzAuMDgzLDAuMTA0LDAuMjU4LDAuMTU1LDAuNTE2LDAuMTU1YzAuMzcyLDAsMC42NC0wLjA5NCwwLjgyNi0wLjI3OXMwLjMyLTAuNTA2LDAuNDAyLTAuOTZsMC4xMDQtMC41MjEKCQkJYy0wLjIxNywwLjE4OC0wLjQ3NSwwLjM1My0wLjc4NSwwLjQ4NWMtMC4zMiwwLjE0LTAuNzAyLDAuMjA3LTEuMTY3LDAuMjA3Yy0wLjM4MiwwLTAuNzEyLTAuMDYyLTEuMDAxLTAuMTgyCgkJCXMtMC41MjYtMC4yODktMC43MjMtMC40OTZjLTAuMTk2LTAuMjExLTAuMzQxLTAuNDYzLTAuNDM0LTAuNzUyYy0wLjEwMy0wLjI5NS0wLjE0NS0wLjYwNC0wLjE0NS0wLjkzOQoJCQljMC0wLjEwNCwwLTAuMjA3LDAuMDIxLTAuMzExYzAuMDEtMC4xMDcsMC4wMjEtMC4yMTcsMC4wNDItMC4zM2MwLjA2Mi0wLjM4NywwLjE3NS0wLjc3OSwwLjM0MS0xLjE2NgoJCQljMC4xNjUtMC4zODksMC4zOTItMC43MzMsMC42NzEtMS4wMzljMC4yNzktMC4zMDMsMC42MDktMC41NTEsMS4wMTItMC43NDJjMC4zOTItMC4xODYsMC44NDctMC4yODMsMS4zNzMtMC4yODMKCQkJYzAuMzkyLDAsMC43MzMsMC4wOTQsMS4wNDIsMC4yNzhjMC4yOTksMC4xODEsMC41MzcsMC40MjksMC43MjMsMC43MzNsMC4xMzQtMC44MzJoMi4yMkwyNi40OSw4LjA1OQoJCQljLTAuMDgzLDAuNDc2LTAuMTg2LDAuOTI0LTAuMzExLDEuMzM4Yy0wLjEyMywwLjQxMi0wLjMzLDAuNzczLTAuNTk5LDEuMDc4Yy0wLjI3OSwwLjMxMS0wLjY1LDAuNTUzLTEuMTM2LDAuNzI0CgkJCWMtMC40NzUsMC4xNzUtMS4xMDQsMC4yNjMtMS44ODksMC4yNjNjLTAuNTU4LDAtMS4wMjItMC4wNDYtMS4zOTQtMC4xNDVjLTAuMzgyLTAuMDk5LTAuNjkyLTAuMjI4LTAuOTI5LTAuMzg3CgkJCWMtMC4yMzctMC4xNjYtMC40MDMtMC4zNTMtMC41MTYtMC41NjJjLTAuMTA0LTAuMjA3LTAuMTY1LTAuNDMtMC4xNjUtMC42NTZWOS42MjlIMjIuMDkzeiBNMjMuNiw0LjU1CgkJCWMtMC4xODYsMC0wLjM1MSwwLjAzNi0wLjQ4NSwwLjExM2MtMC4xMzQsMC4wNzEtMC4yNTgsMC4xNzEtMC4zNTEsMC4zMDVjLTAuMTAzLDAuMTMtMC4xNzUsMC4yODQtMC4yMzcsMC40NgoJCQlDMjIuNDY1LDUuNjA5LDIyLjQxMyw1Ljc5OSwyMi4zODIsNmMtMC4wMSwwLjA2Mi0wLjAxLDAuMTE0LTAuMDEsMC4xNmMtMC4wMTEsMC4wNTItMC4wMTEsMC4wOTktMC4wMTEsMC4xNDUKCQkJYzAsMC4yNTQsMC4wNjIsMC40NzUsMC4xODYsMC42NTVjMC4xMjQsMC4xODcsMC4zMzEsMC4yNzksMC42MiwwLjI4OWgwLjA1MWMwLjE4NiwwLDAuMzQxLTAuMDQxLDAuNDg1LTAuMTEzCgkJCWMwLjE0NC0wLjA3MSwwLjI1OC0wLjE3MSwwLjM2MS0wLjI4OGMwLjEwMy0wLjEyNSwwLjE4Ni0wLjI2NCwwLjI0OC0wLjQyNGMwLjA3Mi0wLjE2LDAuMTE0LTAuMzIsMC4xNTUtMC40OTYKCQkJYzAuMDIxLTAuMTI5LDAuMDMxLTAuMjYzLDAuMDMxLTAuNDAyYzAtMC4yNjktMC4wNjItMC40OTQtMC4xOTYtMC42ODdjLTAuMTI0LTAuMTktMC4zNTEtMC4yODktMC42ODEtMC4yODlIMjMuNnoiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfN18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfOF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF83XyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cGF0aCBjbGlwLXBhdGg9InVybCgjU1ZHSURfOF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMzMuMjk0LDQuMTI3YzAtMC4wMzEsMC4wMTEtMC4wNTksMC4wMTEtMC4wODNjMC0wLjAyMSwwLjAxLTAuMDQ3LDAuMDEtMC4wNzcKCQkJYzAtMC4zODgtMC4xMTQtMC42ODItMC4zMzItMC44ODNjLTAuMjE3LTAuMjA3LTAuNTI1LTAuMzExLTAuOTI4LTAuMzExYy0wLjQ3NiwwLTAuODg5LDAuMTk3LTEuMjI5LDAuNgoJCQljLTAuMzMxLDAuNDAyLTAuNTY4LDEuMDA3LTAuNzEyLDEuODEyYy0wLjAzMSwwLjE0OC0wLjA1MywwLjI5OS0wLjA2MiwwLjQzOGMtMC4wMjEsMC4xNDUtMC4wMjEsMC4yNzktMC4wMjEsMC40MDgKCQkJYzAsMC4yMDEsMC4wMTEsMC4zODcsMC4wNjIsMC41NTNjMC4wNDIsMC4xNywwLjExNCwwLjMxNCwwLjIxNywwLjQ0M2MwLjEwNCwwLjEyMywwLjIzOCwwLjIyMiwwLjQwMywwLjI5OQoJCQljMC4xNzUsMC4wNzIsMC4zODIsMC4xMDcsMC42NCwwLjEwN2MwLjQ0NCwwLDAuNzk1LTAuMTM0LDEuMDUzLTAuNDAxYzAuMjctMC4yNjksMC40NjYtMC41OTksMC41NzgtMS4wMDFoMi42MTMKCQkJYy0wLjE1NCwwLjUzNy0wLjM3MSwxLjAxNy0wLjY2LDEuNDM1Yy0wLjI4OSwwLjQyNS0wLjYzMSwwLjc4NS0xLjAyMiwxLjA3OXMtMC44MzYsMC41MTYtMS4zMjEsMC42NzYKCQkJYy0wLjQ4NCwwLjE1NS0xLjAwMSwwLjIzMi0xLjU0OCwwLjIzMmMtMC41ODksMC0xLjEyNS0wLjA3Mi0xLjU4LTAuMjI3Yy0wLjQ2NS0wLjE1Ni0wLjg0Ny0wLjM3Ny0xLjE2Ny0wLjY2NgoJCQljLTAuMzItMC4yOTUtMC41NTktMC42NDYtMC43MjMtMS4wNjNjLTAuMTY2LTAuNDE4LTAuMjQ4LTAuODg4LTAuMjQ4LTEuNDE5YzAtMC4xNSwwLjAxLTAuMzExLDAuMDIxLTAuNDc3CgkJCWMwLjAyMS0wLjE2NCwwLjA0MS0wLjMzNCwwLjA3MS0wLjUxMWMwLjExNC0wLjY2NiwwLjMxOS0xLjI2NSwwLjYzLTEuODA3YzAuMzExLTAuNTMxLDAuNjgyLTAuOTkxLDEuMTE1LTEuMzYyCgkJCWMwLjQzNC0wLjM3NywwLjkyOS0wLjY2NiwxLjQ2Ni0wLjg2N3MxLjA5NS0wLjMwNSwxLjY3Mi0wLjMwNWMxLjE5OCwwLDIuMDk3LDAuMjY0LDIuNjk0LDAuNzk1CgkJCWMwLjU4OSwwLjUyNSwwLjg4OCwxLjI3LDAuODg4LDIuMjM0djAuMTc2YzAsMC4wNTItMC4wMSwwLjEwNy0wLjAxLDAuMTcxTDMzLjI5NCw0LjEyN0wzMy4yOTQsNC4xMjd6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzlfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzEwXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzlfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xMF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMzguNTE4LDYuNjYxYy0wLjAxMSwwLjA0MS0wLjAyMSwwLjA4Mi0wLjAyMSwwLjExOAoJCQljLTAuMDExLDAuMDQxLTAuMDExLDAuMDgyLTAuMDExLDAuMTIzYzAsMC4zMTEsMC4xMDQsMC41NTQsMC4zMSwwLjczOGMwLjE5NiwwLjE4MiwwLjQ1NSwwLjI3LDAuNzU0LDAuMjcKCQkJYzAuMTk2LDAsMC4zOTQtMC4wNDcsMC41NzgtMC4xNDFjMC4xODUtMC4wOTMsMC4zNDEtMC4yMzEsMC40NjUtMC40MThoMi40MTZjLTAuMTc2LDAuMzk3LTAuNDEzLDAuNzI5LTAuNzAyLDAuOTk2CgkJCWMtMC4yODksMC4yNjktMC41OTksMC40ODUtMC45NDksMC42NWMtMC4zNTIsMC4xNjUtMC43MTMsMC4yODQtMS4xMDQsMC4zNTJjLTAuMzgyLDAuMDcxLTAuNzU0LDAuMTA0LTEuMTI1LDAuMTA0CgkJCWMtMC40NTQsMC0wLjg3OC0wLjA1Ny0xLjI2LTAuMTdjLTAuMzgyLTAuMTE0LTAuNzAyLTAuMjg0LTAuOTc5LTAuNTEyYy0wLjI3OS0wLjIyMy0wLjQ4Ni0wLjUtMC42NDItMC44MzIKCQkJYy0wLjE1NC0wLjMyNC0wLjIzNy0wLjctMC4yMzctMS4xMzVjMC0wLjEwNCwwLjAxMi0wLjIxMiwwLjAyMS0wLjMyYzAuMDExLTAuMTA3LDAuMDMxLTAuMjIxLDAuMDQyLTAuMzM0CgkJCWMwLjA5My0wLjUxOCwwLjI2OC0wLjk5MSwwLjUyNi0xLjQxNmMwLjI1OC0wLjQyMiwwLjU3Ny0wLjc4MywwLjk0OC0xLjA3N2MwLjM4Mi0wLjMsMC43OTUtMC41MjcsMS4yNjEtMC42ODcKCQkJYzAuNDc1LTAuMTY2LDAuOTU5LTAuMjQ0LDEuNDY1LTAuMjQ0YzAuNTE4LDAsMC45NjEsMC4wNzIsMS4zNTQsMC4yMTdjMC4zOTMsMC4xNDYsMC43MzIsMC4zNDcsMC45OTEsMC42MDkKCQkJYzAuMjY5LDAuMjU4LDAuNDc1LDAuNTczLDAuNjA4LDAuOTQ0YzAuMTM1LDAuMzcyLDAuMjA3LDAuNzg1LDAuMjA3LDEuMjI5YzAsMC4yNzItMC4wMzEsMC41ODgtMC4wOTQsMC45MzVIMzguNTE4egoJCQkgTTQxLjAyNSw1LjM3NmMwLjAxMS0wLjA0MiwwLjAxMS0wLjEwNCwwLjAxMS0wLjE4N2MwLTAuMjU4LTAuMDgyLTAuNDc2LTAuMjY5LTAuNjU1Yy0wLjE3Ni0wLjE3Ny0wLjM5My0wLjI2My0wLjY2LTAuMjYzCgkJCWMtMC4zODMsMC0wLjY5MSwwLjA5OC0wLjkzLDAuMjkzYy0wLjIyOCwwLjIwMS0wLjM4MywwLjQ3MS0wLjQ0MywwLjgxMkg0MS4wMjV6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzExXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8xMl8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8xMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzEyXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik00NC4yNTgsMy4wODloMi4zMDNsLTAuMTc3LDAuOTk2YzAuMzYxLTAuMzg3LDAuNzI0LTAuNjgxLDEuMDg0LTAuODc3CgkJCWMwLjM3Mi0wLjIwMSwwLjc5Ni0wLjMsMS4yOC0wLjNjMC43MTMsMCwxLjIyOSwwLjE2NSwxLjU2OCwwLjQ5NmMwLjMzLDAuMzM1LDAuNDk2LDAuODE0LDAuNDk2LDEuNDQ5CgkJCWMwLDAuMjQ4LTAuMDMsMC41MTItMC4wNzEsMC43ODVMNTAuMDgsOS40NTJoLTIuNTI5bDAuNTktMy4zNjVjMC4wMjEtMC4xNDYsMC4wMjktMC4yODQsMC4wMjktMC40MjMKCQkJYzAtMC4yMTctMC4wNDEtMC40MDMtMC4xNDUtMC41NDhjLTAuMTA0LTAuMTQ2LTAuMjg5LTAuMjE4LTAuNTY3LTAuMjE4Yy0wLjM4MiwwLTAuNjcxLDAuMTE1LTAuODQ3LDAuMzQ4CgkJCWMtMC4xODcsMC4yMy0wLjMwMSwwLjU1Mi0wLjM3MywwLjk2NWwtMC41NTcsMy4yNDFoLTIuNTJMNDQuMjU4LDMuMDg5eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xM18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMTRfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xNF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNTQuNzU3LDkuNDA3Yy0wLjI4OSwwLjAxNS0wLjU0NywwLjAyNC0wLjc4NCwwLjAzNgoJCQljLTAuMjM4LDAuMDEtMC40NjUsMC4wMS0wLjY2LDAuMDFjLTAuMzgzLDAtMC43MDMtMC4wMTYtMC45NjEtMC4wNTNjLTAuMjU5LTAuMDM1LTAuNDY1LTAuMTAzLTAuNjE5LTAuMTk1CgkJCWMtMC4xNTQtMC4wOTQtMC4yNjktMC4yMTctMC4zMy0wLjM3MWMtMC4wNjItMC4xNDgtMC4wOTQtMC4zNDYtMC4wOTQtMC41ODNjMC0wLjE0NiwwLjAxMi0wLjMwNiwwLjAyMS0wLjQ5MQoJCQljMC4wMjEtMC4xODEsMC4wNTItMC4zODIsMC4wOTMtMC41OTlsMC40NjYtMi42NjNINTAuOTlsMC4yMzYtMS40NTVoMC45MzlsMC4zNTItMS45ODJoMi40ODhsLTAuMzUyLDEuOTgyaDEuMjE5bC0wLjI0OCwxLjQ1NQoJCQloLTEuMjA4bC0wLjQwMSwyLjMxNmMtMC4wMjEsMC4wNzgtMC4wMzEsMC4xNDEtMC4wNDMsMC4yMDFjLTAuMDEsMC4wNjItMC4wMSwwLjExOS0wLjAxLDAuMTY2YzAsMC4xNTQsMC4wNTMsMC4yNjQsMC4xNDUsMC4zMwoJCQljMC4xMDQsMC4wNjIsMC4yNzgsMC4wOTgsMC41NDcsMC4wOThoMC40MDJMNTQuNzU3LDkuNDA3eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xNV8iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMTZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTVfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xNl8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNTYuMzg5LDMuMDg5aDIuMzAzTDU4LjQ2Myw0LjM4aDAuMDMxQzU5LDMuMzk4LDU5LjczMiwyLjkwOCw2MC43MDMsMi45MDgKCQkJYzAuMDUyLDAsMC4xMTMsMC4wMDUsMC4xNjUsMC4wMTFjMC4wNTIsMC4wMTEsMC4xMDQsMC4wMjEsMC4xNjUsMC4wMjRsLTAuNDU0LDIuNTI5Yy0wLjA4Mi0wLjAyMS0wLjE2NS0wLjAzNS0wLjI0OC0wLjA1MgoJCQljLTAuMDgyLTAuMDE3LTAuMTc1LTAuMDI0LTAuMjU4LTAuMDI0Yy0wLjUxNywwLTAuOTI5LDAuMTQtMS4yMzgsMC40MTJjLTAuMywwLjI3OC0wLjUxNywwLjc2LTAuNjMsMS40NDRsLTAuMzgyLDIuMTk5aC0yLjUyOQoJCQlMNTYuMzg5LDMuMDg5eiIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8xN18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMThfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMTdfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8xOF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNNjQuNDA5LDkuNDY5bC0wLjAxMS0wLjg3OGMtMC40MTIsMC4zNDEtMC44MjUsMC41NjgtMS4yMTksMC42ODcKCQkJYy0wLjQwMiwwLjExOS0wLjg0NywwLjE3Ny0xLjMyLDAuMTc3Yy0wLjI3LDAtMC41MjYtMC4wMzEtMC43NjQtMC4wODhjLTAuMjQ4LTAuMDYyLTAuNDU1LTAuMTU0LTAuNjMxLTAuMjg5CgkJCWMtMC4xODYtMC4xMjktMC4zMi0wLjI4OS0wLjQzNC0wLjQ3OWMtMC4xMDQtMC4xODctMC4xNTUtMC40MTgtMC4xNTUtMC42ODdjMC0wLjExNCwwLjAxMS0wLjIzNywwLjA0Mi0wLjM3NwoJCQljMC4wNzItMC40NzYsMC4yNTgtMC44NTMsMC41MjUtMS4xMmMwLjI3LTAuMjczLDAuNTg5LTAuNDc1LDAuOTQ5LTAuNjE0YzAuMzUzLTAuMTQsMC43MzMtMC4yMzEsMS4xMzctMC4yODQKCQkJYzAuNDAyLTAuMDU3LDAuNzczLTAuMTAzLDEuMTE1LTAuMTQ4YzAuMzUxLTAuMDQxLDAuNjQtMC4xMDQsMC44NzctMC4xODJjMC4yMzctMC4wNzYsMC4zNzEtMC4yMTcsMC40MTItMC40MTgKCQkJYzAtMC4wMTYsMC0wLjAzMSwwLTAuMDQxYzAtMC4wMTYsMC4wMTItMC4wMjUsMC4wMTItMC4wNDFjMC0wLjA5OS0wLjAzMS0wLjE3Ni0wLjA5NC0wLjIzMWMtMC4wNTItMC4wNTgtMC4xMjMtMC4xMDQtMC4xOTUtMC4xMwoJCQlzLTAuMTU1LTAuMDQ3LTAuMjQ4LTAuMDYyYy0wLjA5NC0wLjAxMS0wLjE2NS0wLjAxNi0wLjIxNy0wLjAxNmMtMC4wOTQsMC0wLjE4NywwLjAwNS0wLjI4OSwwLjAxNgoJCQljLTAuMTA0LDAuMDE2LTAuMTk2LDAuMDQxLTAuMjc4LDAuMDg4Yy0wLjA5MywwLjA0Ny0wLjE3NiwwLjEwOC0wLjI1OSwwLjE4N2MtMC4wNzIsMC4wODMtMC4xMjMsMC4xOS0wLjE2NSwwLjMzaC0yLjQyNwoJCQljMC4wNjItMC4zNDEsMC4xNzctMC42NDYsMC4zNDItMC45MDNjMC4xNzYtMC4yNjMsMC40MTItMC40OSwwLjcyMy0wLjY3MXMwLjY5MS0wLjMxOSwxLjE0Ni0wLjQxOAoJCQljMC40NTMtMC4wOTksMS4wMDItMC4xNDYsMS42MzItMC4xNDZjMC41NzcsMCwxLjA0MiwwLjAzNywxLjQxMywwLjExM2MwLjM3MSwwLjA3OCwwLjY2LDAuMTkxLDAuODY3LDAuMzM2CgkJCWMwLjIxNywwLjE0NiwwLjM2MSwwLjMyLDAuNDQzLDAuNTIxYzAuMDcyLDAuMjAxLDAuMTE0LDAuNDI5LDAuMTE0LDAuNjgyYzAsMC4xNDgtMC4wMTEsMC4zMTEtMC4wMzEsMC40NzEKCQkJYy0wLjAyMSwwLjE2NC0wLjA0MSwwLjMzNC0wLjA3MSwwLjUxTDY2LjgzNCw4LjM0Yy0wLjAyMSwwLjEzNS0wLjAyOSwwLjI0OC0wLjAyOSwwLjM0MmMwLDAuMDg4LDAuMDEsMC4xNjQsMC4wNDEsMC4yMzEKCQkJYzAuMDQxLDAuMDcxLDAuMDkyLDAuMTQ5LDAuMTg2LDAuMjM3bC0wLjAxLDAuMzJoLTIuNjEyVjkuNDY5eiBNNjMuMjQzLDguMDJjMC4yMTcsMCwwLjQxMS0wLjAzNywwLjU3Ny0wLjExOQoJCQljMC4xNjYtMC4wNzcsMC4zMTEtMC4xOSwwLjQyNC0wLjMzNmMwLjExMy0wLjE0LDAuMTk1LTAuMzA1LDAuMjU4LTAuNDk2YzAuMDcyLTAuMTg5LDAuMTE0LTAuMzk2LDAuMTM1LTAuNjEzCgkJCWMtMC4yMjgsMC4xLTAuNDUzLDAuMTcxLTAuNjgyLDAuMjEyYy0wLjIyOSwwLjA0Ny0wLjQ0MywwLjA5My0wLjY1LDAuMTQ5Yy0wLjE5NSwwLjA1Mi0wLjM2MSwwLjEyMy0wLjUwNiwwLjIyMgoJCQlzLTAuMjI5LDAuMjQ4LTAuMjU4LDAuNDQ4djAuMDcyYzAsMC4xNDEsMC4wNTIsMC4yNTQsMC4xNzUsMC4zMzZDNjIuODMsNy45NzcsNjMuMDA1LDguMDIsNjMuMjQzLDguMDIiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfMTlfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzIwXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzE5XyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cG9seWdvbiBjbGlwLXBhdGg9InVybCgjU1ZHSURfMjBfKSIgZmlsbD0iI0YzOEIwMCIgcG9pbnRzPSI2Ny40NTUsOS40NTMgNjguOTczLDAuNzA5IDcxLjUwMiwwLjcwOSA2OS45ODQsOS40NTMgCQkiLz4KCTwvZz4KCTxnPgoJCTxkZWZzPgoJCQk8cmVjdCBpZD0iU1ZHSURfMjFfIiB5PSIwLjUzOSIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjEwLjkyMiIvPgoJCTwvZGVmcz4KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzIyXyI+CgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzIxXyIgIG92ZXJmbG93PSJ2aXNpYmxlIi8+CgkJPC9jbGlwUGF0aD4KCQk8cG9seWdvbiBjbGlwLXBhdGg9InVybCgjU1ZHSURfMjJfKSIgZmlsbD0iIzAwNjA5QyIgcG9pbnRzPSI4Ljc5Niw5LjQ1MyAxMC4yMTUsNC4yODYgMTIuMDQ4LDQuMjg2IDExLjMwNCw5LjQ1MyAJCSIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8yM18iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMjRfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMjNfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8yNF8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMTIuOTY2LDEuOTg0di0wLjAxYy0wLjAxLTAuMDExLTAuMDIxLTAuMDMxLTAuMDQxLTAuMDUyCgkJCWMtMC4wMzEtMC4wNTItMC4wOTMtMC4xMTgtMC4xODYtMC4yMDJjLTAuMTc1LTAuMTQ4LTAuNDU0LTAuMzMtMC45MjktMC40MThjLTAuMjI3LTAuMDQxLTAuNDIzLTAuMDQxLTAuNTg4LTAuMDI1CgkJCWMtMC40MTMsMC4wNDctMC42NjEsMC4yMDctMC43NDksMC4yNzljLTAuMDI1LDAuMDIxLTAuMDMxLDAuMDI1LTAuMDMxLDAuMDI1bDAsMGMtMC4xMTQsMC4xMTMtMC4zMDUsMC4xMTMtMC40MjMsMAoJCQljLTAuMTEzLTAuMTE5LTAuMTEzLTAuMzA1LDAtMC40MjRjMC4wMzEtMC4wMywwLjQxMy0wLjM5NywxLjE0MS0wLjQ3NWMwLjIyOC0wLjAyMSwwLjQ3NS0wLjAxNywwLjc2NCwwLjAzNQoJCQljMS4xNTYsMC4yMDEsMS41NTksMC45NDQsMS41OCwwLjk5NmMwLjA3MiwwLjE0NSwwLjAxLDAuMzI1LTAuMTM0LDAuNDAyYy0wLjAzMSwwLjAxNi0wLjA3MiwwLjAyNS0wLjEwMywwLjAyNQoJCQlDMTMuMTQyLDIuMTYsMTMuMDI4LDIuMDk4LDEyLjk2NiwxLjk4NCIvPgoJPC9nPgoJPGc+CgkJPGRlZnM+CgkJCTxyZWN0IGlkPSJTVkdJRF8yNV8iIHk9IjAuNTM5IiB3aWR0aD0iNzQiIGhlaWdodD0iMTAuOTIyIi8+CgkJPC9kZWZzPgoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMjZfIj4KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMjVfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4KCQk8L2NsaXBQYXRoPgoJCTxwYXRoIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8yNl8pIiBmaWxsPSIjRjM4QjAwIiBkPSJNMTIuMjIzLDIuNjY2YzAsMCwwLTAuMDA2LTAuMDEtMC4wMzFjLTAuMDIxLTAuMDIxLTAuMDUyLTAuMDYyLTAuMTAzLTAuMTA0CgkJCWMtMC4wOTMtMC4wODItMC4yNTgtMC4xODYtMC41MTctMC4yMzJjLTAuMTM0LTAuMDI1LTAuMjQ4LTAuMDI1LTAuMzQtMC4wMTVjLTAuMjE3LDAuMDI0LTAuMzYxLDAuMTEyLTAuNDAzLDAuMTQ5CgkJCWMtMC4wMSwwLjAxLTAuMDEsMC4wMS0wLjAxLDAuMDFjLTAuMDkzLDAuMDk5LTAuMjU4LDAuMDk5LTAuMzUxLDBjLTAuMDk4LTAuMDk4LTAuMDk4LTAuMjU0LDAtMC4zNTIKCQkJYzAuMDIxLTAuMDI1LDAuMjU4LTAuMjU4LDAuNzIzLTAuMzA1YzAuMTM0LTAuMDE2LDAuMjg5LTAuMDEsMC40NjUsMC4wMjFjMC43MjMsMC4xMjksMC45OCwwLjU4OCwwLjk5MSwwLjYyOQoJCQljMC4wNjIsMC4xMjUsMC4wMjEsMC4yNzMtMC4xMDMsMC4zMzZjLTAuMDMxLDAuMDExLTAuMDYyLDAuMDIxLTAuMDkzLDAuMDI1QzEyLjM3OCwyLjgxMSwxMi4yNzUsMi43NTksMTIuMjIzLDIuNjY2Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzI3XyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8yOF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8yN18iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzI4XykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik0xMi4wMTcsMy4yNzNjMCwwLjMwNi0wLjI4OSwwLjU1NC0wLjY1LDAuNTQ5CgkJCWMtMC4zNjEsMC0wLjY1LTAuMjQ4LTAuNjQtMC41NTNjMC0wLjMxMSwwLjI4OS0wLjU1OSwwLjY0LTAuNTUzQzExLjcyOCwyLjcxOCwxMi4wMTcsMi45NzEsMTIuMDE3LDMuMjczIi8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzI5XyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8zMF8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8yOV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzMwXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik03Mi40NDEsMS4wNzZoMC41MjVjMC4xMjQsMCwwLjIxNywwLjAyNSwwLjI3OCwwLjA3NgoJCQljMC4wNjIsMC4wNTgsMC4wOTMsMC4xMywwLjA5MywwLjIyM2MwLDAuMDUyLTAuMDEsMC4xLTAuMDI5LDAuMTM1Yy0wLjAxMiwwLjAzNi0wLjAzMSwwLjA2Mi0wLjA1MywwLjA4MgoJCQlzLTAuMDQxLDAuMDM2LTAuMDYyLDAuMDQ3Yy0wLjAyMSwwLjAxLTAuMDI5LDAuMDE2LTAuMDQxLDAuMDIxbDAsMGMwLjAxMiwwLjAwNSwwLjAzMSwwLjAxMSwwLjA1MywwLjAxNgoJCQljMC4wMjEsMC4wMSwwLjA0MSwwLjAyMSwwLjA1MiwwLjA0MWMwLjAyMSwwLjAxNiwwLjAzMSwwLjA0MSwwLjA0MSwwLjA2N2MwLjAxMSwwLjAzLDAuMDIxLDAuMDY3LDAuMDIxLDAuMTEyCgkJCWMwLDAuMDYyLDAsMC4xMjUsMC4wMTIsMC4xNzdjMC4wMSwwLjA1MiwwLjAzMSwwLjA5MywwLjA1MiwwLjExMmgtMC4yMDdjLTAuMDIxLTAuMDIxLTAuMDMtMC4wNDUtMC4wMy0wLjA3NnMwLTAuMDU4LDAtMC4wODQKCQkJYzAtMC4wNTEtMC4wMTEtMC4wOTgtMC4wMTEtMC4xMzNjLTAuMDExLTAuMDM3LTAuMDIxLTAuMDY3LTAuMDQxLTAuMDk0Yy0wLjAxMS0wLjAyMS0wLjAzLTAuMDQyLTAuMDYyLTAuMDUyCgkJCWMtMC4wMy0wLjAxMS0wLjA2Mi0wLjAxNy0wLjExMy0wLjAxN2gtMC4yNzd2MC40NTVoLTAuMTk3VjEuMDc2SDcyLjQ0MXogTTcyLjYzOSwxLjU4MmgwLjMxOGMwLjA2MiwwLDAuMTA0LTAuMDE2LDAuMTM1LTAuMDQ3CgkJCWMwLjAzLTAuMDI1LDAuMDUzLTAuMDcyLDAuMDUzLTAuMTI5YzAtMC4wMzYtMC4wMTItMC4wNjctMC4wMjEtMC4wODhjLTAuMDEtMC4wMjEtMC4wMjEtMC4wNDEtMC4wNDEtMC4wNTMKCQkJYy0wLjAyMS0wLjAxNi0wLjAzMS0wLjAyMS0wLjA2Mi0wLjAyNGMtMC4wMjEtMC4wMDUtMC4wNDEtMC4wMDUtMC4wNzEtMC4wMDVoLTAuMzFWMS41ODJ6Ii8+Cgk8L2c+Cgk8Zz4KCQk8ZGVmcz4KCQkJPHJlY3QgaWQ9IlNWR0lEXzMxXyIgeT0iMC41MzkiIHdpZHRoPSI3NCIgaGVpZ2h0PSIxMC45MjIiLz4KCQk8L2RlZnM+CgkJPGNsaXBQYXRoIGlkPSJTVkdJRF8zMl8iPgoJCQk8dXNlIHhsaW5rOmhyZWY9IiNTVkdJRF8zMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPgoJCTwvY2xpcFBhdGg+CgkJPHBhdGggY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzMyXykiIGZpbGw9IiNGMzhCMDAiIGQ9Ik03Mi44NTQsMi44MzZjLTAuNjI5LDAtMS4xNDYtMC41MTYtMS4xNDYtMS4xNQoJCQljMC0wLjYyOSwwLjUxNy0xLjE0NiwxLjE0Ni0xLjE0NlM3NCwxLjA1Nyw3NCwxLjY4NkM3NCwyLjMyLDczLjQ4MiwyLjgzNiw3Mi44NTQsMi44MzYgTTcyLjg1NCwwLjc0NQoJCQljLTAuNTE3LDAtMC45MzgsMC40MjQtMC45MzgsMC45MzhjMCwwLjUyMSwwLjQyMywwLjk0NSwwLjkzOCwwLjk0NWMwLjUxNywwLDAuOTM5LTAuNDI0LDAuOTM5LTAuOTQ1CgkJCUM3My43OTQsMS4xNjksNzMuMzcsMC43NDUsNzIuODU0LDAuNzQ1Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg=="

/***/ }),
/* 680 */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICAgIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRjgwIiByeD0iMy43NSIvPgogICAgICAgIDxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik01Ljg0NiAyaDQuMzA4YzEuMzM3IDAgMS44MjIuMTQgMi4zMTEuNC40OS4yNjIuODczLjY0NiAxLjEzNCAxLjEzNS4yNjIuNDg5LjQwMS45NzQuNDAxIDIuMzF2Ny45NzZjMCAuMDYyLS4wMDYuMDg1LS4wMTkuMTA4YS4xMjcuMTI3IDAgMCAxLS4wNTIuMDUyYy0uMDIzLjAxMy0uMDQ2LjAxOS0uMTA4LjAxOUg1Ljg0NmMtMS4zMzcgMC0xLjgyMi0uMTQtMi4zMTEtLjRBMi43MjYgMi43MjYgMCAwIDEgMi40IDEyLjQ2NGMtLjI2Mi0uNDg5LS40MDEtLjk3NC0uNDAxLTIuMzF2LTQuMzFjMC0xLjMzNi4xNC0xLjgyMS40LTIuMzFBMi43MjYgMi43MjYgMCAwIDEgMy41MzYgMi40QzQuMDI0IDIuMTM5IDQuNTA5IDIgNS44NDUgMnoiLz4KICAgICAgICA8cGF0aCBmaWxsPSIjMDY4NEJEIiBkPSJNNS4wNzggMy44MTNoNS44NGMuNyAwIDEuMjY2LjU2NiAxLjI2NiAxLjI2NXYyLjk1M2MwIC45MjUtLjg3NCAxLjUwNS0xLjUxMSAxLjY5Mi4yODUuNTQuNzMzIDEuMzU2IDEuMzQzIDIuNDQ5SDkuOTUzTDguNTkyIDkuODE1aC0uMDg4YS4yOC4yOCAwIDAgMS0uMjgtLjI4VjcuODgzaDEuODk4VjUuODczSDUuODgxdjMuNjA0YzAgLjYuMTE4IDEuNjQgMS4wMjUgMi42OTVINC44NDNjLS43NTgtLjU1NS0xLjAzLTEuNjg5LTEuMDMtMi4zNTdWNS4wNzhjMC0uNjk5LjU2Ni0xLjI2NiAxLjI2NS0xLjI2NnoiLz4KICAgIDwvZz4KPC9zdmc+Cg=="

/***/ }),
/* 681 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(__webpack_require__(68));

var _createClass2 = _interopRequireDefault(__webpack_require__(79));

var _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(74));

var _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(71));

var _get2 = _interopRequireDefault(__webpack_require__(149));

var _inherits2 = _interopRequireDefault(__webpack_require__(75));

var _classnames = _interopRequireDefault(__webpack_require__(23));

var _AdapterCore2 = _interopRequireDefault(__webpack_require__(682));

var _url = _interopRequireDefault(__webpack_require__(147));

var _parseUri2 = _interopRequireDefault(__webpack_require__(310));

var _messageTypes = _interopRequireDefault(__webpack_require__(407));

var _requestWithPostMessage2 = _interopRequireDefault(__webpack_require__(411));

var _styles = _interopRequireDefault(__webpack_require__(683));

var _notification = _interopRequireDefault(__webpack_require__(685));

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
    _this._webphoneActive = false;
    window.addEventListener('beforeunload', function (e) {
      if (_this._webphoneActive && _this._webphoneCalls.length > 0) {
        e.preventDefault;
        var message = 'Calls are active on this tab. Are you sure to leave?';
        e.returnValue = message;
        return message;
      }
    });
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

          case 'rc-webphone-active-notify':
            this._webphoneActive = data.currentActive;
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
      var sandboxAttributes = sanboxAttributeValue; // TODO: fix in widgets lib

      if (sandboxAttributes.indexOf('allow-downloads') === -1) {
        sandboxAttributes = "".concat(sandboxAttributes, " allow-downloads"); // For Google Chrome v83
      }

      return "\n      <header class=\"".concat(this._styles.header, "\" draggable=\"false\">\n        <div class=\"").concat(this._styles.presence, " ").concat(this._styles.NoPresence, "\">\n          <div class=\"").concat(this._styles.presenceBar, "\">\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.iconContainer, "\">\n          <img class=\"").concat(this._styles.icon, "\" draggable=\"false\"></img>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.toggle, "\" data-sign=\"adapterToggle\">\n          <div class=\"").concat(this._styles.minimizeIcon, "\">\n            <div class=\"").concat(this._styles.minimizeIconBar, "\"></div>\n          </div>\n        </div>\n        <img class=\"").concat(this._styles.logo, "\" draggable=\"false\"></img>\n        <div class=\"").concat(this._styles.duration, "\"></div>\n        <div class=\"").concat(this._styles.ringingCalls, "\"></div>\n        <div class=\"").concat(this._styles.onHoldCalls, "\"></div>\n        <div class=\"").concat(this._styles.currentCallBtn, "\"></div>\n        <div class=\"").concat(this._styles.viewCallsBtn, "\"></div>\n      </header>\n      <div class=\"").concat(this._styles.dropdownPresence, "\">\n        <div class=\"").concat(this._styles.line, "\">\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"available\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Available, "\">\n            </div>\n            <span>").concat(this._strings.availableBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"busy\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Busy, "\">\n            </div>\n            <span>").concat(this._strings.busyBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"doNotAcceptAnyCalls\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.DoNotAcceptAnyCalls, "\">\n              <div class=\"").concat(this._styles.presenceBar, "\"></div>\n            </div>\n            <span>").concat(this._strings.doNotAcceptAnyCallsBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"offline\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Offline, "\">\n            </div>\n            <span>").concat(this._strings.offlineBtn, "</span>\n          </a>\n        </div>\n      </div>\n      <div class=\"").concat(this._styles.frameContainer, "\">\n        <iframe class=\"").concat(this._styles.contentFrame, "\" sandbox=\"").concat(sandboxAttributes, "\" allow=\"").concat(allowAttributeValue, "\" >\n        </iframe>\n      </div>");
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
    value: function clickToSMS(phoneNumber, text, conversation) {
      this.setMinimized(false);

      this._postMessage({
        type: 'rc-adapter-new-sms',
        phoneNumber: phoneNumber,
        text: text,
        conversation: conversation
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
/* 682 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

__webpack_require__(1);

__webpack_require__(12);

__webpack_require__(76);

var _classnames = _interopRequireDefault(__webpack_require__(23));

var _ObjectMap = __webpack_require__(26);

var _ensureExist = _interopRequireDefault(__webpack_require__(80));

var _debounce = _interopRequireDefault(__webpack_require__(160));

var _presenceStatus = __webpack_require__(296);

var _dndStatus = _interopRequireDefault(__webpack_require__(216));

var _formatDuration = _interopRequireDefault(__webpack_require__(230));

var _baseMessageTypes = __webpack_require__(277);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SANDBOX_ATTRIBUTE_VALUE = ['allow-same-origin', 'allow-scripts', 'allow-forms', 'allow-popups'].join(' '); // chrome 63 mandate the declaration of this attribute for getUserMedia to work in iframes

var ALLOW_ATTRIBUTE_VALUE = ['microphone' // 'camera',
].join(' ');
var urlRegex = /(https:\/\/)?(?:www\.)?outlook\.office(?:365)?\.com\/(mail)\/(deeplink)/;
var clickEvent = urlRegex.test(window.location.href) ? 'mousedown' : 'click';
var ON_HOLD_CALLS = 0;
var RINGING_CALLS = 1;
var CURRENT_CALL = 2;
var ROTATE_LENGTH = 3;
var ROTATE_INTERVAL = 5000;

var AdapterCore = /*#__PURE__*/function () {
  function AdapterCore(_ref) {
    var _this = this;

    var prefix = _ref.prefix,
        styles = _ref.styles,
        container = _ref.container,
        _ref$root = _ref.root,
        root = _ref$root === void 0 ? container : _ref$root,
        _ref$messageTypes = _ref.messageTypes,
        messageTypes = _ref$messageTypes === void 0 ? _baseMessageTypes.baseMessageTypes : _ref$messageTypes,
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

    this._onWindowMouseMove = function (evt) {
      if (_this._dragging) {
        if (evt.buttons === 0) {
          _this._dragging = false;

          _this._renderMainClass();

          return;
        }

        var factor = _this._calculateFactor();

        var delta = {
          x: evt.clientX - _this._dragStartPosition.x,
          y: evt.clientY - _this._dragStartPosition.y
        };

        if (_this._minimized) {
          _this._minTranslateX = _this._dragStartPosition.minTranslateX + delta.x * factor;
          _this._minTranslateY = _this._dragStartPosition.minTranslateY + delta.y;
        } else {
          _this._translateX = _this._dragStartPosition.translateX + delta.x * factor;
          _this._translateY = _this._dragStartPosition.translateY + delta.y;
        }

        if (delta.x !== 0 || delta.y !== 0) {
          _this._isClick = false;
        }

        _this._syncPosition();

        _this._renderRestrictedPosition();
      }
    };

    this._debouncedPostMessage = (0, _debounce["default"])(this._postMessage, 100);
    this._prefix = prefix;
    this._messageTypes = _ObjectMap.ObjectMap.prefixValues(messageTypes, prefix);
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
      return "\n      <header class=\"".concat(this._styles.header, "\" draggable=\"false\">\n        <div class=\"").concat(this._styles.presence, " ").concat(this._styles.noPresence, "\">\n          <div class=\"").concat(this._styles.presenceBar, "\">\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.toggle, "\">\n          <div class=\"").concat(this._styles.minimizeIcon, "\">\n            <div class=\"").concat(this._styles.minimizeIconBar, "\"></div>\n          </div>\n        </div>\n        <div class=\"").concat(this._styles.button, " ").concat(this._styles.close, "\">\n          <div class=\"").concat(this._styles.closeIcon, "\">\n            <div></div><div></div>\n          </div>\n        </div>\n        <img class=\"").concat(this._styles.logo, "\" draggable=\"false\"></img>\n        <div class=\"").concat(this._styles.duration, "\"></div>\n        <div class=\"").concat(this._styles.ringingCalls, "\"></div>\n        <div class=\"").concat(this._styles.onHoldCalls, "\"></div>\n        <div class=\"").concat(this._styles.currentCallBtn, "\">").concat(this._strings.currentCallBtn, "</div>\n        <div class=\"").concat(this._styles.viewCallsBtn, "\">").concat(this._strings.viewCallsBtn, "</div>\n      </header>\n      <div class=\"").concat(this._styles.dropdownPresence, "\">\n        <div class=\"").concat(this._styles.line, "\">\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"available\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Available, "\">\n            </div>\n            <span>").concat(this._strings.availableBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"busy\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Busy, "\">\n            </div>\n            <span>").concat(this._strings.busyBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"doNotAcceptAnyCalls\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.DoNotAcceptAnyCalls, "\">\n              <div class=\"").concat(this._styles.presenceBar, "\"></div>\n            </div>\n            <span>").concat(this._strings.doNotAcceptAnyCallsBtn, "</span>\n          </a>\n          <a class=\"").concat(this._styles.presenceItem, "\" data-presence=\"offline\">\n            <div class=\"").concat(this._styles.presence, " ").concat(this._styles.statusIcon, " ").concat(this._styles.Offline, "\">\n            </div>\n            <span>").concat(this._strings.offlineBtn, "</span>\n          </a>\n        </div>\n      </div>\n      <div class=\"").concat(this._styles.frameContainer, "\">\n        <iframe class=\"").concat(this._styles.contentFrame, "\" sandbox=\"").concat(sanboxAttributeValue, "\" allow=\"").concat(allowAttributeValue, "\" >\n        </iframe>\n      </div>");
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

      this._toggleEl.addEventListener(clickEvent, function (evt) {
        evt.stopPropagation();

        _this2.toggleMinimized();
      }); // close button


      this._closeEl = this._root.querySelector(".".concat(this._styles.close));

      if (this._closeEl) {
        this._closeEl.addEventListener(clickEvent, function () {
          _this2.setClosed(true);
        });
      }

      this._presenceEl = this._root.querySelector(".".concat(this._styles.presence));

      this._presenceEl.addEventListener(clickEvent, function (evt) {
        evt.stopPropagation();

        _this2.togglePresenceDropdown();
      });

      this._presenceItemEls = this._root.querySelectorAll(".".concat(this._styles.presenceItem));

      this._presenceItemEls.forEach(function (itemEl) {
        var dataPresence = itemEl.getAttribute('data-presence');
        itemEl.addEventListener(clickEvent, function (evt) {
          evt.stopPropagation();

          _this2.togglePresenceDropdown();

          _this2._postMessage({
            type: _this2._messageTypes.presenceItemClicked,
            presenceType: _presenceStatus.presenceStatus[dataPresence] || _dndStatus["default"][dataPresence]
          });
        });
      });

      this._dropdownPresence = this._root.querySelector(".".concat(this._styles.dropdownPresence));

      if (this._dropdownPresence) {
        this._dropdownPresence.addEventListener(clickEvent, function (evt) {
          evt.stopPropagation();

          _this2.togglePresenceDropdown();
        });
      }

      this._contentFrameEl = this._root.querySelector(".".concat(this._styles.contentFrame));
      this._durationEl = this._root.querySelector(".".concat(this._styles.duration));

      this._durationEl.addEventListener(clickEvent, function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToCurrentCall
        });
      });

      this._currentCallEl = this._root.querySelector(".".concat(this._styles.currentCallBtn));

      this._currentCallEl.addEventListener(clickEvent, function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToCurrentCall
        });
      });

      this._viewCallsEl = this._root.querySelector(".".concat(this._styles.viewCallsBtn));

      this._viewCallsEl.addEventListener(clickEvent, function (evt) {
        evt.stopPropagation();

        _this2._postMessage({
          type: _this2._messageTypes.navigateToViewCalls
        });
      });

      this._ringingCallsEl = this._root.querySelector(".".concat(this._styles.ringingCalls));
      this._onHoldCallsEl = this._root.querySelector(".".concat(this._styles.onHoldCalls));

      this._headerEl.addEventListener('mousedown', function (evt) {
        _this2._dragging = true;
        _this2._isClick = true;
        _this2._dragStartPosition = {
          x: evt.clientX,
          y: evt.clientY,
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

      this._headerEl.addEventListener(clickEvent, function (evt) {
        if (_this2._isClick) {
          _this2._onHeaderClicked(evt);
        }
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
    key: "_onHeaderClicked",
    value: function _onHeaderClicked() {
      if (this._minimized) {
        this.toggleMinimized();
      }
    }
  }, {
    key: "togglePresenceDropdown",
    value: function togglePresenceDropdown() {
      if (this._dropdownPresence) {
        this._dropdownPresence.classList.toggle("".concat(this._styles.showDropdown));

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

      if (minimized && this._dropdownPresence) {
        this._dropdownPresence.classList.remove("".concat(this._styles.showDropdown));
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
  }]);

  return AdapterCore;
}();

exports["default"] = AdapterCore;
//# sourceMappingURL=index.js.map


/***/ }),
/* 683 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(684);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(28)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 684 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(27)(false);
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
/* 685 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(13);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(__webpack_require__(68));

var _createClass2 = _interopRequireDefault(__webpack_require__(79));

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

/***/ })
/******/ ]);