var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/lodash.isplainobject/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.isplainobject/index.js"(exports, module) {
    var objectTag = "[object Object]";
    function isHostObject(value2) {
      var result = false;
      if (value2 != null && typeof value2.toString != "function") {
        try {
          result = !!(value2 + "");
        } catch (e) {
        }
      }
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    var objectToString = objectProto.toString;
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    function isObjectLike(value2) {
      return !!value2 && typeof value2 == "object";
    }
    function isPlainObject3(value2) {
      if (!isObjectLike(value2) || objectToString.call(value2) != objectTag || isHostObject(value2)) {
        return false;
      }
      var proto = getPrototype(value2);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    module.exports = isPlainObject3;
  }
});

// node_modules/rfc6902/pointer.js
var require_pointer = __commonJS({
  "node_modules/rfc6902/pointer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Pointer = void 0;
    exports.unescapeToken = unescapeToken;
    exports.escapeToken = escapeToken;
    function unescapeToken(token) {
      return token.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    function escapeToken(token) {
      return token.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    var Pointer = (
      /** @class */
      function() {
        function Pointer2(tokens) {
          if (tokens === void 0) {
            tokens = [""];
          }
          this.tokens = tokens;
        }
        Pointer2.fromJSON = function(path) {
          var tokens = path.split("/").map(unescapeToken);
          if (tokens[0] !== "")
            throw new Error("Invalid JSON Pointer: ".concat(path));
          return new Pointer2(tokens);
        };
        Pointer2.prototype.toString = function() {
          return this.tokens.map(escapeToken).join("/");
        };
        Pointer2.prototype.evaluate = function(object2) {
          var parent = null;
          var key = "";
          var value2 = object2;
          for (var i2 = 1, l2 = this.tokens.length; i2 < l2; i2++) {
            parent = value2;
            key = this.tokens[i2];
            if (key == "__proto__" || key == "constructor" || key == "prototype") {
              continue;
            }
            value2 = (parent || {})[key];
          }
          return { parent, key, value: value2 };
        };
        Pointer2.prototype.get = function(object2) {
          return this.evaluate(object2).value;
        };
        Pointer2.prototype.set = function(object2, value2) {
          var endpoint = this.evaluate(object2);
          if (endpoint.parent) {
            endpoint.parent[endpoint.key] = value2;
          }
        };
        Pointer2.prototype.push = function(token) {
          this.tokens.push(token);
        };
        Pointer2.prototype.add = function(token) {
          var tokens = this.tokens.concat(String(token));
          return new Pointer2(tokens);
        };
        Pointer2.prototype.parent = function() {
          var tokens = this.tokens.length > 1 ? this.tokens.slice(0, -1) : [""];
          return new Pointer2(tokens);
        };
        return Pointer2;
      }()
    );
    exports.Pointer = Pointer;
  }
});

// node_modules/rfc6902/util.js
var require_util = __commonJS({
  "node_modules/rfc6902/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasOwnProperty = void 0;
    exports.objectType = objectType;
    exports.clone = clone;
    exports.hasOwnProperty = Object.prototype.hasOwnProperty;
    function objectType(object2) {
      if (object2 === void 0) {
        return "undefined";
      }
      if (object2 === null) {
        return "null";
      }
      if (Array.isArray(object2)) {
        return "array";
      }
      return typeof object2;
    }
    function isNonPrimitive(value2) {
      return value2 != null && typeof value2 == "object";
    }
    function clone(source) {
      if (!isNonPrimitive(source)) {
        return source;
      }
      if (source.constructor == Array) {
        var length = source.length;
        var arrayTarget = new Array(length);
        for (var i2 = 0; i2 < length; i2++) {
          arrayTarget[i2] = clone(source[i2]);
        }
        return arrayTarget;
      }
      if (source.constructor == Date) {
        var dateTarget = /* @__PURE__ */ new Date(+source);
        return dateTarget;
      }
      var objectTarget = {};
      for (var key in source) {
        if (exports.hasOwnProperty.call(source, key)) {
          objectTarget[key] = clone(source[key]);
        }
      }
      return objectTarget;
    }
  }
});

// node_modules/rfc6902/diff.js
var require_diff = __commonJS({
  "node_modules/rfc6902/diff.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isDestructive = isDestructive;
    exports.subtract = subtract;
    exports.intersection = intersection;
    exports.diffArrays = diffArrays;
    exports.diffObjects = diffObjects;
    exports.diffAny = diffAny;
    var util_1 = require_util();
    function isDestructive(_a) {
      var op = _a.op;
      return op === "remove" || op === "replace" || op === "copy" || op === "move";
    }
    function subtract(minuend, subtrahend) {
      var keys2 = [];
      for (var key in minuend) {
        if (util_1.hasOwnProperty.call(minuend, key) && minuend[key] !== void 0 && !(util_1.hasOwnProperty.call(subtrahend, key) && subtrahend[key] !== void 0)) {
          keys2.push(key);
        }
      }
      return keys2;
    }
    function intersection(objects) {
      var length = objects.length;
      var counter = {};
      for (var i2 = 0; i2 < length; i2++) {
        var object2 = objects[i2];
        for (var key in object2) {
          if (util_1.hasOwnProperty.call(object2, key) && object2[key] !== void 0) {
            counter[key] = (counter[key] || 0) + 1;
          }
        }
      }
      for (var key in counter) {
        if (counter[key] < length) {
          delete counter[key];
        }
      }
      return Object.keys(counter);
    }
    function intersection2(a2, b2) {
      var keys2 = [];
      for (var key in a2) {
        if (util_1.hasOwnProperty.call(a2, key) && a2[key] !== void 0 && util_1.hasOwnProperty.call(b2, key) && b2[key] !== void 0) {
          keys2.push(key);
        }
      }
      return keys2;
    }
    function isArrayAdd(array_operation) {
      return array_operation.op === "add";
    }
    function isArrayRemove(array_operation) {
      return array_operation.op === "remove";
    }
    function appendArrayOperation(base, operation) {
      return {
        // the new operation must be pushed on the end
        operations: base.operations.concat(operation),
        cost: base.cost + 1
      };
    }
    function diffArrays(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      var max_length = Math.max(input.length, output.length);
      var memo = /* @__PURE__ */ new Map([[0, { operations: [], cost: 0 }]]);
      function dist(i2, j2) {
        var memo_key = i2 * (max_length + 1) + j2;
        var memoized = memo.get(memo_key);
        if (memoized === void 0) {
          if (i2 > 0 && j2 > 0 && !diff(input[i2 - 1], output[j2 - 1], ptr.add(String(i2 - 1))).length) {
            memoized = dist(i2 - 1, j2 - 1);
          } else {
            var alternatives = [];
            if (i2 > 0) {
              var remove_base = dist(i2 - 1, j2);
              var remove_operation = {
                op: "remove",
                index: i2 - 1
              };
              alternatives.push(appendArrayOperation(remove_base, remove_operation));
            }
            if (j2 > 0) {
              var add_base = dist(i2, j2 - 1);
              var add_operation = {
                op: "add",
                index: i2 - 1,
                value: output[j2 - 1]
              };
              alternatives.push(appendArrayOperation(add_base, add_operation));
            }
            if (i2 > 0 && j2 > 0) {
              var replace_base = dist(i2 - 1, j2 - 1);
              var replace_operation = {
                op: "replace",
                index: i2 - 1,
                original: input[i2 - 1],
                value: output[j2 - 1]
              };
              alternatives.push(appendArrayOperation(replace_base, replace_operation));
            }
            var best = alternatives.sort(function(a2, b2) {
              return a2.cost - b2.cost;
            })[0];
            memoized = best;
          }
          memo.set(memo_key, memoized);
        }
        return memoized;
      }
      var input_length = isNaN(input.length) || input.length <= 0 ? 0 : input.length;
      var output_length = isNaN(output.length) || output.length <= 0 ? 0 : output.length;
      var array_operations = dist(input_length, output_length).operations;
      var padded_operations = array_operations.reduce(function(_a, array_operation) {
        var operations = _a[0], padding = _a[1];
        if (isArrayAdd(array_operation)) {
          var padded_index = array_operation.index + 1 + padding;
          var index_token = padded_index < input_length + padding ? String(padded_index) : "-";
          var operation = {
            op: array_operation.op,
            path: ptr.add(index_token).toString(),
            value: array_operation.value
          };
          return [operations.concat(operation), padding + 1];
        } else if (isArrayRemove(array_operation)) {
          var operation = {
            op: array_operation.op,
            path: ptr.add(String(array_operation.index + padding)).toString()
          };
          return [operations.concat(operation), padding - 1];
        } else {
          var replace_ptr = ptr.add(String(array_operation.index + padding));
          var replace_operations = diff(array_operation.original, array_operation.value, replace_ptr);
          return [operations.concat.apply(operations, replace_operations), padding];
        }
      }, [[], 0])[0];
      return padded_operations;
    }
    function diffObjects(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      var operations = [];
      subtract(input, output).forEach(function(key) {
        operations.push({ op: "remove", path: ptr.add(key).toString() });
      });
      subtract(output, input).forEach(function(key) {
        operations.push({ op: "add", path: ptr.add(key).toString(), value: output[key] });
      });
      intersection2(input, output).forEach(function(key) {
        operations.push.apply(operations, diff(input[key], output[key], ptr.add(key)));
      });
      return operations;
    }
    function diffAny(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      if (input === output) {
        return [];
      }
      var input_type = (0, util_1.objectType)(input);
      var output_type = (0, util_1.objectType)(output);
      if (input_type == "array" && output_type == "array") {
        return diffArrays(input, output, ptr, diff);
      }
      if (input_type == "object" && output_type == "object") {
        return diffObjects(input, output, ptr, diff);
      }
      return [{ op: "replace", path: ptr.toString(), value: output }];
    }
  }
});

// node_modules/rfc6902/patch.js
var require_patch = __commonJS({
  "node_modules/rfc6902/patch.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d2, b2) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b3) {
          d3.__proto__ = b3;
        } || function(d3, b3) {
          for (var p2 in b3) if (Object.prototype.hasOwnProperty.call(b3, p2)) d3[p2] = b3[p2];
        };
        return extendStatics(d2, b2);
      };
      return function(d2, b2) {
        if (typeof b2 !== "function" && b2 !== null)
          throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
        extendStatics(d2, b2);
        function __() {
          this.constructor = d2;
        }
        d2.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidOperationError = exports.TestError = exports.MissingError = void 0;
    exports.add = add;
    exports.remove = remove;
    exports.replace = replace;
    exports.move = move;
    exports.copy = copy2;
    exports.test = test;
    exports.apply = apply;
    var pointer_1 = require_pointer();
    var util_1 = require_util();
    var diff_1 = require_diff();
    var MissingError = (
      /** @class */
      function(_super) {
        __extends(MissingError2, _super);
        function MissingError2(path) {
          var _this = _super.call(this, "Value required at path: ".concat(path)) || this;
          _this.path = path;
          _this.name = "MissingError";
          return _this;
        }
        return MissingError2;
      }(Error)
    );
    exports.MissingError = MissingError;
    var TestError = (
      /** @class */
      function(_super) {
        __extends(TestError2, _super);
        function TestError2(actual, expected) {
          var _this = _super.call(this, "Test failed: ".concat(actual, " != ").concat(expected)) || this;
          _this.actual = actual;
          _this.expected = expected;
          _this.name = "TestError";
          return _this;
        }
        return TestError2;
      }(Error)
    );
    exports.TestError = TestError;
    function _add(object2, key, value2) {
      if (Array.isArray(object2)) {
        if (key == "-") {
          object2.push(value2);
        } else {
          var index = parseInt(key, 10);
          object2.splice(index, 0, value2);
        }
      } else {
        object2[key] = value2;
      }
    }
    function _remove(object2, key) {
      if (Array.isArray(object2)) {
        var index = parseInt(key, 10);
        object2.splice(index, 1);
      } else {
        delete object2[key];
      }
    }
    function add(object2, operation, options) {
      var pointer = pointer_1.Pointer.fromJSON(operation.path);
      if ((options === null || options === void 0 ? void 0 : options.implicitArrayCreation) && pointer.tokens[pointer.tokens.length - 1] === "-") {
        var parentEndpoint = pointer.parent().evaluate(object2);
        if (parentEndpoint.value === void 0 && (0, util_1.objectType)(parentEndpoint.parent) === "object") {
          parentEndpoint.parent[parentEndpoint.key] = [];
        }
      }
      var endpoint = pointer.evaluate(object2);
      if (endpoint.parent === void 0 || endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      if ((options === null || options === void 0 ? void 0 : options.implicitArrayCreation) && endpoint.key === "-" && !Array.isArray(endpoint.parent)) {
        return new MissingError(operation.path);
      }
      _add(endpoint.parent, endpoint.key, (0, util_1.clone)(operation.value));
      return null;
    }
    function remove(object2, operation, options) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object2);
      if (endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      if (endpoint.value === void 0) {
        return new MissingError(operation.path);
      }
      _remove(endpoint.parent, endpoint.key);
      return null;
    }
    function replace(object2, operation, options) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object2);
      if (endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      if (Array.isArray(endpoint.parent)) {
        if (parseInt(endpoint.key, 10) >= endpoint.parent.length) {
          return new MissingError(operation.path);
        }
      } else if (endpoint.value === void 0) {
        return new MissingError(operation.path);
      }
      endpoint.parent[endpoint.key] = (0, util_1.clone)(operation.value);
      return null;
    }
    function move(object2, operation, options) {
      var from_pointer = pointer_1.Pointer.fromJSON(operation.from);
      var from_endpoint = from_pointer.evaluate(object2);
      if (from_endpoint.value === void 0) {
        return new MissingError(operation.from);
      }
      var pointer = pointer_1.Pointer.fromJSON(operation.path);
      if (from_pointer.tokens.length < pointer.tokens.length && from_pointer.tokens.every(function(token, index) {
        return token === pointer.tokens[index];
      })) {
        return new MissingError(operation.path);
      }
      var endpoint = pointer.evaluate(object2);
      if (endpoint.parent === void 0 || endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      _remove(from_endpoint.parent, from_endpoint.key);
      _add(endpoint.parent, endpoint.key, from_endpoint.value);
      return null;
    }
    function copy2(object2, operation, options) {
      var from_endpoint = pointer_1.Pointer.fromJSON(operation.from).evaluate(object2);
      if (from_endpoint.value === void 0) {
        return new MissingError(operation.from);
      }
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object2);
      if (endpoint.parent === void 0 || endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      _add(endpoint.parent, endpoint.key, (0, util_1.clone)(from_endpoint.value));
      return null;
    }
    function test(object2, operation, options) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object2);
      if ((0, diff_1.diffAny)(endpoint.value, operation.value, new pointer_1.Pointer()).length) {
        return new TestError(endpoint.value, operation.value);
      }
      return null;
    }
    var InvalidOperationError = (
      /** @class */
      function(_super) {
        __extends(InvalidOperationError2, _super);
        function InvalidOperationError2(operation) {
          var _this = _super.call(this, "Invalid operation: ".concat(operation.op)) || this;
          _this.operation = operation;
          _this.name = "InvalidOperationError";
          return _this;
        }
        return InvalidOperationError2;
      }(Error)
    );
    exports.InvalidOperationError = InvalidOperationError;
    function apply(object2, operation, options) {
      switch (operation.op) {
        case "add":
          return add(object2, operation, options);
        case "remove":
          return remove(object2, operation, options);
        case "replace":
          return replace(object2, operation, options);
        case "move":
          return move(object2, operation, options);
        case "copy":
          return copy2(object2, operation, options);
        case "test":
          return test(object2, operation, options);
      }
      return new InvalidOperationError(operation);
    }
  }
});

// node_modules/rfc6902/index.js
var require_rfc6902 = __commonJS({
  "node_modules/rfc6902/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Pointer = void 0;
    exports.applyPatch = applyPatch2;
    exports.createPatch = createPatch;
    exports.createTests = createTests;
    var pointer_1 = require_pointer();
    Object.defineProperty(exports, "Pointer", { enumerable: true, get: function() {
      return pointer_1.Pointer;
    } });
    var patch_1 = require_patch();
    var diff_1 = require_diff();
    function applyPatch2(object2, patch2, options) {
      return patch2.map(function(operation) {
        return (0, patch_1.apply)(object2, operation, options);
      });
    }
    function wrapVoidableDiff(diff) {
      function wrappedDiff(input, output, ptr) {
        var custom_patch = diff(input, output, ptr);
        return Array.isArray(custom_patch) ? custom_patch : (0, diff_1.diffAny)(input, output, ptr, wrappedDiff);
      }
      return wrappedDiff;
    }
    function createPatch(input, output, diff) {
      var ptr = new pointer_1.Pointer();
      return (diff ? wrapVoidableDiff(diff) : diff_1.diffAny)(input, output, ptr);
    }
    function createTest(input, path) {
      var endpoint = pointer_1.Pointer.fromJSON(path).evaluate(input);
      if (endpoint !== void 0) {
        return { op: "test", path, value: endpoint.value };
      }
    }
    function createTests(input, patch2) {
      var tests = new Array();
      patch2.filter(diff_1.isDestructive).forEach(function(operation) {
        var pathTest = createTest(input, operation.path);
        if (pathTest)
          tests.push(pathTest);
        if ("from" in operation) {
          var fromTest = createTest(input, operation.from);
          if (fromTest)
            tests.push(fromTest);
        }
      });
      return tests;
    }
  }
});

// node_modules/setimmediate/setImmediate.js
var require_setImmediate = __commonJS({
  "node_modules/setimmediate/setImmediate.js"(exports) {
    (function(global2, undefined2) {
      "use strict";
      if (global2.setImmediate) {
        return;
      }
      var nextHandle = 1;
      var tasksByHandle = {};
      var currentlyRunningATask = false;
      var doc = global2.document;
      var registerImmediate;
      function setImmediate2(callback) {
        if (typeof callback !== "function") {
          callback = new Function("" + callback);
        }
        var args = new Array(arguments.length - 1);
        for (var i2 = 0; i2 < args.length; i2++) {
          args[i2] = arguments[i2 + 1];
        }
        var task = { callback, args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
      }
      function clearImmediate(handle) {
        delete tasksByHandle[handle];
      }
      function run2(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
          case 0:
            callback();
            break;
          case 1:
            callback(args[0]);
            break;
          case 2:
            callback(args[0], args[1]);
            break;
          case 3:
            callback(args[0], args[1], args[2]);
            break;
          default:
            callback.apply(undefined2, args);
            break;
        }
      }
      function runIfPresent(handle) {
        if (currentlyRunningATask) {
          setTimeout(runIfPresent, 0, handle);
        } else {
          var task = tasksByHandle[handle];
          if (task) {
            currentlyRunningATask = true;
            try {
              run2(task);
            } finally {
              clearImmediate(handle);
              currentlyRunningATask = false;
            }
          }
        }
      }
      function installNextTickImplementation() {
        registerImmediate = function(handle) {
          process.nextTick(function() {
            runIfPresent(handle);
          });
        };
      }
      function canUsePostMessage() {
        if (global2.postMessage && !global2.importScripts) {
          var postMessageIsAsynchronous = true;
          var oldOnMessage = global2.onmessage;
          global2.onmessage = function() {
            postMessageIsAsynchronous = false;
          };
          global2.postMessage("", "*");
          global2.onmessage = oldOnMessage;
          return postMessageIsAsynchronous;
        }
      }
      function installPostMessageImplementation() {
        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
          if (event.source === global2 && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
            runIfPresent(+event.data.slice(messagePrefix.length));
          }
        };
        if (global2.addEventListener) {
          global2.addEventListener("message", onGlobalMessage, false);
        } else {
          global2.attachEvent("onmessage", onGlobalMessage);
        }
        registerImmediate = function(handle) {
          global2.postMessage(messagePrefix + handle, "*");
        };
      }
      function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
          var handle = event.data;
          runIfPresent(handle);
        };
        registerImmediate = function(handle) {
          channel.port2.postMessage(handle);
        };
      }
      function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
          var script = doc.createElement("script");
          script.onreadystatechange = function() {
            runIfPresent(handle);
            script.onreadystatechange = null;
            html.removeChild(script);
            script = null;
          };
          html.appendChild(script);
        };
      }
      function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
          setTimeout(runIfPresent, 0, handle);
        };
      }
      var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global2);
      attachTo = attachTo && attachTo.setTimeout ? attachTo : global2;
      if ({}.toString.call(global2.process) === "[object process]") {
        installNextTickImplementation();
      } else if (canUsePostMessage()) {
        installPostMessageImplementation();
      } else if (global2.MessageChannel) {
        installMessageChannelImplementation();
      } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        installReadyStateChangeImplementation();
      } else {
        installSetTimeoutImplementation();
      }
      attachTo.setImmediate = setImmediate2;
      attachTo.clearImmediate = clearImmediate;
    })(typeof self === "undefined" ? typeof global === "undefined" ? exports : global : self);
  }
});

// src/lib/scoped.js
function scoped(root) {
  return {
    getElementById: (id) => root.querySelector('[id="' + id + '"]'),
    querySelector: (s2) => root.querySelector(s2),
    querySelectorAll: (s2) => root.querySelectorAll(s2),
    createElement: (t2) => window.document.createElement(t2),
    get body() {
      return window.document.body;
    },
    get documentElement() {
      return window.document.documentElement;
    },
    addEventListener: (...a2) => window.document.addEventListener(...a2)
  };
}

// src/lib/sound.js
var KEY = { bgm: "zk_vol_bgm", sfx: "zk_vol_sfx", mute: "zk_mute" };
function readNum(k2, dflt) {
  try {
    const v2 = localStorage.getItem(k2);
    if (v2 == null) return dflt;
    const n2 = Number(v2);
    return Number.isFinite(n2) ? Math.max(0, Math.min(100, n2)) : dflt;
  } catch (e) {
    return dflt;
  }
}
function readBool(k2) {
  try {
    return localStorage.getItem(k2) === "1";
  } catch (e) {
    return false;
  }
}
var sound = {
  bgm: readNum(KEY.bgm, 50),
  sfx: readNum(KEY.sfx, 50),
  muted: readBool(KEY.mute)
};
var sfxGain = () => sound.muted ? 0 : sound.sfx / 100;
var SFX = {
  card_play: "assets/snd/card_play.webm",
  /* 카드 낼 때 */
  card_deal: "assets/snd/card_deal.webm",
  /* 패 나눌 때 */
  pass: "assets/snd/pass.webm",
  my_turn: "assets/snd/my_turn.webm",
  win: "assets/snd/win.webm",
  /* 완주 */
  lose: "assets/snd/lose.webm",
  button: "assets/snd/button.webm",
  revolution: "assets/snd/revolution.webm",
  tick: "assets/snd/tick.webm",
  /* 남은 시간 */
  join: "assets/snd/join.webm"
  /* 대기실에 들어올 때 */
};
var POOL = 4;
var pool = {};
function voices(src) {
  if (!pool[src]) {
    pool[src] = { i: 0, list: Array.from({ length: POOL }, () => {
      const a2 = new Audio(src);
      a2.preload = "auto";
      try {
        a2.load();
      } catch (e) {
      }
      return a2;
    }) };
  }
  return pool[src];
}
function stop(name) {
  const src = SFX[name];
  if (!src || !pool[src]) return;
  pool[src].list.forEach((a2) => {
    try {
      a2.pause();
      a2.currentTime = 0;
    } catch (e) {
    }
  });
}
function play(name) {
  const src = SFX[name];
  if (!src) return;
  const g2 = sfxGain();
  if (g2 <= 0) return;
  try {
    const v2 = voices(src);
    const a2 = v2.list[v2.i];
    v2.i = (v2.i + 1) % v2.list.length;
    try {
      a2.currentTime = 0;
    } catch (e) {
    }
    a2.volume = g2;
    const p2 = a2.play();
    if (p2 && p2.catch) p2.catch(() => {
    });
  } catch (e) {
  }
}

// src/lib/sndkey.js
function trickId(v2) {
  if (v2 && v2.trickNo != null) return "t" + v2.trickNo;
  return "c" + (v2 && v2.seats || []).reduce((a2, s2) => a2 + (s2.c || 0), 0);
}
function moveEvents(v2) {
  if (!v2) return [];
  if (v2.moveNo != null && v2.lastMove) {
    if (!v2.moveNo) return [];
    return [{ key: "m" + v2.moveNo, kind: v2.lastMove.k, by: v2.lastMove.by }];
  }
  const id = trickId(v2);
  const out = [];
  const tb = v2.table || [];
  if (tb.length) {
    const t2 = tb[tb.length - 1];
    out.push({
      key: id + "#" + tb.length + ":" + t2.by + "-" + t2.num + "-" + t2.count,
      kind: "play",
      by: t2.by
    });
  }
  (v2.seats || []).forEach((s2, i2) => {
    if (s2 && s2.s === "pass") out.push({ key: id + "#p" + i2, kind: "pass", by: i2 });
  });
  return out;
}
function makeSeen(limit = 240) {
  const set2 = /* @__PURE__ */ new Set();
  return {
    /* 처음 보는 번호면 true (그리고 기억한다) */
    add(key) {
      if (!key) return false;
      if (set2.has(key)) return false;
      set2.add(key);
      if (set2.size > limit) {
        const it = set2.values();
        for (let i2 = set2.size - limit; i2 > 0; i2--) set2.delete(it.next().value);
      }
      return true;
    },
    has(key) {
      return set2.has(key);
    },
    clear() {
      set2.clear();
    },
    get size() {
      return set2.size;
    }
  };
}

// src/lib/assets.js
var ART = { "01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "jokerA": "assets/joker_a.webp", "jokerB": "assets/joker_b.webp" };
var ART_DECK = { "01": "assets/card_01.webp", "02": "assets/card_02.webp", "03": "assets/card_03.webp", "04": "assets/card_04.webp", "05": "assets/card_05.webp", "06": "assets/card_06.webp", "07": "assets/card_07.webp", "08": "assets/card_08.webp", "09": "assets/card_09.webp", "10": "assets/card_10.webp", "11": "assets/card_11.webp", "12": "assets/card_12.webp", "jokerA": "assets/joker_a.webp", "jokerB": "assets/joker_b.webp", "back": "assets/back.webp" };
var AVATARS = [
  { f: "assets/avt_01.webp", ko: "\uC0DD\uC950", en: "Mouse", need: 0 },
  { f: "assets/avt_02.webp", ko: "\uC0C8", en: "Bird", need: 0 },
  { f: "assets/avt_03.webp", ko: "\uD1A0\uB07C", en: "Rabbit", need: 0 },
  { f: "assets/avt_04.webp", ko: "\uC6D0\uC22D\uC774", en: "Monkey", need: 0 },
  { f: "assets/avt_05.webp", ko: "\uBA67\uB3FC\uC9C0", en: "Boar", need: 0 },
  { f: "assets/avt_06.webp", ko: "\uAE30\uB9B0", en: "Giraffe", need: 5e3 },
  { f: "assets/avt_07.webp", ko: "\uC5EC\uC6B0", en: "Fox", need: 1e4 },
  { f: "assets/avt_08.webp", ko: "\uC545\uC5B4", en: "Croc", need: 15e3 },
  { f: "assets/avt_09.webp", ko: "\uCF54\uB07C\uB9AC", en: "Elephant", need: 2e4 },
  { f: "assets/avt_10.webp", ko: "\uBD88\uACF0", en: "Bear", need: 25e3 },
  { f: "assets/avt_11.webp", ko: "\uD638\uB791\uC774", en: "Tiger", need: 3e4 },
  { f: "assets/avt_12.webp", ko: "\uC0AC\uC790", en: "Lion", need: 35e3 },
  { f: "assets/avt_13.webp", ko: "\uACE0\uC591\uC774", en: "Cat", need: 4e4 },
  { f: "assets/avt_14.webp", ko: "\uC6A9", en: "Dragon", need: 45e3 },
  { f: "assets/avt_15.webp", ko: "\uC720\uB2C8\uCF58", en: "Unicorn", need: 5e4 }
];
var avtFile = (i2) => (AVATARS[i2] || AVATARS[0]).f;
var EMOTES = [
  { k: "tiger", img: "assets/emote_tiger.webp", ko: "\uBE68\uB9AC\uBE68\uB9AC", en: "HURRY UP" },
  { k: "rabbit", img: "assets/emote_rabbit.webp", ko: "\uAC10\uC0AC", en: "THANKS" },
  { k: "bear", img: "assets/emote_bear.webp", ko: "\u3160\u3160", en: "SO SAD" },
  { k: "monkey", img: "assets/emote_monkey.webp", ko: "\uD489\u314B\u314B", en: "LOL" },
  { k: "lion", img: "assets/emote_lion.webp", ko: "\uC544\uC624..!", en: "ARGH...!" }
];
var RINGS = { "avatar": "assets/ring.webp", "empty": "assets/ring_empty.webp" };

// src/lib/engine.js
var engine_exports = {};
__export(engine_exports, {
  autoDraw: () => autoDraw,
  declareRev: () => declareRev,
  engine: () => engine,
  give: () => give,
  onEmote: () => onEmote,
  onView: () => onView,
  passRev: () => passRev,
  passTurn: () => passTurn,
  play: () => play2,
  sendEmote: () => sendEmote,
  setAuto: () => setAuto,
  setPaused: () => setPaused,
  startLocal: () => startLocal,
  startOnline: () => startOnline,
  stop: () => stop2,
  takeCard: () => takeCard
});

// node_modules/nanoid/non-secure/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var nanoid = (size = 21) => {
  let id = "";
  let i2 = size | 0;
  while (i2-- > 0) {
    id += urlAlphabet[Math.random() * 64 | 0];
  }
  return id;
};

// node_modules/immer/dist/immer.esm.mjs
function n(n2) {
  for (var r2 = arguments.length, t2 = Array(r2 > 1 ? r2 - 1 : 0), e = 1; e < r2; e++) t2[e - 1] = arguments[e];
  if (true) {
    var i2 = Y[n2], o2 = i2 ? "function" == typeof i2 ? i2.apply(null, t2) : i2 : "unknown error nr: " + n2;
    throw Error("[Immer] " + o2);
  }
  throw Error("[Immer] minified error nr: " + n2 + (t2.length ? " " + t2.map(function(n3) {
    return "'" + n3 + "'";
  }).join(",") : "") + ". Find the full error at: https://bit.ly/3cXEKWf");
}
function r(n2) {
  return !!n2 && !!n2[Q];
}
function t(n2) {
  var r2;
  return !!n2 && (function(n3) {
    if (!n3 || "object" != typeof n3) return false;
    var r3 = Object.getPrototypeOf(n3);
    if (null === r3) return true;
    var t2 = Object.hasOwnProperty.call(r3, "constructor") && r3.constructor;
    return t2 === Object || "function" == typeof t2 && Function.toString.call(t2) === Z;
  }(n2) || Array.isArray(n2) || !!n2[L] || !!(null === (r2 = n2.constructor) || void 0 === r2 ? void 0 : r2[L]) || s(n2) || v(n2));
}
function i(n2, r2, t2) {
  void 0 === t2 && (t2 = false), 0 === o(n2) ? (t2 ? Object.keys : nn)(n2).forEach(function(e) {
    t2 && "symbol" == typeof e || r2(e, n2[e], n2);
  }) : n2.forEach(function(t3, e) {
    return r2(e, t3, n2);
  });
}
function o(n2) {
  var r2 = n2[Q];
  return r2 ? r2.i > 3 ? r2.i - 4 : r2.i : Array.isArray(n2) ? 1 : s(n2) ? 2 : v(n2) ? 3 : 0;
}
function u(n2, r2) {
  return 2 === o(n2) ? n2.has(r2) : Object.prototype.hasOwnProperty.call(n2, r2);
}
function a(n2, r2) {
  return 2 === o(n2) ? n2.get(r2) : n2[r2];
}
function f(n2, r2, t2) {
  var e = o(n2);
  2 === e ? n2.set(r2, t2) : 3 === e ? n2.add(t2) : n2[r2] = t2;
}
function c(n2, r2) {
  return n2 === r2 ? 0 !== n2 || 1 / n2 == 1 / r2 : n2 != n2 && r2 != r2;
}
function s(n2) {
  return X && n2 instanceof Map;
}
function v(n2) {
  return q && n2 instanceof Set;
}
function p(n2) {
  return n2.o || n2.t;
}
function l(n2) {
  if (Array.isArray(n2)) return Array.prototype.slice.call(n2);
  var r2 = rn(n2);
  delete r2[Q];
  for (var t2 = nn(r2), e = 0; e < t2.length; e++) {
    var i2 = t2[e], o2 = r2[i2];
    false === o2.writable && (o2.writable = true, o2.configurable = true), (o2.get || o2.set) && (r2[i2] = { configurable: true, writable: true, enumerable: o2.enumerable, value: n2[i2] });
  }
  return Object.create(Object.getPrototypeOf(n2), r2);
}
function d(n2, e) {
  return void 0 === e && (e = false), y(n2) || r(n2) || !t(n2) || (o(n2) > 1 && (n2.set = n2.add = n2.clear = n2.delete = h), Object.freeze(n2), e && i(n2, function(n3, r2) {
    return d(r2, true);
  }, true)), n2;
}
function h() {
  n(2);
}
function y(n2) {
  return null == n2 || "object" != typeof n2 || Object.isFrozen(n2);
}
function b(r2) {
  var t2 = tn[r2];
  return t2 || n(18, r2), t2;
}
function _() {
  return U || n(0), U;
}
function j(n2, r2) {
  r2 && (b("Patches"), n2.u = [], n2.s = [], n2.v = r2);
}
function g(n2) {
  O(n2), n2.p.forEach(S), n2.p = null;
}
function O(n2) {
  n2 === U && (U = n2.l);
}
function w(n2) {
  return U = { p: [], l: U, h: n2, m: true, _: 0 };
}
function S(n2) {
  var r2 = n2[Q];
  0 === r2.i || 1 === r2.i ? r2.j() : r2.g = true;
}
function P(r2, e) {
  e._ = e.p.length;
  var i2 = e.p[0], o2 = void 0 !== r2 && r2 !== i2;
  return e.h.O || b("ES5").S(e, r2, o2), o2 ? (i2[Q].P && (g(e), n(4)), t(r2) && (r2 = M(e, r2), e.l || x(e, r2)), e.u && b("Patches").M(i2[Q].t, r2, e.u, e.s)) : r2 = M(e, i2, []), g(e), e.u && e.v(e.u, e.s), r2 !== H ? r2 : void 0;
}
function M(n2, r2, t2) {
  if (y(r2)) return r2;
  var e = r2[Q];
  if (!e) return i(r2, function(i2, o3) {
    return A(n2, e, r2, i2, o3, t2);
  }, true), r2;
  if (e.A !== n2) return r2;
  if (!e.P) return x(n2, e.t, true), e.t;
  if (!e.I) {
    e.I = true, e.A._--;
    var o2 = 4 === e.i || 5 === e.i ? e.o = l(e.k) : e.o, u2 = o2, a2 = false;
    3 === e.i && (u2 = new Set(o2), o2.clear(), a2 = true), i(u2, function(r3, i2) {
      return A(n2, e, o2, r3, i2, t2, a2);
    }), x(n2, o2, false), t2 && n2.u && b("Patches").N(e, t2, n2.u, n2.s);
  }
  return e.o;
}
function A(e, i2, o2, a2, c2, s2, v2) {
  if (c2 === o2 && n(5), r(c2)) {
    var p2 = M(e, c2, s2 && i2 && 3 !== i2.i && !u(i2.R, a2) ? s2.concat(a2) : void 0);
    if (f(o2, a2, p2), !r(p2)) return;
    e.m = false;
  } else v2 && o2.add(c2);
  if (t(c2) && !y(c2)) {
    if (!e.h.D && e._ < 1) return;
    M(e, c2), i2 && i2.A.l || x(e, c2);
  }
}
function x(n2, r2, t2) {
  void 0 === t2 && (t2 = false), !n2.l && n2.h.D && n2.m && d(r2, t2);
}
function z(n2, r2) {
  var t2 = n2[Q];
  return (t2 ? p(t2) : n2)[r2];
}
function I(n2, r2) {
  if (r2 in n2) for (var t2 = Object.getPrototypeOf(n2); t2; ) {
    var e = Object.getOwnPropertyDescriptor(t2, r2);
    if (e) return e;
    t2 = Object.getPrototypeOf(t2);
  }
}
function k(n2) {
  n2.P || (n2.P = true, n2.l && k(n2.l));
}
function E(n2) {
  n2.o || (n2.o = l(n2.t));
}
function N(n2, r2, t2) {
  var e = s(r2) ? b("MapSet").F(r2, t2) : v(r2) ? b("MapSet").T(r2, t2) : n2.O ? function(n3, r3) {
    var t3 = Array.isArray(n3), e2 = { i: t3 ? 1 : 0, A: r3 ? r3.A : _(), P: false, I: false, R: {}, l: r3, t: n3, k: null, o: null, j: null, C: false }, i2 = e2, o2 = en;
    t3 && (i2 = [e2], o2 = on);
    var u2 = Proxy.revocable(i2, o2), a2 = u2.revoke, f2 = u2.proxy;
    return e2.k = f2, e2.j = a2, f2;
  }(r2, t2) : b("ES5").J(r2, t2);
  return (t2 ? t2.A : _()).p.push(e), e;
}
function R(e) {
  return r(e) || n(22, e), function n2(r2) {
    if (!t(r2)) return r2;
    var e2, u2 = r2[Q], c2 = o(r2);
    if (u2) {
      if (!u2.P && (u2.i < 4 || !b("ES5").K(u2))) return u2.t;
      u2.I = true, e2 = D(r2, c2), u2.I = false;
    } else e2 = D(r2, c2);
    return i(e2, function(r3, t2) {
      u2 && a(u2.t, r3) === t2 || f(e2, r3, n2(t2));
    }), 3 === c2 ? new Set(e2) : e2;
  }(e);
}
function D(n2, r2) {
  switch (r2) {
    case 2:
      return new Map(n2);
    case 3:
      return Array.from(n2);
  }
  return l(n2);
}
var G;
var U;
var W = "undefined" != typeof Symbol && "symbol" == typeof Symbol("x");
var X = "undefined" != typeof Map;
var q = "undefined" != typeof Set;
var B = "undefined" != typeof Proxy && void 0 !== Proxy.revocable && "undefined" != typeof Reflect;
var H = W ? Symbol.for("immer-nothing") : ((G = {})["immer-nothing"] = true, G);
var L = W ? Symbol.for("immer-draftable") : "__$immer_draftable";
var Q = W ? Symbol.for("immer-state") : "__$immer_state";
var Y = { 0: "Illegal state", 1: "Immer drafts cannot have computed properties", 2: "This object has been frozen and should not be mutated", 3: function(n2) {
  return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + n2;
}, 4: "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.", 5: "Immer forbids circular references", 6: "The first or second argument to `produce` must be a function", 7: "The third argument to `produce` must be a function or undefined", 8: "First argument to `createDraft` must be a plain object, an array, or an immerable object", 9: "First argument to `finishDraft` must be a draft returned by `createDraft`", 10: "The given draft is already finalized", 11: "Object.defineProperty() cannot be used on an Immer draft", 12: "Object.setPrototypeOf() cannot be used on an Immer draft", 13: "Immer only supports deleting array indices", 14: "Immer only supports setting array indices and the 'length' property", 15: function(n2) {
  return "Cannot apply patch, path doesn't resolve: " + n2;
}, 16: 'Sets cannot have "replace" patches.', 17: function(n2) {
  return "Unsupported patch operation: " + n2;
}, 18: function(n2) {
  return "The plugin for '" + n2 + "' has not been loaded into Immer. To enable the plugin, import and call `enable" + n2 + "()` when initializing your application.";
}, 20: "Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available", 21: function(n2) {
  return "produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '" + n2 + "'";
}, 22: function(n2) {
  return "'current' expects a draft, got: " + n2;
}, 23: function(n2) {
  return "'original' expects a draft, got: " + n2;
}, 24: "Patching reserved attributes like __proto__, prototype and constructor is not allowed" };
var Z = "" + Object.prototype.constructor;
var nn = "undefined" != typeof Reflect && Reflect.ownKeys ? Reflect.ownKeys : void 0 !== Object.getOwnPropertySymbols ? function(n2) {
  return Object.getOwnPropertyNames(n2).concat(Object.getOwnPropertySymbols(n2));
} : Object.getOwnPropertyNames;
var rn = Object.getOwnPropertyDescriptors || function(n2) {
  var r2 = {};
  return nn(n2).forEach(function(t2) {
    r2[t2] = Object.getOwnPropertyDescriptor(n2, t2);
  }), r2;
};
var tn = {};
var en = { get: function(n2, r2) {
  if (r2 === Q) return n2;
  var e = p(n2);
  if (!u(e, r2)) return function(n3, r3, t2) {
    var e2, i3 = I(r3, t2);
    return i3 ? "value" in i3 ? i3.value : null === (e2 = i3.get) || void 0 === e2 ? void 0 : e2.call(n3.k) : void 0;
  }(n2, e, r2);
  var i2 = e[r2];
  return n2.I || !t(i2) ? i2 : i2 === z(n2.t, r2) ? (E(n2), n2.o[r2] = N(n2.A.h, i2, n2)) : i2;
}, has: function(n2, r2) {
  return r2 in p(n2);
}, ownKeys: function(n2) {
  return Reflect.ownKeys(p(n2));
}, set: function(n2, r2, t2) {
  var e = I(p(n2), r2);
  if (null == e ? void 0 : e.set) return e.set.call(n2.k, t2), true;
  if (!n2.P) {
    var i2 = z(p(n2), r2), o2 = null == i2 ? void 0 : i2[Q];
    if (o2 && o2.t === t2) return n2.o[r2] = t2, n2.R[r2] = false, true;
    if (c(t2, i2) && (void 0 !== t2 || u(n2.t, r2))) return true;
    E(n2), k(n2);
  }
  return n2.o[r2] === t2 && (void 0 !== t2 || r2 in n2.o) || Number.isNaN(t2) && Number.isNaN(n2.o[r2]) || (n2.o[r2] = t2, n2.R[r2] = true), true;
}, deleteProperty: function(n2, r2) {
  return void 0 !== z(n2.t, r2) || r2 in n2.t ? (n2.R[r2] = false, E(n2), k(n2)) : delete n2.R[r2], n2.o && delete n2.o[r2], true;
}, getOwnPropertyDescriptor: function(n2, r2) {
  var t2 = p(n2), e = Reflect.getOwnPropertyDescriptor(t2, r2);
  return e ? { writable: true, configurable: 1 !== n2.i || "length" !== r2, enumerable: e.enumerable, value: t2[r2] } : e;
}, defineProperty: function() {
  n(11);
}, getPrototypeOf: function(n2) {
  return Object.getPrototypeOf(n2.t);
}, setPrototypeOf: function() {
  n(12);
} };
var on = {};
i(en, function(n2, r2) {
  on[n2] = function() {
    return arguments[0] = arguments[0][0], r2.apply(this, arguments);
  };
}), on.deleteProperty = function(r2, t2) {
  return isNaN(parseInt(t2)) && n(13), on.set.call(this, r2, t2, void 0);
}, on.set = function(r2, t2, e) {
  return "length" !== t2 && isNaN(parseInt(t2)) && n(14), en.set.call(this, r2[0], t2, e, r2[0]);
};
var un = function() {
  function e(r2) {
    var e2 = this;
    this.O = B, this.D = true, this.produce = function(r3, i3, o2) {
      if ("function" == typeof r3 && "function" != typeof i3) {
        var u2 = i3;
        i3 = r3;
        var a2 = e2;
        return function(n2) {
          var r4 = this;
          void 0 === n2 && (n2 = u2);
          for (var t2 = arguments.length, e3 = Array(t2 > 1 ? t2 - 1 : 0), o3 = 1; o3 < t2; o3++) e3[o3 - 1] = arguments[o3];
          return a2.produce(n2, function(n3) {
            var t3;
            return (t3 = i3).call.apply(t3, [r4, n3].concat(e3));
          });
        };
      }
      var f2;
      if ("function" != typeof i3 && n(6), void 0 !== o2 && "function" != typeof o2 && n(7), t(r3)) {
        var c2 = w(e2), s2 = N(e2, r3, void 0), v2 = true;
        try {
          f2 = i3(s2), v2 = false;
        } finally {
          v2 ? g(c2) : O(c2);
        }
        return "undefined" != typeof Promise && f2 instanceof Promise ? f2.then(function(n2) {
          return j(c2, o2), P(n2, c2);
        }, function(n2) {
          throw g(c2), n2;
        }) : (j(c2, o2), P(f2, c2));
      }
      if (!r3 || "object" != typeof r3) {
        if (void 0 === (f2 = i3(r3)) && (f2 = r3), f2 === H && (f2 = void 0), e2.D && d(f2, true), o2) {
          var p2 = [], l2 = [];
          b("Patches").M(r3, f2, p2, l2), o2(p2, l2);
        }
        return f2;
      }
      n(21, r3);
    }, this.produceWithPatches = function(n2, r3) {
      if ("function" == typeof n2) return function(r4) {
        for (var t3 = arguments.length, i4 = Array(t3 > 1 ? t3 - 1 : 0), o3 = 1; o3 < t3; o3++) i4[o3 - 1] = arguments[o3];
        return e2.produceWithPatches(r4, function(r5) {
          return n2.apply(void 0, [r5].concat(i4));
        });
      };
      var t2, i3, o2 = e2.produce(n2, r3, function(n3, r4) {
        t2 = n3, i3 = r4;
      });
      return "undefined" != typeof Promise && o2 instanceof Promise ? o2.then(function(n3) {
        return [n3, t2, i3];
      }) : [o2, t2, i3];
    }, "boolean" == typeof (null == r2 ? void 0 : r2.useProxies) && this.setUseProxies(r2.useProxies), "boolean" == typeof (null == r2 ? void 0 : r2.autoFreeze) && this.setAutoFreeze(r2.autoFreeze);
  }
  var i2 = e.prototype;
  return i2.createDraft = function(e2) {
    t(e2) || n(8), r(e2) && (e2 = R(e2));
    var i3 = w(this), o2 = N(this, e2, void 0);
    return o2[Q].C = true, O(i3), o2;
  }, i2.finishDraft = function(r2, t2) {
    var e2 = r2 && r2[Q];
    e2 && e2.C || n(9), e2.I && n(10);
    var i3 = e2.A;
    return j(i3, t2), P(void 0, i3);
  }, i2.setAutoFreeze = function(n2) {
    this.D = n2;
  }, i2.setUseProxies = function(r2) {
    r2 && !B && n(20), this.O = r2;
  }, i2.applyPatches = function(n2, t2) {
    var e2;
    for (e2 = t2.length - 1; e2 >= 0; e2--) {
      var i3 = t2[e2];
      if (0 === i3.path.length && "replace" === i3.op) {
        n2 = i3.value;
        break;
      }
    }
    e2 > -1 && (t2 = t2.slice(e2 + 1));
    var o2 = b("Patches").$;
    return r(n2) ? o2(n2, t2) : this.produce(n2, function(n3) {
      return o2(n3, t2);
    });
  }, e;
}();
var an = new un();
var fn = an.produce;
var cn = an.produceWithPatches.bind(an);
var sn = an.setAutoFreeze.bind(an);
var vn = an.setUseProxies.bind(an);
var pn = an.applyPatches.bind(an);
var ln = an.createDraft.bind(an);
var dn = an.finishDraft.bind(an);
var immer_esm_default = fn;

// node_modules/boardgame.io/dist/esm/plugin-random-087f861e.js
var Alea = class {
  constructor(seed) {
    const mash = Mash();
    this.c = 1;
    this.s0 = mash(" ");
    this.s1 = mash(" ");
    this.s2 = mash(" ");
    this.s0 -= mash(seed);
    if (this.s0 < 0) {
      this.s0 += 1;
    }
    this.s1 -= mash(seed);
    if (this.s1 < 0) {
      this.s1 += 1;
    }
    this.s2 -= mash(seed);
    if (this.s2 < 0) {
      this.s2 += 1;
    }
  }
  next() {
    const t2 = 2091639 * this.s0 + this.c * 23283064365386963e-26;
    this.s0 = this.s1;
    this.s1 = this.s2;
    return this.s2 = t2 - (this.c = Math.trunc(t2));
  }
};
function Mash() {
  let n2 = 4022871197;
  const mash = function(data) {
    const str = data.toString();
    for (let i2 = 0; i2 < str.length; i2++) {
      n2 += str.charCodeAt(i2);
      let h2 = 0.02519603282416938 * n2;
      n2 = h2 >>> 0;
      h2 -= n2;
      h2 *= n2;
      n2 = h2 >>> 0;
      h2 -= n2;
      n2 += h2 * 4294967296;
    }
    return (n2 >>> 0) * 23283064365386963e-26;
  };
  return mash;
}
function copy(f2, t2) {
  t2.c = f2.c;
  t2.s0 = f2.s0;
  t2.s1 = f2.s1;
  t2.s2 = f2.s2;
  return t2;
}
function alea(seed, state) {
  const xg = new Alea(seed);
  const prng = xg.next.bind(xg);
  if (state)
    copy(state, xg);
  prng.state = () => copy(xg, {});
  return prng;
}
var Random = class {
  /**
   * constructor
   * @param {object} ctx - The ctx object to initialize from.
   */
  constructor(state) {
    this.state = state || { seed: "0" };
    this.used = false;
  }
  /**
   * Generates a new seed from the current date / time.
   */
  static seed() {
    return Date.now().toString(36).slice(-10);
  }
  isUsed() {
    return this.used;
  }
  getState() {
    return this.state;
  }
  /**
   * Generate a random number.
   */
  _random() {
    this.used = true;
    const R2 = this.state;
    const seed = R2.prngstate ? "" : R2.seed;
    const rand = alea(seed, R2.prngstate);
    const number = rand();
    this.state = {
      ...R2,
      prngstate: rand.state()
    };
    return number;
  }
  api() {
    const random = this._random.bind(this);
    const SpotValue = {
      D4: 4,
      D6: 6,
      D8: 8,
      D10: 10,
      D12: 12,
      D20: 20
    };
    const predefined = {};
    for (const key in SpotValue) {
      const spotvalue = SpotValue[key];
      predefined[key] = (diceCount) => {
        return diceCount === void 0 ? Math.floor(random() * spotvalue) + 1 : Array.from({ length: diceCount }).map(() => Math.floor(random() * spotvalue) + 1);
      };
    }
    function Die(spotvalue = 6, diceCount) {
      return diceCount === void 0 ? Math.floor(random() * spotvalue) + 1 : Array.from({ length: diceCount }).map(() => Math.floor(random() * spotvalue) + 1);
    }
    return {
      /**
       * Similar to Die below, but with fixed spot values.
       * Supports passing a diceCount
       *    if not defined, defaults to 1 and returns the value directly.
       *    if defined, returns an array containing the random dice values.
       *
       * D4: (diceCount) => value
       * D6: (diceCount) => value
       * D8: (diceCount) => value
       * D10: (diceCount) => value
       * D12: (diceCount) => value
       * D20: (diceCount) => value
       */
      ...predefined,
      /**
       * Roll a die of specified spot value.
       *
       * @param {number} spotvalue - The die dimension (default: 6).
       * @param {number} diceCount - number of dice to throw.
       *                             if not defined, defaults to 1 and returns the value directly.
       *                             if defined, returns an array containing the random dice values.
       */
      Die,
      /**
       * Generate a random number between 0 and 1.
       */
      Number: () => {
        return random();
      },
      /**
       * Shuffle an array.
       *
       * @param {Array} deck - The array to shuffle. Does not mutate
       *                       the input, but returns the shuffled array.
       */
      Shuffle: (deck) => {
        const clone = [...deck];
        let sourceIndex = deck.length;
        let destinationIndex = 0;
        const shuffled = Array.from({ length: sourceIndex });
        while (sourceIndex) {
          const randomIndex = Math.trunc(sourceIndex * random());
          shuffled[destinationIndex++] = clone[randomIndex];
          clone[randomIndex] = clone[--sourceIndex];
        }
        return shuffled;
      },
      _private: this
    };
  }
};
var RandomPlugin = {
  name: "random",
  noClient: ({ api }) => {
    return api._private.isUsed();
  },
  flush: ({ api }) => {
    return api._private.getState();
  },
  api: ({ data }) => {
    const random = new Random(data);
    return random.api();
  },
  setup: ({ game }) => {
    let { seed } = game;
    if (seed === void 0) {
      seed = Random.seed();
    }
    return { seed };
  },
  playerView: () => void 0
};

// node_modules/boardgame.io/dist/esm/turn-order-8cc4909b.js
var import_lodash = __toESM(require_lodash());
var MAKE_MOVE = "MAKE_MOVE";
var GAME_EVENT = "GAME_EVENT";
var REDO = "REDO";
var RESET = "RESET";
var SYNC = "SYNC";
var UNDO = "UNDO";
var UPDATE = "UPDATE";
var PATCH = "PATCH";
var PLUGIN = "PLUGIN";
var STRIP_TRANSIENTS = "STRIP_TRANSIENTS";
var makeMove = (type, args, playerID, credentials) => ({
  type: MAKE_MOVE,
  payload: { type, args, playerID, credentials }
});
var gameEvent = (type, args, playerID, credentials) => ({
  type: GAME_EVENT,
  payload: { type, args, playerID, credentials }
});
var automaticGameEvent = (type, args, playerID, credentials) => ({
  type: GAME_EVENT,
  payload: { type, args, playerID, credentials },
  automatic: true
});
var sync = (info2) => ({
  type: SYNC,
  state: info2.state,
  log: info2.log,
  initialState: info2.initialState,
  clientOnly: true
});
var patch = (prevStateID, stateID, patch2, deltalog) => ({
  type: PATCH,
  prevStateID,
  stateID,
  patch: patch2,
  deltalog,
  clientOnly: true
});
var update = (state, deltalog) => ({
  type: UPDATE,
  state,
  deltalog,
  clientOnly: true
});
var reset = (state) => ({
  type: RESET,
  state,
  clientOnly: true
});
var undo = (playerID, credentials) => ({
  type: UNDO,
  payload: { type: null, args: null, playerID, credentials }
});
var redo = (playerID, credentials) => ({
  type: REDO,
  payload: { type: null, args: null, playerID, credentials }
});
var plugin = (type, args, playerID, credentials) => ({
  type: PLUGIN,
  payload: { type, args, playerID, credentials }
});
var stripTransients = () => ({
  type: STRIP_TRANSIENTS
});
var ActionCreators = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  makeMove,
  gameEvent,
  automaticGameEvent,
  sync,
  patch,
  update,
  reset,
  undo,
  redo,
  plugin,
  stripTransients
});
var INVALID_MOVE = "INVALID_MOVE";
var ImmerPlugin = {
  name: "plugin-immer",
  fnWrap: (move) => (context, ...args) => {
    let isInvalid = false;
    const newG = immer_esm_default(context.G, (G2) => {
      const result = move({ ...context, G: G2 }, ...args);
      if (result === INVALID_MOVE) {
        isInvalid = true;
        return;
      }
      return result;
    });
    if (isInvalid)
      return INVALID_MOVE;
    return newG;
  }
};
var GameMethod;
(function(GameMethod2) {
  GameMethod2["MOVE"] = "MOVE";
  GameMethod2["GAME_ON_END"] = "GAME_ON_END";
  GameMethod2["PHASE_ON_BEGIN"] = "PHASE_ON_BEGIN";
  GameMethod2["PHASE_ON_END"] = "PHASE_ON_END";
  GameMethod2["TURN_ON_BEGIN"] = "TURN_ON_BEGIN";
  GameMethod2["TURN_ON_MOVE"] = "TURN_ON_MOVE";
  GameMethod2["TURN_ON_END"] = "TURN_ON_END";
})(GameMethod || (GameMethod = {}));
var Errors;
(function(Errors2) {
  Errors2["CalledOutsideHook"] = "Events must be called from moves or the `onBegin`, `onEnd`, and `onMove` hooks.\nThis error probably means you called an event from other game code, like an `endIf` trigger or one of the `turn.order` methods.";
  Errors2["EndTurnInOnEnd"] = "`endTurn` is disallowed in `onEnd` hooks \u2014 the turn is already ending.";
  Errors2["MaxTurnEndings"] = "Maximum number of turn endings exceeded for this update.\nThis likely means game code is triggering an infinite loop.";
  Errors2["PhaseEventInOnEnd"] = "`setPhase` & `endPhase` are disallowed in a phase\u2019s `onEnd` hook \u2014 the phase is already ending.\nIf you\u2019re trying to dynamically choose the next phase when a phase ends, use the phase\u2019s `next` trigger.";
  Errors2["StageEventInOnEnd"] = "`setStage`, `endStage` & `setActivePlayers` are disallowed in `onEnd` hooks.";
  Errors2["StageEventInPhaseBegin"] = "`setStage`, `endStage` & `setActivePlayers` are disallowed in a phase\u2019s `onBegin` hook.\nUse `setActivePlayers` in a `turn.onBegin` hook or declare stages with `turn.activePlayers` instead.";
  Errors2["StageEventInTurnBegin"] = "`setStage` & `endStage` are disallowed in `turn.onBegin`.\nUse `setActivePlayers` or declare stages with `turn.activePlayers` instead.";
})(Errors || (Errors = {}));
var Events = class {
  constructor(flow, ctx, playerID) {
    this.flow = flow;
    this.playerID = playerID;
    this.dispatch = [];
    this.initialTurn = ctx.turn;
    this.updateTurnContext(ctx, void 0);
    this.maxEndedTurnsPerAction = ctx.numPlayers * 100;
  }
  api() {
    const events = {
      _private: this
    };
    for (const type of this.flow.eventNames) {
      events[type] = (...args) => {
        this.dispatch.push({
          type,
          args,
          phase: this.currentPhase,
          turn: this.currentTurn,
          calledFrom: this.currentMethod,
          // Used to capture a stack trace in case it is needed later.
          error: new Error("Events Plugin Error")
        });
      };
    }
    return events;
  }
  isUsed() {
    return this.dispatch.length > 0;
  }
  updateTurnContext(ctx, methodType) {
    this.currentPhase = ctx.phase;
    this.currentTurn = ctx.turn;
    this.currentMethod = methodType;
  }
  unsetCurrentMethod() {
    this.currentMethod = void 0;
  }
  /**
   * Updates ctx with the triggered events.
   * @param {object} state - The state object { G, ctx }.
   */
  update(state) {
    const initialState = state;
    const stateWithError = ({ stack }, message) => ({
      ...initialState,
      plugins: {
        ...initialState.plugins,
        events: {
          ...initialState.plugins.events,
          data: { error: message + "\n" + stack }
        }
      }
    });
    EventQueue: for (let i2 = 0; i2 < this.dispatch.length; i2++) {
      const event = this.dispatch[i2];
      const turnHasEnded = event.turn !== state.ctx.turn;
      const endedTurns = this.currentTurn - this.initialTurn;
      if (endedTurns >= this.maxEndedTurnsPerAction) {
        return stateWithError(event.error, Errors.MaxTurnEndings);
      }
      if (event.calledFrom === void 0) {
        return stateWithError(event.error, Errors.CalledOutsideHook);
      }
      if (state.ctx.gameover)
        break EventQueue;
      switch (event.type) {
        case "endStage":
        case "setStage":
        case "setActivePlayers": {
          switch (event.calledFrom) {
            case GameMethod.TURN_ON_END:
            case GameMethod.PHASE_ON_END:
              return stateWithError(event.error, Errors.StageEventInOnEnd);
            case GameMethod.PHASE_ON_BEGIN:
              return stateWithError(event.error, Errors.StageEventInPhaseBegin);
            case GameMethod.TURN_ON_BEGIN:
              if (event.type === "setActivePlayers")
                break;
              return stateWithError(event.error, Errors.StageEventInTurnBegin);
          }
          if (turnHasEnded)
            continue EventQueue;
          break;
        }
        case "endTurn": {
          if (event.calledFrom === GameMethod.TURN_ON_END || event.calledFrom === GameMethod.PHASE_ON_END) {
            return stateWithError(event.error, Errors.EndTurnInOnEnd);
          }
          if (turnHasEnded)
            continue EventQueue;
          break;
        }
        case "endPhase":
        case "setPhase": {
          if (event.calledFrom === GameMethod.PHASE_ON_END) {
            return stateWithError(event.error, Errors.PhaseEventInOnEnd);
          }
          if (event.phase !== state.ctx.phase)
            continue EventQueue;
          break;
        }
      }
      const action = automaticGameEvent(event.type, event.args, this.playerID);
      state = this.flow.processEvent(state, action);
    }
    return state;
  }
};
var EventsPlugin = {
  name: "events",
  noClient: ({ api }) => api._private.isUsed(),
  isInvalid: ({ data }) => data.error || false,
  // Update the events plugin’s internal turn context each time a move
  // or hook is called. This allows events called after turn or phase
  // endings to dispatch the current turn and phase correctly.
  fnWrap: (method, methodType) => (context, ...args) => {
    const api = context.events;
    if (api)
      api._private.updateTurnContext(context.ctx, methodType);
    const G2 = method(context, ...args);
    if (api)
      api._private.unsetCurrentMethod();
    return G2;
  },
  dangerouslyFlushRawState: ({ state, api }) => api._private.update(state),
  api: ({ game, ctx, playerID }) => new Events(game.flow, ctx, playerID).api()
};
var LogPlugin = {
  name: "log",
  flush: () => ({}),
  api: ({ data }) => {
    return {
      setMetadata: (metadata) => {
        data.metadata = metadata;
      }
    };
  },
  setup: () => ({})
};
function isSerializable(value2) {
  if (value2 === void 0 || value2 === null || typeof value2 === "boolean" || typeof value2 === "number" || typeof value2 === "string") {
    return true;
  }
  if (!(0, import_lodash.default)(value2) && !Array.isArray(value2)) {
    return false;
  }
  for (const key in value2) {
    if (!isSerializable(value2[key]))
      return false;
  }
  return true;
}
var SerializablePlugin = {
  name: "plugin-serializable",
  fnWrap: (move) => (context, ...args) => {
    const result = move(context, ...args);
    if (!isSerializable(result)) {
      throw new Error("Move state is not JSON-serialiazable.\nSee https://boardgame.io/documentation/#/?id=state for more information.");
    }
    return result;
  }
};
var production = false;
var logfn = production ? () => {
} : (...msg) => console.log(...msg);
var errorfn = (...msg) => console.error(...msg);
function info(msg) {
  logfn(`INFO: ${msg}`);
}
function error(error2) {
  errorfn("ERROR:", error2);
}
var CORE_PLUGINS = [ImmerPlugin, RandomPlugin, LogPlugin, SerializablePlugin];
var DEFAULT_PLUGINS = [...CORE_PLUGINS, EventsPlugin];
var ProcessAction = (state, action, opts) => {
  opts.game.plugins.filter((plugin2) => plugin2.action !== void 0).filter((plugin2) => plugin2.name === action.payload.type).forEach((plugin2) => {
    const name = plugin2.name;
    const pluginState = state.plugins[name] || { data: {} };
    const data = plugin2.action(pluginState.data, action.payload);
    state = {
      ...state,
      plugins: {
        ...state.plugins,
        [name]: { ...pluginState, data }
      }
    };
  });
  return state;
};
var GetAPIs = ({ plugins }) => Object.entries(plugins || {}).reduce((apis, [name, { api }]) => {
  apis[name] = api;
  return apis;
}, {});
var FnWrap = (methodToWrap, methodType, plugins) => {
  return [...CORE_PLUGINS, ...plugins, EventsPlugin].filter((plugin2) => plugin2.fnWrap !== void 0).reduce((method, { fnWrap }) => fnWrap(method, methodType), methodToWrap);
};
var Setup = (state, opts) => {
  [...DEFAULT_PLUGINS, ...opts.game.plugins].filter((plugin2) => plugin2.setup !== void 0).forEach((plugin2) => {
    const name = plugin2.name;
    const data = plugin2.setup({
      G: state.G,
      ctx: state.ctx,
      game: opts.game
    });
    state = {
      ...state,
      plugins: {
        ...state.plugins,
        [name]: { data }
      }
    };
  });
  return state;
};
var Enhance = (state, opts) => {
  [...DEFAULT_PLUGINS, ...opts.game.plugins].filter((plugin2) => plugin2.api !== void 0).forEach((plugin2) => {
    const name = plugin2.name;
    const pluginState = state.plugins[name] || { data: {} };
    const api = plugin2.api({
      G: state.G,
      ctx: state.ctx,
      data: pluginState.data,
      game: opts.game,
      playerID: opts.playerID
    });
    state = {
      ...state,
      plugins: {
        ...state.plugins,
        [name]: { ...pluginState, api }
      }
    };
  });
  return state;
};
var Flush = (state, opts) => {
  [...CORE_PLUGINS, ...opts.game.plugins, EventsPlugin].reverse().forEach((plugin2) => {
    const name = plugin2.name;
    const pluginState = state.plugins[name] || { data: {} };
    if (plugin2.flush) {
      const newData = plugin2.flush({
        G: state.G,
        ctx: state.ctx,
        game: opts.game,
        api: pluginState.api,
        data: pluginState.data
      });
      state = {
        ...state,
        plugins: {
          ...state.plugins,
          [plugin2.name]: { data: newData }
        }
      };
    } else if (plugin2.dangerouslyFlushRawState) {
      state = plugin2.dangerouslyFlushRawState({
        state,
        game: opts.game,
        api: pluginState.api,
        data: pluginState.data
      });
      const data = state.plugins[name].data;
      state = {
        ...state,
        plugins: {
          ...state.plugins,
          [plugin2.name]: { data }
        }
      };
    }
  });
  return state;
};
var NoClient = (state, opts) => {
  return [...DEFAULT_PLUGINS, ...opts.game.plugins].filter((plugin2) => plugin2.noClient !== void 0).map((plugin2) => {
    const name = plugin2.name;
    const pluginState = state.plugins[name];
    if (pluginState) {
      return plugin2.noClient({
        G: state.G,
        ctx: state.ctx,
        game: opts.game,
        api: pluginState.api,
        data: pluginState.data
      });
    }
    return false;
  }).includes(true);
};
var IsInvalid = (state, opts) => {
  const firstInvalidReturn = [...DEFAULT_PLUGINS, ...opts.game.plugins].filter((plugin2) => plugin2.isInvalid !== void 0).map((plugin2) => {
    const { name } = plugin2;
    const pluginState = state.plugins[name];
    const message = plugin2.isInvalid({
      G: state.G,
      ctx: state.ctx,
      game: opts.game,
      data: pluginState && pluginState.data
    });
    return message ? { plugin: name, message } : false;
  }).find((value2) => value2);
  return firstInvalidReturn || false;
};
var FlushAndValidate = (state, opts) => {
  const updatedState = Flush(state, opts);
  const isInvalid = IsInvalid(updatedState, opts);
  if (!isInvalid)
    return [updatedState];
  const { plugin: plugin2, message } = isInvalid;
  error(`${plugin2} plugin declared action invalid:
${message}`);
  return [state, isInvalid];
};
var PlayerView = ({ G: G2, ctx, plugins = {} }, { game, playerID }) => {
  [...DEFAULT_PLUGINS, ...game.plugins].forEach(({ name, playerView }) => {
    if (!playerView)
      return;
    const { data } = plugins[name] || { data: {} };
    const newData = playerView({ G: G2, ctx, game, data, playerID });
    plugins = {
      ...plugins,
      [name]: { data: newData }
    };
  });
  return plugins;
};
function supportDeprecatedMoveLimit(options, enforceMinMoves = false) {
  if (options.moveLimit) {
    if (enforceMinMoves) {
      options.minMoves = options.moveLimit;
    }
    options.maxMoves = options.moveLimit;
    delete options.moveLimit;
  }
}
function SetActivePlayers(ctx, arg) {
  let activePlayers = {};
  let _prevActivePlayers = [];
  let _nextActivePlayers = null;
  let _activePlayersMinMoves = {};
  let _activePlayersMaxMoves = {};
  if (Array.isArray(arg)) {
    const value2 = {};
    arg.forEach((v2) => value2[v2] = Stage.NULL);
    activePlayers = value2;
  } else {
    supportDeprecatedMoveLimit(arg);
    if (arg.next) {
      _nextActivePlayers = arg.next;
    }
    if (arg.revert) {
      _prevActivePlayers = [
        ...ctx._prevActivePlayers,
        {
          activePlayers: ctx.activePlayers,
          _activePlayersMinMoves: ctx._activePlayersMinMoves,
          _activePlayersMaxMoves: ctx._activePlayersMaxMoves,
          _activePlayersNumMoves: ctx._activePlayersNumMoves
        }
      ];
    }
    if (arg.currentPlayer !== void 0) {
      ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, ctx.currentPlayer, arg.currentPlayer);
    }
    if (arg.others !== void 0) {
      for (let i2 = 0; i2 < ctx.playOrder.length; i2++) {
        const id = ctx.playOrder[i2];
        if (id !== ctx.currentPlayer) {
          ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.others);
        }
      }
    }
    if (arg.all !== void 0) {
      for (let i2 = 0; i2 < ctx.playOrder.length; i2++) {
        const id = ctx.playOrder[i2];
        ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.all);
      }
    }
    if (arg.value) {
      for (const id in arg.value) {
        ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.value[id]);
      }
    }
    if (arg.minMoves) {
      for (const id in activePlayers) {
        if (_activePlayersMinMoves[id] === void 0) {
          _activePlayersMinMoves[id] = arg.minMoves;
        }
      }
    }
    if (arg.maxMoves) {
      for (const id in activePlayers) {
        if (_activePlayersMaxMoves[id] === void 0) {
          _activePlayersMaxMoves[id] = arg.maxMoves;
        }
      }
    }
  }
  if (Object.keys(activePlayers).length === 0) {
    activePlayers = null;
  }
  if (Object.keys(_activePlayersMinMoves).length === 0) {
    _activePlayersMinMoves = null;
  }
  if (Object.keys(_activePlayersMaxMoves).length === 0) {
    _activePlayersMaxMoves = null;
  }
  const _activePlayersNumMoves = {};
  for (const id in activePlayers) {
    _activePlayersNumMoves[id] = 0;
  }
  return {
    ...ctx,
    activePlayers,
    _activePlayersMinMoves,
    _activePlayersMaxMoves,
    _activePlayersNumMoves,
    _prevActivePlayers,
    _nextActivePlayers
  };
}
function UpdateActivePlayersOnceEmpty(ctx) {
  let { activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, _activePlayersNumMoves, _prevActivePlayers, _nextActivePlayers } = ctx;
  if (activePlayers && Object.keys(activePlayers).length === 0) {
    if (_nextActivePlayers) {
      ctx = SetActivePlayers(ctx, _nextActivePlayers);
      ({
        activePlayers,
        _activePlayersMinMoves,
        _activePlayersMaxMoves,
        _activePlayersNumMoves,
        _prevActivePlayers
      } = ctx);
    } else if (_prevActivePlayers.length > 0) {
      const lastIndex = _prevActivePlayers.length - 1;
      ({
        activePlayers,
        _activePlayersMinMoves,
        _activePlayersMaxMoves,
        _activePlayersNumMoves
      } = _prevActivePlayers[lastIndex]);
      _prevActivePlayers = _prevActivePlayers.slice(0, lastIndex);
    } else {
      activePlayers = null;
      _activePlayersMinMoves = null;
      _activePlayersMaxMoves = null;
    }
  }
  return {
    ...ctx,
    activePlayers,
    _activePlayersMinMoves,
    _activePlayersMaxMoves,
    _activePlayersNumMoves,
    _prevActivePlayers
  };
}
function ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, playerID, arg) {
  if (typeof arg !== "object" || arg === Stage.NULL) {
    arg = { stage: arg };
  }
  if (arg.stage !== void 0) {
    supportDeprecatedMoveLimit(arg);
    activePlayers[playerID] = arg.stage;
    if (arg.minMoves)
      _activePlayersMinMoves[playerID] = arg.minMoves;
    if (arg.maxMoves)
      _activePlayersMaxMoves[playerID] = arg.maxMoves;
  }
}
function getCurrentPlayer(playOrder, playOrderPos) {
  return playOrder[playOrderPos] + "";
}
function InitTurnOrderState(state, turn) {
  let { G: G2, ctx } = state;
  const { numPlayers } = ctx;
  const pluginAPIs = GetAPIs(state);
  const context = { ...pluginAPIs, G: G2, ctx };
  const order = turn.order;
  let playOrder = [...Array.from({ length: numPlayers })].map((_2, i2) => i2 + "");
  if (order.playOrder !== void 0) {
    playOrder = order.playOrder(context);
  }
  const playOrderPos = order.first(context);
  const posType = typeof playOrderPos;
  if (posType !== "number") {
    error(`invalid value returned by turn.order.first \u2014 expected number got ${posType} \u201C${playOrderPos}\u201D.`);
  }
  const currentPlayer = getCurrentPlayer(playOrder, playOrderPos);
  ctx = { ...ctx, currentPlayer, playOrderPos, playOrder };
  ctx = SetActivePlayers(ctx, turn.activePlayers || {});
  return ctx;
}
function UpdateTurnOrderState(state, currentPlayer, turn, endTurnArg) {
  const order = turn.order;
  let { G: G2, ctx } = state;
  let playOrderPos = ctx.playOrderPos;
  let endPhase = false;
  if (endTurnArg && endTurnArg !== true) {
    if (typeof endTurnArg !== "object") {
      error(`invalid argument to endTurn: ${endTurnArg}`);
    }
    Object.keys(endTurnArg).forEach((arg) => {
      switch (arg) {
        case "remove":
          currentPlayer = getCurrentPlayer(ctx.playOrder, playOrderPos);
          break;
        case "next":
          playOrderPos = ctx.playOrder.indexOf(endTurnArg.next);
          currentPlayer = endTurnArg.next;
          break;
        default:
          error(`invalid argument to endTurn: ${arg}`);
      }
    });
  } else {
    const pluginAPIs = GetAPIs(state);
    const context = { ...pluginAPIs, G: G2, ctx };
    const t2 = order.next(context);
    const type = typeof t2;
    if (t2 !== void 0 && type !== "number") {
      error(`invalid value returned by turn.order.next \u2014 expected number or undefined got ${type} \u201C${t2}\u201D.`);
    }
    if (t2 === void 0) {
      endPhase = true;
    } else {
      playOrderPos = t2;
      currentPlayer = getCurrentPlayer(ctx.playOrder, playOrderPos);
    }
  }
  ctx = {
    ...ctx,
    playOrderPos,
    currentPlayer
  };
  return { endPhase, ctx };
}
var TurnOrder = {
  /**
   * DEFAULT
   *
   * The default round-robin turn order.
   */
  DEFAULT: {
    first: ({ ctx }) => ctx.turn === 0 ? ctx.playOrderPos : (ctx.playOrderPos + 1) % ctx.playOrder.length,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.playOrder.length
  },
  /**
   * RESET
   *
   * Similar to DEFAULT, but starts from 0 each time.
   */
  RESET: {
    first: () => 0,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.playOrder.length
  },
  /**
   * CONTINUE
   *
   * Similar to DEFAULT, but starts with the player who ended the last phase.
   */
  CONTINUE: {
    first: ({ ctx }) => ctx.playOrderPos,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.playOrder.length
  },
  /**
   * ONCE
   *
   * Another round-robin turn order, but goes around just once.
   * The phase ends after all players have played.
   */
  ONCE: {
    first: () => 0,
    next: ({ ctx }) => {
      if (ctx.playOrderPos < ctx.playOrder.length - 1) {
        return ctx.playOrderPos + 1;
      }
    }
  },
  /**
   * CUSTOM
   *
   * Identical to DEFAULT, but also sets playOrder at the
   * beginning of the phase.
   *
   * @param {Array} playOrder - The play order.
   */
  CUSTOM: (playOrder) => ({
    playOrder: () => playOrder,
    first: () => 0,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.playOrder.length
  }),
  /**
   * CUSTOM_FROM
   *
   * Identical to DEFAULT, but also sets playOrder at the
   * beginning of the phase to a value specified by a field
   * in G.
   *
   * @param {string} playOrderField - Field in G.
   */
  CUSTOM_FROM: (playOrderField) => ({
    playOrder: ({ G: G2 }) => G2[playOrderField],
    first: () => 0,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.playOrder.length
  })
};
var Stage = {
  NULL: null
};
var ActivePlayers = {
  /**
   * ALL
   *
   * The turn stays with one player, but any player can play (in any order)
   * until the phase ends.
   */
  ALL: { all: Stage.NULL },
  /**
   * ALL_ONCE
   *
   * The turn stays with one player, but any player can play (once, and in any order).
   * This is typically used in a phase where you want to elicit a response
   * from every player in the game.
   */
  ALL_ONCE: { all: Stage.NULL, minMoves: 1, maxMoves: 1 },
  /**
   * OTHERS
   *
   * The turn stays with one player, and every *other* player can play (in any order)
   * until the phase ends.
   */
  OTHERS: { others: Stage.NULL },
  /**
   * OTHERS_ONCE
   *
   * The turn stays with one player, and every *other* player can play (once, and in any order).
   * This is typically used in a phase where you want to elicit a response
   * from every *other* player in the game.
   */
  OTHERS_ONCE: { others: Stage.NULL, minMoves: 1, maxMoves: 1 }
};

// node_modules/boardgame.io/dist/esm/reducer-24ea3e4c.js
var import_rfc6902 = __toESM(require_rfc6902());
function Flow({ moves, phases, endIf, onEnd, turn, events, plugins }) {
  if (moves === void 0) {
    moves = {};
  }
  if (events === void 0) {
    events = {};
  }
  if (plugins === void 0) {
    plugins = [];
  }
  if (phases === void 0) {
    phases = {};
  }
  if (!endIf)
    endIf = () => void 0;
  if (!onEnd)
    onEnd = ({ G: G2 }) => G2;
  if (!turn)
    turn = {};
  const phaseMap = { ...phases };
  if ("" in phaseMap) {
    error("cannot specify phase with empty name");
  }
  phaseMap[""] = {};
  const moveMap = {};
  const moveNames = /* @__PURE__ */ new Set();
  let startingPhase = null;
  Object.keys(moves).forEach((name) => moveNames.add(name));
  const HookWrapper = (hook, hookType) => {
    const withPlugins = FnWrap(hook, hookType, plugins);
    return (state) => {
      const pluginAPIs = GetAPIs(state);
      return withPlugins({
        ...pluginAPIs,
        G: state.G,
        ctx: state.ctx,
        playerID: state.playerID
      });
    };
  };
  const TriggerWrapper = (trigger) => {
    return (state) => {
      const pluginAPIs = GetAPIs(state);
      return trigger({
        ...pluginAPIs,
        G: state.G,
        ctx: state.ctx
      });
    };
  };
  const wrapped = {
    onEnd: HookWrapper(onEnd, GameMethod.GAME_ON_END),
    endIf: TriggerWrapper(endIf)
  };
  for (const phase in phaseMap) {
    const phaseConfig = phaseMap[phase];
    if (phaseConfig.start === true) {
      startingPhase = phase;
    }
    if (phaseConfig.moves !== void 0) {
      for (const move of Object.keys(phaseConfig.moves)) {
        moveMap[phase + "." + move] = phaseConfig.moves[move];
        moveNames.add(move);
      }
    }
    if (phaseConfig.endIf === void 0) {
      phaseConfig.endIf = () => void 0;
    }
    if (phaseConfig.onBegin === void 0) {
      phaseConfig.onBegin = ({ G: G2 }) => G2;
    }
    if (phaseConfig.onEnd === void 0) {
      phaseConfig.onEnd = ({ G: G2 }) => G2;
    }
    if (phaseConfig.turn === void 0) {
      phaseConfig.turn = turn;
    }
    if (phaseConfig.turn.order === void 0) {
      phaseConfig.turn.order = TurnOrder.DEFAULT;
    }
    if (phaseConfig.turn.onBegin === void 0) {
      phaseConfig.turn.onBegin = ({ G: G2 }) => G2;
    }
    if (phaseConfig.turn.onEnd === void 0) {
      phaseConfig.turn.onEnd = ({ G: G2 }) => G2;
    }
    if (phaseConfig.turn.endIf === void 0) {
      phaseConfig.turn.endIf = () => false;
    }
    if (phaseConfig.turn.onMove === void 0) {
      phaseConfig.turn.onMove = ({ G: G2 }) => G2;
    }
    if (phaseConfig.turn.stages === void 0) {
      phaseConfig.turn.stages = {};
    }
    supportDeprecatedMoveLimit(phaseConfig.turn, true);
    for (const stage in phaseConfig.turn.stages) {
      const stageConfig = phaseConfig.turn.stages[stage];
      const moves2 = stageConfig.moves || {};
      for (const move of Object.keys(moves2)) {
        const key = phase + "." + stage + "." + move;
        moveMap[key] = moves2[move];
        moveNames.add(move);
      }
    }
    phaseConfig.wrapped = {
      onBegin: HookWrapper(phaseConfig.onBegin, GameMethod.PHASE_ON_BEGIN),
      onEnd: HookWrapper(phaseConfig.onEnd, GameMethod.PHASE_ON_END),
      endIf: TriggerWrapper(phaseConfig.endIf)
    };
    phaseConfig.turn.wrapped = {
      onMove: HookWrapper(phaseConfig.turn.onMove, GameMethod.TURN_ON_MOVE),
      onBegin: HookWrapper(phaseConfig.turn.onBegin, GameMethod.TURN_ON_BEGIN),
      onEnd: HookWrapper(phaseConfig.turn.onEnd, GameMethod.TURN_ON_END),
      endIf: TriggerWrapper(phaseConfig.turn.endIf)
    };
    if (typeof phaseConfig.next !== "function") {
      const { next } = phaseConfig;
      phaseConfig.next = () => next || null;
    }
    phaseConfig.wrapped.next = TriggerWrapper(phaseConfig.next);
  }
  function GetPhase(ctx) {
    return ctx.phase ? phaseMap[ctx.phase] : phaseMap[""];
  }
  function OnMove(state) {
    return state;
  }
  function Process(state, events2) {
    const phasesEnded = /* @__PURE__ */ new Set();
    const turnsEnded = /* @__PURE__ */ new Set();
    for (let i2 = 0; i2 < events2.length; i2++) {
      const { fn: fn2, arg, ...rest } = events2[i2];
      if (fn2 === EndPhase) {
        turnsEnded.clear();
        const phase = state.ctx.phase;
        if (phasesEnded.has(phase)) {
          const ctx = { ...state.ctx, phase: null };
          return { ...state, ctx };
        }
        phasesEnded.add(phase);
      }
      const next = [];
      state = fn2(state, {
        ...rest,
        arg,
        next
      });
      if (fn2 === EndGame) {
        break;
      }
      const shouldEndGame = ShouldEndGame(state);
      if (shouldEndGame) {
        events2.push({
          fn: EndGame,
          arg: shouldEndGame,
          turn: state.ctx.turn,
          phase: state.ctx.phase,
          automatic: true
        });
        continue;
      }
      const shouldEndPhase = ShouldEndPhase(state);
      if (shouldEndPhase) {
        events2.push({
          fn: EndPhase,
          arg: shouldEndPhase,
          turn: state.ctx.turn,
          phase: state.ctx.phase,
          automatic: true
        });
        continue;
      }
      if ([OnMove, UpdateStage, UpdateActivePlayers].includes(fn2)) {
        const shouldEndTurn = ShouldEndTurn(state);
        if (shouldEndTurn) {
          events2.push({
            fn: EndTurn,
            arg: shouldEndTurn,
            turn: state.ctx.turn,
            phase: state.ctx.phase,
            automatic: true
          });
          continue;
        }
      }
      events2.push(...next);
    }
    return state;
  }
  function StartGame(state, { next }) {
    next.push({ fn: StartPhase });
    return state;
  }
  function StartPhase(state, { next }) {
    let { G: G2, ctx } = state;
    const phaseConfig = GetPhase(ctx);
    G2 = phaseConfig.wrapped.onBegin(state);
    next.push({ fn: StartTurn });
    return { ...state, G: G2, ctx };
  }
  function StartTurn(state, { currentPlayer }) {
    let { ctx } = state;
    const phaseConfig = GetPhase(ctx);
    if (currentPlayer) {
      ctx = { ...ctx, currentPlayer };
      if (phaseConfig.turn.activePlayers) {
        ctx = SetActivePlayers(ctx, phaseConfig.turn.activePlayers);
      }
    } else {
      ctx = InitTurnOrderState(state, phaseConfig.turn);
    }
    const turn2 = ctx.turn + 1;
    ctx = { ...ctx, turn: turn2, numMoves: 0, _prevActivePlayers: [] };
    const G2 = phaseConfig.turn.wrapped.onBegin({ ...state, ctx });
    return { ...state, G: G2, ctx, _undo: [], _redo: [] };
  }
  function UpdatePhase(state, { arg, next, phase }) {
    const phaseConfig = GetPhase({ phase });
    let { ctx } = state;
    if (arg && arg.next) {
      if (arg.next in phaseMap) {
        ctx = { ...ctx, phase: arg.next };
      } else {
        error("invalid phase: " + arg.next);
        return state;
      }
    } else {
      ctx = { ...ctx, phase: phaseConfig.wrapped.next(state) || null };
    }
    state = { ...state, ctx };
    next.push({ fn: StartPhase });
    return state;
  }
  function UpdateTurn(state, { arg, currentPlayer, next }) {
    let { G: G2, ctx } = state;
    const phaseConfig = GetPhase(ctx);
    const { endPhase, ctx: newCtx } = UpdateTurnOrderState(state, currentPlayer, phaseConfig.turn, arg);
    ctx = newCtx;
    state = { ...state, G: G2, ctx };
    if (endPhase) {
      next.push({ fn: EndPhase, turn: ctx.turn, phase: ctx.phase });
    } else {
      next.push({ fn: StartTurn, currentPlayer: ctx.currentPlayer });
    }
    return state;
  }
  function UpdateStage(state, { arg, playerID }) {
    if (typeof arg === "string" || arg === Stage.NULL) {
      arg = { stage: arg };
    }
    if (typeof arg !== "object")
      return state;
    supportDeprecatedMoveLimit(arg);
    let { ctx } = state;
    let { activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, _activePlayersNumMoves } = ctx;
    if (arg.stage !== void 0) {
      if (activePlayers === null) {
        activePlayers = {};
      }
      activePlayers[playerID] = arg.stage;
      _activePlayersNumMoves[playerID] = 0;
      if (arg.minMoves) {
        if (_activePlayersMinMoves === null) {
          _activePlayersMinMoves = {};
        }
        _activePlayersMinMoves[playerID] = arg.minMoves;
      }
      if (arg.maxMoves) {
        if (_activePlayersMaxMoves === null) {
          _activePlayersMaxMoves = {};
        }
        _activePlayersMaxMoves[playerID] = arg.maxMoves;
      }
    }
    ctx = {
      ...ctx,
      activePlayers,
      _activePlayersMinMoves,
      _activePlayersMaxMoves,
      _activePlayersNumMoves
    };
    return { ...state, ctx };
  }
  function UpdateActivePlayers(state, { arg }) {
    return { ...state, ctx: SetActivePlayers(state.ctx, arg) };
  }
  function ShouldEndGame(state) {
    return wrapped.endIf(state);
  }
  function ShouldEndPhase(state) {
    const phaseConfig = GetPhase(state.ctx);
    return phaseConfig.wrapped.endIf(state);
  }
  function ShouldEndTurn(state) {
    const phaseConfig = GetPhase(state.ctx);
    const currentPlayerMoves = state.ctx.numMoves || 0;
    if (phaseConfig.turn.maxMoves && currentPlayerMoves >= phaseConfig.turn.maxMoves) {
      return true;
    }
    return phaseConfig.turn.wrapped.endIf(state);
  }
  function EndGame(state, { arg, phase }) {
    state = EndPhase(state, { phase });
    if (arg === void 0) {
      arg = true;
    }
    state = { ...state, ctx: { ...state.ctx, gameover: arg } };
    const G2 = wrapped.onEnd(state);
    return { ...state, G: G2 };
  }
  function EndPhase(state, { arg, next, turn: initialTurn, automatic }) {
    state = EndTurn(state, { turn: initialTurn, force: true, automatic: true });
    const { phase, turn: turn2 } = state.ctx;
    if (next) {
      next.push({ fn: UpdatePhase, arg, phase });
    }
    if (phase === null) {
      return state;
    }
    const phaseConfig = GetPhase(state.ctx);
    const G2 = phaseConfig.wrapped.onEnd(state);
    const ctx = { ...state.ctx, phase: null };
    const action = gameEvent("endPhase", arg);
    const { _stateID } = state;
    const logEntry = { action, _stateID, turn: turn2, phase };
    if (automatic)
      logEntry.automatic = true;
    const deltalog = [...state.deltalog || [], logEntry];
    return { ...state, G: G2, ctx, deltalog };
  }
  function EndTurn(state, { arg, next, turn: initialTurn, force, automatic, playerID }) {
    if (initialTurn !== state.ctx.turn) {
      return state;
    }
    const { currentPlayer, numMoves, phase, turn: turn2 } = state.ctx;
    const phaseConfig = GetPhase(state.ctx);
    const currentPlayerMoves = numMoves || 0;
    if (!force && phaseConfig.turn.minMoves && currentPlayerMoves < phaseConfig.turn.minMoves) {
      info(`cannot end turn before making ${phaseConfig.turn.minMoves} moves`);
      return state;
    }
    const G2 = phaseConfig.turn.wrapped.onEnd(state);
    if (next) {
      next.push({ fn: UpdateTurn, arg, currentPlayer });
    }
    let ctx = { ...state.ctx, activePlayers: null };
    if (arg && arg.remove) {
      playerID = playerID || currentPlayer;
      const playOrder = ctx.playOrder.filter((i2) => i2 != playerID);
      const playOrderPos = ctx.playOrderPos > playOrder.length - 1 ? 0 : ctx.playOrderPos;
      ctx = { ...ctx, playOrder, playOrderPos };
      if (playOrder.length === 0) {
        next.push({ fn: EndPhase, turn: turn2, phase });
        return state;
      }
    }
    const action = gameEvent("endTurn", arg);
    const { _stateID } = state;
    const logEntry = { action, _stateID, turn: turn2, phase };
    if (automatic)
      logEntry.automatic = true;
    const deltalog = [...state.deltalog || [], logEntry];
    return { ...state, G: G2, ctx, deltalog, _undo: [], _redo: [] };
  }
  function EndStage(state, { arg, next, automatic, playerID }) {
    playerID = playerID || state.ctx.currentPlayer;
    let { ctx, _stateID } = state;
    let { activePlayers, _activePlayersNumMoves, _activePlayersMinMoves, _activePlayersMaxMoves, phase, turn: turn2 } = ctx;
    const playerInStage = activePlayers !== null && playerID in activePlayers;
    const phaseConfig = GetPhase(ctx);
    if (!arg && playerInStage) {
      const stage = phaseConfig.turn.stages[activePlayers[playerID]];
      if (stage && stage.next) {
        arg = stage.next;
      }
    }
    if (next) {
      next.push({ fn: UpdateStage, arg, playerID });
    }
    if (!playerInStage)
      return state;
    const currentPlayerMoves = _activePlayersNumMoves[playerID] || 0;
    if (_activePlayersMinMoves && _activePlayersMinMoves[playerID] && currentPlayerMoves < _activePlayersMinMoves[playerID]) {
      info(`cannot end stage before making ${_activePlayersMinMoves[playerID]} moves`);
      return state;
    }
    activePlayers = { ...activePlayers };
    delete activePlayers[playerID];
    if (_activePlayersMinMoves) {
      _activePlayersMinMoves = { ..._activePlayersMinMoves };
      delete _activePlayersMinMoves[playerID];
    }
    if (_activePlayersMaxMoves) {
      _activePlayersMaxMoves = { ..._activePlayersMaxMoves };
      delete _activePlayersMaxMoves[playerID];
    }
    ctx = UpdateActivePlayersOnceEmpty({
      ...ctx,
      activePlayers,
      _activePlayersMinMoves,
      _activePlayersMaxMoves
    });
    const action = gameEvent("endStage", arg);
    const logEntry = { action, _stateID, turn: turn2, phase };
    if (automatic)
      logEntry.automatic = true;
    const deltalog = [...state.deltalog || [], logEntry];
    return { ...state, ctx, deltalog };
  }
  function GetMove(ctx, name, playerID) {
    const phaseConfig = GetPhase(ctx);
    const stages = phaseConfig.turn.stages;
    const { activePlayers } = ctx;
    if (activePlayers && activePlayers[playerID] !== void 0 && activePlayers[playerID] !== Stage.NULL && stages[activePlayers[playerID]] !== void 0 && stages[activePlayers[playerID]].moves !== void 0) {
      const stage = stages[activePlayers[playerID]];
      const moves2 = stage.moves;
      if (name in moves2) {
        return moves2[name];
      }
    } else if (phaseConfig.moves) {
      if (name in phaseConfig.moves) {
        return phaseConfig.moves[name];
      }
    } else if (name in moves) {
      return moves[name];
    }
    return null;
  }
  function ProcessMove(state, action) {
    const { playerID, type } = action;
    const { currentPlayer, activePlayers, _activePlayersMaxMoves } = state.ctx;
    const move = GetMove(state.ctx, type, playerID);
    const shouldCount = !move || typeof move === "function" || move.noLimit !== true;
    let { numMoves, _activePlayersNumMoves } = state.ctx;
    if (shouldCount) {
      if (playerID === currentPlayer)
        numMoves++;
      if (activePlayers)
        _activePlayersNumMoves[playerID]++;
    }
    state = {
      ...state,
      ctx: {
        ...state.ctx,
        numMoves,
        _activePlayersNumMoves
      }
    };
    if (_activePlayersMaxMoves && _activePlayersNumMoves[playerID] >= _activePlayersMaxMoves[playerID]) {
      state = EndStage(state, { playerID, automatic: true });
    }
    const phaseConfig = GetPhase(state.ctx);
    const G2 = phaseConfig.turn.wrapped.onMove({ ...state, playerID });
    state = { ...state, G: G2 };
    const events2 = [{ fn: OnMove }];
    return Process(state, events2);
  }
  function SetStageEvent(state, playerID, arg) {
    return Process(state, [{ fn: EndStage, arg, playerID }]);
  }
  function EndStageEvent(state, playerID) {
    return Process(state, [{ fn: EndStage, playerID }]);
  }
  function SetActivePlayersEvent(state, _playerID, arg) {
    return Process(state, [{ fn: UpdateActivePlayers, arg }]);
  }
  function SetPhaseEvent(state, _playerID, newPhase) {
    return Process(state, [
      {
        fn: EndPhase,
        phase: state.ctx.phase,
        turn: state.ctx.turn,
        arg: { next: newPhase }
      }
    ]);
  }
  function EndPhaseEvent(state) {
    return Process(state, [
      { fn: EndPhase, phase: state.ctx.phase, turn: state.ctx.turn }
    ]);
  }
  function EndTurnEvent(state, _playerID, arg) {
    return Process(state, [
      { fn: EndTurn, turn: state.ctx.turn, phase: state.ctx.phase, arg }
    ]);
  }
  function PassEvent(state, _playerID, arg) {
    return Process(state, [
      {
        fn: EndTurn,
        turn: state.ctx.turn,
        phase: state.ctx.phase,
        force: true,
        arg
      }
    ]);
  }
  function EndGameEvent(state, _playerID, arg) {
    return Process(state, [
      { fn: EndGame, turn: state.ctx.turn, phase: state.ctx.phase, arg }
    ]);
  }
  const eventHandlers = {
    endStage: EndStageEvent,
    setStage: SetStageEvent,
    endTurn: EndTurnEvent,
    pass: PassEvent,
    endPhase: EndPhaseEvent,
    setPhase: SetPhaseEvent,
    endGame: EndGameEvent,
    setActivePlayers: SetActivePlayersEvent
  };
  const enabledEventNames = [];
  if (events.endTurn !== false) {
    enabledEventNames.push("endTurn");
  }
  if (events.pass !== false) {
    enabledEventNames.push("pass");
  }
  if (events.endPhase !== false) {
    enabledEventNames.push("endPhase");
  }
  if (events.setPhase !== false) {
    enabledEventNames.push("setPhase");
  }
  if (events.endGame !== false) {
    enabledEventNames.push("endGame");
  }
  if (events.setActivePlayers !== false) {
    enabledEventNames.push("setActivePlayers");
  }
  if (events.endStage !== false) {
    enabledEventNames.push("endStage");
  }
  if (events.setStage !== false) {
    enabledEventNames.push("setStage");
  }
  function ProcessEvent(state, action) {
    const { type, playerID, args } = action.payload;
    if (typeof eventHandlers[type] !== "function")
      return state;
    return eventHandlers[type](state, playerID, ...Array.isArray(args) ? args : [args]);
  }
  function IsPlayerActive(_G, ctx, playerID) {
    if (ctx.activePlayers) {
      return playerID in ctx.activePlayers;
    }
    return ctx.currentPlayer === playerID;
  }
  return {
    ctx: (numPlayers) => ({
      numPlayers,
      turn: 0,
      currentPlayer: "0",
      playOrder: [...Array.from({ length: numPlayers })].map((_2, i2) => i2 + ""),
      playOrderPos: 0,
      phase: startingPhase,
      activePlayers: null
    }),
    init: (state) => {
      return Process(state, [{ fn: StartGame }]);
    },
    isPlayerActive: IsPlayerActive,
    eventHandlers,
    eventNames: Object.keys(eventHandlers),
    enabledEventNames,
    moveMap,
    moveNames: [...moveNames.values()],
    processMove: ProcessMove,
    processEvent: ProcessEvent,
    getMove: GetMove
  };
}
function IsProcessed(game) {
  return game.processMove !== void 0;
}
function ProcessGameConfig(game) {
  if (IsProcessed(game)) {
    return game;
  }
  if (game.name === void 0)
    game.name = "default";
  if (game.deltaState === void 0)
    game.deltaState = false;
  if (game.disableUndo === void 0)
    game.disableUndo = false;
  if (game.setup === void 0)
    game.setup = () => ({});
  if (game.moves === void 0)
    game.moves = {};
  if (game.playerView === void 0)
    game.playerView = ({ G: G2 }) => G2;
  if (game.plugins === void 0)
    game.plugins = [];
  game.plugins.forEach((plugin2) => {
    if (plugin2.name === void 0) {
      throw new Error("Plugin missing name attribute");
    }
    if (plugin2.name.includes(" ")) {
      throw new Error(plugin2.name + ": Plugin name must not include spaces");
    }
  });
  if (game.name.includes(" ")) {
    throw new Error(game.name + ": Game name must not include spaces");
  }
  const flow = Flow(game);
  return {
    ...game,
    flow,
    moveNames: flow.moveNames,
    pluginNames: game.plugins.map((p2) => p2.name),
    processMove: (state, action) => {
      let moveFn = flow.getMove(state.ctx, action.type, action.playerID);
      if (IsLongFormMove(moveFn)) {
        moveFn = moveFn.move;
      }
      if (moveFn instanceof Function) {
        const fn2 = FnWrap(moveFn, GameMethod.MOVE, game.plugins);
        let args = [];
        if (action.args !== void 0) {
          args = Array.isArray(action.args) ? action.args : [action.args];
        }
        const context = {
          ...GetAPIs(state),
          G: state.G,
          ctx: state.ctx,
          playerID: action.playerID
        };
        return fn2(context, ...args);
      }
      error(`invalid move object: ${action.type}`);
      return state.G;
    }
  };
}
function IsLongFormMove(move) {
  return move instanceof Object && move.move !== void 0;
}
var UpdateErrorType;
(function(UpdateErrorType2) {
  UpdateErrorType2["UnauthorizedAction"] = "update/unauthorized_action";
  UpdateErrorType2["MatchNotFound"] = "update/match_not_found";
  UpdateErrorType2["PatchFailed"] = "update/patch_failed";
})(UpdateErrorType || (UpdateErrorType = {}));
var ActionErrorType;
(function(ActionErrorType2) {
  ActionErrorType2["StaleStateId"] = "action/stale_state_id";
  ActionErrorType2["UnavailableMove"] = "action/unavailable_move";
  ActionErrorType2["InvalidMove"] = "action/invalid_move";
  ActionErrorType2["InactivePlayer"] = "action/inactive_player";
  ActionErrorType2["GameOver"] = "action/gameover";
  ActionErrorType2["ActionDisabled"] = "action/action_disabled";
  ActionErrorType2["ActionInvalid"] = "action/action_invalid";
  ActionErrorType2["PluginActionInvalid"] = "action/plugin_invalid";
})(ActionErrorType || (ActionErrorType = {}));
var actionHasPlayerID = (action) => action.payload.playerID !== null && action.payload.playerID !== void 0;
var CanUndoMove = (G2, ctx, move) => {
  function HasUndoable(move2) {
    return move2.undoable !== void 0;
  }
  function IsFunction(undoable) {
    return undoable instanceof Function;
  }
  if (!HasUndoable(move)) {
    return true;
  }
  if (IsFunction(move.undoable)) {
    return move.undoable({ G: G2, ctx });
  }
  return move.undoable;
};
function updateUndoRedoState(state, opts) {
  if (opts.game.disableUndo)
    return state;
  const undoEntry = {
    G: state.G,
    ctx: state.ctx,
    plugins: state.plugins,
    playerID: opts.action.payload.playerID || state.ctx.currentPlayer
  };
  if (opts.action.type === "MAKE_MOVE") {
    undoEntry.moveType = opts.action.payload.type;
  }
  return {
    ...state,
    _undo: [...state._undo, undoEntry],
    // Always reset redo stack when making a move or event
    _redo: []
  };
}
function initializeDeltalog(state, action, move) {
  const logEntry = {
    action,
    _stateID: state._stateID,
    turn: state.ctx.turn,
    phase: state.ctx.phase
  };
  const pluginLogMetadata = state.plugins.log.data.metadata;
  if (pluginLogMetadata !== void 0) {
    logEntry.metadata = pluginLogMetadata;
  }
  if (typeof move === "object" && move.redact === true) {
    logEntry.redact = true;
  } else if (typeof move === "object" && move.redact instanceof Function) {
    logEntry.redact = move.redact({ G: state.G, ctx: state.ctx });
  }
  return {
    ...state,
    deltalog: [logEntry]
  };
}
function flushAndValidatePlugins(state, oldState, pluginOpts) {
  const [newState, isInvalid] = FlushAndValidate(state, pluginOpts);
  if (!isInvalid)
    return [newState];
  return [
    newState,
    WithError(oldState, ActionErrorType.PluginActionInvalid, isInvalid)
  ];
}
function ExtractTransients(transientState) {
  if (!transientState) {
    return [null, void 0];
  }
  const { transients, ...state } = transientState;
  return [state, transients];
}
function WithError(state, errorType, payload) {
  const error2 = {
    type: errorType,
    payload
  };
  return {
    ...state,
    transients: {
      error: error2
    }
  };
}
var TransientHandlingMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  switch (action.type) {
    case STRIP_TRANSIENTS: {
      return result;
    }
    default: {
      const [, transients] = ExtractTransients(store.getState());
      if (typeof transients !== "undefined") {
        store.dispatch(stripTransients());
        return {
          ...result,
          transients
        };
      }
      return result;
    }
  }
};
function CreateGameReducer({ game, isClient }) {
  game = ProcessGameConfig(game);
  return (stateWithTransients = null, action) => {
    let [
      state
      /*, transients */
    ] = ExtractTransients(stateWithTransients);
    switch (action.type) {
      case STRIP_TRANSIENTS: {
        return state;
      }
      case GAME_EVENT: {
        state = { ...state, deltalog: [] };
        if (isClient) {
          return state;
        }
        if (state.ctx.gameover !== void 0) {
          error(`cannot call event after game end`);
          return WithError(state, ActionErrorType.GameOver);
        }
        if (actionHasPlayerID(action) && !game.flow.isPlayerActive(state.G, state.ctx, action.payload.playerID)) {
          error(`disallowed event: ${action.payload.type}`);
          return WithError(state, ActionErrorType.InactivePlayer);
        }
        state = Enhance(state, {
          game,
          isClient: false,
          playerID: action.payload.playerID
        });
        let newState = game.flow.processEvent(state, action);
        let stateWithError;
        [newState, stateWithError] = flushAndValidatePlugins(newState, state, {
          game,
          isClient: false
        });
        if (stateWithError)
          return stateWithError;
        newState = updateUndoRedoState(newState, { game, action });
        return { ...newState, _stateID: state._stateID + 1 };
      }
      case MAKE_MOVE: {
        const oldState = state = { ...state, deltalog: [] };
        const move = game.flow.getMove(state.ctx, action.payload.type, action.payload.playerID || state.ctx.currentPlayer);
        if (move === null) {
          error(`disallowed move: ${action.payload.type}`);
          return WithError(state, ActionErrorType.UnavailableMove);
        }
        if (isClient && move.client === false) {
          return state;
        }
        if (state.ctx.gameover !== void 0) {
          error(`cannot make move after game end`);
          return WithError(state, ActionErrorType.GameOver);
        }
        if (actionHasPlayerID(action) && !game.flow.isPlayerActive(state.G, state.ctx, action.payload.playerID)) {
          error(`disallowed move: ${action.payload.type}`);
          return WithError(state, ActionErrorType.InactivePlayer);
        }
        state = Enhance(state, {
          game,
          isClient,
          playerID: action.payload.playerID
        });
        const G2 = game.processMove(state, action.payload);
        if (G2 === INVALID_MOVE) {
          error(`invalid move: ${action.payload.type} args: ${action.payload.args}`);
          return WithError(state, ActionErrorType.InvalidMove);
        }
        const newState = { ...state, G: G2 };
        if (isClient && NoClient(newState, { game })) {
          return state;
        }
        state = newState;
        if (isClient) {
          let stateWithError2;
          [state, stateWithError2] = flushAndValidatePlugins(state, oldState, {
            game,
            isClient: true
          });
          if (stateWithError2)
            return stateWithError2;
          return {
            ...state,
            _stateID: state._stateID + 1
          };
        }
        state = initializeDeltalog(state, action, move);
        state = game.flow.processMove(state, action.payload);
        let stateWithError;
        [state, stateWithError] = flushAndValidatePlugins(state, oldState, {
          game
        });
        if (stateWithError)
          return stateWithError;
        state = updateUndoRedoState(state, { game, action });
        return {
          ...state,
          _stateID: state._stateID + 1
        };
      }
      case RESET:
      case UPDATE:
      case SYNC: {
        return action.state;
      }
      case UNDO: {
        state = { ...state, deltalog: [] };
        if (game.disableUndo) {
          error("Undo is not enabled");
          return WithError(state, ActionErrorType.ActionDisabled);
        }
        const { G: G2, ctx, _undo, _redo, _stateID } = state;
        if (_undo.length < 2) {
          error(`No moves to undo`);
          return WithError(state, ActionErrorType.ActionInvalid);
        }
        const last = _undo[_undo.length - 1];
        const restore = _undo[_undo.length - 2];
        if (actionHasPlayerID(action) && action.payload.playerID !== last.playerID) {
          error(`Cannot undo other players' moves`);
          return WithError(state, ActionErrorType.ActionInvalid);
        }
        if (last.moveType) {
          const lastMove = game.flow.getMove(restore.ctx, last.moveType, last.playerID);
          if (!CanUndoMove(G2, ctx, lastMove)) {
            error(`Move cannot be undone`);
            return WithError(state, ActionErrorType.ActionInvalid);
          }
        }
        state = initializeDeltalog(state, action);
        return {
          ...state,
          G: restore.G,
          ctx: restore.ctx,
          plugins: restore.plugins,
          _stateID: _stateID + 1,
          _undo: _undo.slice(0, -1),
          _redo: [last, ..._redo]
        };
      }
      case REDO: {
        state = { ...state, deltalog: [] };
        if (game.disableUndo) {
          error("Redo is not enabled");
          return WithError(state, ActionErrorType.ActionDisabled);
        }
        const { _undo, _redo, _stateID } = state;
        if (_redo.length === 0) {
          error(`No moves to redo`);
          return WithError(state, ActionErrorType.ActionInvalid);
        }
        const first = _redo[0];
        if (actionHasPlayerID(action) && action.payload.playerID !== first.playerID) {
          error(`Cannot redo other players' moves`);
          return WithError(state, ActionErrorType.ActionInvalid);
        }
        state = initializeDeltalog(state, action);
        return {
          ...state,
          G: first.G,
          ctx: first.ctx,
          plugins: first.plugins,
          _stateID: _stateID + 1,
          _undo: [..._undo, first],
          _redo: _redo.slice(1)
        };
      }
      case PLUGIN: {
        return ProcessAction(state, action, { game });
      }
      case PATCH: {
        const oldState = state;
        const newState = JSON.parse(JSON.stringify(oldState));
        const patchError = (0, import_rfc6902.applyPatch)(newState, action.patch);
        const hasError = patchError.some((entry) => entry !== null);
        if (hasError) {
          error(`Patch ${JSON.stringify(action.patch)} apply failed`);
          return WithError(oldState, UpdateErrorType.PatchFailed, patchError);
        } else {
          return newState;
        }
      }
      default: {
        return state;
      }
    }
  };
}

// node_modules/flatted/esm/index.js
var { parse: $parse, stringify: $stringify } = JSON;
var { keys } = Object;
var Primitive = String;
var primitive = "string";
var ignore = {};
var object = "object";
var noop = (_2, value2) => value2;
var primitives = (value2) => value2 instanceof Primitive ? Primitive(value2) : value2;
var Primitives = (_2, value2) => typeof value2 === primitive ? new Primitive(value2) : value2;
var resolver = (input, lazy, parsed, $) => (output) => {
  for (let ke = keys(output), { length } = ke, y2 = 0; y2 < length; y2++) {
    const k2 = ke[y2];
    const value2 = output[k2];
    if (value2 instanceof Primitive) {
      const tmp = input[+value2];
      if (typeof tmp === object && !parsed.has(tmp)) {
        parsed.add(tmp);
        output[k2] = ignore;
        lazy.push({ o: output, k: k2, r: tmp });
      } else
        output[k2] = $.call(output, k2, tmp);
    } else if (output[k2] !== ignore)
      output[k2] = $.call(output, k2, value2);
  }
  return output;
};
var set = (known, input, value2) => {
  const index = Primitive(input.push(value2) - 1);
  known.set(value2, index);
  return index;
};
var parse = (text2, reviver) => {
  const input = $parse(text2, Primitives).map(primitives);
  const $ = reviver || noop;
  let value2 = input[0];
  if (typeof value2 === object && value2) {
    const lazy = [];
    const revive = resolver(input, lazy, /* @__PURE__ */ new Set(), $);
    value2 = revive(value2);
    let i2 = 0;
    while (i2 < lazy.length) {
      const { o: o2, k: k2, r: r2 } = lazy[i2++];
      o2[k2] = $.call(o2, k2, revive(r2));
    }
  }
  return $.call({ "": value2 }, "", value2);
};
var stringify = (value2, replacer, space2) => {
  const $ = replacer && typeof replacer === object ? (k2, v2) => k2 === "" || -1 < replacer.indexOf(k2) ? v2 : void 0 : replacer || noop;
  const known = /* @__PURE__ */ new Map();
  const input = [];
  const output = [];
  let i2 = +set(known, input, $.call({ "": value2 }, "", value2));
  let firstRun = !i2;
  while (i2 < input.length) {
    firstRun = true;
    output[i2] = $stringify(input[i2++], replace, space2);
  }
  return "[" + output.join(",") + "]";
  function replace(key, value3) {
    if (firstRun) {
      firstRun = !firstRun;
      return value3;
    }
    const after = $.call(this, key, value3);
    switch (typeof after) {
      case object:
        if (after === null) return after;
      case primitive:
        return known.get(after) || set(known, input, after);
    }
    return after;
  }
};

// node_modules/boardgame.io/dist/esm/ai-7998b00f.js
var import_setimmediate = __toESM(require_setImmediate());
var Bot = class {
  constructor({ enumerate, seed }) {
    this.enumerateFn = enumerate;
    this.seed = seed;
    this.iterationCounter = 0;
    this._opts = {};
  }
  addOpt({ key, range, initial }) {
    this._opts[key] = {
      range,
      value: initial
    };
  }
  getOpt(key) {
    return this._opts[key].value;
  }
  setOpt(key, value2) {
    if (key in this._opts) {
      this._opts[key].value = value2;
    }
  }
  opts() {
    return this._opts;
  }
  enumerate(G2, ctx, playerID) {
    const actions = this.enumerateFn(G2, ctx, playerID);
    return actions.map((a2) => {
      if ("payload" in a2) {
        return a2;
      }
      if ("move" in a2) {
        return makeMove(a2.move, a2.args, playerID);
      }
      if ("event" in a2) {
        return gameEvent(a2.event, a2.args, playerID);
      }
    });
  }
  random(arg) {
    let number;
    if (this.seed !== void 0) {
      const seed = this.prngstate ? "" : this.seed;
      const rand = alea(seed, this.prngstate);
      number = rand();
      this.prngstate = rand.state();
    } else {
      number = Math.random();
    }
    if (arg) {
      if (Array.isArray(arg)) {
        const id = Math.floor(number * arg.length);
        return arg[id];
      } else {
        return Math.floor(number * arg);
      }
    }
    return number;
  }
};
var CHUNK_SIZE = 25;
var MCTSBot = class extends Bot {
  constructor({ enumerate, seed, objectives, game, iterations, playoutDepth, iterationCallback }) {
    super({ enumerate, seed });
    if (objectives === void 0) {
      objectives = () => ({});
    }
    this.objectives = objectives;
    this.iterationCallback = iterationCallback || (() => {
    });
    this.reducer = CreateGameReducer({ game });
    this.iterations = iterations;
    this.playoutDepth = playoutDepth;
    this.addOpt({
      key: "async",
      initial: false
    });
    this.addOpt({
      key: "iterations",
      initial: typeof iterations === "number" ? iterations : 1e3,
      range: { min: 1, max: 2e3 }
    });
    this.addOpt({
      key: "playoutDepth",
      initial: typeof playoutDepth === "number" ? playoutDepth : 50,
      range: { min: 1, max: 100 }
    });
  }
  createNode({ state, parentAction, parent, playerID }) {
    const { G: G2, ctx } = state;
    let actions = [];
    let objectives = [];
    if (playerID !== void 0) {
      actions = this.enumerate(G2, ctx, playerID);
      objectives = this.objectives(G2, ctx, playerID);
    } else if (ctx.activePlayers) {
      for (const playerID2 in ctx.activePlayers) {
        actions.push(...this.enumerate(G2, ctx, playerID2));
        objectives.push(this.objectives(G2, ctx, playerID2));
      }
    } else {
      actions = this.enumerate(G2, ctx, ctx.currentPlayer);
      objectives = this.objectives(G2, ctx, ctx.currentPlayer);
    }
    return {
      state,
      parent,
      parentAction,
      actions,
      objectives,
      children: [],
      visits: 0,
      value: 0
    };
  }
  select(node) {
    if (node.actions.length > 0) {
      return node;
    }
    if (node.children.length === 0) {
      return node;
    }
    let selectedChild = null;
    let best = 0;
    for (const child of node.children) {
      const childVisits = child.visits + Number.EPSILON;
      const uct = child.value / childVisits + Math.sqrt(2 * Math.log(node.visits) / childVisits);
      if (selectedChild == null || uct > best) {
        best = uct;
        selectedChild = child;
      }
    }
    return this.select(selectedChild);
  }
  expand(node) {
    const actions = node.actions;
    if (actions.length === 0 || node.state.ctx.gameover !== void 0) {
      return node;
    }
    const id = this.random(actions.length);
    const action = actions[id];
    node.actions.splice(id, 1);
    const childState = this.reducer(node.state, action);
    const childNode = this.createNode({
      state: childState,
      parentAction: action,
      parent: node
    });
    node.children.push(childNode);
    return childNode;
  }
  playout({ state }) {
    let playoutDepth = this.getOpt("playoutDepth");
    if (typeof this.playoutDepth === "function") {
      playoutDepth = this.playoutDepth(state.G, state.ctx);
    }
    for (let i2 = 0; i2 < playoutDepth && state.ctx.gameover === void 0; i2++) {
      const { G: G2, ctx } = state;
      let playerID = ctx.currentPlayer;
      if (ctx.activePlayers) {
        playerID = Object.keys(ctx.activePlayers)[0];
      }
      const moves = this.enumerate(G2, ctx, playerID);
      const objectives = this.objectives(G2, ctx, playerID);
      const score = Object.keys(objectives).reduce((score2, key) => {
        const objective = objectives[key];
        if (objective.checker(G2, ctx)) {
          return score2 + objective.weight;
        }
        return score2;
      }, 0);
      if (score > 0) {
        return { score };
      }
      if (!moves || moves.length === 0) {
        return void 0;
      }
      const id = this.random(moves.length);
      const childState = this.reducer(state, moves[id]);
      state = childState;
    }
    return state.ctx.gameover;
  }
  backpropagate(node, result = {}) {
    node.visits++;
    if (result.score !== void 0) {
      node.value += result.score;
    }
    if (result.draw === true) {
      node.value += 0.5;
    }
    if (node.parentAction && result.winner === node.parentAction.payload.playerID) {
      node.value++;
    }
    if (node.parent) {
      this.backpropagate(node.parent, result);
    }
  }
  play(state, playerID) {
    const root = this.createNode({ state, playerID });
    let numIterations = this.getOpt("iterations");
    if (typeof this.iterations === "function") {
      numIterations = this.iterations(state.G, state.ctx);
    }
    const getResult = () => {
      let selectedChild = null;
      for (const child of root.children) {
        if (selectedChild == null || child.visits > selectedChild.visits) {
          selectedChild = child;
        }
      }
      const action = selectedChild && selectedChild.parentAction;
      const metadata = root;
      return { action, metadata };
    };
    return new Promise((resolve) => {
      const iteration = () => {
        for (let i2 = 0; i2 < CHUNK_SIZE && this.iterationCounter < numIterations; i2++) {
          const leaf = this.select(root);
          const child = this.expand(leaf);
          const result = this.playout(child);
          this.backpropagate(child, result);
          this.iterationCounter++;
        }
        this.iterationCallback({
          iterationCounter: this.iterationCounter,
          numIterations,
          metadata: root
        });
      };
      this.iterationCounter = 0;
      if (this.getOpt("async")) {
        const asyncIteration = () => {
          if (this.iterationCounter < numIterations) {
            iteration();
            setImmediate(asyncIteration);
          } else {
            resolve(getResult());
          }
        };
        asyncIteration();
      } else {
        while (this.iterationCounter < numIterations) {
          iteration();
        }
        resolve(getResult());
      }
    });
  }
};
var RandomBot = class extends Bot {
  play({ G: G2, ctx }, playerID) {
    const moves = this.enumerate(G2, ctx, playerID);
    return Promise.resolve({ action: this.random(moves) });
  }
};
async function Step(client, bot) {
  const state = client.store.getState();
  let playerID = state.ctx.currentPlayer;
  if (state.ctx.activePlayers) {
    playerID = Object.keys(state.ctx.activePlayers)[0];
  }
  const { action, metadata } = await bot.play(state, playerID);
  if (action) {
    const a2 = {
      ...action,
      payload: {
        ...action.payload,
        metadata
      }
    };
    client.store.dispatch(a2);
    return a2;
  }
}

// node_modules/boardgame.io/dist/esm/Debug-8242c26e.js
function noop2() {
}
var identity = (x2) => x2;
function assign(tar, src) {
  for (const k2 in src)
    tar[k2] = src[k2];
  return tar;
}
function run(fn2) {
  return fn2();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub2 = store.subscribe(...callbacks);
  return unsub2.unsubscribe ? () => unsub2.unsubscribe() : unsub2;
}
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn2) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn2);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn2) {
  return definition[1] && fn2 ? assign($$scope.ctx.slice(), definition[1](fn2(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn2) {
  if (definition[2] && fn2) {
    const lets = definition[2](fn2(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i2 = 0; i2 < len; i2 += 1) {
        merged[i2] = $$scope.dirty[i2] | lets[i2];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i2 = 0; i2 < length; i2++) {
      dirty[i2] = -1;
    }
    return dirty;
  }
  return -1;
}
function exclude_internal_props(props) {
  const result = {};
  for (const k2 in props)
    if (k2[0] !== "$")
      result[k2] = props[k2];
  return result;
}
function null_to_empty(value2) {
  return value2 == null ? "" : value2;
}
var is_client = typeof window !== "undefined";
var now = is_client ? () => window.performance.now() : () => Date.now();
var raf = is_client ? (cb) => requestAnimationFrame(cb) : noop2;
var tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);
  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element("style");
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
  for (let i2 = 0; i2 < iterations.length; i2 += 1) {
    if (iterations[i2])
      iterations[i2].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn2) {
  return function(event) {
    event.stopPropagation();
    return fn2.call(this, event);
  };
}
function attr(node, attribute, value2) {
  if (value2 == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value2)
    node.setAttribute(attribute, value2);
}
function to_number(value2) {
  return value2 === "" ? null : +value2;
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_input_value(input, value2) {
  input.value = value2 == null ? "" : value2;
}
function select_option(select, value2) {
  for (let i2 = 0; i2 < select.options.length; i2 += 1) {
    const option = select.options[i2];
    if (option.__value === value2) {
      option.selected = true;
      return;
    }
  }
  select.selectedIndex = -1;
}
function select_value(select) {
  const selected_option = select.querySelector(":checked") || select.options[0];
  return selected_option && selected_option.__value;
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
var managed_styles = /* @__PURE__ */ new Map();
var active = 0;
function hash(str) {
  let hash2 = 5381;
  let i2 = str.length;
  while (i2--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i2);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info2 = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info2);
  return info2;
}
function create_rule(node, a2, b2, duration, delay, ease, fn2, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p2 = 0; p2 <= 1; p2 += step) {
    const t2 = a2 + (b2 - a2) * ease(p2);
    keyframes += p2 * 100 + `%{${fn2(t2, 1 - t2)}}
`;
  }
  const rule = keyframes + `100% {${fn2(b2, 1 - b2)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
    // remove all Svelte animations
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info2) => {
      const { stylesheet } = info2;
      let i2 = stylesheet.cssRules.length;
      while (i2--)
        stylesheet.deleteRule(i2);
      info2.rules = {};
    });
    managed_styles.clear();
  });
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function afterUpdate(fn2) {
  get_current_component().$$.after_update.push(fn2);
}
function onDestroy(fn2) {
  get_current_component().$$.on_destroy.push(fn2);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail, { cancelable });
      callbacks.slice().forEach((fn2) => {
        fn2.call(component, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
  return context;
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
function bubble(component, event) {
  const callbacks = component.$$.callbacks[event.type];
  if (callbacks) {
    callbacks.slice().forEach((fn2) => fn2.call(this, event));
  }
}
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn2) {
  render_callbacks.push(fn2);
}
var seen_callbacks = /* @__PURE__ */ new Set();
var flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update2(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i2 = 0; i2 < render_callbacks.length; i2 += 1) {
      const callback = render_callbacks[i2];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update2($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
var promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
var outroing = /* @__PURE__ */ new Set();
var outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
    // parent group
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
var null_transition = { duration: 0 };
function create_in_transition(node, fn2, params) {
  let config = fn2(node, params);
  let running = false;
  let animation_name;
  let task;
  let uid = 0;
  function cleanup() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop2, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
    tick(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task)
      task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, "start"));
    task = loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(1, 0);
          dispatch(node, true, "end");
          cleanup();
          return running = false;
        }
        if (now2 >= start_time) {
          const t2 = easing((now2 - start_time) / duration);
          tick(t2, 1 - t2);
        }
      }
      return running;
    });
  }
  let started = false;
  return {
    start() {
      if (started)
        return;
      started = true;
      delete_rule(node);
      if (is_function(config)) {
        config = config();
        wait().then(go);
      } else {
        go();
      }
    },
    invalidate() {
      started = false;
    },
    end() {
      if (running) {
        cleanup();
        running = false;
      }
    }
  };
}
function create_out_transition(node, fn2, params) {
  let config = fn2(node, params);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop2, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, "start"));
    loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(0, 1);
          dispatch(node, false, "end");
          if (!--group.r) {
            run_all(group.c);
          }
          return false;
        }
        if (now2 >= start_time) {
          const t2 = easing((now2 - start_time) / duration);
          tick(1 - t2, t2);
        }
      }
      return running;
    });
  }
  if (is_function(config)) {
    wait().then(() => {
      config = config();
      go();
    });
  } else {
    go();
  }
  return {
    end(reset2) {
      if (reset2 && config.tick) {
        config.tick(1, 0);
      }
      if (running) {
        if (animation_name)
          delete_rule(node, animation_name);
        running = false;
      }
    }
  };
}
function create_bidirectional_transition(node, fn2, params, intro) {
  let config = fn2(node, params);
  let t2 = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d2 = program.b - t2;
    duration *= Math.abs(d2);
    return {
      a: t2,
      b: program.b,
      d: d2,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b2) {
    const { delay = 0, duration = 300, easing = identity, tick = noop2, css } = config || null_transition;
    const program = {
      start: now() + delay,
      b: b2
    };
    if (!b2) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t2, b2, duration, delay, easing, css);
      }
      if (b2)
        tick(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b2, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t2, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick(t2 = running_program.b, 1 - t2);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p2 = now2 - running_program.start;
            t2 = running_program.a + running_program.d * easing(p2 / running_program.duration);
            tick(t2, 1 - t2);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b2) {
      if (is_function(config)) {
        wait().then(() => {
          config = config();
          go(b2);
        });
      } else {
        go(b2);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function get_spread_update(levels, updates) {
  const update3 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i2 = levels.length;
  while (i2--) {
    const o2 = levels[i2];
    const n2 = updates[i2];
    if (n2) {
      for (const key in o2) {
        if (!(key in n2))
          to_null_out[key] = 1;
      }
      for (const key in n2) {
        if (!accounted_for[key]) {
          update3[key] = n2[key];
          accounted_for[key] = 1;
        }
      }
      levels[i2] = n2;
    } else {
      for (const key in o2) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update3))
      update3[key] = void 0;
  }
  return update3;
}
function get_spread_object(spread_props) {
  return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i2) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i2 / 31 | 0] |= 1 << i2 % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles2, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    // state
    props,
    update: noop2,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles2 && append_styles2($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i2, ret, ...rest) => {
    const value2 = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i2], $$.ctx[i2] = value2)) {
      if (!$$.skip_bound && $$.bound[i2])
        $$.bound[i2](value2);
      if (ready)
        make_dirty(component, i2);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
var SvelteComponent = class {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop2;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
};
var subscriber_queue = [];
function writable(value2, start = noop2) {
  let stop3;
  const subscribers = /* @__PURE__ */ new Set();
  function set2(new_value) {
    if (safe_not_equal(value2, new_value)) {
      value2 = new_value;
      if (stop3) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value2);
        }
        if (run_queue) {
          for (let i2 = 0; i2 < subscriber_queue.length; i2 += 2) {
            subscriber_queue[i2][0](subscriber_queue[i2 + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update3(fn2) {
    set2(fn2(value2));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop3 = start(set2) || noop2;
    }
    run2(value2);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop3();
        stop3 = null;
      }
    };
  }
  return { set: set2, update: update3, subscribe: subscribe2 };
}
function cubicOut(t2) {
  const f2 = t2 - 1;
  return f2 * f2 * f2 + 1;
}
function __rest(s2, e) {
  var t2 = {};
  for (var p2 in s2) if (Object.prototype.hasOwnProperty.call(s2, p2) && e.indexOf(p2) < 0)
    t2[p2] = s2[p2];
  if (s2 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i2 = 0, p2 = Object.getOwnPropertySymbols(s2); i2 < p2.length; i2++) {
      if (e.indexOf(p2[i2]) < 0 && Object.prototype.propertyIsEnumerable.call(s2, p2[i2]))
        t2[p2[i2]] = s2[p2[i2]];
    }
  return t2;
}
function fly(node, { delay = 0, duration = 400, easing = cubicOut, x: x2 = 0, y: y2 = 0, opacity = 0 } = {}) {
  const style = getComputedStyle(node);
  const target_opacity = +style.opacity;
  const transform = style.transform === "none" ? "" : style.transform;
  const od = target_opacity * (1 - opacity);
  return {
    delay,
    duration,
    easing,
    css: (t2, u2) => `
			transform: ${transform} translate(${(1 - t2) * x2}px, ${(1 - t2) * y2}px);
			opacity: ${target_opacity - od * u2}`
  };
}
function crossfade(_a) {
  var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
  const to_receive = /* @__PURE__ */ new Map();
  const to_send = /* @__PURE__ */ new Map();
  function crossfade2(from, node, params) {
    const { delay = 0, duration = (d3) => Math.sqrt(d3) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
    const to = node.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const dw = from.width / to.width;
    const dh = from.height / to.height;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;
    const opacity = +style.opacity;
    return {
      delay,
      duration: is_function(duration) ? duration(d2) : duration,
      easing,
      css: (t2, u2) => `
				opacity: ${t2 * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u2 * dx}px,${u2 * dy}px) scale(${t2 + (1 - t2) * dw}, ${t2 + (1 - t2) * dh});
			`
    };
  }
  function transition(items, counterparts, intro) {
    return (node, params) => {
      items.set(params.key, {
        rect: node.getBoundingClientRect()
      });
      return () => {
        if (counterparts.has(params.key)) {
          const { rect } = counterparts.get(params.key);
          counterparts.delete(params.key);
          return crossfade2(rect, node, params);
        }
        items.delete(params.key);
        return fallback && fallback(node, params, intro);
      };
    };
  }
  return [
    transition(to_send, to_receive, false),
    transition(to_receive, to_send, true)
  ];
}
function add_css(target) {
  append_styles(target, "svelte-c8tyih", "svg.svelte-c8tyih{stroke:currentColor;fill:currentColor;stroke-width:0;width:100%;height:auto;max-height:100%}");
}
function create_if_block(ctx) {
  let title_1;
  let t2;
  return {
    c() {
      title_1 = svg_element("title");
      t2 = text(
        /*title*/
        ctx[0]
      );
    },
    m(target, anchor) {
      insert(target, title_1, anchor);
      append(title_1, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*title*/
      1) set_data(
        t2,
        /*title*/
        ctx2[0]
      );
    },
    d(detaching) {
      if (detaching) detach(title_1);
    }
  };
}
function create_fragment(ctx) {
  let svg;
  let if_block_anchor;
  let current;
  let if_block = (
    /*title*/
    ctx[0] && create_if_block(ctx)
  );
  const default_slot_template = (
    /*#slots*/
    ctx[3].default
  );
  const default_slot = create_slot(
    default_slot_template,
    ctx,
    /*$$scope*/
    ctx[2],
    null
  );
  return {
    c() {
      svg = svg_element("svg");
      if (if_block) if_block.c();
      if_block_anchor = empty();
      if (default_slot) default_slot.c();
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(
        svg,
        "viewBox",
        /*viewBox*/
        ctx[1]
      );
      attr(svg, "class", "svelte-c8tyih");
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      if (if_block) if_block.m(svg, null);
      append(svg, if_block_anchor);
      if (default_slot) {
        default_slot.m(svg, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (
        /*title*/
        ctx2[0]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          if_block.m(svg, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/
        4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            /*$$scope*/
            ctx2[2],
            !current ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx2[2]
            ) : get_slot_changes(
              default_slot_template,
              /*$$scope*/
              ctx2[2],
              dirty,
              null
            ),
            null
          );
        }
      }
      if (!current || dirty & /*viewBox*/
      2) {
        attr(
          svg,
          "viewBox",
          /*viewBox*/
          ctx2[1]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (if_block) if_block.d();
      if (default_slot) default_slot.d(detaching);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { title = null } = $$props;
  let { viewBox } = $$props;
  $$self.$$set = ($$props2) => {
    if ("title" in $$props2) $$invalidate(0, title = $$props2.title);
    if ("viewBox" in $$props2) $$invalidate(1, viewBox = $$props2.viewBox);
    if ("$$scope" in $$props2) $$invalidate(2, $$scope = $$props2.$$scope);
  };
  return [title, viewBox, $$scope, slots];
}
var IconBase = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, { title: 0, viewBox: 1 }, add_css);
  }
};
function create_default_slot(ctx) {
  let path;
  return {
    c() {
      path = svg_element("path");
      attr(path, "d", "M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z");
    },
    m(target, anchor) {
      insert(target, path, anchor);
    },
    p: noop2,
    d(detaching) {
      if (detaching) detach(path);
    }
  };
}
function create_fragment$1(ctx) {
  let iconbase;
  let current;
  const iconbase_spread_levels = [
    { viewBox: "0 0 320 512" },
    /*$$props*/
    ctx[0]
  ];
  let iconbase_props = {
    $$slots: { default: [create_default_slot] },
    $$scope: { ctx }
  };
  for (let i2 = 0; i2 < iconbase_spread_levels.length; i2 += 1) {
    iconbase_props = assign(iconbase_props, iconbase_spread_levels[i2]);
  }
  iconbase = new IconBase({ props: iconbase_props });
  return {
    c() {
      create_component(iconbase.$$.fragment);
    },
    m(target, anchor) {
      mount_component(iconbase, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const iconbase_changes = dirty & /*$$props*/
      1 ? get_spread_update(iconbase_spread_levels, [iconbase_spread_levels[0], get_spread_object(
        /*$$props*/
        ctx2[0]
      )]) : {};
      if (dirty & /*$$scope*/
      2) {
        iconbase_changes.$$scope = { dirty, ctx: ctx2 };
      }
      iconbase.$set(iconbase_changes);
    },
    i(local) {
      if (current) return;
      transition_in(iconbase.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(iconbase.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(iconbase, detaching);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  $$self.$$set = ($$new_props) => {
    $$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  };
  $$props = exclude_internal_props($$props);
  return [$$props];
}
var FaChevronRight = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
  }
};
function add_css$1(target) {
  append_styles(target, "svelte-1xg9v5h", ".menu.svelte-1xg9v5h{display:flex;margin-top:43px;flex-direction:row-reverse;border:1px solid #ccc;border-radius:5px 5px 0 0;height:25px;line-height:25px;margin-right:-500px;transform-origin:bottom right;transform:rotate(-90deg) translate(0, -500px)}.menu-item.svelte-1xg9v5h{line-height:25px;cursor:pointer;border:0;background:#fefefe;color:#555;padding-left:15px;padding-right:15px;text-align:center}.menu-item.svelte-1xg9v5h:first-child{border-radius:0 5px 0 0}.menu-item.svelte-1xg9v5h:last-child{border-radius:5px 0 0 0}.menu-item.active.svelte-1xg9v5h{cursor:default;font-weight:bold;background:#ddd;color:#555}.menu-item.svelte-1xg9v5h:hover,.menu-item.svelte-1xg9v5h:focus{background:#eee;color:#555}");
}
function get_each_context(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[4] = list[i2][0];
  child_ctx[5] = list[i2][1].label;
  return child_ctx;
}
function create_each_block(ctx) {
  let button;
  let t0_value = (
    /*label*/
    ctx[5] + ""
  );
  let t0;
  let t1;
  let mounted;
  let dispose;
  function click_handler() {
    return (
      /*click_handler*/
      ctx[3](
        /*key*/
        ctx[4]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t0 = text(t0_value);
      t1 = space();
      attr(button, "class", "menu-item svelte-1xg9v5h");
      toggle_class(
        button,
        "active",
        /*pane*/
        ctx[0] == /*key*/
        ctx[4]
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*panes*/
      2 && t0_value !== (t0_value = /*label*/
      ctx[5] + "")) set_data(t0, t0_value);
      if (dirty & /*pane, Object, panes*/
      3) {
        toggle_class(
          button,
          "active",
          /*pane*/
          ctx[0] == /*key*/
          ctx[4]
        );
      }
    },
    d(detaching) {
      if (detaching) detach(button);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$2(ctx) {
  let nav;
  let each_value = Object.entries(
    /*panes*/
    ctx[1]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block(get_each_context(ctx, each_value, i2));
  }
  return {
    c() {
      nav = element("nav");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(nav, "class", "menu svelte-1xg9v5h");
    },
    m(target, anchor) {
      insert(target, nav, anchor);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(nav, null);
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*pane, Object, panes, dispatch*/
      7) {
        each_value = Object.entries(
          /*panes*/
          ctx2[1]
        );
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(nav, null);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(nav);
      destroy_each(each_blocks, detaching);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let { pane } = $$props;
  let { panes } = $$props;
  const dispatch2 = createEventDispatcher();
  const click_handler = (key) => dispatch2("change", key);
  $$self.$$set = ($$props2) => {
    if ("pane" in $$props2) $$invalidate(0, pane = $$props2.pane);
    if ("panes" in $$props2) $$invalidate(1, panes = $$props2.panes);
  };
  return [pane, panes, dispatch2, click_handler];
}
var Menu = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, { pane: 0, panes: 1 }, add_css$1);
  }
};
var contextKey = {};
function add_css$2(target) {
  append_styles(target, "svelte-1vyml86", ".container.svelte-1vyml86{display:inline-block;cursor:pointer;transform:translate(calc(0px - var(--li-identation)), -50%);position:absolute;top:50%;padding-right:100%}.arrow.svelte-1vyml86{transform-origin:25% 50%;position:relative;line-height:1.1em;font-size:0.75em;margin-left:0;transition:150ms;color:var(--arrow-sign);user-select:none;font-family:'Courier New', Courier, monospace}.expanded.svelte-1vyml86{transform:rotateZ(90deg) translateX(-3px)}");
}
function create_fragment$3(ctx) {
  let div1;
  let div0;
  let mounted;
  let dispose;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      div0.textContent = `${"\u25B6"}`;
      attr(div0, "class", "arrow svelte-1vyml86");
      toggle_class(
        div0,
        "expanded",
        /*expanded*/
        ctx[0]
      );
      attr(div1, "class", "container svelte-1vyml86");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      if (!mounted) {
        dispose = listen(
          div1,
          "click",
          /*click_handler*/
          ctx[1]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*expanded*/
      1) {
        toggle_class(
          div0,
          "expanded",
          /*expanded*/
          ctx2[0]
        );
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div1);
      mounted = false;
      dispose();
    }
  };
}
function instance$3($$self, $$props, $$invalidate) {
  let { expanded } = $$props;
  function click_handler(event) {
    bubble.call(this, $$self, event);
  }
  $$self.$$set = ($$props2) => {
    if ("expanded" in $$props2) $$invalidate(0, expanded = $$props2.expanded);
  };
  return [expanded, click_handler];
}
var JSONArrow = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, { expanded: 0 }, add_css$2);
  }
};
function add_css$3(target) {
  append_styles(target, "svelte-1vlbacg", "label.svelte-1vlbacg{display:inline-block;color:var(--label-color);padding:0}.spaced.svelte-1vlbacg{padding-right:var(--li-colon-space)}");
}
function create_if_block$1(ctx) {
  let label;
  let span;
  let t0;
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      label = element("label");
      span = element("span");
      t0 = text(
        /*key*/
        ctx[0]
      );
      t1 = text(
        /*colon*/
        ctx[2]
      );
      attr(label, "class", "svelte-1vlbacg");
      toggle_class(
        label,
        "spaced",
        /*isParentExpanded*/
        ctx[1]
      );
    },
    m(target, anchor) {
      insert(target, label, anchor);
      append(label, span);
      append(span, t0);
      append(span, t1);
      if (!mounted) {
        dispose = listen(
          label,
          "click",
          /*click_handler*/
          ctx[5]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*key*/
      1) set_data(
        t0,
        /*key*/
        ctx2[0]
      );
      if (dirty & /*colon*/
      4) set_data(
        t1,
        /*colon*/
        ctx2[2]
      );
      if (dirty & /*isParentExpanded*/
      2) {
        toggle_class(
          label,
          "spaced",
          /*isParentExpanded*/
          ctx2[1]
        );
      }
    },
    d(detaching) {
      if (detaching) detach(label);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$4(ctx) {
  let if_block_anchor;
  let if_block = (
    /*showKey*/
    ctx[3] && /*key*/
    ctx[0] && create_if_block$1(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (
        /*showKey*/
        ctx2[3] && /*key*/
        ctx2[0]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$1(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
function instance$4($$self, $$props, $$invalidate) {
  let showKey;
  let { key, isParentExpanded, isParentArray = false, colon = ":" } = $$props;
  function click_handler(event) {
    bubble.call(this, $$self, event);
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("isParentExpanded" in $$props2) $$invalidate(1, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(4, isParentArray = $$props2.isParentArray);
    if ("colon" in $$props2) $$invalidate(2, colon = $$props2.colon);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*isParentExpanded, isParentArray, key*/
    19) {
      $$invalidate(3, showKey = isParentExpanded || !isParentArray || key != +key);
    }
  };
  return [key, isParentExpanded, colon, showKey, isParentArray, click_handler];
}
var JSONKey = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$4,
      create_fragment$4,
      safe_not_equal,
      {
        key: 0,
        isParentExpanded: 1,
        isParentArray: 4,
        colon: 2
      },
      add_css$3
    );
  }
};
function add_css$4(target) {
  append_styles(target, "svelte-rwxv37", "label.svelte-rwxv37{display:inline-block}.indent.svelte-rwxv37{padding-left:var(--li-identation)}.collapse.svelte-rwxv37{--li-display:inline;display:inline;font-style:italic}.comma.svelte-rwxv37{margin-left:-0.5em;margin-right:0.5em}label.svelte-rwxv37{position:relative}");
}
function get_each_context$1(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[12] = list[i2];
  child_ctx[20] = i2;
  return child_ctx;
}
function create_if_block_3(ctx) {
  let jsonarrow;
  let current;
  jsonarrow = new JSONArrow({ props: { expanded: (
    /*expanded*/
    ctx[0]
  ) } });
  jsonarrow.$on(
    "click",
    /*toggleExpand*/
    ctx[15]
  );
  return {
    c() {
      create_component(jsonarrow.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonarrow, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const jsonarrow_changes = {};
      if (dirty & /*expanded*/
      1) jsonarrow_changes.expanded = /*expanded*/
      ctx2[0];
      jsonarrow.$set(jsonarrow_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonarrow.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonarrow.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonarrow, detaching);
    }
  };
}
function create_else_block(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = "\u2026";
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    p: noop2,
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(span);
    }
  };
}
function create_if_block$2(ctx) {
  let ul;
  let t2;
  let current;
  let mounted;
  let dispose;
  let each_value = (
    /*slicedKeys*/
    ctx[13]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$1(get_each_context$1(ctx, each_value, i2));
  }
  const out = (i2) => transition_out(each_blocks[i2], 1, 1, () => {
    each_blocks[i2] = null;
  });
  let if_block = (
    /*slicedKeys*/
    ctx[13].length < /*previewKeys*/
    ctx[7].length && create_if_block_1()
  );
  return {
    c() {
      ul = element("ul");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      t2 = space();
      if (if_block) if_block.c();
      attr(ul, "class", "svelte-rwxv37");
      toggle_class(ul, "collapse", !/*expanded*/
      ctx[0]);
    },
    m(target, anchor) {
      insert(target, ul, anchor);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(ul, null);
      }
      append(ul, t2);
      if (if_block) if_block.m(ul, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          ul,
          "click",
          /*expand*/
          ctx[16]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*expanded, previewKeys, getKey, slicedKeys, isArray, getValue, getPreviewValue*/
      10129) {
        each_value = /*slicedKeys*/
        ctx2[13];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$1(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
            transition_in(each_blocks[i2], 1);
          } else {
            each_blocks[i2] = create_each_block$1(child_ctx);
            each_blocks[i2].c();
            transition_in(each_blocks[i2], 1);
            each_blocks[i2].m(ul, t2);
          }
        }
        group_outros();
        for (i2 = each_value.length; i2 < each_blocks.length; i2 += 1) {
          out(i2);
        }
        check_outros();
      }
      if (
        /*slicedKeys*/
        ctx2[13].length < /*previewKeys*/
        ctx2[7].length
      ) {
        if (if_block) ;
        else {
          if_block = create_if_block_1();
          if_block.c();
          if_block.m(ul, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & /*expanded*/
      1) {
        toggle_class(ul, "collapse", !/*expanded*/
        ctx2[0]);
      }
    },
    i(local) {
      if (current) return;
      for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        transition_in(each_blocks[i2]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        transition_out(each_blocks[i2]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching) detach(ul);
      destroy_each(each_blocks, detaching);
      if (if_block) if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_2(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = ",";
      attr(span, "class", "comma svelte-rwxv37");
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    d(detaching) {
      if (detaching) detach(span);
    }
  };
}
function create_each_block$1(ctx) {
  let jsonnode;
  let t2;
  let if_block_anchor;
  let current;
  jsonnode = new JSONNode({
    props: {
      key: (
        /*getKey*/
        ctx[8](
          /*key*/
          ctx[12]
        )
      ),
      isParentExpanded: (
        /*expanded*/
        ctx[0]
      ),
      isParentArray: (
        /*isArray*/
        ctx[4]
      ),
      value: (
        /*expanded*/
        ctx[0] ? (
          /*getValue*/
          ctx[9](
            /*key*/
            ctx[12]
          )
        ) : (
          /*getPreviewValue*/
          ctx[10](
            /*key*/
            ctx[12]
          )
        )
      )
    }
  });
  let if_block = !/*expanded*/
  ctx[0] && /*index*/
  ctx[20] < /*previewKeys*/
  ctx[7].length - 1 && create_if_block_2();
  return {
    c() {
      create_component(jsonnode.$$.fragment);
      t2 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      mount_component(jsonnode, target, anchor);
      insert(target, t2, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const jsonnode_changes = {};
      if (dirty & /*getKey, slicedKeys*/
      8448) jsonnode_changes.key = /*getKey*/
      ctx2[8](
        /*key*/
        ctx2[12]
      );
      if (dirty & /*expanded*/
      1) jsonnode_changes.isParentExpanded = /*expanded*/
      ctx2[0];
      if (dirty & /*isArray*/
      16) jsonnode_changes.isParentArray = /*isArray*/
      ctx2[4];
      if (dirty & /*expanded, getValue, slicedKeys, getPreviewValue*/
      9729) jsonnode_changes.value = /*expanded*/
      ctx2[0] ? (
        /*getValue*/
        ctx2[9](
          /*key*/
          ctx2[12]
        )
      ) : (
        /*getPreviewValue*/
        ctx2[10](
          /*key*/
          ctx2[12]
        )
      );
      jsonnode.$set(jsonnode_changes);
      if (!/*expanded*/
      ctx2[0] && /*index*/
      ctx2[20] < /*previewKeys*/
      ctx2[7].length - 1) {
        if (if_block) ;
        else {
          if_block = create_if_block_2();
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(jsonnode.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnode.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnode, detaching);
      if (detaching) detach(t2);
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
function create_if_block_1(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = "\u2026";
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    d(detaching) {
      if (detaching) detach(span);
    }
  };
}
function create_fragment$5(ctx) {
  let li;
  let label_1;
  let t0;
  let jsonkey;
  let t1;
  let span1;
  let span0;
  let t2;
  let t3;
  let t4;
  let current_block_type_index;
  let if_block1;
  let t5;
  let span2;
  let t6;
  let current;
  let mounted;
  let dispose;
  let if_block0 = (
    /*expandable*/
    ctx[11] && /*isParentExpanded*/
    ctx[2] && create_if_block_3(ctx)
  );
  jsonkey = new JSONKey({
    props: {
      key: (
        /*key*/
        ctx[12]
      ),
      colon: (
        /*context*/
        ctx[14].colon
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[2]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[3]
      )
    }
  });
  jsonkey.$on(
    "click",
    /*toggleExpand*/
    ctx[15]
  );
  const if_block_creators = [create_if_block$2, create_else_block];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*isParentExpanded*/
      ctx2[2]
    ) return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      li = element("li");
      label_1 = element("label");
      if (if_block0) if_block0.c();
      t0 = space();
      create_component(jsonkey.$$.fragment);
      t1 = space();
      span1 = element("span");
      span0 = element("span");
      t2 = text(
        /*label*/
        ctx[1]
      );
      t3 = text(
        /*bracketOpen*/
        ctx[5]
      );
      t4 = space();
      if_block1.c();
      t5 = space();
      span2 = element("span");
      t6 = text(
        /*bracketClose*/
        ctx[6]
      );
      attr(label_1, "class", "svelte-rwxv37");
      attr(li, "class", "svelte-rwxv37");
      toggle_class(
        li,
        "indent",
        /*isParentExpanded*/
        ctx[2]
      );
    },
    m(target, anchor) {
      insert(target, li, anchor);
      append(li, label_1);
      if (if_block0) if_block0.m(label_1, null);
      append(label_1, t0);
      mount_component(jsonkey, label_1, null);
      append(label_1, t1);
      append(label_1, span1);
      append(span1, span0);
      append(span0, t2);
      append(span1, t3);
      append(li, t4);
      if_blocks[current_block_type_index].m(li, null);
      append(li, t5);
      append(li, span2);
      append(span2, t6);
      current = true;
      if (!mounted) {
        dispose = listen(
          span1,
          "click",
          /*toggleExpand*/
          ctx[15]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (
        /*expandable*/
        ctx2[11] && /*isParentExpanded*/
        ctx2[2]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*expandable, isParentExpanded*/
          2052) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_3(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(label_1, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      const jsonkey_changes = {};
      if (dirty & /*key*/
      4096) jsonkey_changes.key = /*key*/
      ctx2[12];
      if (dirty & /*isParentExpanded*/
      4) jsonkey_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[2];
      if (dirty & /*isParentArray*/
      8) jsonkey_changes.isParentArray = /*isParentArray*/
      ctx2[3];
      jsonkey.$set(jsonkey_changes);
      if (!current || dirty & /*label*/
      2) set_data(
        t2,
        /*label*/
        ctx2[1]
      );
      if (!current || dirty & /*bracketOpen*/
      32) set_data(
        t3,
        /*bracketOpen*/
        ctx2[5]
      );
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block1 = if_blocks[current_block_type_index];
        if (!if_block1) {
          if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block1.c();
        } else {
          if_block1.p(ctx2, dirty);
        }
        transition_in(if_block1, 1);
        if_block1.m(li, t5);
      }
      if (!current || dirty & /*bracketClose*/
      64) set_data(
        t6,
        /*bracketClose*/
        ctx2[6]
      );
      if (dirty & /*isParentExpanded*/
      4) {
        toggle_class(
          li,
          "indent",
          /*isParentExpanded*/
          ctx2[2]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(jsonkey.$$.fragment, local);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(jsonkey.$$.fragment, local);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      if (if_block0) if_block0.d();
      destroy_component(jsonkey);
      if_blocks[current_block_type_index].d();
      mounted = false;
      dispose();
    }
  };
}
function instance$5($$self, $$props, $$invalidate) {
  let slicedKeys;
  let { key, keys: keys2, colon = ":", label = "", isParentExpanded, isParentArray, isArray = false, bracketOpen, bracketClose } = $$props;
  let { previewKeys = keys2 } = $$props;
  let { getKey: getKey2 = (key2) => key2 } = $$props;
  let { getValue: getValue2 = (key2) => key2 } = $$props;
  let { getPreviewValue = getValue2 } = $$props;
  let { expanded = false, expandable = true } = $$props;
  const context = getContext(contextKey);
  setContext(contextKey, { ...context, colon });
  function toggleExpand() {
    $$invalidate(0, expanded = !expanded);
  }
  function expand() {
    $$invalidate(0, expanded = true);
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(12, key = $$props2.key);
    if ("keys" in $$props2) $$invalidate(17, keys2 = $$props2.keys);
    if ("colon" in $$props2) $$invalidate(18, colon = $$props2.colon);
    if ("label" in $$props2) $$invalidate(1, label = $$props2.label);
    if ("isParentExpanded" in $$props2) $$invalidate(2, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(3, isParentArray = $$props2.isParentArray);
    if ("isArray" in $$props2) $$invalidate(4, isArray = $$props2.isArray);
    if ("bracketOpen" in $$props2) $$invalidate(5, bracketOpen = $$props2.bracketOpen);
    if ("bracketClose" in $$props2) $$invalidate(6, bracketClose = $$props2.bracketClose);
    if ("previewKeys" in $$props2) $$invalidate(7, previewKeys = $$props2.previewKeys);
    if ("getKey" in $$props2) $$invalidate(8, getKey2 = $$props2.getKey);
    if ("getValue" in $$props2) $$invalidate(9, getValue2 = $$props2.getValue);
    if ("getPreviewValue" in $$props2) $$invalidate(10, getPreviewValue = $$props2.getPreviewValue);
    if ("expanded" in $$props2) $$invalidate(0, expanded = $$props2.expanded);
    if ("expandable" in $$props2) $$invalidate(11, expandable = $$props2.expandable);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*isParentExpanded*/
    4) {
      if (!isParentExpanded) {
        $$invalidate(0, expanded = false);
      }
    }
    if ($$self.$$.dirty & /*expanded, keys, previewKeys*/
    131201) {
      $$invalidate(13, slicedKeys = expanded ? keys2 : previewKeys.slice(0, 5));
    }
  };
  return [
    expanded,
    label,
    isParentExpanded,
    isParentArray,
    isArray,
    bracketOpen,
    bracketClose,
    previewKeys,
    getKey2,
    getValue2,
    getPreviewValue,
    expandable,
    key,
    slicedKeys,
    context,
    toggleExpand,
    expand,
    keys2,
    colon
  ];
}
var JSONNested = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$5,
      create_fragment$5,
      safe_not_equal,
      {
        key: 12,
        keys: 17,
        colon: 18,
        label: 1,
        isParentExpanded: 2,
        isParentArray: 3,
        isArray: 4,
        bracketOpen: 5,
        bracketClose: 6,
        previewKeys: 7,
        getKey: 8,
        getValue: 9,
        getPreviewValue: 10,
        expanded: 0,
        expandable: 11
      },
      add_css$4
    );
  }
};
function create_fragment$6(ctx) {
  let jsonnested;
  let current;
  jsonnested = new JSONNested({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      expanded: (
        /*expanded*/
        ctx[4]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[1]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[2]
      ),
      keys: (
        /*keys*/
        ctx[5]
      ),
      previewKeys: (
        /*keys*/
        ctx[5]
      ),
      getValue: (
        /*getValue*/
        ctx[6]
      ),
      label: (
        /*nodeType*/
        ctx[3] + " "
      ),
      bracketOpen: "{",
      bracketClose: "}"
    }
  });
  return {
    c() {
      create_component(jsonnested.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonnested, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnested_changes = {};
      if (dirty & /*key*/
      1) jsonnested_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*expanded*/
      16) jsonnested_changes.expanded = /*expanded*/
      ctx2[4];
      if (dirty & /*isParentExpanded*/
      2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[1];
      if (dirty & /*isParentArray*/
      4) jsonnested_changes.isParentArray = /*isParentArray*/
      ctx2[2];
      if (dirty & /*keys*/
      32) jsonnested_changes.keys = /*keys*/
      ctx2[5];
      if (dirty & /*keys*/
      32) jsonnested_changes.previewKeys = /*keys*/
      ctx2[5];
      if (dirty & /*nodeType*/
      8) jsonnested_changes.label = /*nodeType*/
      ctx2[3] + " ";
      jsonnested.$set(jsonnested_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnested.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnested.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnested, detaching);
    }
  };
}
function instance$6($$self, $$props, $$invalidate) {
  let keys2;
  let { key, value: value2, isParentExpanded, isParentArray, nodeType } = $$props;
  let { expanded = true } = $$props;
  function getValue2(key2) {
    return value2[key2];
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(7, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(1, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(2, isParentArray = $$props2.isParentArray);
    if ("nodeType" in $$props2) $$invalidate(3, nodeType = $$props2.nodeType);
    if ("expanded" in $$props2) $$invalidate(4, expanded = $$props2.expanded);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    128) {
      $$invalidate(5, keys2 = Object.getOwnPropertyNames(value2));
    }
  };
  return [
    key,
    isParentExpanded,
    isParentArray,
    nodeType,
    expanded,
    keys2,
    getValue2,
    value2
  ];
}
var JSONObjectNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$6, create_fragment$6, safe_not_equal, {
      key: 0,
      value: 7,
      isParentExpanded: 1,
      isParentArray: 2,
      nodeType: 3,
      expanded: 4
    });
  }
};
function create_fragment$7(ctx) {
  let jsonnested;
  let current;
  jsonnested = new JSONNested({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      expanded: (
        /*expanded*/
        ctx[4]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[2]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[3]
      ),
      isArray: true,
      keys: (
        /*keys*/
        ctx[5]
      ),
      previewKeys: (
        /*previewKeys*/
        ctx[6]
      ),
      getValue: (
        /*getValue*/
        ctx[7]
      ),
      label: "Array(" + /*value*/
      ctx[1].length + ")",
      bracketOpen: "[",
      bracketClose: "]"
    }
  });
  return {
    c() {
      create_component(jsonnested.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonnested, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnested_changes = {};
      if (dirty & /*key*/
      1) jsonnested_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*expanded*/
      16) jsonnested_changes.expanded = /*expanded*/
      ctx2[4];
      if (dirty & /*isParentExpanded*/
      4) jsonnested_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[2];
      if (dirty & /*isParentArray*/
      8) jsonnested_changes.isParentArray = /*isParentArray*/
      ctx2[3];
      if (dirty & /*keys*/
      32) jsonnested_changes.keys = /*keys*/
      ctx2[5];
      if (dirty & /*previewKeys*/
      64) jsonnested_changes.previewKeys = /*previewKeys*/
      ctx2[6];
      if (dirty & /*value*/
      2) jsonnested_changes.label = "Array(" + /*value*/
      ctx2[1].length + ")";
      jsonnested.$set(jsonnested_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnested.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnested.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnested, detaching);
    }
  };
}
function instance$7($$self, $$props, $$invalidate) {
  let keys2;
  let previewKeys;
  let { key, value: value2, isParentExpanded, isParentArray } = $$props;
  let { expanded = JSON.stringify(value2).length < 1024 } = $$props;
  const filteredKey = /* @__PURE__ */ new Set(["length"]);
  function getValue2(key2) {
    return value2[key2];
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(2, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(3, isParentArray = $$props2.isParentArray);
    if ("expanded" in $$props2) $$invalidate(4, expanded = $$props2.expanded);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    2) {
      $$invalidate(5, keys2 = Object.getOwnPropertyNames(value2));
    }
    if ($$self.$$.dirty & /*keys*/
    32) {
      $$invalidate(6, previewKeys = keys2.filter((key2) => !filteredKey.has(key2)));
    }
  };
  return [
    key,
    value2,
    isParentExpanded,
    isParentArray,
    expanded,
    keys2,
    previewKeys,
    getValue2
  ];
}
var JSONArrayNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7, create_fragment$7, safe_not_equal, {
      key: 0,
      value: 1,
      isParentExpanded: 2,
      isParentArray: 3,
      expanded: 4
    });
  }
};
function create_fragment$8(ctx) {
  let jsonnested;
  let current;
  jsonnested = new JSONNested({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[1]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[2]
      ),
      keys: (
        /*keys*/
        ctx[4]
      ),
      getKey,
      getValue,
      isArray: true,
      label: (
        /*nodeType*/
        ctx[3] + "(" + /*keys*/
        ctx[4].length + ")"
      ),
      bracketOpen: "{",
      bracketClose: "}"
    }
  });
  return {
    c() {
      create_component(jsonnested.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonnested, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnested_changes = {};
      if (dirty & /*key*/
      1) jsonnested_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*isParentExpanded*/
      2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[1];
      if (dirty & /*isParentArray*/
      4) jsonnested_changes.isParentArray = /*isParentArray*/
      ctx2[2];
      if (dirty & /*keys*/
      16) jsonnested_changes.keys = /*keys*/
      ctx2[4];
      if (dirty & /*nodeType, keys*/
      24) jsonnested_changes.label = /*nodeType*/
      ctx2[3] + "(" + /*keys*/
      ctx2[4].length + ")";
      jsonnested.$set(jsonnested_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnested.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnested.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnested, detaching);
    }
  };
}
function getKey(key) {
  return String(key[0]);
}
function getValue(key) {
  return key[1];
}
function instance$8($$self, $$props, $$invalidate) {
  let { key, value: value2, isParentExpanded, isParentArray, nodeType } = $$props;
  let keys2 = [];
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(5, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(1, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(2, isParentArray = $$props2.isParentArray);
    if ("nodeType" in $$props2) $$invalidate(3, nodeType = $$props2.nodeType);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    32) {
      {
        let result = [];
        let i2 = 0;
        for (const entry of value2) {
          result.push([i2++, entry]);
        }
        $$invalidate(4, keys2 = result);
      }
    }
  };
  return [key, isParentExpanded, isParentArray, nodeType, keys2, value2];
}
var JSONIterableArrayNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$8, create_fragment$8, safe_not_equal, {
      key: 0,
      value: 5,
      isParentExpanded: 1,
      isParentArray: 2,
      nodeType: 3
    });
  }
};
var MapEntry = class {
  constructor(key, value2) {
    this.key = key;
    this.value = value2;
  }
};
function create_fragment$9(ctx) {
  let jsonnested;
  let current;
  jsonnested = new JSONNested({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[1]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[2]
      ),
      keys: (
        /*keys*/
        ctx[4]
      ),
      getKey: getKey$1,
      getValue: getValue$1,
      label: (
        /*nodeType*/
        ctx[3] + "(" + /*keys*/
        ctx[4].length + ")"
      ),
      colon: "",
      bracketOpen: "{",
      bracketClose: "}"
    }
  });
  return {
    c() {
      create_component(jsonnested.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonnested, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnested_changes = {};
      if (dirty & /*key*/
      1) jsonnested_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*isParentExpanded*/
      2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[1];
      if (dirty & /*isParentArray*/
      4) jsonnested_changes.isParentArray = /*isParentArray*/
      ctx2[2];
      if (dirty & /*keys*/
      16) jsonnested_changes.keys = /*keys*/
      ctx2[4];
      if (dirty & /*nodeType, keys*/
      24) jsonnested_changes.label = /*nodeType*/
      ctx2[3] + "(" + /*keys*/
      ctx2[4].length + ")";
      jsonnested.$set(jsonnested_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnested.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnested.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnested, detaching);
    }
  };
}
function getKey$1(entry) {
  return entry[0];
}
function getValue$1(entry) {
  return entry[1];
}
function instance$9($$self, $$props, $$invalidate) {
  let { key, value: value2, isParentExpanded, isParentArray, nodeType } = $$props;
  let keys2 = [];
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(5, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(1, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(2, isParentArray = $$props2.isParentArray);
    if ("nodeType" in $$props2) $$invalidate(3, nodeType = $$props2.nodeType);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    32) {
      {
        let result = [];
        let i2 = 0;
        for (const entry of value2) {
          result.push([i2++, new MapEntry(entry[0], entry[1])]);
        }
        $$invalidate(4, keys2 = result);
      }
    }
  };
  return [key, isParentExpanded, isParentArray, nodeType, keys2, value2];
}
var JSONIterableMapNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$9, create_fragment$9, safe_not_equal, {
      key: 0,
      value: 5,
      isParentExpanded: 1,
      isParentArray: 2,
      nodeType: 3
    });
  }
};
function create_fragment$a(ctx) {
  let jsonnested;
  let current;
  jsonnested = new JSONNested({
    props: {
      expanded: (
        /*expanded*/
        ctx[4]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[2]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[3]
      ),
      key: (
        /*isParentExpanded*/
        ctx[2] ? String(
          /*key*/
          ctx[0]
        ) : (
          /*value*/
          ctx[1].key
        )
      ),
      keys: (
        /*keys*/
        ctx[5]
      ),
      getValue: (
        /*getValue*/
        ctx[6]
      ),
      label: (
        /*isParentExpanded*/
        ctx[2] ? "Entry " : "=> "
      ),
      bracketOpen: "{",
      bracketClose: "}"
    }
  });
  return {
    c() {
      create_component(jsonnested.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonnested, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnested_changes = {};
      if (dirty & /*expanded*/
      16) jsonnested_changes.expanded = /*expanded*/
      ctx2[4];
      if (dirty & /*isParentExpanded*/
      4) jsonnested_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[2];
      if (dirty & /*isParentArray*/
      8) jsonnested_changes.isParentArray = /*isParentArray*/
      ctx2[3];
      if (dirty & /*isParentExpanded, key, value*/
      7) jsonnested_changes.key = /*isParentExpanded*/
      ctx2[2] ? String(
        /*key*/
        ctx2[0]
      ) : (
        /*value*/
        ctx2[1].key
      );
      if (dirty & /*isParentExpanded*/
      4) jsonnested_changes.label = /*isParentExpanded*/
      ctx2[2] ? "Entry " : "=> ";
      jsonnested.$set(jsonnested_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnested.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnested.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnested, detaching);
    }
  };
}
function instance$a($$self, $$props, $$invalidate) {
  let { key, value: value2, isParentExpanded, isParentArray } = $$props;
  let { expanded = false } = $$props;
  const keys2 = ["key", "value"];
  function getValue2(key2) {
    return value2[key2];
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(2, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(3, isParentArray = $$props2.isParentArray);
    if ("expanded" in $$props2) $$invalidate(4, expanded = $$props2.expanded);
  };
  return [key, value2, isParentExpanded, isParentArray, expanded, keys2, getValue2];
}
var JSONMapEntryNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a, create_fragment$a, safe_not_equal, {
      key: 0,
      value: 1,
      isParentExpanded: 2,
      isParentArray: 3,
      expanded: 4
    });
  }
};
function add_css$5(target) {
  append_styles(target, "svelte-3bjyvl", "li.svelte-3bjyvl{user-select:text;word-wrap:break-word;word-break:break-all}.indent.svelte-3bjyvl{padding-left:var(--li-identation)}.String.svelte-3bjyvl{color:var(--string-color)}.Date.svelte-3bjyvl{color:var(--date-color)}.Number.svelte-3bjyvl{color:var(--number-color)}.Boolean.svelte-3bjyvl{color:var(--boolean-color)}.Null.svelte-3bjyvl{color:var(--null-color)}.Undefined.svelte-3bjyvl{color:var(--undefined-color)}.Function.svelte-3bjyvl{color:var(--function-color);font-style:italic}.Symbol.svelte-3bjyvl{color:var(--symbol-color)}");
}
function create_fragment$b(ctx) {
  let li;
  let jsonkey;
  let t0;
  let span;
  let t1_value = (
    /*valueGetter*/
    (ctx[2] ? (
      /*valueGetter*/
      ctx[2](
        /*value*/
        ctx[1]
      )
    ) : (
      /*value*/
      ctx[1]
    )) + ""
  );
  let t1;
  let span_class_value;
  let current;
  jsonkey = new JSONKey({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      colon: (
        /*colon*/
        ctx[6]
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[3]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[4]
      )
    }
  });
  return {
    c() {
      li = element("li");
      create_component(jsonkey.$$.fragment);
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      attr(span, "class", span_class_value = null_to_empty(
        /*nodeType*/
        ctx[5]
      ) + " svelte-3bjyvl");
      attr(li, "class", "svelte-3bjyvl");
      toggle_class(
        li,
        "indent",
        /*isParentExpanded*/
        ctx[3]
      );
    },
    m(target, anchor) {
      insert(target, li, anchor);
      mount_component(jsonkey, li, null);
      append(li, t0);
      append(li, span);
      append(span, t1);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonkey_changes = {};
      if (dirty & /*key*/
      1) jsonkey_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*isParentExpanded*/
      8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[3];
      if (dirty & /*isParentArray*/
      16) jsonkey_changes.isParentArray = /*isParentArray*/
      ctx2[4];
      jsonkey.$set(jsonkey_changes);
      if ((!current || dirty & /*valueGetter, value*/
      6) && t1_value !== (t1_value = /*valueGetter*/
      (ctx2[2] ? (
        /*valueGetter*/
        ctx2[2](
          /*value*/
          ctx2[1]
        )
      ) : (
        /*value*/
        ctx2[1]
      )) + "")) set_data(t1, t1_value);
      if (!current || dirty & /*nodeType*/
      32 && span_class_value !== (span_class_value = null_to_empty(
        /*nodeType*/
        ctx2[5]
      ) + " svelte-3bjyvl")) {
        attr(span, "class", span_class_value);
      }
      if (dirty & /*isParentExpanded*/
      8) {
        toggle_class(
          li,
          "indent",
          /*isParentExpanded*/
          ctx2[3]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(jsonkey.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonkey.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      destroy_component(jsonkey);
    }
  };
}
function instance$b($$self, $$props, $$invalidate) {
  let { key, value: value2, valueGetter = null, isParentExpanded, isParentArray, nodeType } = $$props;
  const { colon } = getContext(contextKey);
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
    if ("valueGetter" in $$props2) $$invalidate(2, valueGetter = $$props2.valueGetter);
    if ("isParentExpanded" in $$props2) $$invalidate(3, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(4, isParentArray = $$props2.isParentArray);
    if ("nodeType" in $$props2) $$invalidate(5, nodeType = $$props2.nodeType);
  };
  return [key, value2, valueGetter, isParentExpanded, isParentArray, nodeType, colon];
}
var JSONValueNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$b,
      create_fragment$b,
      safe_not_equal,
      {
        key: 0,
        value: 1,
        valueGetter: 2,
        isParentExpanded: 3,
        isParentArray: 4,
        nodeType: 5
      },
      add_css$5
    );
  }
};
function add_css$6(target) {
  append_styles(target, "svelte-1ca3gb2", "li.svelte-1ca3gb2{user-select:text;word-wrap:break-word;word-break:break-all}.indent.svelte-1ca3gb2{padding-left:var(--li-identation)}.collapse.svelte-1ca3gb2{--li-display:inline;display:inline;font-style:italic}");
}
function get_each_context$2(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[8] = list[i2];
  child_ctx[10] = i2;
  return child_ctx;
}
function create_if_block_2$1(ctx) {
  let jsonarrow;
  let current;
  jsonarrow = new JSONArrow({ props: { expanded: (
    /*expanded*/
    ctx[0]
  ) } });
  jsonarrow.$on(
    "click",
    /*toggleExpand*/
    ctx[7]
  );
  return {
    c() {
      create_component(jsonarrow.$$.fragment);
    },
    m(target, anchor) {
      mount_component(jsonarrow, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const jsonarrow_changes = {};
      if (dirty & /*expanded*/
      1) jsonarrow_changes.expanded = /*expanded*/
      ctx2[0];
      jsonarrow.$set(jsonarrow_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonarrow.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonarrow.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonarrow, detaching);
    }
  };
}
function create_if_block$3(ctx) {
  let ul;
  let current;
  let if_block = (
    /*expanded*/
    ctx[0] && create_if_block_1$1(ctx)
  );
  return {
    c() {
      ul = element("ul");
      if (if_block) if_block.c();
      attr(ul, "class", "svelte-1ca3gb2");
      toggle_class(ul, "collapse", !/*expanded*/
      ctx[0]);
    },
    m(target, anchor) {
      insert(target, ul, anchor);
      if (if_block) if_block.m(ul, null);
      current = true;
    },
    p(ctx2, dirty) {
      if (
        /*expanded*/
        ctx2[0]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & /*expanded*/
          1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_1$1(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(ul, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      if (dirty & /*expanded*/
      1) {
        toggle_class(ul, "collapse", !/*expanded*/
        ctx2[0]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(ul);
      if (if_block) if_block.d();
    }
  };
}
function create_if_block_1$1(ctx) {
  let jsonnode;
  let t0;
  let li;
  let jsonkey;
  let t1;
  let span;
  let current;
  jsonnode = new JSONNode({
    props: {
      key: "message",
      value: (
        /*value*/
        ctx[2].message
      )
    }
  });
  jsonkey = new JSONKey({
    props: {
      key: "stack",
      colon: ":",
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[3]
      )
    }
  });
  let each_value = (
    /*stack*/
    ctx[5]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$2(get_each_context$2(ctx, each_value, i2));
  }
  return {
    c() {
      create_component(jsonnode.$$.fragment);
      t0 = space();
      li = element("li");
      create_component(jsonkey.$$.fragment);
      t1 = space();
      span = element("span");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(li, "class", "svelte-1ca3gb2");
    },
    m(target, anchor) {
      mount_component(jsonnode, target, anchor);
      insert(target, t0, anchor);
      insert(target, li, anchor);
      mount_component(jsonkey, li, null);
      append(li, t1);
      append(li, span);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(span, null);
      }
      current = true;
    },
    p(ctx2, dirty) {
      const jsonnode_changes = {};
      if (dirty & /*value*/
      4) jsonnode_changes.value = /*value*/
      ctx2[2].message;
      jsonnode.$set(jsonnode_changes);
      const jsonkey_changes = {};
      if (dirty & /*isParentExpanded*/
      8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[3];
      jsonkey.$set(jsonkey_changes);
      if (dirty & /*stack*/
      32) {
        each_value = /*stack*/
        ctx2[5];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$2(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block$2(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(span, null);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i(local) {
      if (current) return;
      transition_in(jsonnode.$$.fragment, local);
      transition_in(jsonkey.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnode.$$.fragment, local);
      transition_out(jsonkey.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(jsonnode, detaching);
      if (detaching) detach(t0);
      if (detaching) detach(li);
      destroy_component(jsonkey);
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block$2(ctx) {
  let span;
  let t_value = (
    /*line*/
    ctx[8] + ""
  );
  let t2;
  let br;
  return {
    c() {
      span = element("span");
      t2 = text(t_value);
      br = element("br");
      attr(span, "class", "svelte-1ca3gb2");
      toggle_class(
        span,
        "indent",
        /*index*/
        ctx[10] > 0
      );
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t2);
      insert(target, br, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*stack*/
      32 && t_value !== (t_value = /*line*/
      ctx2[8] + "")) set_data(t2, t_value);
    },
    d(detaching) {
      if (detaching) detach(span);
      if (detaching) detach(br);
    }
  };
}
function create_fragment$c(ctx) {
  let li;
  let t0;
  let jsonkey;
  let t1;
  let span;
  let t2;
  let t3_value = (
    /*expanded*/
    (ctx[0] ? "" : (
      /*value*/
      ctx[2].message
    )) + ""
  );
  let t3;
  let t4;
  let current;
  let mounted;
  let dispose;
  let if_block0 = (
    /*isParentExpanded*/
    ctx[3] && create_if_block_2$1(ctx)
  );
  jsonkey = new JSONKey({
    props: {
      key: (
        /*key*/
        ctx[1]
      ),
      colon: (
        /*context*/
        ctx[6].colon
      ),
      isParentExpanded: (
        /*isParentExpanded*/
        ctx[3]
      ),
      isParentArray: (
        /*isParentArray*/
        ctx[4]
      )
    }
  });
  let if_block1 = (
    /*isParentExpanded*/
    ctx[3] && create_if_block$3(ctx)
  );
  return {
    c() {
      li = element("li");
      if (if_block0) if_block0.c();
      t0 = space();
      create_component(jsonkey.$$.fragment);
      t1 = space();
      span = element("span");
      t2 = text("Error: ");
      t3 = text(t3_value);
      t4 = space();
      if (if_block1) if_block1.c();
      attr(li, "class", "svelte-1ca3gb2");
      toggle_class(
        li,
        "indent",
        /*isParentExpanded*/
        ctx[3]
      );
    },
    m(target, anchor) {
      insert(target, li, anchor);
      if (if_block0) if_block0.m(li, null);
      append(li, t0);
      mount_component(jsonkey, li, null);
      append(li, t1);
      append(li, span);
      append(span, t2);
      append(span, t3);
      append(li, t4);
      if (if_block1) if_block1.m(li, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          span,
          "click",
          /*toggleExpand*/
          ctx[7]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (
        /*isParentExpanded*/
        ctx2[3]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*isParentExpanded*/
          8) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2$1(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(li, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      const jsonkey_changes = {};
      if (dirty & /*key*/
      2) jsonkey_changes.key = /*key*/
      ctx2[1];
      if (dirty & /*isParentExpanded*/
      8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[3];
      if (dirty & /*isParentArray*/
      16) jsonkey_changes.isParentArray = /*isParentArray*/
      ctx2[4];
      jsonkey.$set(jsonkey_changes);
      if ((!current || dirty & /*expanded, value*/
      5) && t3_value !== (t3_value = /*expanded*/
      (ctx2[0] ? "" : (
        /*value*/
        ctx2[2].message
      )) + "")) set_data(t3, t3_value);
      if (
        /*isParentExpanded*/
        ctx2[3]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & /*isParentExpanded*/
          8) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block$3(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(li, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (dirty & /*isParentExpanded*/
      8) {
        toggle_class(
          li,
          "indent",
          /*isParentExpanded*/
          ctx2[3]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(jsonkey.$$.fragment, local);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(jsonkey.$$.fragment, local);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      if (if_block0) if_block0.d();
      destroy_component(jsonkey);
      if (if_block1) if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function instance$c($$self, $$props, $$invalidate) {
  let stack;
  let { key, value: value2, isParentExpanded, isParentArray } = $$props;
  let { expanded = false } = $$props;
  const context = getContext(contextKey);
  setContext(contextKey, { ...context, colon: ":" });
  function toggleExpand() {
    $$invalidate(0, expanded = !expanded);
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(1, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(2, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(3, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(4, isParentArray = $$props2.isParentArray);
    if ("expanded" in $$props2) $$invalidate(0, expanded = $$props2.expanded);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    4) {
      $$invalidate(5, stack = value2.stack.split("\n"));
    }
    if ($$self.$$.dirty & /*isParentExpanded*/
    8) {
      if (!isParentExpanded) {
        $$invalidate(0, expanded = false);
      }
    }
  };
  return [
    expanded,
    key,
    value2,
    isParentExpanded,
    isParentArray,
    stack,
    context,
    toggleExpand
  ];
}
var ErrorNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$c,
      create_fragment$c,
      safe_not_equal,
      {
        key: 1,
        value: 2,
        isParentExpanded: 3,
        isParentArray: 4,
        expanded: 0
      },
      add_css$6
    );
  }
};
function objType(obj) {
  const type = Object.prototype.toString.call(obj).slice(8, -1);
  if (type === "Object") {
    if (typeof obj[Symbol.iterator] === "function") {
      return "Iterable";
    }
    return obj.constructor.name;
  }
  return type;
}
function create_fragment$d(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  var switch_value = (
    /*componentType*/
    ctx[6]
  );
  function switch_props(ctx2) {
    return {
      props: {
        key: (
          /*key*/
          ctx2[0]
        ),
        value: (
          /*value*/
          ctx2[1]
        ),
        isParentExpanded: (
          /*isParentExpanded*/
          ctx2[2]
        ),
        isParentArray: (
          /*isParentArray*/
          ctx2[3]
        ),
        nodeType: (
          /*nodeType*/
          ctx2[4]
        ),
        valueGetter: (
          /*valueGetter*/
          ctx2[5]
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }
      insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const switch_instance_changes = {};
      if (dirty & /*key*/
      1) switch_instance_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*value*/
      2) switch_instance_changes.value = /*value*/
      ctx2[1];
      if (dirty & /*isParentExpanded*/
      4) switch_instance_changes.isParentExpanded = /*isParentExpanded*/
      ctx2[2];
      if (dirty & /*isParentArray*/
      8) switch_instance_changes.isParentArray = /*isParentArray*/
      ctx2[3];
      if (dirty & /*nodeType*/
      16) switch_instance_changes.nodeType = /*nodeType*/
      ctx2[4];
      if (dirty & /*valueGetter*/
      32) switch_instance_changes.valueGetter = /*valueGetter*/
      ctx2[5];
      if (switch_value !== (switch_value = /*componentType*/
      ctx2[6])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    }
  };
}
function instance$d($$self, $$props, $$invalidate) {
  let nodeType;
  let componentType;
  let valueGetter;
  let { key, value: value2, isParentExpanded, isParentArray } = $$props;
  function getComponent(nodeType2) {
    switch (nodeType2) {
      case "Object":
        return JSONObjectNode;
      case "Error":
        return ErrorNode;
      case "Array":
        return JSONArrayNode;
      case "Iterable":
      case "Map":
      case "Set":
        return typeof value2.set === "function" ? JSONIterableMapNode : JSONIterableArrayNode;
      case "MapEntry":
        return JSONMapEntryNode;
      default:
        return JSONValueNode;
    }
  }
  function getValueGetter(nodeType2) {
    switch (nodeType2) {
      case "Object":
      case "Error":
      case "Array":
      case "Iterable":
      case "Map":
      case "Set":
      case "MapEntry":
      case "Number":
        return void 0;
      case "String":
        return (raw2) => `"${raw2}"`;
      case "Boolean":
        return (raw2) => raw2 ? "true" : "false";
      case "Date":
        return (raw2) => raw2.toISOString();
      case "Null":
        return () => "null";
      case "Undefined":
        return () => "undefined";
      case "Function":
      case "Symbol":
        return (raw2) => raw2.toString();
      default:
        return () => `<${nodeType2}>`;
    }
  }
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
    if ("isParentExpanded" in $$props2) $$invalidate(2, isParentExpanded = $$props2.isParentExpanded);
    if ("isParentArray" in $$props2) $$invalidate(3, isParentArray = $$props2.isParentArray);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*value*/
    2) {
      $$invalidate(4, nodeType = objType(value2));
    }
    if ($$self.$$.dirty & /*nodeType*/
    16) {
      $$invalidate(6, componentType = getComponent(nodeType));
    }
    if ($$self.$$.dirty & /*nodeType*/
    16) {
      $$invalidate(5, valueGetter = getValueGetter(nodeType));
    }
  };
  return [
    key,
    value2,
    isParentExpanded,
    isParentArray,
    nodeType,
    valueGetter,
    componentType
  ];
}
var JSONNode = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$d, safe_not_equal, {
      key: 0,
      value: 1,
      isParentExpanded: 2,
      isParentArray: 3
    });
  }
};
function add_css$7(target) {
  append_styles(target, "svelte-773n60", "ul.svelte-773n60{--string-color:var(--json-tree-string-color, #cb3f41);--symbol-color:var(--json-tree-symbol-color, #cb3f41);--boolean-color:var(--json-tree-boolean-color, #112aa7);--function-color:var(--json-tree-function-color, #112aa7);--number-color:var(--json-tree-number-color, #3029cf);--label-color:var(--json-tree-label-color, #871d8f);--arrow-color:var(--json-tree-arrow-color, #727272);--null-color:var(--json-tree-null-color, #8d8d8d);--undefined-color:var(--json-tree-undefined-color, #8d8d8d);--date-color:var(--json-tree-date-color, #8d8d8d);--li-identation:var(--json-tree-li-indentation, 1em);--li-line-height:var(--json-tree-li-line-height, 1.3);--li-colon-space:0.3em;font-size:var(--json-tree-font-size, 12px);font-family:var(--json-tree-font-family, 'Courier New', Courier, monospace)}ul.svelte-773n60 li{line-height:var(--li-line-height);display:var(--li-display, list-item);list-style:none}ul.svelte-773n60,ul.svelte-773n60 ul{padding:0;margin:0}");
}
function create_fragment$e(ctx) {
  let ul;
  let jsonnode;
  let current;
  jsonnode = new JSONNode({
    props: {
      key: (
        /*key*/
        ctx[0]
      ),
      value: (
        /*value*/
        ctx[1]
      ),
      isParentExpanded: true,
      isParentArray: false
    }
  });
  return {
    c() {
      ul = element("ul");
      create_component(jsonnode.$$.fragment);
      attr(ul, "class", "svelte-773n60");
    },
    m(target, anchor) {
      insert(target, ul, anchor);
      mount_component(jsonnode, ul, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const jsonnode_changes = {};
      if (dirty & /*key*/
      1) jsonnode_changes.key = /*key*/
      ctx2[0];
      if (dirty & /*value*/
      2) jsonnode_changes.value = /*value*/
      ctx2[1];
      jsonnode.$set(jsonnode_changes);
    },
    i(local) {
      if (current) return;
      transition_in(jsonnode.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(jsonnode.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(ul);
      destroy_component(jsonnode);
    }
  };
}
function instance$e($$self, $$props, $$invalidate) {
  setContext(contextKey, {});
  let { key = "", value: value2 } = $$props;
  $$self.$$set = ($$props2) => {
    if ("key" in $$props2) $$invalidate(0, key = $$props2.key);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
  };
  return [key, value2];
}
var Root = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$e, create_fragment$e, safe_not_equal, { key: 0, value: 1 }, add_css$7);
  }
};
function add_css$8(target) {
  append_styles(target, "svelte-jvfq3i", ".svelte-jvfq3i{box-sizing:border-box}section.switcher.svelte-jvfq3i{position:sticky;bottom:0;transform:translateY(20px);margin:40px -20px 0;border-top:1px solid #999;padding:20px;background:#fff}label.svelte-jvfq3i{display:flex;align-items:baseline;gap:5px;font-weight:bold}select.svelte-jvfq3i{min-width:140px}");
}
function get_each_context$3(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[7] = list[i2];
  child_ctx[9] = i2;
  return child_ctx;
}
function create_if_block$4(ctx) {
  let section;
  let label;
  let t2;
  let select;
  let mounted;
  let dispose;
  let each_value = (
    /*debuggableClients*/
    ctx[1]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$3(get_each_context$3(ctx, each_value, i2));
  }
  return {
    c() {
      section = element("section");
      label = element("label");
      t2 = text("Client\n      \n      ");
      select = element("select");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(select, "id", selectId);
      attr(select, "class", "svelte-jvfq3i");
      if (
        /*selected*/
        ctx[2] === void 0
      ) add_render_callback(() => (
        /*select_change_handler*/
        ctx[6].call(select)
      ));
      attr(label, "class", "svelte-jvfq3i");
      attr(section, "class", "switcher svelte-jvfq3i");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      append(section, label);
      append(label, t2);
      append(label, select);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(select, null);
      }
      select_option(
        select,
        /*selected*/
        ctx[2]
      );
      if (!mounted) {
        dispose = [
          listen(
            select,
            "change",
            /*handleSelection*/
            ctx[3]
          ),
          listen(
            select,
            "change",
            /*select_change_handler*/
            ctx[6]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*debuggableClients, JSON*/
      2) {
        each_value = /*debuggableClients*/
        ctx2[1];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$3(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block$3(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(select, null);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (dirty & /*selected*/
      4) {
        select_option(
          select,
          /*selected*/
          ctx2[2]
        );
      }
    },
    d(detaching) {
      if (detaching) detach(section);
      destroy_each(each_blocks, detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block$3(ctx) {
  let option;
  let t0;
  let t1;
  let t2_value = JSON.stringify(
    /*clientOption*/
    ctx[7].playerID
  ) + "";
  let t2;
  let t3;
  let t4_value = JSON.stringify(
    /*clientOption*/
    ctx[7].matchID
  ) + "";
  let t4;
  let t5;
  let t6_value = (
    /*clientOption*/
    ctx[7].game.name + ""
  );
  let t6;
  let t7;
  let option_value_value;
  return {
    c() {
      option = element("option");
      t0 = text(
        /*index*/
        ctx[9]
      );
      t1 = text(" \u2014\n            playerID: ");
      t2 = text(t2_value);
      t3 = text(",\n            matchID: ");
      t4 = text(t4_value);
      t5 = text("\n            (");
      t6 = text(t6_value);
      t7 = text(")\n          ");
      option.__value = option_value_value = /*index*/
      ctx[9];
      option.value = option.__value;
      attr(option, "class", "svelte-jvfq3i");
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t0);
      append(option, t1);
      append(option, t2);
      append(option, t3);
      append(option, t4);
      append(option, t5);
      append(option, t6);
      append(option, t7);
    },
    p(ctx2, dirty) {
      if (dirty & /*debuggableClients*/
      2 && t2_value !== (t2_value = JSON.stringify(
        /*clientOption*/
        ctx2[7].playerID
      ) + "")) set_data(t2, t2_value);
      if (dirty & /*debuggableClients*/
      2 && t4_value !== (t4_value = JSON.stringify(
        /*clientOption*/
        ctx2[7].matchID
      ) + "")) set_data(t4, t4_value);
      if (dirty & /*debuggableClients*/
      2 && t6_value !== (t6_value = /*clientOption*/
      ctx2[7].game.name + "")) set_data(t6, t6_value);
    },
    d(detaching) {
      if (detaching) detach(option);
    }
  };
}
function create_fragment$f(ctx) {
  let if_block_anchor;
  let if_block = (
    /*debuggableClients*/
    ctx[1].length > 1 && create_if_block$4(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (
        /*debuggableClients*/
        ctx2[1].length > 1
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$4(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
var selectId = "bgio-debug-select-client";
function instance$f($$self, $$props, $$invalidate) {
  let client;
  let debuggableClients;
  let selected;
  let $clientManager, $$unsubscribe_clientManager = noop2, $$subscribe_clientManager = () => ($$unsubscribe_clientManager(), $$unsubscribe_clientManager = subscribe(clientManager, ($$value) => $$invalidate(5, $clientManager = $$value)), clientManager);
  $$self.$$.on_destroy.push(() => $$unsubscribe_clientManager());
  let { clientManager } = $$props;
  $$subscribe_clientManager();
  const handleSelection = (e) => {
    const selectedClient = debuggableClients[e.target.value];
    clientManager.switchToClient(selectedClient);
    const select = document.getElementById(selectId);
    if (select) select.focus();
  };
  function select_change_handler() {
    selected = select_value(this);
    $$invalidate(2, selected), $$invalidate(1, debuggableClients), $$invalidate(4, client), $$invalidate(5, $clientManager);
  }
  $$self.$$set = ($$props2) => {
    if ("clientManager" in $$props2) $$subscribe_clientManager($$invalidate(0, clientManager = $$props2.clientManager));
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*$clientManager*/
    32) {
      $$invalidate(4, { client, debuggableClients } = $clientManager, client, ($$invalidate(1, debuggableClients), $$invalidate(5, $clientManager)));
    }
    if ($$self.$$.dirty & /*debuggableClients, client*/
    18) {
      $$invalidate(2, selected = debuggableClients.indexOf(client));
    }
  };
  return [
    clientManager,
    debuggableClients,
    selected,
    handleSelection,
    client,
    $clientManager,
    select_change_handler
  ];
}
var ClientSwitcher = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$f, create_fragment$f, safe_not_equal, { clientManager: 0 }, add_css$8);
  }
};
function add_css$9(target) {
  append_styles(target, "svelte-1vfj1mn", ".key.svelte-1vfj1mn.svelte-1vfj1mn{display:flex;flex-direction:row;align-items:center}button.svelte-1vfj1mn.svelte-1vfj1mn{cursor:pointer;min-width:10px;padding-left:5px;padding-right:5px;height:20px;line-height:20px;text-align:center;border:1px solid #ccc;box-shadow:1px 1px 1px #888;background:#eee;color:#444}button.svelte-1vfj1mn.svelte-1vfj1mn:hover{background:#ddd}.key.active.svelte-1vfj1mn button.svelte-1vfj1mn{background:#ddd;border:1px solid #999;box-shadow:none}label.svelte-1vfj1mn.svelte-1vfj1mn{margin-left:10px}");
}
function create_if_block$5(ctx) {
  let label_1;
  let t0;
  let t1;
  let span;
  let t2_value = `(shortcut: ${/*value*/
  ctx[0]})`;
  let t2;
  return {
    c() {
      label_1 = element("label");
      t0 = text(
        /*label*/
        ctx[1]
      );
      t1 = space();
      span = element("span");
      t2 = text(t2_value);
      attr(span, "class", "screen-reader-only");
      attr(
        label_1,
        "for",
        /*id*/
        ctx[5]
      );
      attr(label_1, "class", "svelte-1vfj1mn");
    },
    m(target, anchor) {
      insert(target, label_1, anchor);
      append(label_1, t0);
      append(label_1, t1);
      append(label_1, span);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*label*/
      2) set_data(
        t0,
        /*label*/
        ctx2[1]
      );
      if (dirty & /*value*/
      1 && t2_value !== (t2_value = `(shortcut: ${/*value*/
      ctx2[0]})`)) set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) detach(label_1);
    }
  };
}
function create_fragment$g(ctx) {
  let div;
  let button;
  let t0;
  let t1;
  let mounted;
  let dispose;
  let if_block = (
    /*label*/
    ctx[1] && create_if_block$5(ctx)
  );
  return {
    c() {
      div = element("div");
      button = element("button");
      t0 = text(
        /*value*/
        ctx[0]
      );
      t1 = space();
      if (if_block) if_block.c();
      attr(
        button,
        "id",
        /*id*/
        ctx[5]
      );
      button.disabled = /*disable*/
      ctx[2];
      attr(button, "class", "svelte-1vfj1mn");
      attr(div, "class", "key svelte-1vfj1mn");
      toggle_class(
        div,
        "active",
        /*active*/
        ctx[3]
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      append(button, t0);
      append(div, t1);
      if (if_block) if_block.m(div, null);
      if (!mounted) {
        dispose = [
          listen(
            window,
            "keydown",
            /*Keypress*/
            ctx[7]
          ),
          listen(
            button,
            "click",
            /*Activate*/
            ctx[6]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*value*/
      1) set_data(
        t0,
        /*value*/
        ctx2[0]
      );
      if (dirty & /*disable*/
      4) {
        button.disabled = /*disable*/
        ctx2[2];
      }
      if (
        /*label*/
        ctx2[1]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$5(ctx2);
          if_block.c();
          if_block.m(div, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty & /*active*/
      8) {
        toggle_class(
          div,
          "active",
          /*active*/
          ctx2[3]
        );
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
      if (if_block) if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$g($$self, $$props, $$invalidate) {
  let $disableHotkeys;
  let { value: value2 } = $$props;
  let { onPress = null } = $$props;
  let { label = null } = $$props;
  let { disable = false } = $$props;
  const { disableHotkeys } = getContext("hotkeys");
  component_subscribe($$self, disableHotkeys, (value3) => $$invalidate(9, $disableHotkeys = value3));
  let active3 = false;
  let id = `key-${value2}`;
  function Deactivate() {
    $$invalidate(3, active3 = false);
  }
  function Activate() {
    $$invalidate(3, active3 = true);
    setTimeout(Deactivate, 200);
    if (onPress) {
      setTimeout(onPress, 1);
    }
  }
  function Keypress(e) {
    if (!$disableHotkeys && !disable && !e.ctrlKey && !e.metaKey && e.key == value2) {
      e.preventDefault();
      Activate();
    }
  }
  $$self.$$set = ($$props2) => {
    if ("value" in $$props2) $$invalidate(0, value2 = $$props2.value);
    if ("onPress" in $$props2) $$invalidate(8, onPress = $$props2.onPress);
    if ("label" in $$props2) $$invalidate(1, label = $$props2.label);
    if ("disable" in $$props2) $$invalidate(2, disable = $$props2.disable);
  };
  return [value2, label, disable, active3, disableHotkeys, id, Activate, Keypress, onPress];
}
var Hotkey = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$g,
      create_fragment$g,
      safe_not_equal,
      {
        value: 0,
        onPress: 8,
        label: 1,
        disable: 2
      },
      add_css$9
    );
  }
};
function add_css$a(target) {
  append_styles(target, "svelte-1mppqmp", ".move.svelte-1mppqmp{display:flex;flex-direction:row;cursor:pointer;margin-left:10px;color:#666}.move.svelte-1mppqmp:hover{color:#333}.move.active.svelte-1mppqmp{color:#111;font-weight:bold}.arg-field.svelte-1mppqmp{outline:none;font-family:monospace}");
}
function create_fragment$h(ctx) {
  let div;
  let span0;
  let t0;
  let t1;
  let span1;
  let t3;
  let span2;
  let t4;
  let span3;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      span0 = element("span");
      t0 = text(
        /*name*/
        ctx[2]
      );
      t1 = space();
      span1 = element("span");
      span1.textContent = "(";
      t3 = space();
      span2 = element("span");
      t4 = space();
      span3 = element("span");
      span3.textContent = ")";
      attr(span2, "class", "arg-field svelte-1mppqmp");
      attr(span2, "contenteditable", "");
      attr(div, "class", "move svelte-1mppqmp");
      toggle_class(
        div,
        "active",
        /*active*/
        ctx[3]
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span0);
      append(span0, t0);
      append(div, t1);
      append(div, span1);
      append(div, t3);
      append(div, span2);
      ctx[6](span2);
      append(div, t4);
      append(div, span3);
      if (!mounted) {
        dispose = [
          listen(span2, "focus", function() {
            if (is_function(
              /*Activate*/
              ctx[0]
            )) ctx[0].apply(this, arguments);
          }),
          listen(span2, "blur", function() {
            if (is_function(
              /*Deactivate*/
              ctx[1]
            )) ctx[1].apply(this, arguments);
          }),
          listen(span2, "keypress", stop_propagation(keypress_handler)),
          listen(
            span2,
            "keydown",
            /*OnKeyDown*/
            ctx[5]
          ),
          listen(div, "click", function() {
            if (is_function(
              /*Activate*/
              ctx[0]
            )) ctx[0].apply(this, arguments);
          })
        ];
        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      if (dirty & /*name*/
      4) set_data(
        t0,
        /*name*/
        ctx[2]
      );
      if (dirty & /*active*/
      8) {
        toggle_class(
          div,
          "active",
          /*active*/
          ctx[3]
        );
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
      ctx[6](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
var keypress_handler = () => {
};
function instance$h($$self, $$props, $$invalidate) {
  let { Activate } = $$props;
  let { Deactivate } = $$props;
  let { name } = $$props;
  let { active: active3 } = $$props;
  let span;
  const dispatch2 = createEventDispatcher();
  function Submit() {
    try {
      const value2 = span.innerText;
      let argArray = new Function(`return [${value2}]`)();
      dispatch2("submit", argArray);
    } catch (error2) {
      dispatch2("error", error2);
    }
    $$invalidate(4, span.innerText = "", span);
  }
  function OnKeyDown(e) {
    if (e.key == "Enter") {
      e.preventDefault();
      Submit();
    }
    if (e.key == "Escape") {
      e.preventDefault();
      Deactivate();
    }
  }
  afterUpdate(() => {
    if (active3) {
      span.focus();
    } else {
      span.blur();
    }
  });
  function span2_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      span = $$value;
      $$invalidate(4, span);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("Activate" in $$props2) $$invalidate(0, Activate = $$props2.Activate);
    if ("Deactivate" in $$props2) $$invalidate(1, Deactivate = $$props2.Deactivate);
    if ("name" in $$props2) $$invalidate(2, name = $$props2.name);
    if ("active" in $$props2) $$invalidate(3, active3 = $$props2.active);
  };
  return [Activate, Deactivate, name, active3, span, OnKeyDown, span2_binding];
}
var InteractiveFunction = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$h,
      create_fragment$h,
      safe_not_equal,
      {
        Activate: 0,
        Deactivate: 1,
        name: 2,
        active: 3
      },
      add_css$a
    );
  }
};
function add_css$b(target) {
  append_styles(target, "svelte-smqssc", ".move-error.svelte-smqssc{color:#a00;font-weight:bold}.wrapper.svelte-smqssc{display:flex;flex-direction:row;align-items:center}");
}
function create_if_block$6(ctx) {
  let span;
  let t2;
  return {
    c() {
      span = element("span");
      t2 = text(
        /*error*/
        ctx[2]
      );
      attr(span, "class", "move-error svelte-smqssc");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*error*/
      4) set_data(
        t2,
        /*error*/
        ctx2[2]
      );
    },
    d(detaching) {
      if (detaching) detach(span);
    }
  };
}
function create_fragment$i(ctx) {
  let div1;
  let div0;
  let hotkey;
  let t0;
  let interactivefunction;
  let t1;
  let current;
  hotkey = new Hotkey({
    props: {
      value: (
        /*shortcut*/
        ctx[0]
      ),
      onPress: (
        /*Activate*/
        ctx[4]
      )
    }
  });
  interactivefunction = new InteractiveFunction({
    props: {
      Activate: (
        /*Activate*/
        ctx[4]
      ),
      Deactivate: (
        /*Deactivate*/
        ctx[5]
      ),
      name: (
        /*name*/
        ctx[1]
      ),
      active: (
        /*active*/
        ctx[3]
      )
    }
  });
  interactivefunction.$on(
    "submit",
    /*Submit*/
    ctx[6]
  );
  interactivefunction.$on(
    "error",
    /*Error*/
    ctx[7]
  );
  let if_block = (
    /*error*/
    ctx[2] && create_if_block$6(ctx)
  );
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      create_component(hotkey.$$.fragment);
      t0 = space();
      create_component(interactivefunction.$$.fragment);
      t1 = space();
      if (if_block) if_block.c();
      attr(div0, "class", "wrapper svelte-smqssc");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      mount_component(hotkey, div0, null);
      append(div0, t0);
      mount_component(interactivefunction, div0, null);
      append(div1, t1);
      if (if_block) if_block.m(div1, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const hotkey_changes = {};
      if (dirty & /*shortcut*/
      1) hotkey_changes.value = /*shortcut*/
      ctx2[0];
      hotkey.$set(hotkey_changes);
      const interactivefunction_changes = {};
      if (dirty & /*name*/
      2) interactivefunction_changes.name = /*name*/
      ctx2[1];
      if (dirty & /*active*/
      8) interactivefunction_changes.active = /*active*/
      ctx2[3];
      interactivefunction.$set(interactivefunction_changes);
      if (
        /*error*/
        ctx2[2]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$6(ctx2);
          if_block.c();
          if_block.m(div1, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(hotkey.$$.fragment, local);
      transition_in(interactivefunction.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(hotkey.$$.fragment, local);
      transition_out(interactivefunction.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      destroy_component(hotkey);
      destroy_component(interactivefunction);
      if (if_block) if_block.d();
    }
  };
}
function instance$i($$self, $$props, $$invalidate) {
  let { shortcut } = $$props;
  let { name } = $$props;
  let { fn: fn2 } = $$props;
  const { disableHotkeys } = getContext("hotkeys");
  let error$1 = "";
  let active3 = false;
  function Activate() {
    disableHotkeys.set(true);
    $$invalidate(3, active3 = true);
  }
  function Deactivate() {
    disableHotkeys.set(false);
    $$invalidate(2, error$1 = "");
    $$invalidate(3, active3 = false);
  }
  function Submit(e) {
    $$invalidate(2, error$1 = "");
    Deactivate();
    fn2.apply(this, e.detail);
  }
  function Error2(e) {
    $$invalidate(2, error$1 = e.detail);
    error(e.detail);
  }
  $$self.$$set = ($$props2) => {
    if ("shortcut" in $$props2) $$invalidate(0, shortcut = $$props2.shortcut);
    if ("name" in $$props2) $$invalidate(1, name = $$props2.name);
    if ("fn" in $$props2) $$invalidate(8, fn2 = $$props2.fn);
  };
  return [shortcut, name, error$1, active3, Activate, Deactivate, Submit, Error2, fn2];
}
var Move = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$i, create_fragment$i, safe_not_equal, { shortcut: 0, name: 1, fn: 8 }, add_css$b);
  }
};
function add_css$c(target) {
  append_styles(target, "svelte-9hauj9", "ul.svelte-9hauj9{padding-left:0}li.svelte-9hauj9{list-style:none;margin:0;margin-bottom:5px}");
}
function create_fragment$j(ctx) {
  let ul;
  let li0;
  let hotkey0;
  let t0;
  let li1;
  let hotkey1;
  let t1;
  let li2;
  let hotkey2;
  let t2;
  let li3;
  let hotkey3;
  let current;
  hotkey0 = new Hotkey({
    props: {
      value: "1",
      onPress: (
        /*client*/
        ctx[0].reset
      ),
      label: "reset"
    }
  });
  hotkey1 = new Hotkey({
    props: {
      value: "2",
      onPress: (
        /*Save*/
        ctx[2]
      ),
      label: "save"
    }
  });
  hotkey2 = new Hotkey({
    props: {
      value: "3",
      onPress: (
        /*Restore*/
        ctx[3]
      ),
      label: "restore"
    }
  });
  hotkey3 = new Hotkey({
    props: {
      value: ".",
      onPress: (
        /*ToggleVisibility*/
        ctx[1]
      ),
      label: "hide"
    }
  });
  return {
    c() {
      ul = element("ul");
      li0 = element("li");
      create_component(hotkey0.$$.fragment);
      t0 = space();
      li1 = element("li");
      create_component(hotkey1.$$.fragment);
      t1 = space();
      li2 = element("li");
      create_component(hotkey2.$$.fragment);
      t2 = space();
      li3 = element("li");
      create_component(hotkey3.$$.fragment);
      attr(li0, "class", "svelte-9hauj9");
      attr(li1, "class", "svelte-9hauj9");
      attr(li2, "class", "svelte-9hauj9");
      attr(li3, "class", "svelte-9hauj9");
      attr(ul, "id", "debug-controls");
      attr(ul, "class", "controls svelte-9hauj9");
    },
    m(target, anchor) {
      insert(target, ul, anchor);
      append(ul, li0);
      mount_component(hotkey0, li0, null);
      append(ul, t0);
      append(ul, li1);
      mount_component(hotkey1, li1, null);
      append(ul, t1);
      append(ul, li2);
      mount_component(hotkey2, li2, null);
      append(ul, t2);
      append(ul, li3);
      mount_component(hotkey3, li3, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const hotkey0_changes = {};
      if (dirty & /*client*/
      1) hotkey0_changes.onPress = /*client*/
      ctx2[0].reset;
      hotkey0.$set(hotkey0_changes);
      const hotkey3_changes = {};
      if (dirty & /*ToggleVisibility*/
      2) hotkey3_changes.onPress = /*ToggleVisibility*/
      ctx2[1];
      hotkey3.$set(hotkey3_changes);
    },
    i(local) {
      if (current) return;
      transition_in(hotkey0.$$.fragment, local);
      transition_in(hotkey1.$$.fragment, local);
      transition_in(hotkey2.$$.fragment, local);
      transition_in(hotkey3.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(hotkey0.$$.fragment, local);
      transition_out(hotkey1.$$.fragment, local);
      transition_out(hotkey2.$$.fragment, local);
      transition_out(hotkey3.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(ul);
      destroy_component(hotkey0);
      destroy_component(hotkey1);
      destroy_component(hotkey2);
      destroy_component(hotkey3);
    }
  };
}
function instance$j($$self, $$props, $$invalidate) {
  let { client } = $$props;
  let { ToggleVisibility } = $$props;
  function Save() {
    const state = client.getState();
    const json = stringify({
      ...state,
      _undo: [],
      _redo: [],
      deltalog: []
    });
    window.localStorage.setItem("gamestate", json);
    window.localStorage.setItem("initialState", stringify(client.initialState));
  }
  function Restore() {
    const gamestateJSON = window.localStorage.getItem("gamestate");
    const initialStateJSON = window.localStorage.getItem("initialState");
    if (gamestateJSON !== null && initialStateJSON !== null) {
      const gamestate = parse(gamestateJSON);
      const initialState = parse(initialStateJSON);
      client.store.dispatch(sync({ state: gamestate, initialState }));
    }
  }
  $$self.$$set = ($$props2) => {
    if ("client" in $$props2) $$invalidate(0, client = $$props2.client);
    if ("ToggleVisibility" in $$props2) $$invalidate(1, ToggleVisibility = $$props2.ToggleVisibility);
  };
  return [client, ToggleVisibility, Save, Restore];
}
var Controls = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$j, create_fragment$j, safe_not_equal, { client: 0, ToggleVisibility: 1 }, add_css$c);
  }
};
function add_css$d(target) {
  append_styles(target, "svelte-19aan9p", ".player-box.svelte-19aan9p{display:flex;flex-direction:row}.player.svelte-19aan9p{cursor:pointer;text-align:center;width:30px;height:30px;line-height:30px;background:#eee;border:3px solid #fefefe;box-sizing:content-box;padding:0}.player.current.svelte-19aan9p{background:#555;color:#eee;font-weight:bold}.player.active.svelte-19aan9p{border:3px solid #ff7f50}");
}
function get_each_context$4(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[7] = list[i2];
  return child_ctx;
}
function create_each_block$4(ctx) {
  let button;
  let t0_value = (
    /*player*/
    ctx[7] + ""
  );
  let t0;
  let t1;
  let button_aria_label_value;
  let mounted;
  let dispose;
  function click_handler() {
    return (
      /*click_handler*/
      ctx[5](
        /*player*/
        ctx[7]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t0 = text(t0_value);
      t1 = space();
      attr(button, "class", "player svelte-19aan9p");
      attr(button, "aria-label", button_aria_label_value = /*playerLabel*/
      ctx[4](
        /*player*/
        ctx[7]
      ));
      toggle_class(
        button,
        "current",
        /*player*/
        ctx[7] == /*ctx*/
        ctx[0].currentPlayer
      );
      toggle_class(
        button,
        "active",
        /*player*/
        ctx[7] == /*playerID*/
        ctx[1]
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*players*/
      4 && t0_value !== (t0_value = /*player*/
      ctx[7] + "")) set_data(t0, t0_value);
      if (dirty & /*players*/
      4 && button_aria_label_value !== (button_aria_label_value = /*playerLabel*/
      ctx[4](
        /*player*/
        ctx[7]
      ))) {
        attr(button, "aria-label", button_aria_label_value);
      }
      if (dirty & /*players, ctx*/
      5) {
        toggle_class(
          button,
          "current",
          /*player*/
          ctx[7] == /*ctx*/
          ctx[0].currentPlayer
        );
      }
      if (dirty & /*players, playerID*/
      6) {
        toggle_class(
          button,
          "active",
          /*player*/
          ctx[7] == /*playerID*/
          ctx[1]
        );
      }
    },
    d(detaching) {
      if (detaching) detach(button);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$k(ctx) {
  let div;
  let each_value = (
    /*players*/
    ctx[2]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$4(get_each_context$4(ctx, each_value, i2));
  }
  return {
    c() {
      div = element("div");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(div, "class", "player-box svelte-19aan9p");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(div, null);
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*playerLabel, players, ctx, playerID, OnClick*/
      31) {
        each_value = /*players*/
        ctx2[2];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$4(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block$4(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(div, null);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
      destroy_each(each_blocks, detaching);
    }
  };
}
function instance$k($$self, $$props, $$invalidate) {
  let { ctx } = $$props;
  let { playerID } = $$props;
  const dispatch2 = createEventDispatcher();
  function OnClick(player) {
    if (player == playerID) {
      dispatch2("change", { playerID: null });
    } else {
      dispatch2("change", { playerID: player });
    }
  }
  function playerLabel(player) {
    const properties = [];
    if (player == ctx.currentPlayer) properties.push("current");
    if (player == playerID) properties.push("active");
    let label = `Player ${player}`;
    if (properties.length) label += ` (${properties.join(", ")})`;
    return label;
  }
  let players;
  const click_handler = (player) => OnClick(player);
  $$self.$$set = ($$props2) => {
    if ("ctx" in $$props2) $$invalidate(0, ctx = $$props2.ctx);
    if ("playerID" in $$props2) $$invalidate(1, playerID = $$props2.playerID);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*ctx*/
    1) {
      $$invalidate(2, players = ctx ? [...Array(ctx.numPlayers).keys()].map((i2) => i2.toString()) : []);
    }
  };
  return [ctx, playerID, players, OnClick, playerLabel, click_handler];
}
var PlayerInfo = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$k, create_fragment$k, safe_not_equal, { ctx: 0, playerID: 1 }, add_css$d);
  }
};
function _unsupportedIterableToArray(o2, minLen) {
  if (!o2) return;
  if (typeof o2 === "string") return _arrayLikeToArray(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor) n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray(o2, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++) arr2[i2] = arr[i2];
  return arr2;
}
function _createForOfIteratorHelper(o2, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (!it) {
    if (Array.isArray(o2) || (it = _unsupportedIterableToArray(o2)) || allowArrayLike && o2 && typeof o2.length === "number") {
      if (it) o2 = it;
      var i2 = 0;
      var F = function() {
      };
      return {
        s: F,
        n: function() {
          if (i2 >= o2.length) return {
            done: true
          };
          return {
            done: false,
            value: o2[i2++]
          };
        },
        e: function(e) {
          throw e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return {
    s: function() {
      it = it.call(o2);
    },
    n: function() {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function(e) {
      didErr = true;
      err = e;
    },
    f: function() {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}
function AssignShortcuts(moveNames, blacklist) {
  var shortcuts = {};
  var taken = {};
  var _iterator = _createForOfIteratorHelper(blacklist), _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
      var c2 = _step.value;
      taken[c2] = true;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var t2 = taken;
  var canUseFirstChar = true;
  for (var name in moveNames) {
    var shortcut = name[0];
    if (t2[shortcut]) {
      canUseFirstChar = false;
      break;
    }
    t2[shortcut] = true;
    shortcuts[name] = shortcut;
  }
  if (canUseFirstChar) {
    return shortcuts;
  }
  t2 = taken;
  var next = 97;
  shortcuts = {};
  for (var _name in moveNames) {
    var _shortcut = String.fromCharCode(next);
    while (t2[_shortcut]) {
      next++;
      _shortcut = String.fromCharCode(next);
    }
    t2[_shortcut] = true;
    shortcuts[_name] = _shortcut;
  }
  return shortcuts;
}
function add_css$e(target) {
  append_styles(target, "svelte-146sq5f", ".tree.svelte-146sq5f{--json-tree-font-family:monospace;--json-tree-font-size:14px;--json-tree-null-color:#757575}.label.svelte-146sq5f{margin-bottom:0;text-transform:none}h3.svelte-146sq5f{text-transform:uppercase}ul.svelte-146sq5f{padding-left:0}li.svelte-146sq5f{list-style:none;margin:0;margin-bottom:5px}");
}
function get_each_context$5(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i2][0];
  child_ctx[12] = list[i2][1];
  return child_ctx;
}
function create_each_block$5(ctx) {
  let li;
  let move;
  let t2;
  let current;
  move = new Move({
    props: {
      shortcut: (
        /*shortcuts*/
        ctx[8][
          /*name*/
          ctx[11]
        ]
      ),
      fn: (
        /*fn*/
        ctx[12]
      ),
      name: (
        /*name*/
        ctx[11]
      )
    }
  });
  return {
    c() {
      li = element("li");
      create_component(move.$$.fragment);
      t2 = space();
      attr(li, "class", "svelte-146sq5f");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      mount_component(move, li, null);
      append(li, t2);
      current = true;
    },
    p(ctx2, dirty) {
      const move_changes = {};
      if (dirty & /*moves*/
      16) move_changes.shortcut = /*shortcuts*/
      ctx2[8][
        /*name*/
        ctx2[11]
      ];
      if (dirty & /*moves*/
      16) move_changes.fn = /*fn*/
      ctx2[12];
      if (dirty & /*moves*/
      16) move_changes.name = /*name*/
      ctx2[11];
      move.$set(move_changes);
    },
    i(local) {
      if (current) return;
      transition_in(move.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(move.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      destroy_component(move);
    }
  };
}
function create_if_block_2$2(ctx) {
  let li;
  let move;
  let current;
  move = new Move({
    props: {
      name: "endStage",
      shortcut: 7,
      fn: (
        /*events*/
        ctx[5].endStage
      )
    }
  });
  return {
    c() {
      li = element("li");
      create_component(move.$$.fragment);
      attr(li, "class", "svelte-146sq5f");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      mount_component(move, li, null);
      current = true;
    },
    p(ctx2, dirty) {
      const move_changes = {};
      if (dirty & /*events*/
      32) move_changes.fn = /*events*/
      ctx2[5].endStage;
      move.$set(move_changes);
    },
    i(local) {
      if (current) return;
      transition_in(move.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(move.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      destroy_component(move);
    }
  };
}
function create_if_block_1$2(ctx) {
  let li;
  let move;
  let current;
  move = new Move({
    props: {
      name: "endTurn",
      shortcut: 8,
      fn: (
        /*events*/
        ctx[5].endTurn
      )
    }
  });
  return {
    c() {
      li = element("li");
      create_component(move.$$.fragment);
      attr(li, "class", "svelte-146sq5f");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      mount_component(move, li, null);
      current = true;
    },
    p(ctx2, dirty) {
      const move_changes = {};
      if (dirty & /*events*/
      32) move_changes.fn = /*events*/
      ctx2[5].endTurn;
      move.$set(move_changes);
    },
    i(local) {
      if (current) return;
      transition_in(move.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(move.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      destroy_component(move);
    }
  };
}
function create_if_block$7(ctx) {
  let li;
  let move;
  let current;
  move = new Move({
    props: {
      name: "endPhase",
      shortcut: 9,
      fn: (
        /*events*/
        ctx[5].endPhase
      )
    }
  });
  return {
    c() {
      li = element("li");
      create_component(move.$$.fragment);
      attr(li, "class", "svelte-146sq5f");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      mount_component(move, li, null);
      current = true;
    },
    p(ctx2, dirty) {
      const move_changes = {};
      if (dirty & /*events*/
      32) move_changes.fn = /*events*/
      ctx2[5].endPhase;
      move.$set(move_changes);
    },
    i(local) {
      if (current) return;
      transition_in(move.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(move.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(li);
      destroy_component(move);
    }
  };
}
function create_fragment$l(ctx) {
  let section0;
  let h30;
  let t1;
  let controls;
  let t2;
  let section1;
  let h31;
  let t4;
  let playerinfo;
  let t5;
  let section2;
  let h32;
  let t7;
  let ul0;
  let t8;
  let section3;
  let h33;
  let t10;
  let ul1;
  let t11;
  let t12;
  let t13;
  let section4;
  let h34;
  let t15;
  let jsontree0;
  let t16;
  let section5;
  let h35;
  let t18;
  let jsontree1;
  let t19;
  let clientswitcher;
  let current;
  controls = new Controls({
    props: {
      client: (
        /*client*/
        ctx[0]
      ),
      ToggleVisibility: (
        /*ToggleVisibility*/
        ctx[2]
      )
    }
  });
  playerinfo = new PlayerInfo({
    props: {
      ctx: (
        /*ctx*/
        ctx[6]
      ),
      playerID: (
        /*playerID*/
        ctx[3]
      )
    }
  });
  playerinfo.$on(
    "change",
    /*change_handler*/
    ctx[9]
  );
  let each_value = Object.entries(
    /*moves*/
    ctx[4]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$5(get_each_context$5(ctx, each_value, i2));
  }
  const out = (i2) => transition_out(each_blocks[i2], 1, 1, () => {
    each_blocks[i2] = null;
  });
  let if_block0 = (
    /*ctx*/
    ctx[6].activePlayers && /*events*/
    ctx[5].endStage && create_if_block_2$2(ctx)
  );
  let if_block1 = (
    /*events*/
    ctx[5].endTurn && create_if_block_1$2(ctx)
  );
  let if_block2 = (
    /*ctx*/
    ctx[6].phase && /*events*/
    ctx[5].endPhase && create_if_block$7(ctx)
  );
  jsontree0 = new Root({ props: { value: (
    /*G*/
    ctx[7]
  ) } });
  jsontree1 = new Root({
    props: { value: SanitizeCtx(
      /*ctx*/
      ctx[6]
    ) }
  });
  clientswitcher = new ClientSwitcher({
    props: { clientManager: (
      /*clientManager*/
      ctx[1]
    ) }
  });
  return {
    c() {
      section0 = element("section");
      h30 = element("h3");
      h30.textContent = "Controls";
      t1 = space();
      create_component(controls.$$.fragment);
      t2 = space();
      section1 = element("section");
      h31 = element("h3");
      h31.textContent = "Players";
      t4 = space();
      create_component(playerinfo.$$.fragment);
      t5 = space();
      section2 = element("section");
      h32 = element("h3");
      h32.textContent = "Moves";
      t7 = space();
      ul0 = element("ul");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      t8 = space();
      section3 = element("section");
      h33 = element("h3");
      h33.textContent = "Events";
      t10 = space();
      ul1 = element("ul");
      if (if_block0) if_block0.c();
      t11 = space();
      if (if_block1) if_block1.c();
      t12 = space();
      if (if_block2) if_block2.c();
      t13 = space();
      section4 = element("section");
      h34 = element("h3");
      h34.textContent = "G";
      t15 = space();
      create_component(jsontree0.$$.fragment);
      t16 = space();
      section5 = element("section");
      h35 = element("h3");
      h35.textContent = "ctx";
      t18 = space();
      create_component(jsontree1.$$.fragment);
      t19 = space();
      create_component(clientswitcher.$$.fragment);
      attr(h30, "class", "svelte-146sq5f");
      attr(h31, "class", "svelte-146sq5f");
      attr(h32, "class", "svelte-146sq5f");
      attr(ul0, "class", "svelte-146sq5f");
      attr(h33, "class", "svelte-146sq5f");
      attr(ul1, "class", "svelte-146sq5f");
      attr(h34, "class", "label svelte-146sq5f");
      attr(section4, "class", "tree svelte-146sq5f");
      attr(h35, "class", "label svelte-146sq5f");
      attr(section5, "class", "tree svelte-146sq5f");
    },
    m(target, anchor) {
      insert(target, section0, anchor);
      append(section0, h30);
      append(section0, t1);
      mount_component(controls, section0, null);
      insert(target, t2, anchor);
      insert(target, section1, anchor);
      append(section1, h31);
      append(section1, t4);
      mount_component(playerinfo, section1, null);
      insert(target, t5, anchor);
      insert(target, section2, anchor);
      append(section2, h32);
      append(section2, t7);
      append(section2, ul0);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(ul0, null);
      }
      insert(target, t8, anchor);
      insert(target, section3, anchor);
      append(section3, h33);
      append(section3, t10);
      append(section3, ul1);
      if (if_block0) if_block0.m(ul1, null);
      append(ul1, t11);
      if (if_block1) if_block1.m(ul1, null);
      append(ul1, t12);
      if (if_block2) if_block2.m(ul1, null);
      insert(target, t13, anchor);
      insert(target, section4, anchor);
      append(section4, h34);
      append(section4, t15);
      mount_component(jsontree0, section4, null);
      insert(target, t16, anchor);
      insert(target, section5, anchor);
      append(section5, h35);
      append(section5, t18);
      mount_component(jsontree1, section5, null);
      insert(target, t19, anchor);
      mount_component(clientswitcher, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const controls_changes = {};
      if (dirty & /*client*/
      1) controls_changes.client = /*client*/
      ctx2[0];
      if (dirty & /*ToggleVisibility*/
      4) controls_changes.ToggleVisibility = /*ToggleVisibility*/
      ctx2[2];
      controls.$set(controls_changes);
      const playerinfo_changes = {};
      if (dirty & /*ctx*/
      64) playerinfo_changes.ctx = /*ctx*/
      ctx2[6];
      if (dirty & /*playerID*/
      8) playerinfo_changes.playerID = /*playerID*/
      ctx2[3];
      playerinfo.$set(playerinfo_changes);
      if (dirty & /*shortcuts, Object, moves*/
      272) {
        each_value = Object.entries(
          /*moves*/
          ctx2[4]
        );
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$5(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
            transition_in(each_blocks[i2], 1);
          } else {
            each_blocks[i2] = create_each_block$5(child_ctx);
            each_blocks[i2].c();
            transition_in(each_blocks[i2], 1);
            each_blocks[i2].m(ul0, null);
          }
        }
        group_outros();
        for (i2 = each_value.length; i2 < each_blocks.length; i2 += 1) {
          out(i2);
        }
        check_outros();
      }
      if (
        /*ctx*/
        ctx2[6].activePlayers && /*events*/
        ctx2[5].endStage
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*ctx, events*/
          96) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2$2(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(ul1, t11);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (
        /*events*/
        ctx2[5].endTurn
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & /*events*/
          32) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$2(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(ul1, t12);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (
        /*ctx*/
        ctx2[6].phase && /*events*/
        ctx2[5].endPhase
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
          if (dirty & /*ctx, events*/
          96) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block$7(ctx2);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(ul1, null);
        }
      } else if (if_block2) {
        group_outros();
        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });
        check_outros();
      }
      const jsontree0_changes = {};
      if (dirty & /*G*/
      128) jsontree0_changes.value = /*G*/
      ctx2[7];
      jsontree0.$set(jsontree0_changes);
      const jsontree1_changes = {};
      if (dirty & /*ctx*/
      64) jsontree1_changes.value = SanitizeCtx(
        /*ctx*/
        ctx2[6]
      );
      jsontree1.$set(jsontree1_changes);
      const clientswitcher_changes = {};
      if (dirty & /*clientManager*/
      2) clientswitcher_changes.clientManager = /*clientManager*/
      ctx2[1];
      clientswitcher.$set(clientswitcher_changes);
    },
    i(local) {
      if (current) return;
      transition_in(controls.$$.fragment, local);
      transition_in(playerinfo.$$.fragment, local);
      for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        transition_in(each_blocks[i2]);
      }
      transition_in(if_block0);
      transition_in(if_block1);
      transition_in(if_block2);
      transition_in(jsontree0.$$.fragment, local);
      transition_in(jsontree1.$$.fragment, local);
      transition_in(clientswitcher.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(controls.$$.fragment, local);
      transition_out(playerinfo.$$.fragment, local);
      each_blocks = each_blocks.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        transition_out(each_blocks[i2]);
      }
      transition_out(if_block0);
      transition_out(if_block1);
      transition_out(if_block2);
      transition_out(jsontree0.$$.fragment, local);
      transition_out(jsontree1.$$.fragment, local);
      transition_out(clientswitcher.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section0);
      destroy_component(controls);
      if (detaching) detach(t2);
      if (detaching) detach(section1);
      destroy_component(playerinfo);
      if (detaching) detach(t5);
      if (detaching) detach(section2);
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t8);
      if (detaching) detach(section3);
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (detaching) detach(t13);
      if (detaching) detach(section4);
      destroy_component(jsontree0);
      if (detaching) detach(t16);
      if (detaching) detach(section5);
      destroy_component(jsontree1);
      if (detaching) detach(t19);
      destroy_component(clientswitcher, detaching);
    }
  };
}
function SanitizeCtx(ctx) {
  let r2 = {};
  for (const key in ctx) {
    if (!key.startsWith("_")) {
      r2[key] = ctx[key];
    }
  }
  return r2;
}
function instance$l($$self, $$props, $$invalidate) {
  let { client } = $$props;
  let { clientManager } = $$props;
  let { ToggleVisibility } = $$props;
  const shortcuts = AssignShortcuts(client.moves, "mlia");
  let { playerID, moves, events } = client;
  let ctx = {};
  let G2 = {};
  const unsubscribe = client.subscribe((state) => {
    if (state) $$invalidate(7, { G: G2, ctx } = state, G2, $$invalidate(6, ctx));
    $$invalidate(3, { playerID, moves, events } = client, playerID, $$invalidate(4, moves), $$invalidate(5, events));
  });
  onDestroy(unsubscribe);
  const change_handler = (e) => clientManager.switchPlayerID(e.detail.playerID);
  $$self.$$set = ($$props2) => {
    if ("client" in $$props2) $$invalidate(0, client = $$props2.client);
    if ("clientManager" in $$props2) $$invalidate(1, clientManager = $$props2.clientManager);
    if ("ToggleVisibility" in $$props2) $$invalidate(2, ToggleVisibility = $$props2.ToggleVisibility);
  };
  return [
    client,
    clientManager,
    ToggleVisibility,
    playerID,
    moves,
    events,
    ctx,
    G2,
    shortcuts,
    change_handler
  ];
}
var Main = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$l,
      create_fragment$l,
      safe_not_equal,
      {
        client: 0,
        clientManager: 1,
        ToggleVisibility: 2
      },
      add_css$e
    );
  }
};
function add_css$f(target) {
  append_styles(target, "svelte-13qih23", ".item.svelte-13qih23.svelte-13qih23{padding:10px}.item.svelte-13qih23.svelte-13qih23:not(:first-child){border-top:1px dashed #aaa}.item.svelte-13qih23 div.svelte-13qih23{float:right;text-align:right}");
}
function create_fragment$m(ctx) {
  let div1;
  let strong;
  let t0;
  let t1;
  let div0;
  let t2_value = JSON.stringify(
    /*value*/
    ctx[1]
  ) + "";
  let t2;
  return {
    c() {
      div1 = element("div");
      strong = element("strong");
      t0 = text(
        /*name*/
        ctx[0]
      );
      t1 = space();
      div0 = element("div");
      t2 = text(t2_value);
      attr(div0, "class", "svelte-13qih23");
      attr(div1, "class", "item svelte-13qih23");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, strong);
      append(strong, t0);
      append(div1, t1);
      append(div1, div0);
      append(div0, t2);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*name*/
      1) set_data(
        t0,
        /*name*/
        ctx2[0]
      );
      if (dirty & /*value*/
      2 && t2_value !== (t2_value = JSON.stringify(
        /*value*/
        ctx2[1]
      ) + "")) set_data(t2, t2_value);
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div1);
    }
  };
}
function instance$m($$self, $$props, $$invalidate) {
  let { name } = $$props;
  let { value: value2 } = $$props;
  $$self.$$set = ($$props2) => {
    if ("name" in $$props2) $$invalidate(0, name = $$props2.name);
    if ("value" in $$props2) $$invalidate(1, value2 = $$props2.value);
  };
  return [name, value2];
}
var Item = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$m, create_fragment$m, safe_not_equal, { name: 0, value: 1 }, add_css$f);
  }
};
function add_css$g(target) {
  append_styles(target, "svelte-1yzq5o8", ".gameinfo.svelte-1yzq5o8{padding:10px}");
}
function create_if_block$8(ctx) {
  let item;
  let current;
  item = new Item({
    props: {
      name: "isConnected",
      value: (
        /*$client*/
        ctx[1].isConnected
      )
    }
  });
  return {
    c() {
      create_component(item.$$.fragment);
    },
    m(target, anchor) {
      mount_component(item, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const item_changes = {};
      if (dirty & /*$client*/
      2) item_changes.value = /*$client*/
      ctx2[1].isConnected;
      item.$set(item_changes);
    },
    i(local) {
      if (current) return;
      transition_in(item.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(item.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(item, detaching);
    }
  };
}
function create_fragment$n(ctx) {
  let section;
  let item0;
  let t0;
  let item1;
  let t1;
  let item2;
  let t2;
  let current;
  item0 = new Item({
    props: {
      name: "matchID",
      value: (
        /*client*/
        ctx[0].matchID
      )
    }
  });
  item1 = new Item({
    props: {
      name: "playerID",
      value: (
        /*client*/
        ctx[0].playerID
      )
    }
  });
  item2 = new Item({
    props: {
      name: "isActive",
      value: (
        /*$client*/
        ctx[1].isActive
      )
    }
  });
  let if_block = (
    /*client*/
    ctx[0].multiplayer && create_if_block$8(ctx)
  );
  return {
    c() {
      section = element("section");
      create_component(item0.$$.fragment);
      t0 = space();
      create_component(item1.$$.fragment);
      t1 = space();
      create_component(item2.$$.fragment);
      t2 = space();
      if (if_block) if_block.c();
      attr(section, "class", "gameinfo svelte-1yzq5o8");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      mount_component(item0, section, null);
      append(section, t0);
      mount_component(item1, section, null);
      append(section, t1);
      mount_component(item2, section, null);
      append(section, t2);
      if (if_block) if_block.m(section, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const item0_changes = {};
      if (dirty & /*client*/
      1) item0_changes.value = /*client*/
      ctx2[0].matchID;
      item0.$set(item0_changes);
      const item1_changes = {};
      if (dirty & /*client*/
      1) item1_changes.value = /*client*/
      ctx2[0].playerID;
      item1.$set(item1_changes);
      const item2_changes = {};
      if (dirty & /*$client*/
      2) item2_changes.value = /*$client*/
      ctx2[1].isActive;
      item2.$set(item2_changes);
      if (
        /*client*/
        ctx2[0].multiplayer
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & /*client*/
          1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$8(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(section, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(item0.$$.fragment, local);
      transition_in(item1.$$.fragment, local);
      transition_in(item2.$$.fragment, local);
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(item0.$$.fragment, local);
      transition_out(item1.$$.fragment, local);
      transition_out(item2.$$.fragment, local);
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section);
      destroy_component(item0);
      destroy_component(item1);
      destroy_component(item2);
      if (if_block) if_block.d();
    }
  };
}
function instance$n($$self, $$props, $$invalidate) {
  let $client, $$unsubscribe_client = noop2, $$subscribe_client = () => ($$unsubscribe_client(), $$unsubscribe_client = subscribe(client, ($$value) => $$invalidate(1, $client = $$value)), client);
  $$self.$$.on_destroy.push(() => $$unsubscribe_client());
  let { client } = $$props;
  $$subscribe_client();
  let { clientManager } = $$props;
  let { ToggleVisibility } = $$props;
  $$self.$$set = ($$props2) => {
    if ("client" in $$props2) $$subscribe_client($$invalidate(0, client = $$props2.client));
    if ("clientManager" in $$props2) $$invalidate(2, clientManager = $$props2.clientManager);
    if ("ToggleVisibility" in $$props2) $$invalidate(3, ToggleVisibility = $$props2.ToggleVisibility);
  };
  return [client, $client, clientManager, ToggleVisibility];
}
var Info = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$n,
      create_fragment$n,
      safe_not_equal,
      {
        client: 0,
        clientManager: 2,
        ToggleVisibility: 3
      },
      add_css$g
    );
  }
};
function add_css$h(target) {
  append_styles(target, "svelte-6eza86", ".turn-marker.svelte-6eza86{display:flex;justify-content:center;align-items:center;grid-column:1;background:#555;color:#eee;text-align:center;font-weight:bold;border:1px solid #888}");
}
function create_fragment$o(ctx) {
  let div;
  let t2;
  return {
    c() {
      div = element("div");
      t2 = text(
        /*turn*/
        ctx[0]
      );
      attr(div, "class", "turn-marker svelte-6eza86");
      attr(
        div,
        "style",
        /*style*/
        ctx[1]
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t2);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*turn*/
      1) set_data(
        t2,
        /*turn*/
        ctx2[0]
      );
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
    }
  };
}
function instance$o($$self, $$props, $$invalidate) {
  let { turn } = $$props;
  let { numEvents } = $$props;
  const style = `grid-row: span ${numEvents}`;
  $$self.$$set = ($$props2) => {
    if ("turn" in $$props2) $$invalidate(0, turn = $$props2.turn);
    if ("numEvents" in $$props2) $$invalidate(2, numEvents = $$props2.numEvents);
  };
  return [turn, style, numEvents];
}
var TurnMarker = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$o, create_fragment$o, safe_not_equal, { turn: 0, numEvents: 2 }, add_css$h);
  }
};
function add_css$i(target) {
  append_styles(target, "svelte-1t4xap", ".phase-marker.svelte-1t4xap{grid-column:3;background:#555;border:1px solid #888;color:#eee;text-align:center;font-weight:bold;padding-top:10px;padding-bottom:10px;text-orientation:sideways;writing-mode:vertical-rl;line-height:30px;width:100%}");
}
function create_fragment$p(ctx) {
  let div;
  let t_value = (
    /*phase*/
    (ctx[0] || "") + ""
  );
  let t2;
  return {
    c() {
      div = element("div");
      t2 = text(t_value);
      attr(div, "class", "phase-marker svelte-1t4xap");
      attr(
        div,
        "style",
        /*style*/
        ctx[1]
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t2);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*phase*/
      1 && t_value !== (t_value = /*phase*/
      (ctx2[0] || "") + "")) set_data(t2, t_value);
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
    }
  };
}
function instance$p($$self, $$props, $$invalidate) {
  let { phase } = $$props;
  let { numEvents } = $$props;
  const style = `grid-row: span ${numEvents}`;
  $$self.$$set = ($$props2) => {
    if ("phase" in $$props2) $$invalidate(0, phase = $$props2.phase);
    if ("numEvents" in $$props2) $$invalidate(2, numEvents = $$props2.numEvents);
  };
  return [phase, style, numEvents];
}
var PhaseMarker = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$p, create_fragment$p, safe_not_equal, { phase: 0, numEvents: 2 }, add_css$i);
  }
};
function create_fragment$q(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = `${/*renderedMetadata*/
      ctx[0]}`;
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop2,
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
    }
  };
}
function instance$q($$self, $$props, $$invalidate) {
  let { metadata } = $$props;
  const renderedMetadata = metadata !== void 0 ? JSON.stringify(metadata, null, 4) : "";
  $$self.$$set = ($$props2) => {
    if ("metadata" in $$props2) $$invalidate(1, metadata = $$props2.metadata);
  };
  return [renderedMetadata, metadata];
}
var LogMetadata = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$q, create_fragment$q, safe_not_equal, { metadata: 1 });
  }
};
function add_css$j(target) {
  append_styles(target, "svelte-vajd9z", ".log-event.svelte-vajd9z{grid-column:2;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;justify-content:center;background:#fff;border:1px dotted #ccc;border-left:5px solid #ccc;padding:5px;text-align:center;color:#666;font-size:14px;min-height:25px;line-height:25px}.log-event.svelte-vajd9z:hover,.log-event.svelte-vajd9z:focus{border-style:solid;background:#eee}.log-event.pinned.svelte-vajd9z{border-style:solid;background:#eee;opacity:1}.args.svelte-vajd9z{text-align:left;white-space:pre-wrap}.player0.svelte-vajd9z{border-left-color:#ff851b}.player1.svelte-vajd9z{border-left-color:#7fdbff}.player2.svelte-vajd9z{border-left-color:#0074d9}.player3.svelte-vajd9z{border-left-color:#39cccc}.player4.svelte-vajd9z{border-left-color:#3d9970}.player5.svelte-vajd9z{border-left-color:#2ecc40}.player6.svelte-vajd9z{border-left-color:#01ff70}.player7.svelte-vajd9z{border-left-color:#ffdc00}.player8.svelte-vajd9z{border-left-color:#001f3f}.player9.svelte-vajd9z{border-left-color:#ff4136}.player10.svelte-vajd9z{border-left-color:#85144b}.player11.svelte-vajd9z{border-left-color:#f012be}.player12.svelte-vajd9z{border-left-color:#b10dc9}.player13.svelte-vajd9z{border-left-color:#111111}.player14.svelte-vajd9z{border-left-color:#aaaaaa}.player15.svelte-vajd9z{border-left-color:#dddddd}");
}
function create_else_block$1(ctx) {
  let logmetadata;
  let current;
  logmetadata = new LogMetadata({ props: { metadata: (
    /*metadata*/
    ctx[2]
  ) } });
  return {
    c() {
      create_component(logmetadata.$$.fragment);
    },
    m(target, anchor) {
      mount_component(logmetadata, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const logmetadata_changes = {};
      if (dirty & /*metadata*/
      4) logmetadata_changes.metadata = /*metadata*/
      ctx2[2];
      logmetadata.$set(logmetadata_changes);
    },
    i(local) {
      if (current) return;
      transition_in(logmetadata.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(logmetadata.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(logmetadata, detaching);
    }
  };
}
function create_if_block$9(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  var switch_value = (
    /*metadataComponent*/
    ctx[3]
  );
  function switch_props(ctx2) {
    return { props: { metadata: (
      /*metadata*/
      ctx2[2]
    ) } };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }
      insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = {};
      if (dirty & /*metadata*/
      4) switch_instance_changes.metadata = /*metadata*/
      ctx2[2];
      if (switch_value !== (switch_value = /*metadataComponent*/
      ctx2[3])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    }
  };
}
function create_fragment$r(ctx) {
  let button;
  let div;
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let current_block_type_index;
  let if_block;
  let button_class_value;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block$9, create_else_block$1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*metadataComponent*/
      ctx2[3]
    ) return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      button = element("button");
      div = element("div");
      t0 = text(
        /*actionType*/
        ctx[4]
      );
      t1 = text("(");
      t2 = text(
        /*renderedArgs*/
        ctx[6]
      );
      t3 = text(")");
      t4 = space();
      if_block.c();
      attr(div, "class", "args svelte-vajd9z");
      attr(button, "class", button_class_value = "log-event player" + /*playerID*/
      ctx[7] + " svelte-vajd9z");
      toggle_class(
        button,
        "pinned",
        /*pinned*/
        ctx[1]
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, div);
      append(div, t0);
      append(div, t1);
      append(div, t2);
      append(div, t3);
      append(button, t4);
      if_blocks[current_block_type_index].m(button, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button,
            "click",
            /*click_handler*/
            ctx[9]
          ),
          listen(
            button,
            "mouseenter",
            /*mouseenter_handler*/
            ctx[10]
          ),
          listen(
            button,
            "focus",
            /*focus_handler*/
            ctx[11]
          ),
          listen(
            button,
            "mouseleave",
            /*mouseleave_handler*/
            ctx[12]
          ),
          listen(
            button,
            "blur",
            /*blur_handler*/
            ctx[13]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & /*actionType*/
      16) set_data(
        t0,
        /*actionType*/
        ctx2[4]
      );
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(button, null);
      }
      if (dirty & /*pinned*/
      2) {
        toggle_class(
          button,
          "pinned",
          /*pinned*/
          ctx2[1]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      if_blocks[current_block_type_index].d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$r($$self, $$props, $$invalidate) {
  let { logIndex } = $$props;
  let { action } = $$props;
  let { pinned } = $$props;
  let { metadata } = $$props;
  let { metadataComponent } = $$props;
  const dispatch2 = createEventDispatcher();
  const args = action.payload.args;
  const renderedArgs = Array.isArray(args) ? args.map((arg) => JSON.stringify(arg, null, 2)).join(",") : JSON.stringify(args, null, 2) || "";
  const playerID = action.payload.playerID;
  let actionType;
  switch (action.type) {
    case "UNDO":
      actionType = "undo";
      break;
    case "REDO":
      actionType = "redo";
    case "GAME_EVENT":
    case "MAKE_MOVE":
    default:
      actionType = action.payload.type;
      break;
  }
  const click_handler = () => dispatch2("click", { logIndex });
  const mouseenter_handler = () => dispatch2("mouseenter", { logIndex });
  const focus_handler = () => dispatch2("mouseenter", { logIndex });
  const mouseleave_handler = () => dispatch2("mouseleave");
  const blur_handler = () => dispatch2("mouseleave");
  $$self.$$set = ($$props2) => {
    if ("logIndex" in $$props2) $$invalidate(0, logIndex = $$props2.logIndex);
    if ("action" in $$props2) $$invalidate(8, action = $$props2.action);
    if ("pinned" in $$props2) $$invalidate(1, pinned = $$props2.pinned);
    if ("metadata" in $$props2) $$invalidate(2, metadata = $$props2.metadata);
    if ("metadataComponent" in $$props2) $$invalidate(3, metadataComponent = $$props2.metadataComponent);
  };
  return [
    logIndex,
    pinned,
    metadata,
    metadataComponent,
    actionType,
    dispatch2,
    renderedArgs,
    playerID,
    action,
    click_handler,
    mouseenter_handler,
    focus_handler,
    mouseleave_handler,
    blur_handler
  ];
}
var LogEvent = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$r,
      create_fragment$r,
      safe_not_equal,
      {
        logIndex: 0,
        action: 8,
        pinned: 1,
        metadata: 2,
        metadataComponent: 3
      },
      add_css$j
    );
  }
};
function create_default_slot$1(ctx) {
  let path;
  return {
    c() {
      path = svg_element("path");
      attr(path, "d", "M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM212 140v116h-70.9c-10.7 0-16.1 13-8.5 20.5l114.9 114.3c4.7 4.7 12.2 4.7 16.9 0l114.9-114.3c7.6-7.6 2.2-20.5-8.5-20.5H300V140c0-6.6-5.4-12-12-12h-64c-6.6 0-12 5.4-12 12z");
    },
    m(target, anchor) {
      insert(target, path, anchor);
    },
    p: noop2,
    d(detaching) {
      if (detaching) detach(path);
    }
  };
}
function create_fragment$s(ctx) {
  let iconbase;
  let current;
  const iconbase_spread_levels = [
    { viewBox: "0 0 512 512" },
    /*$$props*/
    ctx[0]
  ];
  let iconbase_props = {
    $$slots: { default: [create_default_slot$1] },
    $$scope: { ctx }
  };
  for (let i2 = 0; i2 < iconbase_spread_levels.length; i2 += 1) {
    iconbase_props = assign(iconbase_props, iconbase_spread_levels[i2]);
  }
  iconbase = new IconBase({ props: iconbase_props });
  return {
    c() {
      create_component(iconbase.$$.fragment);
    },
    m(target, anchor) {
      mount_component(iconbase, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const iconbase_changes = dirty & /*$$props*/
      1 ? get_spread_update(iconbase_spread_levels, [iconbase_spread_levels[0], get_spread_object(
        /*$$props*/
        ctx2[0]
      )]) : {};
      if (dirty & /*$$scope*/
      2) {
        iconbase_changes.$$scope = { dirty, ctx: ctx2 };
      }
      iconbase.$set(iconbase_changes);
    },
    i(local) {
      if (current) return;
      transition_in(iconbase.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(iconbase.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(iconbase, detaching);
    }
  };
}
function instance$s($$self, $$props, $$invalidate) {
  $$self.$$set = ($$new_props) => {
    $$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
  };
  $$props = exclude_internal_props($$props);
  return [$$props];
}
var FaArrowAltCircleDown = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$s, create_fragment$s, safe_not_equal, {});
  }
};
function add_css$k(target) {
  append_styles(target, "svelte-1a7time", "div.svelte-1a7time{white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:500px}");
}
function create_fragment$t(ctx) {
  let div;
  let t2;
  return {
    c() {
      div = element("div");
      t2 = text(
        /*text*/
        ctx[0]
      );
      attr(
        div,
        "alt",
        /*text*/
        ctx[0]
      );
      attr(div, "class", "svelte-1a7time");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t2);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*text*/
      1) set_data(
        t2,
        /*text*/
        ctx2[0]
      );
      if (dirty & /*text*/
      1) {
        attr(
          div,
          "alt",
          /*text*/
          ctx2[0]
        );
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(div);
    }
  };
}
function instance$t($$self, $$props, $$invalidate) {
  let { action } = $$props;
  let text2;
  $$self.$$set = ($$props2) => {
    if ("action" in $$props2) $$invalidate(1, action = $$props2.action);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*action*/
    2) {
      {
        const { type, args } = action.payload;
        const argsFormatted = (args || []).join(",");
        $$invalidate(0, text2 = `${type}(${argsFormatted})`);
      }
    }
  };
  return [text2, action];
}
var Action = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$t, create_fragment$t, safe_not_equal, { action: 1 }, add_css$k);
  }
};
function add_css$l(target) {
  append_styles(target, "svelte-ztcwsu", "table.svelte-ztcwsu.svelte-ztcwsu{font-size:12px;border-collapse:collapse;border:1px solid #ddd;padding:0}tr.svelte-ztcwsu.svelte-ztcwsu{cursor:pointer}tr.svelte-ztcwsu:hover td.svelte-ztcwsu{background:#eee}tr.selected.svelte-ztcwsu td.svelte-ztcwsu{background:#eee}td.svelte-ztcwsu.svelte-ztcwsu{padding:10px;height:10px;line-height:10px;font-size:12px;border:none}th.svelte-ztcwsu.svelte-ztcwsu{background:#888;color:#fff;padding:10px;text-align:center}");
}
function get_each_context$6(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i2];
  child_ctx[12] = i2;
  return child_ctx;
}
function create_each_block$6(ctx) {
  let tr;
  let td0;
  let t0_value = (
    /*child*/
    ctx[10].value + ""
  );
  let t0;
  let t1;
  let td1;
  let t2_value = (
    /*child*/
    ctx[10].visits + ""
  );
  let t2;
  let t3;
  let td2;
  let action;
  let t4;
  let current;
  let mounted;
  let dispose;
  action = new Action({
    props: { action: (
      /*child*/
      ctx[10].parentAction
    ) }
  });
  function click_handler() {
    return (
      /*click_handler*/
      ctx[6](
        /*child*/
        ctx[10],
        /*i*/
        ctx[12]
      )
    );
  }
  function mouseout_handler() {
    return (
      /*mouseout_handler*/
      ctx[7](
        /*i*/
        ctx[12]
      )
    );
  }
  function mouseover_handler() {
    return (
      /*mouseover_handler*/
      ctx[8](
        /*child*/
        ctx[10],
        /*i*/
        ctx[12]
      )
    );
  }
  return {
    c() {
      tr = element("tr");
      td0 = element("td");
      t0 = text(t0_value);
      t1 = space();
      td1 = element("td");
      t2 = text(t2_value);
      t3 = space();
      td2 = element("td");
      create_component(action.$$.fragment);
      t4 = space();
      attr(td0, "class", "svelte-ztcwsu");
      attr(td1, "class", "svelte-ztcwsu");
      attr(td2, "class", "svelte-ztcwsu");
      attr(tr, "class", "svelte-ztcwsu");
      toggle_class(
        tr,
        "clickable",
        /*children*/
        ctx[1].length > 0
      );
      toggle_class(
        tr,
        "selected",
        /*i*/
        ctx[12] === /*selectedIndex*/
        ctx[0]
      );
    },
    m(target, anchor) {
      insert(target, tr, anchor);
      append(tr, td0);
      append(td0, t0);
      append(tr, t1);
      append(tr, td1);
      append(td1, t2);
      append(tr, t3);
      append(tr, td2);
      mount_component(action, td2, null);
      append(tr, t4);
      current = true;
      if (!mounted) {
        dispose = [
          listen(tr, "click", click_handler),
          listen(tr, "mouseout", mouseout_handler),
          listen(tr, "mouseover", mouseover_handler)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if ((!current || dirty & /*children*/
      2) && t0_value !== (t0_value = /*child*/
      ctx[10].value + "")) set_data(t0, t0_value);
      if ((!current || dirty & /*children*/
      2) && t2_value !== (t2_value = /*child*/
      ctx[10].visits + "")) set_data(t2, t2_value);
      const action_changes = {};
      if (dirty & /*children*/
      2) action_changes.action = /*child*/
      ctx[10].parentAction;
      action.$set(action_changes);
      if (dirty & /*children*/
      2) {
        toggle_class(
          tr,
          "clickable",
          /*children*/
          ctx[1].length > 0
        );
      }
      if (dirty & /*selectedIndex*/
      1) {
        toggle_class(
          tr,
          "selected",
          /*i*/
          ctx[12] === /*selectedIndex*/
          ctx[0]
        );
      }
    },
    i(local) {
      if (current) return;
      transition_in(action.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(action.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(tr);
      destroy_component(action);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$u(ctx) {
  let table;
  let thead;
  let t5;
  let tbody;
  let current;
  let each_value = (
    /*children*/
    ctx[1]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$6(get_each_context$6(ctx, each_value, i2));
  }
  const out = (i2) => transition_out(each_blocks[i2], 1, 1, () => {
    each_blocks[i2] = null;
  });
  return {
    c() {
      table = element("table");
      thead = element("thead");
      thead.innerHTML = `<th class="svelte-ztcwsu">Value</th> 
    <th class="svelte-ztcwsu">Visits</th> 
    <th class="svelte-ztcwsu">Action</th>`;
      t5 = space();
      tbody = element("tbody");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(table, "class", "svelte-ztcwsu");
    },
    m(target, anchor) {
      insert(target, table, anchor);
      append(table, thead);
      append(table, t5);
      append(table, tbody);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(tbody, null);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (dirty & /*children, selectedIndex, Select, Preview*/
      15) {
        each_value = /*children*/
        ctx2[1];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$6(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
            transition_in(each_blocks[i2], 1);
          } else {
            each_blocks[i2] = create_each_block$6(child_ctx);
            each_blocks[i2].c();
            transition_in(each_blocks[i2], 1);
            each_blocks[i2].m(tbody, null);
          }
        }
        group_outros();
        for (i2 = each_value.length; i2 < each_blocks.length; i2 += 1) {
          out(i2);
        }
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        transition_in(each_blocks[i2]);
      }
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        transition_out(each_blocks[i2]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching) detach(table);
      destroy_each(each_blocks, detaching);
    }
  };
}
function instance$u($$self, $$props, $$invalidate) {
  let { root } = $$props;
  let { selectedIndex = null } = $$props;
  const dispatch2 = createEventDispatcher();
  let parents = [];
  let children2 = [];
  function Select(node, i2) {
    dispatch2("select", { node, selectedIndex: i2 });
  }
  function Preview(node, i2) {
    if (selectedIndex === null) {
      dispatch2("preview", { node });
    }
  }
  const click_handler = (child, i2) => Select(child, i2);
  const mouseout_handler = (i2) => Preview(null);
  const mouseover_handler = (child, i2) => Preview(child);
  $$self.$$set = ($$props2) => {
    if ("root" in $$props2) $$invalidate(4, root = $$props2.root);
    if ("selectedIndex" in $$props2) $$invalidate(0, selectedIndex = $$props2.selectedIndex);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*root, parents*/
    48) {
      {
        let t2 = root;
        $$invalidate(5, parents = []);
        while (t2.parent) {
          const parent = t2.parent;
          const { type, args } = t2.parentAction.payload;
          const argsFormatted = (args || []).join(",");
          const arrowText = `${type}(${argsFormatted})`;
          parents.push({ parent, arrowText });
          t2 = parent;
        }
        parents.reverse();
        $$invalidate(1, children2 = [...root.children].sort((a2, b2) => a2.visits < b2.visits ? 1 : -1).slice(0, 50));
      }
    }
  };
  return [
    selectedIndex,
    children2,
    Select,
    Preview,
    root,
    parents,
    click_handler,
    mouseout_handler,
    mouseover_handler
  ];
}
var Table = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$u, create_fragment$u, safe_not_equal, { root: 4, selectedIndex: 0 }, add_css$l);
  }
};
function add_css$m(target) {
  append_styles(target, "svelte-1f0amz4", ".visualizer.svelte-1f0amz4{display:flex;flex-direction:column;align-items:center;padding:50px}.preview.svelte-1f0amz4{opacity:0.5}.icon.svelte-1f0amz4{color:#777;width:32px;height:32px;margin-bottom:20px}");
}
function get_each_context$7(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[9] = list[i2].node;
  child_ctx[10] = list[i2].selectedIndex;
  child_ctx[12] = i2;
  return child_ctx;
}
function create_if_block_2$3(ctx) {
  let div;
  let arrow;
  let current;
  arrow = new FaArrowAltCircleDown({});
  return {
    c() {
      div = element("div");
      create_component(arrow.$$.fragment);
      attr(div, "class", "icon svelte-1f0amz4");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(arrow, div, null);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(arrow.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(arrow.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(arrow);
    }
  };
}
function create_else_block$2(ctx) {
  let table;
  let current;
  function select_handler_1(...args) {
    return (
      /*select_handler_1*/
      ctx[7](
        /*i*/
        ctx[12],
        ...args
      )
    );
  }
  table = new Table({
    props: {
      root: (
        /*node*/
        ctx[9]
      ),
      selectedIndex: (
        /*selectedIndex*/
        ctx[10]
      )
    }
  });
  table.$on("select", select_handler_1);
  return {
    c() {
      create_component(table.$$.fragment);
    },
    m(target, anchor) {
      mount_component(table, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const table_changes = {};
      if (dirty & /*nodes*/
      1) table_changes.root = /*node*/
      ctx[9];
      if (dirty & /*nodes*/
      1) table_changes.selectedIndex = /*selectedIndex*/
      ctx[10];
      table.$set(table_changes);
    },
    i(local) {
      if (current) return;
      transition_in(table.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(table.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(table, detaching);
    }
  };
}
function create_if_block_1$3(ctx) {
  let table;
  let current;
  function select_handler(...args) {
    return (
      /*select_handler*/
      ctx[5](
        /*i*/
        ctx[12],
        ...args
      )
    );
  }
  function preview_handler(...args) {
    return (
      /*preview_handler*/
      ctx[6](
        /*i*/
        ctx[12],
        ...args
      )
    );
  }
  table = new Table({ props: { root: (
    /*node*/
    ctx[9]
  ) } });
  table.$on("select", select_handler);
  table.$on("preview", preview_handler);
  return {
    c() {
      create_component(table.$$.fragment);
    },
    m(target, anchor) {
      mount_component(table, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const table_changes = {};
      if (dirty & /*nodes*/
      1) table_changes.root = /*node*/
      ctx[9];
      table.$set(table_changes);
    },
    i(local) {
      if (current) return;
      transition_in(table.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(table.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(table, detaching);
    }
  };
}
function create_each_block$7(ctx) {
  let t2;
  let section;
  let current_block_type_index;
  let if_block1;
  let current;
  let if_block0 = (
    /*i*/
    ctx[12] !== 0 && create_if_block_2$3()
  );
  const if_block_creators = [create_if_block_1$3, create_else_block$2];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*i*/
      ctx2[12] === /*nodes*/
      ctx2[0].length - 1
    ) return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if (if_block0) if_block0.c();
      t2 = space();
      section = element("section");
      if_block1.c();
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t2, anchor);
      insert(target, section, anchor);
      if_blocks[current_block_type_index].m(section, null);
      current = true;
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block1 = if_blocks[current_block_type_index];
        if (!if_block1) {
          if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block1.c();
        } else {
          if_block1.p(ctx2, dirty);
        }
        transition_in(if_block1, 1);
        if_block1.m(section, null);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t2);
      if (detaching) detach(section);
      if_blocks[current_block_type_index].d();
    }
  };
}
function create_if_block$a(ctx) {
  let div;
  let arrow;
  let t2;
  let section;
  let table;
  let current;
  arrow = new FaArrowAltCircleDown({});
  table = new Table({ props: { root: (
    /*preview*/
    ctx[1]
  ) } });
  return {
    c() {
      div = element("div");
      create_component(arrow.$$.fragment);
      t2 = space();
      section = element("section");
      create_component(table.$$.fragment);
      attr(div, "class", "icon svelte-1f0amz4");
      attr(section, "class", "preview svelte-1f0amz4");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(arrow, div, null);
      insert(target, t2, anchor);
      insert(target, section, anchor);
      mount_component(table, section, null);
      current = true;
    },
    p(ctx2, dirty) {
      const table_changes = {};
      if (dirty & /*preview*/
      2) table_changes.root = /*preview*/
      ctx2[1];
      table.$set(table_changes);
    },
    i(local) {
      if (current) return;
      transition_in(arrow.$$.fragment, local);
      transition_in(table.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(arrow.$$.fragment, local);
      transition_out(table.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(arrow);
      if (detaching) detach(t2);
      if (detaching) detach(section);
      destroy_component(table);
    }
  };
}
function create_fragment$v(ctx) {
  let div;
  let t2;
  let current;
  let each_value = (
    /*nodes*/
    ctx[0]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$7(get_each_context$7(ctx, each_value, i2));
  }
  const out = (i2) => transition_out(each_blocks[i2], 1, 1, () => {
    each_blocks[i2] = null;
  });
  let if_block = (
    /*preview*/
    ctx[1] && create_if_block$a(ctx)
  );
  return {
    c() {
      div = element("div");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      t2 = space();
      if (if_block) if_block.c();
      attr(div, "class", "visualizer svelte-1f0amz4");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(div, null);
      }
      append(div, t2);
      if (if_block) if_block.m(div, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (dirty & /*nodes, SelectNode, PreviewNode*/
      13) {
        each_value = /*nodes*/
        ctx2[0];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$7(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
            transition_in(each_blocks[i2], 1);
          } else {
            each_blocks[i2] = create_each_block$7(child_ctx);
            each_blocks[i2].c();
            transition_in(each_blocks[i2], 1);
            each_blocks[i2].m(div, t2);
          }
        }
        group_outros();
        for (i2 = each_value.length; i2 < each_blocks.length; i2 += 1) {
          out(i2);
        }
        check_outros();
      }
      if (
        /*preview*/
        ctx2[1]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & /*preview*/
          2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$a(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        transition_in(each_blocks[i2]);
      }
      transition_in(if_block);
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        transition_out(each_blocks[i2]);
      }
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_each(each_blocks, detaching);
      if (if_block) if_block.d();
    }
  };
}
function instance$v($$self, $$props, $$invalidate) {
  let { metadata } = $$props;
  let nodes = [];
  let preview = null;
  function SelectNode({ node, selectedIndex }, i2) {
    $$invalidate(1, preview = null);
    $$invalidate(0, nodes[i2].selectedIndex = selectedIndex, nodes);
    $$invalidate(0, nodes = [...nodes.slice(0, i2 + 1), { node }]);
  }
  function PreviewNode({ node }, i2) {
    $$invalidate(1, preview = node);
  }
  const select_handler = (i2, e) => SelectNode(e.detail, i2);
  const preview_handler = (i2, e) => PreviewNode(e.detail);
  const select_handler_1 = (i2, e) => SelectNode(e.detail, i2);
  $$self.$$set = ($$props2) => {
    if ("metadata" in $$props2) $$invalidate(4, metadata = $$props2.metadata);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*metadata*/
    16) {
      {
        $$invalidate(0, nodes = [{ node: metadata }]);
      }
    }
  };
  return [
    nodes,
    preview,
    SelectNode,
    PreviewNode,
    metadata,
    select_handler,
    preview_handler,
    select_handler_1
  ];
}
var MCTS = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$v, create_fragment$v, safe_not_equal, { metadata: 4 }, add_css$m);
  }
};
function add_css$n(target) {
  append_styles(target, "svelte-1pq5e4b", ".gamelog.svelte-1pq5e4b{display:grid;grid-template-columns:30px 1fr 30px;grid-auto-rows:auto;grid-auto-flow:column}");
}
function get_each_context$8(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[16] = list[i2].phase;
  child_ctx[18] = i2;
  return child_ctx;
}
function get_each_context_1(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[19] = list[i2].action;
  child_ctx[20] = list[i2].metadata;
  child_ctx[18] = i2;
  return child_ctx;
}
function get_each_context_2(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[22] = list[i2].turn;
  child_ctx[18] = i2;
  return child_ctx;
}
function create_if_block_1$4(ctx) {
  let turnmarker;
  let current;
  turnmarker = new TurnMarker({
    props: {
      turn: (
        /*turn*/
        ctx[22]
      ),
      numEvents: (
        /*turnBoundaries*/
        ctx[3][
          /*i*/
          ctx[18]
        ]
      )
    }
  });
  return {
    c() {
      create_component(turnmarker.$$.fragment);
    },
    m(target, anchor) {
      mount_component(turnmarker, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const turnmarker_changes = {};
      if (dirty & /*renderedLogEntries*/
      2) turnmarker_changes.turn = /*turn*/
      ctx2[22];
      if (dirty & /*turnBoundaries*/
      8) turnmarker_changes.numEvents = /*turnBoundaries*/
      ctx2[3][
        /*i*/
        ctx2[18]
      ];
      turnmarker.$set(turnmarker_changes);
    },
    i(local) {
      if (current) return;
      transition_in(turnmarker.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(turnmarker.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(turnmarker, detaching);
    }
  };
}
function create_each_block_2(ctx) {
  let if_block_anchor;
  let current;
  let if_block = (
    /*i*/
    ctx[18] in /*turnBoundaries*/
    ctx[3] && create_if_block_1$4(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (
        /*i*/
        ctx2[18] in /*turnBoundaries*/
        ctx2[3]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & /*turnBoundaries*/
          8) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block_1$4(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
function create_each_block_1(ctx) {
  let logevent;
  let current;
  logevent = new LogEvent({
    props: {
      pinned: (
        /*i*/
        ctx[18] === /*pinned*/
        ctx[2]
      ),
      logIndex: (
        /*i*/
        ctx[18]
      ),
      action: (
        /*action*/
        ctx[19]
      ),
      metadata: (
        /*metadata*/
        ctx[20]
      )
    }
  });
  logevent.$on(
    "click",
    /*OnLogClick*/
    ctx[5]
  );
  logevent.$on(
    "mouseenter",
    /*OnMouseEnter*/
    ctx[6]
  );
  logevent.$on(
    "mouseleave",
    /*OnMouseLeave*/
    ctx[7]
  );
  return {
    c() {
      create_component(logevent.$$.fragment);
    },
    m(target, anchor) {
      mount_component(logevent, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const logevent_changes = {};
      if (dirty & /*pinned*/
      4) logevent_changes.pinned = /*i*/
      ctx2[18] === /*pinned*/
      ctx2[2];
      if (dirty & /*renderedLogEntries*/
      2) logevent_changes.action = /*action*/
      ctx2[19];
      if (dirty & /*renderedLogEntries*/
      2) logevent_changes.metadata = /*metadata*/
      ctx2[20];
      logevent.$set(logevent_changes);
    },
    i(local) {
      if (current) return;
      transition_in(logevent.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(logevent.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(logevent, detaching);
    }
  };
}
function create_if_block$b(ctx) {
  let phasemarker;
  let current;
  phasemarker = new PhaseMarker({
    props: {
      phase: (
        /*phase*/
        ctx[16]
      ),
      numEvents: (
        /*phaseBoundaries*/
        ctx[4][
          /*i*/
          ctx[18]
        ]
      )
    }
  });
  return {
    c() {
      create_component(phasemarker.$$.fragment);
    },
    m(target, anchor) {
      mount_component(phasemarker, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const phasemarker_changes = {};
      if (dirty & /*renderedLogEntries*/
      2) phasemarker_changes.phase = /*phase*/
      ctx2[16];
      if (dirty & /*phaseBoundaries*/
      16) phasemarker_changes.numEvents = /*phaseBoundaries*/
      ctx2[4][
        /*i*/
        ctx2[18]
      ];
      phasemarker.$set(phasemarker_changes);
    },
    i(local) {
      if (current) return;
      transition_in(phasemarker.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(phasemarker.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(phasemarker, detaching);
    }
  };
}
function create_each_block$8(ctx) {
  let if_block_anchor;
  let current;
  let if_block = (
    /*i*/
    ctx[18] in /*phaseBoundaries*/
    ctx[4] && create_if_block$b(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (
        /*i*/
        ctx2[18] in /*phaseBoundaries*/
        ctx2[4]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & /*phaseBoundaries*/
          16) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$b(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
function create_fragment$w(ctx) {
  let div;
  let t0;
  let t1;
  let current;
  let mounted;
  let dispose;
  let each_value_2 = (
    /*renderedLogEntries*/
    ctx[1]
  );
  let each_blocks_2 = [];
  for (let i2 = 0; i2 < each_value_2.length; i2 += 1) {
    each_blocks_2[i2] = create_each_block_2(get_each_context_2(ctx, each_value_2, i2));
  }
  const out = (i2) => transition_out(each_blocks_2[i2], 1, 1, () => {
    each_blocks_2[i2] = null;
  });
  let each_value_1 = (
    /*renderedLogEntries*/
    ctx[1]
  );
  let each_blocks_1 = [];
  for (let i2 = 0; i2 < each_value_1.length; i2 += 1) {
    each_blocks_1[i2] = create_each_block_1(get_each_context_1(ctx, each_value_1, i2));
  }
  const out_1 = (i2) => transition_out(each_blocks_1[i2], 1, 1, () => {
    each_blocks_1[i2] = null;
  });
  let each_value = (
    /*renderedLogEntries*/
    ctx[1]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$8(get_each_context$8(ctx, each_value, i2));
  }
  const out_2 = (i2) => transition_out(each_blocks[i2], 1, 1, () => {
    each_blocks[i2] = null;
  });
  return {
    c() {
      div = element("div");
      for (let i2 = 0; i2 < each_blocks_2.length; i2 += 1) {
        each_blocks_2[i2].c();
      }
      t0 = space();
      for (let i2 = 0; i2 < each_blocks_1.length; i2 += 1) {
        each_blocks_1[i2].c();
      }
      t1 = space();
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      attr(div, "class", "gamelog svelte-1pq5e4b");
      toggle_class(
        div,
        "pinned",
        /*pinned*/
        ctx[2]
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i2 = 0; i2 < each_blocks_2.length; i2 += 1) {
        each_blocks_2[i2].m(div, null);
      }
      append(div, t0);
      for (let i2 = 0; i2 < each_blocks_1.length; i2 += 1) {
        each_blocks_1[i2].m(div, null);
      }
      append(div, t1);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(div, null);
      }
      current = true;
      if (!mounted) {
        dispose = listen(
          window,
          "keydown",
          /*OnKeyDown*/
          ctx[8]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*renderedLogEntries, turnBoundaries*/
      10) {
        each_value_2 = /*renderedLogEntries*/
        ctx2[1];
        let i2;
        for (i2 = 0; i2 < each_value_2.length; i2 += 1) {
          const child_ctx = get_each_context_2(ctx2, each_value_2, i2);
          if (each_blocks_2[i2]) {
            each_blocks_2[i2].p(child_ctx, dirty);
            transition_in(each_blocks_2[i2], 1);
          } else {
            each_blocks_2[i2] = create_each_block_2(child_ctx);
            each_blocks_2[i2].c();
            transition_in(each_blocks_2[i2], 1);
            each_blocks_2[i2].m(div, t0);
          }
        }
        group_outros();
        for (i2 = each_value_2.length; i2 < each_blocks_2.length; i2 += 1) {
          out(i2);
        }
        check_outros();
      }
      if (dirty & /*pinned, renderedLogEntries, OnLogClick, OnMouseEnter, OnMouseLeave*/
      230) {
        each_value_1 = /*renderedLogEntries*/
        ctx2[1];
        let i2;
        for (i2 = 0; i2 < each_value_1.length; i2 += 1) {
          const child_ctx = get_each_context_1(ctx2, each_value_1, i2);
          if (each_blocks_1[i2]) {
            each_blocks_1[i2].p(child_ctx, dirty);
            transition_in(each_blocks_1[i2], 1);
          } else {
            each_blocks_1[i2] = create_each_block_1(child_ctx);
            each_blocks_1[i2].c();
            transition_in(each_blocks_1[i2], 1);
            each_blocks_1[i2].m(div, t1);
          }
        }
        group_outros();
        for (i2 = each_value_1.length; i2 < each_blocks_1.length; i2 += 1) {
          out_1(i2);
        }
        check_outros();
      }
      if (dirty & /*renderedLogEntries, phaseBoundaries*/
      18) {
        each_value = /*renderedLogEntries*/
        ctx2[1];
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$8(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
            transition_in(each_blocks[i2], 1);
          } else {
            each_blocks[i2] = create_each_block$8(child_ctx);
            each_blocks[i2].c();
            transition_in(each_blocks[i2], 1);
            each_blocks[i2].m(div, null);
          }
        }
        group_outros();
        for (i2 = each_value.length; i2 < each_blocks.length; i2 += 1) {
          out_2(i2);
        }
        check_outros();
      }
      if (dirty & /*pinned*/
      4) {
        toggle_class(
          div,
          "pinned",
          /*pinned*/
          ctx2[2]
        );
      }
    },
    i(local) {
      if (current) return;
      for (let i2 = 0; i2 < each_value_2.length; i2 += 1) {
        transition_in(each_blocks_2[i2]);
      }
      for (let i2 = 0; i2 < each_value_1.length; i2 += 1) {
        transition_in(each_blocks_1[i2]);
      }
      for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        transition_in(each_blocks[i2]);
      }
      current = true;
    },
    o(local) {
      each_blocks_2 = each_blocks_2.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks_2.length; i2 += 1) {
        transition_out(each_blocks_2[i2]);
      }
      each_blocks_1 = each_blocks_1.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks_1.length; i2 += 1) {
        transition_out(each_blocks_1[i2]);
      }
      each_blocks = each_blocks.filter(Boolean);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        transition_out(each_blocks[i2]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_each(each_blocks_2, detaching);
      destroy_each(each_blocks_1, detaching);
      destroy_each(each_blocks, detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$w($$self, $$props, $$invalidate) {
  let $client, $$unsubscribe_client = noop2, $$subscribe_client = () => ($$unsubscribe_client(), $$unsubscribe_client = subscribe(client, ($$value) => $$invalidate(10, $client = $$value)), client);
  $$self.$$.on_destroy.push(() => $$unsubscribe_client());
  let { client } = $$props;
  $$subscribe_client();
  const { secondaryPane } = getContext("secondaryPane");
  const reducer = CreateGameReducer({ game: client.game });
  const initialState = client.getInitialState();
  let { log } = $client;
  let pinned = null;
  function rewind(logIndex) {
    let state = initialState;
    for (let i2 = 0; i2 < log.length; i2++) {
      const { action, automatic } = log[i2];
      if (!automatic) {
        state = reducer(state, action);
        if (logIndex == 0) {
          break;
        }
        logIndex--;
      }
    }
    return {
      G: state.G,
      ctx: state.ctx,
      plugins: state.plugins
    };
  }
  function OnLogClick(e) {
    const { logIndex } = e.detail;
    const state = rewind(logIndex);
    const renderedLogEntries2 = log.filter((e2) => !e2.automatic);
    client.overrideGameState(state);
    if (pinned == logIndex) {
      $$invalidate(2, pinned = null);
      secondaryPane.set(null);
    } else {
      $$invalidate(2, pinned = logIndex);
      const { metadata } = renderedLogEntries2[logIndex].action.payload;
      if (metadata) {
        secondaryPane.set({ component: MCTS, metadata });
      }
    }
  }
  function OnMouseEnter(e) {
    const { logIndex } = e.detail;
    if (pinned === null) {
      const state = rewind(logIndex);
      client.overrideGameState(state);
    }
  }
  function OnMouseLeave() {
    if (pinned === null) {
      client.overrideGameState(null);
    }
  }
  function Reset() {
    $$invalidate(2, pinned = null);
    client.overrideGameState(null);
    secondaryPane.set(null);
  }
  onDestroy(Reset);
  function OnKeyDown(e) {
    if (e.keyCode == 27) {
      Reset();
    }
  }
  let renderedLogEntries;
  let turnBoundaries = {};
  let phaseBoundaries = {};
  $$self.$$set = ($$props2) => {
    if ("client" in $$props2) $$subscribe_client($$invalidate(0, client = $$props2.client));
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*$client, log, renderedLogEntries*/
    1538) {
      {
        $$invalidate(9, log = $client.log);
        $$invalidate(1, renderedLogEntries = log.filter((e) => !e.automatic));
        let eventsInCurrentPhase = 0;
        let eventsInCurrentTurn = 0;
        $$invalidate(3, turnBoundaries = {});
        $$invalidate(4, phaseBoundaries = {});
        for (let i2 = 0; i2 < renderedLogEntries.length; i2++) {
          const { action, payload, turn, phase } = renderedLogEntries[i2];
          eventsInCurrentTurn++;
          eventsInCurrentPhase++;
          if (i2 == renderedLogEntries.length - 1 || renderedLogEntries[i2 + 1].turn != turn) {
            $$invalidate(3, turnBoundaries[i2] = eventsInCurrentTurn, turnBoundaries);
            eventsInCurrentTurn = 0;
          }
          if (i2 == renderedLogEntries.length - 1 || renderedLogEntries[i2 + 1].phase != phase) {
            $$invalidate(4, phaseBoundaries[i2] = eventsInCurrentPhase, phaseBoundaries);
            eventsInCurrentPhase = 0;
          }
        }
      }
    }
  };
  return [
    client,
    renderedLogEntries,
    pinned,
    turnBoundaries,
    phaseBoundaries,
    OnLogClick,
    OnMouseEnter,
    OnMouseLeave,
    OnKeyDown,
    log,
    $client
  ];
}
var Log = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$w, create_fragment$w, safe_not_equal, { client: 0 }, add_css$n);
  }
};
function add_css$o(target) {
  append_styles(target, "svelte-1fu900w", "label.svelte-1fu900w{color:#666}.option.svelte-1fu900w{margin-bottom:20px}.value.svelte-1fu900w{font-weight:bold;color:#000}input[type='checkbox'].svelte-1fu900w{vertical-align:middle}");
}
function get_each_context$9(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[6] = list[i2][0];
  child_ctx[7] = list[i2][1];
  child_ctx[8] = list;
  child_ctx[9] = i2;
  return child_ctx;
}
function create_if_block_1$5(ctx) {
  let input;
  let input_id_value;
  let mounted;
  let dispose;
  function input_change_handler() {
    ctx[5].call(
      input,
      /*key*/
      ctx[6]
    );
  }
  return {
    c() {
      input = element("input");
      attr(input, "id", input_id_value = /*makeID*/
      ctx[3](
        /*key*/
        ctx[6]
      ));
      attr(input, "type", "checkbox");
      attr(input, "class", "svelte-1fu900w");
    },
    m(target, anchor) {
      insert(target, input, anchor);
      input.checked = /*values*/
      ctx[1][
        /*key*/
        ctx[6]
      ];
      if (!mounted) {
        dispose = [
          listen(input, "change", input_change_handler),
          listen(
            input,
            "change",
            /*OnChange*/
            ctx[2]
          )
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*bot*/
      1 && input_id_value !== (input_id_value = /*makeID*/
      ctx[3](
        /*key*/
        ctx[6]
      ))) {
        attr(input, "id", input_id_value);
      }
      if (dirty & /*values, Object, bot*/
      3) {
        input.checked = /*values*/
        ctx[1][
          /*key*/
          ctx[6]
        ];
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block$c(ctx) {
  let span;
  let t0_value = (
    /*values*/
    ctx[1][
      /*key*/
      ctx[6]
    ] + ""
  );
  let t0;
  let t1;
  let input;
  let input_id_value;
  let input_min_value;
  let input_max_value;
  let mounted;
  let dispose;
  function input_change_input_handler() {
    ctx[4].call(
      input,
      /*key*/
      ctx[6]
    );
  }
  return {
    c() {
      span = element("span");
      t0 = text(t0_value);
      t1 = space();
      input = element("input");
      attr(span, "class", "value svelte-1fu900w");
      attr(input, "id", input_id_value = /*makeID*/
      ctx[3](
        /*key*/
        ctx[6]
      ));
      attr(input, "type", "range");
      attr(input, "min", input_min_value = /*value*/
      ctx[7].range.min);
      attr(input, "max", input_max_value = /*value*/
      ctx[7].range.max);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      insert(target, t1, anchor);
      insert(target, input, anchor);
      set_input_value(
        input,
        /*values*/
        ctx[1][
          /*key*/
          ctx[6]
        ]
      );
      if (!mounted) {
        dispose = [
          listen(input, "change", input_change_input_handler),
          listen(input, "input", input_change_input_handler),
          listen(
            input,
            "change",
            /*OnChange*/
            ctx[2]
          )
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*values, bot*/
      3 && t0_value !== (t0_value = /*values*/
      ctx[1][
        /*key*/
        ctx[6]
      ] + "")) set_data(t0, t0_value);
      if (dirty & /*bot*/
      1 && input_id_value !== (input_id_value = /*makeID*/
      ctx[3](
        /*key*/
        ctx[6]
      ))) {
        attr(input, "id", input_id_value);
      }
      if (dirty & /*bot*/
      1 && input_min_value !== (input_min_value = /*value*/
      ctx[7].range.min)) {
        attr(input, "min", input_min_value);
      }
      if (dirty & /*bot*/
      1 && input_max_value !== (input_max_value = /*value*/
      ctx[7].range.max)) {
        attr(input, "max", input_max_value);
      }
      if (dirty & /*values, Object, bot*/
      3) {
        set_input_value(
          input,
          /*values*/
          ctx[1][
            /*key*/
            ctx[6]
          ]
        );
      }
    },
    d(detaching) {
      if (detaching) detach(span);
      if (detaching) detach(t1);
      if (detaching) detach(input);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block$9(ctx) {
  let div;
  let label;
  let t0_value = (
    /*key*/
    ctx[6] + ""
  );
  let t0;
  let label_for_value;
  let t1;
  let t2;
  function select_block_type(ctx2, dirty) {
    if (
      /*value*/
      ctx2[7].range
    ) return create_if_block$c;
    if (typeof /*value*/
    ctx2[7].value === "boolean") return create_if_block_1$5;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type && current_block_type(ctx);
  return {
    c() {
      div = element("div");
      label = element("label");
      t0 = text(t0_value);
      t1 = space();
      if (if_block) if_block.c();
      t2 = space();
      attr(label, "for", label_for_value = /*makeID*/
      ctx[3](
        /*key*/
        ctx[6]
      ));
      attr(label, "class", "svelte-1fu900w");
      attr(div, "class", "option svelte-1fu900w");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, label);
      append(label, t0);
      append(div, t1);
      if (if_block) if_block.m(div, null);
      append(div, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*bot*/
      1 && t0_value !== (t0_value = /*key*/
      ctx2[6] + "")) set_data(t0, t0_value);
      if (dirty & /*bot*/
      1 && label_for_value !== (label_for_value = /*makeID*/
      ctx2[3](
        /*key*/
        ctx2[6]
      ))) {
        attr(label, "for", label_for_value);
      }
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if (if_block) if_block.d(1);
        if_block = current_block_type && current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div, t2);
        }
      }
    },
    d(detaching) {
      if (detaching) detach(div);
      if (if_block) {
        if_block.d();
      }
    }
  };
}
function create_fragment$x(ctx) {
  let each_1_anchor;
  let each_value = Object.entries(
    /*bot*/
    ctx[0].opts()
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$9(get_each_context$9(ctx, each_value, i2));
  }
  return {
    c() {
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*makeID, Object, bot, values, OnChange*/
      15) {
        each_value = Object.entries(
          /*bot*/
          ctx2[0].opts()
        );
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$9(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block$9(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i: noop2,
    o: noop2,
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching) detach(each_1_anchor);
    }
  };
}
function instance$x($$self, $$props, $$invalidate) {
  let { bot } = $$props;
  let values = {};
  for (let [key, value2] of Object.entries(bot.opts())) {
    values[key] = value2.value;
  }
  function OnChange() {
    for (let [key, value2] of Object.entries(values)) {
      bot.setOpt(key, value2);
    }
  }
  const makeID = (key) => "ai-option-" + key;
  function input_change_input_handler(key) {
    values[key] = to_number(this.value);
    $$invalidate(1, values);
  }
  function input_change_handler(key) {
    values[key] = this.checked;
    $$invalidate(1, values);
  }
  $$self.$$set = ($$props2) => {
    if ("bot" in $$props2) $$invalidate(0, bot = $$props2.bot);
  };
  return [
    bot,
    values,
    OnChange,
    makeID,
    input_change_input_handler,
    input_change_handler
  ];
}
var Options = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$x, create_fragment$x, safe_not_equal, { bot: 0 }, add_css$o);
  }
};
function add_css$p(target) {
  append_styles(target, "svelte-fn09gm", "ul.svelte-fn09gm{padding-left:0}li.svelte-fn09gm{list-style:none;margin:0;margin-bottom:5px}h3.svelte-fn09gm{text-transform:uppercase}label.svelte-fn09gm{color:#666}input[type='checkbox'].svelte-fn09gm{vertical-align:middle}");
}
function get_each_context$a(ctx, list, i2) {
  const child_ctx = ctx.slice();
  child_ctx[7] = list[i2];
  return child_ctx;
}
function create_else_block$3(ctx) {
  let p0;
  let t1;
  let p1;
  return {
    c() {
      p0 = element("p");
      p0.textContent = "No bots available.";
      t1 = space();
      p1 = element("p");
      p1.innerHTML = `Follow the instructions
        <a href="https://boardgame.io/documentation/#/tutorial?id=bots" target="_blank">here</a>
        to set up bots.`;
    },
    m(target, anchor) {
      insert(target, p0, anchor);
      insert(target, t1, anchor);
      insert(target, p1, anchor);
    },
    p: noop2,
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(p0);
      if (detaching) detach(t1);
      if (detaching) detach(p1);
    }
  };
}
function create_if_block_5(ctx) {
  let p2;
  return {
    c() {
      p2 = element("p");
      p2.textContent = "The bot debugger is only available in singleplayer mode.";
    },
    m(target, anchor) {
      insert(target, p2, anchor);
    },
    p: noop2,
    i: noop2,
    o: noop2,
    d(detaching) {
      if (detaching) detach(p2);
    }
  };
}
function create_if_block$d(ctx) {
  let section0;
  let h30;
  let t1;
  let ul;
  let li0;
  let hotkey0;
  let t2;
  let li1;
  let hotkey1;
  let t3;
  let li2;
  let hotkey2;
  let t4;
  let section1;
  let h31;
  let t6;
  let select;
  let t7;
  let show_if = Object.keys(
    /*bot*/
    ctx[7].opts()
  ).length;
  let t8;
  let if_block1_anchor;
  let current;
  let mounted;
  let dispose;
  hotkey0 = new Hotkey({
    props: {
      value: "1",
      onPress: (
        /*Reset*/
        ctx[13]
      ),
      label: "reset"
    }
  });
  hotkey1 = new Hotkey({
    props: {
      value: "2",
      onPress: (
        /*Step*/
        ctx[11]
      ),
      label: "play"
    }
  });
  hotkey2 = new Hotkey({
    props: {
      value: "3",
      onPress: (
        /*Simulate*/
        ctx[12]
      ),
      label: "simulate"
    }
  });
  let each_value = Object.keys(
    /*bots*/
    ctx[8]
  );
  let each_blocks = [];
  for (let i2 = 0; i2 < each_value.length; i2 += 1) {
    each_blocks[i2] = create_each_block$a(get_each_context$a(ctx, each_value, i2));
  }
  let if_block0 = show_if && create_if_block_4(ctx);
  let if_block1 = (
    /*botAction*/
    (ctx[5] || /*iterationCounter*/
    ctx[3]) && create_if_block_1$6(ctx)
  );
  return {
    c() {
      section0 = element("section");
      h30 = element("h3");
      h30.textContent = "Controls";
      t1 = space();
      ul = element("ul");
      li0 = element("li");
      create_component(hotkey0.$$.fragment);
      t2 = space();
      li1 = element("li");
      create_component(hotkey1.$$.fragment);
      t3 = space();
      li2 = element("li");
      create_component(hotkey2.$$.fragment);
      t4 = space();
      section1 = element("section");
      h31 = element("h3");
      h31.textContent = "Bot";
      t6 = space();
      select = element("select");
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].c();
      }
      t7 = space();
      if (if_block0) if_block0.c();
      t8 = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
      attr(h30, "class", "svelte-fn09gm");
      attr(li0, "class", "svelte-fn09gm");
      attr(li1, "class", "svelte-fn09gm");
      attr(li2, "class", "svelte-fn09gm");
      attr(ul, "class", "svelte-fn09gm");
      attr(h31, "class", "svelte-fn09gm");
      if (
        /*selectedBot*/
        ctx[4] === void 0
      ) add_render_callback(() => (
        /*select_change_handler*/
        ctx[17].call(select)
      ));
    },
    m(target, anchor) {
      insert(target, section0, anchor);
      append(section0, h30);
      append(section0, t1);
      append(section0, ul);
      append(ul, li0);
      mount_component(hotkey0, li0, null);
      append(ul, t2);
      append(ul, li1);
      mount_component(hotkey1, li1, null);
      append(ul, t3);
      append(ul, li2);
      mount_component(hotkey2, li2, null);
      insert(target, t4, anchor);
      insert(target, section1, anchor);
      append(section1, h31);
      append(section1, t6);
      append(section1, select);
      for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
        each_blocks[i2].m(select, null);
      }
      select_option(
        select,
        /*selectedBot*/
        ctx[4]
      );
      insert(target, t7, anchor);
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t8, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            select,
            "change",
            /*select_change_handler*/
            ctx[17]
          ),
          listen(
            select,
            "change",
            /*ChangeBot*/
            ctx[10]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*Object, bots*/
      256) {
        each_value = Object.keys(
          /*bots*/
          ctx2[8]
        );
        let i2;
        for (i2 = 0; i2 < each_value.length; i2 += 1) {
          const child_ctx = get_each_context$a(ctx2, each_value, i2);
          if (each_blocks[i2]) {
            each_blocks[i2].p(child_ctx, dirty);
          } else {
            each_blocks[i2] = create_each_block$a(child_ctx);
            each_blocks[i2].c();
            each_blocks[i2].m(select, null);
          }
        }
        for (; i2 < each_blocks.length; i2 += 1) {
          each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (dirty & /*selectedBot, Object, bots*/
      272) {
        select_option(
          select,
          /*selectedBot*/
          ctx2[4]
        );
      }
      if (dirty & /*bot*/
      128) show_if = Object.keys(
        /*bot*/
        ctx2[7].opts()
      ).length;
      if (show_if) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*bot*/
          128) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_4(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t8.parentNode, t8);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (
        /*botAction*/
        ctx2[5] || /*iterationCounter*/
        ctx2[3]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_1$6(ctx2);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(hotkey0.$$.fragment, local);
      transition_in(hotkey1.$$.fragment, local);
      transition_in(hotkey2.$$.fragment, local);
      transition_in(if_block0);
      current = true;
    },
    o(local) {
      transition_out(hotkey0.$$.fragment, local);
      transition_out(hotkey1.$$.fragment, local);
      transition_out(hotkey2.$$.fragment, local);
      transition_out(if_block0);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section0);
      destroy_component(hotkey0);
      destroy_component(hotkey1);
      destroy_component(hotkey2);
      if (detaching) detach(t4);
      if (detaching) detach(section1);
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t7);
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t8);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(if_block1_anchor);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block$a(ctx) {
  let option;
  let t_value = (
    /*bot*/
    ctx[7] + ""
  );
  let t2;
  let option_value_value;
  return {
    c() {
      option = element("option");
      t2 = text(t_value);
      option.__value = option_value_value = /*bot*/
      ctx[7];
      option.value = option.__value;
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t2);
    },
    p: noop2,
    d(detaching) {
      if (detaching) detach(option);
    }
  };
}
function create_if_block_4(ctx) {
  let section;
  let h3;
  let t1;
  let label;
  let t3;
  let input;
  let t4;
  let options;
  let current;
  let mounted;
  let dispose;
  options = new Options({ props: { bot: (
    /*bot*/
    ctx[7]
  ) } });
  return {
    c() {
      section = element("section");
      h3 = element("h3");
      h3.textContent = "Options";
      t1 = space();
      label = element("label");
      label.textContent = "debug";
      t3 = space();
      input = element("input");
      t4 = space();
      create_component(options.$$.fragment);
      attr(h3, "class", "svelte-fn09gm");
      attr(label, "for", "ai-option-debug");
      attr(label, "class", "svelte-fn09gm");
      attr(input, "id", "ai-option-debug");
      attr(input, "type", "checkbox");
      attr(input, "class", "svelte-fn09gm");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      append(section, h3);
      append(section, t1);
      append(section, label);
      append(section, t3);
      append(section, input);
      input.checked = /*debug*/
      ctx[1];
      append(section, t4);
      mount_component(options, section, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            input,
            "change",
            /*input_change_handler*/
            ctx[18]
          ),
          listen(
            input,
            "change",
            /*OnDebug*/
            ctx[9]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*debug*/
      2) {
        input.checked = /*debug*/
        ctx2[1];
      }
      const options_changes = {};
      if (dirty & /*bot*/
      128) options_changes.bot = /*bot*/
      ctx2[7];
      options.$set(options_changes);
    },
    i(local) {
      if (current) return;
      transition_in(options.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(options.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section);
      destroy_component(options);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_1$6(ctx) {
  let section;
  let h3;
  let t1;
  let t2;
  let if_block0 = (
    /*progress*/
    ctx[2] && /*progress*/
    ctx[2] < 1 && create_if_block_3$1(ctx)
  );
  let if_block1 = (
    /*botAction*/
    ctx[5] && create_if_block_2$4(ctx)
  );
  return {
    c() {
      section = element("section");
      h3 = element("h3");
      h3.textContent = "Result";
      t1 = space();
      if (if_block0) if_block0.c();
      t2 = space();
      if (if_block1) if_block1.c();
      attr(h3, "class", "svelte-fn09gm");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      append(section, h3);
      append(section, t1);
      if (if_block0) if_block0.m(section, null);
      append(section, t2);
      if (if_block1) if_block1.m(section, null);
    },
    p(ctx2, dirty) {
      if (
        /*progress*/
        ctx2[2] && /*progress*/
        ctx2[2] < 1
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_3$1(ctx2);
          if_block0.c();
          if_block0.m(section, t2);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*botAction*/
        ctx2[5]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_2$4(ctx2);
          if_block1.c();
          if_block1.m(section, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) detach(section);
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
    }
  };
}
function create_if_block_3$1(ctx) {
  let progress_1;
  return {
    c() {
      progress_1 = element("progress");
      progress_1.value = /*progress*/
      ctx[2];
    },
    m(target, anchor) {
      insert(target, progress_1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*progress*/
      4) {
        progress_1.value = /*progress*/
        ctx2[2];
      }
    },
    d(detaching) {
      if (detaching) detach(progress_1);
    }
  };
}
function create_if_block_2$4(ctx) {
  let ul;
  let li0;
  let t0;
  let t1;
  let t2;
  let li1;
  let t3;
  let t4_value = JSON.stringify(
    /*botActionArgs*/
    ctx[6]
  ) + "";
  let t4;
  return {
    c() {
      ul = element("ul");
      li0 = element("li");
      t0 = text("Action: ");
      t1 = text(
        /*botAction*/
        ctx[5]
      );
      t2 = space();
      li1 = element("li");
      t3 = text("Args: ");
      t4 = text(t4_value);
      attr(li0, "class", "svelte-fn09gm");
      attr(li1, "class", "svelte-fn09gm");
      attr(ul, "class", "svelte-fn09gm");
    },
    m(target, anchor) {
      insert(target, ul, anchor);
      append(ul, li0);
      append(li0, t0);
      append(li0, t1);
      append(ul, t2);
      append(ul, li1);
      append(li1, t3);
      append(li1, t4);
    },
    p(ctx2, dirty) {
      if (dirty & /*botAction*/
      32) set_data(
        t1,
        /*botAction*/
        ctx2[5]
      );
      if (dirty & /*botActionArgs*/
      64 && t4_value !== (t4_value = JSON.stringify(
        /*botActionArgs*/
        ctx2[6]
      ) + "")) set_data(t4, t4_value);
    },
    d(detaching) {
      if (detaching) detach(ul);
    }
  };
}
function create_fragment$y(ctx) {
  let section;
  let current_block_type_index;
  let if_block;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block$d, create_if_block_5, create_else_block$3];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*client*/
      ctx2[0].game.ai && !/*client*/
      ctx2[0].multiplayer
    ) return 0;
    if (
      /*client*/
      ctx2[0].multiplayer
    ) return 1;
    return 2;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      section = element("section");
      if_block.c();
    },
    m(target, anchor) {
      insert(target, section, anchor);
      if_blocks[current_block_type_index].m(section, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          window,
          "keydown",
          /*OnKeyDown*/
          ctx[14]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(section, null);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section);
      if_blocks[current_block_type_index].d();
      mounted = false;
      dispose();
    }
  };
}
function instance$y($$self, $$props, $$invalidate) {
  let { client } = $$props;
  let { clientManager } = $$props;
  let { ToggleVisibility } = $$props;
  const { secondaryPane } = getContext("secondaryPane");
  const bots = { "MCTS": MCTSBot, "Random": RandomBot };
  let debug = false;
  let progress = null;
  let iterationCounter = 0;
  let metadata = null;
  const iterationCallback = ({ iterationCounter: c2, numIterations, metadata: m }) => {
    $$invalidate(3, iterationCounter = c2);
    $$invalidate(2, progress = c2 / numIterations);
    metadata = m;
    if (debug && metadata) {
      secondaryPane.set({ component: MCTS, metadata });
    }
  };
  function OnDebug() {
    if (debug && metadata) {
      secondaryPane.set({ component: MCTS, metadata });
    } else {
      secondaryPane.set(null);
    }
  }
  let bot;
  if (client.game.ai) {
    bot = new MCTSBot({
      game: client.game,
      enumerate: client.game.ai.enumerate,
      iterationCallback
    });
    bot.setOpt("async", true);
  }
  let selectedBot;
  let botAction;
  let botActionArgs;
  function ChangeBot() {
    const botConstructor = bots[selectedBot];
    $$invalidate(7, bot = new botConstructor({
      game: client.game,
      enumerate: client.game.ai.enumerate,
      iterationCallback
    }));
    bot.setOpt("async", true);
    $$invalidate(5, botAction = null);
    metadata = null;
    secondaryPane.set(null);
    $$invalidate(3, iterationCounter = 0);
  }
  async function Step$1() {
    $$invalidate(5, botAction = null);
    metadata = null;
    $$invalidate(3, iterationCounter = 0);
    const t2 = await Step(client, bot);
    if (t2) {
      $$invalidate(5, botAction = t2.payload.type);
      $$invalidate(6, botActionArgs = t2.payload.args);
    }
  }
  function Simulate(iterations = 1e4, sleepTimeout = 100) {
    $$invalidate(5, botAction = null);
    metadata = null;
    $$invalidate(3, iterationCounter = 0);
    const step = async () => {
      for (let i2 = 0; i2 < iterations; i2++) {
        const action = await Step(client, bot);
        if (!action) break;
        await new Promise((resolve) => setTimeout(resolve, sleepTimeout));
      }
    };
    return step();
  }
  function Exit() {
    client.overrideGameState(null);
    secondaryPane.set(null);
    $$invalidate(1, debug = false);
  }
  function Reset() {
    client.reset();
    $$invalidate(5, botAction = null);
    metadata = null;
    $$invalidate(3, iterationCounter = 0);
    Exit();
  }
  function OnKeyDown(e) {
    if (e.keyCode == 27) {
      Exit();
    }
  }
  onDestroy(Exit);
  function select_change_handler() {
    selectedBot = select_value(this);
    $$invalidate(4, selectedBot);
    $$invalidate(8, bots);
  }
  function input_change_handler() {
    debug = this.checked;
    $$invalidate(1, debug);
  }
  $$self.$$set = ($$props2) => {
    if ("client" in $$props2) $$invalidate(0, client = $$props2.client);
    if ("clientManager" in $$props2) $$invalidate(15, clientManager = $$props2.clientManager);
    if ("ToggleVisibility" in $$props2) $$invalidate(16, ToggleVisibility = $$props2.ToggleVisibility);
  };
  return [
    client,
    debug,
    progress,
    iterationCounter,
    selectedBot,
    botAction,
    botActionArgs,
    bot,
    bots,
    OnDebug,
    ChangeBot,
    Step$1,
    Simulate,
    Reset,
    OnKeyDown,
    clientManager,
    ToggleVisibility,
    select_change_handler,
    input_change_handler
  ];
}
var AI = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance$y,
      create_fragment$y,
      safe_not_equal,
      {
        client: 0,
        clientManager: 15,
        ToggleVisibility: 16
      },
      add_css$p
    );
  }
};
function add_css$q(target) {
  append_styles(target, "svelte-8ymctk", ".debug-panel.svelte-8ymctk.svelte-8ymctk{position:fixed;color:#555;font-family:monospace;right:0;top:0;height:100%;font-size:14px;opacity:0.9;z-index:99999}.panel.svelte-8ymctk.svelte-8ymctk{display:flex;position:relative;flex-direction:row;height:100%}.visibility-toggle.svelte-8ymctk.svelte-8ymctk{position:absolute;box-sizing:border-box;top:7px;border:1px solid #ccc;border-radius:5px;width:48px;height:48px;padding:8px;background:white;color:#555;box-shadow:0 0 5px rgba(0, 0, 0, 0.2)}.visibility-toggle.svelte-8ymctk.svelte-8ymctk:hover,.visibility-toggle.svelte-8ymctk.svelte-8ymctk:focus{background:#eee}.opener.svelte-8ymctk.svelte-8ymctk{right:10px}.closer.svelte-8ymctk.svelte-8ymctk{left:-326px}@keyframes svelte-8ymctk-rotateFromZero{from{transform:rotateZ(0deg)}to{transform:rotateZ(180deg)}}.icon.svelte-8ymctk.svelte-8ymctk{display:flex;height:100%;animation:svelte-8ymctk-rotateFromZero 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0s 1\n      normal forwards}.closer.svelte-8ymctk .icon.svelte-8ymctk{animation-direction:reverse}.pane.svelte-8ymctk.svelte-8ymctk{flex-grow:2;overflow-x:hidden;overflow-y:scroll;background:#fefefe;padding:20px;border-left:1px solid #ccc;box-shadow:-1px 0 5px rgba(0, 0, 0, 0.2);box-sizing:border-box;width:280px}.secondary-pane.svelte-8ymctk.svelte-8ymctk{background:#fefefe;overflow-y:scroll}.debug-panel.svelte-8ymctk button,.debug-panel.svelte-8ymctk select{cursor:pointer;font-size:14px;font-family:monospace}.debug-panel.svelte-8ymctk select{background:#eee;border:1px solid #bbb;color:#555;padding:3px;border-radius:3px}.debug-panel.svelte-8ymctk section{margin-bottom:20px}.debug-panel.svelte-8ymctk .screen-reader-only{clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;overflow:hidden;position:absolute;white-space:nowrap;width:1px}");
}
function create_else_block$4(ctx) {
  let div1;
  let t0;
  let menu;
  let t1;
  let div0;
  let switch_instance;
  let t2;
  let div1_transition;
  let current;
  let if_block0 = (
    /*showToggleButton*/
    ctx[10] && create_if_block_3$2(ctx)
  );
  menu = new Menu({
    props: {
      panes: (
        /*panes*/
        ctx[6]
      ),
      pane: (
        /*pane*/
        ctx[2]
      )
    }
  });
  menu.$on(
    "change",
    /*MenuChange*/
    ctx[8]
  );
  var switch_value = (
    /*panes*/
    ctx[6][
      /*pane*/
      ctx[2]
    ].component
  );
  function switch_props(ctx2) {
    return {
      props: {
        client: (
          /*client*/
          ctx2[4]
        ),
        clientManager: (
          /*clientManager*/
          ctx2[0]
        ),
        ToggleVisibility: (
          /*ToggleVisibility*/
          ctx2[9]
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  let if_block1 = (
    /*$secondaryPane*/
    ctx[5] && create_if_block_2$5(ctx)
  );
  return {
    c() {
      div1 = element("div");
      if (if_block0) if_block0.c();
      t0 = space();
      create_component(menu.$$.fragment);
      t1 = space();
      div0 = element("div");
      if (switch_instance) create_component(switch_instance.$$.fragment);
      t2 = space();
      if (if_block1) if_block1.c();
      attr(div0, "class", "pane svelte-8ymctk");
      attr(div0, "role", "region");
      attr(
        div0,
        "aria-label",
        /*pane*/
        ctx[2]
      );
      attr(div0, "tabindex", "-1");
      attr(div1, "class", "panel svelte-8ymctk");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block0) if_block0.m(div1, null);
      append(div1, t0);
      mount_component(menu, div1, null);
      append(div1, t1);
      append(div1, div0);
      if (switch_instance) {
        mount_component(switch_instance, div0, null);
      }
      ctx[16](div0);
      append(div1, t2);
      if (if_block1) if_block1.m(div1, null);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (
        /*showToggleButton*/
        ctx[10]
      ) if_block0.p(ctx, dirty);
      const menu_changes = {};
      if (dirty & /*pane*/
      4) menu_changes.pane = /*pane*/
      ctx[2];
      menu.$set(menu_changes);
      const switch_instance_changes = {};
      if (dirty & /*client*/
      16) switch_instance_changes.client = /*client*/
      ctx[4];
      if (dirty & /*clientManager*/
      1) switch_instance_changes.clientManager = /*clientManager*/
      ctx[0];
      if (switch_value !== (switch_value = /*panes*/
      ctx[6][
        /*pane*/
        ctx[2]
      ].component)) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, div0, null);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
      if (!current || dirty & /*pane*/
      4) {
        attr(
          div0,
          "aria-label",
          /*pane*/
          ctx[2]
        );
      }
      if (
        /*$secondaryPane*/
        ctx[5]
      ) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
          if (dirty & /*$secondaryPane*/
          32) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_2$5(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(div1, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(menu.$$.fragment, local);
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      transition_in(if_block1);
      add_render_callback(() => {
        if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: 400, .../*transitionOpts*/
        ctx[12] }, true);
        div1_transition.run(1);
      });
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(menu.$$.fragment, local);
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      transition_out(if_block1);
      if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: 400, .../*transitionOpts*/
      ctx[12] }, false);
      div1_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      if (if_block0) if_block0.d();
      destroy_component(menu);
      if (switch_instance) destroy_component(switch_instance);
      ctx[16](null);
      if (if_block1) if_block1.d();
      if (detaching && div1_transition) div1_transition.end();
    }
  };
}
function create_if_block$e(ctx) {
  let if_block_anchor;
  let current;
  let if_block = (
    /*showToggleButton*/
    ctx[10] && create_if_block_1$7(ctx)
  );
  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (
        /*showToggleButton*/
        ctx2[10]
      ) if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    }
  };
}
function create_if_block_3$2(ctx) {
  let button;
  let span;
  let chevron;
  let button_intro;
  let button_outro;
  let current;
  let mounted;
  let dispose;
  chevron = new FaChevronRight({});
  return {
    c() {
      button = element("button");
      span = element("span");
      create_component(chevron.$$.fragment);
      attr(span, "class", "icon svelte-8ymctk");
      attr(span, "aria-hidden", "true");
      attr(button, "class", "visibility-toggle closer svelte-8ymctk");
      attr(button, "title", "Hide Debug Panel");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, span);
      mount_component(chevron, span, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*ToggleVisibility*/
          ctx[9]
        );
        mounted = true;
      }
    },
    p: noop2,
    i(local) {
      if (current) return;
      transition_in(chevron.$$.fragment, local);
      add_render_callback(() => {
        if (button_outro) button_outro.end(1);
        button_intro = create_in_transition(
          button,
          /*receive*/
          ctx[14],
          { key: "toggle" }
        );
        button_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(chevron.$$.fragment, local);
      if (button_intro) button_intro.invalidate();
      button_outro = create_out_transition(
        button,
        /*send*/
        ctx[13],
        { key: "toggle" }
      );
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      destroy_component(chevron);
      if (detaching && button_outro) button_outro.end();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_2$5(ctx) {
  let div;
  let switch_instance;
  let current;
  var switch_value = (
    /*$secondaryPane*/
    ctx[5].component
  );
  function switch_props(ctx2) {
    return {
      props: {
        metadata: (
          /*$secondaryPane*/
          ctx2[5].metadata
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = new switch_value(switch_props(ctx));
  }
  return {
    c() {
      div = element("div");
      if (switch_instance) create_component(switch_instance.$$.fragment);
      attr(div, "class", "secondary-pane svelte-8ymctk");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (switch_instance) {
        mount_component(switch_instance, div, null);
      }
      current = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = {};
      if (dirty & /*$secondaryPane*/
      32) switch_instance_changes.metadata = /*$secondaryPane*/
      ctx2[5].metadata;
      if (switch_value !== (switch_value = /*$secondaryPane*/
      ctx2[5].component)) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = new switch_value(switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, div, null);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      if (switch_instance) destroy_component(switch_instance);
    }
  };
}
function create_if_block_1$7(ctx) {
  let button;
  let span;
  let chevron;
  let button_intro;
  let button_outro;
  let current;
  let mounted;
  let dispose;
  chevron = new FaChevronRight({});
  return {
    c() {
      button = element("button");
      span = element("span");
      create_component(chevron.$$.fragment);
      attr(span, "class", "icon svelte-8ymctk");
      attr(span, "aria-hidden", "true");
      attr(button, "class", "visibility-toggle opener svelte-8ymctk");
      attr(button, "title", "Show Debug Panel");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, span);
      mount_component(chevron, span, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*ToggleVisibility*/
          ctx[9]
        );
        mounted = true;
      }
    },
    p: noop2,
    i(local) {
      if (current) return;
      transition_in(chevron.$$.fragment, local);
      add_render_callback(() => {
        if (button_outro) button_outro.end(1);
        button_intro = create_in_transition(
          button,
          /*receive*/
          ctx[14],
          { key: "toggle" }
        );
        button_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(chevron.$$.fragment, local);
      if (button_intro) button_intro.invalidate();
      button_outro = create_out_transition(
        button,
        /*send*/
        ctx[13],
        { key: "toggle" }
      );
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      destroy_component(chevron);
      if (detaching && button_outro) button_outro.end();
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$z(ctx) {
  let section;
  let current_block_type_index;
  let if_block;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block$e, create_else_block$4];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (!/*visible*/
    ctx2[3]) return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      section = element("section");
      if_block.c();
      attr(section, "aria-label", "boardgame.io Debug Panel");
      attr(section, "class", "debug-panel svelte-8ymctk");
    },
    m(target, anchor) {
      insert(target, section, anchor);
      if_blocks[current_block_type_index].m(section, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          window,
          "keypress",
          /*Keypress*/
          ctx[11]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(section, null);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(section);
      if_blocks[current_block_type_index].d();
      mounted = false;
      dispose();
    }
  };
}
function instance$z($$self, $$props, $$invalidate) {
  let client;
  let $clientManager, $$unsubscribe_clientManager = noop2, $$subscribe_clientManager = () => ($$unsubscribe_clientManager(), $$unsubscribe_clientManager = subscribe(clientManager, ($$value) => $$invalidate(15, $clientManager = $$value)), clientManager);
  let $secondaryPane;
  $$self.$$.on_destroy.push(() => $$unsubscribe_clientManager());
  let { clientManager } = $$props;
  $$subscribe_clientManager();
  const panes = {
    main: {
      label: "Main",
      shortcut: "m",
      component: Main
    },
    log: {
      label: "Log",
      shortcut: "l",
      component: Log
    },
    info: {
      label: "Info",
      shortcut: "i",
      component: Info
    },
    ai: {
      label: "AI",
      shortcut: "a",
      component: AI
    }
  };
  const disableHotkeys = writable(false);
  const secondaryPane = writable(null);
  component_subscribe($$self, secondaryPane, (value2) => $$invalidate(5, $secondaryPane = value2));
  setContext("hotkeys", { disableHotkeys });
  setContext("secondaryPane", { secondaryPane });
  let paneDiv;
  let pane = "main";
  function MenuChange(e) {
    $$invalidate(2, pane = e.detail);
    paneDiv.focus();
  }
  function ToggleVisibility() {
    $$invalidate(3, visible = !visible);
  }
  const debugOpt = $clientManager.client.debugOpt;
  let visible = !debugOpt || !debugOpt.collapseOnLoad;
  const showToggleButton = !debugOpt || !debugOpt.hideToggleButton;
  function Keypress(e) {
    if (e.key == ".") {
      ToggleVisibility();
      return;
    }
    if (!visible) return;
    Object.entries(panes).forEach(([key, { shortcut }]) => {
      if (e.key == shortcut) {
        $$invalidate(2, pane = key);
      }
    });
  }
  const transitionOpts = { duration: 150, easing: cubicOut };
  const [send, receive] = crossfade(transitionOpts);
  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      paneDiv = $$value;
      $$invalidate(1, paneDiv);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("clientManager" in $$props2) $$subscribe_clientManager($$invalidate(0, clientManager = $$props2.clientManager));
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*$clientManager*/
    32768) {
      $$invalidate(4, client = $clientManager.client);
    }
  };
  return [
    clientManager,
    paneDiv,
    pane,
    visible,
    client,
    $secondaryPane,
    panes,
    secondaryPane,
    MenuChange,
    ToggleVisibility,
    showToggleButton,
    Keypress,
    transitionOpts,
    send,
    receive,
    $clientManager,
    div0_binding
  ];
}
var Debug = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$z, create_fragment$z, safe_not_equal, { clientManager: 0 }, add_css$q);
  }
};

// node_modules/@babel/runtime/helpers/esm/typeof.js
function _typeof(o2) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o3) {
    return typeof o3;
  } : function(o3) {
    return o3 && "function" == typeof Symbol && o3.constructor === Symbol && o3 !== Symbol.prototype ? "symbol" : typeof o3;
  }, _typeof(o2);
}

// node_modules/@babel/runtime/helpers/esm/toPrimitive.js
function toPrimitive(t2, r2) {
  if ("object" != _typeof(t2) || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i2 = e.call(t2, r2 || "default");
    if ("object" != _typeof(i2)) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}

// node_modules/@babel/runtime/helpers/esm/toPropertyKey.js
function toPropertyKey(t2) {
  var i2 = toPrimitive(t2, "string");
  return "symbol" == _typeof(i2) ? i2 : i2 + "";
}

// node_modules/@babel/runtime/helpers/esm/defineProperty.js
function _defineProperty(e, r2, t2) {
  return (r2 = toPropertyKey(r2)) in e ? Object.defineProperty(e, r2, {
    value: t2,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r2] = t2, e;
}

// node_modules/@babel/runtime/helpers/esm/objectSpread2.js
function ownKeys(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o2 = Object.getOwnPropertySymbols(e);
    r2 && (o2 = o2.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e, r3).enumerable;
    })), t2.push.apply(t2, o2);
  }
  return t2;
}
function _objectSpread2(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys(Object(t2), true).forEach(function(r3) {
      _defineProperty(e, r3, t2[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys(Object(t2)).forEach(function(r3) {
      Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t2, r3));
    });
  }
  return e;
}

// node_modules/redux/es/redux.js
var $$observable = function() {
  return typeof Symbol === "function" && Symbol.observable || "@@observable";
}();
var randomString = function randomString2() {
  return Math.random().toString(36).substring(7).split("").join(".");
};
var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};
function isPlainObject2(obj) {
  if (typeof obj !== "object" || obj === null) return false;
  var proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto;
}
function miniKindOf(val) {
  if (val === void 0) return "undefined";
  if (val === null) return "null";
  var type = typeof val;
  switch (type) {
    case "boolean":
    case "string":
    case "number":
    case "symbol":
    case "function": {
      return type;
    }
  }
  if (Array.isArray(val)) return "array";
  if (isDate(val)) return "date";
  if (isError(val)) return "error";
  var constructorName = ctorName(val);
  switch (constructorName) {
    case "Symbol":
    case "Promise":
    case "WeakMap":
    case "WeakSet":
    case "Map":
    case "Set":
      return constructorName;
  }
  return type.slice(8, -1).toLowerCase().replace(/\s/g, "");
}
function ctorName(val) {
  return typeof val.constructor === "function" ? val.constructor.name : null;
}
function isError(val) {
  return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
}
function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
}
function kindOf(val) {
  var typeOfVal = typeof val;
  if (true) {
    typeOfVal = miniKindOf(val);
  }
  return typeOfVal;
}
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;
  if (typeof preloadedState === "function" && typeof enhancer === "function" || typeof enhancer === "function" && typeof arguments[3] === "function") {
    throw new Error(false ? formatProdErrorMessage(0) : "It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  }
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState;
    preloadedState = void 0;
  }
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error(false ? formatProdErrorMessage(1) : "Expected the enhancer to be a function. Instead, received: '" + kindOf(enhancer) + "'");
    }
    return enhancer(createStore)(reducer, preloadedState);
  }
  if (typeof reducer !== "function") {
    throw new Error(false ? formatProdErrorMessage(2) : "Expected the root reducer to be a function. Instead, received: '" + kindOf(reducer) + "'");
  }
  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  function getState() {
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(3) : "You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.");
    }
    return currentState;
  }
  function subscribe2(listener) {
    if (typeof listener !== "function") {
      throw new Error(false ? formatProdErrorMessage(4) : "Expected the listener to be a function. Instead, received: '" + kindOf(listener) + "'");
    }
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(5) : "You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.");
    }
    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error(false ? formatProdErrorMessage(6) : "You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.");
      }
      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }
  function dispatch2(action) {
    if (!isPlainObject2(action)) {
      throw new Error(false ? formatProdErrorMessage(7) : "Actions must be plain objects. Instead, the actual type was: '" + kindOf(action) + "'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.");
    }
    if (typeof action.type === "undefined") {
      throw new Error(false ? formatProdErrorMessage(8) : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(9) : "Reducers may not dispatch actions.");
    }
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    var listeners2 = currentListeners = nextListeners;
    for (var i2 = 0; i2 < listeners2.length; i2++) {
      var listener = listeners2[i2];
      listener();
    }
    return action;
  }
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== "function") {
      throw new Error(false ? formatProdErrorMessage(10) : "Expected the nextReducer to be a function. Instead, received: '" + kindOf(nextReducer));
    }
    currentReducer = nextReducer;
    dispatch2({
      type: ActionTypes.REPLACE
    });
  }
  function observable() {
    var _ref;
    var outerSubscribe = subscribe2;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe3(observer) {
        if (typeof observer !== "object" || observer === null) {
          throw new Error(false ? formatProdErrorMessage(11) : "Expected the observer to be an object. Instead, received: '" + kindOf(observer) + "'");
        }
        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }
        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe
        };
      }
    }, _ref[$$observable] = function() {
      return this;
    }, _ref;
  }
  dispatch2({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch2,
    subscribe: subscribe2,
    getState,
    replaceReducer
  }, _ref2[$$observable] = observable, _ref2;
}
function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }
  if (funcs.length === 0) {
    return function(arg) {
      return arg;
    };
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce(function(a2, b2) {
    return function() {
      return a2(b2.apply(void 0, arguments));
    };
  });
}
function applyMiddleware() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }
  return function(createStore2) {
    return function() {
      var store = createStore2.apply(void 0, arguments);
      var _dispatch = function dispatch2() {
        throw new Error(false ? formatProdErrorMessage(15) : "Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
      };
      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch2() {
          return _dispatch.apply(void 0, arguments);
        }
      };
      var chain = middlewares.map(function(middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose.apply(void 0, chain)(store.dispatch);
      return _objectSpread2(_objectSpread2({}, store), {}, {
        dispatch: _dispatch
      });
    };
  };
}

// node_modules/boardgame.io/dist/esm/client.js
var import_lodash2 = __toESM(require_lodash());
var import_rfc69022 = __toESM(require_rfc6902());

// node_modules/boardgame.io/dist/esm/initialize-7316768f.js
function InitializeGame({ game, numPlayers, setupData }) {
  game = ProcessGameConfig(game);
  if (!numPlayers) {
    numPlayers = 2;
  }
  const ctx = game.flow.ctx(numPlayers);
  let state = {
    // User managed state.
    G: {},
    // Framework managed state.
    ctx,
    // Plugin related state.
    plugins: {}
  };
  state = Setup(state, { game });
  state = Enhance(state, { game, playerID: void 0 });
  const pluginAPIs = GetAPIs(state);
  state.G = game.setup({ ...pluginAPIs, ctx: state.ctx }, setupData);
  let initial = {
    ...state,
    // List of {G, ctx} pairs that can be undone.
    _undo: [],
    // List of {G, ctx} pairs that can be redone.
    _redo: [],
    // A monotonically non-decreasing ID to ensure that
    // state updates are only allowed from clients that
    // are at the same version that the server.
    _stateID: 0
  };
  initial = game.flow.init(initial);
  [initial] = FlushAndValidate(initial, { game });
  if (!game.disableUndo) {
    initial._undo = [
      {
        G: initial.G,
        ctx: initial.ctx,
        plugins: initial.plugins
      }
    ];
  }
  return initial;
}

// node_modules/boardgame.io/dist/esm/transport-ce07b771.js
var Transport = class {
  constructor({ transportDataCallback, gameName, playerID, matchID, credentials, numPlayers }) {
    this.connectionStatusCallback = () => {
    };
    this.isConnected = false;
    this.transportDataCallback = transportDataCallback;
    this.gameName = gameName || "default";
    this.playerID = playerID || null;
    this.matchID = matchID || "default";
    this.credentials = credentials;
    this.numPlayers = numPlayers || 2;
  }
  /** Subscribe to connection state changes. */
  subscribeToConnectionStatus(fn2) {
    this.connectionStatusCallback = fn2;
  }
  /** Transport implementations should call this when they connect/disconnect. */
  setConnectionStatus(isConnected) {
    this.isConnected = isConnected;
    this.connectionStatusCallback();
  }
  /** Transport implementations should call this when they receive data from a master. */
  notifyClient(data) {
    this.transportDataCallback(data);
  }
};

// node_modules/boardgame.io/dist/esm/client-f7f02b82.js
var DummyImpl = class extends Transport {
  connect() {
  }
  disconnect() {
  }
  sendAction() {
  }
  sendChatMessage() {
  }
  requestSync() {
  }
  updateCredentials() {
  }
  updateMatchID() {
  }
  updatePlayerID() {
  }
};
var DummyTransport = (opts) => new DummyImpl(opts);
var ClientManager = class {
  constructor() {
    this.debugPanel = null;
    this.currentClient = null;
    this.clients = /* @__PURE__ */ new Map();
    this.subscribers = /* @__PURE__ */ new Map();
  }
  /**
   * Register a client with the client manager.
   */
  register(client) {
    this.clients.set(client, client);
    this.mountDebug(client);
    this.notifySubscribers();
  }
  /**
   * Unregister a client from the client manager.
   */
  unregister(client) {
    this.clients.delete(client);
    if (this.currentClient === client) {
      this.unmountDebug();
      for (const [client2] of this.clients) {
        if (this.debugPanel)
          break;
        this.mountDebug(client2);
      }
    }
    this.notifySubscribers();
  }
  /**
   * Subscribe to the client manager state.
   * Calls the passed callback each time the current client changes or a client
   * registers/unregisters.
   * Returns a function to unsubscribe from the state updates.
   */
  subscribe(callback) {
    const id = Symbol();
    this.subscribers.set(id, callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(id);
    };
  }
  /**
   * Switch to a client with a matching playerID.
   */
  switchPlayerID(playerID) {
    if (this.currentClient.multiplayer) {
      for (const [client] of this.clients) {
        if (client.playerID === playerID && client.debugOpt !== false && client.multiplayer === this.currentClient.multiplayer) {
          this.switchToClient(client);
          return;
        }
      }
    }
    this.currentClient.updatePlayerID(playerID);
    this.notifySubscribers();
  }
  /**
   * Set the passed client as the active client for debugging.
   */
  switchToClient(client) {
    if (client === this.currentClient)
      return;
    this.unmountDebug();
    this.mountDebug(client);
    this.notifySubscribers();
  }
  /**
   * Notify all subscribers of changes to the client manager state.
   */
  notifySubscribers() {
    const arg = this.getState();
    this.subscribers.forEach((cb) => {
      cb(arg);
    });
  }
  /**
   * Get the client manager state.
   */
  getState() {
    return {
      client: this.currentClient,
      debuggableClients: this.getDebuggableClients()
    };
  }
  /**
   * Get an array of the registered clients that haven’t disabled the debug panel.
   */
  getDebuggableClients() {
    return [...this.clients.values()].filter((client) => client.debugOpt !== false);
  }
  /**
   * Mount the debug panel using the passed client.
   */
  mountDebug(client) {
    if (client.debugOpt === false || this.debugPanel !== null || typeof document === "undefined") {
      return;
    }
    let DebugImpl;
    let target = document.body;
    if (true) {
      DebugImpl = Debug;
    }
    if (client.debugOpt && client.debugOpt !== true) {
      DebugImpl = client.debugOpt.impl || DebugImpl;
      target = client.debugOpt.target || target;
    }
    if (DebugImpl) {
      this.currentClient = client;
      this.debugPanel = new DebugImpl({
        target,
        props: { clientManager: this }
      });
    }
  }
  /**
   * Unmount the debug panel.
   */
  unmountDebug() {
    this.debugPanel.$destroy();
    this.debugPanel = null;
    this.currentClient = null;
  }
};
var GlobalClientManager = new ClientManager();
function assumedPlayerID(playerID, store, multiplayer) {
  if (!multiplayer && (playerID === null || playerID === void 0)) {
    const state = store.getState();
    playerID = state.ctx.currentPlayer;
  }
  return playerID;
}
function createDispatchers(storeActionType, innerActionNames, store, playerID, credentials, multiplayer) {
  const dispatchers = {};
  for (const name of innerActionNames) {
    dispatchers[name] = (...args) => {
      const action = ActionCreators[storeActionType](name, args, assumedPlayerID(playerID, store, multiplayer), credentials);
      store.dispatch(action);
    };
  }
  return dispatchers;
}
var createMoveDispatchers = createDispatchers.bind(null, "makeMove");
var createEventDispatchers = createDispatchers.bind(null, "gameEvent");
var createPluginDispatchers = createDispatchers.bind(null, "plugin");
var _ClientImpl = class {
  constructor({ game, debug, numPlayers, multiplayer, matchID, playerID, credentials, enhancer }) {
    this.game = ProcessGameConfig(game);
    this.playerID = playerID;
    this.matchID = matchID || "default";
    this.credentials = credentials;
    this.multiplayer = multiplayer;
    this.debugOpt = debug;
    this.manager = GlobalClientManager;
    this.gameStateOverride = null;
    this.subscribers = {};
    this._running = false;
    this.reducer = CreateGameReducer({
      game: this.game,
      isClient: multiplayer !== void 0
    });
    this.initialState = null;
    if (!multiplayer) {
      this.initialState = InitializeGame({ game: this.game, numPlayers });
    }
    this.reset = () => {
      this.store.dispatch(reset(this.initialState));
    };
    this.undo = () => {
      const undo$1 = undo(assumedPlayerID(this.playerID, this.store, this.multiplayer), this.credentials);
      this.store.dispatch(undo$1);
    };
    this.redo = () => {
      const redo$1 = redo(assumedPlayerID(this.playerID, this.store, this.multiplayer), this.credentials);
      this.store.dispatch(redo$1);
    };
    this.log = [];
    const LogMiddleware = (store) => (next) => (action) => {
      const result = next(action);
      const state = store.getState();
      switch (action.type) {
        case MAKE_MOVE:
        case GAME_EVENT:
        case UNDO:
        case REDO: {
          const deltalog = state.deltalog;
          this.log = [...this.log, ...deltalog];
          break;
        }
        case RESET: {
          this.log = [];
          break;
        }
        case PATCH:
        case UPDATE: {
          let id = -1;
          if (this.log.length > 0) {
            id = this.log[this.log.length - 1]._stateID;
          }
          let deltalog = action.deltalog || [];
          deltalog = deltalog.filter((l2) => l2._stateID > id);
          this.log = [...this.log, ...deltalog];
          break;
        }
        case SYNC: {
          this.initialState = action.initialState;
          this.log = action.log || [];
          break;
        }
      }
      return result;
    };
    const TransportMiddleware = (store) => (next) => (action) => {
      const baseState = store.getState();
      const result = next(action);
      if (!("clientOnly" in action) && action.type !== STRIP_TRANSIENTS) {
        this.transport.sendAction(baseState, action);
      }
      return result;
    };
    const SubscriptionMiddleware = () => (next) => (action) => {
      const result = next(action);
      this.notifySubscribers();
      return result;
    };
    const middleware = applyMiddleware(TransientHandlingMiddleware, SubscriptionMiddleware, TransportMiddleware, LogMiddleware);
    enhancer = enhancer !== void 0 ? compose(middleware, enhancer) : middleware;
    this.store = createStore(this.reducer, this.initialState, enhancer);
    if (!multiplayer)
      multiplayer = DummyTransport;
    this.transport = multiplayer({
      transportDataCallback: (data) => this.receiveTransportData(data),
      gameKey: game,
      game: this.game,
      matchID,
      playerID,
      credentials,
      gameName: this.game.name,
      numPlayers
    });
    this.createDispatchers();
    this.chatMessages = [];
    this.sendChatMessage = (payload) => {
      this.transport.sendChatMessage(this.matchID, {
        id: nanoid(7),
        sender: this.playerID,
        payload
      });
    };
  }
  /** Handle incoming match data from a multiplayer transport. */
  receiveMatchData(matchData) {
    this.matchData = matchData;
    this.notifySubscribers();
  }
  /** Handle an incoming chat message from a multiplayer transport. */
  receiveChatMessage(message) {
    this.chatMessages = [...this.chatMessages, message];
    this.notifySubscribers();
  }
  /** Handle all incoming updates from a multiplayer transport. */
  receiveTransportData(data) {
    const [matchID] = data.args;
    if (matchID !== this.matchID)
      return;
    switch (data.type) {
      case "sync": {
        const [, syncInfo] = data.args;
        const action = sync(syncInfo);
        this.receiveMatchData(syncInfo.filteredMetadata);
        this.store.dispatch(action);
        break;
      }
      case "update": {
        const [, state, deltalog] = data.args;
        const currentState = this.store.getState();
        if (state._stateID >= currentState._stateID) {
          const action = update(state, deltalog);
          this.store.dispatch(action);
        }
        break;
      }
      case "patch": {
        const [, prevStateID, stateID, patch$1, deltalog] = data.args;
        const currentStateID = this.store.getState()._stateID;
        if (prevStateID !== currentStateID)
          break;
        const action = patch(prevStateID, stateID, patch$1, deltalog);
        this.store.dispatch(action);
        if (this.store.getState()._stateID === currentStateID) {
          this.transport.requestSync();
        }
        break;
      }
      case "matchData": {
        const [, matchData] = data.args;
        this.receiveMatchData(matchData);
        break;
      }
      case "chat": {
        const [, chatMessage] = data.args;
        this.receiveChatMessage(chatMessage);
        break;
      }
    }
  }
  notifySubscribers() {
    Object.values(this.subscribers).forEach((fn2) => fn2(this.getState()));
  }
  overrideGameState(state) {
    this.gameStateOverride = state;
    this.notifySubscribers();
  }
  start() {
    this.transport.connect();
    this._running = true;
    this.manager.register(this);
  }
  stop() {
    this.transport.disconnect();
    this._running = false;
    this.manager.unregister(this);
  }
  subscribe(fn2) {
    const id = Object.keys(this.subscribers).length;
    this.subscribers[id] = fn2;
    this.transport.subscribeToConnectionStatus(() => this.notifySubscribers());
    if (this._running || !this.multiplayer) {
      fn2(this.getState());
    }
    return () => {
      delete this.subscribers[id];
    };
  }
  getInitialState() {
    return this.initialState;
  }
  getState() {
    let state = this.store.getState();
    if (this.gameStateOverride !== null) {
      state = this.gameStateOverride;
    }
    if (state === null) {
      return state;
    }
    let isActive = true;
    const isPlayerActive = this.game.flow.isPlayerActive(state.G, state.ctx, this.playerID);
    if (this.multiplayer && !isPlayerActive) {
      isActive = false;
    }
    if (!this.multiplayer && this.playerID !== null && this.playerID !== void 0 && !isPlayerActive) {
      isActive = false;
    }
    if (state.ctx.gameover !== void 0) {
      isActive = false;
    }
    if (!this.multiplayer) {
      state = {
        ...state,
        G: this.game.playerView({
          G: state.G,
          ctx: state.ctx,
          playerID: this.playerID
        }),
        plugins: PlayerView(state, this)
      };
    }
    return {
      ...state,
      log: this.log,
      isActive,
      isConnected: this.transport.isConnected
    };
  }
  createDispatchers() {
    this.moves = createMoveDispatchers(this.game.moveNames, this.store, this.playerID, this.credentials, this.multiplayer);
    this.events = createEventDispatchers(this.game.flow.enabledEventNames, this.store, this.playerID, this.credentials, this.multiplayer);
    this.plugins = createPluginDispatchers(this.game.pluginNames, this.store, this.playerID, this.credentials, this.multiplayer);
  }
  updatePlayerID(playerID) {
    this.playerID = playerID;
    this.createDispatchers();
    this.transport.updatePlayerID(playerID);
    this.notifySubscribers();
  }
  updateMatchID(matchID) {
    this.matchID = matchID;
    this.createDispatchers();
    this.transport.updateMatchID(matchID);
    this.notifySubscribers();
  }
  updateCredentials(credentials) {
    this.credentials = credentials;
    this.createDispatchers();
    this.transport.updateCredentials(credentials);
    this.notifySubscribers();
  }
};
function Client(opts) {
  return new _ClientImpl(opts);
}

// node_modules/boardgame.io/dist/esm/client.js
var import_setimmediate2 = __toESM(require_setImmediate());

// node_modules/boardgame.io/dist/esm/multiplayer.js
var import_lodash3 = __toESM(require_lodash());
var import_rfc69023 = __toESM(require_rfc6902());

// node_modules/engine.io-parser/build/esm/commons.js
var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
var ERROR_PACKET = { type: "error", data: "parser error" };

// node_modules/engine.io-parser/build/esm/encodePacket.browser.js
var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
var withNativeArrayBuffer = typeof ArrayBuffer === "function";
var isView = (obj) => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
var encodePacket = ({ type, data }, supportsBinary, callback) => {
  if (withNativeBlob && data instanceof Blob) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(data, callback);
    }
  } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(new Blob([data]), callback);
    }
  }
  return callback(PACKET_TYPES[type] + (data || ""));
};
var encodeBlobAsBase64 = (data, callback) => {
  const fileReader = new FileReader();
  fileReader.onload = function() {
    const content = fileReader.result.split(",")[1];
    callback("b" + (content || ""));
  };
  return fileReader.readAsDataURL(data);
};
function toArray(data) {
  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
}
var TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
  if (withNativeBlob && packet.data instanceof Blob) {
    return packet.data.arrayBuffer().then(toArray).then(callback);
  } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
    return callback(toArray(packet.data));
  }
  encodePacket(packet, false, (encoded) => {
    if (!TEXT_ENCODER) {
      TEXT_ENCODER = new TextEncoder();
    }
    callback(TEXT_ENCODER.encode(encoded));
  });
}

// node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (let i2 = 0; i2 < chars.length; i2++) {
  lookup[chars.charCodeAt(i2)] = i2;
}
var decode = (base64) => {
  let bufferLength = base64.length * 0.75, len = base64.length, i2, p2 = 0, encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
  for (i2 = 0; i2 < len; i2 += 4) {
    encoded1 = lookup[base64.charCodeAt(i2)];
    encoded2 = lookup[base64.charCodeAt(i2 + 1)];
    encoded3 = lookup[base64.charCodeAt(i2 + 2)];
    encoded4 = lookup[base64.charCodeAt(i2 + 3)];
    bytes[p2++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p2++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p2++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
};

// node_modules/engine.io-parser/build/esm/decodePacket.browser.js
var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
var decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    return {
      type: "message",
      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
    };
  }
  const packetType = PACKET_TYPES_REVERSE[type];
  if (!packetType) {
    return ERROR_PACKET;
  }
  return encodedPacket.length > 1 ? {
    type: PACKET_TYPES_REVERSE[type],
    data: encodedPacket.substring(1)
  } : {
    type: PACKET_TYPES_REVERSE[type]
  };
};
var decodeBase64Packet = (data, binaryType) => {
  if (withNativeArrayBuffer2) {
    const decoded = decode(data);
    return mapBinary(decoded, binaryType);
  } else {
    return { base64: true, data };
  }
};
var mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "blob":
      if (data instanceof Blob) {
        return data;
      } else {
        return new Blob([data]);
      }
    case "arraybuffer":
    default:
      if (data instanceof ArrayBuffer) {
        return data;
      } else {
        return data.buffer;
      }
  }
};

// node_modules/engine.io-parser/build/esm/index.js
var SEPARATOR = String.fromCharCode(30);
var encodePayload = (packets, callback) => {
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;
  packets.forEach((packet, i2) => {
    encodePacket(packet, false, (encodedPacket) => {
      encodedPackets[i2] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};
var decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i2 = 0; i2 < encodedPackets.length; i2++) {
    const decodedPacket = decodePacket(encodedPackets[i2], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};
function createPacketEncoderStream() {
  return new TransformStream({
    transform(packet, controller) {
      encodePacketToBinary(packet, (encodedPacket) => {
        const payloadLength = encodedPacket.length;
        let header;
        if (payloadLength < 126) {
          header = new Uint8Array(1);
          new DataView(header.buffer).setUint8(0, payloadLength);
        } else if (payloadLength < 65536) {
          header = new Uint8Array(3);
          const view = new DataView(header.buffer);
          view.setUint8(0, 126);
          view.setUint16(1, payloadLength);
        } else {
          header = new Uint8Array(9);
          const view = new DataView(header.buffer);
          view.setUint8(0, 127);
          view.setBigUint64(1, BigInt(payloadLength));
        }
        if (packet.data && typeof packet.data !== "string") {
          header[0] |= 128;
        }
        controller.enqueue(header);
        controller.enqueue(encodedPacket);
      });
    }
  });
}
var TEXT_DECODER;
function totalLength(chunks) {
  return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
  if (chunks[0].length === size) {
    return chunks.shift();
  }
  const buffer = new Uint8Array(size);
  let j2 = 0;
  for (let i2 = 0; i2 < size; i2++) {
    buffer[i2] = chunks[0][j2++];
    if (j2 === chunks[0].length) {
      chunks.shift();
      j2 = 0;
    }
  }
  if (chunks.length && j2 < chunks[0].length) {
    chunks[0] = chunks[0].slice(j2);
  }
  return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
  if (!TEXT_DECODER) {
    TEXT_DECODER = new TextDecoder();
  }
  const chunks = [];
  let state = 0;
  let expectedLength = -1;
  let isBinary2 = false;
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
      while (true) {
        if (state === 0) {
          if (totalLength(chunks) < 1) {
            break;
          }
          const header = concatChunks(chunks, 1);
          isBinary2 = (header[0] & 128) === 128;
          expectedLength = header[0] & 127;
          if (expectedLength < 126) {
            state = 3;
          } else if (expectedLength === 126) {
            state = 1;
          } else {
            state = 2;
          }
        } else if (state === 1) {
          if (totalLength(chunks) < 2) {
            break;
          }
          const headerArray = concatChunks(chunks, 2);
          expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
          state = 3;
        } else if (state === 2) {
          if (totalLength(chunks) < 8) {
            break;
          }
          const headerArray = concatChunks(chunks, 8);
          const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
          const n2 = view.getUint32(0);
          if (n2 > Math.pow(2, 53 - 32) - 1) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
          expectedLength = n2 * Math.pow(2, 32) + view.getUint32(4);
          state = 3;
        } else {
          if (totalLength(chunks) < expectedLength) {
            break;
          }
          const data = concatChunks(chunks, expectedLength);
          controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
          state = 0;
        }
        if (expectedLength === 0 || expectedLength > maxPayload) {
          controller.enqueue(ERROR_PACKET);
          break;
        }
      }
    }
  });
}
var protocol = 4;

// node_modules/@socket.io/component-emitter/lib/esm/index.js
function Emitter(obj) {
  if (obj) return mixin(obj);
}
function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}
Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn2) {
  this._callbacks = this._callbacks || {};
  (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn2);
  return this;
};
Emitter.prototype.once = function(event, fn2) {
  function on3() {
    this.off(event, on3);
    fn2.apply(this, arguments);
  }
  on3.fn = fn2;
  this.on(event, on3);
  return this;
};
Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn2) {
  this._callbacks = this._callbacks || {};
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }
  var callbacks = this._callbacks["$" + event];
  if (!callbacks) return this;
  if (1 == arguments.length) {
    delete this._callbacks["$" + event];
    return this;
  }
  var cb;
  for (var i2 = 0; i2 < callbacks.length; i2++) {
    cb = callbacks[i2];
    if (cb === fn2 || cb.fn === fn2) {
      callbacks.splice(i2, 1);
      break;
    }
  }
  if (callbacks.length === 0) {
    delete this._callbacks["$" + event];
  }
  return this;
};
Emitter.prototype.emit = function(event) {
  this._callbacks = this._callbacks || {};
  var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
  for (var i2 = 1; i2 < arguments.length; i2++) {
    args[i2 - 1] = arguments[i2];
  }
  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i2 = 0, len = callbacks.length; i2 < len; ++i2) {
      callbacks[i2].apply(this, args);
    }
  }
  return this;
};
Emitter.prototype.emitReserved = Emitter.prototype.emit;
Emitter.prototype.listeners = function(event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks["$" + event] || [];
};
Emitter.prototype.hasListeners = function(event) {
  return !!this.listeners(event).length;
};

// node_modules/engine.io-client/build/esm/globals.js
var nextTick = (() => {
  const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
  if (isPromiseAvailable) {
    return (cb) => Promise.resolve().then(cb);
  } else {
    return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
  }
})();
var globalThisShim = (() => {
  if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();
var defaultBinaryType = "arraybuffer";
function createCookieJar() {
}

// node_modules/engine.io-client/build/esm/util.js
function pick(obj, ...attr2) {
  return attr2.reduce((acc, k2) => {
    if (obj.hasOwnProperty(k2)) {
      acc[k2] = obj[k2];
    }
    return acc;
  }, {});
}
var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
  if (opts.useNativeTimers) {
    obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
    obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
  } else {
    obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
    obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
  }
}
var BASE64_OVERHEAD = 1.33;
function byteLength(obj) {
  if (typeof obj === "string") {
    return utf8Length(obj);
  }
  return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
  let c2 = 0, length = 0;
  for (let i2 = 0, l2 = str.length; i2 < l2; i2++) {
    c2 = str.charCodeAt(i2);
    if (c2 < 128) {
      length += 1;
    } else if (c2 < 2048) {
      length += 2;
    } else if (c2 < 55296 || c2 >= 57344) {
      length += 3;
    } else {
      i2++;
      length += 4;
    }
  }
  return length;
}
function randomString3() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}

// node_modules/engine.io-client/build/esm/contrib/parseqs.js
function encode(obj) {
  let str = "";
  for (let i2 in obj) {
    if (obj.hasOwnProperty(i2)) {
      if (str.length)
        str += "&";
      str += encodeURIComponent(i2) + "=" + encodeURIComponent(obj[i2]);
    }
  }
  return str;
}
function decode2(qs) {
  let qry = {};
  let pairs = qs.split("&");
  for (let i2 = 0, l2 = pairs.length; i2 < l2; i2++) {
    let pair = pairs[i2].split("=");
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
}

// node_modules/engine.io-client/build/esm/transport.js
var TransportError = class extends Error {
  constructor(reason, description, context) {
    super(reason);
    this.description = description;
    this.context = context;
    this.type = "TransportError";
  }
};
var Transport2 = class extends Emitter {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(opts) {
    super();
    this.writable = false;
    installTimerFunctions(this, opts);
    this.opts = opts;
    this.query = opts.query;
    this.socket = opts.socket;
    this.supportsBinary = !opts.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(reason, description, context) {
    super.emitReserved("error", new TransportError(reason, description, context));
    return this;
  }
  /**
   * Opens the transport.
   */
  open() {
    this.readyState = "opening";
    this.doOpen();
    return this;
  }
  /**
   * Closes the transport.
   */
  close() {
    if (this.readyState === "opening" || this.readyState === "open") {
      this.doClose();
      this.onClose();
    }
    return this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(packets) {
    if (this.readyState === "open") {
      this.write(packets);
    } else {
    }
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open";
    this.writable = true;
    super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(data) {
    const packet = decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(packet) {
    super.emitReserved("packet", packet);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(details) {
    this.readyState = "closed";
    super.emitReserved("close", details);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(onPause) {
  }
  createUri(schema, query = {}) {
    return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
  }
  _hostname() {
    const hostname = this.opts.hostname;
    return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
  }
  _port() {
    if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) {
      return ":" + this.opts.port;
    } else {
      return "";
    }
  }
  _query(query) {
    const encodedQuery = encode(query);
    return encodedQuery.length ? "?" + encodedQuery : "";
  }
};

// node_modules/engine.io-client/build/esm/transports/polling.js
var Polling = class extends Transport2 {
  constructor() {
    super(...arguments);
    this._polling = false;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(onPause) {
    this.readyState = "pausing";
    const pause = () => {
      this.readyState = "paused";
      onPause();
    };
    if (this._polling || !this.writable) {
      let total = 0;
      if (this._polling) {
        total++;
        this.once("pollComplete", function() {
          --total || pause();
        });
      }
      if (!this.writable) {
        total++;
        this.once("drain", function() {
          --total || pause();
        });
      }
    } else {
      pause();
    }
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = true;
    this.doPoll();
    this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(data) {
    const callback = (packet) => {
      if ("opening" === this.readyState && packet.type === "open") {
        this.onOpen();
      }
      if ("close" === packet.type) {
        this.onClose({ description: "transport closed by the server" });
        return false;
      }
      this.onPacket(packet);
    };
    decodePayload(data, this.socket.binaryType).forEach(callback);
    if ("closed" !== this.readyState) {
      this._polling = false;
      this.emitReserved("pollComplete");
      if ("open" === this.readyState) {
        this._poll();
      } else {
      }
    }
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const close = () => {
      this.write([{ type: "close" }]);
    };
    if ("open" === this.readyState) {
      close();
    } else {
      this.once("open", close);
    }
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(packets) {
    this.writable = false;
    encodePayload(packets, (data) => {
      this.doWrite(data, () => {
        this.writable = true;
        this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "https" : "http";
    const query = this.query || {};
    if (false !== this.opts.timestampRequests) {
      query[this.opts.timestampParam] = randomString3();
    }
    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
};

// node_modules/engine.io-client/build/esm/contrib/has-cors.js
var value = false;
try {
  value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
} catch (err) {
}
var hasCORS = value;

// node_modules/engine.io-client/build/esm/transports/polling-xhr.js
function empty2() {
}
var BaseXHR = class extends Polling {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(opts) {
    super(opts);
    if (typeof location !== "undefined") {
      const isSSL = "https:" === location.protocol;
      let port = location.port;
      if (!port) {
        port = isSSL ? "443" : "80";
      }
      this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data - data to send.
   * @param {Function} fn - called upon flush.
   * @private
   */
  doWrite(data, fn2) {
    const req = this.request({
      method: "POST",
      data
    });
    req.on("success", fn2);
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr post error", xhrStatus, context);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const req = this.request();
    req.on("data", this.onData.bind(this));
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr poll error", xhrStatus, context);
    });
    this.pollXhr = req;
  }
};
var Request = class _Request extends Emitter {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(createRequest, uri, opts) {
    super();
    this.createRequest = createRequest;
    installTimerFunctions(this, opts);
    this._opts = opts;
    this._method = opts.method || "GET";
    this._uri = uri;
    this._data = void 0 !== opts.data ? opts.data : null;
    this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var _a;
    const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    opts.xdomain = !!this._opts.xd;
    const xhr = this._xhr = this.createRequest(opts);
    try {
      xhr.open(this._method, this._uri, true);
      try {
        if (this._opts.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (let i2 in this._opts.extraHeaders) {
            if (this._opts.extraHeaders.hasOwnProperty(i2)) {
              xhr.setRequestHeader(i2, this._opts.extraHeaders[i2]);
            }
          }
        }
      } catch (e) {
      }
      if ("POST" === this._method) {
        try {
          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (e) {
        }
      }
      try {
        xhr.setRequestHeader("Accept", "*/*");
      } catch (e) {
      }
      (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
      if ("withCredentials" in xhr) {
        xhr.withCredentials = this._opts.withCredentials;
      }
      if (this._opts.requestTimeout) {
        xhr.timeout = this._opts.requestTimeout;
      }
      xhr.onreadystatechange = () => {
        var _a2;
        if (xhr.readyState === 3) {
          (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
            // @ts-ignore
            xhr.getResponseHeader("set-cookie")
          );
        }
        if (4 !== xhr.readyState)
          return;
        if (200 === xhr.status || 1223 === xhr.status) {
          this._onLoad();
        } else {
          this.setTimeoutFn(() => {
            this._onError(typeof xhr.status === "number" ? xhr.status : 0);
          }, 0);
        }
      };
      xhr.send(this._data);
    } catch (e) {
      this.setTimeoutFn(() => {
        this._onError(e);
      }, 0);
      return;
    }
    if (typeof document !== "undefined") {
      this._index = _Request.requestsCount++;
      _Request.requests[this._index] = this;
    }
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(err) {
    this.emitReserved("error", err, this._xhr);
    this._cleanup(true);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(fromError) {
    if ("undefined" === typeof this._xhr || null === this._xhr) {
      return;
    }
    this._xhr.onreadystatechange = empty2;
    if (fromError) {
      try {
        this._xhr.abort();
      } catch (e) {
      }
    }
    if (typeof document !== "undefined") {
      delete _Request.requests[this._index];
    }
    this._xhr = null;
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const data = this._xhr.responseText;
    if (data !== null) {
      this.emitReserved("data", data);
      this.emitReserved("success");
      this._cleanup();
    }
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
};
Request.requestsCount = 0;
Request.requests = {};
if (typeof document !== "undefined") {
  if (typeof attachEvent === "function") {
    attachEvent("onunload", unloadHandler);
  } else if (typeof addEventListener === "function") {
    const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
    addEventListener(terminationEvent, unloadHandler, false);
  }
}
function unloadHandler() {
  for (let i2 in Request.requests) {
    if (Request.requests.hasOwnProperty(i2)) {
      Request.requests[i2].abort();
    }
  }
}
var hasXHR2 = function() {
  const xhr = newRequest({
    xdomain: false
  });
  return xhr && xhr.responseType !== null;
}();
var XHR = class extends BaseXHR {
  constructor(opts) {
    super(opts);
    const forceBase64 = opts && opts.forceBase64;
    this.supportsBinary = hasXHR2 && !forceBase64;
  }
  request(opts = {}) {
    Object.assign(opts, { xd: this.xd }, this.opts);
    return new Request(newRequest, this.uri(), opts);
  }
};
function newRequest(opts) {
  const xdomain = opts.xdomain;
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {
  }
  if (!xdomain) {
    try {
      return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (e) {
    }
  }
}

// node_modules/engine.io-client/build/esm/transports/websocket.js
var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
var BaseWS = class extends Transport2 {
  get name() {
    return "websocket";
  }
  doOpen() {
    const uri = this.uri();
    const protocols = this.opts.protocols;
    const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    if (this.opts.extraHeaders) {
      opts.headers = this.opts.extraHeaders;
    }
    try {
      this.ws = this.createSocket(uri, protocols, opts);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this.ws.binaryType = this.socket.binaryType;
    this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      if (this.opts.autoUnref) {
        this.ws._socket.unref();
      }
      this.onOpen();
    };
    this.ws.onclose = (closeEvent) => this.onClose({
      description: "websocket connection closed",
      context: closeEvent
    });
    this.ws.onmessage = (ev) => this.onData(ev.data);
    this.ws.onerror = (e) => this.onError("websocket error", e);
  }
  write(packets) {
    this.writable = false;
    for (let i2 = 0; i2 < packets.length; i2++) {
      const packet = packets[i2];
      const lastPacket = i2 === packets.length - 1;
      encodePacket(packet, this.supportsBinary, (data) => {
        try {
          this.doWrite(packet, data);
        } catch (e) {
        }
        if (lastPacket) {
          nextTick(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    if (typeof this.ws !== "undefined") {
      this.ws.onerror = () => {
      };
      this.ws.close();
      this.ws = null;
    }
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "wss" : "ws";
    const query = this.query || {};
    if (this.opts.timestampRequests) {
      query[this.opts.timestampParam] = randomString3();
    }
    if (!this.supportsBinary) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
};
var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
var WS = class extends BaseWS {
  createSocket(uri, protocols, opts) {
    return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
  }
  doWrite(_packet, data) {
    this.ws.send(data);
  }
};

// node_modules/engine.io-client/build/esm/transports/webtransport.js
var WT = class extends Transport2 {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((err) => {
      this.onError("webtransport error", err);
    });
    this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((stream) => {
        const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
        const reader = stream.readable.pipeThrough(decoderStream).getReader();
        const encoderStream = createPacketEncoderStream();
        encoderStream.readable.pipeTo(stream.writable);
        this._writer = encoderStream.writable.getWriter();
        const read = () => {
          reader.read().then(({ done, value: value2 }) => {
            if (done) {
              return;
            }
            this.onPacket(value2);
            read();
          }).catch((err) => {
          });
        };
        read();
        const packet = { type: "open" };
        if (this.query.sid) {
          packet.data = `{"sid":"${this.query.sid}"}`;
        }
        this._writer.write(packet).then(() => this.onOpen());
      });
    });
  }
  write(packets) {
    this.writable = false;
    for (let i2 = 0; i2 < packets.length; i2++) {
      const packet = packets[i2];
      const lastPacket = i2 === packets.length - 1;
      this._writer.write(packet).then(() => {
        if (lastPacket) {
          nextTick(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    var _a;
    (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
  }
};

// node_modules/engine.io-client/build/esm/transports/index.js
var transports = {
  websocket: WS,
  webtransport: WT,
  polling: XHR
};

// node_modules/engine.io-client/build/esm/contrib/parseuri.js
var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var parts = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function parse2(str) {
  if (str.length > 8e3) {
    throw "URI too long";
  }
  const src = str, b2 = str.indexOf("["), e = str.indexOf("]");
  if (b2 != -1 && e != -1) {
    str = str.substring(0, b2) + str.substring(b2, e).replace(/:/g, ";") + str.substring(e, str.length);
  }
  let m = re.exec(str || ""), uri = {}, i2 = 14;
  while (i2--) {
    uri[parts[i2]] = m[i2] || "";
  }
  if (b2 != -1 && e != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
    uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
    uri.ipv6uri = true;
  }
  uri.pathNames = pathNames(uri, uri["path"]);
  uri.queryKey = queryKey(uri, uri["query"]);
  return uri;
}
function pathNames(obj, path) {
  const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
  if (path.slice(0, 1) == "/" || path.length === 0) {
    names.splice(0, 1);
  }
  if (path.slice(-1) == "/") {
    names.splice(names.length - 1, 1);
  }
  return names;
}
function queryKey(uri, query) {
  const data = {};
  query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
    if ($1) {
      data[$1] = $2;
    }
  });
  return data;
}

// node_modules/engine.io-client/build/esm/socket.js
var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
var OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) {
  addEventListener("offline", () => {
    OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
  }, false);
}
var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(uri, opts) {
    super();
    this.binaryType = defaultBinaryType;
    this.writeBuffer = [];
    this._prevBufferLen = 0;
    this._pingInterval = -1;
    this._pingTimeout = -1;
    this._maxPayload = -1;
    this._pingTimeoutTime = Infinity;
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = null;
    }
    if (uri) {
      const parsedUri = parse2(uri);
      opts.hostname = parsedUri.host;
      opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
      opts.port = parsedUri.port;
      if (parsedUri.query)
        opts.query = parsedUri.query;
    } else if (opts.host) {
      opts.hostname = parse2(opts.host).host;
    }
    installTimerFunctions(this, opts);
    this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
    if (opts.hostname && !opts.port) {
      opts.port = this.secure ? "443" : "80";
    }
    this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
    this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
    this.transports = [];
    this._transportsByName = {};
    opts.transports.forEach((t2) => {
      const transportName = t2.prototype.name;
      this.transports.push(transportName);
      this._transportsByName[transportName] = t2;
    });
    this.opts = Object.assign({
      path: "/engine.io",
      agent: false,
      withCredentials: false,
      upgrade: true,
      timestampParam: "t",
      rememberUpgrade: false,
      addTrailingSlash: true,
      rejectUnauthorized: true,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: false
    }, opts);
    this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
    if (typeof this.opts.query === "string") {
      this.opts.query = decode2(this.opts.query);
    }
    if (withEventListeners) {
      if (this.opts.closeOnBeforeunload) {
        this._beforeunloadEventListener = () => {
          if (this.transport) {
            this.transport.removeAllListeners();
            this.transport.close();
          }
        };
        addEventListener("beforeunload", this._beforeunloadEventListener, false);
      }
      if (this.hostname !== "localhost") {
        this._offlineEventListener = () => {
          this._onClose("transport close", {
            description: "network connection lost"
          });
        };
        OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
      }
    }
    if (this.opts.withCredentials) {
      this._cookieJar = createCookieJar();
    }
    this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(name) {
    const query = Object.assign({}, this.opts.query);
    query.EIO = protocol;
    query.transport = name;
    if (this.id)
      query.sid = this.id;
    const opts = Object.assign({}, this.opts, {
      query,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[name]);
    return new this._transportsByName[name](opts);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const transport = this.createTransport(transportName);
    transport.open();
    this.setTransport(transport);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(transport) {
    if (this.transport) {
      this.transport.removeAllListeners();
    }
    this.transport = transport;
    transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open";
    _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
    this.emitReserved("open");
    this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(packet) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      this.emitReserved("packet", packet);
      this.emitReserved("heartbeat");
      switch (packet.type) {
        case "open":
          this.onHandshake(JSON.parse(packet.data));
          break;
        case "ping":
          this._sendPacket("pong");
          this.emitReserved("ping");
          this.emitReserved("pong");
          this._resetPingTimeout();
          break;
        case "error":
          const err = new Error("server error");
          err.code = packet.data;
          this._onError(err);
          break;
        case "message":
          this.emitReserved("data", packet.data);
          this.emitReserved("message", packet.data);
          break;
      }
    } else {
    }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(data) {
    this.emitReserved("handshake", data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this._pingInterval = data.pingInterval;
    this._pingTimeout = data.pingTimeout;
    this._maxPayload = data.maxPayload;
    this.onOpen();
    if ("closed" === this.readyState)
      return;
    this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const delay = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + delay;
    this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, delay);
    if (this.opts.autoUnref) {
      this._pingTimeoutTimer.unref();
    }
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen);
    this._prevBufferLen = 0;
    if (0 === this.writeBuffer.length) {
      this.emitReserved("drain");
    } else {
      this.flush();
    }
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const packets = this._getWritablePackets();
      this.transport.send(packets);
      this._prevBufferLen = packets.length;
      this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
    if (!shouldCheckPayloadSize) {
      return this.writeBuffer;
    }
    let payloadSize = 1;
    for (let i2 = 0; i2 < this.writeBuffer.length; i2++) {
      const data = this.writeBuffer[i2].data;
      if (data) {
        payloadSize += byteLength(data);
      }
      if (i2 > 0 && payloadSize > this._maxPayload) {
        return this.writeBuffer.slice(0, i2);
      }
      payloadSize += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return true;
    const hasExpired = Date.now() > this._pingTimeoutTime;
    if (hasExpired) {
      this._pingTimeoutTime = 0;
      nextTick(() => {
        this._onClose("ping timeout");
      }, this.setTimeoutFn);
    }
    return hasExpired;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(msg, options, fn2) {
    this._sendPacket("message", msg, options, fn2);
    return this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(msg, options, fn2) {
    this._sendPacket("message", msg, options, fn2);
    return this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type - packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(type, data, options, fn2) {
    if ("function" === typeof data) {
      fn2 = data;
      data = void 0;
    }
    if ("function" === typeof options) {
      fn2 = options;
      options = null;
    }
    if ("closing" === this.readyState || "closed" === this.readyState) {
      return;
    }
    options = options || {};
    options.compress = false !== options.compress;
    const packet = {
      type,
      data,
      options
    };
    this.emitReserved("packetCreate", packet);
    this.writeBuffer.push(packet);
    if (fn2)
      this.once("flush", fn2);
    this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const close = () => {
      this._onClose("forced close");
      this.transport.close();
    };
    const cleanupAndClose = () => {
      this.off("upgrade", cleanupAndClose);
      this.off("upgradeError", cleanupAndClose);
      close();
    };
    const waitForUpgrade = () => {
      this.once("upgrade", cleanupAndClose);
      this.once("upgradeError", cleanupAndClose);
    };
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.readyState = "closing";
      if (this.writeBuffer.length) {
        this.once("drain", () => {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }
    return this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(err) {
    _SocketWithoutUpgrade.priorWebsocketSuccess = false;
    if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
      this.transports.shift();
      return this._open();
    }
    this.emitReserved("error", err);
    this._onClose("transport error", err);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(reason, description) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      this.transport.removeAllListeners("close");
      this.transport.close();
      this.transport.removeAllListeners();
      if (withEventListeners) {
        if (this._beforeunloadEventListener) {
          removeEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this._offlineEventListener) {
          const i2 = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
          if (i2 !== -1) {
            OFFLINE_EVENT_LISTENERS.splice(i2, 1);
          }
        }
      }
      this.readyState = "closed";
      this.id = null;
      this.emitReserved("close", reason, description);
      this.writeBuffer = [];
      this._prevBufferLen = 0;
    }
  }
};
SocketWithoutUpgrade.protocol = protocol;
var SocketWithUpgrade = class extends SocketWithoutUpgrade {
  constructor() {
    super(...arguments);
    this._upgrades = [];
  }
  onOpen() {
    super.onOpen();
    if ("open" === this.readyState && this.opts.upgrade) {
      for (let i2 = 0; i2 < this._upgrades.length; i2++) {
        this._probe(this._upgrades[i2]);
      }
    }
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(name) {
    let transport = this.createTransport(name);
    let failed = false;
    SocketWithoutUpgrade.priorWebsocketSuccess = false;
    const onTransportOpen = () => {
      if (failed)
        return;
      transport.send([{ type: "ping", data: "probe" }]);
      transport.once("packet", (msg) => {
        if (failed)
          return;
        if ("pong" === msg.type && "probe" === msg.data) {
          this.upgrading = true;
          this.emitReserved("upgrading", transport);
          if (!transport)
            return;
          SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
          this.transport.pause(() => {
            if (failed)
              return;
            if ("closed" === this.readyState)
              return;
            cleanup();
            this.setTransport(transport);
            transport.send([{ type: "upgrade" }]);
            this.emitReserved("upgrade", transport);
            transport = null;
            this.upgrading = false;
            this.flush();
          });
        } else {
          const err = new Error("probe error");
          err.transport = transport.name;
          this.emitReserved("upgradeError", err);
        }
      });
    };
    function freezeTransport() {
      if (failed)
        return;
      failed = true;
      cleanup();
      transport.close();
      transport = null;
    }
    const onerror = (err) => {
      const error2 = new Error("probe error: " + err);
      error2.transport = transport.name;
      freezeTransport();
      this.emitReserved("upgradeError", error2);
    };
    function onTransportClose() {
      onerror("transport closed");
    }
    function onclose() {
      onerror("socket closed");
    }
    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        freezeTransport();
      }
    }
    const cleanup = () => {
      transport.removeListener("open", onTransportOpen);
      transport.removeListener("error", onerror);
      transport.removeListener("close", onTransportClose);
      this.off("close", onclose);
      this.off("upgrading", onupgrade);
    };
    transport.once("open", onTransportOpen);
    transport.once("error", onerror);
    transport.once("close", onTransportClose);
    this.once("close", onclose);
    this.once("upgrading", onupgrade);
    if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
      this.setTimeoutFn(() => {
        if (!failed) {
          transport.open();
        }
      }, 200);
    } else {
      transport.open();
    }
  }
  onHandshake(data) {
    this._upgrades = this._filterUpgrades(data.upgrades);
    super.onHandshake(data);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(upgrades) {
    const filteredUpgrades = [];
    for (let i2 = 0; i2 < upgrades.length; i2++) {
      if (~this.transports.indexOf(upgrades[i2]))
        filteredUpgrades.push(upgrades[i2]);
    }
    return filteredUpgrades;
  }
};
var Socket = class extends SocketWithUpgrade {
  constructor(uri, opts = {}) {
    const isOptionsOnly = typeof uri === "object";
    const o2 = isOptionsOnly ? { ...uri } : { ...opts };
    if (!o2.transports || o2.transports && typeof o2.transports[0] === "string") {
      o2.transports = (o2.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t2) => !!t2);
    }
    super(isOptionsOnly ? o2 : uri, o2);
  }
};

// node_modules/engine.io-client/build/esm/index.js
var protocol2 = Socket.protocol;

// node_modules/socket.io-client/build/esm/url.js
function url(uri, path = "", loc) {
  let obj = uri;
  loc = loc || typeof location !== "undefined" && location;
  if (null == uri)
    uri = loc.protocol + "//" + loc.host;
  if (typeof uri === "string") {
    if ("/" === uri.charAt(0)) {
      if ("/" === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }
    if (!/^(https?|wss?):\/\//.test(uri)) {
      if ("undefined" !== typeof loc) {
        uri = loc.protocol + "//" + uri;
      } else {
        uri = "https://" + uri;
      }
    }
    obj = parse2(uri);
  }
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = "80";
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = "443";
    }
  }
  obj.path = obj.path || "/";
  const ipv6 = obj.host.indexOf(":") !== -1;
  const host = ipv6 ? "[" + obj.host + "]" : obj.host;
  obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
  obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
  return obj;
}

// node_modules/socket.io-parser/build/esm/index.js
var esm_exports = {};
__export(esm_exports, {
  Decoder: () => Decoder,
  Encoder: () => Encoder,
  PacketType: () => PacketType,
  isPacketValid: () => isPacketValid,
  protocol: () => protocol3
});

// node_modules/socket.io-parser/build/esm/is-binary.js
var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
var isView2 = (obj) => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
var toString = Object.prototype.toString;
var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
function isBinary(obj) {
  return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
}
function hasBinary(obj, toJSON) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i2 = 0, l2 = obj.length; i2 < l2; i2++) {
      if (hasBinary(obj[i2])) {
        return true;
      }
    }
    return false;
  }
  if (isBinary(obj)) {
    return true;
  }
  if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }
  return false;
}

// node_modules/socket.io-parser/build/esm/binary.js
function deconstructPacket(packet) {
  const buffers = [];
  const packetData = packet.data;
  const pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length;
  return { packet: pack, buffers };
}
function _deconstructPacket(data, buffers, toJSON) {
  if (!data)
    return data;
  if (isBinary(data)) {
    const placeholder = { _placeholder: true, num: buffers.length };
    buffers.push(data);
    return placeholder;
  } else if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i2 = 0; i2 < data.length; i2++) {
      newData[i2] = _deconstructPacket(data[i2], buffers);
    }
    return newData;
  } else if (typeof data === "object" && !(data instanceof Date)) {
    if (data.toJSON && typeof data.toJSON === "function" && !toJSON) {
      return _deconstructPacket(data.toJSON(), buffers, true);
    }
    const newData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
    }
    return newData;
  }
  return data;
}
function reconstructPacket(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  delete packet.attachments;
  return packet;
}
function _reconstructPacket(data, buffers) {
  if (!data)
    return data;
  if (data && data._placeholder === true) {
    const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
    if (isIndexValid) {
      return buffers[data.num];
    } else {
      throw new Error("illegal attachments");
    }
  } else if (Array.isArray(data)) {
    for (let i2 = 0; i2 < data.length; i2++) {
      data[i2] = _reconstructPacket(data[i2], buffers);
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }
  }
  return data;
}

// node_modules/socket.io-parser/build/esm/index.js
var RESERVED_EVENTS = [
  "connect",
  // used on the client side
  "connect_error",
  // used on the client side
  "disconnect",
  // used on both sides
  "disconnecting",
  // used on the server side
  "newListener",
  // used by the Node.js EventEmitter
  "removeListener"
  // used by the Node.js EventEmitter
];
var protocol3 = 5;
var PacketType;
(function(PacketType2) {
  PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
  PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
  PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
  PacketType2[PacketType2["ACK"] = 3] = "ACK";
  PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
  PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
  PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
var Encoder = class {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(replacer) {
    this.replacer = replacer;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(obj) {
    if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
      if (hasBinary(obj)) {
        return this.encodeAsBinary({
          type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
          nsp: obj.nsp,
          data: obj.data,
          id: obj.id
        });
      }
    }
    return [this.encodeAsString(obj)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(obj) {
    let str = "" + obj.type;
    if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
      str += obj.attachments + "-";
    }
    if (obj.nsp && "/" !== obj.nsp) {
      str += obj.nsp + ",";
    }
    if (null != obj.id) {
      str += obj.id;
    }
    if (null != obj.data) {
      str += JSON.stringify(obj.data, this.replacer);
    }
    return str;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(obj) {
    const deconstruction = deconstructPacket(obj);
    const pack = this.encodeAsString(deconstruction.packet);
    const buffers = deconstruction.buffers;
    buffers.unshift(pack);
    return buffers;
  }
};
var Decoder = class _Decoder extends Emitter {
  /**
   * Decoder constructor
   */
  constructor(opts) {
    super();
    this.opts = Object.assign({
      reviver: void 0,
      maxAttachments: 10
    }, typeof opts === "function" ? { reviver: opts } : opts);
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(obj) {
    let packet;
    if (typeof obj === "string") {
      if (this.reconstructor) {
        throw new Error("got plaintext data when reconstructing a packet");
      }
      packet = this.decodeString(obj);
      const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
      if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
        packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
        this.reconstructor = new BinaryReconstructor(packet);
      } else {
        super.emitReserved("decoded", packet);
      }
    } else if (isBinary(obj) || obj.base64) {
      if (!this.reconstructor) {
        throw new Error("got binary data when not reconstructing a packet");
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) {
          this.reconstructor = null;
          super.emitReserved("decoded", packet);
        }
      }
    } else {
      throw new Error("Unknown type: " + obj);
    }
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(str) {
    let i2 = 0;
    const p2 = {
      type: Number(str.charAt(0))
    };
    if (PacketType[p2.type] === void 0) {
      throw new Error("unknown packet type " + p2.type);
    }
    if (p2.type === PacketType.BINARY_EVENT || p2.type === PacketType.BINARY_ACK) {
      const start = i2 + 1;
      while (str.charAt(++i2) !== "-" && i2 != str.length) {
      }
      const buf = str.substring(start, i2);
      if (buf != Number(buf) || str.charAt(i2) !== "-") {
        throw new Error("Illegal attachments");
      }
      const n2 = Number(buf);
      if (!isInteger(n2) || n2 < 1) {
        throw new Error("Illegal attachments");
      } else if (n2 > this.opts.maxAttachments) {
        throw new Error("too many attachments");
      }
      p2.attachments = n2;
    }
    if ("/" === str.charAt(i2 + 1)) {
      const start = i2 + 1;
      while (++i2) {
        const c2 = str.charAt(i2);
        if ("," === c2)
          break;
        if (i2 === str.length)
          break;
      }
      p2.nsp = str.substring(start, i2);
    } else {
      p2.nsp = "/";
    }
    const next = str.charAt(i2 + 1);
    if ("" !== next && Number(next) == next) {
      const start = i2 + 1;
      while (++i2) {
        const c2 = str.charAt(i2);
        if (null == c2 || Number(c2) != c2) {
          --i2;
          break;
        }
        if (i2 === str.length)
          break;
      }
      p2.id = Number(str.substring(start, i2 + 1));
    }
    if (str.charAt(++i2)) {
      const payload = this.tryParse(str.substr(i2));
      if (_Decoder.isPayloadValid(p2.type, payload)) {
        p2.data = payload;
      } else {
        throw new Error("invalid payload");
      }
    }
    return p2;
  }
  tryParse(str) {
    try {
      return JSON.parse(str, this.opts.reviver);
    } catch (e) {
      return false;
    }
  }
  static isPayloadValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return isObject(payload);
      case PacketType.DISCONNECT:
        return payload === void 0;
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        return Array.isArray(payload);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
      this.reconstructor = null;
    }
  }
};
var BinaryReconstructor = class {
  constructor(packet) {
    this.packet = packet;
    this.buffers = [];
    this.reconPack = packet;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(binData) {
    this.buffers.push(binData);
    if (this.buffers.length === this.reconPack.attachments) {
      const packet = reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null;
    this.buffers = [];
  }
};
function isNamespaceValid(nsp) {
  return typeof nsp === "string";
}
var isInteger = Number.isInteger || function(value2) {
  return typeof value2 === "number" && isFinite(value2) && Math.floor(value2) === value2;
};
function isAckIdValid(id) {
  return id === void 0 || isInteger(id);
}
function isObject(value2) {
  return Object.prototype.toString.call(value2) === "[object Object]";
}
function isDataValid(type, payload) {
  switch (type) {
    case PacketType.CONNECT:
      return payload === void 0 || isObject(payload);
    case PacketType.DISCONNECT:
      return payload === void 0;
    case PacketType.EVENT:
      return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
    case PacketType.ACK:
      return Array.isArray(payload);
    case PacketType.CONNECT_ERROR:
      return typeof payload === "string" || isObject(payload);
    default:
      return false;
  }
}
function isPacketValid(packet) {
  return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
}

// node_modules/socket.io-client/build/esm/on.js
function on2(obj, ev, fn2) {
  obj.on(ev, fn2);
  return function subDestroy() {
    obj.off(ev, fn2);
  };
}

// node_modules/socket.io-client/build/esm/socket.js
var RESERVED_EVENTS2 = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
var Socket2 = class extends Emitter {
  /**
   * `Socket` constructor.
   */
  constructor(io2, nsp, opts) {
    super();
    this.connected = false;
    this.recovered = false;
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this._queue = [];
    this._queueSeq = 0;
    this.ids = 0;
    this.acks = {};
    this.flags = {};
    this.io = io2;
    this.nsp = nsp;
    if (opts && opts.auth) {
      this.auth = opts.auth;
    }
    this._opts = Object.assign({}, opts);
    if (this.io._autoConnect)
      this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const io2 = this.io;
    this.subs = [
      on2(io2, "open", this.onopen.bind(this)),
      on2(io2, "packet", this.onpacket.bind(this)),
      on2(io2, "error", this.onerror.bind(this)),
      on2(io2, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    if (this.connected)
      return this;
    this.subEvents();
    if (!this.io["_reconnecting"])
      this.io.open();
    if ("open" === this.io._readyState)
      this.onopen();
    return this;
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...args) {
    args.unshift("message");
    this.emit.apply(this, args);
    return this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(ev, ...args) {
    var _a, _b, _c;
    if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
      throw new Error('"' + ev.toString() + '" is a reserved event name');
    }
    args.unshift(ev);
    if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
      this._addToQueue(args);
      return this;
    }
    const packet = {
      type: PacketType.EVENT,
      data: args
    };
    packet.options = {};
    packet.options.compress = this.flags.compress !== false;
    if ("function" === typeof args[args.length - 1]) {
      const id = this.ids++;
      const ack = args.pop();
      this._registerAckCallback(id, ack);
      packet.id = id;
    }
    const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
    const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
    const discardPacket = this.flags.volatile && !isTransportWritable;
    if (discardPacket) {
    } else if (isConnected) {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }
    this.flags = {};
    return this;
  }
  /**
   * @private
   */
  _registerAckCallback(id, ack) {
    var _a;
    const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
    if (timeout === void 0) {
      this.acks[id] = ack;
      return;
    }
    const timer = this.io.setTimeoutFn(() => {
      delete this.acks[id];
      for (let i2 = 0; i2 < this.sendBuffer.length; i2++) {
        if (this.sendBuffer[i2].id === id) {
          this.sendBuffer.splice(i2, 1);
        }
      }
      ack.call(this, new Error("operation has timed out"));
    }, timeout);
    const fn2 = (...args) => {
      this.io.clearTimeoutFn(timer);
      ack.apply(this, args);
    };
    fn2.withError = true;
    this.acks[id] = fn2;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(ev, ...args) {
    return new Promise((resolve, reject) => {
      const fn2 = (arg1, arg2) => {
        return arg1 ? reject(arg1) : resolve(arg2);
      };
      fn2.withError = true;
      args.push(fn2);
      this.emit(ev, ...args);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(args) {
    let ack;
    if (typeof args[args.length - 1] === "function") {
      ack = args.pop();
    }
    const packet = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: false,
      args,
      flags: Object.assign({ fromQueue: true }, this.flags)
    };
    args.push((err, ...responseArgs) => {
      if (packet !== this._queue[0]) {
      }
      const hasError = err !== null;
      if (hasError) {
        if (packet.tryCount > this._opts.retries) {
          this._queue.shift();
          if (ack) {
            ack(err);
          }
        }
      } else {
        this._queue.shift();
        if (ack) {
          ack(null, ...responseArgs);
        }
      }
      packet.pending = false;
      return this._drainQueue();
    });
    this._queue.push(packet);
    this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(force = false) {
    if (!this.connected || this._queue.length === 0) {
      return;
    }
    const packet = this._queue[0];
    if (packet.pending && !force) {
      return;
    }
    packet.pending = true;
    packet.tryCount++;
    this.flags = packet.flags;
    this.emit.apply(this, packet.args);
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(packet) {
    packet.nsp = this.nsp;
    this.io._packet(packet);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    if (typeof this.auth == "function") {
      this.auth((data) => {
        this._sendConnectPacket(data);
      });
    } else {
      this._sendConnectPacket(this.auth);
    }
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(data) {
    this.packet({
      type: PacketType.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(err) {
    if (!this.connected) {
      this.emitReserved("connect_error", err);
    }
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(reason, description) {
    this.connected = false;
    delete this.id;
    this.emitReserved("disconnect", reason, description);
    this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((id) => {
      const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
      if (!isBuffered) {
        const ack = this.acks[id];
        delete this.acks[id];
        if (ack.withError) {
          ack.call(this, new Error("socket has been disconnected"));
        }
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(packet) {
    const sameNamespace = packet.nsp === this.nsp;
    if (!sameNamespace)
      return;
    switch (packet.type) {
      case PacketType.CONNECT:
        if (packet.data && packet.data.sid) {
          this.onconnect(packet.data.sid, packet.data.pid);
        } else {
          this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
        }
        break;
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        this.onevent(packet);
        break;
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        this.onack(packet);
        break;
      case PacketType.DISCONNECT:
        this.ondisconnect();
        break;
      case PacketType.CONNECT_ERROR:
        this.destroy();
        const err = new Error(packet.data.message);
        err.data = packet.data.data;
        this.emitReserved("connect_error", err);
        break;
    }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(packet) {
    const args = packet.data || [];
    if (null != packet.id) {
      args.push(this.ack(packet.id));
    }
    if (this.connected) {
      this.emitEvent(args);
    } else {
      this.receiveBuffer.push(Object.freeze(args));
    }
  }
  emitEvent(args) {
    if (this._anyListeners && this._anyListeners.length) {
      const listeners2 = this._anyListeners.slice();
      for (const listener of listeners2) {
        listener.apply(this, args);
      }
    }
    super.emit.apply(this, args);
    if (this._pid && args.length && typeof args[args.length - 1] === "string") {
      this._lastOffset = args[args.length - 1];
    }
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(id) {
    const self2 = this;
    let sent = false;
    return function(...args) {
      if (sent)
        return;
      sent = true;
      self2.packet({
        type: PacketType.ACK,
        id,
        data: args
      });
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(packet) {
    const ack = this.acks[packet.id];
    if (typeof ack !== "function") {
      return;
    }
    delete this.acks[packet.id];
    if (ack.withError) {
      packet.data.unshift(null);
    }
    ack.apply(this, packet.data);
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(id, pid) {
    this.id = id;
    this.recovered = pid && this._pid === pid;
    this._pid = pid;
    this.connected = true;
    this.emitBuffered();
    this._drainQueue(true);
    this.emitReserved("connect");
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((args) => this.emitEvent(args));
    this.receiveBuffer = [];
    this.sendBuffer.forEach((packet) => {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    });
    this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy();
    this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    if (this.subs) {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs = void 0;
    }
    this.io["_destroy"](this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    if (this.connected) {
      this.packet({ type: PacketType.DISCONNECT });
    }
    this.destroy();
    if (this.connected) {
      this.onclose("io client disconnect");
    }
    return this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(compress) {
    this.flags.compress = compress;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    this.flags.volatile = true;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(timeout) {
    this.flags.timeout = timeout;
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(listener) {
    if (!this._anyListeners) {
      return this;
    }
    if (listener) {
      const listeners2 = this._anyListeners;
      for (let i2 = 0; i2 < listeners2.length; i2++) {
        if (listener === listeners2[i2]) {
          listeners2.splice(i2, 1);
          return this;
        }
      }
    } else {
      this._anyListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(listener) {
    if (!this._anyOutgoingListeners) {
      return this;
    }
    if (listener) {
      const listeners2 = this._anyOutgoingListeners;
      for (let i2 = 0; i2 < listeners2.length; i2++) {
        if (listener === listeners2[i2]) {
          listeners2.splice(i2, 1);
          return this;
        }
      }
    } else {
      this._anyOutgoingListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(packet) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const listeners2 = this._anyOutgoingListeners.slice();
      for (const listener of listeners2) {
        listener.apply(this, packet.data);
      }
    }
  }
};

// node_modules/socket.io-client/build/esm/contrib/backo2.js
function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 1e4;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
Backoff.prototype.duration = function() {
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand = Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};
Backoff.prototype.reset = function() {
  this.attempts = 0;
};
Backoff.prototype.setMin = function(min) {
  this.ms = min;
};
Backoff.prototype.setMax = function(max) {
  this.max = max;
};
Backoff.prototype.setJitter = function(jitter) {
  this.jitter = jitter;
};

// node_modules/socket.io-client/build/esm/manager.js
var Manager = class extends Emitter {
  constructor(uri, opts) {
    var _a;
    super();
    this.nsps = {};
    this.subs = [];
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    opts.path = opts.path || "/socket.io";
    this.opts = opts;
    installTimerFunctions(this, opts);
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1e3);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
    this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
    this.backoff = new Backoff({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
    this._readyState = "closed";
    this.uri = uri;
    const _parser = opts.parser || esm_exports;
    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this._autoConnect = opts.autoConnect !== false;
    if (this._autoConnect)
      this.open();
  }
  reconnection(v2) {
    if (!arguments.length)
      return this._reconnection;
    this._reconnection = !!v2;
    if (!v2) {
      this.skipReconnect = true;
    }
    return this;
  }
  reconnectionAttempts(v2) {
    if (v2 === void 0)
      return this._reconnectionAttempts;
    this._reconnectionAttempts = v2;
    return this;
  }
  reconnectionDelay(v2) {
    var _a;
    if (v2 === void 0)
      return this._reconnectionDelay;
    this._reconnectionDelay = v2;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v2);
    return this;
  }
  randomizationFactor(v2) {
    var _a;
    if (v2 === void 0)
      return this._randomizationFactor;
    this._randomizationFactor = v2;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v2);
    return this;
  }
  reconnectionDelayMax(v2) {
    var _a;
    if (v2 === void 0)
      return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v2;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v2);
    return this;
  }
  timeout(v2) {
    if (!arguments.length)
      return this._timeout;
    this._timeout = v2;
    return this;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
      this.reconnect();
    }
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(fn2) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new Socket(this.uri, this.opts);
    const socket = this.engine;
    const self2 = this;
    this._readyState = "opening";
    this.skipReconnect = false;
    const openSubDestroy = on2(socket, "open", function() {
      self2.onopen();
      fn2 && fn2();
    });
    const onError = (err) => {
      this.cleanup();
      this._readyState = "closed";
      this.emitReserved("error", err);
      if (fn2) {
        fn2(err);
      } else {
        this.maybeReconnectOnOpen();
      }
    };
    const errorSub = on2(socket, "error", onError);
    if (false !== this._timeout) {
      const timeout = this._timeout;
      const timer = this.setTimeoutFn(() => {
        openSubDestroy();
        onError(new Error("timeout"));
        socket.close();
      }, timeout);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
    this.subs.push(openSubDestroy);
    this.subs.push(errorSub);
    return this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(fn2) {
    return this.open(fn2);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup();
    this._readyState = "open";
    this.emitReserved("open");
    const socket = this.engine;
    this.subs.push(
      on2(socket, "ping", this.onping.bind(this)),
      on2(socket, "data", this.ondata.bind(this)),
      on2(socket, "error", this.onerror.bind(this)),
      on2(socket, "close", this.onclose.bind(this)),
      // @ts-ignore
      on2(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(data) {
    try {
      this.decoder.add(data);
    } catch (e) {
      this.onclose("parse error", e);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(packet) {
    nextTick(() => {
      this.emitReserved("packet", packet);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(err) {
    this.emitReserved("error", err);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(nsp, opts) {
    let socket = this.nsps[nsp];
    if (!socket) {
      socket = new Socket2(this, nsp, opts);
      this.nsps[nsp] = socket;
    } else if (this._autoConnect && !socket.active) {
      socket.connect();
    }
    return socket;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(socket) {
    const nsps = Object.keys(this.nsps);
    for (const nsp of nsps) {
      const socket2 = this.nsps[nsp];
      if (socket2.active) {
        return;
      }
    }
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(packet) {
    const encodedPackets = this.encoder.encode(packet);
    for (let i2 = 0; i2 < encodedPackets.length; i2++) {
      this.engine.write(encodedPackets[i2], packet.options);
    }
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((subDestroy) => subDestroy());
    this.subs.length = 0;
    this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = true;
    this._reconnecting = false;
    this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(reason, description) {
    var _a;
    this.cleanup();
    (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
    this.backoff.reset();
    this._readyState = "closed";
    this.emitReserved("close", reason, description);
    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const self2 = this;
    if (this.backoff.attempts >= this._reconnectionAttempts) {
      this.backoff.reset();
      this.emitReserved("reconnect_failed");
      this._reconnecting = false;
    } else {
      const delay = this.backoff.duration();
      this._reconnecting = true;
      const timer = this.setTimeoutFn(() => {
        if (self2.skipReconnect)
          return;
        this.emitReserved("reconnect_attempt", self2.backoff.attempts);
        if (self2.skipReconnect)
          return;
        self2.open((err) => {
          if (err) {
            self2._reconnecting = false;
            self2.reconnect();
            this.emitReserved("reconnect_error", err);
          } else {
            self2.onreconnect();
          }
        });
      }, delay);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const attempt = this.backoff.attempts;
    this._reconnecting = false;
    this.backoff.reset();
    this.emitReserved("reconnect", attempt);
  }
};

// node_modules/socket.io-client/build/esm/index.js
var cache = {};
function lookup2(uri, opts) {
  if (typeof uri === "object") {
    opts = uri;
    uri = void 0;
  }
  opts = opts || {};
  const parsed = url(uri, opts.path || "/socket.io");
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = cache[id] && path in cache[id]["nsps"];
  const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
  let io2;
  if (newConnection) {
    io2 = new Manager(source, opts);
  } else {
    if (!cache[id]) {
      cache[id] = new Manager(source, opts);
    }
    io2 = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io2.socket(parsed.path, opts);
}
Object.assign(lookup2, {
  Manager,
  Socket: Socket2,
  io: lookup2,
  connect: lookup2
});

// node_modules/boardgame.io/dist/esm/socketio-a82b84e4.js
var io = lookup2;
var SocketIOTransport = class extends Transport {
  /**
   * Creates a new Multiplayer instance.
   * @param {object} socket - Override for unit tests.
   * @param {object} socketOpts - Options to pass to socket.io.
   * @param {object} store - Redux store
   * @param {string} matchID - The game ID to connect to.
   * @param {string} playerID - The player ID associated with this client.
   * @param {string} credentials - Authentication credentials
   * @param {string} gameName - The game type (the `name` field in `Game`).
   * @param {string} numPlayers - The number of players.
   * @param {string} server - The game server in the form of 'hostname:port'. Defaults to the server serving the client if not provided.
   */
  constructor({ socket, socketOpts, server, ...opts }) {
    super(opts);
    this.server = server;
    this.socket = socket;
    this.socketOpts = socketOpts;
  }
  sendAction(state, action) {
    const args = [
      action,
      state._stateID,
      this.matchID,
      this.playerID
    ];
    this.socket.emit("update", ...args);
  }
  sendChatMessage(matchID, chatMessage) {
    const args = [
      matchID,
      chatMessage,
      this.credentials
    ];
    this.socket.emit("chat", ...args);
  }
  connect() {
    if (!this.socket) {
      if (this.server) {
        let server = this.server;
        if (server.search(/^https?:\/\//) == -1) {
          server = "http://" + this.server;
        }
        if (server.slice(-1) != "/") {
          server = server + "/";
        }
        this.socket = io(server + this.gameName, this.socketOpts);
      } else {
        this.socket = io("/" + this.gameName, this.socketOpts);
      }
    }
    this.socket.on("patch", (matchID, prevStateID, stateID, patch2, deltalog) => {
      this.notifyClient({
        type: "patch",
        args: [matchID, prevStateID, stateID, patch2, deltalog]
      });
    });
    this.socket.on("update", (matchID, state, deltalog) => {
      this.notifyClient({
        type: "update",
        args: [matchID, state, deltalog]
      });
    });
    this.socket.on("sync", (matchID, syncInfo) => {
      this.notifyClient({ type: "sync", args: [matchID, syncInfo] });
    });
    this.socket.on("matchData", (matchID, matchData) => {
      this.notifyClient({ type: "matchData", args: [matchID, matchData] });
    });
    this.socket.on("chat", (matchID, chatMessage) => {
      this.notifyClient({ type: "chat", args: [matchID, chatMessage] });
    });
    this.socket.on("connect", () => {
      this.requestSync();
      this.setConnectionStatus(true);
    });
    this.socket.on("disconnect", () => {
      this.setConnectionStatus(false);
    });
  }
  disconnect() {
    this.socket.close();
    this.socket = null;
    this.setConnectionStatus(false);
  }
  requestSync() {
    if (this.socket) {
      const args = [
        this.matchID,
        this.playerID,
        this.credentials,
        this.numPlayers
      ];
      this.socket.emit("sync", ...args);
    }
  }
  updateMatchID(id) {
    this.matchID = id;
    this.requestSync();
  }
  updatePlayerID(id) {
    this.playerID = id;
    this.requestSync();
  }
  updateCredentials(credentials) {
    this.credentials = credentials;
    this.requestSync();
  }
};
function SocketIO({ server, socketOpts } = {}) {
  return (transportOpts) => new SocketIOTransport({
    server,
    socketOpts,
    ...transportOpts
  });
}

// node_modules/boardgame.io/dist/esm/core.js
var import_lodash4 = __toESM(require_lodash());

// src/lib/deck.js
var JOKER_A = 13;
var JOKER_B = 14;
var isJoker = (c2) => c2 >= 13;
function makeDeck() {
  const d2 = [];
  for (let n2 = 1; n2 <= 12; n2++) for (let i2 = 0; i2 < n2; i2++) d2.push(n2);
  d2.push(JOKER_A, JOKER_B);
  return d2;
}
function takeFrom(hand, num, count) {
  const h2 = hand.slice();
  const used = [];
  for (let i2 = 0; i2 < count; i2++) {
    const at = h2.indexOf(num);
    if (at >= 0) {
      used.push(h2.splice(at, 1)[0]);
      continue;
    }
    const j2 = h2.findIndex(isJoker);
    if (j2 < 0) return null;
    used.push(h2.splice(j2, 1)[0]);
  }
  return { hand: h2, used };
}
function legalMove(hand, num, count, cur) {
  if (!Number.isInteger(num) || !Number.isInteger(count)) return false;
  if (num < 1 || num > 13 || count < 1) return false;
  if (cur) {
    if (count !== cur.count) return false;
    if (num >= cur.num) return false;
  }
  const plain = hand.filter((c2) => c2 === num).length;
  const jok = hand.filter(isJoker).length;
  if (num === 13) {
    return jok >= count;
  }
  return plain + jok >= count;
}

// src/lib/game.js
var JOKER_ALONE = 13;
var alive = (G2) => G2.counts.map((c2, i2) => c2 > 0 ? i2 : -1).filter((i2) => i2 >= 0);
var active2 = (G2) => G2.counts.map((c2, i2) => c2 > 0 && !G2.passed[i2] ? i2 : -1).filter((i2) => i2 >= 0);
var seatOrder = (G2) => G2.seatOrder && G2.seatOrder.length ? G2.seatOrder : G2.counts.map((_2, i2) => i2);
function nextBy(G2, from, ok) {
  const o2 = seatOrder(G2), n2 = o2.length;
  const at = o2.indexOf(from);
  for (let k2 = 1; k2 <= n2; k2++) {
    const i2 = o2[(at + k2 + n2) % n2];
    if (ok(i2)) return i2;
  }
  return -1;
}
var nextActive = (G2, from) => nextBy(G2, from, (i2) => G2.counts[i2] > 0 && !G2.passed[i2]);
var nextAlive = (G2, from) => nextBy(G2, from, (i2) => G2.counts[i2] > 0);
function clearPile(G2, leader) {
  G2.pile = null;
  if ((G2.table || []).length) G2.shown = G2.table.map((t2) => ({
    by: t2.by,
    num: t2.num,
    count: t2.count,
    cards: (t2.cards || []).slice()
  }));
  G2.table = [];
  G2.passed = G2.passed.map(() => false);
  G2.next = leader;
  G2.trickNo = (G2.trickNo || 0) + 1;
}
function noteMove(G2, kind, seat) {
  G2.moveNo = (G2.moveNo || 0) + 1;
  G2.lastMove = { k: kind, by: seat };
}
function noteFinish(G2, seat) {
  if (G2.counts[seat] === 0 && !G2.finished.includes(seat)) G2.finished.push(seat);
}
var roundDone = (G2) => alive(G2).length <= 1;
var winnersCount = (n2) => Math.floor(n2 / 2);
var roundPoints = (rank, n2) => rank < winnersCount(n2) ? 100 - rank * 10 : 0;
var worst = (c2) => isJoker(c2) ? 99 : c2;
function finalOrder(G2) {
  const order = G2.finished.slice();
  for (let i2 = 0; i2 < G2.counts.length; i2++) if (!order.includes(i2)) order.push(i2);
  return order;
}
function dealRound(G2, random) {
  const n2 = G2.counts.length;
  const deck = random.Shuffle(makeDeck());
  const hands = Array.from({ length: n2 }, () => []);
  deck.forEach((c2, i2) => hands[i2 % n2].push(c2));
  hands.forEach((h2) => h2.sort((a2, b2) => a2 - b2));
  G2.hands = hands;
  G2.counts = hands.map((h2) => h2.length);
  G2.pile = null;
  G2.table = [];
  G2.shown = [];
  G2.passed = hands.map(() => false);
  G2.finished = [];
}
function findRevolution(G2, order) {
  const seat = G2.hands.findIndex((h2) => h2.filter(isJoker).length === 2);
  if (seat < 0) return { on: false, seat: -1, great: false };
  return { on: true, seat, great: order[order.length - 1] === seat };
}
function taxPair(G2, hiSeat, loSeat, howMany, chosen) {
  const hi = G2.hands[hiSeat], lo = G2.hands[loSeat];
  lo.sort((a2, b2) => worst(a2) - worst(b2));
  const fromLo = lo.splice(0, howMany);
  let fromHi = [];
  if (Array.isArray(chosen) && chosen.length === howMany) {
    for (const c2 of chosen) {
      const at = hi.indexOf(c2);
      if (at >= 0) fromHi.push(hi.splice(at, 1)[0]);
    }
  }
  while (fromHi.length < howMany) {
    hi.sort((a2, b2) => worst(b2) - worst(a2));
    fromHi.push(hi.shift());
  }
  hi.push(...fromLo);
  lo.push(...fromHi);
  hi.sort((a2, b2) => a2 - b2);
  lo.sort((a2, b2) => a2 - b2);
  G2.counts[hiSeat] = hi.length;
  G2.counts[loSeat] = lo.length;
}
function applyTax(G2, chosen) {
  const order = G2.taxOrder;
  const n2 = order.length;
  if (n2 >= 4) {
    taxPair(G2, order[0], order[n2 - 1], 2, chosen && chosen[order[0]]);
    taxPair(G2, order[1], order[n2 - 2], 1, chosen && chosen[order[1]]);
  }
}
function openNextRound(G2, random) {
  const order = finalOrder(G2);
  const n2 = G2.counts.length;
  G2.lastRound = {
    order: order.slice(),
    /* 판이 끝난 순간의 손패 장수. 바로 다음 판을 나누므로 이걸 안 남기면
       마지막까지 남은 꼴등의 손패가 갑자기 새 판 장수로 바뀐다 */
    counts: G2.counts.slice(),
    table: ((G2.table || []).length ? G2.table : G2.shown || []).map((t2) => ({ by: t2.by, num: t2.num, count: t2.count, cards: (t2.cards || []).slice() })),
    points: order.map((seat, rank) => roundPoints(rank, n2)),
    roundNo: G2.roundNo
  };
  order.forEach((seat, rank) => {
    G2.score[seat] += roundPoints(rank, n2);
  });
  G2.lastOrder = order;
  G2.roundNo += 1;
  if (G2.roundNo > G2.totalRounds) {
    G2.gameOver = true;
    return;
  }
  dealRound(G2, random);
  const rev = findRevolution(G2, order);
  G2.revolution = rev.on ? { seat: rev.seat, great: rev.great } : null;
  G2.revDeclared = false;
  G2.revDecided = !rev.on;
  G2.taxCancelled = false;
  G2.taxOrder = order;
  G2.seatOrder = order.slice();
  const taxOn = Boolean(G2.opts.tax) && n2 >= 4;
  G2.needTax = taxOn || rev.on;
  G2.taxOn = taxOn;
  G2.next = order[0];
  G2.given = {};
}
function pickDistinct(random, n2) {
  const all = [];
  for (let v2 = 1; v2 <= 12; v2++) all.push(v2);
  return random.Shuffle(all).slice(0, n2);
}
function drawOrder(d2, n2) {
  const seats = Array.from({ length: n2 }, (_2, i2) => i2);
  return seats.sort((a2, b2) => {
    const va = d2.pool[d2.took[a2]], vb = d2.pool[d2.took[b2]];
    if (va !== vb) return va - vb;
    return d2.seq.indexOf(a2) - d2.seq.indexOf(b2);
  });
}
var ZooPresident = {
  name: "zoo-president",
  setup: ({ ctx, random }, setupData) => {
    const n2 = ctx.numPlayers;
    const opts = Object.assign({ rounds: 3, tax: true, clear2: false }, setupData || {});
    const G2 = {
      hands: [],
      counts: new Array(n2).fill(0),
      passed: new Array(n2).fill(false),
      pile: null,
      table: [],
      finished: [],
      next: 0,
      trickNo: 0,
      moveNo: 0,
      lastMove: null,
      score: new Array(n2).fill(0),
      roundNo: 1,
      totalRounds: Math.max(3, opts.rounds),
      opts,
      lastOrder: null,
      taxOrder: null,
      seatOrder: null,
      revolution: null,
      revDeclared: false,
      revDecided: true,
      taxCancelled: false,
      taxOn: false,
      lastRound: null,
      shown: [],
      needTax: false,
      given: {},
      gameOver: false
    };
    dealRound(G2, random);
    G2.seatOrder = null;
    G2.next = 0;
    G2.draw = {
      pool: pickDistinct(random, n2),
      /* 자리마다 한 장씩, 서로 다른 숫자 */
      by: new Array(n2).fill(null),
      /* 카드 자리 → 가져간 사람 */
      took: new Array(n2).fill(null),
      /* 사람 → 가져간 카드 자리 */
      seq: []
      /* 고른 차례. 같은 숫자면 먼저 고른 쪽이 위 */
    };
    return G2;
  },
  /* 남의 손패는 장수만 보인다 */
  playerView: ({ G: G2, playerID }) => {
    const out = Object.assign({}, G2);
    out.hands = G2.hands.map((h2, i2) => String(i2) === String(playerID) ? h2.slice() : null);
    if (G2.draw) {
      out.draw = Object.assign({}, G2.draw, {
        pool: G2.draw.pool.map((v2, i2) => G2.draw.by[i2] == null ? null : v2)
      });
    }
    return out;
  },
  phases: {
    /* 첫 순서 정하기. 모두가 동시에 참여하므로 activePlayers 로 열어 둔다.
       한 장씩만 가져갈 수 있고, 남이 가져간 자리는 못 가져간다 */
    draw: {
      start: true,
      turn: {
        activePlayers: { all: "picking" },
        stages: {
          picking: {
            moves: {
              takeCard: ({ G: G2, playerID }, idx) => {
                const seat = Number(playerID);
                const d2 = G2.draw;
                if (!d2) return INVALID_MOVE;
                if (d2.took[seat] != null) return INVALID_MOVE;
                if (!(idx >= 0 && idx < d2.pool.length)) return INVALID_MOVE;
                if (d2.by[idx] != null) return INVALID_MOVE;
                d2.by[idx] = seat;
                d2.took[seat] = idx;
                d2.seq.push(seat);
              }
            }
          }
        }
      },
      endIf: ({ G: G2, ctx }) => G2.draw && G2.draw.took.every((x2, i2) => x2 != null || i2 >= ctx.numPlayers),
      onEnd: ({ G: G2, ctx }) => {
        const order = drawOrder(G2.draw, ctx.numPlayers);
        G2.seatOrder = order.slice();
        G2.next = order[0];
      },
      next: "play"
    },
    play: {
      turn: {
        /* 한 사람이 한 번 두면 차례가 넘어간다. 다음 사람은 G.next 가 정한다 */
        minMoves: 1,
        maxMoves: 1,
        order: {
          first: ({ G: G2 }) => G2.next,
          next: ({ G: G2 }) => G2.next
        }
      },
      endIf: ({ G: G2 }) => roundDone(G2),
      onEnd: ({ G: G2, random }) => {
        openNextRound(G2, random);
      },
      next: ({ G: G2 }) => G2.needTax ? "tax" : "play",
      moves: {
        play: ({ G: G2, playerID }, num, count) => {
          const seat = Number(playerID);
          const hand = G2.hands[seat];
          if (!legalMove(hand, num, count, G2.pile)) return INVALID_MOVE;
          const t2 = takeFrom(hand, num, count);
          if (!t2) return INVALID_MOVE;
          G2.hands[seat] = t2.hand;
          G2.counts[seat] = t2.hand.length;
          G2.pile = { by: seat, num, count };
          G2.table.push({ by: seat, num, count, cards: t2.used.slice().sort((a2, b2) => a2 - b2) });
          noteMove(G2, "play", seat);
          noteFinish(G2, seat);
          const cleared = num === 1 || G2.opts.clear2 && num === 2;
          const out = G2.counts[seat] === 0;
          if (out) {
            clearPile(G2, nextAlive(G2, seat));
            if (G2.next < 0) G2.next = seat;
            return;
          }
          if (cleared) {
            clearPile(G2, seat);
            return;
          }
          const still = active2(G2);
          if (still.length <= 1) {
            clearPile(G2, seat);
            return;
          }
          const nx = nextActive(G2, seat);
          G2.next = nx >= 0 ? nx : seat;
        },
        pass: ({ G: G2, playerID }) => {
          const seat = Number(playerID);
          if (!G2.pile) return INVALID_MOVE;
          G2.passed[seat] = true;
          noteMove(G2, "pass", seat);
          const still = active2(G2);
          if (still.length <= 1) {
            const last = G2.pile.by;
            clearPile(G2, G2.counts[last] > 0 ? last : nextAlive(G2, last));
            return;
          }
          const nx = nextActive(G2, seat);
          G2.next = nx >= 0 ? nx : seat;
        }
      }
    },
    tax: {
      turn: {
        activePlayers: { all: "giving" },
        stages: {
          giving: {
            moves: {
              /* 혁명 선언 — 카멜레온 두 장을 쥔 사람만.
                 선언하면 이번 판 세금이 사라지고, 대혁명이면 등수가 통째로 뒤집힌다 */
              declare: ({ G: G2, playerID }) => {
                const seat = Number(playerID);
                if (!G2.revolution || G2.revDecided) return INVALID_MOVE;
                if (G2.revolution.seat !== seat) return INVALID_MOVE;
                G2.revDeclared = true;
                G2.revDecided = true;
                G2.taxCancelled = true;
                if (G2.revolution.great) {
                  G2.taxOrder = G2.taxOrder.slice().reverse();
                  G2.seatOrder = G2.taxOrder.slice();
                }
                G2.next = G2.taxOrder[0];
              },
              /* 쥐고도 안 부른다 — 세금은 그대로 걷는다 */
              passRev: ({ G: G2, playerID }) => {
                const seat = Number(playerID);
                if (!G2.revolution || G2.revDecided) return INVALID_MOVE;
                if (G2.revolution.seat !== seat) return INVALID_MOVE;
                G2.revDecided = true;
              },
              give: ({ G: G2, playerID }, cards) => {
                const seat = Number(playerID);
                if (!G2.revDecided || G2.taxCancelled || !G2.taxOn) return INVALID_MOVE;
                const o2 = G2.taxOrder;
                const need = seat === o2[0] ? 2 : seat === o2[1] ? 1 : 0;
                if (!need) return INVALID_MOVE;
                if (!Array.isArray(cards) || cards.length !== need) return INVALID_MOVE;
                const hand = G2.hands[seat];
                const tmp = hand.slice();
                for (const c2 of cards) {
                  const at = tmp.indexOf(c2);
                  if (at < 0) return INVALID_MOVE;
                  tmp.splice(at, 1);
                }
                G2.given[seat] = cards.slice();
              }
            }
          }
        }
      },
      /* 혁명을 정했고, 세금까지 끝나야 넘어간다 */
      endIf: ({ G: G2 }) => {
        if (!G2.revDecided) return false;
        if (G2.taxCancelled || !G2.taxOn) return true;
        const o2 = G2.taxOrder;
        return G2.given[o2[0]] !== void 0 && G2.given[o2[1]] !== void 0;
      },
      onEnd: ({ G: G2 }) => {
        if (!G2.taxCancelled && G2.taxOn) applyTax(G2, G2.given);
        G2.needTax = false;
        G2.next = G2.taxOrder[0];
      },
      next: "play",
      moves: {}
    }
  },
  endIf: ({ G: G2 }) => G2.gameOver ? { score: G2.score.slice(), order: G2.lastOrder } : void 0,
  /* 봇이 고를 수 있는 수 목록 */
  ai: {
    enumerate: (G2, ctx, playerID) => {
      const seat = Number(playerID);
      if (ctx.phase === "tax") {
        if (G2.revolution && !G2.revDecided) {
          if (G2.revolution.seat === seat) return [{ move: "declare", args: [] }];
          return [];
        }
        if (G2.taxCancelled || !G2.taxOn) return [];
        const o2 = G2.taxOrder;
        const need = seat === o2[0] ? 2 : seat === o2[1] ? 1 : 0;
        if (!need || G2.given[seat] !== void 0) return [];
        const hand2 = (G2.hands[seat] || []).slice().sort((a2, b2) => worst(b2) - worst(a2));
        return [{ move: "give", args: [hand2.slice(0, need)] }];
      }
      const hand = G2.hands[seat] || [];
      const out = [];
      const cnt = {};
      let jok = 0;
      hand.forEach((c2) => {
        if (isJoker(c2)) jok++;
        else cnt[c2] = (cnt[c2] || 0) + 1;
      });
      const maxN = G2.pile ? G2.pile.num - 1 : 12;
      for (let num = 1; num <= maxN; num++) {
        const same = cnt[num] || 0;
        if (!same) continue;
        if (G2.pile) {
          if (same + jok >= G2.pile.count) out.push({ move: "play", args: [num, G2.pile.count] });
        } else {
          for (let c2 = 1; c2 <= same + jok; c2++) out.push({ move: "play", args: [num, c2] });
        }
      }
      if (!G2.pile && jok > 0) out.push({ move: "play", args: [JOKER_ALONE, 1] });
      if (G2.pile) out.push({ move: "pass", args: [] });
      return out;
    }
  }
};

// src/lib/view.js
var orderOf = (G2, n2) => G2 && G2.seatOrder && G2.seatOrder.length === n2 ? G2.seatOrder : Array.from({ length: n2 }, (_2, i2) => i2);
var toScreenIn = (order, seat, me) => {
  const n2 = order.length;
  return ((order.indexOf(seat) - order.indexOf(me)) % n2 + n2) % n2;
};
var toSeatIn = (order, pos, me) => {
  const n2 = order.length;
  return order[((order.indexOf(me) + pos) % n2 + n2) % n2];
};
function screenView(G2, ctx, myID, names) {
  const n2 = G2.counts.length;
  const me = Number(myID);
  const nm = names || new Array(n2).fill("");
  const ord = orderOf(G2, n2);
  const toScreen = (seat, _me, _n) => toScreenIn(ord, seat, me);
  const toSeat = (pos, _me, _n) => toSeatIn(ord, pos, me);
  const seats = new Array(n2);
  for (let seat = 0; seat < n2; seat++) {
    const pos = toScreen(seat, me, n2);
    seats[pos] = {
      /* 엔진 자리 번호. 얼굴 그림은 이 번호로 골라야 사람을 따라간다 —
         화면 위치로 고르면 판이 바뀔 때 얼굴만 그 자리에 남는다 */
      seat,
      name: nm[seat] || "",
      c: G2.counts[seat],
      s: G2.passed[seat] ? "pass" : "",
      out: G2.counts[seat] === 0,
      /* 몇 번째로 끝냈는가. 0부터, 아직이면 -1 */
      rank: (G2.finished || []).indexOf(seat),
      hold: seat === me ? (G2.hands[seat] || []).slice() : null
    };
  }
  const realCards = (t2) => t2.cards && t2.cards.length === t2.count ? t2.cards.slice() : new Array(t2.count).fill(t2.num);
  const table = (G2.table || []).map((t2) => ({
    by: toScreen(t2.by, me, n2),
    num: t2.num,
    count: t2.count,
    cards: realCards(t2)
  }));
  const draw = G2.draw ? {
    /* 아직 아무도 안 집은 카드의 숫자는 화면에 주지 않는다.
       이 기기 방은 판 상태를 그대로 읽으므로 여기서 가려야 한다 —
       안 가리면 낮은 카드가 어디 있는지 다 보인다 */
    pool: G2.draw.pool.map((v2, i2) => G2.draw.by[i2] == null ? null : v2),
    /* 뽑기 화면 자리는 **방에 앉은 순서** 그대로다(나를 아래로 돌려놓기만 한다).
       등수 자리로 바꾸는 것은 뽑기가 끝난 뒤 판에서 한다 —
       여기서 ord 를 쓰면 마지막 사람이 고르는 순간 자리가 통째로 흔들린다 */
    by: G2.draw.by.map((s2) => s2 == null ? null : (s2 - me + n2) % n2),
    mine: G2.draw.took[Number(myID)],
    /* 내가 가져간 카드 자리 */
    left: G2.draw.took.filter((x2) => x2 == null).length
  } : null;
  return {
    N: n2,
    me: 0,
    /* 화면에서 나는 언제나 0 */
    names: seats.map((s2) => s2.name),
    seats,
    hand: (G2.hands[me] || []).slice(),
    turn: ctx.phase === "play" ? toScreen(Number(ctx.currentPlayer), me, n2) : -1,
    myTurn: ctx.phase === "play" && Number(ctx.currentPlayer) === me,
    table,
    pile: G2.pile ? { by: toScreen(G2.pile.by, me, n2), num: G2.pile.num, count: G2.pile.count } : null,
    /* 바닥을 치우기 직전 모습. 1번으로 엎거나 마지막 카드로 완주하면
       올리기와 치우기가 한 수 안에서 끝나므로, 이걸 넘겨야 화면이 보여줄 수 있다 */
    lastTable: (G2.shown || []).map((t2) => ({
      by: toScreen(t2.by, me, n2),
      num: t2.num,
      count: t2.count,
      cards: realCards(t2)
    })),
    finish: (G2.finished || []).map((s2) => toScreen(s2, me, n2)),
    score: G2.counts.map((_2, seat) => G2.score[toSeat(seat, me, n2)]),
    roundNo: G2.roundNo,
    trickNo: G2.trickNo || 0,
    /* 몇 번째 바퀴인가 */
    /* 몇 번째 수인가 + 그 수가 무엇이었나 — 소리 겹침·빠짐을 가리는 데 쓴다 */
    moveNo: G2.moveNo || 0,
    lastMove: G2.lastMove ? { k: G2.lastMove.k, by: toScreen(G2.lastMove.by, me, n2) } : null,
    totalRounds: G2.totalRounds,
    phase: ctx.phase,
    draw,
    revolution: G2.revolution ? {
      seat: toScreen(G2.revolution.seat, me, n2),
      great: G2.revolution.great,
      mine: G2.revolution.seat === me,
      decided: Boolean(G2.revDecided),
      declared: Boolean(G2.revDeclared)
    } : null,
    /* 내가 지금 선언할 수 있는가 */
    canDeclare: Boolean(G2.revolution && !G2.revDecided && G2.revolution.seat === me),
    taxCancelled: Boolean(G2.taxCancelled),
    /* 세금 단계에서 내가 내야 할 장수 (0이면 낼 것 없음) */
    taxGive: (() => {
      if (ctx.phase !== "tax" || !G2.taxOrder) return 0;
      if (!G2.revDecided || G2.taxCancelled || !G2.taxOn) return 0;
      if (G2.given && G2.given[me] !== void 0) return 0;
      if (G2.taxOrder[0] === me) return 2;
      if (G2.taxOrder[1] === me) return 1;
      return 0;
    })(),
    /* 세금 상대 (화면 자리) */
    taxWith: (() => {
      if (ctx.phase !== "tax" || !G2.taxOrder) return -1;
      const o2 = G2.taxOrder, last = o2.length - 1;
      if (o2[0] === me) return toScreen(o2[last], me, n2);
      if (o2[1] === me) return toScreen(o2[last - 1], me, n2);
      if (o2[last] === me) return toScreen(o2[0], me, n2);
      if (o2[last - 1] === me) return toScreen(o2[1], me, n2);
      return -1;
    })(),
    /* 방금 끝난 판의 마지막 장면과 등수 */
    lastRound: G2.lastRound ? {
      roundNo: G2.lastRound.roundNo,
      order: G2.lastRound.order.map((s2) => toScreen(s2, me, n2)),
      /* 화면 자리 순서로 옮긴 '그때의 장수' */
      counts: (() => {
        const c2 = new Array(n2).fill(0);
        (G2.lastRound.counts || []).forEach((v2, seat) => {
          c2[toScreen(seat, me, n2)] = v2;
        });
        return c2;
      })(),
      points: G2.lastRound.points.slice(),
      table: G2.lastRound.table.map((t2) => ({
        by: toScreen(t2.by, me, n2),
        num: t2.num,
        count: t2.count,
        cards: realCards(t2)
      }))
    } : null,
    over: ctx.gameover ? {
      score: G2.counts.map((_2, seat) => ctx.gameover.score[toSeat(seat, me, n2)]),
      order: (ctx.gameover.order || []).map((s2) => toScreen(s2, me, n2))
    } : null
  };
}

// src/lib/engine.js
var engine = {
  mode: null,
  /* "local" | "online" */
  client: null,
  myID: "0",
  names: [],
  bots: [],
  /* 봇이 앉은 자리 (엔진 자리 번호) */
  view: null,
  paused: false,
  /* 결과를 보는 동안 다음 판을 멈춘다 */
  auto: false,
  /* 자동치기 — 내 자리도 봇과 같은 판단으로 둔다 */
  botMs: 3e3
  /* 봇이 생각하는 척하는 시간 */
};
var listeners = [];
var unsub = null;
var botTimer = null;
var gen = 0;
function onView(fn2) {
  listeners.push(fn2);
  if (engine.view) fn2(engine.view);
  return () => {
    listeners = listeners.filter((f2) => f2 !== fn2);
  };
}
function raw() {
  if (!engine.client) return null;
  return engine.mode === "local" ? engine.client.store.getState() : engine.client.getState();
}
function push() {
  const st = raw();
  if (!st) return;
  engine.view = screenView(st.G, st.ctx, engine.myID, engine.names);
  drainEmotes();
  listeners.forEach((f2) => {
    try {
      f2(engine.view);
    } catch (e) {
      console.error(e);
    }
  });
  if (engine.mode === "local") scheduleBot();
}
var emoteSeen = 0;
var emoteFns = [];
function onEmote(fn2) {
  emoteFns.push(fn2);
  return () => {
    const i2 = emoteFns.indexOf(fn2);
    if (i2 >= 0) emoteFns.splice(i2, 1);
  };
}
function fireEmote(seat, k2) {
  const n2 = engine.view && engine.view.N || 0;
  if (!n2) return;
  const pos = toScreenSeat(seat);
  emoteFns.forEach((f2) => {
    try {
      f2({ pos, seat, k: k2 });
    } catch (e) {
      console.error(e);
    }
  });
}
function toScreenSeat(seat) {
  const v2 = engine.view;
  if (!v2 || !v2.seats) return 0;
  const i2 = v2.seats.findIndex((x2) => x2.seat === Number(seat));
  return i2 < 0 ? 0 : i2;
}
function drainEmotes() {
  const c2 = engine.client;
  const list = c2 && c2.chatMessages || [];
  for (; emoteSeen < list.length; emoteSeen++) {
    const m = list[emoteSeen];
    const p2 = m && m.payload;
    if (!p2 || p2.t !== "emote") continue;
    fireEmote(m.sender, p2.k);
  }
}
function sendEmote(k2) {
  const c2 = engine.client;
  if (!c2) return;
  if (engine.mode === "local") {
    fireEmote(Number(engine.myID), k2);
    return;
  }
  c2.sendChatMessage({ t: "emote", k: k2 });
}
function botPick(hand, pile) {
  const cnt = {};
  let jok = 0;
  hand.forEach((c2) => {
    if (isJoker(c2)) jok++;
    else cnt[c2] = (cnt[c2] || 0) + 1;
  });
  const opts = [];
  const maxN = pile ? pile.num - 1 : 12;
  for (let num = 1; num <= maxN; num++) {
    const same = cnt[num] || 0;
    if (!same) continue;
    if (pile) {
      const need = pile.count - same;
      if (need > jok) continue;
      opts.push({ num, count: pile.count, useJok: Math.max(0, need), own: same });
    } else opts.push({ num, count: same, useJok: 0, own: same });
  }
  if (!opts.length) return !pile && jok > 0 ? { num: 13, count: 1 } : null;
  opts.forEach((o2) => {
    let s2 = o2.num * 2;
    s2 -= o2.useJok * 10;
    if (pile && o2.own > o2.count) s2 -= 24;
    o2.s = s2;
  });
  opts.sort((a2, b2) => b2.s - a2.s);
  if (opts.length > 1 && Math.random() < 0.1) return opts[1];
  return opts[0];
}
var worstFirst = (a2, b2) => (isJoker(b2) ? 99 : b2) - (isJoker(a2) ? 99 : a2);
var actsFor = (seat) => engine.bots.includes(seat) || engine.auto && seat === Number(engine.myID);
function scheduleBot() {
  if (botTimer) return;
  const st = raw();
  if (!st || st.ctx.gameover) return;
  const G2 = st.G, ctx = st.ctx;
  if (ctx.phase === "draw") {
    const d2 = G2.draw;
    if (!d2) return;
    const todo = d2.took.map((x2, seat2) => x2 == null && actsFor(seat2) ? seat2 : -1).filter((x2) => x2 >= 0);
    if (!todo.length) return;
    const g3 = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g3 !== gen) return;
      const s2 = raw();
      if (!s2 || s2.ctx.phase !== "draw") {
        push();
        return;
      }
      const d22 = s2.G.draw;
      const seat2 = todo[0];
      if (d22.took[seat2] != null) {
        push();
        return;
      }
      const free = d22.by.map((v2, i2) => v2 == null ? i2 : -1).filter((i2) => i2 >= 0);
      if (!free.length) return;
      engine.client.updatePlayerID(String(seat2));
      engine.client.moves.takeCard(free[Math.floor(Math.random() * free.length)]);
      engine.client.updatePlayerID(engine.myID);
      push();
    }, Math.min(engine.botMs, 800));
    return;
  }
  if (ctx.phase === "tax") {
    const revSeat = G2.revolution && !G2.revDecided ? G2.revolution.seat : -1;
    const revTodo = revSeat >= 0 && actsFor(revSeat);
    const o2 = G2.taxOrder;
    const canGive = G2.revDecided && !G2.taxCancelled && G2.taxOn;
    const todo = canGive ? [o2[0], o2[1]].filter((seat2) => actsFor(seat2) && G2.given[seat2] === void 0) : [];
    if (!revTodo && !todo.length) return;
    const g3 = ++gen;
    botTimer = setTimeout(() => {
      botTimer = null;
      if (g3 !== gen) return;
      const s2 = raw();
      if (!s2 || s2.ctx.phase !== "tax") {
        push();
        return;
      }
      if (revTodo && s2.G.revolution && !s2.G.revDecided) {
        engine.client.updatePlayerID(String(s2.G.revolution.seat));
        engine.client.moves.declare();
      }
      const s3 = raw();
      if (s3 && s3.ctx.phase === "tax" && s3.G.revDecided && !s3.G.taxCancelled && s3.G.taxOn) {
        for (const seat2 of [s3.G.taxOrder[0], s3.G.taxOrder[1]]) {
          if (!actsFor(seat2) || s3.G.given[seat2] !== void 0) continue;
          const hand = (s3.G.hands[seat2] || []).slice().sort(worstFirst);
          const need = seat2 === s3.G.taxOrder[0] ? 2 : 1;
          if (hand.length < need) continue;
          engine.client.updatePlayerID(String(seat2));
          engine.client.moves.give(hand.slice(0, need));
        }
      }
      engine.client.updatePlayerID(engine.myID);
      push();
    }, 700);
    return;
  }
  if (engine.paused && ctx.phase !== "tax") return;
  const seat = Number(ctx.currentPlayer);
  if (!actsFor(seat)) return;
  const g2 = ++gen;
  botTimer = setTimeout(() => {
    botTimer = null;
    if (g2 !== gen) return;
    const s2 = raw();
    if (!s2 || s2.ctx.gameover || s2.ctx.phase !== "play") {
      push();
      return;
    }
    const now2 = Number(s2.ctx.currentPlayer);
    if (!actsFor(now2)) {
      push();
      return;
    }
    const mv = botPick(s2.G.hands[now2] || [], s2.G.pile);
    engine.client.updatePlayerID(String(now2));
    if (mv) engine.client.moves.play(mv.num, mv.count);
    else engine.client.moves.pass();
    engine.client.updatePlayerID(engine.myID);
    push();
  }, engine.botMs);
}
function setAuto(on3) {
  engine.auto = Boolean(on3);
  gen++;
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
  scheduleBot();
}
if (typeof window !== "undefined") window.__eng = engine;
function attach(client) {
  engine.client = client;
  client.start();
  if (unsub) unsub();
  unsub = client.subscribe(() => push());
  push();
}
function startLocal({ numPlayers = 6, opts = {}, names = [], myID = "0", bots = null } = {}) {
  stop2();
  engine.mode = "local";
  engine.myID = String(myID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = bots || Array.from({ length: numPlayers }, (_2, i2) => i2).filter((i2) => i2 !== Number(myID));
  const game = Object.assign({}, ZooPresident, {
    setup: (ctx) => ZooPresident.setup(ctx, opts)
  });
  attach(Client({ game, numPlayers, playerID: engine.myID }));
}
function startOnline({ server, matchID, playerID, credentials, numPlayers, names = [] }) {
  stop2();
  engine.mode = "online";
  engine.myID = String(playerID);
  engine.names = names.length ? names : new Array(numPlayers).fill("");
  engine.bots = [];
  attach(Client({
    game: ZooPresident,
    numPlayers,
    matchID,
    playerID: engine.myID,
    credentials,
    multiplayer: SocketIO({ server }),
    debug: false
    /* boardgame.io 의 개발용 패널을 띄우지 않는다 */
  }));
}
function setPaused(on3) {
  engine.paused = Boolean(on3);
  if (engine.paused) {
    gen++;
    if (botTimer) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    return;
  }
  scheduleBot();
}
function stop2() {
  gen++;
  if (botTimer) {
    clearTimeout(botTimer);
    botTimer = null;
  }
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (engine.client) {
    try {
      engine.client.stop();
    } catch (e) {
    }
  }
  engine.client = null;
  engine.view = null;
  emoteSeen = 0;
}
function takeCard(idx) {
  const c2 = engine.client;
  if (!c2) return;
  c2.updatePlayerID(engine.myID);
  c2.moves.takeCard(idx);
}
function autoDraw() {
  const c2 = engine.client;
  const st = raw();
  if (!c2 || !st || st.ctx.phase !== "draw") return;
  const d2 = st.G.draw;
  if (!d2) return;
  for (let seat = 0; seat < d2.took.length; seat++) {
    const s2 = raw();
    if (!s2 || s2.ctx.phase !== "draw") break;
    if (s2.G.draw.took[seat] != null) continue;
    const free = s2.G.draw.by.map((v2, i2) => v2 == null ? i2 : -1).filter((i2) => i2 >= 0);
    if (!free.length) break;
    c2.updatePlayerID(String(seat));
    c2.moves.takeCard(free[Math.floor(Math.random() * free.length)]);
  }
  c2.updatePlayerID(engine.myID);
  push();
}
function play2(num, count) {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.play(num, count);
  return true;
}
function passTurn() {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.pass();
  return true;
}
function declareRev() {
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.declare();
  push();
}
function passRev() {
  if (!engine.client) return;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.passRev();
  push();
}
function give(cards) {
  if (!engine.client) return false;
  engine.client.updatePlayerID(engine.myID);
  engine.client.moves.give(cards);
  return true;
}

// src/screens/table.js
function mount(root) {
  function avtOf(seat) {
    const g2 = window.GAME || {};
    const a2 = g2.avatars || [];
    return avtFile(Number(a2[seat]) || 0);
  }
  const document2 = scoped(root);
  const ART2 = ART;
  const KO_N = ["\uC0AC\uC790", "\uD638\uB791\uC774", "\uBD88\uACF0", "\uCF54\uB07C\uB9AC", "\uC545\uC5B4", "\uC5EC\uC6B0", "\uAE30\uB9B0", "\uBA67\uB3FC\uC9C0", "\uC6D0\uC22D\uC774", "\uD1A0\uB07C", "\uC0C8", "\uC0DD\uC950"];
  const EN_N = ["LION", "TIGER", "BEAR", "ELEPHANT", "CROCODILE", "FOX", "GIRAFFE", "BOAR", "MONKEY", "RABBIT", "BIRD", "MOUSE"];
  const T = {
    ko: {
      roundN: (n2) => "ROUND " + n2,
      joker: "\uCE74\uBA5C\uB808\uC628",
      myTurn: "\uB0B4 \uCC28\uB840",
      theirTurn: (n2) => n2 + " \uCC28\uB840",
      left: (c2) => "\uB0A8\uC740 <b>" + c2 + "</b>\uC7A5",
      tagTurn: "\uCC28\uB840",
      tagPass: "\uD328\uC2A4",
      tagOut: "\uC644\uC8FC",
      lead: "\uC6D0\uD558\uB294 \uC7A5\uC218\uB85C \uC2DC\uC791\uD558\uC138\uC694",
      top1: "<b>1\uBC88</b>\uC774 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC544\uBB34\uB3C4 \uBC1B\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
      need: (c2, n2) => "<b>" + c2 + "\uC7A5</b>\uC744 <b>" + n2 + "\uBC88 \uC774\uD558</b>\uB85C \uBC1B\uC73C\uC138\uC694",
      emptyPile: "\uBC14\uB2E5\uC774 \uBE44\uC5C8\uC2B5\uB2C8\uB2E4<br>\uC6D0\uD558\uB294 \uCE74\uB4DC\uB97C \uB0B4\uC138\uC694",
      pass: "\uD328\uC2A4",
      pick: "\uB300\uAE30\uC911",
      play: (n2) => n2 + "\uC7A5 \uB0B4\uAE30",
      notTurn: "\uB300\uAE30\uC911",
      mix: "\uAC19\uC740 \uC22B\uC790\uB9CC \uD568\uAED8 \uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4",
      cnt: (n2) => n2 + "\uC7A5\uC744 \uB9DE\uCDB0 \uC8FC\uC138\uC694",
      lower: "\uB354 \uB0AE\uC740 \uC22B\uC790\uB97C \uB0B4\uC138\uC694",
      autoOff: "\uC790\uB3D9 OFF",
      autoOn: "\uC790\uB3D9 ON",
      emoBtn: "\uC774\uBAA8\uD2F0\uCF58",
      autoOnMsg: "\uC790\uB3D9\uCE58\uAE30\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4\n\uCE74\uB4DC\uB97C \uB9CC\uC9C0\uBA74 \uD480\uB9BD\uB2C8\uB2E4",
      autoPass: "\uC2DC\uAC04\uC774 \uB2E4 \uB418\uC5B4 \uC790\uB3D9\uC73C\uB85C \uB118\uACBC\uC2B5\uB2C8\uB2E4",
      left2: (n2) => n2 + "\uCD08",
      cleared: "\uD310\uC744 \uBE44\uC6E0\uC2B5\uB2C8\uB2E4 \xB7 \uB2E4\uC2DC \uC120",
      close: "\uB2E4\uC2DC \uB204\uB974\uBA74 \uC811\uD799\uB2C8\uB2E4"
    },
    en: {
      roundN: (n2) => "ROUND " + n2,
      joker: "CHAMELEON",
      myTurn: "Your turn",
      theirTurn: (n2) => n2 + "'s turn",
      left: (c2) => "<b>" + c2 + "</b> left",
      tagTurn: "turn",
      tagPass: "passed",
      tagOut: "done",
      lead: "Lead with any number of cards",
      top1: "<b>1</b> is out. Nobody can beat it",
      need: (c2, n2) => "Beat with <b>" + c2 + (c2 === 1 ? " card" : " cards") + "</b> of <b>" + n2 + " or lower</b>",
      emptyPile: "The pile is empty<br>Play anything you like",
      pass: "Pass",
      pick: "Waiting",
      play: (n2) => "Play " + n2,
      notTurn: "Waiting",
      mix: "Cards must share one number",
      cnt: (n2) => "Play exactly " + n2,
      lower: "Play a lower number",
      autoOff: "AUTO OFF",
      autoOn: "AUTO ON",
      emoBtn: "EMOJI",
      autoOnMsg: "Auto play on\nTap a card to take over",
      autoPass: "Time up \u2014 passed for you",
      left2: (n2) => n2 + "s",
      cleared: "Pile cleared \xB7 you lead again",
      close: "Tap again to close"
    }
  };
  let lang = window.__lang || "ko";
  const NAMES = KO_N;
  const el = (id) => document2.getElementById(id);
  const isJ = (c2) => c2 >= 13;
  const ALL = ["\uB098", "\uBBFC\uC9C0", "\uC900\uD638", "\uC11C\uC5F0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
  const ALL_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  let SEATS = [];
  let hand = [];
  let finish = [];
  let offView = null, offEmote = null;
  let lastRound = -1, overSent = false, holdPile = null, ghost = [], ghostSig = "";
  let holdingEnd = false;
  let sndTurn = false, sndFin = 0, sndRev = 0;
  const seen = makeSeen();
  let primed = false;
  let passHeld = null, lastTrick = null;
  let pending = null, pendingAt = 0, pendingHand = -1;
  const onScreen = () => {
    const sec = window.document.getElementById("table");
    return Boolean(sec && sec.classList.contains("is-on"));
  };
  function sounds(v2, quiet) {
    const mute = Boolean(quiet) || !onScreen();
    const evs = moveEvents(v2).filter((e) => seen.add(e.key));
    if (evs.length && primed && !mute) {
      const kinds = new Set(evs.map((e) => e.kind));
      evShow("** \uC18C\uB9AC " + evs.map((e) => e.kind + "@" + e.by).join(" "));
      try {
        const d2 = window.__sndDetail = window.__sndDetail || [];
        evs.forEach((e) => d2.push(e.kind + ":" + e.by));
      } catch (e) {
      }
      if (kinds.has("play")) play("card_play");
      if (kinds.has("pass")) play("pass");
    }
    primed = true;
    if (v2.myTurn && !sndTurn && !mute) play("my_turn");
    sndTurn = Boolean(v2.myTurn);
    const fin = (v2.finish || []).length;
    if (fin > sndFin && !mute) {
      const who = v2.finish[fin - 1];
      if (who === 0) play("win");
      if (v2.seats && fin === v2.seats.length - 1 && !v2.finish.includes(0)) play("lose");
    }
    sndFin = fin;
    const rev = v2.revolution && v2.revolution.declared ? 1 : 0;
    if (rev && !sndRev && !mute) play("revolution");
    sndRev = rev;
  }
  function apply(v2) {
    if (!v2) return;
    if (holdingEnd && !v2.over) {
      sounds(v2, true);
      return;
    }
    sounds(v2);
    if (passHeld != null && v2.trickNo !== passHeld) passHeld = null;
    lastTrick = v2.trickNo;
    SEATS = v2.seats.map((x2, i2) => ({
      n: x2.name,
      c: x2.c,
      s: i2 === 0 && passHeld != null ? "pass" : x2.s,
      hold: x2.hold || [],
      av: x2.seat,
      r: x2.rank
    }));
    hand = v2.hand.slice();
    if (SEATS[0]) SEATS[0].hold = hand;
    finish = v2.finish.slice();
    turn = v2.turn;
    busy = !v2.myTurn;
    if (pending) {
      const myC = (v2.seats || [])[0] ? v2.seats[0].c : -1;
      const done = pendingHand >= 0 && myC >= 0 && myC < pendingHand || pendingHand < 0 && !v2.myTurn || Date.now() - pendingAt > 2e3;
      if (done) {
        pending = null;
        pendingHand = -1;
      } else busy = true;
    }
    if (v2.roundNo !== lastRound) {
      const first = lastRound < 0;
      lastRound = v2.roundNo;
      sel = [];
      animated = 0;
      spread = false;
      sndFin = 0;
      sndTurn = false;
      sndRev = 0;
      flew = /* @__PURE__ */ new Set();
      pending = null;
      pendingHand = -1;
      window.__roundNo = v2.roundNo;
      if (!first && !v2.over && v2.lastRound && window.__onRoundEnd) {
        showLastRound(v2);
        return;
      }
    }
    if (v2.table.length === 0 && !v2.over && (v2.lastTable.length || trick.length)) {
      const gsig = v2.lastTable.map((t2) => t2.by + ":" + t2.num + "x" + t2.count).join("|");
      if (gsig !== ghostSig) {
        ghostSig = gsig;
        ghost = (v2.lastTable.length ? v2.lastTable : trick).map((t2) => ({
          by: t2.by,
          num: t2.num,
          count: t2.count,
          cards: t2.cards.slice()
        }));
        animated = Math.min(animated, ghost.length);
        if (holdPile) clearTimeout(holdPile);
        holdPile = setTimeout(() => {
          holdPile = null;
          ghost = [];
          draw();
        }, 2e3);
      }
    } else if (v2.table.length) {
      if (holdPile) {
        clearTimeout(holdPile);
        holdPile = null;
      }
      ghost = [];
      ghostSig = "";
    }
    if (v2.table.length < trick.length) {
      if (!ghost.length) animated = 0;
      spread = false;
    }
    trick = v2.table.map((t2) => ({ by: t2.by, num: t2.num, count: t2.count, cards: t2.cards.slice() }));
    sel = sel.filter((i2) => i2 < hand.length);
    const me = finish.indexOf(0);
    window.__myRankIdx = me >= 0 ? me : null;
    if (v2.over && !overSent) {
      overSent = true;
      window.__gameOver = v2.over;
      window.GAME = window.GAME || {};
      window.GAME.score = v2.over.score.slice();
      window.GAME.finish = v2.over.order.slice();
      window.GAME.names = SEATS.map((x2) => x2.n);
      if (window.__onGameOver) setTimeout(window.__onGameOver, 900);
    }
    if (v2.phase === "tax" && window.__onTax) window.__onTax(v2);
    draw();
    resetTimer();
  }
  function showLastRound(v2) {
    holdingEnd = true;
    const lr = v2.lastRound;
    const lc = lr.counts || [];
    SEATS = v2.seats.map((x2, i2) => ({
      n: x2.name,
      c: lc[i2] != null ? lc[i2] : i2 === lr.order[lr.order.length - 1] ? x2.c : 0,
      s: "",
      hold: [],
      av: x2.seat,
      r: lr.order.indexOf(i2)
    }));
    hand = [];
    finish = lr.order.slice();
    turn = -1;
    busy = true;
    trick = lr.table.map((t2) => ({ by: t2.by, num: t2.num, count: t2.count, cards: t2.cards.slice() }));
    animated = Math.max(0, trick.length - 1);
    spread = false;
    draw();
    if (timerId) clearTimeout(timerId);
    setTimeout(() => {
      holdingEnd = false;
      window.__onRoundEnd && window.__onRoundEnd(v2);
    }, 2e3);
  }
  function handTouched() {
    if (engine.auto) setAuto2(false);
  }
  function boot() {
    if (offView) offView();
    if (offEmote) offEmote();
    if (el("auto")) setAuto2(false);
    setAuto(false);
    if (holdPile) {
      clearTimeout(holdPile);
      holdPile = null;
    }
    ghost = [];
    ghostSig = "";
    holdingEnd = false;
    seen.clear();
    primed = false;
    sndFin = 0;
    sndTurn = false;
    sndRev = 0;
    passHeld = null;
    lastTrick = null;
    lastRound = -1;
    overSent = false;
    trick = [];
    sel = [];
    busy = false;
    animated = 0;
    spread = false;
    emoUntil = 0;
    emoPickOpen(false);
    paintEmoBtn();
    Object.keys(emoNow).forEach((p2) => delete emoNow[p2]);
    if (el("emolayer")) el("emolayer").innerHTML = "";
    offEmote = onEmote((e) => showEmote(e.pos, e.k));
    offView = onView(apply);
    if (engine.view) apply(engine.view);
  }
  window.__bootTable = boot;
  window.__forceEnd = () => {
    const left = SEATS.map((s2, i2) => i2).filter((i2) => !finish.includes(i2));
    left.sort((a2, b2) => SEATS[a2].c - SEATS[b2].c);
    finish = finish.concat(left);
    endRound();
  };
  let sel = [];
  let trick = [];
  let turn = 0;
  let lastPlayer = null;
  let busy = false;
  let animated = 0;
  let flew = /* @__PURE__ */ new Set();
  const keyOf = (t2) => t2 ? t2.by + "-" + t2.num + "-" + t2.count : "";
  function flewKey(t2) {
    const k2 = keyOf(t2);
    if (!k2) return true;
    if (flew.has(k2)) return true;
    flew.add(k2);
    return false;
  }
  let spread = false;
  const cur = () => trick.length ? trick[trick.length - 1] : null;
  const label = (n2) => isJ(n2) ? T[lang].joker : (lang === "ko" ? KO_N : EN_N)[n2 - 1];
  const art = (n2) => n2 === 13 ? ART2.jokerA : n2 === 14 ? ART2.jokerB : ART2[String(n2).padStart(2, "0")];
  function cardHTML(n2, w2, as) {
    if (isJ(n2)) {
      const num = as == null || as >= 13 ? '<span class="card__num as"></span>' : '<span class="card__num as">' + as + "</span>";
      return '<div class="card is-joker" style="--w:' + w2 + 'px"><div class="card__band">' + num + '<span class="card__name">' + T[lang].joker + "</span>" + num + '</div><div class="card__art"><img src="' + art(n2) + '" alt=""></div><div class="card__band">' + num + num + "</div></div>";
    }
    return '<div class="card" style="--w:' + w2 + 'px"><div class="card__band"><span class="card__num">' + n2 + '</span><span class="card__name">' + label(n2) + '</span><span class="card__num">' + n2 + '</span></div><div class="card__art"><img src="' + art(n2) + '" alt=""></div><div class="card__band"><span class="card__num">' + n2 + '</span><span class="card__num">' + n2 + "</span></div></div>";
  }
  const OV = { iw: 860, ih: 1859, cx: 0.4994, cy: 0.4415, rx: 0.425, ry: 0.142 };
  function placeTable(sec, cyPct) {
    const b2 = sec.getBoundingClientRect();
    const W2 = b2.width, H2 = b2.height;
    const scale = Math.max(W2 / OV.iw, H2 / OV.ih);
    const dw = OV.iw * scale, dh = OV.ih * scale;
    const cy = cyPct == null ? (H2 - dh) / 2 + OV.cy * dh : cyPct / 100 * H2;
    const ox = W2 / 2 - OV.cx * dw;
    const oy = cy - OV.cy * dh;
    sec.style.backgroundSize = Math.round(dw) + "px " + Math.round(dh) + "px";
    sec.style.backgroundPosition = Math.round(ox) + "px " + Math.round(oy) + "px";
    return {
      cx: (ox + OV.cx * dw) / W2 * 100,
      cy: cy / H2 * 100,
      rx: OV.rx * dw / W2 * 100,
      ry: OV.ry * dh / H2 * 100
    };
  }
  let RING = { cx: 49, cy: 43, rx: 42.5, ry: 14.5 };
  function syncRing() {
    const sec = window.document.getElementById("table");
    if (!sec) return;
    RING = placeTable(sec, null);
    const p2 = el("pile");
    if (p2) {
      p2.style.left = RING.cx + "%";
      p2.style.top = RING.cy + "%";
    }
    const ph = el("ring") && el("ring").querySelector(".pile__hint");
    if (ph) {
      ph.style.left = RING.cx + "%";
      ph.style.top = RING.cy + "%";
    }
  }
  function seatPos(i2) {
    const a2 = Math.PI / 2 + i2 * 2 * Math.PI / SEATS.length;
    const s2 = Math.sin(a2);
    const bias = 0;
    const side = Math.abs(s2) < 0.05;
    const top = s2 < -0.85;
    const nudge = top ? 22 : s2 > 0.9 ? 9 : side ? 4 : s2 > 0.25 ? 2 : 0;
    const nudgeX = side ? Math.cos(a2) < 0 ? 2 : -2 : 0;
    return {
      x: RING.cx + Math.cos(a2) * -RING.rx,
      y: RING.cy + s2 * RING.ry + bias,
      nudge,
      nudgeX
    };
  }
  function maxCount(n2) {
    const j2 = hand.filter(isJ).length;
    return isJ(n2) ? j2 : hand.filter((x2) => x2 === n2).length + j2;
  }
  function isDead(n2) {
    const c2 = cur();
    if (!c2) return false;
    if (isJ(n2)) return !KO_N.some((_2, i2) => i2 + 1 < c2.num && maxCount(i2 + 1) >= c2.count);
    return !(n2 < c2.num && maxCount(n2) >= c2.count);
  }
  function canPick(i2) {
    if (sel.includes(i2)) return true;
    const card = hand[i2];
    if (isDead(card)) return false;
    const c2 = cur();
    if (c2 && sel.length >= c2.count) return false;
    const next = sel.map((k2) => hand[k2]).concat([card]);
    if (effective(next) === null) return false;
    if (c2 && next.every(isJ) && next.length >= c2.count) return false;
    return true;
  }
  function effective(l2) {
    const r2 = l2.filter((x2) => !isJ(x2));
    if (!r2.length) return 13;
    return r2.every((x2) => x2 === r2[0]) ? r2[0] : null;
  }
  function legal(l2) {
    if (!l2.length) return false;
    const e = effective(l2);
    if (e === null) return false;
    const c2 = cur();
    if (!c2) return true;
    return l2.length === c2.count && e < c2.num;
  }
  function fanHTML(c2) {
    if (!c2) return '<div class="fan"></div>';
    const shown = Math.min(c2, 7), step = 5;
    const w2 = 13 + (shown - 1) * step;
    let s2 = '<div class="fan" style="width:' + w2 + 'px">';
    for (let i2 = 0; i2 < shown; i2++)
      s2 += '<i style="left:' + i2 * step + "px;z-index:" + i2 + '"></i>';
    return s2 + "</div>";
  }
  function anchorSeats(box, limitBottom) {
    const root2 = window.document.documentElement;
    const W2 = (window.document.getElementById("stage") || root2).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach((s2) => {
      const av = s2.querySelector(".seat__av");
      if (!av) return;
      const nudge = +(s2.dataset.nudge || 0), nx = +(s2.dataset.nudgex || 0);
      const dy = av.offsetTop + av.offsetHeight / 2 + nudge;
      s2.style.transform = "translate(calc(-50% + " + nx + "px)," + -dy + "px)";
      const r2 = s2.getBoundingClientRect();
      let ox = nx, oy = 0;
      if (r2.left < W2.left + 1) ox = nx + (W2.left + 1 - r2.left);
      else if (r2.right > W2.right - 1) ox = nx + (W2.right - 1 - r2.right);
      if (limitBottom && r2.bottom > limitBottom) oy = limitBottom - r2.bottom;
      if (ox !== nx || oy) s2.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  function rankTag(r2) {
    const k2 = r2 + 1;
    if (lang === "ko") return k2 + "\uB4F1";
    const t2 = k2 % 10, h2 = k2 % 100;
    const sfx = t2 === 1 && h2 !== 11 ? "st" : t2 === 2 && h2 !== 12 ? "nd" : t2 === 3 && h2 !== 13 ? "rd" : "th";
    return k2 + sfx;
  }
  function renderSeats() {
    syncRing();
    const box = el("seats");
    box.innerHTML = "";
    SEATS.forEach((s2, i2) => {
      const p2 = seatPos(i2);
      const d2 = document2.createElement("div");
      d2.className = "seat" + (i2 === 0 ? " seat--me" : "") + (turn === i2 && SEATS[i2].c > 0 ? " seat--turn" : "") + /* 봇 차례에도 표시 */
      (s2.s === "pass" ? " seat--pass" : "") + (s2.c === 0 ? " seat--out" : "");
      d2.style.left = p2.x.toFixed(1) + "%";
      d2.style.top = p2.y.toFixed(1) + "%";
      d2.dataset.nudge = p2.nudge || 0;
      d2.dataset.nudgex = p2.nudgeX || 0;
      const big = SEATS.length <= 6;
      d2.style.setProperty("--av", "44px");
      d2.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      d2.style.zIndex = 6 + Math.round(p2.y);
      const tg = T[lang];
      const tag = s2.c === 0 ? s2.r >= 0 ? rankTag(s2.r) : tg.tagOut : s2.s === "pass" ? tg.tagPass : "";
      const topSeat = i2 !== 0 && p2.y < 22;
      if (topSeat) d2.classList.add("seat--above");
      const av = '<span class="seat__avwrap"><span class="seat__av" style="background-image:url(' + RINGS.avatar + "),url(" + avtOf(s2.av == null ? i2 : s2.av) + ')"></span>' + (tag ? '<span class="seat__tag">' + tag + "</span>" : "") + "</span>";
      const nm = '<span class="seat__n">' + (s2.n || "") + "</span>";
      const fan = i2 === 0 ? "" : fanHTML(s2.c);
      const cnt = '<span class="seat__c">' + T[lang].left(s2.c) + "</span>";
      d2.innerHTML = topSeat ? fan + cnt + av + nm : av + nm + fan + cnt;
      box.appendChild(d2);
    });
    const nd = el("need");
    anchorSeats(box, nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  const outerTrick = () => trick;
  function renderPile() {
    const p2 = el("pile");
    p2.innerHTML = "";
    const shown = outerTrick().length ? outerTrick() : ghost;
    const trick2 = shown;
    if (spread && trick2.length) {
      const t2 = T[lang];
      const maxC = Math.min(6, Math.max(...trick2.map((x2) => x2.count)));
      const cw = Math.max(18, Math.min(32, Math.floor((196 - (maxC - 1) * 3) / maxC)));
      p2.innerHTML = '<div class="spread">' + trick2.slice().reverse().map((x2, idx) => '<div class="srow' + (idx === 0 ? " srow--new" : "") + '"><span class="srow__w">' + (SEATS[x2.by] && SEATS[x2.by].n || "") + '</span><span class="srow__c">' + (x2.cards || Array.from({ length: x2.count }, () => x2.num)).slice(0, 6).map((cc) => cardHTML(cc, cw, isJ(cc) ? x2.num : null)).join("") + (x2.count > 6 ? '<span class="srow__p">+' + (x2.count - 6) + "</span>" : "") + "</span></div>").join("") + '<div class="spread__t">' + t2.close + "</div></div>";
      return;
    }
    if (!trick2.length) {
      p2.innerHTML = '<div class="pile__hint">' + T[lang].emptyPile + "</div>";
      animated = 0;
      return;
    }
    const rect = el("ring").getBoundingClientRect();
    trick2.slice(-4).forEach((t2, kk) => {
      const k2 = trick2.length - Math.min(trick2.length, 4) + kk;
      const from = seatPos(t2.by);
      const g2 = document2.createElement("div");
      g2.className = "play" + (k2 < trick2.length - 1 ? " play--old" : "") + (flewKey(trick2[k2]) ? "" : " play--new");
      if (!flewKey(trick2[k2])) evShow("** \uB0A0\uC544\uC624\uB294 \uC5F0\uCD9C " + k2);
      const d2 = trick2.length - 1 - k2;
      g2.style.setProperty("--r", d2 === 0 ? "0deg" : k2 * 37 % 19 - 9 - d2 * 3 + "deg");
      g2.style.setProperty("--dy", -Math.min(d2, 3) * 6 + "px");
      g2.style.setProperty("--sc", (1 - Math.min(d2, 3) * 0.05).toFixed(3));
      g2.style.setProperty("--fx", ((from.x - 50) / 100 * rect.width).toFixed(0) + "px");
      g2.style.setProperty("--fy", ((from.y - 50) / 100 * rect.height).toFixed(0) + "px");
      g2.style.zIndex = k2;
      const cw = Math.max(18, Math.min(44, Math.floor((rect.width * 0.44 - (t2.count - 1) * 4) / t2.count)));
      g2.innerHTML = (t2.cards || Array.from({ length: t2.count }, () => t2.num)).map((cc) => cardHTML(cc, cw, isJ(cc) ? t2.num : null)).join("");
      p2.appendChild(g2);
    });
    animated = trick2.length;
  }
  function renderHand() {
    const h2 = el("hand");
    h2.innerHTML = "";
    const w2 = 60, n2 = hand.length;
    const step = n2 > 1 ? Math.min(36, (h2.clientWidth - w2) / (n2 - 1)) : 0;
    const total = w2 + step * (n2 - 1);
    hand.forEach((c2, i2) => {
      const s2 = document2.createElement("div");
      s2.className = "slot" + (sel.includes(i2) ? " slot--sel" : "") + (turn === 0 && !busy && !canPick(i2) ? " slot--dead" : "");
      s2.style.left = (h2.clientWidth - total) / 2 + i2 * step + "px";
      s2.style.zIndex = i2;
      s2.innerHTML = cardHTML(c2, w2);
      onTap(s2, () => {
        handTouched();
        if (turn !== 0 || busy) return;
        const k2 = sel.indexOf(i2);
        if (k2 >= 0) {
          sel.splice(k2, 1);
          draw();
          return;
        }
        if (!canPick(i2)) return;
        sel.push(i2);
        draw();
      });
      h2.appendChild(s2);
    });
    if (SEATS[0]) SEATS[0].c = hand.length;
  }
  function renderBottom() {
    const c2 = cur();
    const t2 = T[lang];
    const mine = turn === 0 && !busy;
    const who = turn === 0 ? "" : t2.theirTurn(SEATS[turn] && SEATS[turn].n || "") + " \xB7 ";
    const left = mine && tLeft > 0 ? ' \xB7 <span class="count' + (tLeft <= 5 ? " warn" : "") + '">' + t2.left2(tLeft) + "</span>" : "";
    el("need").innerHTML = who + (c2 ? c2.num === 1 ? t2.top1 : t2.need(c2.count, c2.num - 1) : turn === 0 ? t2.lead : "") + left;
    const rn2 = window.__roundNo || 1;
    const NM = lang === "ko" ? KO_N : EN_N;
    const ri = window.__myRankIdx;
    const ord = (x2) => {
      const s2 = ["th", "st", "nd", "rd"], v2 = x2 % 100;
      return x2 + (s2[(v2 - 20) % 10] || s2[v2] || s2[0]);
    };
    const rname = ri == null ? "" : lang === "ko" ? ri + 1 + "\uB4F1" : ord(ri + 1);
    el("round").textContent = t2.roundN(rn2) + (rname ? " \xB7 " + rname : "");
    el("pass").textContent = t2.pass;
    const list = sel.map((i2) => hand[i2]);
    const ok = legal(list) && turn === 0 && !busy;
    const b2 = el("play");
    b2.disabled = !ok;
    b2.textContent = turn !== 0 ? t2.notTurn : ok ? t2.play(list.length) : cur() ? t2.play(cur().count) : t2.pick;
    el("pass").disabled = turn !== 0 || busy || !cur();
  }
  let fingerAt = 0, drawQueued = false;
  const HOLD_MAX = 1500;
  function fingerDown() {
    return fingerAt > 0 && Date.now() - fingerAt < HOLD_MAX;
  }
  function fingerUp() {
    fingerAt = 0;
    if (drawQueued) setTimeout(() => {
      if (drawQueued) {
        drawQueued = false;
        draw();
      }
    }, 0);
  }
  window.document.addEventListener("touchstart", () => {
    fingerAt = Date.now();
  }, true);
  window.document.addEventListener("touchend", fingerUp, true);
  window.document.addEventListener("touchcancel", fingerUp, true);
  function draw() {
    if (!SEATS.length) return;
    if (fingerDown()) {
      drawQueued = true;
      return;
    }
    renderSeats();
    renderPile();
    renderHand();
    renderBottom();
    paintEmotes();
    el("seats").querySelectorAll(".seat__tag").forEach(keepInView);
    const nd = el("need");
    anchorSeats(el("seats"), nd ? nd.getBoundingClientRect().top - 4 : 0);
  }
  let timerId = null, tickId = null, tLeft = 0;
  let myGen = 0, botGen = 0;
  const TURN_SEC = 15;
  const turnSec = () => Number(window.__turnSec) || TURN_SEC;
  function watchDeadline() {
  }
  let showId = null;
  function resetTimer() {
    if (showId) clearTimeout(showId);
    showId = null;
    el("timer").innerHTML = "<i></i>";
    el("timer").classList.toggle("mine", turn === 0 && !busy);
    if (timerId) clearTimeout(timerId);
    if (tickId) clearInterval(tickId);
    stop("tick");
    tLeft = 0;
    if (turn === 0 && !busy && !onScreen()) {
      showId = setTimeout(resetTimer, 150);
      return;
    }
    if (turn === 0 && !busy) {
      tLeft = turnSec();
      renderBottom();
      tickId = setInterval(() => {
        tLeft--;
        if (tLeft === 5) play("tick");
        if (tLeft <= 0) {
          clearInterval(tickId);
          tickId = null;
        }
        renderBottom();
      }, 1e3);
      timerId = setTimeout(() => {
        if (turn === 0 && !busy) doPass(true);
      }, turnSec() * 1e3);
    }
  }
  function quitGame() {
    if (window.__scored) return;
    window.__scored = true;
    const G2 = window.GAME || {};
    const sc = G2.score || [];
    const order = sc.map((_2, i2) => i2).sort((a2, b2) => (sc[b2] || 0) - (sc[a2] || 0));
    if (window.reportGame) window.reportGame(order.indexOf(0), sc.length || SEATS.length, sc[0] || 0, true);
  }
  window.__quitGame = quitGame;
  function clearsPile(numValue) {
    if (numValue === 1) return true;
    return numValue === 2 && window.__opts && window.__opts.clear2;
  }
  let touchAt = 0;
  let evBox = null;
  const EVLOG = (() => {
    try {
      return String(location.search || "").indexOf("evlog") >= 0;
    } catch (e) {
      return false;
    }
  })();
  function evShow(txt) {
    if (!EVLOG) return;
    if (!evBox) {
      evBox = window.document.createElement("div");
      evBox.style.cssText = "position:fixed;left:4px;right:4px;top:4px;z-index:99999;background:rgba(0,0,0,.86);color:#7CFF9B;font:11px/1.35 monospace;padding:6px 8px;border-radius:4px;white-space:pre-wrap;max-height:36vh;overflow:auto";
      window.document.body.appendChild(evBox);
      evBox.onclick = () => {
        evBox.textContent = "";
      };
    }
    evBox.textContent = (txt + "\n" + evBox.textContent).slice(0, 1400);
  }
  function evWatch(node, tag) {
    if (!EVLOG || !node) return;
    ["touchstart", "touchend", "pointerdown", "pointerup", "mousedown", "mouseup", "click"].forEach((n2) => node.addEventListener(n2, (e) => {
      evShow(tag + " " + n2 + (e.pointerType ? ":" + e.pointerType : "") + (e.cancelable ? "" : " (\uBABB\uB9C9\uC74C)") + " " + Date.now() % 1e5);
    }, true));
  }
  function onTap(node, fn2) {
    if (!node) return;
    let startX = 0, startY = 0, inside = false;
    node.addEventListener("touchstart", (e) => {
      const t2 = e.touches && e.touches[0];
      startX = t2 ? t2.clientX : 0;
      startY = t2 ? t2.clientY : 0;
      inside = true;
    }, { passive: true });
    node.addEventListener("touchend", (e) => {
      if (e.cancelable) e.preventDefault();
      touchAt = Date.now();
      if (!inside) return;
      inside = false;
      const t2 = e.changedTouches && e.changedTouches[0];
      if (t2) {
        const r2 = node.getBoundingClientRect();
        const x2 = t2.clientX, y2 = t2.clientY;
        if (x2 < r2.left - 8 || x2 > r2.right + 8 || y2 < r2.top - 8 || y2 > r2.bottom + 8) return;
      }
      evShow("  \u2192 \uCC98\uB9AC(\uC190\uAC00\uB77D)");
      fn2(e);
    }, { passive: false });
    node.addEventListener("touchcancel", () => {
      inside = false;
    }, { passive: true });
    node.onclick = (e) => {
      if (Date.now() - touchAt < 900) {
        evShow("  (click \uBC84\uB9BC)");
        return;
      }
      if (e && e.button != null && e.button !== 0) return;
      evShow("  \u2192 \uCC98\uB9AC(click)");
      fn2(e);
    };
    evWatch(node, "");
  }
  onTap(el("play"), () => {
    const list = sel.map((i2) => hand[i2]);
    if (!legal(list) || turn !== 0 || busy) return;
    const e = effective(list);
    sel = [];
    busy = true;
    stop("tick");
    pending = true;
    pendingHand = hand.length;
    pendingAt = Date.now();
    play2(e, list.length);
    iMoved();
    unlockLater();
  });
  let unlockId = null;
  function viewSig(v2) {
    if (!v2) return "";
    return v2.turn + "|" + (v2.table || []).length + "|" + (v2.seats || []).map((x2) => x2.c + (x2.s || "")).join(",");
  }
  function unlockLater() {
    if (unlockId) clearTimeout(unlockId);
    const sent = viewSig(engine.view);
    let tries = 0;
    const look = () => {
      unlockId = null;
      const v2 = engine.view;
      if (!busy) return;
      if (viewSig(v2) !== sent) {
        return;
      }
      if (++tries < 5) {
        unlockId = setTimeout(look, 1200);
        return;
      }
      if (v2 && v2.myTurn) {
        busy = false;
        draw();
      }
    };
    unlockId = setTimeout(look, 1200);
  }
  function iMoved() {
    if (window.__iMoved) window.__iMoved();
  }
  function doPass(auto) {
    if (turn !== 0 || busy) return;
    if (timerId) clearTimeout(timerId);
    if (!cur()) {
      if (!auto) return;
      const w2 = weakest();
      if (!w2) return;
      sel = [];
      busy = true;
      flash(T[lang].autoPass, true);
      play2(w2.num, w2.count);
      if (auto) toAuto();
      return;
    }
    sel = [];
    busy = true;
    stop("tick");
    pending = true;
    pendingHand = -1;
    pendingAt = Date.now();
    passHeld = lastTrick;
    if (auto) flash(T[lang].autoPass, true);
    if (!auto) iMoved();
    passTurn();
    unlockLater();
    if (auto) toAuto();
  }
  function toAuto() {
    if (engine.auto) return;
    setTimeout(() => {
      setAuto2(true);
      flash(T[lang].autoOnMsg, true);
    }, 400);
  }
  function weakest() {
    let best = null;
    for (const c2 of hand) if (!isJ(c2) && (best === null || c2 > best)) best = c2;
    if (best !== null) return { num: best, count: 1 };
    return hand.some(isJ) ? { num: 13, count: 1 } : null;
  }
  onTap(el("pass"), () => doPass(false));
  function setAuto2(on3) {
    setAuto(on3);
    const b2 = el("auto");
    b2.setAttribute("aria-pressed", String(Boolean(on3)));
    const t2 = b2.querySelector("span");
    if (t2) t2.textContent = on3 ? T[lang].autoOn : T[lang].autoOff;
    b2.classList.toggle("on", on3);
    if (on3) {
      sel = [];
      renderHand();
      renderBottom();
    }
  }
  el("auto").onclick = () => setAuto2(!engine.auto);
  const EMO_SHOW = 1e3, EMO_COOL = 2500;
  let emoUntil = 0;
  const emoTimers = {};
  function emoText(k2) {
    const e = EMOTES.find((x2) => x2.k === k2);
    return e ? lang === "ko" ? e.ko : e.en : "";
  }
  function emoImg(k2) {
    const e = EMOTES.find((x2) => x2.k === k2);
    return e ? e.img : "";
  }
  function esc(x2) {
    return String(x2).replace(/[&<>"]/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c2]);
  }
  function emoPickOpen(on3) {
    const p2 = el("emopick");
    if (!on3) {
      p2.hidden = true;
      p2.innerHTML = "";
      return;
    }
    p2.innerHTML = EMOTES.map((e) => '<button type="button" data-k="' + esc(e.k) + '"><span class="emobub">' + esc(lang === "ko" ? e.ko : e.en) + '</span><span class="emoimg" style="background-image:url(' + e.img + ')"></span></button>').join("");
    p2.hidden = false;
    const h2 = el("hand");
    if (h2 && p2.offsetParent) {
      const ph = p2.offsetParent.getBoundingClientRect();
      const hb = h2.getBoundingClientRect();
      p2.style.bottom = Math.round(ph.bottom - hb.top + 4) + "px";
      p2.style.top = "auto";
    }
    p2.querySelectorAll("button").forEach((b2) => {
      b2.onclick = () => {
        emoSend(b2.dataset.k);
        emoPickOpen(false);
      };
    });
  }
  function emoSend(k2) {
    const now2 = Date.now();
    if (now2 < emoUntil) return;
    emoUntil = now2 + EMO_COOL;
    paintEmoBtn();
    setTimeout(paintEmoBtn, EMO_COOL + 20);
    sendEmote(k2);
  }
  function paintEmoBtn() {
    const b2 = el("emo");
    if (!b2) return;
    b2.textContent = T[lang].emoBtn;
    b2.disabled = Date.now() < emoUntil;
  }
  const emoNow = {};
  function paintEmote(pos) {
    const layer = el("emolayer");
    const seats = el("seats");
    const d2 = seats && seats.children[pos];
    if (!layer || !d2) return;
    const old = layer.querySelector('[data-pos="' + pos + '"]');
    if (old) old.remove();
    const cur2 = emoNow[pos];
    const wrap = d2.querySelector(".seat__avwrap");
    const tag = wrap && wrap.querySelector(".seat__tag");
    if (!cur2 || Date.now() >= cur2.until) {
      if (tag) tag.style.visibility = "";
      return;
    }
    if (tag) tag.style.visibility = "hidden";
    const av = d2.querySelector(".seat__av");
    if (!av) return;
    const box = document2.createElement("span");
    box.className = "seat__emo";
    box.dataset.pos = String(pos);
    box.innerHTML = '<span class="emobub">' + esc(emoText(cur2.k)) + '</span><span class="emoimg" style="background-image:url(' + emoImg(cur2.k) + ')"></span>';
    if (cur2.shown) box.style.animation = "none";
    else cur2.shown = true;
    layer.appendChild(box);
    const lb = layer.getBoundingClientRect(), ab = av.getBoundingClientRect();
    box.style.left = Math.round((ab.left + ab.right) / 2 - lb.left) + "px";
    box.style.bottom = Math.round(lb.bottom - ab.bottom - 10) + "px";
    keepInView(box);
  }
  function keepInView(box) {
    if (!box) return;
    const stage = window.document.getElementById("stage") || window.document.documentElement;
    const W2 = stage.getBoundingClientRect();
    const r2 = box.getBoundingClientRect();
    if (!r2.width) return;
    let dx = 0;
    if (r2.left < W2.left + 2) dx = W2.left + 2 - r2.left;
    else if (r2.right > W2.right - 2) dx = W2.right - 2 - r2.right;
    box.style.marginLeft = dx ? Math.round(dx) + "px" : "";
  }
  function paintEmotes() {
    Object.keys(emoNow).forEach((p2) => paintEmote(Number(p2)));
  }
  function showEmote(pos, k2) {
    emoNow[pos] = { k: k2, until: Date.now() + EMO_SHOW, shown: false };
    paintEmote(pos);
    if (emoTimers[pos]) clearTimeout(emoTimers[pos]);
    emoTimers[pos] = setTimeout(() => {
      delete emoNow[pos];
      emoTimers[pos] = null;
      paintEmote(pos);
    }, EMO_SHOW);
  }
  el("emo").onclick = () => {
    if (Date.now() < emoUntil) return;
    emoPickOpen(el("emopick").hidden);
  };
  function flash(msg, msLong) {
    const f2 = el("flash");
    f2.innerHTML = String(msg).split("\n").map((x2) => x2.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch])).join("<br>");
    f2.style.opacity = 1;
    setTimeout(() => f2.style.opacity = 0, msLong ? 2200 : 1200);
  }
  el("ring").addEventListener("click", (e) => {
    if (!trick.length) return;
    if (e.target.closest(".play, .spread")) {
      spread = !spread;
      renderPile();
    }
  });
  boot();
  window.addEventListener("resize", draw);
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    draw();
  });
}

// src/screens/draw.js
function mount2(root) {
  function avtOf(seat) {
    const g2 = window.GAME || {};
    const a2 = g2.avatars || [];
    return avtFile(Number(a2[seat]) || 0);
  }
  const faceOf = (i2) => {
    const g2 = window.GAME || {};
    const f2 = g2.seatFaces || g2.faces;
    return f2 && f2[i2] != null ? f2[i2] : i2;
  };
  const document2 = scoped(root);
  const ART2 = ART_DECK;
  const el = (id) => document2.getElementById(id);
  const isJ = (c2) => c2 >= 13;
  const KO_N = ["\uC0AC\uC790", "\uD638\uB791\uC774", "\uBD88\uACF0", "\uCF54\uB07C\uB9AC", "\uC545\uC5B4", "\uC5EC\uC6B0", "\uAE30\uB9B0", "\uBA67\uB3FC\uC9C0", "\uC6D0\uC22D\uC774", "\uD1A0\uB07C", "\uC0C8", "\uC0DD\uC950"];
  const EN_N = ["LION", "TIGER", "BEAR", "ELEPHANT", "CROCODILE", "FOX", "GIRAFFE", "BOAR", "MONKEY", "RABBIT", "BIRD", "MOUSE"];
  const NAMES_KO = ["\uB098", "\uBBFC\uC9C0", "\uC900\uD638", "\uC11C\uC5F0", "\uD0DC\uC724", "\uD558\uC740", "\uC9C0\uD6C8", "\uC608\uB9B0"];
  const NAMES_EN = ["You", "Minji", "Junho", "Seoyeon", "Taeyun", "Haeun", "Jihoon", "Yerin"];
  const T = {
    ko: {
      step: "\uCCAB \uC21C\uC11C \uC815\uD558\uAE30",
      h: "\uCE74\uB4DC\uB97C \uD55C \uC7A5 \uBF51\uC73C\uC138\uC694",
      s: "\uC22B\uC790\uAC00 \uAC00\uC7A5 \uB0AE\uC740 \uBD84\uC774 \uBA3C\uC800 \uC2DC\uC791\uD569\uB2C8\uB2E4. \uCC28\uB840\uB294 \uAC70\uAE30\uC11C \uC2DC\uACC4 \uBC29\uD5A5\uC73C\uB85C \uB3D5\uB2C8\uB2E4. \uCE74\uBA5C\uB808\uC628\uC740 13\uC73C\uB85C \uCE69\uB2C8\uB2E4.",
      waitH: "\uBF51\uB294 \uC911",
      waitS: (n2) => "<b>" + n2 + "</b>\uB2D8\uC774 \uACE0\uB974\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      settling: "\uBF51\uC740 \uCE74\uB4DC\uB97C \uB9DE\uCDB0 \uBCF4\uB294 \uC911\uC785\uB2C8\uB2E4.",
      doneH: "\uC21C\uC11C\uAC00 \uC815\uD574\uC84C\uC2B5\uB2C8\uB2E4",
      first: "\uC120",
      doneS: (n2) => "<b>" + n2 + "</b>\uB2D8\uC774 \uBA3C\uC800 \uC2DC\uC791\uD569\uB2C8\uB2E4. \uCC28\uB840\uB294 \uC5EC\uAE30\uC11C \uC2DC\uACC4 \uBC29\uD5A5\uC785\uB2C8\uB2E4.",
      note: "\uCCAB \uD310\uC740 \uACC4\uAE09\uB3C4 \uC138\uAE08\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
      goIn: (n2) => n2 + "\uCD08 \uB4A4 \uC2DC\uC791\uD569\uB2C8\uB2E4",
      picking: "\uACE0\uB974\uB294 \uC911"
    },
    en: {
      step: "Opening draw",
      h: "Draw one card",
      s: "The lowest number leads. Turn order runs clockwise from that seat. A chameleon counts as 13.",
      waitH: "Drawing",
      waitS: (n2) => "<b>" + n2 + "</b> is choosing.",
      settling: "Comparing the draws.",
      doneH: "Turn order is set",
      first: "LEAD",
      doneS: (n2) => "<b>" + n2 + "</b> leads. Turns run clockwise from there.",
      note: "The first round has no ranks and no tax.",
      goIn: (n2) => "Starting in " + n2,
      picking: "Choosing"
    }
  };
  let lang = window.__lang || "ko";
  let online = false;
  let N2 = 6;
  const nameOf = (i2) => {
    const g2 = window.GAME || {};
    const list = lang === "ko" ? g2.names : g2.namesEn || g2.names;
    const v2 = list && list[i2];
    return v2 == null || v2 === "" ? (lang === "ko" ? NAMES_KO : NAMES_EN)[i2] : v2;
  };
  const art = (n2) => n2 === 13 ? ART2.jokerA : n2 === 14 ? ART2.jokerB : ART2[String(n2).padStart(2, "0")];
  const val = (c2) => isJ(c2) ? 13 : c2;
  let drawn = Array(N2).fill(null);
  let pool2 = [];
  let takenK = [];
  let plan = null;
  let waiting = [];
  let phase = "pick";
  const OV = { iw: 860, ih: 1859, cx: 0.4994, cy: 0.4415, rx: 0.425, ry: 0.142 };
  function placeTable(sec, cyPct) {
    const b2 = sec.getBoundingClientRect();
    const W2 = b2.width, H2 = b2.height;
    const scale = Math.max(W2 / OV.iw, H2 / OV.ih);
    const dw = OV.iw * scale, dh = OV.ih * scale;
    const cy = cyPct == null ? (H2 - dh) / 2 + OV.cy * dh : cyPct / 100 * H2;
    const ox = W2 / 2 - OV.cx * dw;
    const oy = cy - OV.cy * dh;
    sec.style.backgroundSize = Math.round(dw) + "px " + Math.round(dh) + "px";
    sec.style.backgroundPosition = Math.round(ox) + "px " + Math.round(oy) + "px";
    return {
      cx: (ox + OV.cx * dw) / W2 * 100,
      cy: cy / H2 * 100,
      rx: OV.rx * dw / W2 * 100,
      ry: OV.ry * dh / H2 * 100
    };
  }
  let RING = { cx: 49, cy: 43, rx: 42.5, ry: 14.5 };
  function syncRing() {
    const sec = window.document.getElementById("draw");
    if (!sec) return;
    RING = placeTable(sec, null);
    const d2 = el("deck");
    if (d2) {
      d2.style.left = RING.cx + "%";
      d2.style.top = RING.cy + "%";
    }
  }
  function seatPos(i2) {
    const a2 = Math.PI / 2 + i2 * 2 * Math.PI / N2;
    const s2 = Math.sin(a2);
    const bias = s2 > 0.25 ? 3.4 * s2 : 0;
    return { x: RING.cx + Math.cos(a2) * -RING.rx, y: RING.cy + s2 * RING.ry + bias };
  }
  function cardFace(c2) {
    if (c2 == null) return '<div class="card"></div>';
    const n2 = isJ(c2) ? 13 : c2;
    const nm = isJ(c2) ? lang === "ko" ? "\uCE74\uBA5C\uB808\uC628" : "CHAMELEON" : (lang === "ko" ? KO_N : EN_N)[c2 - 1];
    return '<div class="card"><div class="card__band"><span class="card__num">' + n2 + '</span><span class="card__name">' + nm + '</span><span class="card__num">' + n2 + '</span></div><div class="card__art"><img src="' + art(c2) + '" alt=""></div><div class="card__band"><span class="card__num">' + n2 + '</span><span class="card__num">' + n2 + "</span></div></div>";
  }
  let pickOrder = [];
  function winner() {
    let best = null;
    pickOrder.forEach((i2) => {
      if (drawn[i2] == null) return;
      if (best === null || val(drawn[i2]) < val(drawn[best])) best = i2;
    });
    return best === null ? 0 : best;
  }
  function ranking() {
    const w2 = winner();
    return Array.from({ length: N2 }, (_2, k2) => ({ i: (w2 + k2) % N2 }));
  }
  function layout(players) {
    const v2 = engine.view;
    pool2 = v2 && v2.draw ? v2.draw.pool.slice() : new Array(players.length).fill(null);
    plan = null;
    waiting = players.slice();
    const deck = el("deck");
    deck.innerHTML = "";
    const n2 = pool2.length;
    const cols = n2 <= 4 ? n2 : Math.min(4, Math.ceil(n2 / 2));
    const rows = Math.ceil(n2 / cols);
    const ringEl = el("ring");
    const avail = (ringEl.clientWidth || 360) - 48;
    const availH = (ringEl.clientHeight || 300) * 0.88 - 16;
    const byW = Math.floor((avail - (cols - 1) * 9) / cols);
    const byH = Math.floor((availH - (rows - 1) * 9) / rows / (390 / 200));
    const pw = Math.round(Math.max(26, Math.min(46, byW, byH)) * 0.8);
    deck.style.setProperty("--cols", cols);
    deck.style.setProperty("--pw", pw + "px");
    pool2.forEach((c2, k2) => {
      const w2 = document2.createElement("div");
      w2.className = "pk";
      w2.dataset.k = k2;
      w2.innerHTML = '<div class="pk__in"><div class="pk__f pk__f--b"><img src="' + ART2.back + '" alt=""></div><div class="pk__f pk__f--a">' + cardFace(c2) + "</div></div>";
      w2.onclick = () => {
        if (waiting[0] === 0) pick2(0, k2);
      };
      deck.appendChild(w2);
    });
  }
  const PICK_SEC = 5;
  let pickTimer = null, pickLeft = 0, pickTickId = null, botLoopId = null, offView = null;
  function armPickTimer() {
    stopPickTimer();
    if (phase !== "pick") return;
    startBotLoop();
    if (waiting.indexOf(0) < 0) return;
    pickLeft = PICK_SEC;
    draw();
    pickTickId = setInterval(() => {
      pickLeft--;
      if (pickLeft < 0) pickLeft = 0;
      draw();
    }, 1e3);
    pickTimer = setTimeout(() => {
      if (phase !== "pick" || waiting.indexOf(0) < 0) return;
      const free = el("deck").querySelectorAll(".pk:not(.taken)");
      if (free.length) free[Math.floor(Math.random() * free.length)].click();
    }, PICK_SEC * 1e3);
  }
  function stopPickTimer() {
    if (pickTimer) {
      clearTimeout(pickTimer);
      pickTimer = null;
    }
    if (pickTickId) {
      clearInterval(pickTickId);
      pickTickId = null;
    }
    pickLeft = 0;
  }
  function startBotLoop() {
  }
  function stopBotLoop() {
    if (botLoopId) {
      clearInterval(botLoopId);
      botLoopId = null;
    }
  }
  function pick2(seat, k2) {
    if (seat !== 0) return;
    if (el("deck").querySelector('.pk[data-k="' + k2 + '"].taken')) return;
    takeCard(k2);
  }
  function syncDeck(d2) {
    if (!d2) return;
    const deck = el("deck");
    d2.by.forEach((seat, k2) => {
      if (seat == null) return;
      const w2 = deck.querySelector('.pk[data-k="' + k2 + '"]');
      if (!w2) return;
      const val2 = d2.pool[k2];
      if (val2 == null) return;
      const face = w2.querySelector(".pk__f--a");
      if (face && w2.dataset.val !== String(val2)) {
        face.innerHTML = cardFace(val2);
        w2.dataset.val = String(val2);
      }
      if (w2.classList.contains("taken")) return;
      play("card_play");
      w2.classList.add("flip", "taken");
      w2.dataset.seat = seat;
      takenK.push(k2);
      drawn[seat] = d2.pool[k2];
      if (pickOrder.indexOf(seat) < 0) pickOrder.push(seat);
      waiting = waiting.filter((x2) => x2 !== seat);
      if (seat === 0) stopPickTimer();
    });
  }
  let cd = 5, cdId = null;
  function startCountdown() {
    cd = 5;
    draw();
    if (cdId) clearInterval(cdId);
    cdId = setInterval(() => {
      const sec = window.document.getElementById("draw");
      if (sec && !sec.classList.contains("is-on")) {
        clearInterval(cdId);
        cdId = null;
        return;
      }
      cd--;
      draw();
      if (cd <= 0) {
        clearInterval(cdId);
        cdId = null;
        const g2 = el("go");
        if (g2 && !g2.disabled) g2.click();
      }
    }, 1e3);
  }
  function settle() {
    phase = "done";
    const vv = engine.view;
    if (vv && vv.turn >= 0) window.__leadSeat = vv.turn;
    const w2 = typeof window.__leadSeat === "number" ? window.__leadSeat : winner();
    window.GAME = window.GAME || {};
    window.GAME.N = N2;
    window.GAME.roundNo = 1;
    window.GAME.score = Array(N2).fill(0);
    window.GAME.order = Array.from({ length: N2 }, (_2, k2) => (w2 + k2) % N2);
    if (!online) {
      window.GAME.finish = null;
      window.GAME.hold = null;
    }
    draw();
    startCountdown();
  }
  function anchorSeats(box, limitBottom) {
    const root2 = window.document.documentElement;
    const W2 = (window.document.getElementById("stage") || root2).getBoundingClientRect();
    box.querySelectorAll(".seat").forEach((s2) => {
      const av = s2.querySelector(".seat__av");
      if (!av) return;
      const dy = av.offsetTop + av.offsetHeight / 2;
      s2.style.transform = "translate(-50%," + -dy + "px)";
      const r2 = s2.getBoundingClientRect();
      let ox = 0, oy = 0;
      if (r2.left < W2.left + 3) ox = W2.left + 3 - r2.left;
      else if (r2.right > W2.right - 3) ox = W2.right - 3 - r2.right;
      if (limitBottom && r2.bottom > limitBottom) oy = limitBottom - r2.bottom;
      if (ox || oy) s2.style.transform = "translate(calc(-50% + " + ox + "px)," + (-dy + oy) + "px)";
    });
  }
  function renderSeats() {
    syncRing();
    const box = el("seats");
    box.innerHTML = "";
    const order = phase === "done" ? ranking().map((x2) => x2.i) : [];
    for (let i2 = 0; i2 < N2; i2++) {
      const a2 = Math.PI / 2 + i2 * 2 * Math.PI / N2;
      const p2 = seatPos(i2);
      const d2 = document2.createElement("div");
      const r2 = order.indexOf(i2);
      d2.className = "seat" + (i2 === 0 ? " seat--me" : "") + (waiting[0] === i2 && phase === "pick" ? " seat--turn" : "");
      d2.style.left = p2.x.toFixed(1) + "%";
      d2.style.top = p2.y.toFixed(1) + "%";
      const big = N2 <= 6;
      d2.style.setProperty("--av", "42px");
      d2.style.setProperty("--fs", (big ? 10.5 : 9) + "px");
      const first = phase === "done" && i2 === winner();
      const dv = drawn[i2] == null ? "" : val(drawn[i2]);
      const chip = dv === "" ? "" : '<span class="seat__d">' + dv + "</span>";
      const upper = Math.sin(Math.PI / 2 + i2 * 2 * Math.PI / N2) < 0;
      d2.innerHTML = '<span class="seat__r' + (first ? " on" : "") + '">' + T[lang].first + "</span>" + (upper ? chip : "") + '<span class="seat__av" style="background-image:url(' + RINGS.avatar + "),url(" + avtOf(faceOf(i2)) + ')"></span><span class="seat__n">' + nameOf(i2) + "</span>" + (upper ? "" : chip);
      box.appendChild(d2);
    }
    const md = el("mid");
    anchorSeats(box, md ? md.getBoundingClientRect().top - 4 : 0);
  }
  function draw() {
    const t2 = T[lang];
    el("step").textContent = t2.step;
    renderSeats();
    const m = el("mid");
    if (phase === "done") {
      m.innerHTML = '<div class="mid__h">' + t2.doneH + '</div><div class="mid__s">' + t2.doneS(nameOf(winner())) + "<br>" + t2.note + '</div><div class="cd">' + Math.max(cd, 0) + "</div>";
    } else if (!waiting.length) {
      m.innerHTML = '<div class="mid__h">' + t2.waitH + '</div><div class="mid__s">' + t2.settling + "</div>";
    } else if (waiting.indexOf(0) >= 0) {
      m.innerHTML = '<div class="mid__h">' + t2.h + (pickLeft > 0 ? " <b>(" + pickLeft + ")</b>" : "") + '</div><div class="mid__s">' + t2.s + "</div>";
    } else {
      m.innerHTML = '<div class="mid__h">' + t2.waitH + '</div><div class="mid__s">' + t2.waitS(nameOf(waiting[0])) + "</div>";
    }
    const g2 = el("go");
    g2.textContent = phase === "done" ? t2.goIn(cd) : t2.picking;
    g2.disabled = phase !== "done";
    const md = el("mid");
    anchorSeats(el("seats"), md ? md.getBoundingClientRect().top - 4 : 0);
  }
  function boot() {
    const sbox0 = el("seats");
    if (sbox0) sbox0.innerHTML = "";
    const dbox0 = el("deck");
    if (dbox0) dbox0.innerHTML = "";
    online = Boolean(window.__net);
    const dv = engine.view;
    N2 = dv && dv.draw && dv.draw.pool.length || (online ? window.GAME && window.GAME.N || 6 : window.__opts && (window.__opts.seated || window.__opts.cap) || 6);
    if (cdId) {
      clearInterval(cdId);
      cdId = null;
    }
    cd = 5;
    drawn = Array(N2).fill(null);
    pickOrder = [];
    takenK = [];
    window.__roundNo = 1;
    window.__myRankIdx = null;
    if (!online) {
      window.GAME = { N: N2, roundNo: 1, score: Array(N2).fill(0), order: null, finish: null, hold: null };
    }
    phase = "pick";
    {
      const sb = el("seats"), db = el("deck");
      if (sb) sb.innerHTML = "";
      if (db) db.innerHTML = "";
    }
    layout(Array.from({ length: N2 }, (_2, i2) => i2));
    if (offView) offView();
    offView = onView((v2) => {
      if (phase === "done") return;
      syncDeck(v2.draw);
      if (v2.phase !== "draw") {
        stopBotLoop();
        stopPickTimer();
        setTimeout(settle, 700);
      }
      draw();
    });
    if (engine.view) {
      syncDeck(engine.view.draw);
    }
    draw();
  }
  window.__bootDraw = () => {
    boot();
    armPickTimer();
  };
  boot();
  document2.querySelectorAll("#lang button").forEach((b2) => {
    b2.addEventListener("click", () => {
      lang = b2.dataset.l;
      document2.documentElement.lang = lang;
      document2.querySelectorAll("#lang button").forEach((x2) => x2.setAttribute("aria-pressed", String(x2 === b2)));
      draw();
    });
  });
  el("go").addEventListener("click", () => {
    if (cdId) {
      clearInterval(cdId);
      cdId = null;
    }
    const vv = engine.view;
    if (vv && vv.seats) {
      window.GAME = window.GAME || {};
      window.GAME.faces = vv.seats.map((x2) => x2.seat);
      window.GAME.seatFaces = vv.seats.map((x2) => x2.seat);
      window.GAME.names = vv.names.slice();
      window.GAME.namesEn = vv.names.slice();
      if (vv.turn >= 0) window.__leadSeat = vv.turn;
    }
  });
  window.addEventListener("resize", draw);
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    draw();
  });
}

// src/screens/_markup.js
var MARKUP = {
  "entry": '<div class="bg">\n  <div class="bg__img"></div>\n  <div class="bg__top"></div>\n  <div class="bg__bot"></div>\n</div>\n\n<div class="fan"><div class="fan__in" id="fan"></div></div>\n\n<main class="screen">\n  <div class="plate">\n    <div class="eyebrow" id="eyebrow"></div>\n    <h1 class="wordmark" id="wordmark"></h1>\n    <p class="sub" id="sub"></p>\n    <div class="hr"></div>\n  </div>\n  <div class="spacer"></div>\n  <button class="btn" id="start"></button>\n  <p class="hint" id="hint"></p>\n  <button class="testin" id="testin" hidden>\uC2DC\uD5D8\uC6A9 \uB85C\uADF8\uC778</button>\n</main>',
  "lobby": '<div class="veil"></div>\n<main class="screen">\n  <div class="bar">\n    <div class="top" id="acct">\n      <button class="top__me" id="acctProfile" aria-label="profile"></button>\n      <span class="top__tier" id="acctTier">0</span>\n      <span class="top__n" id="acctName"></span>\n      <i class="top__d"></i>\n      <span class="top__s" id="acctScore">0</span>\n      <i class="top__d"></i>\n      <span class="top__k" id="acctTick">3</span>\n      <span class="top__t" id="acctTimer"></span>\n      <button class="top__cfg" data-cfgopen aria-label="settings"></button>\n    </div>\n  </div>\n\n  <div class="body">\n    <div>\n      <div class="block__label" id="lbQuick"></div>\n      <button class="btn-primary" id="btQuick"></button>\n      <p class="hint" id="hQuick"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbNew"></div>\n      <button class="btn-second" id="btNew"></button>\n      <p class="hint" id="hNew"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbJoin"></div>\n      <div class="join">\n        <input id="code" inputmode="numeric" maxlength="4" placeholder="0000" aria-label="\uBC29 \uBC88\uD638">\n        <button id="btJoin"></button>\n      </div>\n    </div>\n  </div>\n\n  <button class="btn-rules" id="btRules"></button>\n</main>\n\n<div class="sheet" id="sheet" role="dialog" aria-modal="true">\n  <div class="sheet__veil" data-close></div>\n  <div class="sheet__panel">\n    <div class="sheet__head">\n      <div class="sheet__title" id="shTitle"></div>\n      <button class="sheet__close" data-close aria-label="\uB2EB\uAE30">\xD7</button>\n    </div>\n    <div class="sheet__body">\n      <p class="lead" id="shLead"></p>\n      <div class="grid" id="grid"></div>\n      <div id="rules"></div>\n    </div>\n  </div>\n</div>',
  "room": '<div class="veil"></div>\n<main class="screen">\n  <div class="lowfade"></div>\n  <div class="bar">\n    <button class="back" aria-label="\uB098\uAC00\uAE30">\u2039</button>\n    <div class="bar__t" id="bt"></div>\n    <div style="display:flex;gap:7px">\n      <div class="view" id="lang">\n        <button data-l="ko" aria-pressed="true">\uD55C</button>\n        <button data-l="en" aria-pressed="false">EN</button>\n      </div>\n    </div>\n  </div>\n\n  <div class="roomno">\n    <span class="roomno__l" id="rl"></span>\n    <span class="roomno__n" id="roomNo">----</span>\n    <button id="rc"></button>\n  </div>\n\n  <div class="tablewrap">\n    <div class="felt">\n      <div class="felt__c">\n        <div class="felt__n" id="feltN"></div>\n        <div class="felt__s" id="feltS"></div>\n      </div>\n    </div>\n    <div id="seats"></div>\n  </div>\n\n  <button class="sum" id="sum" data-optopen></button>\n  <div id="action"></div>\n</main>',
  "draw": '<main class="screen">\n  <div class="bar">\n    <div class="bar__t" id="step"></div>\n    <div class="lang" id="lang">\n      <button data-l="ko" aria-pressed="true">\uD55C</button>\n      <button data-l="en" aria-pressed="false">EN</button>\n    </div>\n  </div>\n\n  <div class="ring" id="ring">\n    <div class="plane" id="plane">\n      <div class="felt"></div>\n      <div id="seats"></div>\n      <div class="deck" id="deck"></div>\n    </div>\n  </div>\n\n  <div class="mid" id="mid"></div>\n  <div class="pad"></div>\n  <div class="acts">\n    <button class="bt-main" id="go" disabled></button>\n  </div>\n</main>',
  "table": `<main class="screen">
  <div class="bar">
    <button class="bar__x" aria-label="\uB098\uAC00\uAE30">\u2715</button>
    <div class="bar__r" id="round"></div>
    <span class="bar__sp"></span>
  </div>

  <div class="ring" id="ring">
    <div class="stage"><div class="plane">
      <div class="felt"></div>
      <div class="pile" id="pile"></div>
      <div id="seats"></div>
    </div></div>
  </div>

  <div class="needrow">
    <button class="autotiny" id="auto" aria-pressed="false"><i></i><span></span></button>
    <div class="need" id="need"></div>
  </div>
  <div class="timer" id="timer"><i></i></div>
  <div class="hand" id="hand"></div>
  <div class="emolayer" id="emolayer"></div>
  <div class="emopick" id="emopick" hidden></div>
  <div class="acts">
    <button class="bt-pass bt-emo" id="emo" aria-label="\uAC10\uC815\uD45C\uD604"></button><button class="bt-pass" id="pass">\uD328\uC2A4</button>
    <button class="bt-play" id="play" disabled>\uCE74\uB4DC\uB97C \uACE0\uB974\uC138\uC694</button>
  </div>
</main>

<div id="flash" style="position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);
  padding:11px 20px;border:1px solid var(--gold);border-radius:3px;background:rgba(10,18,13,.94);
  font-family:'Gowun Batang',serif;font-weight:700;font-size:15px;line-height:1.5;text-align:center;
  max-width:74%;opacity:0;pointer-events:none;
  transition:opacity .2s ease;z-index:50"></div>`,
  "tax": '<main class="screen">\n  <div class="bar">\n    <div class="bar__t" id="step"></div>\n    <div style="display:flex;gap:6px">\n      <div class="lang" id="lang">\n        <button data-l="ko" aria-pressed="true">\uD55C</button>\n        <button data-l="en" aria-pressed="false">EN</button>\n      </div>\n    </div>\n  </div>\n\n  <div class="ring">\n    <div class="plane">\n      <div class="felt"></div>\n      <div id="seats"></div>\n      <div class="fx" id="fx"></div>\n      <div class="flash" id="flash"></div>\n      <div class="mid" id="mid"></div>\n    </div>\n  </div>\n\n  <div class="hint" id="hint"></div>\n  <div class="hand" id="hand"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="back"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>',
  "result": '<main class="screen">\n  <div class="lang" id="lang">\n    <button data-l="ko" aria-pressed="true">\uD55C</button>\n    <button data-l="en" aria-pressed="false">EN</button>\n  </div>\n  <div class="head">\n    <div class="head__k" id="kicker"></div>\n    <div class="head__t" id="title"></div>\n    <div class="head__s" id="sub"></div>\n  </div>\n  <div class="legend" id="legend"></div>\n  <div class="list" id="list"></div>\n  <div class="acts">\n    <button class="bt-ghost" id="quit"></button>\n    <button class="bt-main" id="next"></button>\n  </div>\n</main>'
};

// src/lib/bar.js
var BAR_SWAP = {
  "lobby": [
    '<div class="bar">',
    '<div class="bar">'
  ],
  "room": [
    '<button class="back" aria-label="\uB098\uAC00\uAE30">\u2039</button>',
    '<button class="back" data-back="lobby" aria-label="\uB098\uAC00\uAE30">\u2039</button>'
  ],
  "draw": [
    '<div class="bar__t" id="step"></div>',
    '<div style="display:flex;align-items:center;gap:6px"><button class="navback" data-back="room" aria-label="\uB4A4\uB85C">\u2039</button><div class="bar__t" id="step"></div></div>'
  ],
  "result": [
    '<div class="head__k" id="kicker"></div>',
    '<div class="head__k" id="kicker"></div>'
  ],
  "tax": [
    '<div class="bar__t" id="step"></div>',
    '<div style="display:flex;align-items:center;gap:6px"><button class="navback" data-back="room" aria-label="\uB4A4\uB85C">\u2039</button><div class="bar__t" id="step"></div></div>'
  ],
  "table": [
    '<button class="bar__x" aria-label="\uB098\uAC00\uAE30">\u2715</button>',
    '<button class="bar__x" data-back="lobby" aria-label="\uB098\uAC00\uAE30">\u2715</button>'
  ]
};
export {
  BAR_SWAP,
  MARKUP,
  engine_exports as eng,
  mount2 as mountDraw,
  mount as mountTable
};
/*! Bundled license information:

boardgame.io/dist/esm/Debug-8242c26e.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
