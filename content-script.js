(() => {
  const STYLE_ID = "web-themer-injected-style";
  const MESSAGE_APPLY_THEME = "WEB_THEMER_APPLY_THEME";
  const MESSAGE_APPLY_CSS = "WEB_THEMER_APPLY_CSS";

  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

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

  function applyCssString(enabled, css) {
    if (!enabled) {
      removeStyle();
      return;
    }

    const styleEl = ensureStyleEl();
    styleEl.textContent = typeof css === "string" ? css : "";
  }

  async function applyThemeToPage() {
    const hostname = window.location.hostname;
    const settings = await settingsApi.getSettings(presets);
    const effective = settingsApi.resolveEffectiveSettings(settings, hostname, presets);

    if (!effective.enabled) {
      removeStyle();
      return;
    }

    const css = presets.buildThemeCss(effective);
    const styleEl = ensureStyleEl();
    styleEl.textContent = css;
  }

  function applyThemeSafely() {
    applyThemeToPage().catch(() => {
      // Silent failure to avoid breaking host page scripts.
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === MESSAGE_APPLY_THEME) {
      applyThemeSafely();
      sendResponse({ ok: true });
      return true;
    }

    if (message && message.type === MESSAGE_APPLY_CSS) {
      applyCssString(Boolean(message.enabled), message.css);
      sendResponse({ ok: true });
      return true;
    }

    return false;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    if (changes[settingsApi.STORAGE_KEY]) {
      applyThemeSafely();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyThemeSafely, { once: true });
  } else {
    applyThemeSafely();
  }
})();
