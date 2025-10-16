/* statistics.js
   - Initializes Google Analytics (GA4) and Histats (active)
   - Registers Disqus shortname for later embed
   - Provides helper functions for tracking events
   - Ensures async loading for performance and PWA safety
*/

(function (cfg) {
  // safety fallback
  cfg = cfg || {};

  // ==========================
  // 📊 Google Analytics (GA4)
  // ==========================
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  if (cfg.GA_MEASUREMENT_ID) {
    try {
      gtag('js', new Date());
      gtag('config', cfg.GA_MEASUREMENT_ID);

      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.GA_MEASUREMENT_ID}`;
      document.head.appendChild(gaScript);
      console.log('✅ GA4 script appended');
    } catch (e) {
      console.warn('⚠️ GA initialization failed', e);
    }
  } else {
    // no GA configured
    console.log('GA_MEASUREMENT_ID not set — skipping GA init');
  }

  // ==========================
  // 📈 Histats Integration
  // ==========================
  (function initHistats() {
    if (!cfg.HISTATS_ID) {
      console.log('Histats ID not provided — skipping Histats');
      return;
    }
    try {
      window._Hasync = window._Hasync || [];
      window._Hasync.push(['Histats.start', cfg.HISTATS_ID]);
      window._Hasync.push(['Histats.fasi', '1']);
      window._Hasync.push(['Histats.track_hits', '']);

      const hs = document.createElement('script');
      hs.type = 'text/javascript';
      hs.async = true;
      hs.src = '//s10.histats.com/js15_as.js';
      (document.head || document.body).appendChild(hs);

      // optional noscript fallback (kept minimal)
      console.log('✅ Histats script appended');
    } catch (err) {
      console.warn('⚠️ Histats failed to initialize:', err);
    }
  })();

  // ==========================
  // 💬 Disqus Helper
  // ==========================
  window.loadDisqus = function () {
    // Only load if shortname provided and not empty placeholder
    if (!cfg.DISQUS_SHORTNAME || cfg.DISQUS_SHORTNAME === 'your-disqus-shortname') {
      console.log('Disqus shortname not set — skipping Disqus');
      return;
    }

    if (window.DISQUS) {
      try {
        DISQUS.reset({
          reload: true,
          config: function () {
            this.page.url = location.href;
            this.page.identifier = location.pathname;
          },
        });
        console.log('✅ Disqus reset');
      } catch (e) {
        console.warn('⚠️ Disqus reset failed', e);
      }
      return;
    }

    const d = document, s = d.createElement('script');
    s.src = 'https://' + cfg.DISQUS_SHORTNAME + '.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    s.async = true;
    (d.head || d.body).appendChild(s);
    console.log('✅ Disqus script appended');
  };

  // ==========================
  // ⚙️ Generic Event Tracker
  // ==========================
  window.trackEvent = function (name, params) {
    try { if (window.gtag) gtag('event', name, params || {}); } catch (e) { /* ignore */ }
    try { if (window._Hasync) window._Hasync.push(['Histats.track_event', name]); } catch (e) { /* ignore */ }
  };

})(window.APP_CONFIG || {});