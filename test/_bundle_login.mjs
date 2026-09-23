var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins = cap.Plugins = cap.Plugins || {};
      const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const isNativePlatform = () => getPlatform() !== "web";
      const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const getPluginHeader = (pluginName) => {
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
      };
      const handleError = (err) => win.console.error(err);
      const registeredPlugins = /* @__PURE__ */ new Map();
      const registerPlugin2 = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a, _b;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
            }
          } else if (impl) {
            return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve) => call.then(() => resolve({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
        });
        return proxy;
      };
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    WebPlugin = class {
      constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        if (index !== -1) {
          this.listeners[eventName].splice(index, 1);
        }
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
    (function(SystemBarsStyle2) {
      SystemBarsStyle2["Dark"] = "DARK";
      SystemBarsStyle2["Light"] = "LIGHT";
      SystemBarsStyle2["Default"] = "DEFAULT";
    })(SystemBarsStyle || (SystemBarsStyle = {}));
    (function(SystemBarType2) {
      SystemBarType2["StatusBar"] = "StatusBar";
      SystemBarType2["NavigationBar"] = "NavigationBar";
    })(SystemBarType || (SystemBarType = {}));
    SystemBarsPluginWeb = class extends WebPlugin {
      async setStyle() {
        this.unavailable("not available for web");
      }
      async setAnimation() {
        this.unavailable("not available for web");
      }
      async show() {
        this.unavailable("not available for web");
      }
      async hide() {
        this.unavailable("not available for web");
      }
    };
    SystemBars = registerPlugin("SystemBars", {
      web: () => new SystemBarsPluginWeb()
    });
  }
});

