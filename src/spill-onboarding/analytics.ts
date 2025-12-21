import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

// TODO: need to get an better domain
const API_URL = 'https://api.freesupabase.shop/api/track';

export const trackEvent = async (
  apiKey: string | undefined,
  eventType: string,
  metaData: any = {},
  isDev: boolean = false
) => {
  const appName =
    Constants.expoConfig?.name ||
    Constants.manifest?.name ||
    'react-native-app';
  const locales = Localization.getLocales();
  const primaryLocale = locales[0];

  const extendedMetaData = {
    ...metaData,
    locale: primaryLocale?.languageTag,
    region: primaryLocale?.regionCode,
    language: primaryLocale?.languageCode,
  };

  if (!isDev && !apiKey) {
    console.error(
      JSON.stringify({
        error: 'Go to `https://freesupabase.shop/docs` to get an app token',
      })
    );
    return;
  }

  const payload = {
    app_id: apiKey,
    eventType,
    userAgent: `React Native (${Platform.OS})`,
    sourceUrl: appName,
    metaData: extendedMetaData,
  };

  if (isDev) {
    console.log(
      '🚧 [Dev Mode] Analytics Event (Not Sent):',
      JSON.stringify(payload, null, 2)
    );
    return;
  }

  if (!apiKey) {
    console.log('⚠️ Analytics: No API Key provided, event not sent.');
    return;
  }

  console.log('📡 Sending Analytics Event:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error(
          JSON.stringify({
            error: 'Go to `https://freesupabase.shop/docs` to get an app token',
          })
        );
      } else {
        console.error(
          'Analytics error:',
          response.status,
          await response.text()
        );
      }
    }
  } catch (error) {
    console.error('Failed to send analytics event:', error);
  }
};
