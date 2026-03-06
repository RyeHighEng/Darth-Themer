(() => {
  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

  const MESSAGE_APPLY_THEME = "WEB_THEMER_APPLY_THEME";

  const els = {
    globalEnabled: document.getElementById("globalEnabled"),
    globalTheme: document.getElementById("globalTheme"),
    globalFontFamily: document.getElementById("globalFontFamily"),
    globalFontSize: document.getElementById("globalFontSize"),
    customCss: document.getElementById("customCss"),
    save: document.getElementById("save"),
    status: document.getElementById("status"),
    overrides: document.getElementById("overrides"),
    customThemes: document.getElementById("customThemes"),
    customStatus: document.getElementById("customStatus"),
    saveCustomTheme: document.getElementById("saveCustomTheme"),
    clearCustomTheme: document.getElementById("clearCustomTheme"),
    customThemeId: document.getElementById("customThemeId"),
    customName: document.getElementById("customName"),
    customStyle: document.getElementById("customStyle"),
    customBg: document.getElementById("customBg"),
    customSurface: document.getElementById("customSurface"),
    customText: document.getElementById("customText"),
    customBorder: document.getElementById("customBorder"),
    customLink: document.getElementById("customLink"),
    customInputBg: document.getElementById("customInputBg"),
    customButtonBg: document.getElementById("customButtonBg"),
    customButtonText: document.getElementById("customButtonText"),
    customButtonBorder: document.getElementById("customButtonBorder"),
    customRadius: document.getElementById("customRadius"),
    customShadow: document.getElementById("customShadow"),
    customFontFamily: document.getElementById("customFontFamily"),
    customFontSize: document.getElementById("customFontSize"),
    customRainbowColors: document.getElementById("customRainbowColors"),
    customExtraCss: document.getElementById("customExtraCss")
  };

  let settingsCache = null;
  let themeCatalog = presets.getThemeCatalog({});

  function setStatus(message, isError = false) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  function setCustomStatus(message, isError = false) {
    els.customStatus.textContent = message;
    els.customStatus.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  function refreshThemeCatalog() {
    themeCatalog = presets.getThemeCatalog(settingsCache ? settingsCache.customThemes : {});
  }

  function parseRainbowColors(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 12);
  }

  function rainbowColorsToInput(value) {
    if (!Array.isArray(value) || value.length === 0) {
      return "";
    }

    return value.join(", ");
  }

  function buildUniqueCustomThemeKey(label, existingThemes, currentId) {
    if (typeof currentId === "string" && currentId.startsWith(presets.CUSTOM_THEME_PREFIX)) {
      return currentId;
    }

    const base = `${presets.CUSTOM_THEME_PREFIX}${presets.slugifyThemeName(label)}`;
    if (!existingThemes[base]) {
      return base;
    }

    let index = 2;
    while (existingThemes[`${base}-${index}`]) {
      index += 1;
    }

    return `${base}-${index}`;
  }

  function populateThemeOptions() {
    const selected = els.globalTheme.value;

    const options = Object.entries(themeCatalog)
      .map(([key, value]) => {
        const customBadge = key.startsWith(presets.CUSTOM_THEME_PREFIX) ? " (Custom)" : "";
        return `<option value="${key}">${value.label}${customBadge}</option>`;
      })
      .join("");

    els.globalTheme.innerHTML = options;

    if (selected && themeCatalog[selected]) {
      els.globalTheme.value = selected;
    }
  }

  function fillGlobalFields(settings) {
    els.globalEnabled.checked = Boolean(settings.globalEnabled);
    els.globalTheme.value = presets.getThemeKey(settings.globalTheme, themeCatalog);
    els.globalFontFamily.value = presets.sanitizeFontFamily(settings.globalFontFamily);
    els.globalFontSize.value = presets.formatFontSize(settings.globalFontSize);
    els.customCss.value = typeof settings.customCss === "string" ? settings.customCss : "";
  }

  function resetCustomThemeForm() {
    const defaults = presets.DEFAULT_THEME_VARS;

    els.customThemeId.value = "";
    els.customName.value = "";
    els.customStyle.value = "palette";
    els.customBg.value = defaults.bg;
    els.customSurface.value = defaults.surface;
    els.customText.value = defaults.text;
    els.customBorder.value = defaults.border;
    els.customLink.value = defaults.link;
    els.customInputBg.value = defaults.inputBg;
    els.customButtonBg.value = defaults.buttonBg;
    els.customButtonText.value = defaults.buttonText;
    els.customButtonBorder.value = defaults.buttonBorder;
    els.customRadius.value = defaults.radius;
    els.customShadow.value = defaults.shadow;
    els.customFontFamily.value = "";
    els.customFontSize.value = "";
    els.customRainbowColors.value = "";
    els.customExtraCss.value = "";
  }

  function fillCustomThemeForm(themeKey, theme) {
    els.customThemeId.value = themeKey;
    els.customName.value = theme.label;
    els.customStyle.value = theme.style;
    els.customBg.value = theme.vars.bg;
    els.customSurface.value = theme.vars.surface;
    els.customText.value = theme.vars.text;
    els.customBorder.value = theme.vars.border;
    els.customLink.value = theme.vars.link;
    els.customInputBg.value = theme.vars.inputBg;
    els.customButtonBg.value = theme.vars.buttonBg;
    els.customButtonText.value = theme.vars.buttonText;
    els.customButtonBorder.value = theme.vars.buttonBorder;
    els.customRadius.value = theme.vars.radius;
    els.customShadow.value = theme.vars.shadow;
    els.customFontFamily.value = presets.sanitizeFontFamily(theme.defaults && theme.defaults.fontFamily);
    els.customFontSize.value = presets.formatFontSize(theme.defaults && theme.defaults.fontSize);
    els.customRainbowColors.value = rainbowColorsToInput(theme.rainbowColors);
    els.customExtraCss.value = typeof theme.extraCss === "string" ? theme.extraCss : "";
  }

  function currentCustomThemeFromForm() {
    const label = (els.customName.value || "").trim();
    if (!label) {
      return null;
    }

    const existingThemes = settingsCache.customThemes || {};
    const key = buildUniqueCustomThemeKey(label, existingThemes, els.customThemeId.value || "");

    const themeRaw = {
      label,
      style: els.customStyle.value,
      vars: {
        bg: els.customBg.value,
        surface: els.customSurface.value,
        text: els.customText.value,
        border: els.customBorder.value,
        link: els.customLink.value,
        inputBg: els.customInputBg.value,
        buttonBg: els.customButtonBg.value,
        buttonText: els.customButtonText.value,
        buttonBorder: els.customButtonBorder.value,
        radius: els.customRadius.value,
        shadow: els.customShadow.value
      },
      defaults: {
        fontFamily: els.customFontFamily.value,
        fontSize: presets.clampFontSize(els.customFontSize.value)
      },
      rainbowColors: parseRainbowColors(els.customRainbowColors.value),
      extraCss: els.customExtraCss.value || ""
    };

    const normalized = presets.normalizeThemeDefinition(themeRaw, label);
    if (!normalized) {
      return null;
    }

    return { key, theme: normalized };
  }

  async function refreshOpenTabs() {
    let tabs = [];

    try {
      tabs = await chrome.tabs.query({});
    } catch (_error) {
      return;
    }

    for (const tab of tabs) {
      if (!tab || typeof tab.id !== "number" || typeof tab.url !== "string") {
        continue;
      }

      if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
        continue;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["theme-presets.js", "settings.js", "content-script.js"]
        });
        await chrome.tabs.sendMessage(tab.id, { type: MESSAGE_APPLY_THEME });
      } catch (_error) {
        // Skip tabs that reject scripting/messaging.
      }
    }
  }

  function renderOverrides(settings) {
    const entries = Object.entries(settings.siteOverrides);
    if (entries.length === 0) {
      els.overrides.innerHTML = "<p class=\"caption\">No site overrides saved yet.</p>";
      return;
    }

    const rows = entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hostname, override]) => {
        const resolvedThemeKey = presets.getThemeKey(override.theme, themeCatalog);
        const themeName = themeCatalog[resolvedThemeKey] ? themeCatalog[resolvedThemeKey].label : resolvedThemeKey;
        const enabledLabel = override.enabled ? "Enabled" : "Disabled";
        const fontSize = presets.clampFontSize(override.fontSize);
        const fontFamily = presets.sanitizeFontFamily(override.fontFamily);
        const fontMeta = fontFamily || "site default font";
        const sizeMeta = fontSize === null ? "default size" : `${fontSize}px`;

        return `
          <div class="override-row" data-hostname="${hostname}">
            <div>
              <strong>${hostname}</strong>
              <div class="override-meta">${enabledLabel} | ${themeName} | ${fontMeta} | ${sizeMeta}</div>
            </div>
            <button type="button" class="secondary" data-remove="${hostname}">Remove</button>
          </div>
        `;
      })
      .join("");

    els.overrides.innerHTML = rows;

    for (const button of els.overrides.querySelectorAll("button[data-remove]")) {
      button.addEventListener("click", async () => {
        const hostname = button.getAttribute("data-remove");
        const next = settingsApi.removeSiteOverride(settingsCache, hostname, presets);
        settingsCache = await settingsApi.saveSettings(next, presets);
        refreshThemeCatalog();
        renderOverrides(settingsCache);
        setStatus(`Removed override for ${hostname}.`);
      });
    }
  }

  function renderCustomThemes() {
    const entries = Object.entries(settingsCache.customThemes || {});
    if (entries.length === 0) {
      els.customThemes.innerHTML = "<p class=\"caption\">No custom themes saved yet.</p>";
      return;
    }

    const rows = entries
      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
      .map(([key, theme]) => {
        const styleName = theme.style;
        const defaults = theme.defaults || {};
        const fontMeta = presets.sanitizeFontFamily(defaults.fontFamily) || "site default font";
        const sizeMeta = presets.formatFontSize(defaults.fontSize) || "default size";

        return `
          <div class="custom-theme-row" data-theme-key="${key}">
            <div>
              <strong>${theme.label}</strong>
              <div class="custom-theme-meta">${styleName} | ${fontMeta} | ${sizeMeta}</div>
            </div>
            <div class="actions">
              <button type="button" class="secondary" data-edit="${key}">Edit</button>
              <button type="button" class="secondary" data-delete="${key}">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");

    els.customThemes.innerHTML = rows;

    for (const button of els.customThemes.querySelectorAll("button[data-edit]")) {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-edit");
        const theme = settingsCache.customThemes[key];
        if (!theme) {
          return;
        }

        fillCustomThemeForm(key, theme);
        setCustomStatus(`Editing ${theme.label}.`);
      });
    }

    for (const button of els.customThemes.querySelectorAll("button[data-delete]")) {
      button.addEventListener("click", async () => {
        const key = button.getAttribute("data-delete");
        const nextCustomThemes = { ...(settingsCache.customThemes || {}) };
        const deletedTheme = nextCustomThemes[key];
        delete nextCustomThemes[key];

        const next = settingsApi.normalizeSettings(
          {
            ...settingsCache,
            customThemes: nextCustomThemes
          },
          presets
        );

        settingsCache = await settingsApi.saveSettings(next, presets);
        refreshThemeCatalog();
        populateThemeOptions();
        fillGlobalFields(settingsCache);
        renderCustomThemes();
        renderOverrides(settingsCache);
        await refreshOpenTabs();
        setCustomStatus(`Deleted ${deletedTheme ? deletedTheme.label : "custom theme"}.`);
      });
    }
  }

  async function saveCustomTheme() {
    const payload = currentCustomThemeFromForm();
    if (!payload) {
      setCustomStatus("Theme name is required.", true);
      return;
    }

    const nextCustomThemes = {
      ...(settingsCache.customThemes || {}),
      [payload.key]: payload.theme
    };

    const next = settingsApi.normalizeSettings(
      {
        ...settingsCache,
        customThemes: nextCustomThemes
      },
      presets
    );

    settingsCache = await settingsApi.saveSettings(next, presets);
    refreshThemeCatalog();
    populateThemeOptions();
    fillGlobalFields(settingsCache);
    renderCustomThemes();
    renderOverrides(settingsCache);
    await refreshOpenTabs();
    fillCustomThemeForm(payload.key, payload.theme);
    setCustomStatus(`Saved custom theme: ${payload.theme.label}.`);
  }

  async function saveGlobalSettings() {
    const theme = presets.getThemeKey(els.globalTheme.value, themeCatalog);

    const next = settingsApi.normalizeSettings(
      {
        ...settingsCache,
        globalEnabled: Boolean(els.globalEnabled.checked),
        globalTheme: theme,
        globalFontFamily: presets.coerceFontFamilyForTheme(theme, els.globalFontFamily.value),
        globalFontSize: presets.clampFontSize(els.globalFontSize.value),
        customCss: els.customCss.value || ""
      },
      presets
    );

    settingsCache = await settingsApi.saveSettings(next, presets);
    refreshThemeCatalog();
    populateThemeOptions();
    fillGlobalFields(settingsCache);
    renderOverrides(settingsCache);
    await refreshOpenTabs();
    setStatus("Global settings saved.");
  }

  async function init() {
    settingsCache = await settingsApi.getSettings(presets);
    refreshThemeCatalog();
    populateThemeOptions();
    fillGlobalFields(settingsCache);
    renderOverrides(settingsCache);
    renderCustomThemes();
    resetCustomThemeForm();

    els.save.addEventListener("click", saveGlobalSettings);
    els.saveCustomTheme.addEventListener("click", saveCustomTheme);
    els.clearCustomTheme.addEventListener("click", () => {
      resetCustomThemeForm();
      setCustomStatus("Builder form cleared.");
    });
  }

  init().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Failed to load settings.", true);
  });
})();
