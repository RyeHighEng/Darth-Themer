(() => {
  const WINDOWS_98_FONT_STACK = '"MS Sans Serif", Tahoma, Arial, sans-serif';

  const THEME_PRESETS = {
    ghosttyHotline: {
      label: "Ghostty (Hotline Miami)",
      style: "palette",
      vars: {
        bg: "#130A24",
        surface: "#2B0D36",
        text: "#F9E8FF",
        border: "#8A479F",
        link: "#2EFFFF",
        inputBg: "#471758",
        radius: "2px",
        shadow: "none"
      },
      extraCss: `
        ::selection {
          background: #FB9728 !important;
          color: #130A24 !important;
        }

        mark {
          background: #FB9728 !important;
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
        radius: "6px",
        shadow: "none"
      },
      extraCss: `
        h1, h2, h3, h4, h5, h6 {
          color: #ffda45 !important;
        }

        button {
          background: #b44dff !important;
          color: #ffffff !important;
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
        radius: "0px",
        shadow: "inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff"
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
        radius: "6px",
        shadow: "none"
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
        radius: "4px",
        shadow: "none"
      },
      extraCss: ""
    }
  };

  const DEFAULT_SETTINGS = {
    globalEnabled: true,
    globalTheme: "windows98",
    globalFontFamily: "",
    globalFontSize: null,
    customCss: "",
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

    return Math.max(10, Math.min(26, Math.round(parsed)));
  }

  function formatFontSize(value) {
    const size = clampFontSize(value);
    return size === null ? "" : String(size);
  }

  function getThemeKey(themeKey) {
    return THEME_PRESETS[themeKey] ? themeKey : DEFAULT_SETTINGS.globalTheme;
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

  function buildThemeCss(effectiveSettings) {
    const themeKey = getThemeKey(effectiveSettings.theme);
    const preset = THEME_PRESETS[themeKey];
    const vars = preset.vars;
    const fontFamily = coerceFontFamilyForTheme(themeKey, effectiveSettings.fontFamily);
    const fontSize = clampFontSize(effectiveSettings.fontSize);
    const fontFamilyCss = fontFamily ? `font-family: ${fontFamily} !important;` : "";
    const fontSizeCss = fontSize === null ? "" : `font-size: ${fontSize}px !important;`;
    const customCss = typeof effectiveSettings.customCss === "string" ? effectiveSettings.customCss : "";

    if (preset.style === "classic") {
      return `
        :root {
          --wt-bg: ${vars.bg};
          --wt-surface: ${vars.surface};
          --wt-text: ${vars.text};
          --wt-border: ${vars.border};
          --wt-link: ${vars.link};
          --wt-input-bg: ${vars.inputBg};
          --wt-radius: ${vars.radius};
          --wt-shadow: ${vars.shadow};
          --wt-font-size: ${fontSize === null ? 14 : fontSize}px;
        }

        html,
        body {
          background: var(--wt-bg) !important;
          color: var(--wt-text) !important;
          font-family: ${fontFamily} !important;
          font-size: var(--wt-font-size) !important;
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
          font-family: ${fontFamily} !important;
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
          font-family: ${fontFamily} !important;
          font-size: var(--wt-font-size) !important;
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

        ${preset.extraCss}
        ${customCss}
      `;
    }

    return `
      :root {
        --wt-bg: ${vars.bg};
        --wt-surface: ${vars.surface};
        --wt-text: ${vars.text};
        --wt-border: ${vars.border};
        --wt-link: ${vars.link};
        --wt-input-bg: ${vars.inputBg};
        --wt-radius: ${vars.radius};
      }

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
        ${fontFamilyCss}
        ${fontSizeCss}
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

      ${preset.extraCss}
      ${customCss}
    `;
  }

  window.WebThemePresets = {
    THEME_PRESETS,
    DEFAULT_SETTINGS,
    WINDOWS_98_FONT_STACK,
    buildThemeCss,
    sanitizeFontFamily,
    clampFontSize,
    formatFontSize,
    coerceFontFamilyForTheme,
    getThemeKey
  };
})();
