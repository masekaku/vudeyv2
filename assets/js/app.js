// Main Application Logic

// State management
let artifacts = [];
let filteredArtifacts = [];
let displayedCount = 0;
let isOnline = navigator.onLine;

// DOM Elements
const artifactsGrid = document.getElementById('artifactsGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.querySelector('.search-input');
const toast = document.getElementById('toast');
const offlineOverlay = document.querySelector('.offline-overlay');

// Initialize the application
function initApp() {
    // Initialize icons and animations
    lucide.createIcons();
    AOS.init({
        duration: 800,
        once: true
    });
    
    // Initialize analytics
    if (typeof initAllAnalytics === 'function') {
        initAllAnalytics();
    }
    
    // Load artifacts
    loadArtifacts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check online status
    updateOnlineStatus();
}

// Expand short keys to readable field names
function expandKeys(data) {
    return data.map(item => {
        const expanded = {};
        for (const [shortKey, longKey] of Object.entries(FIELD_MAP)) {
            if (item.hasOwnProperty(shortKey)) {
                expanded[longKey] = item[shortKey];
            }
        }
        return expanded;
    });
}

// Load artifacts from JSON
async function loadArtifacts() {
    try {
        const response = await fetch('artifacts.json');
        if (!response.ok) throw new Error('Failed to fetch artifacts');
        
        const data = await response.json();
        artifacts = expandKeys(data);
        filteredArtifacts = [...artifacts];
        
        // Initial render
        renderArtifacts();
        updateLoadMoreButton();
        
        // Hide offline overlay if shown
        if (!isOnline) {
            isOnline = true;
            offlineOverlay.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading artifacts:', error);
        if (!isOnline) {
            offlineOverlay.classList.remove('hidden');
        }
    }
}

// Render artifacts to the grid
function renderArtifacts() {
    const itemsToRender = filteredArtifacts.slice(displayedCount, displayedCount + CONFIG.itemsPerPage);
    
    itemsToRender.forEach((artifact, index) => {
        // Create artifact card
        const card = createArtifactCard(artifact);
        artifactsGrid.appendChild(card);
        
        // Add ad placeholder after every CONFIG.adFrequency items
        if ((displayedCount + index + 1) % CONFIG.adFrequency === 0) {
            const adPlaceholder = createAdPlaceholder();
            artifactsGrid.appendChild(adPlaceholder);
        }
    });
    
    displayedCount += itemsToRender.length;
}

// Create artifact card element
function createArtifactCard(artifact) {
    const card = document.createElement('div');
    card.className = 'artifact-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-id', artifact.id);
    
    card.innerHTML = `
        <div class="thumbnail-container">
            <img src="${artifact.thumbnail}" alt="${artifact.title}" class="thumbnail" loading="lazy">
        </div>
        <div class="artifact-info">
            <h3 class="artifact-title">${artifact.title}</h3>
            <p class="artifact-id">ARTIFACT ID: ${artifact.id}</p>
        </div>
    `;
    
    // Add click event
    card.addEventListener('click', () => handleArtifactClick(artifact));
    
    return card;
}

// Create ad placeholder element
function createAdPlaceholder() {
    const adPlaceholder = document.createElement('div');
    adPlaceholder.className = 'ad-placeholder';
    adPlaceholder.innerHTML = 'ADVERTISEMENT (300×250)';
    return adPlaceholder;
}

// Handle artifact click
function handleArtifactClick(artifact) {
    // Save to browsing history
    saveToHistory(artifact);
    
    // Track click for analytics
    if (typeof trackArtifactClick === 'function') {
        trackArtifactClick(artifact.id, artifact.title);
    } else {
        // Fallback if statistics.js not loaded
        incrementClickCounter(artifact.id);
    }
    
    // Show toast notification
    showToast();
    
    // Open external link
    window.open(artifact.external_link, '_blank', 'noopener,noreferrer');
}

// Save artifact to browsing history
function saveToHistory(artifact) {
    let history = JSON.parse(localStorage.getItem('artifactHistory') || '[]');
    
    // Remove if already exists
    history = history.filter(item => item.id !== artifact.id);
    
    // Add to beginning
    history.unshift({
        id: artifact.id,
        title: artifact.title,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last CONFIG.maxHistoryItems
    if (history.length > CONFIG.maxHistoryItems) {
        history = history.slice(0, CONFIG.maxHistoryItems);
    }
    
    localStorage.setItem('artifactHistory', JSON.stringify(history));
}

// Increment click counter (fallback)
function incrementClickCounter(artifactId) {
    const key = `artifact_clicks_${artifactId}`;
    const currentCount = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (currentCount + 1).toString());
}

// Show toast notification
function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Filter artifacts based on search query
function filterArtifacts(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery === '') {
        filteredArtifacts = [...artifacts];
    } else {
        filteredArtifacts = artifacts.filter(artifact => 
            artifact.title.toLowerCase().includes(normalizedQuery) ||
            artifact.id.toLowerCase().includes(normalizedQuery)
        );
    }
    
    // Reset display
    artifactsGrid.innerHTML = '';
    displayedCount = 0;
    
    // Re-render
    renderArtifacts();
    updateLoadMoreButton();
}

// Update load more button state
function updateLoadMoreButton() {
    if (displayedCount >= filteredArtifacts.length) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'ALL ARTIFACTS LOADED';
    } else {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'LOAD MORE ARTIFACTS';
    }
}

// Handle online/offline status
function updateOnlineStatus() {
    isOnline = navigator.onLine;
    
    if (!isOnline) {
        offlineOverlay.classList.remove('hidden');
    } else {
        offlineOverlay.classList.add('hidden');
        // Try to reload artifacts if we were offline
        if (artifacts.length === 0) {
            loadArtifacts();
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    loadMoreBtn.addEventListener('click', () => {
        renderArtifacts();
        updateLoadMoreButton();
    });

    searchInput.addEventListener('input', (e) => {
        filterArtifacts(e.target.value);
    });

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// Initialize service worker for PWA
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initServiceWorker();
});