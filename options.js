(() => {
  const presets = window.WebThemePresets;
  const settingsApi = window.WebThemeSettings;

  const els = {
    globalEnabled: document.getElementById("globalEnabled"),
    globalTheme: document.getElementById("globalTheme"),
    globalFontFamily: document.getElementById("globalFontFamily"),
    globalFontSize: document.getElementById("globalFontSize"),
    customCss: document.getElementById("customCss"),
    save: document.getElementById("save"),
    status: document.getElementById("status"),
    overrides: document.getElementById("overrides")
  };

  let settingsCache = null;

  function setStatus(message, isError = false) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  function populateThemeOptions() {
    const options = Object.entries(presets.THEME_PRESETS)
      .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
      .join("");

    els.globalTheme.innerHTML = options;
  }

  function fillGlobalFields(settings) {
    els.globalEnabled.checked = Boolean(settings.globalEnabled);
    els.globalTheme.value = presets.getThemeKey(settings.globalTheme);
    els.globalFontFamily.value = presets.sanitizeFontFamily(settings.globalFontFamily);
    els.globalFontSize.value = presets.formatFontSize(settings.globalFontSize);
    els.customCss.value = typeof settings.customCss === "string" ? settings.customCss : "";
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
        const themeName = presets.THEME_PRESETS[presets.getThemeKey(override.theme)].label;
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
        renderOverrides(settingsCache);
        setStatus(`Removed override for ${hostname}.`);
      });
    }
  }

  async function saveGlobalSettings() {
    const theme = presets.getThemeKey(els.globalTheme.value);

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
    setStatus("Global settings saved.");
    renderOverrides(settingsCache);
  }

  async function init() {
    populateThemeOptions();
    settingsCache = await settingsApi.getSettings(presets);
    fillGlobalFields(settingsCache);
    renderOverrides(settingsCache);
    els.save.addEventListener("click", saveGlobalSettings);
  }

  init().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Failed to load settings.", true);
  });
})();
