(() => {
  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

  const MESSAGE_APPLY_THEME = "WEB_THEMER_APPLY_THEME";
  const MESSAGE_APPLY_CSS = "WEB_THEMER_APPLY_CSS";

  const els = {
    siteLabel: document.getElementById("siteLabel"),
    globalState: document.getElementById("globalState"),
    enabled: document.getElementById("enabled"),
    theme: document.getElementById("theme"),
    fontFamily: document.getElementById("fontFamily"),
    fontSize: document.getElementById("fontSize"),
    customCss: document.getElementById("customCss"),
    save: document.getElementById("save"),
    reset: document.getElementById("reset"),
    enableAll: document.getElementById("enableAll"),
    disableAll: document.getElementById("disableAll"),
    status: document.getElementById("status")
  };

  let activeTabId = null;
  let hostname = "";
  let settingsCache = null;
  let themeCatalog = presets.getThemeCatalog({});
  let siteOverrideExists = false;

  function setStatus(message, isError = false) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  function refreshThemeCatalog() {
    themeCatalog = presets.getThemeCatalog(settingsCache ? settingsCache.customThemes : {});
  }

  function populateThemeOptions() {
    const fragment = document.createDocumentFragment();

    for (const [key, value] of Object.entries(themeCatalog)) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value.label;
      fragment.appendChild(option);
    }

    const current = els.theme.value;
    els.theme.innerHTML = "";
    els.theme.appendChild(fragment);

    if (current && themeCatalog[current]) {
      els.theme.value = current;
    }
  }

  function fillFormFromEffective(effective) {
    els.enabled.checked = siteOverrideExists ? Boolean(effective.enabled) : true;
    els.theme.value = presets.getThemeKey(effective.theme, themeCatalog);
    els.fontFamily.value = presets.sanitizeFontFamily(effective.fontFamily);
    els.fontSize.value = presets.formatFontSize(effective.fontSize);
    els.customCss.value = typeof effective.customCss === "string" ? effective.customCss : "";
  }

  function updateGlobalToggleButtons() {
    if (!settingsCache) {
      return;
    }

    const isOn = Boolean(settingsCache.globalEnabled);
    els.enableAll.classList.toggle("toggle-selected", isOn);
    els.disableAll.classList.toggle("toggle-selected", !isOn);
    els.enableAll.setAttribute("aria-pressed", String(isOn));
    els.disableAll.setAttribute("aria-pressed", String(!isOn));
  }

  function updateGlobalStateLabel() {
    if (!settingsCache) {
      els.globalState.textContent = "";
      return;
    }

    if (settingsCache.globalEnabled) {
      els.globalState.textContent = "Global mode: ON for all websites (site overrides still apply).";
      updateGlobalToggleButtons();
      return;
    }

    els.globalState.textContent = "Global mode: OFF for all websites (enable specific sites manually).";
    updateGlobalToggleButtons();
  }

  async function ensureLatestTabScripts() {
    if (typeof activeTabId !== "number") {
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ["theme-presets.js", "settings.js", "content-script.js"]
      });
    } catch (_error) {
      // Restricted pages cannot be scripted.
    }
  }

  async function applyEffectiveToActiveTab(effective) {
    if (typeof activeTabId !== "number") {
      return;
    }

    await ensureLatestTabScripts();

    try {
      await chrome.tabs.sendMessage(activeTabId, { type: MESSAGE_APPLY_THEME });
      return;
    } catch (_error) {
      // Fallback below.
    }

    try {
      const enabled = Boolean(effective && effective.enabled);
      const css = enabled ? presets.buildThemeCss(effective, themeCatalog) : "";
      const themeStyle = presets.getThemeStyle(effective.theme, themeCatalog);

      await chrome.tabs.sendMessage(activeTabId, {
        type: MESSAGE_APPLY_CSS,
        enabled,
        css,
        themeStyle
      });
    } catch (_error) {
      // Ignore if script messaging is unavailable.
    }
  }

  function currentOverrideFromForm() {
    const theme = presets.getThemeKey(els.theme.value, themeCatalog);

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
    refreshThemeCatalog();
    siteOverrideExists = true;
    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    fillFormFromEffective(effective);
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
    refreshThemeCatalog();
    siteOverrideExists = false;
    populateThemeOptions();

    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    fillFormFromEffective(effective);
    await applyEffectiveToActiveTab(effective);
    setStatus("Now using global defaults.");
  }

  async function setGlobalEnabled(enabled) {
    const next = settingsApi.normalizeSettings(
      {
        ...settingsCache,
        globalEnabled: Boolean(enabled)
      },
      presets
    );

    settingsCache = await settingsApi.saveSettings(next, presets);
    refreshThemeCatalog();
    updateGlobalStateLabel();

    if (hostname) {
      siteOverrideExists = Boolean(settingsCache.siteOverrides && settingsCache.siteOverrides[hostname]);
      const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
      fillFormFromEffective(effective);
      await applyEffectiveToActiveTab(effective);
    }

    if (enabled) {
      setStatus("Global mode ON: themes apply to all websites unless a site override exists.");
      return;
    }

    setStatus("Global mode OFF: themes only apply on sites you explicitly save.");
  }

  async function init() {
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
    refreshThemeCatalog();
    populateThemeOptions();
    updateGlobalStateLabel();

    els.enableAll.addEventListener("click", () => {
      setGlobalEnabled(true).catch((error) => {
        setStatus(error instanceof Error ? error.message : "Failed to enable global mode.", true);
      });
    });
    els.disableAll.addEventListener("click", () => {
      setGlobalEnabled(false).catch((error) => {
        setStatus(error instanceof Error ? error.message : "Failed to disable global mode.", true);
      });
    });

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
      setStatus("Open a regular website tab to save site overrides. Global ON/OFF still works here.");
      return;
    }

    const effective = settingsApi.resolveEffectiveSettings(settingsCache, hostname, presets);
    siteOverrideExists = Boolean(settingsCache.siteOverrides && settingsCache.siteOverrides[hostname]);
    fillFormFromEffective(effective);

    if (!siteOverrideExists) {
      setStatus("Using global defaults for this site.");
    } else if (effective.enabled) {
      setStatus("This site has an ON override.");
    } else {
      setStatus("This site has an OFF override.");
    }

    els.save.addEventListener("click", saveSiteOverride);
    els.reset.addEventListener("click", resetSiteOverride);
  }

  init().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Failed to load popup.", true);
  });
})();
