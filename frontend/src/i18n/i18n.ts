// Initializes application localization using react-i18next.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Translation resources for supported languages.
import en from "./locales/en";
import da from "./locales/da";

// Restore previously selected language from localStorage.
const savedLanguage = localStorage.getItem("language") || "en";

// Configure translation resources and default language behavior.
void i18n.use(initReactI18next).init({
  // Application translation dictionaries.
  resources: {
    en: {
      translation: en,
    },
    da: {
      translation: da,
    },
  },
  lng: savedLanguage,
  // Fallback language when translation key is missing.
  fallbackLng: "en",
  interpolation: {
    // React already escapes values by default.
    escapeValue: false,
  },
});

// Shared i18n instance used throughout the application.
export default i18n;
