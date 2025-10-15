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
        
        // Initialize pagination after data is loaded
        initPagination();
        
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
    
    // Update pagination for filtered results
    if (typeof updatePaginationForFilter === 'function') {
        updatePaginationForFilter();
    }
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

// ============================== 
// SECTION: Pagination Logic
// ============================== 

// Pagination state
let currentPage = 1;
const itemsPerPage = 5;
let totalPages = 1;

// Pagination DOM elements
let prevBtn, nextBtn, pageInfo;

// Initialize pagination system
function initPagination() {
    // Get pagination DOM elements
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    pageInfo = document.getElementById('pageInfo');
    
    if (!prevBtn || !nextBtn || !pageInfo) {
        console.warn('Pagination elements not found');
        return;
    }
    
    // Hide original load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
    
    // Calculate total pages
    calculateTotalPages();
    
    // Render first page
    renderPaginationPage();
    
    // Set up pagination event listeners
    setupPaginationListeners();
}

// Calculate total pages based on filtered artifacts
function calculateTotalPages() {
    totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
    totalPages = Math.max(totalPages, 1); // Ensure at least 1 page
}

// Render current pagination page
function renderPaginationPage() {
    // Clear existing artifacts
    artifactsGrid.innerHTML = '';
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredArtifacts.length);
    
    // Get artifacts for current page
    const pageArtifacts = filteredArtifacts.slice(startIndex, endIndex);
    
    // Render artifacts for current page
    pageArtifacts.forEach((artifact, index) => {
        const card = createArtifactCard(artifact);
        artifactsGrid.appendChild(card);
        
        // Add ad placeholder after every 5 items (maintain existing ad logic)
        if ((index + 1) % CONFIG.adFrequency === 0) {
            const adPlaceholder = createAdPlaceholder();
            artifactsGrid.appendChild(adPlaceholder);
        }
    });
    
    // Update pagination controls
    updatePaginationControls();
}

// Update pagination button states and page info
function updatePaginationControls() {
    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Update icons (re-initialize lucide for dynamically added icons)
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Go to next page
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderPaginationPage();
    }
}

// Go to previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPaginationPage();
    }
}

// Set up pagination event listeners
function setupPaginationListeners() {
    prevBtn.addEventListener('click', previousPage);
    nextBtn.addEventListener('click', nextPage);
}

// Update pagination when filtering artifacts
function updatePaginationForFilter() {
    // Reset to first page
    currentPage = 1;
    
    // Recalculate total pages
    calculateTotalPages();
    
    // Re-render with filtered results
    renderPaginationPage();
}

// Override the original filterArtifacts function to include pagination
const originalFilterArtifacts = filterArtifacts;

filterArtifacts = function(query) {
    originalFilterArtifacts(query);
    
    // Update pagination for filtered results
    if (typeof updatePaginationForFilter === 'function') {
        updatePaginationForFilter();
    }
};

// Override the original renderArtifacts to use pagination instead
const originalRenderArtifacts = renderArtifacts;

renderArtifacts = function() {
    // Use pagination instead of load more
    if (typeof initPagination === 'function') {
        initPagination();
    } else {
        // Fallback to original if pagination not available
        originalRenderArtifacts();
    }
};