// node_modules/@capacitor-community/admob/dist/esm/definitions.js
var MaxAdContentRating;
var init_definitions = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/definitions.js"() {
    (function(MaxAdContentRating2) {
      MaxAdContentRating2["General"] = "General";
      MaxAdContentRating2["ParentalGuidance"] = "ParentalGuidance";
      MaxAdContentRating2["Teen"] = "Teen";
      MaxAdContentRating2["MatureAudience"] = "MatureAudience";
    })(MaxAdContentRating || (MaxAdContentRating = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-options.interface.js
var init_banner_ad_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js
var BannerAdPluginEvents;
var init_banner_ad_plugin_events_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js"() {
    (function(BannerAdPluginEvents2) {
      BannerAdPluginEvents2["SizeChanged"] = "bannerAdSizeChanged";
      BannerAdPluginEvents2["Loaded"] = "bannerAdLoaded";
      BannerAdPluginEvents2["FailedToLoad"] = "bannerAdFailedToLoad";
      BannerAdPluginEvents2["Opened"] = "bannerAdOpened";
      BannerAdPluginEvents2["Closed"] = "bannerAdClosed";
      BannerAdPluginEvents2["AdImpression"] = "bannerAdImpression";
      BannerAdPluginEvents2["AdPaid"] = "bannerAdPaid";
    })(BannerAdPluginEvents || (BannerAdPluginEvents = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js
var BannerAdPosition;
var init_banner_ad_position_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js"() {
    (function(BannerAdPosition2) {
      BannerAdPosition2["TOP_CENTER"] = "TOP_CENTER";
      BannerAdPosition2["CENTER"] = "CENTER";
      BannerAdPosition2["BOTTOM_CENTER"] = "BOTTOM_CENTER";
    })(BannerAdPosition || (BannerAdPosition = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js
var BannerAdSize;
var init_banner_ad_size_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js"() {
    (function(BannerAdSize2) {
      BannerAdSize2["BANNER"] = "BANNER";
      BannerAdSize2["FULL_BANNER"] = "FULL_BANNER";
      BannerAdSize2["LARGE_BANNER"] = "LARGE_BANNER";
      BannerAdSize2["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
      BannerAdSize2["LEADERBOARD"] = "LEADERBOARD";
      BannerAdSize2["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
      BannerAdSize2["SMART_BANNER"] = "SMART_BANNER";
    })(BannerAdSize || (BannerAdSize = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-definitions.interface.js
var init_banner_definitions_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-definitions.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/banner-size.interface.js
var init_banner_size_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/banner-size.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/banner/index.js
var init_banner = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/banner/index.js"() {
    init_banner_ad_options_interface();
    init_banner_ad_plugin_events_enum();
    init_banner_ad_position_enum();
    init_banner_ad_size_enum();
    init_banner_definitions_interface();
    init_banner_size_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js
var InterstitialAdPluginEvents;
var init_interstitial_ad_plugin_events_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js"() {
    (function(InterstitialAdPluginEvents2) {
      InterstitialAdPluginEvents2["Loaded"] = "interstitialAdLoaded";
      InterstitialAdPluginEvents2["FailedToLoad"] = "interstitialAdFailedToLoad";
      InterstitialAdPluginEvents2["Showed"] = "interstitialAdShowed";
      InterstitialAdPluginEvents2["FailedToShow"] = "interstitialAdFailedToShow";
      InterstitialAdPluginEvents2["Dismissed"] = "interstitialAdDismissed";
      InterstitialAdPluginEvents2["AdImpression"] = "interstitialAdImpression";
    })(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-definitions.interface.js
var init_interstitial_definitions_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-definitions.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js
var init_interstitial = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js"() {
    init_interstitial_ad_plugin_events_enum();
    init_interstitial_definitions_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js
var RewardInterstitialAdPluginEvents;
var init_reward_interstitial_ad_plugin_events_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js"() {
    (function(RewardInterstitialAdPluginEvents2) {
      RewardInterstitialAdPluginEvents2["Loaded"] = "onRewardedInterstitialAdLoaded";
      RewardInterstitialAdPluginEvents2["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
      RewardInterstitialAdPluginEvents2["Showed"] = "onRewardedInterstitialAdShowed";
      RewardInterstitialAdPluginEvents2["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
      RewardInterstitialAdPluginEvents2["Dismissed"] = "onRewardedInterstitialAdDismissed";
      RewardInterstitialAdPluginEvents2["Rewarded"] = "onRewardedInterstitialAdReward";
      RewardInterstitialAdPluginEvents2["AdImpression"] = "onRewardedInterstitialAdImpression";
    })(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-definitions.interface.js
var init_reward_interstitial_definitions_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-definitions.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-item.interface.js
var init_reward_interstitial_item_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-item.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-options.interface.js
var init_reward_interstitial_ad_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js
var init_reward_interstitial = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js"() {
    init_reward_interstitial_ad_plugin_events_enum();
    init_reward_interstitial_definitions_interface();
    init_reward_interstitial_item_interface();
    init_reward_interstitial_ad_options_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js
var RewardAdPluginEvents;
var init_reward_ad_plugin_events_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js"() {
    (function(RewardAdPluginEvents2) {
      RewardAdPluginEvents2["Loaded"] = "onRewardedVideoAdLoaded";
      RewardAdPluginEvents2["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
      RewardAdPluginEvents2["Showed"] = "onRewardedVideoAdShowed";
      RewardAdPluginEvents2["FailedToShow"] = "onRewardedVideoAdFailedToShow";
      RewardAdPluginEvents2["Dismissed"] = "onRewardedVideoAdDismissed";
      RewardAdPluginEvents2["Rewarded"] = "onRewardedVideoAdReward";
      RewardAdPluginEvents2["AdImpression"] = "onRewardedVideoAdImpression";
    })(RewardAdPluginEvents || (RewardAdPluginEvents = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward/reward-definitions.interface.js
var init_reward_definitions_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward/reward-definitions.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward/reward-item.interface.js
var init_reward_item_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward/reward-item.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-options.interface.js
var init_reward_ad_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/reward/index.js
var init_reward = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/reward/index.js"() {
    init_reward_ad_plugin_events_enum();
    init_reward_definitions_interface();
    init_reward_item_interface();
    init_reward_ad_options_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js
var AdmobConsentStatus;
var init_consent_status_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js"() {
    (function(AdmobConsentStatus2) {
      AdmobConsentStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
      AdmobConsentStatus2["OBTAINED"] = "OBTAINED";
      AdmobConsentStatus2["REQUIRED"] = "REQUIRED";
      AdmobConsentStatus2["UNKNOWN"] = "UNKNOWN";
    })(AdmobConsentStatus || (AdmobConsentStatus = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js
var AdmobConsentDebugGeography;
var init_consent_debug_geography_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js"() {
    (function(AdmobConsentDebugGeography2) {
      AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["DISABLED"] = 0] = "DISABLED";
      AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["EEA"] = 1] = "EEA";
      AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["NOT_EEA"] = 2] = "NOT_EEA";
      AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["US"] = 3] = "US";
      AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["OTHER"] = 4] = "OTHER";
    })(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/consent-request-options.interface.js
var init_consent_request_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/consent-request-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/consent-info.interface.js
var init_consent_info_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/consent-info.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/consent-definition.interface.js
var init_consent_definition_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/consent-definition.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/index.js
var init_consent = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/index.js"() {
    init_consent_status_enum();
    init_consent_debug_geography_enum();
    init_consent_request_options_interface();
    init_consent_info_interface();
    init_consent_definition_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/ad-load-info.interface.js
var init_ad_load_info_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/ad-load-info.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/ad-options.interface.js
var init_ad_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/ad-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/ad-show-options.interface.js
var init_ad_show_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/ad-show-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/admob-error.interface.js
var init_admob_error_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/admob-error.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/ad-mob-revenue-data.interface.js
var AdValuePrecision;
var init_ad_mob_revenue_data_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/ad-mob-revenue-data.interface.js"() {
    (function(AdValuePrecision2) {
      AdValuePrecision2[AdValuePrecision2["Unknown"] = 0] = "Unknown";
      AdValuePrecision2[AdValuePrecision2["Estimated"] = 1] = "Estimated";
      AdValuePrecision2[AdValuePrecision2["PublisherProvided"] = 2] = "PublisherProvided";
      AdValuePrecision2[AdValuePrecision2["Precise"] = 3] = "Precise";
    })(AdValuePrecision || (AdValuePrecision = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/shared/index.js
var init_shared = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/shared/index.js"() {
    init_ad_load_info_interface();
    init_ad_options_interface();
    init_ad_show_options_interface();
    init_admob_error_interface();
    init_ad_mob_revenue_data_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-options.interface.js
var init_app_open_ad_options_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-options.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-plugin-events.enum.js
var AppOpenAdPluginEvents;
var init_app_open_ad_plugin_events_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-plugin-events.enum.js"() {
    (function(AppOpenAdPluginEvents2) {
      AppOpenAdPluginEvents2["Loaded"] = "appOpenAdLoaded";
      AppOpenAdPluginEvents2["FailedToLoad"] = "appOpenAdFailedToLoad";
      AppOpenAdPluginEvents2["Opened"] = "appOpenAdOpened";
      AppOpenAdPluginEvents2["Closed"] = "appOpenAdClosed";
      AppOpenAdPluginEvents2["FailedToShow"] = "appOpenAdFailedToShow";
      AppOpenAdPluginEvents2["AdImpression"] = "appOpenAdImpression";
    })(AppOpenAdPluginEvents || (AppOpenAdPluginEvents = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-definitions.interface.js
var init_app_open_definitions_interface = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-definitions.interface.js"() {
  }
});

// node_modules/@capacitor-community/admob/dist/esm/app-open/index.js
var init_app_open = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/app-open/index.js"() {
    init_app_open_ad_options_interface();
    init_app_open_ad_plugin_events_enum();
    init_app_open_definitions_interface();
  }
});

// node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js
var PrivacyOptionsRequirementStatus;
var init_privacy_options_requirement_status_enum = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js"() {
    (function(PrivacyOptionsRequirementStatus2) {
      PrivacyOptionsRequirementStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
      PrivacyOptionsRequirementStatus2["REQUIRED"] = "REQUIRED";
      PrivacyOptionsRequirementStatus2["UNKNOWN"] = "UNKNOWN";
    })(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));
  }
});

// node_modules/@capacitor-community/admob/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  AdMobWeb: () => AdMobWeb
});
var AdMobWeb;
var init_web = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/web.js"() {
    init_dist();
    init_consent_status_enum();
    init_privacy_options_requirement_status_enum();
    AdMobWeb = class extends WebPlugin {
      async initialize() {
        console.log("initialize");
      }
      async requestTrackingAuthorization() {
        console.log("requestTrackingAuthorization");
      }
      async trackingAuthorizationStatus() {
        return {
          status: "authorized"
        };
      }
      async requestConsentInfo(options) {
        console.log("requestConsentInfo", options);
        return {
          status: AdmobConsentStatus.REQUIRED,
          isConsentFormAvailable: true,
          canRequestAds: true,
          privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
        };
      }
      async showPrivacyOptionsForm() {
        console.log("showPrivacyOptionsForm");
      }
      async showConsentForm() {
        console.log("showConsentForm");
        return {
          status: AdmobConsentStatus.REQUIRED,
          canRequestAds: true,
          privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
        };
      }
      async resetConsentInfo() {
        console.log("resetConsentInfo");
      }
      async setApplicationMuted(options) {
        console.log("setApplicationMuted", options);
      }
      async setApplicationVolume(options) {
        console.log("setApplicationVolume", options);
      }
      async showBanner(options) {
        console.log("showBanner", options);
      }
      async hideBanner() {
        console.log("hideBanner");
      }
      async resumeBanner() {
        console.log("resumeBanner");
      }
      async removeBanner() {
        console.log("removeBanner");
      }
      async prepareInterstitial(options) {
        console.log("prepareInterstitial", options);
        return {
          adUnitId: options.adId
        };
      }
      async showInterstitial(options) {
        console.log("showInterstitial", options);
      }
      async prepareRewardVideoAd(options) {
        console.log("prepareRewardVideoAd", options);
        return {
          adUnitId: options.adId
        };
      }
      async showRewardVideoAd(options) {
        console.log("showRewardVideoAd", options);
        return {
          type: "",
          amount: 0
        };
      }
      async prepareRewardInterstitialAd(options) {
        console.log("prepareRewardInterstitialAd", options);
        return {
          adUnitId: options.adId
        };
      }
      async showRewardInterstitialAd(options) {
        console.log("showRewardInterstitialAd", options);
        return {
          type: "",
          amount: 0
        };
      }
      async loadAppOpen(options) {
        console.log("loadAppOpen", options);
        return {
          adUnitId: options.adId
        };
      }
      async showAppOpen(options) {
        console.log("showAppOpen", options);
      }
      async isAppOpenLoaded() {
        return { value: false };
      }
      addListener(eventName, listenerFunc) {
        console.log("addListener", eventName);
        return Promise.resolve({ remove: () => Promise.resolve() });
      }
    };
  }
});

// node_modules/@capacitor-community/admob/dist/esm/index.js
var esm_exports = {};
__export(esm_exports, {
  AdMob: () => AdMob,
  AdValuePrecision: () => AdValuePrecision,
  AdmobConsentDebugGeography: () => AdmobConsentDebugGeography,
  AdmobConsentStatus: () => AdmobConsentStatus,
  AppOpenAdPluginEvents: () => AppOpenAdPluginEvents,
  BannerAdPluginEvents: () => BannerAdPluginEvents,
  BannerAdPosition: () => BannerAdPosition,
  BannerAdSize: () => BannerAdSize,
  InterstitialAdPluginEvents: () => InterstitialAdPluginEvents,
  MaxAdContentRating: () => MaxAdContentRating,
  RewardAdPluginEvents: () => RewardAdPluginEvents,
  RewardInterstitialAdPluginEvents: () => RewardInterstitialAdPluginEvents
});
var AdMob;
var init_esm = __esm({
  "node_modules/@capacitor-community/admob/dist/esm/index.js"() {
    init_dist();
    init_definitions();
    init_banner();
    init_interstitial();
    init_reward_interstitial();
    init_reward();
    init_consent();
    init_shared();
    init_app_open();
    AdMob = registerPlugin("AdMob", {
      web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.AdMobWeb())
    });
  }
});

// node_modules/@capacitor/app/dist/esm/definitions.js
var init_definitions2 = __esm({
  "node_modules/@capacitor/app/dist/esm/definitions.js"() {
  }
});

// node_modules/@capacitor/app/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  AppWeb: () => AppWeb
});
var AppWeb;
var init_web2 = __esm({
  "node_modules/@capacitor/app/dist/esm/web.js"() {
    init_dist();
    AppWeb = class extends WebPlugin {
      constructor() {
        super();
        this.handleVisibilityChange = () => {
          const data = {
            isActive: document.hidden !== true
          };
          this.notifyListeners("appStateChange", data);
          if (document.hidden) {
            this.notifyListeners("pause", null);
          } else {
            this.notifyListeners("resume", null);
          }
        };
        document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
      }
      exitApp() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getInfo() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getLaunchUrl() {
        return { url: "" };
      }
      async getState() {
        return { isActive: document.hidden !== true };
      }
      async minimizeApp() {
        throw this.unimplemented("Not implemented on web.");
      }
      async toggleBackButtonHandler() {
        throw this.unimplemented("Not implemented on web.");
      }
      async getAppLanguage() {
        return {
          value: navigator.language.split("-")[0].toLowerCase()
        };
      }
    };
  }
});

// node_modules/@capacitor/app/dist/esm/index.js
var esm_exports2 = {};
__export(esm_exports2, {
  App: () => App
});
var App;
var init_esm2 = __esm({
  "node_modules/@capacitor/app/dist/esm/index.js"() {
    init_dist();
    init_definitions2();
    App = registerPlugin("App", {
      web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.AppWeb())
    });
  }
});

// src/lib/scoped.js
function scoped(root) {
  return {
    getElementById: (id) => root.querySelector('[id="' + id + '"]'),
    querySelector: (s) => root.querySelector(s),
    querySelectorAll: (s) => root.querySelectorAll(s),
    createElement: (t) => window.document.createElement(t),
    get body() {
      return window.document.body;
    },
    get documentElement() {
      return window.document.documentElement;
    },
    addEventListener: (...a) => window.document.addEventListener(...a)
  };
}

// src/lib/assets.js
var HERO = { "02": "assets/hero_02.webp", "04": "assets/hero_04.webp", "05": "assets/hero_05.webp", "10": "assets/hero_10.webp", "joker_a": "assets/hero_joker_a.webp" };
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
var AVT_FREE = 5;

