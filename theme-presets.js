(() => {
  const WINDOWS_98_FONT_STACK = '"MS Sans Serif", Tahoma, Arial, sans-serif';
  const CUSTOM_THEME_PREFIX = "custom:";

  const RAINBOW_FALLBACK_COLORS = ["#ff0000", "#ff7f00", "#ffd700", "#00c853", "#00b0ff", "#304ffe", "#d500f9"];

  const DEFAULT_THEME_VARS = {
    bg: "#1f2937",
    surface: "#273449",
    text: "#e6edf6",
    border: "#3e4f69",
    link: "#8cb8ff",
    inputBg: "#17212f",
    buttonBg: "#273449",
    buttonText: "#e6edf6",
    buttonBorder: "#3e4f69",
    radius: "6px",
    shadow: "none"
  };

  const BUILTIN_THEME_PRESETS = {
    rainbowText: {
      label: "Rainbow Text",
      style: "rainbow",
      vars: {
        bg: "#ffffff",
        surface: "#f6f8fb",
        text: "#141414",
        border: "#cfd8e3",
        link: "#0b57d0",
        inputBg: "#ffffff",
        buttonBg: "#ffffff",
        buttonText: "#111827",
        buttonBorder: "#9ca3af",
        radius: "8px",
        shadow: "none"
      },
      rainbowColors: RAINBOW_FALLBACK_COLORS,
      defaults: {
        fontFamily: "",
        fontSize: null
      },
      extraCss: ""
    },
    ghosttyHotline: {
      label: "Neon Vommit",
      style: "palette",
      vars: {
        bg: "#130A24",
        surface: "#2B0D36",
        text: "#FB9728",
        border: "#8A479F",
        link: "#2EFFFF",
        inputBg: "#471758",
        buttonBg: "#2B0D36",
        buttonText: "#FB9728",
        buttonBorder: "#8A479F",
        radius: "2px",
        shadow: "none"
      },
      defaults: {
        fontFamily: "",
        fontSize: null
      },
      extraCss: `
        ::selection {
          background: #2EFFFF !important;
          color: #130A24 !important;
        }

        mark {
          background: #2EFFFF !important;
          color: #130A24 !important;
        }
      `
    },
    purpleRain: {
      label: "Purple Rain",
      style: "palette",
      vars: {
        bg: "#1a0533",
        surface: "#150330",
        text: "#e8e0f0",
        border: "#3d2066",
        link: "#59b8ff",
        inputBg: "#1d0740",
        buttonBg: "#b44dff",
        buttonText: "#ffffff",
        buttonBorder: "#9b30ff",
        radius: "6px",
        shadow: "none"
      },
      defaults: {
        fontFamily: "",
        fontSize: null
      },
      extraCss: `
        h1, h2, h3, h4, h5, h6 {
          color: #ffda45 !important;
        }

        ::selection {
          background: #b44dff66 !important;
          color: #e8e0f0 !important;
        }
      `
    },
    windows98: {
      label: "Windows 98",
      style: "classic",
      vars: {
        bg: "#008080",
        surface: "#c0c0c0",
        text: "#000000",
        border: "#7f7f7f",
        link: "#0000aa",
        inputBg: "#ffffff",
        buttonBg: "#c0c0c0",
        buttonText: "#000000",
        buttonBorder: "#7f7f7f",
        radius: "0px",
        shadow: "inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff"
      },
      defaults: {
        fontFamily: WINDOWS_98_FONT_STACK,
        fontSize: 14
      },
      extraCss: `
        button,
        input,
        select,
        textarea {
          border-style: solid !important;
          border-width: 2px !important;
          border-top-color: #ffffff !important;
          border-left-color: #ffffff !important;
          border-right-color: #000000 !important;
          border-bottom-color: #000000 !important;
        }

        button:active {
          border-top-color: #000000 !important;
          border-left-color: #000000 !important;
          border-right-color: #ffffff !important;
          border-bottom-color: #ffffff !important;
        }
      `
    },
    slate: {
      label: "Slate",
      style: "palette",
      vars: {
        bg: "#1f2937",
        surface: "#273449",
        text: "#e6edf6",
        border: "#3e4f69",
        link: "#8cb8ff",
        inputBg: "#17212f",
        buttonBg: "#273449",
        buttonText: "#e6edf6",
        buttonBorder: "#3e4f69",
        radius: "6px",
        shadow: "none"
      },
      defaults: {
        fontFamily: "",
        fontSize: null
      },
      extraCss: ""
    },
    paper: {
      label: "Paper",
      style: "palette",
      vars: {
        bg: "#f6f1e7",
        surface: "#fffaf0",
        text: "#302a22",
        border: "#b7aa98",
        link: "#285ea8",
        inputBg: "#ffffff",
        buttonBg: "#f3ebde",
        buttonText: "#302a22",
        buttonBorder: "#b7aa98",
        radius: "4px",
        shadow: "none"
      },
      defaults: {
        fontFamily: "",
        fontSize: null
      },
      extraCss: ""
    }
  };

  const DEFAULT_SETTINGS = {
    globalEnabled: false,
    globalTheme: "windows98",
    globalFontFamily: "",
    globalFontSize: null,
    customCss: "",
    customThemes: {},
    siteOverrides: {}
  };

  function sanitizeFontFamily(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function clampFontSize(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.max(10, Math.min(32, Math.round(parsed)));
  }

  function formatFontSize(value) {
    const size = clampFontSize(value);
    return size === null ? "" : String(size);
  }

  function sanitizeCssValue(value, fallback) {
    if (typeof value !== "string") {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  function sanitizeThemeStyle(style) {
    return style === "classic" || style === "palette" || style === "rainbow" ? style : "palette";
  }

  function sanitizeThemeVars(rawVars) {
    const raw = rawVars && typeof rawVars === "object" ? rawVars : {};

    return {
      bg: sanitizeCssValue(raw.bg, DEFAULT_THEME_VARS.bg),
      surface: sanitizeCssValue(raw.surface, DEFAULT_THEME_VARS.surface),
      text: sanitizeCssValue(raw.text, DEFAULT_THEME_VARS.text),
      border: sanitizeCssValue(raw.border, DEFAULT_THEME_VARS.border),
      link: sanitizeCssValue(raw.link, DEFAULT_THEME_VARS.link),
      inputBg: sanitizeCssValue(raw.inputBg, DEFAULT_THEME_VARS.inputBg),
      buttonBg: sanitizeCssValue(raw.buttonBg, raw.inputBg || DEFAULT_THEME_VARS.buttonBg),
      buttonText: sanitizeCssValue(raw.buttonText, raw.text || DEFAULT_THEME_VARS.buttonText),
      buttonBorder: sanitizeCssValue(raw.buttonBorder, raw.border || DEFAULT_THEME_VARS.buttonBorder),
      radius: sanitizeCssValue(raw.radius, DEFAULT_THEME_VARS.radius),
      shadow: sanitizeCssValue(raw.shadow, DEFAULT_THEME_VARS.shadow)
    };
  }

  function sanitizeThemeDefaults(rawDefaults) {
    const raw = rawDefaults && typeof rawDefaults === "object" ? rawDefaults : {};

    return {
      fontFamily: sanitizeFontFamily(raw.fontFamily),
      fontSize: clampFontSize(raw.fontSize)
    };
  }

  function sanitizeRainbowColors(rawColors) {
    if (!Array.isArray(rawColors)) {
      return [...RAINBOW_FALLBACK_COLORS];
    }

    const cleaned = rawColors
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
      .slice(0, 12);

    return cleaned.length > 0 ? cleaned : [...RAINBOW_FALLBACK_COLORS];
  }

  function slugifyThemeName(name) {
    const input = typeof name === "string" ? name : "";
    const slug = input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);

    return slug || "theme";
  }

  function ensureCustomThemeKey(rawKey, label) {
    const key = typeof rawKey === "string" && rawKey.startsWith(CUSTOM_THEME_PREFIX) ? rawKey : `${CUSTOM_THEME_PREFIX}${slugifyThemeName(label)}`;
    return key;
  }

  function normalizeThemeDefinition(rawTheme, fallbackLabel) {
    if (!rawTheme || typeof rawTheme !== "object") {
      return null;
    }

    const label = sanitizeCssValue(rawTheme.label, sanitizeCssValue(fallbackLabel, "Custom Theme"));
    const style = sanitizeThemeStyle(rawTheme.style);

    return {
      label,
      style,
      vars: sanitizeThemeVars(rawTheme.vars),
      defaults: sanitizeThemeDefaults(rawTheme.defaults),
      rainbowColors: sanitizeRainbowColors(rawTheme.rainbowColors),
      extraCss: typeof rawTheme.extraCss === "string" ? rawTheme.extraCss : ""
    };
  }

  function normalizeCustomThemes(rawCustomThemes) {
    const raw = rawCustomThemes && typeof rawCustomThemes === "object" ? rawCustomThemes : {};
    const normalized = {};

    for (const [rawKey, rawTheme] of Object.entries(raw)) {
      const parsed = normalizeThemeDefinition(rawTheme, rawKey);
      if (!parsed) {
        continue;
      }

      const key = ensureCustomThemeKey(rawKey, parsed.label);
      if (BUILTIN_THEME_PRESETS[key]) {
        continue;
      }

      normalized[key] = parsed;
    }

    return normalized;
  }

  function getThemeCatalog(rawCustomThemes) {
    const customThemes = normalizeCustomThemes(rawCustomThemes);
    return {
      ...BUILTIN_THEME_PRESETS,
      ...customThemes
    };
  }

  function getThemeKey(themeKey, catalog = BUILTIN_THEME_PRESETS) {
    return catalog[themeKey] ? themeKey : DEFAULT_SETTINGS.globalTheme;
  }

  function getThemeDefinition(themeKey, catalog = BUILTIN_THEME_PRESETS) {
    return catalog[getThemeKey(themeKey, catalog)] || catalog[DEFAULT_SETTINGS.globalTheme];
  }

  function getThemeStyle(themeKey, catalog = BUILTIN_THEME_PRESETS) {
    return getThemeDefinition(themeKey, catalog).style;
  }

  function coerceFontFamilyForTheme(themeKey, rawFontFamily) {
    const fontFamily = sanitizeFontFamily(rawFontFamily);

    if (themeKey === "windows98") {
      return fontFamily || WINDOWS_98_FONT_STACK;
    }

    if (fontFamily === WINDOWS_98_FONT_STACK) {
      return "";
    }

    return fontFamily;
  }

  function resolveFontFamily(themeKey, preset, effectiveSettings) {
    const themeSpecific = coerceFontFamilyForTheme(themeKey, effectiveSettings.fontFamily);
    if (themeSpecific) {
      return themeSpecific;
    }

    const defaultFont = sanitizeFontFamily(preset.defaults && preset.defaults.fontFamily);
    if (defaultFont) {
      return defaultFont;
    }

    return themeKey === "windows98" ? WINDOWS_98_FONT_STACK : "";
  }

  function resolveFontSize(preset, effectiveSettings) {
    const explicit = clampFontSize(effectiveSettings.fontSize);
    if (explicit !== null) {
      return explicit;
    }

    return clampFontSize(preset.defaults && preset.defaults.fontSize);
  }

  function buildRainbowColorRules(colors) {
    return colors
      .map((color, index) => {
        const nth = index + 1;
        return `.wt-rainbow-char:nth-child(${colors.length}n+${nth}) { color: ${color} !important; }`;
      })
      .join("\n");
  }

  function buildRainbowGradient(colors) {
    return `linear-gradient(90deg, ${colors.join(", ")})`;
  }

  function buildThemeCss(effectiveSettings, catalogInput) {
    const catalog = catalogInput && typeof catalogInput === "object" ? catalogInput : BUILTIN_THEME_PRESETS;
    const themeKey = getThemeKey(effectiveSettings.theme, catalog);
    const preset = getThemeDefinition(themeKey, catalog);
    const vars = sanitizeThemeVars(preset.vars);
    const fontFamily = resolveFontFamily(themeKey, preset, effectiveSettings);
    const fontSize = resolveFontSize(preset, effectiveSettings);
    const fontFamilyCss = fontFamily ? `font-family: ${fontFamily} !important;` : "";
    const fontSizeCss = fontSize === null ? "" : `font-size: ${fontSize}px !important;`;
    const customCss = typeof effectiveSettings.customCss === "string" ? effectiveSettings.customCss : "";

    if (preset.style === "rainbow") {
      const rainbowColors = sanitizeRainbowColors(preset.rainbowColors);
      const rainbowGradient = buildRainbowGradient(rainbowColors);
      const caretColor = rainbowColors[1] || rainbowColors[0] || "#ff7f00";

      return `
        .wt-rainbow-char {
          display: inline;
          font: inherit;
          ${fontFamilyCss}
          ${fontSizeCss}
        }

        ${buildRainbowColorRules(rainbowColors)}

        input:not([type="password"]),
        textarea,
        [contenteditable="true"],
        [contenteditable=""] {
          background-image: ${rainbowGradient} !important;
          background-size: 300% 100% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          caret-color: ${caretColor} !important;
          ${fontFamilyCss}
          ${fontSizeCss}
        }

        input:not([type="password"])::placeholder,
        textarea::placeholder {
          color: #9ca3af !important;
          -webkit-text-fill-color: #9ca3af !important;
        }

        ${preset.extraCss || ""}
        ${customCss}
      `;
    }

    const commonVarsCss = `
      :root {
        --wt-bg: ${vars.bg};
        --wt-surface: ${vars.surface};
        --wt-text: ${vars.text};
        --wt-border: ${vars.border};
        --wt-link: ${vars.link};
        --wt-input-bg: ${vars.inputBg};
        --wt-button-bg: ${vars.buttonBg};
        --wt-button-text: ${vars.buttonText};
        --wt-button-border: ${vars.buttonBorder};
        --wt-radius: ${vars.radius};
        --wt-shadow: ${vars.shadow};
      }
    `;

    if (preset.style === "classic") {
      return `
        ${commonVarsCss}

        html,
        body {
          background: var(--wt-bg) !important;
          color: var(--wt-text) !important;
          ${fontFamilyCss}
          ${fontSizeCss}
        }

        * {
          border-color: var(--wt-border) !important;
        }

        p,
        span,
        div,
        li,
        td,
        th,
        a,
        label,
        strong,
        em,
        small {
          color: var(--wt-text) !important;
          ${fontFamilyCss}
        }

        a,
        a * {
          color: var(--wt-link) !important;
        }

        button,
        input,
        select,
        textarea,
        summary {
          background: var(--wt-surface) !important;
          color: var(--wt-text) !important;
          border: 1px solid var(--wt-border) !important;
          border-radius: var(--wt-radius) !important;
          box-shadow: var(--wt-shadow) !important;
          ${fontFamilyCss}
          ${fontSizeCss}
        }

        button {
          background: var(--wt-button-bg) !important;
          color: var(--wt-button-text) !important;
          border-color: var(--wt-button-border) !important;
        }

        input,
        textarea,
        select {
          background: var(--wt-input-bg) !important;
        }

        article,
        section,
        main,
        nav,
        header,
        footer,
        aside,
        dialog,
        pre,
        table,
        fieldset {
          background: var(--wt-surface) !important;
          color: var(--wt-text) !important;
        }

        code,
        pre,
        kbd,
        samp {
          font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }

        :focus-visible {
          outline: 2px dotted var(--wt-link) !important;
          outline-offset: 1px !important;
        }

        ${preset.extraCss || ""}
        ${customCss}
      `;
    }

    return `
      ${commonVarsCss}

      html,
      body {
        background: var(--wt-bg) !important;
        color: var(--wt-text) !important;
        ${fontFamilyCss}
        ${fontSizeCss}
      }

      a,
      a * {
        color: var(--wt-link) !important;
      }

      button,
      input,
      select,
      textarea,
      summary {
        background: var(--wt-input-bg) !important;
        color: var(--wt-text) !important;
        border: 1px solid var(--wt-border) !important;
        border-radius: var(--wt-radius) !important;
        box-shadow: var(--wt-shadow) !important;
        ${fontFamilyCss}
        ${fontSizeCss}
      }

      button {
        background: var(--wt-button-bg) !important;
        color: var(--wt-button-text) !important;
        border-color: var(--wt-button-border) !important;
      }

      article,
      section,
      main,
      nav,
      header,
      footer,
      aside,
      dialog,
      pre,
      table,
      fieldset,
      blockquote {
        background: var(--wt-surface) !important;
        color: var(--wt-text) !important;
      }

      :focus-visible {
        outline: 2px solid var(--wt-link) !important;
        outline-offset: 1px !important;
      }

      ${preset.extraCss || ""}
      ${customCss}
    `;
  }

  window.WebThemePresets = {
    BUILTIN_THEME_PRESETS,
    THEME_PRESETS: BUILTIN_THEME_PRESETS,
    DEFAULT_THEME_VARS,
    DEFAULT_SETTINGS,
    WINDOWS_98_FONT_STACK,
    CUSTOM_THEME_PREFIX,
    buildThemeCss,
    sanitizeFontFamily,
    clampFontSize,
    formatFontSize,
    coerceFontFamilyForTheme,
    sanitizeThemeVars,
    sanitizeThemeDefaults,
    normalizeThemeDefinition,
    normalizeCustomThemes,
    getThemeCatalog,
    getThemeDefinition,
    getThemeStyle,
    getThemeKey,
    slugifyThemeName
  };
})();
