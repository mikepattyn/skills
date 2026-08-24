/**
 * Vanilla EN/NL locale — policy matches Kapsalon LocaleService.
 * Depends on window.I18N = { en: {...}, nl: {...} } from js/i18n/*.js
 */
(function (global) {
  const STORAGE_KEY = "locale";

  function readStored() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "en" || stored === "nl" ? stored : null;
    } catch {
      return null;
    }
  }

  function persist(locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }

  function resolveInitial() {
    const stored = readStored();
    if (stored) return stored;
    return navigator.language.toLowerCase().startsWith("nl") ? "nl" : "en";
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  let active = resolveInitial();

  function t(key) {
    const dict = (global.I18N && global.I18N[active]) || {};
    const value = getByPath(dict, key);
    return value == null ? key : value;
  }

  function applyDocumentChrome() {
    document.documentElement.lang = active;
    const title = t("app.title");
    if (title && title !== "app.title") {
      document.title = title;
    }
    document.querySelectorAll("[data-locale]").forEach((btn) => {
      const isActive = btn.getAttribute("data-locale") === active;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.classList.toggle("is-active", isActive);
    });
  }

  function setLocale(locale) {
    if (locale !== "en" && locale !== "nl") return;
    if (locale === active) return;
    active = locale;
    persist(locale);
    applyDocumentChrome();
    if (typeof global.render === "function") {
      global.render();
    } else {
      global.dispatchEvent(new CustomEvent("localechange", { detail: { locale } }));
    }
  }

  function getLocale() {
    return active;
  }

  function initLocale() {
    applyDocumentChrome();
    document.querySelectorAll("[data-locale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLocale(btn.getAttribute("data-locale"));
      });
    });
  }

  global.t = t;
  global.setLocale = setLocale;
  global.getLocale = getLocale;
  global.initLocale = initLocale;
})(window);
