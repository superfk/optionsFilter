import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from './lang/en.json';
import de from './lang/de.json';
import zh_cn from './lang/zh_cn.json';
import zh_tw from './lang/zh_tw.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // we init with resources
    resources: {
      en: {
        translations: en
      },
      de: {
        translations: de
      },
      'zh_cn': {
        translations: zh_cn
      },
      'zh_tw': {
        translations: zh_tw
      }
    },
    fallbackLng: "en",
    debug: true,

    // have a common namespace used around the full app
    // ns: ["translations"],
    // defaultNS: "translations",
    lng: "en",
    ns: ["translations"],
    defaultNS: "translations",

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
