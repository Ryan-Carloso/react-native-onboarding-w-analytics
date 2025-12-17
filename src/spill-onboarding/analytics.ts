import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

const API_URL = 'https://api.freesupabase.shop/api/track';

// NOTE: Remove this mock key before deploying to production
const MOCK_API_KEY = 'app-6fe754ea-0671-4b2b-b2ab-2eb30d4af9fc';

export const trackEvent = async (
  apiKey: string | undefined,
  eventType: string,
  metaData: any = {}
) => {
  const token = apiKey || MOCK_API_KEY;
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

  if (!token) {
    console.error(
      JSON.stringify({
        error: 'Go to `https://freesupabase.shop/docs` to get an app token',
      })
    );
    return;
  }

  const payload = {
    app_id: token,
    eventType,
    userAgent: `React Native (${Platform.OS})`,
    sourceUrl: appName,
    metaData: extendedMetaData,
  };

  console.log('📡 Sending Analytics Event:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
