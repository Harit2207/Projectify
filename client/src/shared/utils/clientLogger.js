const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args) => { if (isDev) console.info('[INFO]', ...args); },
  warn: (...args) => { if (isDev) console.warn('[WARN]', ...args); },
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => { if (isDev) console.debug('[DEBUG]', ...args); },
};
