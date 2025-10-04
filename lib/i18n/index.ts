import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import zh from './locales/zh-CN/translation.json'
import en from './locales/en/translation.json'

const resources = {
    'zh-CN': { translation: zh },
    'zh': { translation: zh },
    en: { translation: en },
}

i18n.use(initReactI18next).init({
    resources,
    lng: 'zh',
    fallbackLng: 'zh',
    interpolation: {
        escapeValue: false,
    },
    debug: false,
})

export default i18n
