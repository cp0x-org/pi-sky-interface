import React, { useState, useEffect } from 'react';

// third party
import { IntlProvider, MessageFormatElement } from 'react-intl';
import useConfig from 'hooks/useConfig';

// types
import { I18n } from 'types/config';

// load locales files
function loadLocaleData(i18n: I18n) {
  switch (i18n) {
    case 'zh':
      return import('utils/locales/zh.json');
    default:
      return import('utils/locales/en.json');
  }
}

// ==============================|| LOCALIZATION ||============================== //

interface LocalsProps {
  children: React.ReactNode;
}

export default function Locales({ children }: LocalsProps) {
  const { i18n } = useConfig();
  const [messages, setMessages] = useState<Record<string, string> | Record<string, MessageFormatElement[]> | undefined>();

  useEffect(() => {
    loadLocaleData(i18n).then((d: { default: Record<string, string> | Record<string, MessageFormatElement[]> | undefined }) => {
      setMessages(d.default);
    });
  }, [i18n]);

  // keep the document language in sync so screen readers and browsers
  // announce the content with the correct pronunciation
  useEffect(() => {
    document.documentElement.lang = i18n;
  }, [i18n]);

  return (
    <>
      {messages && (
        <IntlProvider locale={i18n} defaultLocale="en" messages={messages}>
          {children}
        </IntlProvider>
      )}
    </>
  );
}
