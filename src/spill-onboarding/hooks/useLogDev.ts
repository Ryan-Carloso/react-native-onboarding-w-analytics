import { useCallback } from 'react';

/**
 * Helper function to log messages with the Dev Mode prefix.
 * Can be used outside of React components.
 */
export const logDevMessage = (isDev: boolean, message: string, data?: any) => {
  if (isDev) {
    if (data) {
      console.log(`🚧 [Dev Mode] ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`🚧 [Dev Mode] ${message}`);
    }
  }
};

export const useLogDev = (isDev: boolean) => {
  const log = useCallback(
    (message: string, data?: any) => {
      logDevMessage(isDev, message, data);
    },
    [isDev]
  );

  return log;
};
