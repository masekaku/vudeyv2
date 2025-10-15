// Statistics and Analytics Functions

// Initialize Google Analytics
function initGoogleAnalytics() {
    if (!ANALYTICS_CONFIG.gaId || ANALYTICS_CONFIG.gaId === 'G-XXXXXXX') return;
    
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.gaId}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.gaId);
    
    console.log('Google Analytics initialized');
}

// Initialize Histats
function initHistats() {
    if (!ANALYTICS_CONFIG.histatsId || ANALYTICS_CONFIG.histatsId === 'XXXXXXX') return;
    
    var _Hasync = _Hasync || [];
    _Hasync.push(['Histats.start', '1,' + ANALYTICS_CONFIG.histatsId + ',4,0,0,0,00010000']);
    _Hasync.push(['Histats.fasi', '1']);
    _Hasync.push(['Histats.track_hits', '']);
    
    (function() {
        var hs = document.createElement('script'); 
        hs.type = 'text/javascript'; 
        hs.async = true;
        hs.src = ('//s10.histats.com/js15_as.js');
        (document.getElementsByTagName('head')[0] || document.body).appendChild(hs);
    })();
    
    console.log('Histats initialized');
}

// Initialize Disqus
function initDisqus() {
    if (!ANALYTICS_CONFIG.disqusShortname || ANALYTICS_CONFIG.disqusShortname === 'YOUR-SHORTNAME') return;
    
    window.disqus_config = function () {
        this.page.url = window.location.href;
        this.page.identifier = 'artifact-directory';
    };
    
    (function() {
        var d = document, s = d.createElement('script');
        s.src = 'https://' + ANALYTICS_CONFIG.disqusShortname + '.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
    
    console.log('Disqus initialized');
}

// Track artifact click
function trackArtifactClick(artifactId, artifactTitle) {
    // Send to Google Analytics
    if (window.gtag) {
        gtag('event', 'artifact_click', {
            'artifact_id': artifactId,
            'artifact_title': artifactTitle
        });
    }
    
    // Increment local counter
    incrementClickCounter(artifactId);
}

// Increment click counter for an artifact
function incrementClickCounter(artifactId) {
    const key = `artifact_clicks_${artifactId}`;
    const currentCount = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (currentCount + 1).toString());
    
    // Update total clicks
    const totalClicks = parseInt(localStorage.getItem('total_clicks') || '0');
    localStorage.setItem('total_clicks', (totalClicks + 1).toString());
}

// Get click statistics
function getClickStats() {
    const stats = {
        total: parseInt(localStorage.getItem('total_clicks') || '0'),
        byArtifact: {}
    };
    
    // Get all artifact click counts
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('artifact_clicks_')) {
            const artifactId = key.replace('artifact_clicks_', '');
            stats.byArtifact[artifactId] = parseInt(localStorage.getItem(key));
        }
    }
    
    return stats;
}

// Initialize all analytics
function initAllAnalytics() {
    initGoogleAnalytics();
    initHistats();
    initDisqus();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAllAnalytics,
        trackArtifactClick,
        incrementClickCounter,
        getClickStats
    };
}