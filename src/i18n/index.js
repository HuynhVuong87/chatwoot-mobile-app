import i18n from 'i18n-js';

import en from './en.json';
import vi from './vi.json';
import zh_CN from './zh_CN.json';

i18n.locale = 'vi';
i18n.fallbacks = true;
i18n.translations = {
  en,
  vi,
  zh_CN,
};

export default i18n;
