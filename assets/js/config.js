// Configuration and Constants
const CONFIG = {
    itemsPerPage: 5,
    adFrequency: 5,
    maxHistoryItems: 5,
    offlineMessage: "Offline Mode: Restricted Access"
};

// Analytics Configuration (Replace with your actual IDs)
const ANALYTICS_CONFIG = {
    gaId: 'G-XXXXXXX',
    histatsId: 'XXXXXXX',
    disqusShortname: 'YOUR-SHORTNAME'
};

// Field mapping for obfuscated JSON keys
const FIELD_MAP = {
    'i': 'id',
    't': 'title',
    'm': 'thumbnail',
    'l': 'external_link'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ANALYTICS_CONFIG, FIELD_MAP };
}