(() => {
  const STORAGE_KEY = "webThemerSettings";

  function normalizeOverride(rawOverride, presets) {
    if (!rawOverride || typeof rawOverride !== "object") {
      return null;
    }

    return {
      enabled: Boolean(rawOverride.enabled),
      theme: presets.getThemeKey(rawOverride.theme),
      fontFamily: presets.sanitizeFontFamily(rawOverride.fontFamily),
      fontSize: presets.clampFontSize(rawOverride.fontSize),
      customCss: typeof rawOverride.customCss === "string" ? rawOverride.customCss : ""
    };
  }

  function normalizeSettings(rawSettings, presets) {
    const defaults = presets.DEFAULT_SETTINGS;
    const raw = rawSettings && typeof rawSettings === "object" ? rawSettings : {};

    const siteOverrides = {};
    const rawOverrides = raw.siteOverrides && typeof raw.siteOverrides === "object" ? raw.siteOverrides : {};

    for (const [hostname, override] of Object.entries(rawOverrides)) {
      const normalized = normalizeOverride(override, presets);
      if (normalized) {
        siteOverrides[hostname] = normalized;
      }
    }

    return {
      globalEnabled: typeof raw.globalEnabled === "boolean" ? raw.globalEnabled : defaults.globalEnabled,
      globalTheme: presets.getThemeKey(raw.globalTheme),
      globalFontFamily: presets.sanitizeFontFamily(raw.globalFontFamily),
      globalFontSize: presets.clampFontSize(raw.globalFontSize),
      customCss: typeof raw.customCss === "string" ? raw.customCss : defaults.customCss,
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
    const siteOverride = settings.siteOverrides[hostname];
    if (siteOverride) {
      return {
        enabled: siteOverride.enabled,
        theme: presets.getThemeKey(siteOverride.theme),
        fontFamily: presets.sanitizeFontFamily(siteOverride.fontFamily),
        fontSize: presets.clampFontSize(siteOverride.fontSize),
        customCss: typeof siteOverride.customCss === "string" ? siteOverride.customCss : "",
        source: "site"
      };
    }

    return {
      enabled: Boolean(settings.globalEnabled),
      theme: presets.getThemeKey(settings.globalTheme),
      fontFamily: presets.sanitizeFontFamily(settings.globalFontFamily),
      fontSize: presets.clampFontSize(settings.globalFontSize),
      customCss: typeof settings.customCss === "string" ? settings.customCss : "",
      source: "global"
    };
  }

  function upsertSiteOverride(settings, hostname, override, presets) {
    const next = normalizeSettings(settings, presets);
    next.siteOverrides[hostname] = normalizeOverride(override, presets);
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