// src/screens/entry.js
function mount(root) {
  const document2 = scoped(root);
  const IMG = HERO;
  const FAN = [
    { key: "10", num: "10", ko: "\uD1A0\uB07C", en: "RABBIT" },
    { key: "joker_a", joker: true, ko: "\uCE74\uBA5C\uB808\uC628", en: "CHAMELEON" },
    { key: "02", num: "2", ko: "\uD638\uB791\uC774", en: "TIGER" },
    { key: "05", num: "5", ko: "\uC545\uC5B4", en: "CROCODILE" },
    { key: "04", num: "4", ko: "\uCF54\uB07C\uB9AC", en: "ELEPHANT" }
  ];
  const T = {
    ko: {
      eyebrow: "ZOO PRESIDENT",
      wordmark: "\uB3D9\uBB3C\uC758 \uC655\uAD6D",
      sub: "\uACC4\uAE09 \uCE74\uB4DC\uAC8C\uC784",
      start: "\uAD6C\uAE00\uB85C \uC2DC\uC791\uD558\uAE30",
      starting: "\uB4E4\uC5B4\uAC00\uB294 \uC911",
      enter: "\uAC8C\uC784 \uC2DC\uC791",
      guest: "\uAC8C\uC2A4\uD2B8\uB85C \uC2DC\uC791\uD558\uAE30",
      hintIn: "\uAD6C\uAE00\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uB7AD\uD0B9\uC5D0 \uC624\uB985\uB2C8\uB2E4",
      hintErr: "\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694",
      hintNet: "\uC778\uD130\uB137 \uC5F0\uACB0\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694"
    },
    en: {
      eyebrow: "CARD CLASH",
      wordmark: "Zoo President",
      sub: "Climbing card game",
      start: "Continue with Google",
      starting: "Signing in",
      enter: "Start game",
      guest: "Play as guest",
      hintIn: "Sign in with Google to appear on the leaderboard",
      hintErr: "Sign-in failed. Please try again",
      hintNet: "Check your internet connection"
    }
  };
  let lang = window.__lang || "ko";
  const fan = document2.getElementById("fan");
  function renderFan() {
    fan.innerHTML = "";
    FAN.forEach((c, i) => {
      const d = document2.createElement("div");
      d.className = "card" + (c.joker ? " is-joker" : "");
      d.dataset.i = i;
      d.innerHTML = c.joker ? '<div class="card__band"><span class="card__name">' + c[lang] + '</span></div><div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div><div class="card__band"><span class="card__mark">JOKER</span></div>' : '<div class="card__band"><span class="card__num">' + c.num + '</span><span class="card__name">' + c[lang] + '</span><span class="card__num">' + c.num + '</span></div><div class="card__art"><img src="' + IMG[c.key] + '" alt=""></div><div class="card__band"><span class="card__num">' + c.num + '</span><span class="card__num">' + c.num + "</span></div>";
      fan.appendChild(d);
    });
  }
  function apply() {
    const t = T[lang];
    document2.body.dataset.lang = lang;
    document2.documentElement.lang = lang;
    document2.getElementById("eyebrow").textContent = t.eyebrow;
    document2.getElementById("wordmark").textContent = t.wordmark;
    document2.getElementById("sub").textContent = t.sub;
    document2.getElementById("start").textContent = t.start;
    const g = document2.getElementById("testin");
    if (g) g.textContent = t.guest;
    renderFan();
  }
  apply();
  document2.querySelectorAll("#lang button").forEach((b) => {
    b.addEventListener("click", () => {
      lang = b.dataset.l;
      document2.querySelectorAll("#lang button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    });
  });
  window.addEventListener("langchange", () => {
    lang = window.__lang;
    apply();
  });
  let busy = false;
  function paintEntry() {
    const t = T[lang];
    const a = window.ACCOUNT;
    const b = document2.getElementById("start");
    const hint = document2.getElementById("hint");
    if (!b) return;
    if (busy) {
      b.textContent = t.starting;
      b.disabled = true;
      hint.textContent = "";
      return;
    }
    b.disabled = false;
    if (a && a.signedIn) {
      b.textContent = t.enter;
      hint.textContent = a.name || "";
      hint.className = "hint";
    } else {
      b.textContent = t.start;
      if (hint.className !== "hint hint--err") {
        hint.textContent = t.hintIn;
      }
    }
  }
  document2.getElementById("start").addEventListener("click", async (e) => {
    const a = window.ACCOUNT;
    if (a && a.signedIn) return;
    e.stopImmediatePropagation();
    const hint = document2.getElementById("hint");
    busy = true;
    paintEntry();
    try {
      await window.signInGoogle();
      hint.className = "hint";
    } catch (err) {
      hint.className = "hint hint--err";
      const code = String(err && err.code || "");
      hint.textContent = (navigator.onLine ? T[lang].hintErr : T[lang].hintNet) + (code ? " (" + code + ")" : "");
      console.warn(err);
    }
    busy = false;
    paintEntry();
  }, true);
  const tb = document2.getElementById("testin");
  if (tb) {
    tb.addEventListener("click", async (e) => {
      e.stopImmediatePropagation();
      busy = true;
      paintEntry();
      try {
        await window.signInGuest();
      } catch (err) {
        const hint = document2.getElementById("hint");
        hint.className = "hint hint--err";
        hint.textContent = String(err && err.code || err && err.message || err).slice(0, 60);
        console.warn(err);
      }
      busy = false;
      paintEntry();
    }, true);
  }
  function showTest() {
    if (!tb) return;
    const a = window.ACCOUNT;
    tb.textContent = T[lang].guest;
    tb.hidden = Boolean(a && a.signedIn);
  }
  window.addEventListener("accountready", showTest);
  window.addEventListener("accountchange", showTest);
  setTimeout(showTest, 300);
  window.addEventListener("accountready", paintEntry);
  window.addEventListener("accountchange", paintEntry);
  window.addEventListener("langchange", paintEntry);
  paintEntry();
}

// src/lib/sound.js
var KEY = { bgm: "zk_vol_bgm", sfx: "zk_vol_sfx", mute: "zk_mute" };
function readNum(k, dflt) {
  try {
    const v = localStorage.getItem(k);
    if (v == null) return dflt;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : dflt;
  } catch (e) {
    return dflt;
  }
}
function readBool(k) {
  try {
    return localStorage.getItem(k) === "1";
  } catch (e) {
    return false;
  }
}
function write(k, v) {
  try {
    localStorage.setItem(k, String(v));
  } catch (e) {
  }
}
var sound = {
  bgm: readNum(KEY.bgm, 50),
  sfx: readNum(KEY.sfx, 50),
  muted: readBool(KEY.mute)
};
var bgmGain = () => sound.muted ? 0 : sound.bgm / 100;
var sfxGain = () => sound.muted ? 0 : sound.sfx / 100;
var fns = [];
function onSound(fn) {
  fns.push(fn);
  return () => {
    const i = fns.indexOf(fn);
    if (i >= 0) fns.splice(i, 1);
  };
}
function tell() {
  applyBgm();
  fns.forEach((f) => {
    try {
      f(sound);
    } catch (e) {
      console.error(e);
    }
  });
}
function setBgm(v) {
  sound.bgm = Math.max(0, Math.min(100, Number(v) || 0));
  write(KEY.bgm, sound.bgm);
  tell();
}
function setSfx(v) {
  sound.sfx = Math.max(0, Math.min(100, Number(v) || 0));
  write(KEY.sfx, sound.sfx);
  tell();
}
function setMuted(on) {
  sound.muted = Boolean(on);
  write(KEY.mute, sound.muted ? 1 : 0);
  tell();
}
function toggleMute() {
  setMuted(!sound.muted);
  return sound.muted;
}
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
var BGM = {
  lobby: "assets/snd/bgm_lobby.webm"
};
var POOL = 4;
var pool = {};
function voices(src) {
  if (!pool[src]) {
    pool[src] = { i: 0, list: Array.from({ length: POOL }, () => {
      const a = new Audio(src);
      a.preload = "auto";
      try {
        a.load();
      } catch (e) {
      }
      return a;
    }) };
  }
  return pool[src];
}
function warm() {
  Object.keys(SFX).forEach((k) => {
    try {
      voices(SFX[k]);
    } catch (e) {
    }
  });
}
function play(name) {
  const src = SFX[name];
  if (!src) return;
  const g = sfxGain();
  if (g <= 0) return;
  try {
    const v = voices(src);
    const a = v.list[v.i];
    v.i = (v.i + 1) % v.list.length;
    try {
      a.currentTime = 0;
    } catch (e) {
    }
    a.volume = g;
    const p = a.play();
    if (p && p.catch) p.catch(() => {
    });
  } catch (e) {
  }
}
var bgmEl = null;
var bgmName = "";
function playBgm(name) {
  const src = BGM[name];
  if (!src) {
    stopBgm();
    return;
  }
  if (bgmName === name && bgmEl) {
    applyBgm();
    return;
  }
  stopBgm();
  try {
    bgmEl = new Audio(src);
    bgmEl.loop = true;
    bgmEl.volume = bgmGain();
    bgmName = name;
    try {
      window.__bgmOn = true;
    } catch (e) {
    }
    const p = bgmEl.play();
    if (p && p.catch) p.catch(() => {
    });
  } catch (e) {
  }
}
function stopBgm() {
  if (bgmEl) {
    try {
      bgmEl.pause();
    } catch (e) {
    }
  }
  bgmEl = null;
  bgmName = "";
  try {
    window.__bgmOn = false;
  } catch (e) {
  }
}
function applyBgm() {
  if (!bgmEl) return;
  const g = bgmGain();
  bgmEl.volume = g;
  if (g <= 0) {
    try {
      bgmEl.pause();
    } catch (e) {
    }
  } else {
    const p = bgmEl.play();
    if (p && p.catch) p.catch(() => {
    });
  }
}

// src/state.js
var opts = { cap: 4, rounds: 3, tax: true, clear2: false, seated: 0 };
var game = {
  N: 6,
  roundNo: 1,
  names: [],
  namesEn: [],
  hold: null,
  /* 자리별 손패 */
  order: null,
  /* 이번 판 순서 (앞이 선) */
  finish: null,
  /* 지난 판 완주 순서 */
  score: []
};
if (typeof window !== "undefined") {
  window.__opts = opts;
  window.GAME = game;
}

// src/lib/ads.js
var TEST_REWARD_ID = "ca-app-pub-3940256099942544/5224354917";
var AD_REWARD_ID = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AD_REWARD_ID || TEST_REWARD_ID;
function adsAvailable() {
  const C = typeof window !== "undefined" ? window.Capacitor : null;
  return Boolean(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
}
var TEST_INTER_ID = "ca-app-pub-3940256099942544/1033173712";
var AD_INTER_ID = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_AD_INTER_ID || TEST_INTER_ID;
var inited = false;
var showing = false;
async function showInterstitial() {
  if (globalThis.__ZOO_TEST && typeof window.__adInterTest === "function") return window.__adInterTest();
  if (!adsAvailable()) return { ok: false, why: "web" };
  if (showing) return { ok: false, why: "busy" };
  showing = true;
  try {
    const { AdMob: AdMob2, InterstitialAdPluginEvents: InterstitialAdPluginEvents2 } = await Promise.resolve().then(() => (init_esm(), esm_exports));
    if (!inited) {
      await AdMob2.initialize({});
      inited = true;
    }
    await AdMob2.prepareInterstitial({ adId: AD_INTER_ID, isTesting: AD_INTER_ID === TEST_INTER_ID });
    return await new Promise((resolve) => {
      let done = false;
      const subs = [];
      const finish = (v) => {
        if (done) return;
        done = true;
        subs.forEach((h) => {
          try {
            h.remove();
          } catch (e) {
          }
        });
        resolve(v);
      };
      const on = (ev, fn) => AdMob2.addListener(ev, fn).then((h) => subs.push(h)).catch(() => {
      });
      on(InterstitialAdPluginEvents2.Dismissed, () => finish({ ok: true }));
      on(InterstitialAdPluginEvents2.FailedToShow, () => finish({ ok: false, why: "show" }));
      AdMob2.showInterstitial().catch(() => finish({ ok: false, why: "show" }));
      setTimeout(() => finish({ ok: false, why: "timeout" }), 6e4);
    });
  } catch (e) {
    return { ok: false, why: "load" };
  } finally {
    showing = false;
  }
}

// src/nav.js
var GEAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3.5 7h9M17 7h3.5M3.5 12h4M12 12h8.5M3.5 17h8M15.5 17h5"/><circle cx="14.6" cy="7" r="2.1"/><circle cx="9.6" cy="12" r="2.1"/><circle cx="13.2" cy="17" r="2.1"/></svg>';
var OPT_HTML = '<div class="opts" id="opts" role="dialog" aria-modal="true"><div class="opts__v" data-optclose></div><div class="opts__p"><div class="opts__h"><span id="optT"></span><button class="opts__x" data-optclose aria-label="close">\xD7</button></div><div class="opts__b" id="optBody"></div><div class="opts__f"><button class="opts__go" id="optGo"></button></div></div></div>';
var PENCIL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg>';
var ACCT_HTML = '<div class="cfg" id="acctBox" role="dialog" aria-modal="true"><div class="cfg__v" data-acctclose></div><div class="cfg__p"><div class="cfg__h"><span id="acBoxT"></span><button class="cfg__x" data-acctclose aria-label="close">\xD7</button></div><div class="cfg__b"><div class="ac__name"><span id="acNick"></span><button id="acName" class="ac__edit" aria-label="rename"></button></div><p class="cfg__n" id="acLine"></p><div class="cfg__l" id="acAvtL"></div><div class="avt" id="acAvt"></div><div class="cfg__row" id="acLinkRow" hidden><button id="acLink"></button></div><div class="cfg__row"><button id="acOut"></button></div></div></div></div>';
var CFG_HTML = '<div class="cfg" id="cfg" role="dialog" aria-modal="true"><div class="cfg__v" data-cfgclose></div><div class="cfg__p"><div class="cfg__h"><span id="cfgT"></span><button class="cfg__x" data-cfgclose aria-label="close">\xD7</button></div><div class="cfg__b"><div class="cfg__l" id="cfgLangL"></div><div class="cfg__row"><button data-l="ko">\uD55C\uAD6D\uC5B4</button><button data-l="en">English</button></div><p class="cfg__n" id="cfgNote"></p><div class="cfg__l" id="cfgVolL"></div><div class="vol"><span class="vol__n" id="volBgmN"></span><input class="vol__b" id="volBgm" type="range" min="0" max="100" step="5"><span class="vol__v" id="volBgmV"></span></div><div class="vol"><span class="vol__n" id="volSfxN"></span><input class="vol__b" id="volSfx" type="range" min="0" max="100" step="5"><span class="vol__v" id="volSfxV"></span></div></div></div></div>';
function initNav() {
  window.__lang = function() {
    try {
      const v = localStorage.getItem("zk_lang");
      if (v === "ko" || v === "en") return v;
    } catch (e) {
    }
    const n = (navigator.language || navigator.userLanguage || "ko").toLowerCase();
    return n.indexOf("ko") === 0 ? "ko" : "en";
  }();
  window.setLang = (l) => {
    window.__lang = l;
    try {
      localStorage.setItem("zk_lang", l);
    } catch (e) {
    }
    document.documentElement.lang = l;
    document.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === l)));
    window.dispatchEvent(new Event("langchange"));
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-l]");
    if (b) window.setLang(b.dataset.l);
    if (e.target.closest("[data-rankopen]")) go("rank");
    if (e.target.closest("[data-cfgopen]")) openCfg();
    if (e.target.closest("[data-cfgclose]")) document.getElementById("cfg").classList.remove("on");
  });
  window.__opts = window.__opts || { cap: 4, rounds: 3, tax: true, clear2: false };
  let optMode = "create";
  const OPT_T = {
    ko: {
      create: "\uBC29 \uB9CC\uB4E4\uAE30",
      edit: "\uBC29 \uC124\uC815",
      goCreate: "\uBC29 \uB9CC\uB4E4\uAE30",
      goEdit: "\uD655\uC778",
      cap: ["\uBC29 \uC778\uC6D0", "4\uBA85 \u2013 8\uBA85"],
      rnd: ["\uD50C\uB808\uC774 \uD310 \uC218 \uC124\uC815", "\uCD5C\uC18C 3\uD310\uBD80\uD130 \uC2DC\uC791"],
      tax: ["\uC138\uAE08\uACFC \uD601\uBA85", "\uB4F1\uC218\uC5D0 \uB530\uB77C \uCE74\uB4DC\uB97C \uAD50\uD658\uD558\uACE0, \uC870\uCEE4 \uB450 \uC7A5\uC73C\uB85C \uC21C\uC704\uB97C \uB4A4\uC9D1\uB294 \uADDC\uCE59\uC785\uB2C8\uB2E4."],
      cut: ["2\uBC88 \uCEF7", "2\uBC88 \uCE74\uB4DC\uB97C \uB0B4\uBA74 \uBC14\uB2E5\uC744 \uBE44\uC6B0\uACE0 \uB2E4\uC2DC \uC120\uC744 \uC7A1\uC2B5\uB2C8\uB2E4."],
      friends: ["\uCE5C\uAD6C\uB4E4\uB07C\uB9AC \uD558\uAE30", ""],
      unit: "\uD310"
    },
    en: {
      create: "Create a room",
      edit: "Room settings",
      goCreate: "Create room",
      goEdit: "Done",
      cap: ["Table size", "4 \u2013 8 players"],
      rnd: ["Number of rounds", "Three at least"],
      tax: ["Tax and revolution", "Cards change hands by standing, and two jokers overturn it."],
      cut: ["Two-cut", "Playing a 2 clears the pile and you lead again."],
      friends: ["Friends only", ""],
      unit: ""
    }
  };
  function optRow(pair, right) {
    return '<div class="mk__row"><div><div class="mk__t">' + pair[0] + '</div><div class="mk__d">' + pair[1] + "</div></div>" + right + "</div>";
  }
  function optStep(k, v, lo, hi, unit) {
    return '<div class="mk__st"><button data-opt="' + k + '-"' + (v <= lo ? " disabled" : "") + ">\u2212</button><span>" + v + (unit || "") + '</span><button data-opt="' + k + '+"' + (v >= hi ? " disabled" : "") + ">+</button></div>";
  }
  function optSw(k, on) {
    return '<button class="mk__sw" data-opt="' + k + '" role="switch" aria-checked="' + on + '"></button>';
  }
  function optRender() {
    const t = OPT_T[window.__lang] || OPT_T.ko, o = window.__opts;
    const mk = optMode === "create";
    document.getElementById("optT").textContent = mk ? t.create : t.edit;
    document.getElementById("optGo").textContent = mk ? t.goCreate : t.goEdit;
    document.getElementById("optBody").innerHTML = optRow(t.cap, optStep("cap", o.cap, 4, 8)) + optRow(t.rnd, optStep("rnd", o.rounds, 3, 99, t.unit)) + optRow(t.tax, optSw("tax", o.tax)) + optRow(t.cut, optSw("cut", o.clear2)) + optRow(t.friends, optSw("friends", o.friends));
  }
  function openOpts(mode) {
    optMode = mode;
    optRender();
    document.getElementById("opts").classList.add("on");
  }
  document.addEventListener("click", (e) => {
    const k = e.target.closest("[data-opt]");
    if (k) {
      const o = window.__opts, v = k.dataset.opt;
      if (v === "cap-") o.cap = Math.max(4, o.cap - 1);
      if (v === "cap+") o.cap = Math.min(8, o.cap + 1);
      if (v === "rnd-") o.rounds = Math.max(3, o.rounds - 1);
      if (v === "rnd+") o.rounds = o.rounds + 1;
      if (v === "tax") o.tax = !o.tax;
      if (v === "cut") o.clear2 = !o.clear2;
      if (v === "friends") o.friends = !o.friends;
      optRender();
    }
    if (e.target.closest("[data-optclose]")) document.getElementById("opts").classList.remove("on");
    if (e.target.closest("[data-optopen]")) openOpts("edit");
  });
  document.getElementById("optGo").addEventListener("click", () => {
    document.getElementById("opts").classList.remove("on");
    if (optMode === "create") {
      if (window.__createRoom) {
        window.__createRoom().then((code) => {
          if (code) go("room");
        }).catch(() => {
          go("lobby");
          netNote();
        });
      } else setTimeout(() => go("room"), 80);
    } else {
      window.dispatchEvent(new Event("optschange"));
      if (window.__saveOpts) window.__saveOpts();
    }
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("opts").classList.contains("on")) optRender();
  });
  const CFG_T = {
    ko: {
      title: "\uC124\uC815",
      lang: "\uC5B8\uC5B4",
      note: "\uCC98\uC74C \uB4E4\uC5B4\uC624\uBA74 \uAE30\uAE30 \uC5B8\uC5B4\uC5D0 \uB9DE\uCDB0 \uC790\uB3D9\uC73C\uB85C \uC815\uD574\uC9D1\uB2C8\uB2E4. \uC5EC\uAE30\uC11C \uBC14\uAFB8\uBA74 \uADF8 \uC120\uD0DD\uC744 \uAE30\uC5B5\uD569\uB2C8\uB2E4."
    },
    en: {
      title: "Settings",
      lang: "LANGUAGE",
      note: "The game picks your device language on first visit. Changing it here is remembered."
    }
  };
  function openCfg() {
    const t = CFG_T[window.__lang] || CFG_T.ko;
    document.getElementById("cfgT").textContent = t.title;
    document.getElementById("cfgLangL").textContent = t.lang;
    document.getElementById("cfgNote").textContent = "";
    paintVol();
    document.getElementById("cfg").classList.add("on");
  }
  function paintVol() {
    const ko = (window.__lang || "ko") === "ko";
    const set = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.textContent = v;
    };
    set("cfgVolL", ko ? "\uC74C\uB7C9" : "Volume");
    set("volBgmN", ko ? "\uBC30\uACBD\uC74C\uC545" : "Music");
    set("volSfxN", ko ? "\uD6A8\uACFC\uC74C" : "Effects");
    set("volBgmV", sound.bgm + "");
    set("volSfxV", sound.sfx + "");
    const b = document.getElementById("volBgm"), f = document.getElementById("volSfx");
    if (b) b.value = String(sound.bgm);
    if (f) f.value = String(sound.sfx);
  }
  function paintMute() {
    const b = document.getElementById("btMute");
    if (!b) return;
    b.setAttribute("aria-pressed", String(!sound.muted));
    b.classList.toggle("is-off", sound.muted);
    b.setAttribute("aria-label", sound.muted ? "\uC18C\uB9AC \uCF1C\uAE30" : "\uC18C\uB9AC \uB044\uAE30");
  }
  document.addEventListener("input", (e) => {
    if (e.target.id === "volBgm") {
      setBgm(e.target.value);
      paintVol();
    }
    if (e.target.id === "volSfx") {
      setSfx(e.target.value);
      paintVol();
    }
  });
  let lastBtnAt = 0;
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btMute")) {
      toggleMute();
      paintMute();
      paintVol();
      return;
    }
    const b = e.target.closest("button");
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    const quiet = e.target.closest(".emopick") || e.target.closest("#emo");
    const t = Date.now();
    if (t - lastBtnAt < 350) return;
    if (b && !b.disabled && now !== "entry" && !quiet) {
      lastBtnAt = t;
      play("button");
    }
  });
  let touched = false;
  onSound(() => {
    paintMute();
  });
  const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const FR_T = {
    ko: {
      title: "\uCE5C\uAD6C",
      list: "\uBAA9\uB85D",
      add: "\uCD94\uAC00",
      rank: "\uC21C\uC704",
      find: "\uBCC4\uBA85\uC73C\uB85C \uCC3E\uAE30",
      search: "\uCC3E\uAE30",
      none: "\uC544\uC9C1 \uCE5C\uAD6C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      noReq: "",
      online: "\uC811\uC18D \uC911",
      inGame: "\uAC8C\uC784 \uC911",
      off: "\uC624\uD504\uB77C\uC778",
      invite: "\uCD08\uB300",
      del: "\uC0AD\uC81C",
      accept: "\uC218\uB77D",
      no: "\uAC70\uC808",
      req: "\uBC1B\uC740 \uC2E0\uCCAD",
      sent: "\uC2E0\uCCAD\uD588\uC2B5\uB2C8\uB2E4",
      already: "\uC774\uBBF8 \uCE5C\uAD6C\uC785\uB2C8\uB2E4",
      notFound: "\uADF8\uB7F0 \uBCC4\uBA85\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
      self: "\uC790\uAE30 \uC790\uC2E0\uC740 \uC548 \uB429\uB2C8\uB2E4",
      needRoom: "\uBC29\uC5D0 \uC788\uC744 \uB54C\uB9CC \uBD80\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4",
      invited: "\uBD88\uB800\uC2B5\uB2C8\uB2E4",
      busy: "\uAC8C\uC784 \uC911\uC774\uB77C \uBABB \uBD80\uB985\uB2C8\uB2E4",
      pts: "\uC810"
    },
    en: {
      title: "Friends",
      list: "List",
      add: "Add",
      rank: "Rank",
      find: "Find by name",
      search: "Find",
      none: "No friends yet",
      noReq: "",
      online: "Online",
      inGame: "In game",
      off: "Offline",
      invite: "Invite",
      del: "Remove",
      accept: "Accept",
      no: "Decline",
      req: "Requests",
      sent: "Request sent",
      already: "Already friends",
      notFound: "No such name",
      self: "That's you",
      needRoom: "Open a room first",
      invited: "Invited",
      busy: "They're in a game",
      pts: "pts"
    }
  };
  let frTab = "list";
  let frInviteMode = false;
  const FR = () => window.__friends || {};
  const frT = () => FR_T[window.__lang] || FR_T.ko;
  function frNote(msg) {
    const e = document.getElementById("frNote");
    if (e) e.textContent = msg || "";
  }
  async function frPaint() {
    const t = frT();
    const box = document.getElementById("frBody");
    if (!box) return;
    document.getElementById("frT").textContent = frInviteMode ? (window.__lang || "ko") === "ko" ? "\uCE5C\uAD6C \uBD80\uB974\uAE30" : "Invite a friend" : t.title;
    document.querySelector('[data-frtab="list"]').textContent = t.list;
    document.querySelector('[data-frtab="add"]').textContent = t.add;
    document.querySelector('[data-frtab="rank"]').textContent = t.rank;
    document.querySelectorAll("[data-frtab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.frtab === frTab)));
    document.getElementById("frFind").hidden = frTab !== "add";
    document.getElementById("frSearch").textContent = t.search;
    document.getElementById("frName").placeholder = t.find;
    const want = frTab;
    let html = "";
    if (frTab === "add") {
      const reqs = await FR().incoming();
      html = !reqs.length ? "" : '<div class="fr__h">' + t.req + "</div>" + reqs.map((r) => '<div class="fr__row"><span class="fr__n">' + esc(r.name || "") + '</span><button class="fr__b" data-fraccept="' + r.uid + '" data-frname="' + esc(r.name || "") + '">' + t.accept + '</button><button class="fr__b fr__b--off" data-frno="' + r.uid + '">' + t.no + "</button></div>").join("");
    } else if (frTab === "rank") {
      const rows = await FR().friendRank();
      html = rows.map((r, i) => '<div class="fr__row' + (r.mine ? " fr__row--me" : "") + '"><span class="fr__k">' + (i + 1) + '</span><span class="fr__n">' + esc(r.name || "") + '</span><span class="fr__s">' + (r.score || 0).toLocaleString() + t.pts + "</span></div>").join("");
    } else {
      const rows = await FR().listFriends();
      html = !rows.length ? '<p class="cfg__n">' + t.none + "</p>" : rows.map((r) => {
        const where = !r.online ? t.off : r.state === "game" ? t.inGame : t.online;
        const dot = !r.online ? "off" : r.state === "game" ? "game" : "on";
        if (frInviteMode) {
          const busy = r.online && r.state === "game";
          return '<div class="fr__row' + (busy || !r.online ? " fr__row--off" : "") + '"' + (busy || !r.online ? "" : ' data-frinv="' + r.uid + '"') + '><i class="fr__dot fr__dot--' + dot + '"></i><span class="fr__n">' + esc(r.name || "") + '</span><span class="fr__w">' + (busy ? t.busy : where) + "</span></div>";
        }
        return '<div class="fr__row"><i class="fr__dot fr__dot--' + dot + '"></i><span class="fr__n">' + esc(r.name || "") + '</span><span class="fr__w">' + where + '</span><button class="fr__b fr__b--off" data-frdel="' + r.uid + '">' + t.del + "</button></div>";
      }).join("");
    }
    if (want !== frTab) return;
    box.innerHTML = html;
  }
  window.__openFriends = (mode) => {
    frInviteMode = mode === "invite";
    frTab = "list";
    frNote("");
    document.getElementById("frBox").classList.add("on");
    frPaint();
  };
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-friendopen]")) {
      window.__openFriends();
      return;
    }
    if (e.target.closest("[data-frclose]")) {
      document.getElementById("frBox").classList.remove("on");
      return;
    }
    const tb = e.target.closest("[data-frtab]");
    if (tb) {
      frTab = tb.dataset.frtab;
      frNote("");
      frPaint();
      return;
    }
    if (e.target.closest("#frSearch")) {
      const t = frT();
      const v = (document.getElementById("frName").value || "").trim();
      const f = await FR().findByName(v);
      if (!f) {
        frNote(t.notFound);
        return;
      }
      if (f.self) {
        frNote(t.self);
        return;
      }
      const r = await FR().sendRequest(f.uid, f.name);
      frNote(r.ok ? t.sent : r.why === "already" ? t.already : t.notFound);
      return;
    }
    const ac = e.target.closest("[data-fraccept]");
    if (ac) {
      await FR().accept(ac.dataset.fraccept, ac.dataset.frname);
      frPaint();
      return;
    }
    const no = e.target.closest("[data-frno]");
    if (no) {
      await FR().reject(no.dataset.frno);
      frPaint();
      return;
    }
    const del = e.target.closest("[data-frdel]");
    if (del) {
      await FR().removeFriend(del.dataset.frdel);
      frPaint();
      return;
    }
    const inv = e.target.closest("[data-frinv]");
    if (inv) {
      const t = frT();
      const code = (window.__room || {}).code;
      if (!code) {
        frNote(t.needRoom);
        return;
      }
      await FR().invite(inv.dataset.frinv, code);
      if (frInviteMode) {
        document.getElementById("frBox").classList.remove("on");
        return;
      }
      frNote(t.invited);
      return;
    }
  });
  const PLAY = ["table", "draw", "tax", "result"];
  let lastState = "";
  function pushPresence() {
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    if (now === "entry") return;
    const st = PLAY.includes(now) ? "game" : "lobby";
    if (st === lastState) return;
    lastState = st;
    if (FR().setPresence) FR().setPresence(st);
  }
  setInterval(() => {
    lastState = "";
    pushPresence();
  }, 6e4);
  let invSeen = {};
  async function checkInvites() {
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    if (now === "entry" || PLAY.includes(now)) return;
    if (!FR().invites) return;
    const rows = await FR().invites();
    const t = frT();
    for (const r of rows) {
      if (invSeen[r.uid] === r.code) continue;
      invSeen[r.uid] = r.code;
      const ko = (window.__lang || "ko") === "ko";
      ask(
        ko ? "\uCD08\uB300" : "Invite",
        (r.name || "") + (ko ? " \uB2D8\uC774 \uBD88\uB800\uC2B5\uB2C8\uB2E4" : " invited you"),
        ko ? "\uB4E4\uC5B4\uAC00\uAE30" : "Join",
        async () => {
          await FR().dropInvite(r.uid);
          if (window.__joinRoom) {
            const seat = await window.__joinRoom(r.code);
            if (seat != null) go("room");
          }
        }
      );
      break;
    }
  }
  setInterval(checkInvites, 1e4);
  function paintAvatars() {
    const wrap = document.getElementById("acAvt");
    const lab = document.getElementById("acAvtL");
    if (!wrap || !lab) return;
    const ko = (window.__lang || "ko") === "ko";
    const a = window.ACCOUNT || {};
    const score = a.score || 0;
    const mine = Number(a.avatar) || 0;
    lab.textContent = ko ? "\uD504\uB85C\uD544 \uC124\uC815" : "Profile";
    wrap.innerHTML = AVATARS.map((v, i) => {
      const open = score >= (i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5e3);
      const need = i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5e3;
      const lock = open ? "" : '<i class="avt__lk"></i><span class="avt__need"><b>' + need.toLocaleString() + (ko ? "\uC810" : "") + "</b><i>" + (ko ? "\uB2EC\uC131 \uC2DC \uD574\uC81C" : "to unlock") + "</i></span>";
      return '<button class="avt__i' + (open ? "" : " avt__i--lock") + (i === mine ? " avt__i--on" : "") + '" data-avt="' + i + '" style="background-image:url(' + v.f + ')" aria-label="' + (ko ? v.ko : v.en) + '">' + lock + "</button>";
    }).join("");
  }
  function paintAcct() {
    paintVol();
    const ko = (window.__lang || "ko") === "ko";
    const a = window.ACCOUNT;
    paintAvatars();
    const lab = document.getElementById("acBoxT");
    const line = document.getElementById("acLine");
    const row = document.getElementById("acLinkRow");
    let btn = document.getElementById("acLink");
    if (!lab || !line || !row) return;
    if (conflictOn) return;
    if (!row.querySelector("#acLink")) {
      row.innerHTML = '<button id="acLink"></button>';
      btn = document.getElementById("acLink");
    }
    if (!btn) return;
    lab.textContent = ko ? "\uACC4\uC815" : "Account";
    if (!a || !a.signedIn) {
      line.hidden = false;
      line.textContent = ko ? "\uB85C\uADF8\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4" : "Not signed in";
      row.hidden = true;
      return;
    }
    if (a.guest) {
      line.hidden = false;
      line.textContent = ko ? "\uAC8C\uC2A4\uD2B8 \xB7 \uB7AD\uD0B9\uC5D0 \uC624\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" : "Guest \xB7 not on the leaderboard";
      btn.textContent = ko ? "\uAD6C\uAE00 \uACC4\uC815 \uC787\uAE30" : "Link Google account";
      row.hidden = false;
    } else {
      line.textContent = "";
      line.hidden = true;
      row.hidden = true;
    }
    const nick = document.getElementById("acNick");
    const pen = document.getElementById("acName");
    if (nick) nick.textContent = a.name || (ko ? "\uC774\uB984\uC5C6\uC74C" : "No name");
    if (pen) {
      pen.innerHTML = PENCIL;
      pen.hidden = false;
    }
    const outBtn = document.getElementById("acOut");
    if (outBtn) {
      outBtn.textContent = ko ? "\uB85C\uADF8\uC544\uC6C3" : "Sign out";
      outBtn.hidden = false;
    }
  }
  window.addEventListener("accountchange", () => {
    const b = document.getElementById("acctBox");
    if (b && b.classList.contains("on")) paintAcct();
  });
  let conflictOn = false;
  function showConflict() {
    conflictOn = true;
    const ko = (window.__lang || "ko") === "ko";
    const box = document.getElementById("acLinkRow");
    if (!box) return;
    box.hidden = false;
    box.innerHTML = '<p class="cfg__n" style="margin:0 0 8px">' + (ko ? "\uC774\uBBF8 \uADF8 \uAD6C\uAE00 \uACC4\uC815\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uADF8 \uACC4\uC815\uC73C\uB85C \uB4E4\uC5B4\uAC00\uBA74 \uAC8C\uC2A4\uD2B8\uB85C \uC313\uC740 \uC810\uC218\uB294 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4." : "That Google account already exists. Signing in will discard your guest progress.") + '</p><button id="acSwitch">' + (ko ? "\uAE30\uC874 \uACC4\uC815\uC73C\uB85C \uB4E4\uC5B4\uAC00\uAE30" : "Sign in to that account") + '</button><button id="acKeep">' + (ko ? "\uCDE8\uC18C" : "Cancel") + "</button>";
  }
  window.__showLinkConflict = () => {
    openAcct();
    showConflict();
  };
  let nameBox = null;
  function openName() {
    const ko = (window.__lang || "ko") === "ko";
    if (!nameBox) {
      nameBox = document.createElement("div");
      nameBox.className = "cfg";
      nameBox.id = "nkBox";
      document.getElementById("stage").appendChild(nameBox);
    }
    nameBox.innerHTML = '<div class="cfg__v" data-nkclose></div><div class="cfg__p"><div class="cfg__h"><span>' + (ko ? "\uBCC4\uBA85 \uC815\uD558\uAE30" : "Choose a name") + '</span><button class="cfg__x" data-nkclose aria-label="close">\xD7</button></div><div class="cfg__b"><p class="cfg__n">' + (ko ? "\uD55C\uAE00 6\uC790 \uB610\uB294 \uC601\uBB38\xB7\uC22B\uC790 8\uC790\uAE4C\uC9C0. \uB2E4\uB978 \uC0AC\uB78C\uACFC \uACB9\uCE60 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." : "Up to 6 Korean or 8 Latin characters. Must be unique.") + '</p><input id="nkIn" maxlength="16" autocomplete="off" spellcheck="false" class="nk__in"><p class="hint" id="nkMsg"></p><div class="cfg__row"><button id="nkOk">' + (ko ? "\uC815\uD558\uAE30" : "Save") + "</button></div></div></div>";
    const inp = nameBox.querySelector("#nkIn");
    if (inp) {
      inp.value = window.ACCOUNT && window.ACCOUNT.name || "";
      setTimeout(() => inp.focus(), 60);
    }
    nameBox.classList.add("on");
  }
  function closeName() {
    if (nameBox) nameBox.classList.remove("on");
  }
  window.__askName = openName;
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-nkclose]")) {
      closeName();
      return;
    }
    if (!e.target.closest("#nkOk")) return;
    const ko = (window.__lang || "ko") === "ko";
    const inp = document.getElementById("nkIn");
    const msg = document.getElementById("nkMsg");
    const btn = document.getElementById("nkOk");
    if (!inp || !window.setNickname) return;
    btn.disabled = true;
    msg.className = "hint";
    msg.textContent = ko ? "\uD655\uC778\uD558\uB294 \uC911" : "Checking";
    let r = null;
    try {
      r = await window.setNickname(inp.value);
    } catch (err) {
      msg.className = "hint hint--err";
      msg.textContent = String(err && err.code || err);
      btn.disabled = false;
      return;
    }
    if (r && r.ok) {
      closeName();
      btn.disabled = false;
      paintAcct();
      return;
    }
    const why = r && r.why;
    msg.className = "hint hint--err";
    msg.textContent = why === "taken" ? ko ? "\uC774\uBBF8 \uC4F0\uB294 \uC774\uB984\uC785\uB2C8\uB2E4" : "That name is taken" : why === "long" ? ko ? "\uB108\uBB34 \uAE41\uB2C8\uB2E4. \uD55C\uAE00 6\uC790 \uB610\uB294 \uC601\uBB38 8\uC790\uAE4C\uC9C0" : "Too long" : why === "space" ? ko ? "\uB744\uC5B4\uC4F0\uAE30\uB294 \uB123\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" : "No spaces" : why === "char" ? ko ? "\uD55C\uAE00, \uC601\uBB38, \uC22B\uC790\uB9CC \uB429\uB2C8\uB2E4" : "Letters and numbers only" : ko ? "\uC774\uB984\uC744 \uB123\uC5B4 \uC8FC\uC138\uC694" : "Please enter a name";
    btn.disabled = false;
  });
  function openAcct() {
    let box = document.getElementById("acctBox");
    if (!box) {
      const st = document.getElementById("stage");
      if (!st) return;
      st.insertAdjacentHTML("beforeend", ACCT_HTML);
      box = document.getElementById("acctBox");
    }
    paintAcct();
    box.classList.add("on");
  }
  function closeAcct() {
    const b = document.getElementById("acctBox");
    if (b) b.classList.remove("on");
  }
  window.__openAcct = openAcct;
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-acctclose]")) {
      closeAcct();
      return;
    }
    if (e.target.closest("#acctProfile") || e.target.closest("[data-acctopen]")) openAcct();
    if (e.target.closest("#acName") && window.__askName) window.__askName();
  });
  document.addEventListener("click", async (e) => {
    if (e.target.closest("#acSwitch")) {
      conflictOn = false;
      if (window.switchToGoogle) await window.switchToGoogle();
      paintAcct();
      return;
    }
    if (e.target.closest("#acKeep")) {
      conflictOn = false;
      paintAcct();
      return;
    }
    if (e.target.closest("#acOut")) {
      const ko2 = (window.__lang || "ko") === "ko";
      ask(
        ko2 ? "\uB85C\uADF8\uC544\uC6C3" : "Sign out",
        ko2 ? "\uB85C\uADF8\uC544\uC6C3\uC744 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?" : "Sign out of this account?",
        ko2 ? "\uC608" : "Sign out",
        async () => {
          conflictOn = false;
          try {
            if (window.signOutNow) await window.signOutNow();
          } catch (err) {
            window.alert((ko2 ? "\uB85C\uADF8\uC544\uC6C3\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4\n" : "Sign out failed\n") + String(err && err.code || err));
          }
          closeAcct();
          go("entry");
        }
      );
    }
  });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#acLink")) return;
    const ko = (window.__lang || "ko") === "ko";
    const btn = document.getElementById("acLink");
    btn.disabled = true;
    try {
      const r = window.linkGoogle ? await window.linkGoogle() : null;
      if (r && r.already) {
        window.alert(ko ? "\uC774\uBBF8 \uAD6C\uAE00 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD574 \uC788\uC2B5\uB2C8\uB2E4" : "Already signed in with Google");
      } else if (r && r.redirecting) {
      } else if (r && r.conflict) {
        showConflict();
      }
    } catch (err) {
      const code = String(err && err.code || err && err.message || err);
      window.alert((ko ? "\uC787\uAE30\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4\n" : "Linking failed\n") + code);
      console.warn(err);
    }
    btn.disabled = false;
    paintAcct();
  });
  window.addEventListener("langchange", () => {
    if (document.getElementById("cfg").classList.contains("on")) openCfg();
  });
  window.setLang(window.__lang);
  window.__goto = (id) => go(id);
  window.__toTable = () => {
    window.__fresh = false;
    go("table");
  };
  let interDone = false;
  function go(id) {
    if (id === "draw") interDone = false;
    if (id === "lobby") {
      const cur = (document.querySelector(".page.is-on") || {}).id;
      if (cur === "room" && window.__leaveRoom) window.__leaveRoom();
    }
    if (id === "tax" && window.__holdPlay) window.__holdPlay(true);
    if (id === "lobby") {
      touched = true;
      warm();
      askResume();
    }
    setTimeout(pushPresence, 0);
    if (touched) {
      if (id === "lobby" || id === "rank") playBgm("lobby");
      else stopBgm();
    }
    if (id === "draw" && window.__bootDraw) window.__bootDraw();
    if (id === "table" && window.__bootTable) {
      window.__bootTable(window.__fresh !== false);
      window.__fresh = false;
    }
    if (id === "tax" && window.__bootTax) window.__bootTax();
    if (id === "result" && window.__bootResult) window.__bootResult();
    if (id === "rank" && window.__bootRank) window.__bootRank();
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("is-on"));
    document.getElementById(id).classList.add("is-on");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
  document.querySelector("#entry #start").addEventListener("click", () => go("lobby"));
  let noneTimer = null;
  function lobbyNote(msg) {
    const h = document.querySelector("#lobby #hQuick");
    if (!h) return;
    if (!h.dataset.orig) h.dataset.orig = h.textContent || "";
    h.textContent = msg;
    h.classList.add("hint--warn");
    if (noneTimer) clearTimeout(noneTimer);
    noneTimer = setTimeout(() => {
      h.textContent = h.dataset.orig || "";
      h.classList.remove("hint--warn");
    }, 2500);
  }
  const T_NET = { ko: "\uC11C\uBC84\uC5D0 \uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4", en: "Can't reach the server" };
  const netNote = () => lobbyNote(T_NET[window.__lang] || T_NET.ko);
  document.querySelector("#lobby #btQuick").addEventListener("click", async () => {
    const f = window.__quickJoin;
    if (!f) return;
    window.__quickNone = false;
    let code = null;
    try {
      code = await f();
    } catch (e) {
      netNote();
      return;
    }
    if (code) {
      go("room");
      return;
    }
    if (window.__quickNone) {
      const L = window.__lobbyT ? window.__lobbyT() : null;
      lobbyNote(L && L.none || "\uC9C0\uAE08 \uB4E4\uC5B4\uAC08 \uBC29\uC774 \uC5C6\uC2B5\uB2C8\uB2E4");
      if (window.__refreshOpen) window.__refreshOpen();
    }
  });
  document.querySelector("#lobby #btJoin").addEventListener("click", async () => {
    const inp = document.querySelector("#lobby #code");
    const code = (inp && (inp.value || inp.textContent) || "").replace(/[^0-9]/g, "");
    if (code.length !== 4) {
      alert("\uB124 \uC790\uB9AC \uBC88\uD638\uB97C \uB123\uC5B4 \uC8FC\uC138\uC694");
      return;
    }
    if (window.__joinRoom) {
      const seat = await window.__joinRoom(code);
      if (seat == null) return;
    }
    go("room");
  });
  document.querySelector("#lobby #btNew").addEventListener("click", () => openOpts("create"));
  document.querySelector("#room #action").addEventListener("click", (e) => {
    const b = e.target.closest(".btn-primary");
    if (!b || b.disabled) return;
    go("draw");
  });
  document.querySelector("#draw #go").addEventListener("click", (e) => {
    if (!e.currentTarget.disabled) {
      window.__fresh = true;
      go("table");
    }
  });
  window.__onRoundEnd = () => go("result");
  document.querySelector("#result #next").addEventListener("click", () => {
    const G = window.GAME || {};
    const rounds = window.__opts && window.__opts.rounds || 5;
    if ((G.roundNo || 1) >= rounds) return;
    G.roundNo = (G.roundNo || 1) + 1;
    window.__roundNo = G.roundNo;
    if (window.__opts && window.__opts.tax === false) {
      window.__fresh = true;
      go("table");
    } else {
      go("tax");
    }
  });
  let leaving = false;
  document.querySelector("#result #quit").addEventListener("click", async () => {
    if (leaving) return;
    const show = Boolean(window.__resultFinal) && !interDone;
    if (!show) {
      go("lobby");
      return;
    }
    leaving = true;
    interDone = true;
    try {
      await showInterstitial();
    } catch (e) {
    }
    leaving = false;
    go("lobby");
  });
  window.__toResult = () => go("result");
  document.querySelector("#tax #next").addEventListener("click", (e) => {
    const label = e.currentTarget.textContent.trim();
    if (label === "\uD310 \uC2DC\uC791" || label === "Start round") {
      window.__fresh = false;
      setTimeout(() => go("table"), 140);
    }
  });
  const ASK_T = {
    ko: {
      quit: "\uAC8C\uC784 \uC885\uB8CC",
      quitM: "\uAC8C\uC784\uC744 \uC885\uB8CC\uD560\uAE4C\uC694?",
      yes: "\uC885\uB8CC",
      no: "\uCDE8\uC18C",
      leave: "\uD310\uC5D0\uC11C \uB098\uAC00\uAE30",
      leaveM: "\uB098\uAC00\uBA74 \uB2E4\uC2DC \uB4E4\uC5B4\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4\n\uC644\uC8FC \uC2E4\uD328\uB85C \uAE30\uB85D\uB429\uB2C8\uB2E4",
      leaveY: "\uB098\uAC00\uAE30",
      room: "\uBC29 \uB098\uAC00\uAE30",
      roomM: "\uBC29\uC5D0\uC11C \uB098\uAC08\uAE4C\uC694?"
    },
    en: {
      quit: "Quit",
      quitM: "Close the game?",
      yes: "Quit",
      no: "Cancel",
      leave: "Leave the game",
      leaveM: "You can't come back to this game\nLeaving counts as a forfeit",
      leaveY: "Leave",
      room: "Leave room",
      roomM: "Leave this room?"
    }
  };
  const BACK_T = {
    ko: {
      t: "\uD558\uB358 \uBC29\uC774 \uC788\uC2B5\uB2C8\uB2E4",
      m: (code) => "\uBC29 " + code + " \uB85C \uB3CC\uC544\uAC08\uAE4C\uC694?",
      y: "\uC774\uC5B4\uC11C \uD558\uAE30"
    },
    en: {
      t: "You left a game",
      m: (code) => "Go back to room " + code + "?",
      y: "Resume"
    }
  };
  let resumeAsked = false;
  async function askResume() {
    if (resumeAsked) return;
    resumeAsked = true;
    if (!window.__resumable) return;
    let r = null;
    try {
      r = await window.__resumable();
    } catch (e) {
      r = null;
    }
    if (!r) return;
    const t = BACK_T[window.__lang] || BACK_T.ko;
    ask(t.t, t.m(r.code), t.y, () => {
      if (window.__resume) window.__resume();
    });
  }
  let askYes = null;
  function ask(title, msg, yesLabel, onYes) {
    const t = ASK_T[window.__lang] || ASK_T.ko;
    if (!document.getElementById("askT")) {
      if (onYes) onYes();
      return;
    }
    document.getElementById("askT").textContent = title;
    document.getElementById("askM").textContent = msg;
    document.getElementById("askYes").textContent = yesLabel;
    document.getElementById("askNo").textContent = t.no;
    askYes = onYes;
    document.getElementById("ask").classList.add("on");
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-avt]");
    if (!b) return;
    const i = Number(b.dataset.avt);
    const ko = (window.__lang || "ko") === "ko";
    const need = i < AVT_FREE ? 0 : (i - AVT_FREE + 1) * 5e3;
    const score = (window.ACCOUNT || {}).score || 0;
    if (score < need) return;
    if (window.__setAvatar) await window.__setAvatar(i);
    paintAvatars();
  });
  function askClose() {
    document.getElementById("ask").classList.remove("on");
    askYes = null;
  }
  function askOpen() {
    return document.getElementById("ask").classList.contains("on");
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-askno]")) {
      askClose();
      return;
    }
    if (e.target.closest("#askYes")) {
      const f = askYes;
      askClose();
      if (f) f();
    }
  });
  function onBack() {
    if (askOpen()) {
      askClose();
      return;
    }
    const open = [...document.querySelectorAll(
      '.cfg.on, [role="dialog"].on, [role="dialog"].is-open'
    )].filter((d) => d.id !== "ask");
    if (open.length) {
      const d = open[open.length - 1];
      d.classList.remove("on");
      d.classList.remove("is-open");
      return;
    }
    const now = (document.querySelector(".page.is-on") || {}).id || "entry";
    const t = ASK_T[window.__lang] || ASK_T.ko;
    if (now === "lobby" || now === "entry") {
      ask(t.quit, t.quitM, t.yes, quitApp);
      return;
    }
    if (now === "rank") {
      go("lobby");
      return;
    }
    if (now === "room") {
      ask(t.room, t.roomM, t.roomY || t.leaveY, () => {
        if (window.__leaveRoom) window.__leaveRoom();
        go("lobby");
      });
      return;
    }
    if (now === "table" || now === "tax") {
      ask(t.leave, t.leaveM, t.leaveY, () => {
        if (window.__quitGame) window.__quitGame();
        go("lobby");
      });
      return;
    }
  }
  window.__back = onBack;
  function quitApp() {
    const cap = window.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.App && cap.Plugins.App.exitApp) {
      cap.Plugins.App.exitApp();
      return;
    }
    try {
      window.close();
    } catch (e) {
    }
  }
  try {
    history.pushState({ zoo: 1 }, "");
    window.addEventListener("popstate", () => {
      history.pushState({ zoo: 1 }, "");
      onBack();
    });
  } catch (e) {
  }
  (async () => {
    try {
      if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()))
        return;
      const { App: App2 } = await Promise.resolve().then(() => (init_esm2(), esm_exports2));
      App2.addListener("backButton", () => onBack());
    } catch (e) {
      try {
        const cap = window.Capacitor;
        if (cap && cap.Plugins && cap.Plugins.App && cap.Plugins.App.addListener)
          cap.Plugins.App.addListener("backButton", () => onBack());
      } catch (e2) {
      }
    }
  })();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-back]");
    if (!b) return;
    if (b.closest("#table")) {
      if (window.__back) window.__back();
      return;
    }
    if (b.closest("#room")) {
      if (window.__back) window.__back();
      return;
    }
    go(b.dataset.back);
  });
}

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
    '<div style="display:flex;align-items:center;gap:6px"><div class="bar__t" id="step"></div></div>'
  ],
  "result": [
    '<div class="head__k" id="kicker"></div>',
    '<div class="head__k" id="kicker"></div>'
  ],
  "tax": [
    '<div class="bar__t" id="step"></div>',
    '<div style="display:flex;align-items:center;gap:6px"><div class="bar__t" id="step"></div></div>'
  ],
  "table": [
    '<button class="bar__x" aria-label="\uB098\uAC00\uAE30">\u2715</button>',
    '<button class="bar__x" data-back="lobby" aria-label="\uB098\uAC00\uAE30">\u2715</button>'
  ]
};

