/* config.js - configuration constants */

window.APP_CONFIG = {
  BASE_URL: '/', // replace with production URL for sitemap generation
  PAGE_SIZE: 5,
  ARTIFACTS_JSON: '/artifacts.json',
  GA_MEASUREMENT_ID: 'G-VJSNZ6HT2H', // replace with your GA4 ID or '' to disable
  HISTATS_ID: '1,4984384,4,5,172,25,00011111', // replace with your Histats ID string or ''
  DISQUS_SHORTNAME: 'dydxdev', // replace with your Disqus shortname or '' to disable
  FIELD_MAP: { id: 'i', title: 't', thumbnail: 'm', link: 'l' },
  CACHE_VERSION: 'artifact-v1',
  LOCALSTORAGE_CLICK_KEY: 'artifact_clicks',
  LOCALSTORAGE_HISTORY_KEY: 'artifact_history'
};