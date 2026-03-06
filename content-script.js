(() => {
  const RUNTIME_KEY = "__webThemerRuntime";
  const RUNTIME_VERSION = 2;
  const STYLE_ID = "web-themer-injected-style";
  const RAINBOW_CLASS = "wt-rainbow-char";
  const RAINBOW_MARK_ATTR = "data-wt-rainbow-span";
  const MESSAGE_APPLY_THEME = "WEB_THEMER_APPLY_THEME";
  const MESSAGE_APPLY_CSS = "WEB_THEMER_APPLY_CSS";

  const existingRuntime = globalThis[RUNTIME_KEY];
  if (existingRuntime && existingRuntime.version === RUNTIME_VERSION) {
    if (typeof existingRuntime.applyThemeSafely === "function") {
      existingRuntime.applyThemeSafely();
    }
    return;
  }

  if (existingRuntime && typeof existingRuntime.dispose === "function") {
    existingRuntime.dispose();
  }

  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

  const runtime = {
    initialized: true,
    version: RUNTIME_VERSION,
    rainbowObserver: null,
    rainbowApplyTimer: null,
    isApplyingRainbow: false,
    onMessage: null,
    onStorageChanged: null,
    applyThemeSafely: null,
    dispose: null
  };

  function getStyleEl() {
    return document.getElementById(STYLE_ID);
  }

  function removeStyle() {
    const el = getStyleEl();
    if (el) {
      el.remove();
    }
  }

  function ensureStyleEl() {
    let styleEl = getStyleEl();
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    return styleEl;
  }

  function stopRainbowObserver() {
    if (runtime.rainbowObserver) {
      runtime.rainbowObserver.disconnect();
      runtime.rainbowObserver = null;
    }

    if (runtime.rainbowApplyTimer !== null) {
      clearTimeout(runtime.rainbowApplyTimer);
      runtime.rainbowApplyTimer = null;
    }
  }

  function removeRainbowDecorations() {
    const spans = Array.from(document.querySelectorAll(`span.${RAINBOW_CLASS}[${RAINBOW_MARK_ATTR}="1"]`));
    if (spans.length === 0) {
      return;
    }

    const parents = new Set();

    for (const span of spans) {
      const parent = span.parentNode;
      span.replaceWith(document.createTextNode(span.textContent || ""));
      if (parent) {
        parents.add(parent);
      }
    }

    for (const parent of parents) {
      if (typeof parent.normalize === "function") {
        parent.normalize();
      }
    }
  }

  function shouldSkipTextNode(node) {
    if (!node || !node.nodeValue || node.nodeValue.trim().length === 0) {
      return true;
    }

    if (!/[A-Za-z]/.test(node.nodeValue)) {
      return true;
    }

    if (node.nodeValue.length > 1200) {
      return true;
    }

    const parent = node.parentElement;
    if (!parent) {
      return true;
    }

    if (parent.closest(`.${RAINBOW_CLASS}`)) {
      return true;
    }

    const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION", "SELECT", "CODE", "PRE", "KBD", "SAMP", "SVG", "CANVAS"]);
    if (blockedTags.has(parent.tagName)) {
      return true;
    }

    if (parent.isContentEditable) {
      return true;
    }

    return false;
  }

  function wrapTextNodeWithRainbow(node) {
    const text = node.nodeValue || "";
    const fragment = document.createDocumentFragment();
    let changed = false;

    for (const char of text) {
      if (/\s/.test(char)) {
        fragment.appendChild(document.createTextNode(char));
        continue;
      }

      const span = document.createElement("span");
      span.className = RAINBOW_CLASS;
      span.setAttribute(RAINBOW_MARK_ATTR, "1");
      span.textContent = char;
      fragment.appendChild(span);
      changed = true;
    }

    if (changed && node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  }

  function applyRainbowDecorations() {
    if (!document.body) {
      return;
    }

    runtime.isApplyingRainbow = true;

    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let current = walker.nextNode();

      while (current) {
        if (!shouldSkipTextNode(current)) {
          nodes.push(current);
        }

        if (nodes.length > 2500) {
          break;
        }

        current = walker.nextNode();
      }

      for (const node of nodes) {
        wrapTextNodeWithRainbow(node);
      }
    } finally {
      runtime.isApplyingRainbow = false;
    }
  }

  function scheduleRainbowApply() {
    if (runtime.rainbowApplyTimer !== null) {
      return;
    }

    runtime.rainbowApplyTimer = setTimeout(() => {
      runtime.rainbowApplyTimer = null;
      applyRainbowDecorations();
    }, 160);
  }

  function startRainbowObserver() {
    if (runtime.rainbowObserver || !document.body) {
      return;
    }

    runtime.rainbowObserver = new MutationObserver(() => {
      if (runtime.isApplyingRainbow) {
        return;
      }

      scheduleRainbowApply();
    });

    runtime.rainbowObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function setRainbowMode(enabled) {
    if (!enabled) {
      stopRainbowObserver();
      removeRainbowDecorations();
      return;
    }

    removeRainbowDecorations();
    applyRainbowDecorations();
    startRainbowObserver();
  }

  function applyCssString(enabled, css, themeStyle) {
    if (!enabled) {
      removeStyle();
      setRainbowMode(false);
      return;
    }

    const styleEl = ensureStyleEl();
    styleEl.textContent = typeof css === "string" ? css : "";
    setRainbowMode(themeStyle === "rainbow");
  }

  async function applyThemeToPage() {
    const hostname = window.location.hostname;
    const settings = await settingsApi.getSettings(presets);
    const catalog = presets.getThemeCatalog(settings.customThemes);
    const effective = settingsApi.resolveEffectiveSettings(settings, hostname, presets);

    if (!effective.enabled) {
      applyCssString(false, "", "palette");
      return;
    }

    const css = presets.buildThemeCss(effective, catalog);
    const themeStyle = presets.getThemeStyle(effective.theme, catalog);
    applyCssString(true, css, themeStyle);
  }

  function applyThemeSafely() {
    applyThemeToPage().catch(() => {
      // Silent failure to avoid breaking host page scripts.
    });
  }

  runtime.applyThemeSafely = applyThemeSafely;

  runtime.onMessage = (message, _sender, sendResponse) => {
    if (message && message.type === MESSAGE_APPLY_THEME) {
      applyThemeSafely();
      sendResponse({ ok: true });
      return true;
    }

    if (message && message.type === MESSAGE_APPLY_CSS) {
      applyCssString(Boolean(message.enabled), message.css, message.themeStyle || "palette");
      sendResponse({ ok: true });
      return true;
    }

    return false;
  };

  runtime.onStorageChanged = (changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    if (changes[settingsApi.STORAGE_KEY]) {
      applyThemeSafely();
    }
  };

  runtime.dispose = () => {
    stopRainbowObserver();

    if (runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(runtime.onMessage);
    }

    if (runtime.onStorageChanged) {
      chrome.storage.onChanged.removeListener(runtime.onStorageChanged);
    }
  };

  globalThis[RUNTIME_KEY] = runtime;

  chrome.runtime.onMessage.addListener(runtime.onMessage);
  chrome.storage.onChanged.addListener(runtime.onStorageChanged);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyThemeSafely, { once: true });
  } else {
    applyThemeSafely();
  }
})();
