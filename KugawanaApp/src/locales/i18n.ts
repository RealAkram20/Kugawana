import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import fr from './fr.json'
import sw from './sw.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sw: { translation: sw },
    fr: { translation: fr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
