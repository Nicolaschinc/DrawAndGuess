var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a, _b;
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { Component, createContext, useContext, useMemo, useRef, useCallback, useState, useEffect, createElement } from "react";
import { renderToString } from "react-dom/server";
import fastCompare from "react-fast-compare";
import invariant from "invariant";
import shallowEqual from "shallowequal";
import { useNavigate, useLocation, useParams, Link, MemoryRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Globe, Check } from "lucide-react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
const isString$1 = (obj) => typeof obj === "string";
const defer = () => {
  let res;
  let rej;
  const promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
};
const makeString = (object) => {
  if (object == null) return "";
  return "" + object;
};
const copy = (a, s, t) => {
  a.forEach((m) => {
    if (s[m]) t[m] = s[m];
  });
};
const lastOfPathSeparatorRegExp = /###/g;
const cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
const canNotTraverseDeeper = (object) => !object || isString$1(object);
const getLastOfPath = (object, path, Empty) => {
  const stack = !isString$1(path) ? path : path.split(".");
  let stackIndex = 0;
  while (stackIndex < stack.length - 1) {
    if (canNotTraverseDeeper(object)) return {};
    const key = cleanKey(stack[stackIndex]);
    if (!object[key] && Empty) object[key] = new Empty();
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
    ++stackIndex;
  }
  if (canNotTraverseDeeper(object)) return {};
  return {
    obj: object,
    k: cleanKey(stack[stackIndex])
  };
};
const setPath = (object, path, newValue) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path, Object);
  if (obj !== void 0 || path.length === 1) {
    obj[k] = newValue;
    return;
  }
  let e = path[path.length - 1];
  let p = path.slice(0, path.length - 1);
  let last = getLastOfPath(object, p, Object);
  while (last.obj === void 0 && p.length) {
    e = `${p[p.length - 1]}.${e}`;
    p = p.slice(0, p.length - 1);
    last = getLastOfPath(object, p, Object);
    if ((last == null ? void 0 : last.obj) && typeof last.obj[`${last.k}.${e}`] !== "undefined") {
      last.obj = void 0;
    }
  }
  last.obj[`${last.k}.${e}`] = newValue;
};
const pushPath = (object, path, newValue, concat) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path, Object);
  obj[k] = obj[k] || [];
  obj[k].push(newValue);
};
const getPath = (object, path) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path);
  if (!obj) return void 0;
  if (!Object.prototype.hasOwnProperty.call(obj, k)) return void 0;
  return obj[k];
};
const getPathWithDefaults = (data, defaultData, key) => {
  const value = getPath(data, key);
  if (value !== void 0) {
    return value;
  }
  return getPath(defaultData, key);
};
const deepExtend = (target, source, overwrite) => {
  for (const prop in source) {
    if (prop !== "__proto__" && prop !== "constructor") {
      if (prop in target) {
        if (isString$1(target[prop]) || target[prop] instanceof String || isString$1(source[prop]) || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }
  return target;
};
const regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var _entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;"
};
const escape = (data) => {
  if (isString$1(data)) {
    return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
  }
  return data;
};
class RegExpCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.regExpMap = /* @__PURE__ */ new Map();
    this.regExpQueue = [];
  }
  getRegExp(pattern) {
    const regExpFromCache = this.regExpMap.get(pattern);
    if (regExpFromCache !== void 0) {
      return regExpFromCache;
    }
    const regExpNew = new RegExp(pattern);
    if (this.regExpQueue.length === this.capacity) {
      this.regExpMap.delete(this.regExpQueue.shift());
    }
    this.regExpMap.set(pattern, regExpNew);
    this.regExpQueue.push(pattern);
    return regExpNew;
  }
}
const chars = [" ", ",", "?", "!", ";"];
const looksLikeObjectPathRegExpCache = new RegExpCache(20);
const looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
  nsSeparator = nsSeparator || "";
  keySeparator = keySeparator || "";
  const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
  if (possibleChars.length === 0) return true;
  const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
  let matched = !r.test(key);
  if (!matched) {
    const ki = key.indexOf(keySeparator);
    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true;
    }
  }
  return matched;
};
const deepFind = (obj, path, keySeparator = ".") => {
  if (!obj) return void 0;
  if (obj[path]) {
    if (!Object.prototype.hasOwnProperty.call(obj, path)) return void 0;
    return obj[path];
  }
  const tokens = path.split(keySeparator);
  let current = obj;
  for (let i = 0; i < tokens.length; ) {
    if (!current || typeof current !== "object") {
      return void 0;
    }
    let next;
    let nextPath = "";
    for (let j = i; j < tokens.length; ++j) {
      if (j !== i) {
        nextPath += keySeparator;
      }
      nextPath += tokens[j];
      next = current[nextPath];
      if (next !== void 0) {
        if (["string", "number", "boolean"].indexOf(typeof next) > -1 && j < tokens.length - 1) {
          continue;
        }
        i += j - i + 1;
        break;
      }
    }
    current = next;
  }
  return current;
};
const getCleanedCode = (code) => code == null ? void 0 : code.replace("_", "-");
const consoleLogger = {
  type: "logger",
  log(args) {
    this.output("log", args);
  },
  warn(args) {
    this.output("warn", args);
  },
  error(args) {
    this.output("error", args);
  },
  output(type, args) {
    var _a2, _b2;
    (_b2 = (_a2 = console == null ? void 0 : console[type]) == null ? void 0 : _a2.apply) == null ? void 0 : _b2.call(_a2, console, args);
  }
};
class Logger {
  constructor(concreteLogger, options = {}) {
    this.init(concreteLogger, options);
  }
  init(concreteLogger, options = {}) {
    this.prefix = options.prefix || "i18next:";
    this.logger = concreteLogger || consoleLogger;
    this.options = options;
    this.debug = options.debug;
  }
  log(...args) {
    return this.forward(args, "log", "", true);
  }
  warn(...args) {
    return this.forward(args, "warn", "", true);
  }
  error(...args) {
    return this.forward(args, "error", "");
  }
  deprecate(...args) {
    return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
  }
  forward(args, lvl, prefix, debugOnly) {
    if (debugOnly && !this.debug) return null;
    if (isString$1(args[0])) args[0] = `${prefix}${this.prefix} ${args[0]}`;
    return this.logger[lvl](args);
  }
  create(moduleName) {
    return new Logger(this.logger, {
      ...{
        prefix: `${this.prefix}:${moduleName}:`
      },
      ...this.options
    });
  }
  clone(options) {
    options = options || this.options;
    options.prefix = options.prefix || this.prefix;
    return new Logger(this.logger, options);
  }
}
var baseLogger = new Logger();
class EventEmitter {
  constructor() {
    this.observers = {};
  }
  on(events, listener) {
    events.split(" ").forEach((event) => {
      if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
      const numListeners = this.observers[event].get(listener) || 0;
      this.observers[event].set(listener, numListeners + 1);
    });
    return this;
  }
  off(event, listener) {
    if (!this.observers[event]) return;
    if (!listener) {
      delete this.observers[event];
      return;
    }
    this.observers[event].delete(listener);
  }
  emit(event, ...args) {
    if (this.observers[event]) {
      const cloned = Array.from(this.observers[event].entries());
      cloned.forEach(([observer, numTimesAdded]) => {
        for (let i = 0; i < numTimesAdded; i++) {
          observer(...args);
        }
      });
    }
    if (this.observers["*"]) {
      const cloned = Array.from(this.observers["*"].entries());
      cloned.forEach(([observer, numTimesAdded]) => {
        for (let i = 0; i < numTimesAdded; i++) {
          observer.apply(observer, [event, ...args]);
        }
      });
    }
  }
}
class ResourceStore extends EventEmitter {
  constructor(data, options = {
    ns: ["translation"],
    defaultNS: "translation"
  }) {
    super();
    this.data = data || {};
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    if (this.options.ignoreJSONStructure === void 0) {
      this.options.ignoreJSONStructure = true;
    }
  }
  addNamespaces(ns) {
    if (this.options.ns.indexOf(ns) < 0) {
      this.options.ns.push(ns);
    }
  }
  removeNamespaces(ns) {
    const index = this.options.ns.indexOf(ns);
    if (index > -1) {
      this.options.ns.splice(index, 1);
    }
  }
  getResource(lng, ns, key, options = {}) {
    var _a2, _b2;
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
    let path;
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
    } else {
      path = [lng, ns];
      if (key) {
        if (Array.isArray(key)) {
          path.push(...key);
        } else if (isString$1(key) && keySeparator) {
          path.push(...key.split(keySeparator));
        } else {
          path.push(key);
        }
      }
    }
    const result = getPath(this.data, path);
    if (!result && !ns && !key && lng.indexOf(".") > -1) {
      lng = path[0];
      ns = path[1];
      key = path.slice(2).join(".");
    }
    if (result || !ignoreJSONStructure || !isString$1(key)) return result;
    return deepFind((_b2 = (_a2 = this.data) == null ? void 0 : _a2[lng]) == null ? void 0 : _b2[ns], key, keySeparator);
  }
  addResource(lng, ns, key, value, options = {
    silent: false
  }) {
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    let path = [lng, ns];
    if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
      value = ns;
      ns = path[1];
    }
    this.addNamespaces(ns);
    setPath(this.data, path, value);
    if (!options.silent) this.emit("added", lng, ns, key, value);
  }
  addResources(lng, ns, resources, options = {
    silent: false
  }) {
    for (const m in resources) {
      if (isString$1(resources[m]) || Array.isArray(resources[m])) this.addResource(lng, ns, m, resources[m], {
        silent: true
      });
    }
    if (!options.silent) this.emit("added", lng, ns, resources);
  }
  addResourceBundle(lng, ns, resources, deep, overwrite, options = {
    silent: false,
    skipCopy: false
  }) {
    let path = [lng, ns];
    if (lng.indexOf(".") > -1) {
      path = lng.split(".");
      deep = resources;
      resources = ns;
      ns = path[1];
    }
    this.addNamespaces(ns);
    let pack = getPath(this.data, path) || {};
    if (!options.skipCopy) resources = JSON.parse(JSON.stringify(resources));
    if (deep) {
      deepExtend(pack, resources, overwrite);
    } else {
      pack = {
        ...pack,
        ...resources
      };
    }
    setPath(this.data, path, pack);
    if (!options.silent) this.emit("added", lng, ns, resources);
  }
  removeResourceBundle(lng, ns) {
    if (this.hasResourceBundle(lng, ns)) {
      delete this.data[lng][ns];
    }
    this.removeNamespaces(ns);
    this.emit("removed", lng, ns);
  }
  hasResourceBundle(lng, ns) {
    return this.getResource(lng, ns) !== void 0;
  }
  getResourceBundle(lng, ns) {
    if (!ns) ns = this.options.defaultNS;
    return this.getResource(lng, ns);
  }
  getDataByLanguage(lng) {
    return this.data[lng];
  }
  hasLanguageSomeTranslations(lng) {
    const data = this.getDataByLanguage(lng);
    const n = data && Object.keys(data) || [];
    return !!n.find((v) => data[v] && Object.keys(data[v]).length > 0);
  }
  toJSON() {
    return this.data;
  }
}
var postProcessor = {
  processors: {},
  addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle(processors, value, key, options, translator) {
    processors.forEach((processor) => {
      var _a2;
      value = ((_a2 = this.processors[processor]) == null ? void 0 : _a2.process(value, key, options, translator)) ?? value;
    });
    return value;
  }
};
const PATH_KEY = Symbol("i18next/PATH_KEY");
function createProxy() {
  const state = [];
  const handler = /* @__PURE__ */ Object.create(null);
  let proxy;
  handler.get = (target, key) => {
    var _a2;
    (_a2 = proxy == null ? void 0 : proxy.revoke) == null ? void 0 : _a2.call(proxy);
    if (key === PATH_KEY) return state;
    state.push(key);
    proxy = Proxy.revocable(target, handler);
    return proxy.proxy;
  };
  return Proxy.revocable(/* @__PURE__ */ Object.create(null), handler).proxy;
}
function keysFromSelector(selector, opts) {
  const {
    [PATH_KEY]: path
  } = selector(createProxy());
  return path.join((opts == null ? void 0 : opts.keySeparator) ?? ".");
}
const checkedLoadedFor = {};
const shouldHandleAsObject = (res) => !isString$1(res) && typeof res !== "boolean" && typeof res !== "number";
class Translator extends EventEmitter {
  constructor(services, options = {}) {
    super();
    copy(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], services, this);
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    this.logger = baseLogger.create("translator");
  }
  changeLanguage(lng) {
    if (lng) this.language = lng;
  }
  exists(key, o = {
    interpolation: {}
  }) {
    const opt = {
      ...o
    };
    if (key == null) return false;
    const resolved = this.resolve(key, opt);
    if ((resolved == null ? void 0 : resolved.res) === void 0) return false;
    const isObject2 = shouldHandleAsObject(resolved.res);
    if (opt.returnObjects === false && isObject2) {
      return false;
    }
    return true;
  }
  extractFromKey(key, opt) {
    let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
    if (nsSeparator === void 0) nsSeparator = ":";
    const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
    let namespaces = opt.ns || this.options.defaultNS || [];
    const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
    const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !opt.keySeparator && !this.options.userDefinedNsSeparator && !opt.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
    if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
      const m = key.match(this.interpolator.nestingRegexp);
      if (m && m.length > 0) {
        return {
          key,
          namespaces: isString$1(namespaces) ? [namespaces] : namespaces
        };
      }
      const parts = key.split(nsSeparator);
      if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
      key = parts.join(keySeparator);
    }
    return {
      key,
      namespaces: isString$1(namespaces) ? [namespaces] : namespaces
    };
  }
  translate(keys, o, lastKey) {
    let opt = typeof o === "object" ? {
      ...o
    } : o;
    if (typeof opt !== "object" && this.options.overloadTranslationOptionHandler) {
      opt = this.options.overloadTranslationOptionHandler(arguments);
    }
    if (typeof opt === "object") opt = {
      ...opt
    };
    if (!opt) opt = {};
    if (keys == null) return "";
    if (typeof keys === "function") keys = keysFromSelector(keys, {
      ...this.options,
      ...opt
    });
    if (!Array.isArray(keys)) keys = [String(keys)];
    const returnDetails = opt.returnDetails !== void 0 ? opt.returnDetails : this.options.returnDetails;
    const keySeparator = opt.keySeparator !== void 0 ? opt.keySeparator : this.options.keySeparator;
    const {
      key,
      namespaces
    } = this.extractFromKey(keys[keys.length - 1], opt);
    const namespace = namespaces[namespaces.length - 1];
    let nsSeparator = opt.nsSeparator !== void 0 ? opt.nsSeparator : this.options.nsSeparator;
    if (nsSeparator === void 0) nsSeparator = ":";
    const lng = opt.lng || this.language;
    const appendNamespaceToCIMode = opt.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
    if ((lng == null ? void 0 : lng.toLowerCase()) === "cimode") {
      if (appendNamespaceToCIMode) {
        if (returnDetails) {
          return {
            res: `${namespace}${nsSeparator}${key}`,
            usedKey: key,
            exactUsedKey: key,
            usedLng: lng,
            usedNS: namespace,
            usedParams: this.getUsedParamsDetails(opt)
          };
        }
        return `${namespace}${nsSeparator}${key}`;
      }
      if (returnDetails) {
        return {
          res: key,
          usedKey: key,
          exactUsedKey: key,
          usedLng: lng,
          usedNS: namespace,
          usedParams: this.getUsedParamsDetails(opt)
        };
      }
      return key;
    }
    const resolved = this.resolve(keys, opt);
    let res = resolved == null ? void 0 : resolved.res;
    const resUsedKey = (resolved == null ? void 0 : resolved.usedKey) || key;
    const resExactUsedKey = (resolved == null ? void 0 : resolved.exactUsedKey) || key;
    const noObject = ["[object Number]", "[object Function]", "[object RegExp]"];
    const joinArrays = opt.joinArrays !== void 0 ? opt.joinArrays : this.options.joinArrays;
    const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
    const needsPluralHandling = opt.count !== void 0 && !isString$1(opt.count);
    const hasDefaultValue = Translator.hasDefaultValue(opt);
    const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, opt) : "";
    const defaultValueSuffixOrdinalFallback = opt.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, opt.count, {
      ordinal: false
    }) : "";
    const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
    const defaultValue2 = needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] || opt[`defaultValue${defaultValueSuffix}`] || opt[`defaultValue${defaultValueSuffixOrdinalFallback}`] || opt.defaultValue;
    let resForObjHndl = res;
    if (handleAsObjectInI18nFormat && !res && hasDefaultValue) {
      resForObjHndl = defaultValue2;
    }
    const handleAsObject = shouldHandleAsObject(resForObjHndl);
    const resType = Object.prototype.toString.apply(resForObjHndl);
    if (handleAsObjectInI18nFormat && resForObjHndl && handleAsObject && noObject.indexOf(resType) < 0 && !(isString$1(joinArrays) && Array.isArray(resForObjHndl))) {
      if (!opt.returnObjects && !this.options.returnObjects) {
        if (!this.options.returnedObjectHandler) {
          this.logger.warn("accessing an object - but returnObjects options is not enabled!");
        }
        const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, resForObjHndl, {
          ...opt,
          ns: namespaces
        }) : `key '${key} (${this.language})' returned an object instead of string.`;
        if (returnDetails) {
          resolved.res = r;
          resolved.usedParams = this.getUsedParamsDetails(opt);
          return resolved;
        }
        return r;
      }
      if (keySeparator) {
        const resTypeIsArray = Array.isArray(resForObjHndl);
        const copy2 = resTypeIsArray ? [] : {};
        const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
        for (const m in resForObjHndl) {
          if (Object.prototype.hasOwnProperty.call(resForObjHndl, m)) {
            const deepKey = `${newKeyToUse}${keySeparator}${m}`;
            if (hasDefaultValue && !res) {
              copy2[m] = this.translate(deepKey, {
                ...opt,
                defaultValue: shouldHandleAsObject(defaultValue2) ? defaultValue2[m] : void 0,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            } else {
              copy2[m] = this.translate(deepKey, {
                ...opt,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            }
            if (copy2[m] === deepKey) copy2[m] = resForObjHndl[m];
          }
        }
        res = copy2;
      }
    } else if (handleAsObjectInI18nFormat && isString$1(joinArrays) && Array.isArray(res)) {
      res = res.join(joinArrays);
      if (res) res = this.extendTranslation(res, keys, opt, lastKey);
    } else {
      let usedDefault = false;
      let usedKey = false;
      if (!this.isValidLookup(res) && hasDefaultValue) {
        usedDefault = true;
        res = defaultValue2;
      }
      if (!this.isValidLookup(res)) {
        usedKey = true;
        res = key;
      }
      const missingKeyNoValueFallbackToKey = opt.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
      const resForMissing = missingKeyNoValueFallbackToKey && usedKey ? void 0 : res;
      const updateMissing = hasDefaultValue && defaultValue2 !== res && this.options.updateMissing;
      if (usedKey || usedDefault || updateMissing) {
        this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue2 : res);
        if (keySeparator) {
          const fk = this.resolve(key, {
            ...opt,
            keySeparator: false
          });
          if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
        }
        let lngs = [];
        const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, opt.lng || this.language);
        if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) {
          for (let i = 0; i < fallbackLngs.length; i++) {
            lngs.push(fallbackLngs[i]);
          }
        } else if (this.options.saveMissingTo === "all") {
          lngs = this.languageUtils.toResolveHierarchy(opt.lng || this.language);
        } else {
          lngs.push(opt.lng || this.language);
        }
        const send = (l, k, specificDefaultValue) => {
          var _a2;
          const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
          if (this.options.missingKeyHandler) {
            this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, opt);
          } else if ((_a2 = this.backendConnector) == null ? void 0 : _a2.saveMissing) {
            this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, opt);
          }
          this.emit("missingKey", l, namespace, k, res);
        };
        if (this.options.saveMissing) {
          if (this.options.saveMissingPlurals && needsPluralHandling) {
            lngs.forEach((language) => {
              const suffixes = this.pluralResolver.getSuffixes(language, opt);
              if (needsZeroSuffixLookup && opt[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) {
                suffixes.push(`${this.options.pluralSeparator}zero`);
              }
              suffixes.forEach((suffix) => {
                send([language], key + suffix, opt[`defaultValue${suffix}`] || defaultValue2);
              });
            });
          } else {
            send(lngs, key, defaultValue2);
          }
        }
      }
      res = this.extendTranslation(res, keys, opt, resolved, lastKey);
      if (usedKey && res === key && this.options.appendNamespaceToMissingKey) {
        res = `${namespace}${nsSeparator}${key}`;
      }
      if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
        res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}${nsSeparator}${key}` : key, usedDefault ? res : void 0, opt);
      }
    }
    if (returnDetails) {
      resolved.res = res;
      resolved.usedParams = this.getUsedParamsDetails(opt);
      return resolved;
    }
    return res;
  }
  extendTranslation(res, key, opt, resolved, lastKey) {
    var _a2, _b2;
    if ((_a2 = this.i18nFormat) == null ? void 0 : _a2.parse) {
      res = this.i18nFormat.parse(res, {
        ...this.options.interpolation.defaultVariables,
        ...opt
      }, opt.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, {
        resolved
      });
    } else if (!opt.skipInterpolation) {
      if (opt.interpolation) this.interpolator.init({
        ...opt,
        ...{
          interpolation: {
            ...this.options.interpolation,
            ...opt.interpolation
          }
        }
      });
      const skipOnVariables = isString$1(res) && (((_b2 = opt == null ? void 0 : opt.interpolation) == null ? void 0 : _b2.skipOnVariables) !== void 0 ? opt.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
      let nestBef;
      if (skipOnVariables) {
        const nb = res.match(this.interpolator.nestingRegexp);
        nestBef = nb && nb.length;
      }
      let data = opt.replace && !isString$1(opt.replace) ? opt.replace : opt;
      if (this.options.interpolation.defaultVariables) data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
      res = this.interpolator.interpolate(res, data, opt.lng || this.language || resolved.usedLng, opt);
      if (skipOnVariables) {
        const na = res.match(this.interpolator.nestingRegexp);
        const nestAft = na && na.length;
        if (nestBef < nestAft) opt.nest = false;
      }
      if (!opt.lng && resolved && resolved.res) opt.lng = this.language || resolved.usedLng;
      if (opt.nest !== false) res = this.interpolator.nest(res, (...args) => {
        if ((lastKey == null ? void 0 : lastKey[0]) === args[0] && !opt.context) {
          this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
          return null;
        }
        return this.translate(...args, key);
      }, opt);
      if (opt.interpolation) this.interpolator.reset();
    }
    const postProcess = opt.postProcess || this.options.postProcess;
    const postProcessorNames = isString$1(postProcess) ? [postProcess] : postProcess;
    if (res != null && (postProcessorNames == null ? void 0 : postProcessorNames.length) && opt.applyPostProcessor !== false) {
      res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
        i18nResolved: {
          ...resolved,
          usedParams: this.getUsedParamsDetails(opt)
        },
        ...opt
      } : opt, this);
    }
    return res;
  }
  resolve(keys, opt = {}) {
    let found;
    let usedKey;
    let exactUsedKey;
    let usedLng;
    let usedNS;
    if (isString$1(keys)) keys = [keys];
    keys.forEach((k) => {
      if (this.isValidLookup(found)) return;
      const extracted = this.extractFromKey(k, opt);
      const key = extracted.key;
      usedKey = key;
      let namespaces = extracted.namespaces;
      if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
      const needsPluralHandling = opt.count !== void 0 && !isString$1(opt.count);
      const needsZeroSuffixLookup = needsPluralHandling && !opt.ordinal && opt.count === 0;
      const needsContextHandling = opt.context !== void 0 && (isString$1(opt.context) || typeof opt.context === "number") && opt.context !== "";
      const codes = opt.lngs ? opt.lngs : this.languageUtils.toResolveHierarchy(opt.lng || this.language, opt.fallbackLng);
      namespaces.forEach((ns) => {
        var _a2, _b2;
        if (this.isValidLookup(found)) return;
        usedNS = ns;
        if (!checkedLoadedFor[`${codes[0]}-${ns}`] && ((_a2 = this.utils) == null ? void 0 : _a2.hasLoadedNamespace) && !((_b2 = this.utils) == null ? void 0 : _b2.hasLoadedNamespace(usedNS))) {
          checkedLoadedFor[`${codes[0]}-${ns}`] = true;
          this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
        }
        codes.forEach((code) => {
          var _a3;
          if (this.isValidLookup(found)) return;
          usedLng = code;
          const finalKeys = [key];
          if ((_a3 = this.i18nFormat) == null ? void 0 : _a3.addLookupKeys) {
            this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, opt);
          } else {
            let pluralSuffix;
            if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, opt.count, opt);
            const zeroSuffix = `${this.options.pluralSeparator}zero`;
            const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
            if (needsPluralHandling) {
              if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
              }
              finalKeys.push(key + pluralSuffix);
              if (needsZeroSuffixLookup) {
                finalKeys.push(key + zeroSuffix);
              }
            }
            if (needsContextHandling) {
              const contextKey = `${key}${this.options.contextSeparator || "_"}${opt.context}`;
              finalKeys.push(contextKey);
              if (needsPluralHandling) {
                if (opt.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                  finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                }
                finalKeys.push(contextKey + pluralSuffix);
                if (needsZeroSuffixLookup) {
                  finalKeys.push(contextKey + zeroSuffix);
                }
              }
            }
          }
          let possibleKey;
          while (possibleKey = finalKeys.pop()) {
            if (!this.isValidLookup(found)) {
              exactUsedKey = possibleKey;
              found = this.getResource(code, ns, possibleKey, opt);
            }
          }
        });
      });
    });
    return {
      res: found,
      usedKey,
      exactUsedKey,
      usedLng,
      usedNS
    };
  }
  isValidLookup(res) {
    return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
  }
  getResource(code, ns, key, options = {}) {
    var _a2;
    if ((_a2 = this.i18nFormat) == null ? void 0 : _a2.getResource) return this.i18nFormat.getResource(code, ns, key, options);
    return this.resourceStore.getResource(code, ns, key, options);
  }
  getUsedParamsDetails(options = {}) {
    const optionsKeys = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"];
    const useOptionsReplaceForData = options.replace && !isString$1(options.replace);
    let data = useOptionsReplaceForData ? options.replace : options;
    if (useOptionsReplaceForData && typeof options.count !== "undefined") {
      data.count = options.count;
    }
    if (this.options.interpolation.defaultVariables) {
      data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
    }
    if (!useOptionsReplaceForData) {
      data = {
        ...data
      };
      for (const key of optionsKeys) {
        delete data[key];
      }
    }
    return data;
  }
  static hasDefaultValue(options) {
    const prefix = "defaultValue";
    for (const option2 in options) {
      if (Object.prototype.hasOwnProperty.call(options, option2) && prefix === option2.substring(0, prefix.length) && void 0 !== options[option2]) {
        return true;
      }
    }
    return false;
  }
}
class LanguageUtil {
  constructor(options) {
    this.options = options;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create("languageUtils");
  }
  getScriptPartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return null;
    const p = code.split("-");
    if (p.length === 2) return null;
    p.pop();
    if (p[p.length - 1].toLowerCase() === "x") return null;
    return this.formatLanguageCode(p.join("-"));
  }
  getLanguagePartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return code;
    const p = code.split("-");
    return this.formatLanguageCode(p[0]);
  }
  formatLanguageCode(code) {
    if (isString$1(code) && code.indexOf("-") > -1) {
      let formattedCode;
      try {
        formattedCode = Intl.getCanonicalLocales(code)[0];
      } catch (e) {
      }
      if (formattedCode && this.options.lowerCaseLng) {
        formattedCode = formattedCode.toLowerCase();
      }
      if (formattedCode) return formattedCode;
      if (this.options.lowerCaseLng) {
        return code.toLowerCase();
      }
      return code;
    }
    return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
  }
  isSupportedCode(code) {
    if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) {
      code = this.getLanguagePartFromCode(code);
    }
    return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
  }
  getBestMatchFromCodes(codes) {
    if (!codes) return null;
    let found;
    codes.forEach((code) => {
      if (found) return;
      const cleanedLng = this.formatLanguageCode(code);
      if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
    });
    if (!found && this.options.supportedLngs) {
      codes.forEach((code) => {
        if (found) return;
        const lngScOnly = this.getScriptPartFromCode(code);
        if (this.isSupportedCode(lngScOnly)) return found = lngScOnly;
        const lngOnly = this.getLanguagePartFromCode(code);
        if (this.isSupportedCode(lngOnly)) return found = lngOnly;
        found = this.options.supportedLngs.find((supportedLng) => {
          if (supportedLng === lngOnly) return supportedLng;
          if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0) return;
          if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly) return supportedLng;
          if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1) return supportedLng;
        });
      });
    }
    if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
    return found;
  }
  getFallbackCodes(fallbacks, code) {
    if (!fallbacks) return [];
    if (typeof fallbacks === "function") fallbacks = fallbacks(code);
    if (isString$1(fallbacks)) fallbacks = [fallbacks];
    if (Array.isArray(fallbacks)) return fallbacks;
    if (!code) return fallbacks.default || [];
    let found = fallbacks[code];
    if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
    if (!found) found = fallbacks[this.formatLanguageCode(code)];
    if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
    if (!found) found = fallbacks.default;
    return found || [];
  }
  toResolveHierarchy(code, fallbackCode) {
    const fallbackCodes = this.getFallbackCodes((fallbackCode === false ? [] : fallbackCode) || this.options.fallbackLng || [], code);
    const codes = [];
    const addCode = (c) => {
      if (!c) return;
      if (this.isSupportedCode(c)) {
        codes.push(c);
      } else {
        this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
      }
    };
    if (isString$1(code) && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
      if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
      if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
      if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
    } else if (isString$1(code)) {
      addCode(this.formatLanguageCode(code));
    }
    fallbackCodes.forEach((fc) => {
      if (codes.indexOf(fc) < 0) addCode(this.formatLanguageCode(fc));
    });
    return codes;
  }
}
const suffixesOrder = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5
};
const dummyRule = {
  select: (count) => count === 1 ? "one" : "other",
  resolvedOptions: () => ({
    pluralCategories: ["one", "other"]
  })
};
class PluralResolver {
  constructor(languageUtils, options = {}) {
    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create("pluralResolver");
    this.pluralRulesCache = {};
  }
  clearCache() {
    this.pluralRulesCache = {};
  }
  getRule(code, options = {}) {
    const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
    const type = options.ordinal ? "ordinal" : "cardinal";
    const cacheKey = JSON.stringify({
      cleanedCode,
      type
    });
    if (cacheKey in this.pluralRulesCache) {
      return this.pluralRulesCache[cacheKey];
    }
    let rule;
    try {
      rule = new Intl.PluralRules(cleanedCode, {
        type
      });
    } catch (err) {
      if (typeof Intl === "undefined") {
        this.logger.error("No Intl support, please use an Intl polyfill!");
        return dummyRule;
      }
      if (!code.match(/-|_/)) return dummyRule;
      const lngPart = this.languageUtils.getLanguagePartFromCode(code);
      rule = this.getRule(lngPart, options);
    }
    this.pluralRulesCache[cacheKey] = rule;
    return rule;
  }
  needsPlural(code, options = {}) {
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    return (rule == null ? void 0 : rule.resolvedOptions().pluralCategories.length) > 1;
  }
  getPluralFormsOfKey(code, key, options = {}) {
    return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
  }
  getSuffixes(code, options = {}) {
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    if (!rule) return [];
    return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
  }
  getSuffix(code, count, options = {}) {
    const rule = this.getRule(code, options);
    if (rule) {
      return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
    }
    this.logger.warn(`no plural rule found for: ${code}`);
    return this.getSuffix("dev", count, options);
  }
}
const deepFindWithDefaults = (data, defaultData, key, keySeparator = ".", ignoreJSONStructure = true) => {
  let path = getPathWithDefaults(data, defaultData, key);
  if (!path && ignoreJSONStructure && isString$1(key)) {
    path = deepFind(data, key, keySeparator);
    if (path === void 0) path = deepFind(defaultData, key, keySeparator);
  }
  return path;
};
const regexSafe = (val) => val.replace(/\$/g, "$$$$");
class Interpolator {
  constructor(options = {}) {
    var _a2;
    this.logger = baseLogger.create("interpolator");
    this.options = options;
    this.format = ((_a2 = options == null ? void 0 : options.interpolation) == null ? void 0 : _a2.format) || ((value) => value);
    this.init(options);
  }
  init(options = {}) {
    if (!options.interpolation) options.interpolation = {
      escapeValue: true
    };
    const {
      escape: escape$1,
      escapeValue,
      useRawValueToEscape,
      prefix,
      prefixEscaped,
      suffix,
      suffixEscaped,
      formatSeparator,
      unescapeSuffix,
      unescapePrefix,
      nestingPrefix,
      nestingPrefixEscaped,
      nestingSuffix,
      nestingSuffixEscaped,
      nestingOptionsSeparator,
      maxReplaces,
      alwaysFormat
    } = options.interpolation;
    this.escape = escape$1 !== void 0 ? escape$1 : escape;
    this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
    this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
    this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
    this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
    this.formatSeparator = formatSeparator || ",";
    this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
    this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
    this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
    this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
    this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
    this.maxReplaces = maxReplaces || 1e3;
    this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
    this.resetRegExp();
  }
  reset() {
    if (this.options) this.init(this.options);
  }
  resetRegExp() {
    const getOrResetRegExp = (existingRegExp, pattern) => {
      if ((existingRegExp == null ? void 0 : existingRegExp.source) === pattern) {
        existingRegExp.lastIndex = 0;
        return existingRegExp;
      }
      return new RegExp(pattern, "g");
    };
    this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
    this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
    this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`);
  }
  interpolate(str, data, lng, options) {
    var _a2;
    let match;
    let value;
    let replaces;
    const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
    const handleFormat = (key) => {
      if (key.indexOf(this.formatSeparator) < 0) {
        const path = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
        return this.alwaysFormat ? this.format(path, void 0, lng, {
          ...options,
          ...data,
          interpolationkey: key
        }) : path;
      }
      const p = key.split(this.formatSeparator);
      const k = p.shift().trim();
      const f = p.join(this.formatSeparator).trim();
      return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
        ...options,
        ...data,
        interpolationkey: k
      });
    };
    this.resetRegExp();
    const missingInterpolationHandler = (options == null ? void 0 : options.missingInterpolationHandler) || this.options.missingInterpolationHandler;
    const skipOnVariables = ((_a2 = options == null ? void 0 : options.interpolation) == null ? void 0 : _a2.skipOnVariables) !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
    const todos = [{
      regex: this.regexpUnescape,
      safeValue: (val) => regexSafe(val)
    }, {
      regex: this.regexp,
      safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
    }];
    todos.forEach((todo) => {
      replaces = 0;
      while (match = todo.regex.exec(str)) {
        const matchedVar = match[1].trim();
        value = handleFormat(matchedVar);
        if (value === void 0) {
          if (typeof missingInterpolationHandler === "function") {
            const temp = missingInterpolationHandler(str, match, options);
            value = isString$1(temp) ? temp : "";
          } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
            value = "";
          } else if (skipOnVariables) {
            value = match[0];
            continue;
          } else {
            this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
            value = "";
          }
        } else if (!isString$1(value) && !this.useRawValueToEscape) {
          value = makeString(value);
        }
        const safeValue = todo.safeValue(value);
        str = str.replace(match[0], safeValue);
        if (skipOnVariables) {
          todo.regex.lastIndex += value.length;
          todo.regex.lastIndex -= match[0].length;
        } else {
          todo.regex.lastIndex = 0;
        }
        replaces++;
        if (replaces >= this.maxReplaces) {
          break;
        }
      }
    });
    return str;
  }
  nest(str, fc, options = {}) {
    let match;
    let value;
    let clonedOptions;
    const handleHasOptions = (key, inheritedOptions) => {
      const sep = this.nestingOptionsSeparator;
      if (key.indexOf(sep) < 0) return key;
      const c = key.split(new RegExp(`${regexEscape(sep)}[ ]*{`));
      let optionsString = `{${c[1]}`;
      key = c[0];
      optionsString = this.interpolate(optionsString, clonedOptions);
      const matchedSingleQuotes = optionsString.match(/'/g);
      const matchedDoubleQuotes = optionsString.match(/"/g);
      if (((matchedSingleQuotes == null ? void 0 : matchedSingleQuotes.length) ?? 0) % 2 === 0 && !matchedDoubleQuotes || ((matchedDoubleQuotes == null ? void 0 : matchedDoubleQuotes.length) ?? 0) % 2 !== 0) {
        optionsString = optionsString.replace(/'/g, '"');
      }
      try {
        clonedOptions = JSON.parse(optionsString);
        if (inheritedOptions) clonedOptions = {
          ...inheritedOptions,
          ...clonedOptions
        };
      } catch (e) {
        this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
        return `${key}${sep}${optionsString}`;
      }
      if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1) delete clonedOptions.defaultValue;
      return key;
    };
    while (match = this.nestingRegexp.exec(str)) {
      let formatters = [];
      clonedOptions = {
        ...options
      };
      clonedOptions = clonedOptions.replace && !isString$1(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
      clonedOptions.applyPostProcessor = false;
      delete clonedOptions.defaultValue;
      const keyEndIndex = /{.*}/.test(match[1]) ? match[1].lastIndexOf("}") + 1 : match[1].indexOf(this.formatSeparator);
      if (keyEndIndex !== -1) {
        formatters = match[1].slice(keyEndIndex).split(this.formatSeparator).map((elem) => elem.trim()).filter(Boolean);
        match[1] = match[1].slice(0, keyEndIndex);
      }
      value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
      if (value && match[0] === str && !isString$1(value)) return value;
      if (!isString$1(value)) value = makeString(value);
      if (!value) {
        this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
        value = "";
      }
      if (formatters.length) {
        value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
          ...options,
          interpolationkey: match[1].trim()
        }), value.trim());
      }
      str = str.replace(match[0], value);
      this.regexp.lastIndex = 0;
    }
    return str;
  }
}
const parseFormatStr = (formatStr) => {
  let formatName = formatStr.toLowerCase().trim();
  const formatOptions = {};
  if (formatStr.indexOf("(") > -1) {
    const p = formatStr.split("(");
    formatName = p[0].toLowerCase().trim();
    const optStr = p[1].substring(0, p[1].length - 1);
    if (formatName === "currency" && optStr.indexOf(":") < 0) {
      if (!formatOptions.currency) formatOptions.currency = optStr.trim();
    } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
      if (!formatOptions.range) formatOptions.range = optStr.trim();
    } else {
      const opts = optStr.split(";");
      opts.forEach((opt) => {
        if (opt) {
          const [key, ...rest] = opt.split(":");
          const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
          const trimmedKey = key.trim();
          if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
          if (val === "false") formatOptions[trimmedKey] = false;
          if (val === "true") formatOptions[trimmedKey] = true;
          if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
        }
      });
    }
  }
  return {
    formatName,
    formatOptions
  };
};
const createCachedFormatter = (fn) => {
  const cache = {};
  return (v, l, o) => {
    let optForCache = o;
    if (o && o.interpolationkey && o.formatParams && o.formatParams[o.interpolationkey] && o[o.interpolationkey]) {
      optForCache = {
        ...optForCache,
        [o.interpolationkey]: void 0
      };
    }
    const key = l + JSON.stringify(optForCache);
    let frm = cache[key];
    if (!frm) {
      frm = fn(getCleanedCode(l), o);
      cache[key] = frm;
    }
    return frm(v);
  };
};
const createNonCachedFormatter = (fn) => (v, l, o) => fn(getCleanedCode(l), o)(v);
class Formatter {
  constructor(options = {}) {
    this.logger = baseLogger.create("formatter");
    this.options = options;
    this.init(options);
  }
  init(services, options = {
    interpolation: {}
  }) {
    this.formatSeparator = options.interpolation.formatSeparator || ",";
    const cf = options.cacheInBuiltFormats ? createCachedFormatter : createNonCachedFormatter;
    this.formats = {
      number: cf((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      currency: cf((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt,
          style: "currency"
        });
        return (val) => formatter.format(val);
      }),
      datetime: cf((lng, opt) => {
        const formatter = new Intl.DateTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      relativetime: cf((lng, opt) => {
        const formatter = new Intl.RelativeTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val, opt.range || "day");
      }),
      list: cf((lng, opt) => {
        const formatter = new Intl.ListFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      })
    };
  }
  add(name, fc) {
    this.formats[name.toLowerCase().trim()] = fc;
  }
  addCached(name, fc) {
    this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
  }
  format(value, format, lng, options = {}) {
    const formats = format.split(this.formatSeparator);
    if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
      const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
      formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
    }
    const result = formats.reduce((mem, f) => {
      var _a2;
      const {
        formatName,
        formatOptions
      } = parseFormatStr(f);
      if (this.formats[formatName]) {
        let formatted = mem;
        try {
          const valOptions = ((_a2 = options == null ? void 0 : options.formatParams) == null ? void 0 : _a2[options.interpolationkey]) || {};
          const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
          formatted = this.formats[formatName](mem, l, {
            ...formatOptions,
            ...options,
            ...valOptions
          });
        } catch (error2) {
          this.logger.warn(error2);
        }
        return formatted;
      } else {
        this.logger.warn(`there was no format function for ${formatName}`);
      }
      return mem;
    }, value);
    return result;
  }
}
const removePending = (q, name) => {
  if (q.pending[name] !== void 0) {
    delete q.pending[name];
    q.pendingCount--;
  }
};
class Connector extends EventEmitter {
  constructor(backend, store, services, options = {}) {
    var _a2, _b2;
    super();
    this.backend = backend;
    this.store = store;
    this.services = services;
    this.languageUtils = services.languageUtils;
    this.options = options;
    this.logger = baseLogger.create("backendConnector");
    this.waitingReads = [];
    this.maxParallelReads = options.maxParallelReads || 10;
    this.readingCalls = 0;
    this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
    this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
    this.state = {};
    this.queue = [];
    (_b2 = (_a2 = this.backend) == null ? void 0 : _a2.init) == null ? void 0 : _b2.call(_a2, services, options.backend, options);
  }
  queueLoad(languages, namespaces, options, callback) {
    const toLoad = {};
    const pending = {};
    const toLoadLanguages = {};
    const toLoadNamespaces = {};
    languages.forEach((lng) => {
      let hasAllNamespaces = true;
      namespaces.forEach((ns) => {
        const name = `${lng}|${ns}`;
        if (!options.reload && this.store.hasResourceBundle(lng, ns)) {
          this.state[name] = 2;
        } else if (this.state[name] < 0) ;
        else if (this.state[name] === 1) {
          if (pending[name] === void 0) pending[name] = true;
        } else {
          this.state[name] = 1;
          hasAllNamespaces = false;
          if (pending[name] === void 0) pending[name] = true;
          if (toLoad[name] === void 0) toLoad[name] = true;
          if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
        }
      });
      if (!hasAllNamespaces) toLoadLanguages[lng] = true;
    });
    if (Object.keys(toLoad).length || Object.keys(pending).length) {
      this.queue.push({
        pending,
        pendingCount: Object.keys(pending).length,
        loaded: {},
        errors: [],
        callback
      });
    }
    return {
      toLoad: Object.keys(toLoad),
      pending: Object.keys(pending),
      toLoadLanguages: Object.keys(toLoadLanguages),
      toLoadNamespaces: Object.keys(toLoadNamespaces)
    };
  }
  loaded(name, err, data) {
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    if (err) this.emit("failedLoading", lng, ns, err);
    if (!err && data) {
      this.store.addResourceBundle(lng, ns, data, void 0, void 0, {
        skipCopy: true
      });
    }
    this.state[name] = err ? -1 : 2;
    if (err && data) this.state[name] = 0;
    const loaded = {};
    this.queue.forEach((q) => {
      pushPath(q.loaded, [lng], ns);
      removePending(q, name);
      if (err) q.errors.push(err);
      if (q.pendingCount === 0 && !q.done) {
        Object.keys(q.loaded).forEach((l) => {
          if (!loaded[l]) loaded[l] = {};
          const loadedKeys = q.loaded[l];
          if (loadedKeys.length) {
            loadedKeys.forEach((n) => {
              if (loaded[l][n] === void 0) loaded[l][n] = true;
            });
          }
        });
        q.done = true;
        if (q.errors.length) {
          q.callback(q.errors);
        } else {
          q.callback();
        }
      }
    });
    this.emit("loaded", loaded);
    this.queue = this.queue.filter((q) => !q.done);
  }
  read(lng, ns, fcName, tried = 0, wait = this.retryTimeout, callback) {
    if (!lng.length) return callback(null, {});
    if (this.readingCalls >= this.maxParallelReads) {
      this.waitingReads.push({
        lng,
        ns,
        fcName,
        tried,
        wait,
        callback
      });
      return;
    }
    this.readingCalls++;
    const resolver = (err, data) => {
      this.readingCalls--;
      if (this.waitingReads.length > 0) {
        const next = this.waitingReads.shift();
        this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
      }
      if (err && data && tried < this.maxRetries) {
        setTimeout(() => {
          this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
        }, wait);
        return;
      }
      callback(err, data);
    };
    const fc = this.backend[fcName].bind(this.backend);
    if (fc.length === 2) {
      try {
        const r = fc(lng, ns);
        if (r && typeof r.then === "function") {
          r.then((data) => resolver(null, data)).catch(resolver);
        } else {
          resolver(null, r);
        }
      } catch (err) {
        resolver(err);
      }
      return;
    }
    return fc(lng, ns, resolver);
  }
  prepareLoading(languages, namespaces, options = {}, callback) {
    if (!this.backend) {
      this.logger.warn("No backend was added via i18next.use. Will not load resources.");
      return callback && callback();
    }
    if (isString$1(languages)) languages = this.languageUtils.toResolveHierarchy(languages);
    if (isString$1(namespaces)) namespaces = [namespaces];
    const toLoad = this.queueLoad(languages, namespaces, options, callback);
    if (!toLoad.toLoad.length) {
      if (!toLoad.pending.length) callback();
      return null;
    }
    toLoad.toLoad.forEach((name) => {
      this.loadOne(name);
    });
  }
  load(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {}, callback);
  }
  reload(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {
      reload: true
    }, callback);
  }
  loadOne(name, prefix = "") {
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    this.read(lng, ns, "read", void 0, void 0, (err, data) => {
      if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
      if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
      this.loaded(name, err, data);
    });
  }
  saveMissing(languages, namespace, key, fallbackValue, isUpdate, options = {}, clb = () => {
  }) {
    var _a2, _b2, _c, _d, _e;
    if (((_b2 = (_a2 = this.services) == null ? void 0 : _a2.utils) == null ? void 0 : _b2.hasLoadedNamespace) && !((_d = (_c = this.services) == null ? void 0 : _c.utils) == null ? void 0 : _d.hasLoadedNamespace(namespace))) {
      this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
      return;
    }
    if (key === void 0 || key === null || key === "") return;
    if ((_e = this.backend) == null ? void 0 : _e.create) {
      const opts = {
        ...options,
        isUpdate
      };
      const fc = this.backend.create.bind(this.backend);
      if (fc.length < 6) {
        try {
          let r;
          if (fc.length === 5) {
            r = fc(languages, namespace, key, fallbackValue, opts);
          } else {
            r = fc(languages, namespace, key, fallbackValue);
          }
          if (r && typeof r.then === "function") {
            r.then((data) => clb(null, data)).catch(clb);
          } else {
            clb(null, r);
          }
        } catch (err) {
          clb(err);
        }
      } else {
        fc(languages, namespace, key, fallbackValue, clb, opts);
      }
    }
    if (!languages || !languages[0]) return;
    this.store.addResource(languages[0], namespace, key, fallbackValue);
  }
}
const get = () => ({
  debug: false,
  initAsync: true,
  ns: ["translation"],
  defaultNS: ["translation"],
  fallbackLng: ["dev"],
  fallbackNS: false,
  supportedLngs: false,
  nonExplicitSupportedLngs: false,
  load: "all",
  preload: false,
  simplifyPluralSuffix: true,
  keySeparator: ".",
  nsSeparator: ":",
  pluralSeparator: "_",
  contextSeparator: "_",
  partialBundledLanguages: false,
  saveMissing: false,
  updateMissing: false,
  saveMissingTo: "fallback",
  saveMissingPlurals: true,
  missingKeyHandler: false,
  missingInterpolationHandler: false,
  postProcess: false,
  postProcessPassResolved: false,
  returnNull: false,
  returnEmptyString: true,
  returnObjects: false,
  joinArrays: false,
  returnedObjectHandler: false,
  parseMissingKeyHandler: false,
  appendNamespaceToMissingKey: false,
  appendNamespaceToCIMode: false,
  overloadTranslationOptionHandler: (args) => {
    let ret = {};
    if (typeof args[1] === "object") ret = args[1];
    if (isString$1(args[1])) ret.defaultValue = args[1];
    if (isString$1(args[2])) ret.tDescription = args[2];
    if (typeof args[2] === "object" || typeof args[3] === "object") {
      const options = args[3] || args[2];
      Object.keys(options).forEach((key) => {
        ret[key] = options[key];
      });
    }
    return ret;
  },
  interpolation: {
    escapeValue: true,
    format: (value) => value,
    prefix: "{{",
    suffix: "}}",
    formatSeparator: ",",
    unescapePrefix: "-",
    nestingPrefix: "$t(",
    nestingSuffix: ")",
    nestingOptionsSeparator: ",",
    maxReplaces: 1e3,
    skipOnVariables: true
  },
  cacheInBuiltFormats: true
});
const transformOptions = (options) => {
  var _a2, _b2;
  if (isString$1(options.ns)) options.ns = [options.ns];
  if (isString$1(options.fallbackLng)) options.fallbackLng = [options.fallbackLng];
  if (isString$1(options.fallbackNS)) options.fallbackNS = [options.fallbackNS];
  if (((_b2 = (_a2 = options.supportedLngs) == null ? void 0 : _a2.indexOf) == null ? void 0 : _b2.call(_a2, "cimode")) < 0) {
    options.supportedLngs = options.supportedLngs.concat(["cimode"]);
  }
  if (typeof options.initImmediate === "boolean") options.initAsync = options.initImmediate;
  return options;
};
const noop = () => {
};
const bindMemberFunctions = (inst) => {
  const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
  mems.forEach((mem) => {
    if (typeof inst[mem] === "function") {
      inst[mem] = inst[mem].bind(inst);
    }
  });
};
const SUPPORT_NOTICE_KEY = "__i18next_supportNoticeShown";
const getSupportNoticeShown = () => typeof globalThis !== "undefined" && !!globalThis[SUPPORT_NOTICE_KEY];
const setSupportNoticeShown = () => {
  if (typeof globalThis !== "undefined") globalThis[SUPPORT_NOTICE_KEY] = true;
};
const usesLocize = (inst) => {
  var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (((_c = (_b2 = (_a2 = inst == null ? void 0 : inst.modules) == null ? void 0 : _a2.backend) == null ? void 0 : _b2.name) == null ? void 0 : _c.indexOf("Locize")) > 0) return true;
  if (((_g = (_f = (_e = (_d = inst == null ? void 0 : inst.modules) == null ? void 0 : _d.backend) == null ? void 0 : _e.constructor) == null ? void 0 : _f.name) == null ? void 0 : _g.indexOf("Locize")) > 0) return true;
  if ((_i = (_h = inst == null ? void 0 : inst.options) == null ? void 0 : _h.backend) == null ? void 0 : _i.backends) {
    if (inst.options.backend.backends.some((b) => {
      var _a3, _b3, _c2;
      return ((_a3 = b == null ? void 0 : b.name) == null ? void 0 : _a3.indexOf("Locize")) > 0 || ((_c2 = (_b3 = b == null ? void 0 : b.constructor) == null ? void 0 : _b3.name) == null ? void 0 : _c2.indexOf("Locize")) > 0;
    })) return true;
  }
  if ((_k = (_j = inst == null ? void 0 : inst.options) == null ? void 0 : _j.backend) == null ? void 0 : _k.projectId) return true;
  if ((_m = (_l = inst == null ? void 0 : inst.options) == null ? void 0 : _l.backend) == null ? void 0 : _m.backendOptions) {
    if (inst.options.backend.backendOptions.some((b) => b == null ? void 0 : b.projectId)) return true;
  }
  return false;
};
class I18n extends EventEmitter {
  constructor(options = {}, callback) {
    super();
    this.options = transformOptions(options);
    this.services = {};
    this.logger = baseLogger;
    this.modules = {
      external: []
    };
    bindMemberFunctions(this);
    if (callback && !this.isInitialized && !options.isClone) {
      if (!this.options.initAsync) {
        this.init(options, callback);
        return this;
      }
      setTimeout(() => {
        this.init(options, callback);
      }, 0);
    }
  }
  init(options = {}, callback) {
    this.isInitializing = true;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (options.defaultNS == null && options.ns) {
      if (isString$1(options.ns)) {
        options.defaultNS = options.ns;
      } else if (options.ns.indexOf("translation") < 0) {
        options.defaultNS = options.ns[0];
      }
    }
    const defOpts = get();
    this.options = {
      ...defOpts,
      ...this.options,
      ...transformOptions(options)
    };
    this.options.interpolation = {
      ...defOpts.interpolation,
      ...this.options.interpolation
    };
    if (options.keySeparator !== void 0) {
      this.options.userDefinedKeySeparator = options.keySeparator;
    }
    if (options.nsSeparator !== void 0) {
      this.options.userDefinedNsSeparator = options.nsSeparator;
    }
    if (typeof this.options.overloadTranslationOptionHandler !== "function") {
      this.options.overloadTranslationOptionHandler = defOpts.overloadTranslationOptionHandler;
    }
    if (this.options.showSupportNotice !== false && !usesLocize(this) && !getSupportNoticeShown()) {
      if (typeof console !== "undefined" && typeof console.info !== "undefined") console.info("🌐 i18next is maintained with support from Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙");
      setSupportNoticeShown();
    }
    const createClassOnDemand = (ClassOrObject) => {
      if (!ClassOrObject) return null;
      if (typeof ClassOrObject === "function") return new ClassOrObject();
      return ClassOrObject;
    };
    if (!this.options.isClone) {
      if (this.modules.logger) {
        baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
      } else {
        baseLogger.init(null, this.options);
      }
      let formatter;
      if (this.modules.formatter) {
        formatter = this.modules.formatter;
      } else {
        formatter = Formatter;
      }
      const lu = new LanguageUtil(this.options);
      this.store = new ResourceStore(this.options.resources, this.options);
      const s = this.services;
      s.logger = baseLogger;
      s.resourceStore = this.store;
      s.languageUtils = lu;
      s.pluralResolver = new PluralResolver(lu, {
        prepend: this.options.pluralSeparator,
        simplifyPluralSuffix: this.options.simplifyPluralSuffix
      });
      const usingLegacyFormatFunction = this.options.interpolation.format && this.options.interpolation.format !== defOpts.interpolation.format;
      if (usingLegacyFormatFunction) {
        this.logger.deprecate(`init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting`);
      }
      if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
        s.formatter = createClassOnDemand(formatter);
        if (s.formatter.init) s.formatter.init(s, this.options);
        this.options.interpolation.format = s.formatter.format.bind(s.formatter);
      }
      s.interpolator = new Interpolator(this.options);
      s.utils = {
        hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
      };
      s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
      s.backendConnector.on("*", (event, ...args) => {
        this.emit(event, ...args);
      });
      if (this.modules.languageDetector) {
        s.languageDetector = createClassOnDemand(this.modules.languageDetector);
        if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
      }
      if (this.modules.i18nFormat) {
        s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
        if (s.i18nFormat.init) s.i18nFormat.init(this);
      }
      this.translator = new Translator(this.services, this.options);
      this.translator.on("*", (event, ...args) => {
        this.emit(event, ...args);
      });
      this.modules.external.forEach((m) => {
        if (m.init) m.init(this);
      });
    }
    this.format = this.options.interpolation.format;
    if (!callback) callback = noop;
    if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
      const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
      if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
    }
    if (!this.services.languageDetector && !this.options.lng) {
      this.logger.warn("init: no languageDetector is used and no lng is defined");
    }
    const storeApi = ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"];
    storeApi.forEach((fcName) => {
      this[fcName] = (...args) => this.store[fcName](...args);
    });
    const storeApiChained = ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"];
    storeApiChained.forEach((fcName) => {
      this[fcName] = (...args) => {
        this.store[fcName](...args);
        return this;
      };
    });
    const deferred = defer();
    const load = () => {
      const finish = (err, t) => {
        this.isInitializing = false;
        if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
        this.isInitialized = true;
        if (!this.options.isClone) this.logger.log("initialized", this.options);
        this.emit("initialized", this.options);
        deferred.resolve(t);
        callback(err, t);
      };
      if (this.languages && !this.isInitialized) return finish(null, this.t.bind(this));
      this.changeLanguage(this.options.lng, finish);
    };
    if (this.options.resources || !this.options.initAsync) {
      load();
    } else {
      setTimeout(load, 0);
    }
    return deferred;
  }
  loadResources(language, callback = noop) {
    var _a2, _b2;
    let usedCallback = callback;
    const usedLng = isString$1(language) ? language : this.language;
    if (typeof language === "function") usedCallback = language;
    if (!this.options.resources || this.options.partialBundledLanguages) {
      if ((usedLng == null ? void 0 : usedLng.toLowerCase()) === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
      const toLoad = [];
      const append = (lng) => {
        if (!lng) return;
        if (lng === "cimode") return;
        const lngs = this.services.languageUtils.toResolveHierarchy(lng);
        lngs.forEach((l) => {
          if (l === "cimode") return;
          if (toLoad.indexOf(l) < 0) toLoad.push(l);
        });
      };
      if (!usedLng) {
        const fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        fallbacks.forEach((l) => append(l));
      } else {
        append(usedLng);
      }
      (_b2 = (_a2 = this.options.preload) == null ? void 0 : _a2.forEach) == null ? void 0 : _b2.call(_a2, (l) => append(l));
      this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
        if (!e && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
        usedCallback(e);
      });
    } else {
      usedCallback(null);
    }
  }
  reloadResources(lngs, ns, callback) {
    const deferred = defer();
    if (typeof lngs === "function") {
      callback = lngs;
      lngs = void 0;
    }
    if (typeof ns === "function") {
      callback = ns;
      ns = void 0;
    }
    if (!lngs) lngs = this.languages;
    if (!ns) ns = this.options.ns;
    if (!callback) callback = noop;
    this.services.backendConnector.reload(lngs, ns, (err) => {
      deferred.resolve();
      callback(err);
    });
    return deferred;
  }
  use(module) {
    if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
    if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
    if (module.type === "backend") {
      this.modules.backend = module;
    }
    if (module.type === "logger" || module.log && module.warn && module.error) {
      this.modules.logger = module;
    }
    if (module.type === "languageDetector") {
      this.modules.languageDetector = module;
    }
    if (module.type === "i18nFormat") {
      this.modules.i18nFormat = module;
    }
    if (module.type === "postProcessor") {
      postProcessor.addPostProcessor(module);
    }
    if (module.type === "formatter") {
      this.modules.formatter = module;
    }
    if (module.type === "3rdParty") {
      this.modules.external.push(module);
    }
    return this;
  }
  setResolvedLanguage(l) {
    if (!l || !this.languages) return;
    if (["cimode", "dev"].indexOf(l) > -1) return;
    for (let li = 0; li < this.languages.length; li++) {
      const lngInLngs = this.languages[li];
      if (["cimode", "dev"].indexOf(lngInLngs) > -1) continue;
      if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
        this.resolvedLanguage = lngInLngs;
        break;
      }
    }
    if (!this.resolvedLanguage && this.languages.indexOf(l) < 0 && this.store.hasLanguageSomeTranslations(l)) {
      this.resolvedLanguage = l;
      this.languages.unshift(l);
    }
  }
  changeLanguage(lng, callback) {
    this.isLanguageChangingTo = lng;
    const deferred = defer();
    this.emit("languageChanging", lng);
    const setLngProps = (l) => {
      this.language = l;
      this.languages = this.services.languageUtils.toResolveHierarchy(l);
      this.resolvedLanguage = void 0;
      this.setResolvedLanguage(l);
    };
    const done = (err, l) => {
      if (l) {
        if (this.isLanguageChangingTo === lng) {
          setLngProps(l);
          this.translator.changeLanguage(l);
          this.isLanguageChangingTo = void 0;
          this.emit("languageChanged", l);
          this.logger.log("languageChanged", l);
        }
      } else {
        this.isLanguageChangingTo = void 0;
      }
      deferred.resolve((...args) => this.t(...args));
      if (callback) callback(err, (...args) => this.t(...args));
    };
    const setLng = (lngs) => {
      var _a2, _b2;
      if (!lng && !lngs && this.services.languageDetector) lngs = [];
      const fl = isString$1(lngs) ? lngs : lngs && lngs[0];
      const l = this.store.hasLanguageSomeTranslations(fl) ? fl : this.services.languageUtils.getBestMatchFromCodes(isString$1(lngs) ? [lngs] : lngs);
      if (l) {
        if (!this.language) {
          setLngProps(l);
        }
        if (!this.translator.language) this.translator.changeLanguage(l);
        (_b2 = (_a2 = this.services.languageDetector) == null ? void 0 : _a2.cacheUserLanguage) == null ? void 0 : _b2.call(_a2, l);
      }
      this.loadResources(l, (err) => {
        done(err, l);
      });
    };
    if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
      setLng(this.services.languageDetector.detect());
    } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
      if (this.services.languageDetector.detect.length === 0) {
        this.services.languageDetector.detect().then(setLng);
      } else {
        this.services.languageDetector.detect(setLng);
      }
    } else {
      setLng(lng);
    }
    return deferred;
  }
  getFixedT(lng, ns, keyPrefix) {
    const fixedT = (key, opts, ...rest) => {
      let o;
      if (typeof opts !== "object") {
        o = this.options.overloadTranslationOptionHandler([key, opts].concat(rest));
      } else {
        o = {
          ...opts
        };
      }
      o.lng = o.lng || fixedT.lng;
      o.lngs = o.lngs || fixedT.lngs;
      o.ns = o.ns || fixedT.ns;
      if (o.keyPrefix !== "") o.keyPrefix = o.keyPrefix || keyPrefix || fixedT.keyPrefix;
      const keySeparator = this.options.keySeparator || ".";
      let resultKey;
      if (o.keyPrefix && Array.isArray(key)) {
        resultKey = key.map((k) => {
          if (typeof k === "function") k = keysFromSelector(k, {
            ...this.options,
            ...opts
          });
          return `${o.keyPrefix}${keySeparator}${k}`;
        });
      } else {
        if (typeof key === "function") key = keysFromSelector(key, {
          ...this.options,
          ...opts
        });
        resultKey = o.keyPrefix ? `${o.keyPrefix}${keySeparator}${key}` : key;
      }
      return this.t(resultKey, o);
    };
    if (isString$1(lng)) {
      fixedT.lng = lng;
    } else {
      fixedT.lngs = lng;
    }
    fixedT.ns = ns;
    fixedT.keyPrefix = keyPrefix;
    return fixedT;
  }
  t(...args) {
    var _a2;
    return (_a2 = this.translator) == null ? void 0 : _a2.translate(...args);
  }
  exists(...args) {
    var _a2;
    return (_a2 = this.translator) == null ? void 0 : _a2.exists(...args);
  }
  setDefaultNamespace(ns) {
    this.options.defaultNS = ns;
  }
  hasLoadedNamespace(ns, options = {}) {
    if (!this.isInitialized) {
      this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
      return false;
    }
    if (!this.languages || !this.languages.length) {
      this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
      return false;
    }
    const lng = options.lng || this.resolvedLanguage || this.languages[0];
    const fallbackLng = this.options ? this.options.fallbackLng : false;
    const lastLng = this.languages[this.languages.length - 1];
    if (lng.toLowerCase() === "cimode") return true;
    const loadNotPending = (l, n) => {
      const loadState = this.services.backendConnector.state[`${l}|${n}`];
      return loadState === -1 || loadState === 0 || loadState === 2;
    };
    if (options.precheck) {
      const preResult = options.precheck(this, loadNotPending);
      if (preResult !== void 0) return preResult;
    }
    if (this.hasResourceBundle(lng, ns)) return true;
    if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
    if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
    return false;
  }
  loadNamespaces(ns, callback) {
    const deferred = defer();
    if (!this.options.ns) {
      if (callback) callback();
      return Promise.resolve();
    }
    if (isString$1(ns)) ns = [ns];
    ns.forEach((n) => {
      if (this.options.ns.indexOf(n) < 0) this.options.ns.push(n);
    });
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  loadLanguages(lngs, callback) {
    const deferred = defer();
    if (isString$1(lngs)) lngs = [lngs];
    const preloaded = this.options.preload || [];
    const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
    if (!newLngs.length) {
      if (callback) callback();
      return Promise.resolve();
    }
    this.options.preload = preloaded.concat(newLngs);
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  dir(lng) {
    var _a2, _b2;
    if (!lng) lng = this.resolvedLanguage || (((_a2 = this.languages) == null ? void 0 : _a2.length) > 0 ? this.languages[0] : this.language);
    if (!lng) return "rtl";
    try {
      const l = new Intl.Locale(lng);
      if (l && l.getTextInfo) {
        const ti = l.getTextInfo();
        if (ti && ti.direction) return ti.direction;
      }
    } catch (e) {
    }
    const rtlLngs = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"];
    const languageUtils = ((_b2 = this.services) == null ? void 0 : _b2.languageUtils) || new LanguageUtil(get());
    if (lng.toLowerCase().indexOf("-latn") > 1) return "ltr";
    return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
  }
  static createInstance(options = {}, callback) {
    const instance2 = new I18n(options, callback);
    instance2.createInstance = I18n.createInstance;
    return instance2;
  }
  cloneInstance(options = {}, callback = noop) {
    const forkResourceStore = options.forkResourceStore;
    if (forkResourceStore) delete options.forkResourceStore;
    const mergedOptions = {
      ...this.options,
      ...options,
      ...{
        isClone: true
      }
    };
    const clone = new I18n(mergedOptions);
    if (options.debug !== void 0 || options.prefix !== void 0) {
      clone.logger = clone.logger.clone(options);
    }
    const membersToCopy = ["store", "services", "language"];
    membersToCopy.forEach((m) => {
      clone[m] = this[m];
    });
    clone.services = {
      ...this.services
    };
    clone.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    if (forkResourceStore) {
      const clonedData = Object.keys(this.store.data).reduce((prev, l) => {
        prev[l] = {
          ...this.store.data[l]
        };
        prev[l] = Object.keys(prev[l]).reduce((acc, n) => {
          acc[n] = {
            ...prev[l][n]
          };
          return acc;
        }, prev[l]);
        return prev;
      }, {});
      clone.store = new ResourceStore(clonedData, mergedOptions);
      clone.services.resourceStore = clone.store;
    }
    if (options.interpolation) {
      const defOpts = get();
      const mergedInterpolation = {
        ...defOpts.interpolation,
        ...this.options.interpolation,
        ...options.interpolation
      };
      const mergedForInterpolator = {
        ...mergedOptions,
        interpolation: mergedInterpolation
      };
      clone.services.interpolator = new Interpolator(mergedForInterpolator);
    }
    clone.translator = new Translator(clone.services, mergedOptions);
    clone.translator.on("*", (event, ...args) => {
      clone.emit(event, ...args);
    });
    clone.init(mergedOptions, callback);
    clone.translator.options = mergedOptions;
    clone.translator.backendConnector.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    return clone;
  }
  toJSON() {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage
    };
  }
}
const instance = I18n.createInstance();
instance.createInstance;
instance.dir;
instance.init;
instance.loadResources;
instance.reloadResources;
instance.use;
instance.changeLanguage;
instance.getFixedT;
instance.t;
instance.exists;
instance.setDefaultNamespace;
instance.hasLoadedNamespace;
instance.loadNamespaces;
instance.loadLanguages;
var TAG_NAMES = /* @__PURE__ */ ((TAG_NAMES2) => {
  TAG_NAMES2["BASE"] = "base";
  TAG_NAMES2["BODY"] = "body";
  TAG_NAMES2["HEAD"] = "head";
  TAG_NAMES2["HTML"] = "html";
  TAG_NAMES2["LINK"] = "link";
  TAG_NAMES2["META"] = "meta";
  TAG_NAMES2["NOSCRIPT"] = "noscript";
  TAG_NAMES2["SCRIPT"] = "script";
  TAG_NAMES2["STYLE"] = "style";
  TAG_NAMES2["TITLE"] = "title";
  TAG_NAMES2["FRAGMENT"] = "Symbol(react.fragment)";
  return TAG_NAMES2;
})(TAG_NAMES || {});
var SEO_PRIORITY_TAGS = {
  link: { rel: ["amphtml", "canonical", "alternate"] },
  script: { type: ["application/ld+json"] },
  meta: {
    charset: "",
    name: ["generator", "robots", "description"],
    property: [
      "og:type",
      "og:title",
      "og:url",
      "og:image",
      "og:image:alt",
      "og:description",
      "twitter:url",
      "twitter:title",
      "twitter:description",
      "twitter:image",
      "twitter:image:alt",
      "twitter:card",
      "twitter:site"
    ]
  }
};
var VALID_TAG_NAMES = Object.values(TAG_NAMES);
var REACT_TAG_MAP = {
  accesskey: "accessKey",
  charset: "charSet",
  class: "className",
  contenteditable: "contentEditable",
  contextmenu: "contextMenu",
  "http-equiv": "httpEquiv",
  itemprop: "itemProp",
  tabindex: "tabIndex"
};
var HTML_TAG_MAP = Object.entries(REACT_TAG_MAP).reduce(
  (carry, [key, value]) => {
    carry[value] = key;
    return carry;
  },
  {}
);
var HELMET_ATTRIBUTE = "data-rh";
var HELMET_PROPS = {
  DEFAULT_TITLE: "defaultTitle",
  DEFER: "defer",
  ENCODE_SPECIAL_CHARACTERS: "encodeSpecialCharacters",
  ON_CHANGE_CLIENT_STATE: "onChangeClientState",
  TITLE_TEMPLATE: "titleTemplate",
  PRIORITIZE_SEO_TAGS: "prioritizeSeoTags"
};
var getInnermostProperty = (propsList, property) => {
  for (let i = propsList.length - 1; i >= 0; i -= 1) {
    const props = propsList[i];
    if (Object.prototype.hasOwnProperty.call(props, property)) {
      return props[property];
    }
  }
  return null;
};
var getTitleFromPropsList = (propsList) => {
  let innermostTitle = getInnermostProperty(
    propsList,
    "title"
    /* TITLE */
  );
  const innermostTemplate = getInnermostProperty(propsList, HELMET_PROPS.TITLE_TEMPLATE);
  if (Array.isArray(innermostTitle)) {
    innermostTitle = innermostTitle.join("");
  }
  if (innermostTemplate && innermostTitle) {
    return innermostTemplate.replace(/%s/g, () => innermostTitle);
  }
  const innermostDefaultTitle = getInnermostProperty(propsList, HELMET_PROPS.DEFAULT_TITLE);
  return innermostTitle || innermostDefaultTitle || void 0;
};
var getOnChangeClientState = (propsList) => getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE) || (() => {
});
var getAttributesFromPropsList = (tagType, propsList) => propsList.filter((props) => typeof props[tagType] !== "undefined").map((props) => props[tagType]).reduce((tagAttrs, current) => ({ ...tagAttrs, ...current }), {});
var getBaseTagFromPropsList = (primaryAttributes, propsList) => propsList.filter((props) => typeof props[
  "base"
  /* BASE */
] !== "undefined").map((props) => props[
  "base"
  /* BASE */
]).reverse().reduce((innermostBaseTag, tag) => {
  if (!innermostBaseTag.length) {
    const keys = Object.keys(tag);
    for (let i = 0; i < keys.length; i += 1) {
      const attributeKey = keys[i];
      const lowerCaseAttributeKey = attributeKey.toLowerCase();
      if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && tag[lowerCaseAttributeKey]) {
        return innermostBaseTag.concat(tag);
      }
    }
  }
  return innermostBaseTag;
}, []);
var warn$1 = (msg) => console && typeof console.warn === "function" && console.warn(msg);
var getTagsFromPropsList = (tagName, primaryAttributes, propsList) => {
  const approvedSeenTags = {};
  return propsList.filter((props) => {
    if (Array.isArray(props[tagName])) {
      return true;
    }
    if (typeof props[tagName] !== "undefined") {
      warn$1(
        `Helmet: ${tagName} should be of type "Array". Instead found type "${typeof props[tagName]}"`
      );
    }
    return false;
  }).map((props) => props[tagName]).reverse().reduce((approvedTags, instanceTags) => {
    const instanceSeenTags = {};
    instanceTags.filter((tag) => {
      let primaryAttributeKey;
      const keys2 = Object.keys(tag);
      for (let i = 0; i < keys2.length; i += 1) {
        const attributeKey = keys2[i];
        const lowerCaseAttributeKey = attributeKey.toLowerCase();
        if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && !(primaryAttributeKey === "rel" && tag[primaryAttributeKey].toLowerCase() === "canonical") && !(lowerCaseAttributeKey === "rel" && tag[lowerCaseAttributeKey].toLowerCase() === "stylesheet")) {
          primaryAttributeKey = lowerCaseAttributeKey;
        }
        if (primaryAttributes.indexOf(attributeKey) !== -1 && (attributeKey === "innerHTML" || attributeKey === "cssText" || attributeKey === "itemprop")) {
          primaryAttributeKey = attributeKey;
        }
      }
      if (!primaryAttributeKey || !tag[primaryAttributeKey]) {
        return false;
      }
      const value = tag[primaryAttributeKey].toLowerCase();
      if (!approvedSeenTags[primaryAttributeKey]) {
        approvedSeenTags[primaryAttributeKey] = {};
      }
      if (!instanceSeenTags[primaryAttributeKey]) {
        instanceSeenTags[primaryAttributeKey] = {};
      }
      if (!approvedSeenTags[primaryAttributeKey][value]) {
        instanceSeenTags[primaryAttributeKey][value] = true;
        return true;
      }
      return false;
    }).reverse().forEach((tag) => approvedTags.push(tag));
    const keys = Object.keys(instanceSeenTags);
    for (let i = 0; i < keys.length; i += 1) {
      const attributeKey = keys[i];
      const tagUnion = {
        ...approvedSeenTags[attributeKey],
        ...instanceSeenTags[attributeKey]
      };
      approvedSeenTags[attributeKey] = tagUnion;
    }
    return approvedTags;
  }, []).reverse();
};
var getAnyTrueFromPropsList = (propsList, checkedTag) => {
  if (Array.isArray(propsList) && propsList.length) {
    for (let index = 0; index < propsList.length; index += 1) {
      const prop = propsList[index];
      if (prop[checkedTag]) {
        return true;
      }
    }
  }
  return false;
};
var reducePropsToState = (propsList) => ({
  baseTag: getBaseTagFromPropsList([
    "href"
    /* HREF */
  ], propsList),
  bodyAttributes: getAttributesFromPropsList("bodyAttributes", propsList),
  defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER),
  encode: getInnermostProperty(propsList, HELMET_PROPS.ENCODE_SPECIAL_CHARACTERS),
  htmlAttributes: getAttributesFromPropsList("htmlAttributes", propsList),
  linkTags: getTagsFromPropsList(
    "link",
    [
      "rel",
      "href"
      /* HREF */
    ],
    propsList
  ),
  metaTags: getTagsFromPropsList(
    "meta",
    [
      "name",
      "charset",
      "http-equiv",
      "property",
      "itemprop"
      /* ITEM_PROP */
    ],
    propsList
  ),
  noscriptTags: getTagsFromPropsList("noscript", [
    "innerHTML"
    /* INNER_HTML */
  ], propsList),
  onChangeClientState: getOnChangeClientState(propsList),
  scriptTags: getTagsFromPropsList(
    "script",
    [
      "src",
      "innerHTML"
      /* INNER_HTML */
    ],
    propsList
  ),
  styleTags: getTagsFromPropsList("style", [
    "cssText"
    /* CSS_TEXT */
  ], propsList),
  title: getTitleFromPropsList(propsList),
  titleAttributes: getAttributesFromPropsList("titleAttributes", propsList),
  prioritizeSeoTags: getAnyTrueFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS)
});
var flattenArray = (possibleArray) => Array.isArray(possibleArray) ? possibleArray.join("") : possibleArray;
var checkIfPropsMatch = (props, toMatch) => {
  const keys = Object.keys(props);
  for (let i = 0; i < keys.length; i += 1) {
    if (toMatch[keys[i]] && toMatch[keys[i]].includes(props[keys[i]])) {
      return true;
    }
  }
  return false;
};
var prioritizer = (elementsList, propsToMatch) => {
  if (Array.isArray(elementsList)) {
    return elementsList.reduce(
      (acc, elementAttrs) => {
        if (checkIfPropsMatch(elementAttrs, propsToMatch)) {
          acc.priority.push(elementAttrs);
        } else {
          acc.default.push(elementAttrs);
        }
        return acc;
      },
      { priority: [], default: [] }
    );
  }
  return { default: elementsList, priority: [] };
};
var without = (obj, key) => {
  return {
    ...obj,
    [key]: void 0
  };
};
var SELF_CLOSING_TAGS = [
  "noscript",
  "script",
  "style"
  /* STYLE */
];
var encodeSpecialCharacters = (str, encode = true) => {
  if (encode === false) {
    return String(str);
  }
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
};
var generateElementAttributesAsString = (attributes) => Object.keys(attributes).reduce((str, key) => {
  const attr = typeof attributes[key] !== "undefined" ? `${key}="${attributes[key]}"` : `${key}`;
  return str ? `${str} ${attr}` : attr;
}, "");
var generateTitleAsString = (type, title, attributes, encode) => {
  const attributeString = generateElementAttributesAsString(attributes);
  const flattenedTitle = flattenArray(title);
  return attributeString ? `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}>${encodeSpecialCharacters(
    flattenedTitle,
    encode
  )}</${type}>` : `<${type} ${HELMET_ATTRIBUTE}="true">${encodeSpecialCharacters(
    flattenedTitle,
    encode
  )}</${type}>`;
};
var generateTagsAsString = (type, tags, encode = true) => tags.reduce((str, t) => {
  const tag = t;
  const attributeHtml = Object.keys(tag).filter(
    (attribute) => !(attribute === "innerHTML" || attribute === "cssText")
  ).reduce((string, attribute) => {
    const attr = typeof tag[attribute] === "undefined" ? attribute : `${attribute}="${encodeSpecialCharacters(tag[attribute], encode)}"`;
    return string ? `${string} ${attr}` : attr;
  }, "");
  const tagContent = tag.innerHTML || tag.cssText || "";
  const isSelfClosing = SELF_CLOSING_TAGS.indexOf(type) === -1;
  return `${str}<${type} ${HELMET_ATTRIBUTE}="true" ${attributeHtml}${isSelfClosing ? `/>` : `>${tagContent}</${type}>`}`;
}, "");
var convertElementAttributesToReactProps = (attributes, initProps = {}) => Object.keys(attributes).reduce((obj, key) => {
  const mapped = REACT_TAG_MAP[key];
  obj[mapped || key] = attributes[key];
  return obj;
}, initProps);
var generateTitleAsReactComponent = (_type, title, attributes) => {
  const initProps = {
    key: title,
    [HELMET_ATTRIBUTE]: true
  };
  const props = convertElementAttributesToReactProps(attributes, initProps);
  return [React.createElement("title", props, title)];
};
var generateTagsAsReactComponent = (type, tags) => tags.map((tag, i) => {
  const mappedTag = {
    key: i,
    [HELMET_ATTRIBUTE]: true
  };
  Object.keys(tag).forEach((attribute) => {
    const mapped = REACT_TAG_MAP[attribute];
    const mappedAttribute = mapped || attribute;
    if (mappedAttribute === "innerHTML" || mappedAttribute === "cssText") {
      const content = tag.innerHTML || tag.cssText;
      mappedTag.dangerouslySetInnerHTML = { __html: content };
    } else {
      mappedTag[mappedAttribute] = tag[attribute];
    }
  });
  return React.createElement(type, mappedTag);
});
var getMethodsForTag = (type, tags, encode = true) => {
  switch (type) {
    case "title":
      return {
        toComponent: () => generateTitleAsReactComponent(type, tags.title, tags.titleAttributes),
        toString: () => generateTitleAsString(type, tags.title, tags.titleAttributes, encode)
      };
    case "bodyAttributes":
    case "htmlAttributes":
      return {
        toComponent: () => convertElementAttributesToReactProps(tags),
        toString: () => generateElementAttributesAsString(tags)
      };
    default:
      return {
        toComponent: () => generateTagsAsReactComponent(type, tags),
        toString: () => generateTagsAsString(type, tags, encode)
      };
  }
};
var getPriorityMethods = ({ metaTags, linkTags, scriptTags, encode }) => {
  const meta2 = prioritizer(metaTags, SEO_PRIORITY_TAGS.meta);
  const link = prioritizer(linkTags, SEO_PRIORITY_TAGS.link);
  const script = prioritizer(scriptTags, SEO_PRIORITY_TAGS.script);
  const priorityMethods = {
    toComponent: () => [
      ...generateTagsAsReactComponent("meta", meta2.priority),
      ...generateTagsAsReactComponent("link", link.priority),
      ...generateTagsAsReactComponent("script", script.priority)
    ],
    toString: () => (
      // generate all the tags as strings and concatenate them
      `${getMethodsForTag("meta", meta2.priority, encode)} ${getMethodsForTag(
        "link",
        link.priority,
        encode
      )} ${getMethodsForTag("script", script.priority, encode)}`
    )
  };
  return {
    priorityMethods,
    metaTags: meta2.default,
    linkTags: link.default,
    scriptTags: script.default
  };
};
var mapStateOnServer = (props) => {
  const {
    baseTag,
    bodyAttributes,
    encode = true,
    htmlAttributes,
    noscriptTags,
    styleTags,
    title = "",
    titleAttributes,
    prioritizeSeoTags
  } = props;
  let { linkTags, metaTags, scriptTags } = props;
  let priorityMethods = {
    toComponent: () => {
    },
    toString: () => ""
  };
  if (prioritizeSeoTags) {
    ({ priorityMethods, linkTags, metaTags, scriptTags } = getPriorityMethods(props));
  }
  return {
    priority: priorityMethods,
    base: getMethodsForTag("base", baseTag, encode),
    bodyAttributes: getMethodsForTag("bodyAttributes", bodyAttributes, encode),
    htmlAttributes: getMethodsForTag("htmlAttributes", htmlAttributes, encode),
    link: getMethodsForTag("link", linkTags, encode),
    meta: getMethodsForTag("meta", metaTags, encode),
    noscript: getMethodsForTag("noscript", noscriptTags, encode),
    script: getMethodsForTag("script", scriptTags, encode),
    style: getMethodsForTag("style", styleTags, encode),
    title: getMethodsForTag("title", { title, titleAttributes }, encode)
  };
};
var server_default = mapStateOnServer;
var instances = [];
var isDocument = !!(typeof window !== "undefined" && window.document && window.document.createElement);
var HelmetData = class {
  constructor(context, canUseDOM) {
    __publicField(this, "instances", []);
    __publicField(this, "canUseDOM", isDocument);
    __publicField(this, "context");
    __publicField(this, "value", {
      setHelmet: (serverState) => {
        this.context.helmet = serverState;
      },
      helmetInstances: {
        get: () => this.canUseDOM ? instances : this.instances,
        add: (instance2) => {
          (this.canUseDOM ? instances : this.instances).push(instance2);
        },
        remove: (instance2) => {
          const index = (this.canUseDOM ? instances : this.instances).indexOf(instance2);
          (this.canUseDOM ? instances : this.instances).splice(index, 1);
        }
      }
    });
    this.context = context;
    this.canUseDOM = canUseDOM || false;
    if (!canUseDOM) {
      context.helmet = server_default({
        baseTag: [],
        bodyAttributes: {},
        htmlAttributes: {},
        linkTags: [],
        metaTags: [],
        noscriptTags: [],
        scriptTags: [],
        styleTags: [],
        title: "",
        titleAttributes: {}
      });
    }
  }
};
var defaultValue = {};
var Context = React.createContext(defaultValue);
var HelmetProvider = (_a = class extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "helmetData");
    this.helmetData = new HelmetData(this.props.context || {}, _a.canUseDOM);
  }
  render() {
    return /* @__PURE__ */ React.createElement(Context.Provider, { value: this.helmetData.value }, this.props.children);
  }
}, __publicField(_a, "canUseDOM", isDocument), _a);
var updateTags = (type, tags) => {
  const headElement = document.head || document.querySelector(
    "head"
    /* HEAD */
  );
  const tagNodes = headElement.querySelectorAll(`${type}[${HELMET_ATTRIBUTE}]`);
  const oldTags = [].slice.call(tagNodes);
  const newTags = [];
  let indexToDelete;
  if (tags && tags.length) {
    tags.forEach((tag) => {
      const newElement = document.createElement(type);
      for (const attribute in tag) {
        if (Object.prototype.hasOwnProperty.call(tag, attribute)) {
          if (attribute === "innerHTML") {
            newElement.innerHTML = tag.innerHTML;
          } else if (attribute === "cssText") {
            if (newElement.styleSheet) {
              newElement.styleSheet.cssText = tag.cssText;
            } else {
              newElement.appendChild(document.createTextNode(tag.cssText));
            }
          } else {
            const attr = attribute;
            const value = typeof tag[attr] === "undefined" ? "" : tag[attr];
            newElement.setAttribute(attribute, value);
          }
        }
      }
      newElement.setAttribute(HELMET_ATTRIBUTE, "true");
      if (oldTags.some((existingTag, index) => {
        indexToDelete = index;
        return newElement.isEqualNode(existingTag);
      })) {
        oldTags.splice(indexToDelete, 1);
      } else {
        newTags.push(newElement);
      }
    });
  }
  oldTags.forEach((tag) => {
    var _a2;
    return (_a2 = tag.parentNode) == null ? void 0 : _a2.removeChild(tag);
  });
  newTags.forEach((tag) => headElement.appendChild(tag));
  return {
    oldTags,
    newTags
  };
};
var updateAttributes = (tagName, attributes) => {
  const elementTag = document.getElementsByTagName(tagName)[0];
  if (!elementTag) {
    return;
  }
  const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
  const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(",") : [];
  const attributesToRemove = [...helmetAttributes];
  const attributeKeys = Object.keys(attributes);
  for (const attribute of attributeKeys) {
    const value = attributes[attribute] || "";
    if (elementTag.getAttribute(attribute) !== value) {
      elementTag.setAttribute(attribute, value);
    }
    if (helmetAttributes.indexOf(attribute) === -1) {
      helmetAttributes.push(attribute);
    }
    const indexToSave = attributesToRemove.indexOf(attribute);
    if (indexToSave !== -1) {
      attributesToRemove.splice(indexToSave, 1);
    }
  }
  for (let i = attributesToRemove.length - 1; i >= 0; i -= 1) {
    elementTag.removeAttribute(attributesToRemove[i]);
  }
  if (helmetAttributes.length === attributesToRemove.length) {
    elementTag.removeAttribute(HELMET_ATTRIBUTE);
  } else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeys.join(",")) {
    elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeys.join(","));
  }
};
var updateTitle = (title, attributes) => {
  if (typeof title !== "undefined" && document.title !== title) {
    document.title = flattenArray(title);
  }
  updateAttributes("title", attributes);
};
var commitTagChanges = (newState, cb) => {
  const {
    baseTag,
    bodyAttributes,
    htmlAttributes,
    linkTags,
    metaTags,
    noscriptTags,
    onChangeClientState,
    scriptTags,
    styleTags,
    title,
    titleAttributes
  } = newState;
  updateAttributes("body", bodyAttributes);
  updateAttributes("html", htmlAttributes);
  updateTitle(title, titleAttributes);
  const tagUpdates = {
    baseTag: updateTags("base", baseTag),
    linkTags: updateTags("link", linkTags),
    metaTags: updateTags("meta", metaTags),
    noscriptTags: updateTags("noscript", noscriptTags),
    scriptTags: updateTags("script", scriptTags),
    styleTags: updateTags("style", styleTags)
  };
  const addedTags = {};
  const removedTags = {};
  Object.keys(tagUpdates).forEach((tagType) => {
    const { newTags, oldTags } = tagUpdates[tagType];
    if (newTags.length) {
      addedTags[tagType] = newTags;
    }
    if (oldTags.length) {
      removedTags[tagType] = tagUpdates[tagType].oldTags;
    }
  });
  if (cb) {
    cb();
  }
  onChangeClientState(newState, addedTags, removedTags);
};
var _helmetCallback = null;
var handleStateChangeOnClient = (newState) => {
  if (_helmetCallback) {
    cancelAnimationFrame(_helmetCallback);
  }
  if (newState.defer) {
    _helmetCallback = requestAnimationFrame(() => {
      commitTagChanges(newState, () => {
        _helmetCallback = null;
      });
    });
  } else {
    commitTagChanges(newState);
    _helmetCallback = null;
  }
};
var client_default = handleStateChangeOnClient;
var HelmetDispatcher = class extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "rendered", false);
  }
  shouldComponentUpdate(nextProps) {
    return !shallowEqual(nextProps, this.props);
  }
  componentDidUpdate() {
    this.emitChange();
  }
  componentWillUnmount() {
    const { helmetInstances } = this.props.context;
    helmetInstances.remove(this);
    this.emitChange();
  }
  emitChange() {
    const { helmetInstances, setHelmet } = this.props.context;
    let serverState = null;
    const state = reducePropsToState(
      helmetInstances.get().map((instance2) => {
        const props = { ...instance2.props };
        delete props.context;
        return props;
      })
    );
    if (HelmetProvider.canUseDOM) {
      client_default(state);
    } else if (server_default) {
      serverState = server_default(state);
    }
    setHelmet(serverState);
  }
  // componentWillMount will be deprecated
  // for SSR, initialize on first render
  // constructor is also unsafe in StrictMode
  init() {
    if (this.rendered) {
      return;
    }
    this.rendered = true;
    const { helmetInstances } = this.props.context;
    helmetInstances.add(this);
    this.emitChange();
  }
  render() {
    this.init();
    return null;
  }
};
var Helmet = (_b = class extends Component {
  shouldComponentUpdate(nextProps) {
    return !fastCompare(without(this.props, "helmetData"), without(nextProps, "helmetData"));
  }
  mapNestedChildrenToProps(child, nestedChildren) {
    if (!nestedChildren) {
      return null;
    }
    switch (child.type) {
      case "script":
      case "noscript":
        return {
          innerHTML: nestedChildren
        };
      case "style":
        return {
          cssText: nestedChildren
        };
      default:
        throw new Error(
          `<${child.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`
        );
    }
  }
  flattenArrayTypeChildren(child, arrayTypeChildren, newChildProps, nestedChildren) {
    return {
      ...arrayTypeChildren,
      [child.type]: [
        ...arrayTypeChildren[child.type] || [],
        {
          ...newChildProps,
          ...this.mapNestedChildrenToProps(child, nestedChildren)
        }
      ]
    };
  }
  mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren) {
    switch (child.type) {
      case "title":
        return {
          ...newProps,
          [child.type]: nestedChildren,
          titleAttributes: { ...newChildProps }
        };
      case "body":
        return {
          ...newProps,
          bodyAttributes: { ...newChildProps }
        };
      case "html":
        return {
          ...newProps,
          htmlAttributes: { ...newChildProps }
        };
      default:
        return {
          ...newProps,
          [child.type]: { ...newChildProps }
        };
    }
  }
  mapArrayTypeChildrenToProps(arrayTypeChildren, newProps) {
    let newFlattenedProps = { ...newProps };
    Object.keys(arrayTypeChildren).forEach((arrayChildName) => {
      newFlattenedProps = {
        ...newFlattenedProps,
        [arrayChildName]: arrayTypeChildren[arrayChildName]
      };
    });
    return newFlattenedProps;
  }
  warnOnInvalidChildren(child, nestedChildren) {
    invariant(
      VALID_TAG_NAMES.some((name) => child.type === name),
      typeof child.type === "function" ? `You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.` : `Only elements types ${VALID_TAG_NAMES.join(
        ", "
      )} are allowed. Helmet does not support rendering <${child.type}> elements. Refer to our API for more information.`
    );
    invariant(
      !nestedChildren || typeof nestedChildren === "string" || Array.isArray(nestedChildren) && !nestedChildren.some((nestedChild) => typeof nestedChild !== "string"),
      `Helmet expects a string as a child of <${child.type}>. Did you forget to wrap your children in braces? ( <${child.type}>{\`\`}</${child.type}> ) Refer to our API for more information.`
    );
    return true;
  }
  mapChildrenToProps(children, newProps) {
    let arrayTypeChildren = {};
    React.Children.forEach(children, (child) => {
      if (!child || !child.props) {
        return;
      }
      const { children: nestedChildren, ...childProps } = child.props;
      const newChildProps = Object.keys(childProps).reduce((obj, key) => {
        obj[HTML_TAG_MAP[key] || key] = childProps[key];
        return obj;
      }, {});
      let { type } = child;
      if (typeof type === "symbol") {
        type = type.toString();
      } else {
        this.warnOnInvalidChildren(child, nestedChildren);
      }
      switch (type) {
        case "Symbol(react.fragment)":
          newProps = this.mapChildrenToProps(nestedChildren, newProps);
          break;
        case "link":
        case "meta":
        case "noscript":
        case "script":
        case "style":
          arrayTypeChildren = this.flattenArrayTypeChildren(
            child,
            arrayTypeChildren,
            newChildProps,
            nestedChildren
          );
          break;
        default:
          newProps = this.mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren);
          break;
      }
    });
    return this.mapArrayTypeChildrenToProps(arrayTypeChildren, newProps);
  }
  render() {
    const { children, ...props } = this.props;
    let newProps = { ...props };
    let { helmetData } = props;
    if (children) {
      newProps = this.mapChildrenToProps(children, newProps);
    }
    if (helmetData && !(helmetData instanceof HelmetData)) {
      const data = helmetData;
      helmetData = new HelmetData(data.context, true);
      delete newProps.helmetData;
    }
    return helmetData ? /* @__PURE__ */ React.createElement(HelmetDispatcher, { ...newProps, context: helmetData.value }) : /* @__PURE__ */ React.createElement(Context.Consumer, null, (context) => /* @__PURE__ */ React.createElement(HelmetDispatcher, { ...newProps, context }));
  }
}, __publicField(_b, "defaultProps", {
  defer: true,
  encodeSpecialCharacters: true,
  prioritizeSeoTags: false
}), _b);
const warn = (i18n, code, msg, rest) => {
  var _a2, _b2, _c, _d;
  const args = [msg, {
    code,
    ...rest || {}
  }];
  if ((_b2 = (_a2 = i18n == null ? void 0 : i18n.services) == null ? void 0 : _a2.logger) == null ? void 0 : _b2.forward) {
    return i18n.services.logger.forward(args, "warn", "react-i18next::", true);
  }
  if (isString(args[0])) args[0] = `react-i18next:: ${args[0]}`;
  if ((_d = (_c = i18n == null ? void 0 : i18n.services) == null ? void 0 : _c.logger) == null ? void 0 : _d.warn) {
    i18n.services.logger.warn(...args);
  } else if (console == null ? void 0 : console.warn) {
    console.warn(...args);
  }
};
const alreadyWarned = {};
const warnOnce = (i18n, code, msg, rest) => {
  if (isString(msg) && alreadyWarned[msg]) return;
  if (isString(msg)) alreadyWarned[msg] = /* @__PURE__ */ new Date();
  warn(i18n, code, msg, rest);
};
const loadedClb = (i18n, cb) => () => {
  if (i18n.isInitialized) {
    cb();
  } else {
    const initialized = () => {
      setTimeout(() => {
        i18n.off("initialized", initialized);
      }, 0);
      cb();
    };
    i18n.on("initialized", initialized);
  }
};
const loadNamespaces = (i18n, ns, cb) => {
  i18n.loadNamespaces(ns, loadedClb(i18n, cb));
};
const loadLanguages = (i18n, lng, ns, cb) => {
  if (isString(ns)) ns = [ns];
  if (i18n.options.preload && i18n.options.preload.indexOf(lng) > -1) return loadNamespaces(i18n, ns, cb);
  ns.forEach((n) => {
    if (i18n.options.ns.indexOf(n) < 0) i18n.options.ns.push(n);
  });
  i18n.loadLanguages(lng, loadedClb(i18n, cb));
};
const hasLoadedNamespace = (ns, i18n, options = {}) => {
  if (!i18n.languages || !i18n.languages.length) {
    warnOnce(i18n, "NO_LANGUAGES", "i18n.languages were undefined or empty", {
      languages: i18n.languages
    });
    return true;
  }
  return i18n.hasLoadedNamespace(ns, {
    lng: options.lng,
    precheck: (i18nInstance2, loadNotPending) => {
      if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance2.services.backendConnector.backend && i18nInstance2.isLanguageChangingTo && !loadNotPending(i18nInstance2.isLanguageChangingTo, ns)) return false;
    }
  });
};
const isString = (obj) => typeof obj === "string";
const isObject = (obj) => typeof obj === "object" && obj !== null;
const matchHtmlEntity = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
const htmlEntities = {
  "&amp;": "&",
  "&#38;": "&",
  "&lt;": "<",
  "&#60;": "<",
  "&gt;": ">",
  "&#62;": ">",
  "&apos;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
  "&nbsp;": " ",
  "&#160;": " ",
  "&copy;": "©",
  "&#169;": "©",
  "&reg;": "®",
  "&#174;": "®",
  "&hellip;": "…",
  "&#8230;": "…",
  "&#x2F;": "/",
  "&#47;": "/"
};
const unescapeHtmlEntity = (m) => htmlEntities[m];
const unescape = (text) => text.replace(matchHtmlEntity, unescapeHtmlEntity);
let defaultOptions = {
  bindI18n: "languageChanged",
  bindI18nStore: "",
  transEmptyNodeValue: "",
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: "",
  transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
  useSuspense: true,
  unescape,
  transDefaultProps: void 0
};
const setDefaults = (options = {}) => {
  defaultOptions = {
    ...defaultOptions,
    ...options
  };
};
const getDefaults = () => defaultOptions;
let i18nInstance;
const setI18n = (instance2) => {
  i18nInstance = instance2;
};
const getI18n = () => i18nInstance;
const initReactI18next = {
  type: "3rdParty",
  init(instance2) {
    setDefaults(instance2.options.react);
    setI18n(instance2);
  }
};
const I18nContext = createContext();
class ReportNamespaces {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach((ns) => {
      if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
}
const notReadyT = (k, optsOrDefaultValue) => {
  if (isString(optsOrDefaultValue)) return optsOrDefaultValue;
  if (isObject(optsOrDefaultValue) && isString(optsOrDefaultValue.defaultValue)) return optsOrDefaultValue.defaultValue;
  return Array.isArray(k) ? k[k.length - 1] : k;
};
const notReadySnapshot = {
  t: notReadyT,
  ready: false
};
const dummySubscribe = () => () => {
};
const useTranslation = (ns, props = {}) => {
  var _a2, _b2, _c;
  const {
    i18n: i18nFromProps
  } = props;
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = useContext(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  if (i18n && !i18n.reportNamespaces) i18n.reportNamespaces = new ReportNamespaces();
  if (!i18n) {
    warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useTranslation: You will need to pass in an i18next instance by using initReactI18next");
  }
  const i18nOptions = useMemo(() => {
    var _a3;
    return {
      ...getDefaults(),
      ...(_a3 = i18n == null ? void 0 : i18n.options) == null ? void 0 : _a3.react,
      ...props
    };
  }, [i18n, props]);
  const {
    useSuspense,
    keyPrefix
  } = i18nOptions;
  const nsOrContext = defaultNSFromContext || ((_a2 = i18n == null ? void 0 : i18n.options) == null ? void 0 : _a2.defaultNS);
  const unstableNamespaces = isString(nsOrContext) ? [nsOrContext] : nsOrContext || ["translation"];
  const namespaces = useMemo(() => unstableNamespaces, unstableNamespaces);
  (_c = (_b2 = i18n == null ? void 0 : i18n.reportNamespaces) == null ? void 0 : _b2.addUsedNamespaces) == null ? void 0 : _c.call(_b2, namespaces);
  const revisionRef = useRef(0);
  const subscribe = useCallback((callback) => {
    if (!i18n) return dummySubscribe;
    const {
      bindI18n,
      bindI18nStore
    } = i18nOptions;
    const wrappedCallback = () => {
      revisionRef.current += 1;
      callback();
    };
    if (bindI18n) i18n.on(bindI18n, wrappedCallback);
    if (bindI18nStore) i18n.store.on(bindI18nStore, wrappedCallback);
    return () => {
      if (bindI18n) bindI18n.split(" ").forEach((e) => i18n.off(e, wrappedCallback));
      if (bindI18nStore) bindI18nStore.split(" ").forEach((e) => i18n.store.off(e, wrappedCallback));
    };
  }, [i18n, i18nOptions]);
  const snapshotRef = useRef();
  const getSnapshot = useCallback(() => {
    if (!i18n) {
      return notReadySnapshot;
    }
    const calculatedReady = !!(i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace(n, i18n, i18nOptions));
    const currentLng = props.lng || i18n.language;
    const currentRevision = revisionRef.current;
    const lastSnapshot = snapshotRef.current;
    if (lastSnapshot && lastSnapshot.ready === calculatedReady && lastSnapshot.lng === currentLng && lastSnapshot.keyPrefix === keyPrefix && lastSnapshot.revision === currentRevision) {
      return lastSnapshot;
    }
    const calculatedT = i18n.getFixedT(currentLng, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
    const newSnapshot = {
      t: calculatedT,
      ready: calculatedReady,
      lng: currentLng,
      keyPrefix,
      revision: currentRevision
    };
    snapshotRef.current = newSnapshot;
    return newSnapshot;
  }, [i18n, namespaces, keyPrefix, i18nOptions, props.lng]);
  const [loadCount, setLoadCount] = useState(0);
  const {
    t,
    ready
  } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (i18n && !ready && !useSuspense) {
      const onLoaded = () => setLoadCount((c) => c + 1);
      if (props.lng) {
        loadLanguages(i18n, props.lng, namespaces, onLoaded);
      } else {
        loadNamespaces(i18n, namespaces, onLoaded);
      }
    }
  }, [i18n, props.lng, namespaces, ready, useSuspense, loadCount]);
  const finalI18n = i18n || {};
  const wrapperRef = useRef(null);
  const wrapperLangRef = useRef();
  const createI18nWrapper = (original) => {
    const descriptors = Object.getOwnPropertyDescriptors(original);
    if (descriptors.__original) delete descriptors.__original;
    const wrapper = Object.create(Object.getPrototypeOf(original), descriptors);
    if (!Object.prototype.hasOwnProperty.call(wrapper, "__original")) {
      try {
        Object.defineProperty(wrapper, "__original", {
          value: original,
          writable: false,
          enumerable: false,
          configurable: false
        });
      } catch (_) {
      }
    }
    return wrapper;
  };
  const ret = useMemo(() => {
    const original = finalI18n;
    const lang = original == null ? void 0 : original.language;
    let i18nWrapper = original;
    if (original) {
      if (wrapperRef.current && wrapperRef.current.__original === original) {
        if (wrapperLangRef.current !== lang) {
          i18nWrapper = createI18nWrapper(original);
          wrapperRef.current = i18nWrapper;
          wrapperLangRef.current = lang;
        } else {
          i18nWrapper = wrapperRef.current;
        }
      } else {
        i18nWrapper = createI18nWrapper(original);
        wrapperRef.current = i18nWrapper;
        wrapperLangRef.current = lang;
      }
    }
    const arr = [t, i18nWrapper, ready];
    arr.t = t;
    arr.i18n = i18nWrapper;
    arr.ready = ready;
    return arr;
  }, [t, finalI18n, ready, finalI18n.resolvedLanguage, finalI18n.language, finalI18n.languages]);
  if (i18n && useSuspense && !ready) {
    throw new Promise((resolve) => {
      const onLoaded = () => resolve();
      if (props.lng) {
        loadLanguages(i18n, props.lng, namespaces, onLoaded);
      } else {
        loadNamespaces(i18n, namespaces, onLoaded);
      }
    });
  }
  return ret;
};
function I18nextProvider({
  i18n,
  defaultNS,
  children
}) {
  const value = useMemo(() => ({
    i18n,
    defaultNS
  }), [i18n, defaultNS]);
  return createElement(I18nContext.Provider, {
    value
  }, children);
}
const bannerCn = "/drawguess/assets/banner_cn-DFA4LkCJ.png";
const bannerEn = "/drawguess/assets/banner_en-ZREnH-B1.png";
const active$1 = "_active_wy7jg_169";
const hint = "_hint_wy7jg_175";
const field = "_field_wy7jg_199";
const styles$3 = {
  "join-page": "_join-page_wy7jg_1",
  "join-card": "_join-card_wy7jg_11",
  "action-btn": "_action-btn_wy7jg_41",
  "join-card-left": "_join-card-left_wy7jg_110",
  "banner-img": "_banner-img_wy7jg_119",
  "join-card-right": "_join-card-right_wy7jg_125",
  "header-row": "_header-row_wy7jg_135",
  "mode-switch": "_mode-switch_wy7jg_142",
  "mode-btn": "_mode-btn_wy7jg_152",
  active: active$1,
  hint,
  field
};
const container$1 = "_container_d8xz0_1";
const switcherBtn = "_switcherBtn_d8xz0_6";
const active = "_active_d8xz0_23";
const langCode = "_langCode_d8xz0_29";
const dropdown = "_dropdown_d8xz0_34";
const open = "_open_d8xz0_51";
const option = "_option_d8xz0_57";
const selected = "_selected_d8xz0_74";
const styles$2 = {
  container: container$1,
  switcherBtn,
  active,
  langCode,
  dropdown,
  open,
  option,
  selected
};
function normalizeLanguage(lang) {
  const raw = String(lang || "").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  return "en";
}
function stripLanguagePrefix(pathname = "/") {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return safePath.replace(/^\/(?:en|zh)(?=\/|$)/, "") || "/";
}
function withLanguagePrefix(lang, path = "/") {
  const normalizedLang = normalizeLanguage(lang);
  const safePath = stripLanguagePrefix(path);
  return `/${normalizedLang}${safePath === "/" ? "" : safePath}`;
}
function swapLanguageInPath(pathname = "/", nextLang = "en") {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLanguagePrefix(nextLang, safePath);
}
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const currentLang = normalizeLanguage(i18n.language);
  const changeLanguage = (lang) => {
    const normalizedLang = normalizeLanguage(lang);
    i18n.changeLanguage(normalizedLang);
    const localizedPath = swapLanguageInPath(location.pathname, normalizedLang);
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true });
    setIsOpen(false);
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: styles$2.container, ref: containerRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        className: `${styles$2.switcherBtn} ${isOpen ? styles$2.active : ""}`,
        onClick: () => setIsOpen(!isOpen),
        title: "Switch Language",
        "aria-label": "Switch Language",
        "aria-haspopup": "true",
        "aria-expanded": isOpen,
        children: [
          /* @__PURE__ */ jsx(Globe, { size: 16 }),
          /* @__PURE__ */ jsx("span", { className: styles$2.langCode, children: currentLang === "zh" ? "ZH" : "EN" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `${styles$2.dropdown} ${isOpen ? styles$2.open : ""}`, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `${styles$2.option} ${currentLang === "zh" ? styles$2.selected : ""}`,
          onClick: () => changeLanguage("zh"),
          children: [
            /* @__PURE__ */ jsx("span", { children: "简体中文" }),
            currentLang === "zh" && /* @__PURE__ */ jsx(Check, { size: 16 })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `${styles$2.option} ${currentLang === "en" ? styles$2.selected : ""}`,
          onClick: () => changeLanguage("en"),
          children: [
            /* @__PURE__ */ jsx("span", { children: "English" }),
            currentLang === "en" && /* @__PURE__ */ jsx(Check, { size: 16 })
          ]
        }
      )
    ] })
  ] });
}
const SITE_NAME = "Draw & Guess";
const SITE_URL = "https://playflowpulse.com/drawguess".replace(/\/$/, "");
function toAbsoluteUrl(path = "/") {
  if (!path || path === "/") {
    return SITE_URL;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
function getLocale(lang) {
  return normalizeLanguage(lang) === "zh" ? "zh_CN" : "en_US";
}
function SeoHead({
  lang = "en",
  title,
  description,
  path = "/",
  image = "/img/banner.png",
  noindex = false,
  type = "website",
  structuredData = []
}) {
  const normalizedLang = normalizeLanguage(lang);
  const canonicalPath = withLanguagePrefix(normalizedLang, path);
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const imageUrl = toAbsoluteUrl(image);
  const enUrl = toAbsoluteUrl(withLanguagePrefix("en", path));
  const zhUrl = toAbsoluteUrl(withLanguagePrefix("zh", path));
  const xDefaultUrl = toAbsoluteUrl("/");
  const jsonLd = Array.isArray(structuredData) ? structuredData.filter(Boolean) : [structuredData].filter(Boolean);
  return /* @__PURE__ */ jsxs(Helmet, { children: [
    /* @__PURE__ */ jsx("title", { children: title }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "robots", content: noindex ? "noindex,nofollow" : "index,follow" }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: canonicalUrl }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "en", href: enUrl }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "zh", href: zhUrl }),
    /* @__PURE__ */ jsx("link", { rel: "alternate", hrefLang: "x-default", href: xDefaultUrl }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: SITE_NAME }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: type }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: title }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: canonicalUrl }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: imageUrl }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: getLocale(normalizedLang) }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: title }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: imageUrl }),
    jsonLd.map((entry, index) => /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(entry) }, index))
  ] });
}
const trackEvent = (eventName, params = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};
const cx = (...classNames) => classNames.filter(Boolean).join(" ");
function Home() {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState("create");
  const navigate = useNavigate();
  const currentLang = normalizeLanguage(lang || i18n.language);
  const seoTitle2 = currentLang === "zh" ? "在线你画我猜多人游戏 | Draw & Guess" : "Online Draw & Guess Multiplayer Game | Draw & Guess";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: currentLang === "zh" ? "这是什么游戏？" : "What is Draw & Guess?",
        acceptedAnswer: {
          "@type": "Answer",
          text: currentLang === "zh" ? "这是一款在线多人你画我猜网页游戏，玩家可以创建房间、实时作画并通过聊天猜词。" : "Draw & Guess is an online multiplayer drawing and guessing game where players create rooms, draw in real time, and guess through chat."
        }
      },
      {
        "@type": "Question",
        name: currentLang === "zh" ? "需要下载吗？" : "Do I need to download anything?",
        acceptedAnswer: {
          "@type": "Answer",
          text: currentLang === "zh" ? "不需要，直接在浏览器中打开即可开始游戏，支持手机和桌面端。" : "No. You can start playing directly in the browser on mobile or desktop."
        }
      },
      {
        "@type": "Question",
        name: currentLang === "zh" ? "支持和朋友一起玩吗？" : "Can I play with friends?",
        acceptedAnswer: {
          "@type": "Answer",
          text: currentLang === "zh" ? "支持。你可以创建房间并分享链接，邀请朋友实时加入同一局游戏。" : "Yes. You can create a room, share the link, and invite friends to join in real time."
        }
      }
    ]
  };
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Draw & Guess",
    url: `https://playflowpulse.com/drawguess/${currentLang}`,
    inLanguage: currentLang,
    applicationCategory: "Game",
    genre: ["Party Game", "Drawing Game", "Word Game"],
    operatingSystem: "Any",
    description: t("home.description"),
    image: "https://playflowpulse.com/drawguess/img/banner.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };
  useEffect(() => {
    trackEvent("landing_view");
  }, []);
  const currentBanner = i18n.language.startsWith("zh") ? bannerCn : bannerEn;
  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    navigate(withLanguagePrefix(currentLang, `/room/${roomId}`), { state: { name } });
  };
  const handleCreate = () => {
    if (!name.trim()) return;
    trackEvent("create_room_click");
    const newRoomId = Math.random().toString(36).substring(2, 8);
    navigate(withLanguagePrefix(currentLang, `/room/${newRoomId}`), { state: { name } });
  };
  return /* @__PURE__ */ jsxs("div", { className: styles$3["join-page"], children: [
    /* @__PURE__ */ jsx(
      SeoHead,
      {
        lang: currentLang,
        title: seoTitle2,
        description: t("home.description"),
        path: "/",
        structuredData: [gameSchema, faqSchema]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: styles$3["join-card"], children: [
      /* @__PURE__ */ jsx("div", { className: styles$3["join-card-left"], children: /* @__PURE__ */ jsx("img", { src: currentBanner, alt: "Draw and Guess Banner", className: styles$3["banner-img"] }) }),
      /* @__PURE__ */ jsxs("div", { className: styles$3["join-card-right"], children: [
        /* @__PURE__ */ jsxs("div", { className: styles$3["header-row"], children: [
          /* @__PURE__ */ jsx("h1", { children: t("home.title") }),
          /* @__PURE__ */ jsx(LanguageSwitcher, {})
        ] }),
        /* @__PURE__ */ jsxs("div", { className: styles$3["mode-switch"], children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: cx(styles$3["mode-btn"], mode === "create" && styles$3.active),
              onClick: () => setMode("create"),
              children: t("home.createRoom")
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: cx(styles$3["mode-btn"], mode === "join" && styles$3.active),
              onClick: () => setMode("join"),
              children: t("home.joinRoom")
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: styles$3.hint, "aria-live": "polite", children: mode === "join" ? t("home.hintJoin") : t("home.hintCreate") }),
        /* @__PURE__ */ jsxs("label", { className: styles$3.field, children: [
          /* @__PURE__ */ jsx("span", { children: t("home.yourName") }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "player_name",
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: t("home.namePlaceholder"),
              maxLength: 20,
              autoComplete: "nickname",
              spellCheck: false
            }
          )
        ] }),
        mode === "join" && /* @__PURE__ */ jsxs("label", { className: styles$3.field, children: [
          /* @__PURE__ */ jsx("span", { children: t("home.roomId") }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "room_id",
              value: roomId,
              onChange: (e) => setRoomId(e.target.value),
              placeholder: t("home.roomPlaceholder"),
              maxLength: 24,
              autoComplete: "off",
              autoCapitalize: "off",
              autoCorrect: "off",
              spellCheck: false
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: styles$3["action-btn"],
            onClick: mode === "join" ? handleJoin : handleCreate,
            disabled: !name.trim() || mode === "join" && !roomId.trim(),
            children: mode === "join" ? t("home.enterRoom") : t("home.createAndEnter")
          }
        )
      ] })
    ] })
  ] });
}
const container = "_container_kpoq7_1";
const meta = "_meta_kpoq7_56";
const styles$1 = {
  container,
  "back-link": "_back-link_kpoq7_45",
  meta,
  "contact-form": "_contact-form_kpoq7_61"
};
const AboutUs = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  return /* @__PURE__ */ jsxs("div", { className: styles$1.container, children: [
    /* @__PURE__ */ jsx(
      SeoHead,
      {
        lang,
        title: `${t("about.title")} | Draw & Guess`,
        description: t("about.missionText"),
        path: "/about"
      }
    ),
    /* @__PURE__ */ jsxs(Link, { to: homePath, className: styles$1["back-link"], children: [
      "← ",
      t("static.backHome")
    ] }),
    /* @__PURE__ */ jsx("h1", { children: t("about.title") }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("about.mission") }),
      /* @__PURE__ */ jsx("p", { children: t("about.missionText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("about.story") }),
      /* @__PURE__ */ jsx("p", { children: t("about.storyText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("about.team") }),
      /* @__PURE__ */ jsx("p", { children: t("about.teamText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("about.roadmap") }),
      /* @__PURE__ */ jsx("p", { children: t("about.roadmapText") })
    ] })
  ] });
};
const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  const contactPath = withLanguagePrefix(lang, "/contact");
  return /* @__PURE__ */ jsxs("div", { className: styles$1.container, children: [
    /* @__PURE__ */ jsx(
      SeoHead,
      {
        lang,
        title: `${t("privacy.title")} | Draw & Guess`,
        description: t("privacy.introText"),
        path: "/privacy"
      }
    ),
    /* @__PURE__ */ jsxs(Link, { to: homePath, className: styles$1["back-link"], children: [
      "← ",
      t("static.backHome")
    ] }),
    /* @__PURE__ */ jsx("h1", { children: t("privacy.title") }),
    /* @__PURE__ */ jsx("p", { className: styles$1.meta, children: t("privacy.lastUpdated") }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.intro") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.introText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.dataCollection") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.dataCollectionText") }),
      /* @__PURE__ */ jsxs("ul", { children: [
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataPoint1") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataPoint2") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataPoint3") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataPoint4") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.dataUsage") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.dataUsageText") }),
      /* @__PURE__ */ jsxs("ul", { children: [
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataUsagePoint1") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataUsagePoint2") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.dataUsagePoint3") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.cookies") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.cookiesText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.thirdParty") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.thirdPartyText") }),
      /* @__PURE__ */ jsxs("ul", { children: [
        /* @__PURE__ */ jsx("li", { children: t("privacy.thirdPartyPoint1") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.thirdPartyPoint2") }),
        /* @__PURE__ */ jsx("li", { children: t("privacy.thirdPartyPoint3") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.retention") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.retentionText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.rights") }),
      /* @__PURE__ */ jsx("p", { children: t("privacy.rightsText") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("privacy.contact") }),
      /* @__PURE__ */ jsxs("p", { children: [
        t("privacy.contactText"),
        " ",
        /* @__PURE__ */ jsx(Link, { to: contactPath, children: t("static.contactUs") }),
        "."
      ] })
    ] })
  ] });
};
const ContactUs = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const homePath = withLanguagePrefix(lang, "/");
  const contactEmail = "nicolaschin0821@gmail.com";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    trackEvent("feedback_click");
    const subject = formData.subject.trim() || t("contact.defaultSubject");
    const lines = [
      `${t("contact.name")}: ${formData.name}`,
      `${t("contact.email")}: ${formData.email}`,
      "",
      formData.message
    ];
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = mailto;
  };
  return /* @__PURE__ */ jsxs("div", { className: styles$1.container, children: [
    /* @__PURE__ */ jsx(
      SeoHead,
      {
        lang,
        title: `${t("contact.title")} | Draw & Guess`,
        description: t("contact.intro"),
        path: "/contact"
      }
    ),
    /* @__PURE__ */ jsxs(Link, { to: homePath, className: styles$1["back-link"], children: [
      "← ",
      t("static.backHome")
    ] }),
    /* @__PURE__ */ jsx("h1", { children: t("contact.title") }),
    /* @__PURE__ */ jsx("p", { children: t("contact.intro") }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("contact.directTitle") }),
      /* @__PURE__ */ jsxs("p", { children: [
        t("contact.directText"),
        " ",
        /* @__PURE__ */ jsx("a", { href: `mailto:${contactEmail}`, children: contactEmail })
      ] }),
      /* @__PURE__ */ jsx("p", { className: styles$1.meta, children: t("contact.responseTime") })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { children: t("contact.formTitle") }),
      /* @__PURE__ */ jsxs("form", { className: styles$1["contact-form"], onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsxs("label", { children: [
          t("contact.name"),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "name",
              value: formData.name,
              onChange: handleChange,
              required: true,
              placeholder: t("contact.namePlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          t("contact.email"),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              value: formData.email,
              onChange: handleChange,
              required: true,
              placeholder: t("contact.emailPlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          t("contact.subject"),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "subject",
              value: formData.subject,
              onChange: handleChange,
              required: true,
              placeholder: t("contact.subjectPlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          t("contact.message"),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "message",
              value: formData.message,
              onChange: handleChange,
              required: true,
              placeholder: t("contact.messagePlaceholder")
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", children: t("contact.send") })
      ] }),
      /* @__PURE__ */ jsx("p", { className: styles$1.meta, children: t("contact.notice") })
    ] })
  ] });
};
const footer = "_footer_tka24_1";
const links = "_links_tka24_8";
const copyright = "_copyright_tka24_23";
const styles = {
  footer,
  links,
  copyright
};
const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const currentLang = normalizeLanguage(location.pathname.split("/")[1]);
  const aboutPath = withLanguagePrefix(currentLang, "/about");
  const privacyPath = withLanguagePrefix(currentLang, "/privacy");
  const contactPath = withLanguagePrefix(currentLang, "/contact");
  if (/^\/(?:en|zh)\/room\//.test(location.pathname) || location.pathname.startsWith("/room/")) {
    return null;
  }
  return /* @__PURE__ */ jsxs("footer", { className: styles.footer, children: [
    /* @__PURE__ */ jsxs("div", { className: styles.links, children: [
      /* @__PURE__ */ jsx(Link, { to: aboutPath, children: t("static.about") }),
      /* @__PURE__ */ jsx(Link, { to: privacyPath, children: t("static.privacy") }),
      /* @__PURE__ */ jsx(Link, { to: contactPath, children: t("static.contactUs") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: styles.copyright, children: [
      "© ",
      year,
      " DrawAndGuess. All rights reserved."
    ] })
  ] });
};
const seoTitle$1 = "Draw & Guess - Play with Friends Online";
const home$1 = {
  title: "Draw & Guess",
  description: "Online Draw & Guess game. Play with friends, draw masterpieces, and guess words in real-time!",
  createRoom: "Create Room",
  joinRoom: "Join Room",
  hintCreate: "Create a new room and invite friends",
  hintJoin: "Enter room ID to join the game",
  yourName: "Your Name",
  namePlaceholder: "Enter nickname...",
  roomId: "Room ID",
  roomPlaceholder: "e.g. room1...",
  enterRoom: "Enter Room",
  createAndEnter: "Create & Enter"
};
const game$1 = {
  joining: "Connecting...",
  joinFailed: "Join Failed",
  joiningRoom: "Joining room...",
  skipToContent: "Skip to content",
  quitRoom: "Leave Room",
  quitConfirm: "You will return to the home page. Your current game state will not be saved.",
  confirmQuit: "Confirm Leave",
  stayInRoom: "Stay in Room"
};
const share$1 = {
  invalid: "Invalid share link",
  resolving: "Resolving share link...",
  notice: "Notice"
};
const system$1 = {
  joined: "<user>{{username}}</user> joined the room.",
  left: "<user>{{username}}</user> left the room.",
  drawing: "<user>{{username}}</user> is drawing.",
  guessed: "<user>{{username}}</user> guessed correctly! (+{{score}} points)",
  roundEnd: 'Round ended. The answer was "{{word}}".',
  timeout: `Time's up. The answer was "{{word}}".`,
  gameOver: "Game over! All players have drawn.",
  minPlayers: "At least 2 players are needed to start.",
  hint: "Hint: {{hint}}",
  hintCategory: "Hint: {{category}}",
  maskedWord: "Hint: {{category}} ({{length}} letters)",
  drawerName: "Drawer"
};
const categories$1 = {
  Animals: "Animals",
  Objects: "Objects",
  Foods: "Foods",
  Places: "Places",
  Actions: "Actions",
  "热门": "Trending",
  "系统": "System"
};
const error$1 = {
  missingIdName: "Please provide Room ID and Name."
};
const header$1 = {
  room: "Room",
  waiting: "Waiting",
  menu: "Menu",
  share: "Share Room",
  rules: "Rules",
  leave: "Leave Room",
  players: "Players",
  copied: "Link Copied",
  shareMsg: "Invite friends to join the game!",
  copyFailed: "Copy Failed",
  manualCopy: "Please copy link manually: "
};
const ui$1 = {
  rules: "Rules",
  leave: "Leave",
  players: "Players",
  round: "Round",
  timeLeft: "Time Left",
  drawer: "Drawer",
  guesser: "Guesser",
  start: "Start Game",
  waiting: "Waiting",
  chatPlaceholder: "Type guess or chat...",
  send: "Send",
  clear: "Clear",
  undo: "Undo",
  eraser: "Eraser",
  pen: "Pen",
  size: "Size",
  color: "Color",
  word: "Word",
  guessWord: "Guess this word",
  correct: "Correct!",
  turnEnd: "Turn End",
  gameEnd: "Game Over",
  winner: "Winner",
  scores: "Scores",
  me: "Me",
  yourWord: "Your Word",
  chat: "Chat Messages",
  canvas: "Drawing Canvas",
  reference: "Reference",
  generatingReference: "Generating reference images...",
  noReference: "No reference images found",
  referenceHint: "*Generated by AI for reference only, please do not copy directly.",
  imageLoadFailed: "Image load failed",
  toolbar: "Toolbar",
  aiReference: "AI Reference",
  chooseColor: "Choose Color",
  brushSize: "Brush Size",
  adjustBrushSize: "Adjust Brush Size",
  clearCanvas: "Clear Canvas",
  exitFullscreen: "Exit Fullscreen",
  enterFullscreen: "Enter Fullscreen",
  remainingTime: "Time",
  roleDrawer: " (Drawer)",
  roleHost: " (Host)",
  statusGuessed: " (Guessed)"
};
const effects$1 = {
  flower: "Flower",
  slipper: "Slipper",
  egg: "Egg",
  kiss: "Kiss",
  bomb: "Bomb",
  toolbar: "Effects",
  remaining: "left"
};
const rules$1 = {
  title: "Game Rules",
  process: "🎨 Game Flow",
  process1: "1. Players take turns drawing while others guess.",
  process2: "2. Each round lasts 75s. Ends when all guess correctly or time is up.",
  process3: "3. Game ends after everyone has drawn once.",
  score: "🏆 Scoring",
  scoreGuesser: "Guesser:",
  scoreGuesserDesc: "Base 10 pts + time bonus",
  scoreDrawer: "Drawer:",
  scoreDrawerDesc: "+5 pts for each correct guess",
  notice: "⚠️ Notice",
  notice1: "• No writing words, pinyin, or direct hints.",
  notice2: "• Type guesses in the chat box.",
  notice3: "• Only system-validated answers count.",
  viewRules: "View Rules",
  gameRules: "Rules"
};
const modal$1 = {
  joinRoom: "Join Room",
  joiningRoom: "Joining Room",
  yourName: "Your Name",
  enterNickname: "Enter Nickname",
  cancel: "Cancel",
  join: "Join",
  confirm: "Confirm"
};
const privacy$1 = {
  title: "Privacy Policy",
  lastUpdated: "Last updated: March 1, 2026",
  intro: "Scope",
  introText: "This policy applies to the DrawAndGuess web game, including room play, chat, drawing sync, sharing, and reference-image features. You can play without creating an account.",
  dataCollection: "Data We Process",
  dataCollectionText: "To keep the game working and stable, we process:",
  dataPoint1: "Basic info such as nickname, room ID, and language preference",
  dataPoint2: "Gameplay data such as strokes, chat messages, round scores, and room state",
  dataPoint3: "Technical data such as IP address, browser type, and access time",
  dataPoint4: "Traffic metrics such as page visits and basic usage events",
  dataUsage: "How We Use Data",
  dataUsageText: "We only use data for service operation and improvement:",
  dataUsagePoint1: "Run real-time multiplayer sessions and synchronize game state",
  dataUsagePoint2: "Troubleshoot issues, prevent abuse, and improve performance",
  dataUsagePoint3: "Understand feature usage and prioritize product iteration",
  cookies: "Cookies",
  cookiesText: "We use browser storage (for example, to remember language preference) and may use analytics-related cookies to measure site usage.",
  thirdParty: "Third-Party Services",
  thirdPartyText: "Some features rely on external services:",
  thirdPartyPoint1: "Google Analytics: site traffic and basic behavior analytics (if enabled)",
  thirdPartyPoint2: "DeepSeek API: trending word generation on the server side",
  thirdPartyPoint3: "Image search proxy: AI reference image display",
  retention: "Data Retention",
  retentionText: "Real-time room data is primarily stored in server memory and is cleared when a room becomes empty. It is also reset on server restart. Analytics data may be retained for operations analysis.",
  rights: "Your Choices and Rights",
  rightsText: "You can stop using the service at any time by leaving the page. If you want to request access, update, or deletion of relevant data, please contact us via the Contact page.",
  contact: "Contact Us",
  contactText: "If you have any questions about this Privacy Policy, please"
};
const about$1 = {
  title: "About Us",
  mission: "What We Build",
  missionText: "DrawAndGuess is a lightweight real-time multiplayer drawing game designed for quick starts and instant social interaction.",
  story: "Current Product Scope",
  storyText: "The current version includes room creation/joining, real-time drawing sync, chat guessing, round scoring, room sharing, AI reference images, and bilingual support (English/Chinese).",
  team: "Our Product Principles",
  teamText: "We focus on mobile-first usability, low-latency synchronization, and clear game rules that are easy to learn.",
  roadmap: "What's Next",
  roadmapText: "We will continue improving gameplay stability, anti-abuse controls, internationalization, and live-ops features for global players."
};
const contact$1 = {
  title: "Contact Us",
  intro: "You can reach us by email for bug reports, suggestions, or collaboration requests.",
  directTitle: "Direct Contact",
  directText: "Email:",
  responseTime: "We usually respond within 3 business days.",
  formTitle: "Quick Email Draft",
  name: "Name",
  namePlaceholder: "Your Name",
  email: "Email",
  emailPlaceholder: "your.email@example.com",
  subject: "Subject",
  subjectPlaceholder: "Example: Mobile drawing lag issue report",
  defaultSubject: "DrawAndGuess Feedback",
  message: "Message",
  messagePlaceholder: "How can we help you?",
  send: "Open Email App",
  notice: "Clicking the button opens your default email app with the message prefilled."
};
const en = {
  seoTitle: seoTitle$1,
  home: home$1,
  game: game$1,
  share: share$1,
  system: system$1,
  categories: categories$1,
  error: error$1,
  header: header$1,
  ui: ui$1,
  effects: effects$1,
  rules: rules$1,
  modal: modal$1,
  "static": {
    backHome: "Back to Home",
    contactUs: "Contact Us",
    privacy: "Privacy Policy",
    about: "About Us"
  },
  privacy: privacy$1,
  about: about$1,
  contact: contact$1
};
const seoTitle = "Draw & Guess - 与好友在线同玩";
const home = {
  title: "你画我猜",
  description: "在线你画我猜多人游戏，与好友一起享受绘画与猜谜的乐趣。",
  createRoom: "创建房间",
  joinRoom: "加入房间",
  hintCreate: "创建新房间并邀请好友",
  hintJoin: "请输入房间号加入游戏",
  yourName: "你的名称",
  namePlaceholder: "输入昵称，例如小王…",
  roomId: "房间 ID",
  roomPlaceholder: "例如 room1…",
  enterRoom: "进入房间",
  createAndEnter: "创建并进入"
};
const game = {
  joining: "正在连接...",
  joinFailed: "加入失败",
  joiningRoom: "正在加入房间...",
  skipToContent: "跳到游戏内容",
  quitRoom: "退出房间",
  quitConfirm: "退出后将返回首页，当前对局状态不会为你保留。",
  confirmQuit: "确认退出",
  stayInRoom: "留在房间"
};
const share = {
  invalid: "无效的分享链接",
  resolving: "正在解析分享链接...",
  notice: "提示"
};
const system = {
  joined: "<user>{{username}}</user> 加入了房间。",
  left: "<user>{{username}}</user> 离开了房间。",
  drawing: "<user>{{username}}</user> 正在画。",
  guessed: "<user>{{username}}</user> 猜对了！(+{{score}} 分)",
  roundEnd: "回合结束，答案是「{{word}}」。",
  timeout: "时间到，答案是「{{word}}」。",
  gameOver: "游戏结束！所有玩家都已作画。",
  minPlayers: "至少需要 2 名玩家才能开始。",
  hint: "提示: {{hint}}",
  hintCategory: "提示: {{category}}",
  maskedWord: "提示: {{category}} ({{length}}字)",
  drawerName: "画家"
};
const categories = {
  Animals: "动物",
  Objects: "物品",
  Foods: "食物",
  Places: "场所",
  Actions: "动作",
  "热门": "热门话题",
  "系统": "系统"
};
const error = {
  missingIdName: "请填写房间 ID 和名称。"
};
const header = {
  room: "房间",
  waiting: "等待开始",
  menu: "房间功能",
  share: "分享房间",
  rules: "游戏规则",
  leave: "退出房间",
  players: "玩家",
  copied: "链接已复制",
  shareMsg: "快去邀请好友加入游戏吧！",
  copyFailed: "复制失败",
  manualCopy: "请手动复制链接: "
};
const ui = {
  rules: "规则",
  leave: "离开",
  players: "玩家",
  player: "玩家",
  round: "回合",
  timeLeft: "剩余时间",
  drawer: "画图者",
  guesser: "猜词者",
  start: "开始游戏",
  waiting: "等待中",
  chatPlaceholder: "输入猜测或聊天...",
  send: "发送",
  clear: "清空",
  undo: "撤销",
  eraser: "橡皮擦",
  pen: "画笔",
  size: "粗细",
  color: "颜色",
  word: "词语",
  guessWord: "猜这个词",
  correct: "猜对了！",
  turnEnd: "回合结束",
  gameEnd: "游戏结束",
  winner: "获胜者",
  scores: "得分",
  me: "我",
  yourWord: "你的词",
  chat: "聊天消息",
  canvas: "绘图画布",
  reference: "参考图",
  generatingReference: "正在生成参考图...",
  noReference: "未找到相关参考图",
  referenceHint: "*图片由 AI 实时生成，仅供参考，请勿直接照抄哦~",
  imageLoadFailed: "图片加载失败",
  toolbar: "工具栏",
  aiReference: "AI 参考图",
  chooseColor: "选择颜色",
  brushSize: "笔刷大小",
  adjustBrushSize: "调整笔刷大小",
  clearCanvas: "清空画布",
  exitFullscreen: "退出全屏",
  enterFullscreen: "全屏模式",
  remainingTime: "剩余",
  roleDrawer: " (画家)",
  roleHost: " (房主)",
  statusGuessed: " (已猜中)"
};
const effects = {
  flower: "鲜花",
  slipper: "拖鞋",
  egg: "鸡蛋",
  kiss: "飞吻",
  bomb: "炸弹",
  toolbar: "互动道具",
  remaining: "剩余"
};
const rules = {
  title: "游戏规则",
  process: "🎨 游戏流程",
  process1: "1. 玩家轮流当画家，其他人猜词",
  process2: "2. 每回合 75 秒，全员猜中或时间到则结束",
  process3: "3. 所有人当过一次画家后游戏结束",
  score: "🏆 计分规则",
  scoreGuesser: "猜词者：",
  scoreGuesserDesc: "基础分 10 分 + 剩余时间奖励",
  scoreDrawer: "画家：",
  scoreDrawerDesc: "每有一个人猜中 +5 分",
  notice: "⚠️ 注意事项",
  notice1: "• 画家不能写字、写拼音或直接给提示",
  notice2: "• 猜词者在聊天框输入答案",
  notice3: "• 只有系统判定的答案才算分",
  viewRules: "查看游戏规则",
  gameRules: "游戏规则"
};
const modal = {
  joinRoom: "加入房间",
  joiningRoom: "正在加入房间",
  yourName: "你的名称",
  enterNickname: "输入昵称",
  cancel: "取消",
  join: "加入",
  confirm: "确定"
};
const privacy = {
  title: "隐私政策",
  lastUpdated: "最后更新：2026-03-01",
  intro: "适用范围",
  introText: "本政策适用于 DrawAndGuess 网页游戏（包含房间、聊天、绘画同步、分享和参考图功能）。我们不要求注册账号即可游玩。",
  dataCollection: "我们收集的数据",
  dataCollectionText: "为保障游戏可用性与稳定性，我们会处理以下数据：",
  dataPoint1: "玩家昵称、房间 ID、语言偏好等基础信息",
  dataPoint2: "游戏过程数据（绘画轨迹、聊天消息、回合得分与状态）",
  dataPoint3: "设备与网络技术信息（IP、浏览器类型、访问时间）",
  dataPoint4: "访问统计数据（如页面访问与基础使用事件）",
  dataUsage: "数据使用目的",
  dataUsageText: "我们仅在与产品运行相关的范围内使用数据：",
  dataUsagePoint1: "维持多人实时对战、同步画布和房间状态",
  dataUsagePoint2: "排查故障、预防滥用并优化性能",
  dataUsagePoint3: "分析功能使用情况，指导产品迭代",
  cookies: "Cookie 与本地存储",
  cookiesText: "我们会使用浏览器本地存储（例如保存语言偏好），并可能使用统计相关 Cookie 来衡量网站访问情况。",
  thirdParty: "第三方服务",
  thirdPartyText: "部分功能依赖第三方服务提供：",
  thirdPartyPoint1: "Google Analytics：用于统计页面访问与基础行为数据（若启用）",
  thirdPartyPoint2: "DeepSeek API：用于生成热点词条（服务端处理）",
  thirdPartyPoint3: "图片检索代理：用于展示 AI 参考图",
  retention: "数据保留",
  retentionText: "房间实时数据主要保存在服务端内存中，房间无人后会清理；服务器重启后相关实时数据也会重置。统计数据会按运营分析需要保留。",
  rights: "您的选择与权利",
  rightsText: "您可随时停止使用本服务并关闭页面。若您希望了解、更新或删除与您相关的数据，请通过“联系我们”页面与我们联系。",
  contact: "联系我们",
  contactText: "如果您对本隐私政策有任何疑问，请"
};
const about = {
  title: "关于我们",
  mission: "我们在做什么",
  missionText: "DrawAndGuess 是一款轻量、实时、多人互动的你画我猜网页游戏，目标是让玩家可以在 1 分钟内快速开局并享受即时互动。",
  story: "当前产品能力",
  storyText: "当前版本支持创建/加入房间、实时绘画同步、聊天猜词、回合计分、房间分享、AI 参考图与中英文切换。",
  team: "我们坚持的方向",
  teamText: "我们优先关注移动端体验、低延迟同步与简单可上手的规则设计，并持续优化稳定性与可玩性。",
  roadmap: "接下来",
  roadmapText: "我们会继续完善运营数据分析、反作弊能力、国际化体验和长期活动玩法，让游戏在全球场景下更稳定、更有趣。"
};
const contact = {
  title: "联系我们",
  intro: "你可以通过邮箱与我们联系，反馈问题、建议或合作需求。",
  directTitle: "直接联系",
  directText: "邮箱：",
  responseTime: "通常我们会在 3 个工作日内回复。",
  formTitle: "快速发送邮件草稿",
  name: "姓名",
  namePlaceholder: "您的姓名",
  email: "邮箱",
  emailPlaceholder: "your.email@example.com",
  subject: "主题",
  subjectPlaceholder: "例如：反馈一个移动端绘画卡顿问题",
  defaultSubject: "DrawAndGuess 用户反馈",
  message: "留言",
  messagePlaceholder: "我们要如何帮助您？",
  send: "打开邮件客户端",
  notice: "点击后会打开你的默认邮件客户端，并自动填入内容。"
};
const zh = {
  seoTitle,
  home,
  game,
  share,
  system,
  categories,
  error,
  header,
  ui,
  effects,
  rules,
  modal,
  "static": {
    backHome: "返回首页",
    contactUs: "联系我们",
    privacy: "隐私政策",
    about: "关于我们"
  },
  privacy,
  about,
  contact
};
const i18nResources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  }
};
function RootLanguageRedirect({ lang = "en" }) {
  return /* @__PURE__ */ jsx(Navigate, { to: withLanguagePrefix(lang, "/"), replace: true });
}
function LanguageLayout() {
  const { lang } = useParams();
  const normalizedLang = normalizeLanguage(lang);
  if (lang !== normalizedLang) {
    const suffix = stripLanguagePrefix(`/${lang || ""}`);
    return /* @__PURE__ */ jsx(Navigate, { to: withLanguagePrefix(normalizedLang, suffix), replace: true });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
function LanguageFallbackRedirect() {
  const { lang } = useParams();
  return /* @__PURE__ */ jsx(Navigate, { to: withLanguagePrefix(lang, "/"), replace: true });
}
function PrerenderApp({ defaultLang = "en" }) {
  const { i18n } = useTranslation();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Helmet, { children: /* @__PURE__ */ jsx("html", { lang: normalizeLanguage(i18n.language) }) }),
    /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(RootLanguageRedirect, { lang: defaultLang }) }),
      /* @__PURE__ */ jsxs(Route, { path: "/:lang", element: /* @__PURE__ */ jsx(LanguageLayout, {}), children: [
        /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(Home, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "about", element: /* @__PURE__ */ jsx(AboutUs, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "privacy", element: /* @__PURE__ */ jsx(PrivacyPolicy, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "contact", element: /* @__PURE__ */ jsx(ContactUs, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(LanguageFallbackRedirect, {}) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
async function createServerI18n(lang) {
  const instance$1 = instance.createInstance();
  await instance$1.use(initReactI18next).init({
    resources: i18nResources,
    lng: normalizeLanguage(lang),
    fallbackLng: "en",
    load: "languageOnly",
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });
  return instance$1;
}
async function render(url) {
  const rawBase = "/drawguess/";
  const normalizedBase = rawBase;
  const basename = normalizedBase.startsWith("/") ? normalizedBase.replace(/\/$/, "") || "/" : `/${normalizedBase.replace(/\/$/, "")}`;
  const pathWithoutBase = basename !== "/" && url.startsWith(basename) ? url.slice(basename.length) || "/" : url;
  const defaultLang = normalizeLanguage(pathWithoutBase.split("/")[1]);
  const i18n = await createServerI18n(defaultLang);
  const helmetContext = {};
  const appHtml = renderToString(
    /* @__PURE__ */ jsx(I18nextProvider, { i18n, children: /* @__PURE__ */ jsx(HelmetProvider, { context: helmetContext, children: /* @__PURE__ */ jsx(MemoryRouter, { basename: basename === "/" ? void 0 : basename, initialEntries: [url], children: /* @__PURE__ */ jsx(PrerenderApp, { defaultLang }) }) }) })
  );
  return {
    appHtml,
    helmet: helmetContext.helmet
  };
}
export {
  render
};
