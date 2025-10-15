/* statistics.js
   - Initializes Google Analytics (GA4) and Histats (placeholders)
   - Registers Disqus shortname for later embed
   - Provides helper functions for tracking events
*/

(function (cfg) {
  // GA4 init
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  if (cfg.GA_MEASUREMENT_ID && cfg.GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('js', new Date());
    gtag('config', cfg.GA_MEASUREMENT_ID);
  } else {
    // placeholder config for dev
    gtag('js', new Date());
  }

  // Histats placeholder (defer actual snippet integration; user must paste their snippet)
  window._his = window._his || [];
  // Example: _his.push(['track', cfg.HISTATS_ID]);

  // Disqus helper
  window.loadDisqus = function () {
    if (!cfg.DISQUS_SHORTNAME || cfg.DISQUS_SHORTNAME === 'your-disqus-shortname') return;
    if (window.DISQUS) {
      DISQUS.reset({reload:true, config: function () { this.page.url = location.href; this.page.identifier = location.pathname; }});
      return;
    }
    var d = document, s = d.createElement('script');
    s.src = 'https://' + cfg.DISQUS_SHORTNAME + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  };

  // Generic event tracker wrapper
  window.trackEvent = function (name, params) {
    try {
      gtag('event', name, params || {});
    } catch (e) { /* fail silently */ }
    try {
      // histats push (user must configure)
      window._his.push([name, params]);
    } catch (e) {}
  };
})(window.APP_CONFIG);