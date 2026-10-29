// The settings in .env (live site) and .env.dev-branch (test version).
interface ImportMetaEnv {
  /** Start of every name saved in the browser: "logiclearn:" or "logiclearn-dev:". */
  readonly VITE_STORAGE_PREFIX: string;
  /** "live", or "dev" for the test version built from the dev branch. */
  readonly VITE_SITE: 'live' | 'dev';
}
