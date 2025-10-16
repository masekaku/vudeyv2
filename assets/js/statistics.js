/* statistics.js
   - Initializes Google Analytics (GA4) and Histats (active)
   - Registers Disqus shortname for later embed
   - Provides helper functions for tracking events
   - Ensures async loading for performance and PWA safety
*/

(function (cfg) {
  // ==========================
  // 📊 Google Analytics (GA4)
  // ==========================
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  if (cfg.GA_MEASUREMENT_ID) {
    gtag('js', new Date());
    gtag('config', cfg.GA_MEASUREMENT_ID);
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);
  }

  // ==========================
  // 📈 Histats Integration
  // ==========================
  (function initHistats() {
    try {
      window._Hasync = window._Hasync || [];
      _Hasync.push(['Histats.start', cfg.HISTATS_ID || '1,4984384,4,5,172,25,00011111']);
      _Hasync.push(['Histats.fasi', '1']);
      _Hasync.push(['Histats.track_hits', '']);

      const hs = document.createElement('script');
      hs.type = 'text/javascript';
      hs.async = true;
      hs.src = '//s10.histats.com/js15_as.js';
      (document.head || document.body).appendChild(hs);
    } catch (err) {
      console.warn('⚠️ Histats failed to initialize:', err);
    }
  })();

  // ==========================
  // 💬 Disqus Helper
  // ==========================
  window.loadDisqus = function () {
    if (!cfg.DISQUS_SHORTNAME || cfg.DISQUS_SHORTNAME === 'your-disqus-shortname') return;

    if (window.DISQUS) {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.url = location.href;
          this.page.identifier = location.pathname;
        },
      });
      return;
    }

    const d = document, s = d.createElement('script');
    s.src = 'https://' + cfg.DISQUS_SHORTNAME + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  };

  // ==========================
  // ⚙️ Generic Event Tracker
  // ==========================
  window.trackEvent = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
    try { window._Hasync.push(['Histats.track_event', name]); } catch (e) {}
  };
})(window.APP_CONFIG || {});