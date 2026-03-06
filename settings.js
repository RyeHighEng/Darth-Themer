(() => {
  const STORAGE_KEY = "webThemerSettings";

  function normalizeOverride(rawOverride, presets, catalog) {
    if (!rawOverride || typeof rawOverride !== "object") {
      return null;
    }

    return {
      enabled: Boolean(rawOverride.enabled),
      theme: presets.getThemeKey(rawOverride.theme, catalog),
      fontFamily: presets.sanitizeFontFamily(rawOverride.fontFamily),
      fontSize: presets.clampFontSize(rawOverride.fontSize),
      customCss: typeof rawOverride.customCss === "string" ? rawOverride.customCss : ""
    };
  }

  function normalizeSettings(rawSettings, presets) {
    const defaults = presets.DEFAULT_SETTINGS;
    const raw = rawSettings && typeof rawSettings === "object" ? rawSettings : {};

    const customThemes = presets.normalizeCustomThemes(raw.customThemes);
    const catalog = presets.getThemeCatalog(customThemes);

    const siteOverrides = {};
    const rawOverrides = raw.siteOverrides && typeof raw.siteOverrides === "object" ? raw.siteOverrides : {};

    for (const [hostname, override] of Object.entries(rawOverrides)) {
      const normalized = normalizeOverride(override, presets, catalog);
      if (normalized) {
        siteOverrides[hostname] = normalized;
      }
    }

    return {
      globalEnabled: typeof raw.globalEnabled === "boolean" ? raw.globalEnabled : defaults.globalEnabled,
      globalTheme: presets.getThemeKey(raw.globalTheme, catalog),
      globalFontFamily: presets.sanitizeFontFamily(raw.globalFontFamily),
      globalFontSize: presets.clampFontSize(raw.globalFontSize),
      customCss: typeof raw.customCss === "string" ? raw.customCss : defaults.customCss,
      customThemes,
      siteOverrides
    };
  }

  async function getSettings(presets) {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    return normalizeSettings(stored[STORAGE_KEY], presets);
  }

  async function saveSettings(settings, presets) {
    const normalized = normalizeSettings(settings, presets);
    await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
    return normalized;
  }

  function resolveEffectiveSettings(settings, hostname, presets) {
    const normalized = normalizeSettings(settings, presets);
    const catalog = presets.getThemeCatalog(normalized.customThemes);

    const siteOverride = normalized.siteOverrides[hostname];
    if (siteOverride) {
      return {
        enabled: siteOverride.enabled,
        theme: presets.getThemeKey(siteOverride.theme, catalog),
        fontFamily: presets.sanitizeFontFamily(siteOverride.fontFamily),
        fontSize: presets.clampFontSize(siteOverride.fontSize),
        customCss: typeof siteOverride.customCss === "string" ? siteOverride.customCss : "",
        source: "site"
      };
    }

    return {
      enabled: Boolean(normalized.globalEnabled),
      theme: presets.getThemeKey(normalized.globalTheme, catalog),
      fontFamily: presets.sanitizeFontFamily(normalized.globalFontFamily),
      fontSize: presets.clampFontSize(normalized.globalFontSize),
      customCss: typeof normalized.customCss === "string" ? normalized.customCss : "",
      source: "global"
    };
  }

  function upsertSiteOverride(settings, hostname, override, presets) {
    const next = normalizeSettings(settings, presets);
    const catalog = presets.getThemeCatalog(next.customThemes);
    next.siteOverrides[hostname] = normalizeOverride(override, presets, catalog);
    return next;
  }

  function removeSiteOverride(settings, hostname, presets) {
    const next = normalizeSettings(settings, presets);
    delete next.siteOverrides[hostname];
    return next;
  }

  window.WebThemeSettings = {
    STORAGE_KEY,
    normalizeSettings,
    getSettings,
    saveSettings,
    resolveEffectiveSettings,
    upsertSiteOverride,
    removeSiteOverride
  };
})();
