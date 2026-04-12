'use client'

import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enUS from '@/public/locales/en-US/translation.json'
import ruRU from '@/public/locales/ru-RU/translation.json'

const resources = {
  'en-US': { translation: enUS },
  'ru-RU': { translation: ruRU },
} satisfies Resource

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
