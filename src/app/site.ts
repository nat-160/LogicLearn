/**
 * Which copy of LogicLearn this is (set at build time, see .env and .env.dev-branch):
 *
 *  - the live site, built from `main`:         https://nat-160.github.io/LogicLearn/
 *  - the test version, built from `dev`:       https://nat-160.github.io/LogicLearn/dev/
 *
 * The test version says so in a banner on every page, and saves under its own names
 * (storageKey() in src/storage/storage.ts).
 */
export const IS_TEST_VERSION = import.meta.env.VITE_SITE === 'dev';
