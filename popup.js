(() => {
  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

  const STYLE_ID = "web-themer-injected-style";
  const MESSAGE_APPLY_CSS = "WEB_THEMER_APPLY_CSS";

  const els = {
    siteLabel: document.getElementById("siteLabel"),
    enabled: document.getElementById("enabled"),
    theme: document.getElementById("theme"),
    fontFamily: document.getElementById("fontFamily"),
    fontSize: document.getElementById("fontSize"),
    customCss: document.getElementById("customCss"),
    save: document.getElementById("save"),
    reset: document.getElementById("reset"),
    status: document.getElementById("status")
  };

  let activeTabId = null;
  let hostname = "";
  let settingsCache = null;

  function setStatus(message, isError = false) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  function populateThemeOptions() {
    const fragment = document.createDocumentFragment();
    for (const [key, value] of Object.entries(presets.THEME_PRESETS)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value.label;
      fragment.appendChild(option);
    }

    els.theme.innerHTML = "";
    els.theme.appendChild(fragment);
  }

  function fillFormFromEffective(effective) {
    els.enabled.checked = Boolean(effective.enabled);
    els.theme.value = presets.getThemeKey(effective.theme);
    els.fontFamily.value = presets.sanitizeFontFamily(effective.fontFamily);
    els.fontSize.value = presets.formatFontSize(effective.fontSize);
    els.customCss.value = typeof effective.customCss === "string" ? effective.customCss : "";
  }

  async function applyEffectiveToActiveTab(effective) {
    if (typeof activeTabId !== "number") {
      return;
    }

    const enabled = Boolean(effective && effective.enabled);
    const css = enabled ? presets.buildThemeCss(effective) : "";

    try {
      await chrome.tabs.sendMessage(activeTabId, {
        type: MESSAGE_APPLY_CSS,
        enabled,
        css
      });
    } catch (_error) {
      // No-op for restricted pages where content script is unavailable.
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: (styleId, enabledFlag, cssText) => {
          let styleEl = document.getElementById(styleId);
          if (!enabledFlag) {
            if (styleEl) {
              styleEl.remove();
            }
            return;
          }

          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            (document.head || document.documentElement).appendChild(styleEl);
          }

          styleEl.textContent = typeof cssText === "string" ? cssText : "";
        },
        args: [STYLE_ID, enabled, css]
      });
    } catch (_error) {
      // Restricted pages (chrome://, store) cannot be scripted.
    }
  }

  function currentOverrideFromForm() {
    const theme = presets.getThemeKey(els.theme.value);
    return {
      enabled: Boolean(els.enabled.checked),
      theme,
      fontFamily: presets.coerceFontFamilyForTheme(theme, els.fontFamily.value),
      fontSize: presets.clampFontSize(els.fontSize.value),
      customCss: els.customCss.value || ""
    };
  }

  async function saveSiteOverride() {
    if (!hostname) {
      setStatus("This page cannot be themed.", true);
      return;
    }

    const override = currentOverrideFromForm();
    const next = settingsApi.upsertSiteOverride(settingsCache, hostname, override, presets);
    settingsCache = await settingsApi.saveSettings(next, presets);
    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    await applyEffectiveToActiveTab(effective);
    setStatus("Saved for this site.");
  }

  async function resetSiteOverride() {
    if (!hostname) {
      setStatus("This page cannot be themed.", true);
      return;
    }

    const next = settingsApi.removeSiteOverride(settingsCache, hostname, presets);
    settingsCache = await settingsApi.saveSettings(next, presets);
    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    fillFormFromEffective(effective);
    await applyEffectiveToActiveTab(effective);
    setStatus("Now using global defaults.");
  }

  async function init() {
    populateThemeOptions();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab && typeof tab.url === "string" ? tab.url : "";

    activeTabId = tab && typeof tab.id === "number" ? tab.id : null;

    try {
      hostname = new URL(url).hostname;
      els.siteLabel.textContent = `Site: ${hostname}`;
    } catch (_error) {
      hostname = "";
      els.siteLabel.textContent = "Site: Restricted page";
    }

    settingsCache = await settingsApi.getSettings(presets);

    if (!hostname) {
      fillFormFromEffective({
        enabled: false,
        theme: settingsCache.globalTheme,
        fontFamily: settingsCache.globalFontFamily,
        fontSize: settingsCache.globalFontSize,
        customCss: settingsCache.customCss
      });
      els.save.disabled = true;
      els.reset.disabled = true;
      setStatus("Open a regular website tab to apply a theme.");
      return;
    }

    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    fillFormFromEffective(effective);

    if (effective.source === "global") {
      setStatus("Using global defaults for this site.");
    }

    els.save.addEventListener("click", saveSiteOverride);
    els.reset.addEventListener("click", resetSiteOverride);
  }

  init().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Failed to load popup.", true);
  });
})();