// src/screens/_markup.js
var MARKUP = {
  "entry": '<div class="bg">\n  <div class="bg__img"></div>\n  <div class="bg__top"></div>\n  <div class="bg__bot"></div>\n</div>\n\n<div class="fan"><div class="fan__in" id="fan"></div></div>\n\n<main class="screen">\n  <div class="plate">\n    <div class="eyebrow" id="eyebrow"></div>\n    <h1 class="wordmark" id="wordmark"></h1>\n    <p class="sub" id="sub"></p>\n    <div class="hr"></div>\n  </div>\n  <div class="spacer"></div>\n  <button class="btn" id="start"></button>\n  <p class="hint" id="hint"></p>\n  <button class="testin" id="testin" hidden>\uC2DC\uD5D8\uC6A9 \uB85C\uADF8\uC778</button>\n</main>',
  "lobby": '<div class="veil"></div>\n<main class="screen">\n  <div class="bar">\n    <div class="top" id="acct">\n      <button class="top__me" id="acctProfile" aria-label="profile"></button>\n      <span class="top__tier" id="acctTier">0</span>\n      <span class="top__n" id="acctName"></span>\n      <i class="top__d"></i>\n      <span class="top__s" id="acctScore">0</span>\n      <i class="top__d"></i>\n      <span class="top__k" id="acctTick">3</span>\n      <span class="top__t" id="acctTimer"></span>\n      <button class="top__cfg" data-cfgopen aria-label="settings"></button>\n    </div>\n  </div>\n\n  <div class="body">\n    <div>\n      <div class="block__label" id="lbQuick"></div>\n      <button class="btn-primary" id="btQuick"><span id="btQuickT"></span><span class="q-open" id="qOpen" hidden></span></button>\n      <p class="hint" id="hQuick"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbNew"></div>\n      <button class="btn-second" id="btNew"></button>\n      <p class="hint" id="hNew"></p>\n    </div>\n\n    <div>\n      <div class="block__label" id="lbJoin"></div>\n      <div class="join">\n        <input id="code" inputmode="numeric" maxlength="4" placeholder="0000" aria-label="\uBC29 \uBC88\uD638">\n        <button id="btJoin"></button>\n      </div>\n    </div>\n  </div>\n\n  <button class="btn-rules" id="btRules"></button>\n</main>\n\n<div class="sheet" id="sheet" role="dialog" aria-modal="true">\n  <div class="sheet__veil" data-close></div>\n  <div class="sheet__panel">\n    <div class="sheet__head">\n      <div class="sheet__title" id="shTitle"></div>\n      <button class="sheet__close" data-close aria-label="\uB2EB\uAE30">\xD7</button>\n    </div>\n    <div class="sheet__body">\n      <p class="lead" id="shLead"></p>\n      <div class="grid" id="grid"></div>\n      <div id="rules"></div>\n    </div>\n  </div>\n</div>',
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
export {
  BAR_SWAP,
  CFG_HTML,
  GEAR,
  MARKUP,
  OPT_HTML,
  initNav,
  mount as mountEntry
};
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
