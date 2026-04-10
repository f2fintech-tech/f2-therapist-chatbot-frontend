/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly REACT_APP_API_BASE_URL: string;
  readonly REACT_APP_API_TIMEOUT: string;
  readonly REACT_APP_NAME: string;
  readonly REACT_APP_VERSION: string;
  readonly REACT_APP_ENV: string;
  readonly REACT_APP_ENABLE_DARK_MODE: string;
  readonly REACT_APP_ENABLE_NOTIFICATIONS: string;
  readonly REACT_APP_ENABLE_ANALYTICS: string;
}
