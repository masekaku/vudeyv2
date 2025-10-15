// Initialize Lucide icons
lucide.createIcons();

// Initialize AOS
AOS.init({
    duration: 800,
    once: true,
    offset: 50
});

// Global state object
const state = {
    artifacts: [],
    filteredArtifacts: [],
    displayedCount: 0,
    itemsPerPage: 5,
    favorites: new Set(),
    extractionLogs: {},
    history: [],
    darkMode: true,
    showFavorites: false,
    searchTerm: '',
    categoryFilter: '',
    riskFilter: ''
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/assets/js/sw.js').then(() => {
            console.log('Service Worker registered');
        }).catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    });
}

// Online/Offline detection
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    const statusElement = document.getElementById('connection-status');
    const offlineOverlay = document.getElementById('offline-overlay');
    
    if (navigator.onLine) {
        statusElement.textContent = 'Online';
        statusElement.className = 'text-green-400';
        offlineOverlay.classList.add('hidden');
        showToast('Connection restored', 'success');
    } else {
        statusElement.textContent = 'Offline';
        statusElement.className = 'text-red-400';
        offlineOverlay.classList.remove('hidden');
        showToast('Connection lost - Offline mode active', 'warning');
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load state from localStorage
    loadState();
    
    // Process artifact data (deobfuscate)
    processArtifactData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial UI
    renderCategories();
    renderArtifacts();
    
    // Hide loading overlay
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 1000);
    
    // Check online status
    updateOnlineStatus();
});

// Load state from localStorage
function loadState() {
    try {
        const savedState = localStorage.getItem('artifactArchiveState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            state.favorites = new Set(parsed.favorites || []);
            state.extractionLogs = parsed.extractionLogs || {};
            state.history = parsed.history || [];
            state.darkMode = parsed.darkMode !== undefined ? parsed.darkMode : true;
            state.showFavorites = parsed.showFavorites || false;
            
            // Apply dark mode
            if (state.darkMode) {
                document.body.classList.add('dark-mode');
                document.getElementById('theme-toggle').innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
            } else {
                document.body.classList.remove('dark-mode');
                document.getElementById('theme-toggle').innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
            }
            
            // Update favorites button
            updateFavoritesButton();
        }
    } catch (e) {
        console.error('Error loading state:', e);
    }
}

// Save state to localStorage
function saveState() {
    try {
        const stateToSave = {
            favorites: Array.from(state.favorites),
            extractionLogs: state.extractionLogs,
            history: state.history,
            darkMode: state.darkMode,
            showFavorites: state.showFavorites
        };
        localStorage.setItem('artifactArchiveState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// Process artifact data (deobfuscate field names)
function processArtifactData() {
    state.artifacts = artifactData.map(item => ({
        id: item.i,
        title: item.t,
        category: item.c,
        tags: item.g,
        description: item.d,
        thumbnail: item.m,
        data_source: item.s,
        risk_level: item.r,
        external_link: item.l
    }));
    
    // Initialize extraction logs for new artifacts
    state.artifacts.forEach(artifact => {
        if (!state.extractionLogs[artifact.id]) {
            state.extractionLogs[artifact.id] = 0;
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('search-input').addEventListener('input', function(e) {
        state.searchTerm = e.target.value.toLowerCase();
        filterArtifacts();
    });
    
    // Category filter
    document.getElementById('category-filter').addEventListener('change', function(e) {
        state.categoryFilter = e.target.value;
        filterArtifacts();
    });
    
    // Risk filter
    document.getElementById('risk-filter').addEventListener('change', function(e) {
        state.riskFilter = e.target.value;
        filterArtifacts();
    });
    
    // Load more button
    document.getElementById('load-more').addEventListener('click', function() {
        loadMoreArtifacts();
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', function() {
        toggleDarkMode();
    });
    
    // Favorites toggle
    document.getElementById('favorites-toggle').addEventListener('click', function() {
        toggleFavoritesView();
    });
}

// Render categories for filter dropdown
function renderCategories() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = [...new Set(state.artifacts.map(artifact => artifact.category))];
    
    // Clear existing options (except the first "All Categories")
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Filter artifacts based on current filters
function filterArtifacts() {
    let filtered = state.artifacts;
    
    // Apply favorites filter if active
    if (state.showFavorites) {
        filtered = filtered.filter(artifact => state.favorites.has(artifact.id));
    }
    
    // Apply search filter
    if (state.searchTerm) {
        filtered = filtered.filter(artifact => 
            artifact.title.toLowerCase().includes(state.searchTerm) ||
            artifact.description.toLowerCase().includes(state.searchTerm) ||
            artifact.tags.some(tag => tag.toLowerCase().includes(state.searchTerm))
        );
    }
    
    // Apply category filter
    if (state.categoryFilter) {
        filtered = filtered.filter(artifact => artifact.category === state.categoryFilter);
    }
    
    // Apply risk filter
    if (state.riskFilter) {
        filtered = filtered.filter(artifact => artifact.risk_level === state.riskFilter);
    }
    
    state.filteredArtifacts = filtered;
    state.displayedCount = 0;
    
    // Update active filters display
    updateActiveFilters();
    
    // Re-render artifacts
    renderArtifacts();
    
    // Show message if no results
    if (filtered.length === 0) {
        document.getElementById('artifacts-container').innerHTML = `
            <div class="col-span-full text-center py-12 border border-dashed border-green-800 rounded-lg">
                <i data-lucide="search-x" class="w-16 h-16 mx-auto mb-4 text-green-600"></i>
                <h3 class="text-xl font-bold mb-2">No Artifacts Found</h3>
                <p class="text-green-600">Try adjusting your search or filters</p>
            </div>
        `;
        document.getElementById('load-more-container').classList.add('hidden');
    } else {
        document.getElementById('load-more-container').classList.remove('hidden');
    }
}

// Update active filters display
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    activeFiltersContainer.innerHTML = '';
    
    // Add search term filter tag
    if (state.searchTerm) {
        const searchTag = document.createElement('div');
        searchTag.className = 'filter-tag';
        searchTag.innerHTML = `
            Search: "${state.searchTerm}"
            <button class="ml-2 text-green-400 hover:text-green-200" data-type="search">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        activeFiltersContainer.appendChild(searchTag);
        
        // Add event listener to remove this filter
        searchTag.querySelector('button').addEventListener('click', function() {
            document.getElementById('search-input').value = '';
            state.searchTerm = '';
            filterArtifacts();
        });
    }
    
    // Add category filter tag
    if (state.categoryFilter) {
        const categoryTag = document.createElement('div');
        categoryTag.className = 'filter-tag';
        categoryTag.innerHTML = `
            Category: ${state.categoryFilter}
            <button class="ml-2 text-green-400 hover:text-green-200" data-type="category">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        activeFiltersContainer.appendChild(categoryTag);
        
        // Add event listener to remove this filter
        categoryTag.querySelector('button').addEventListener('click', function() {
            document.getElementById('category-filter').value = '';
            state.categoryFilter = '';
            filterArtifacts();
        });
    }
    
    // Add risk filter tag
    if (state.riskFilter) {
        const riskTag = document.createElement('div');
        riskTag.className = 'filter-tag';
        riskTag.innerHTML = `
            Risk: ${state.riskFilter.charAt(0).toUpperCase() + state.riskFilter.slice(1)}
            <button class="ml-2 text-green-400 hover:text-green-200" data-type="risk">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        activeFiltersContainer.appendChild(riskTag);
        
        // Add event listener to remove this filter
        riskTag.querySelector('button').addEventListener('click', function() {
            document.getElementById('risk-filter').value = '';
            state.riskFilter = '';
            filterArtifacts();
        });
    }
    
    // Add favorites filter tag
    if (state.showFavorites) {
        const favoritesTag = document.createElement('div');
        favoritesTag.className = 'filter-tag';
        favoritesTag.innerHTML = `
            Favorites Only
            <button class="ml-2 text-green-400 hover:text-green-200" data-type="favorites">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        activeFiltersContainer.appendChild(favoritesTag);
        
        // Add event listener to remove this filter
        favoritesTag.querySelector('button').addEventListener('click', function() {
            toggleFavoritesView();
        });
    }
    
    // Show clear all button if there are active filters
    if (activeFiltersContainer.children.length > 0) {
        const clearAllButton = document.createElement('button');
        clearAllButton.className = 'text-green-400 hover:text-green-200 text-sm underline';
        clearAllButton.textContent = 'Clear All';
        clearAllButton.addEventListener('click', clearAllFilters);
        activeFiltersContainer.appendChild(clearAllButton);
    }
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('risk-filter').value = '';
    
    state.searchTerm = '';
    state.categoryFilter = '';
    state.riskFilter = '';
    state.showFavorites = false;
    
    updateFavoritesButton();
    filterArtifacts();
}

// Render artifacts to the grid
function renderArtifacts() {
    const container = document.getElementById('artifacts-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Determine how many artifacts to show
    const artifactsToShow = state.filteredArtifacts.slice(0, state.displayedCount + state.itemsPerPage);
    
    // Render each artifact
    artifactsToShow.forEach((artifact, index) => {
        const artifactElement = createArtifactCard(artifact, index);
        container.appendChild(artifactElement);
    });
    
    // Update displayed count
    state.displayedCount = artifactsToShow.length;
    
    // Show/hide load more button
    if (state.displayedCount >= state.filteredArtifacts.length) {
        document.getElementById('load-more-container').classList.add('hidden');
    } else {
        document.getElementById('load-more-container').classList.remove('hidden');
    }
    
    // Show ad slot after first 5 items
    if (state.displayedCount >= 5 && !document.querySelector('#ad-slot:not(.hidden)')) {
        document.getElementById('ad-slot').classList.remove('hidden');
    }
    
    // Re-initialize AOS for new elements
    AOS.refresh();
    
    // Re-initialize Lucide icons for new elements
    lucide.createIcons();
}

// Create an artifact card element
function createArtifactCard(artifact, index) {
    const card = document.createElement('div');
    card.className = 'artifact-card bg-gray-900 border border-green-800 rounded-lg overflow-hidden';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index % 5) * 100);
    
    const extractionCount = state.extractionLogs[artifact.id] || 0;
    const isFavorite = state.favorites.has(artifact.id);
    
    card.innerHTML = `
        <div class="relative">
            <img src="${artifact.thumbnail}" alt="${artifact.title}" 
                 class="w-full h-48 object-cover">
            <div class="absolute top-2 right-2 flex space-x-2">
                <button class="favorite-btn p-1.5 bg-black bg-opacity-70 rounded-full ${isFavorite ? 'text-red-500' : 'text-white'}" 
                        data-id="${artifact.id}">
                    <i data-lucide="${isFavorite ? 'heart' : 'heart'}" class="w-4 h-4 ${isFavorite ? 'fill-current' : ''}"></i>
                </button>
                <span class="risk-badge risk-${artifact.risk_level}">
                    ${artifact.risk_level.toUpperCase()}
                </span>
            </div>
            <div class="absolute bottom-2 left-2">
                <span class="bg-black bg-opacity-70 text-xs px-2 py-1 rounded">
                    ${artifact.data_source}
                </span>
            </div>
        </div>
        <div class="p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg">${artifact.title}</h3>
                <span class="text-xs text-green-600 bg-green-900 bg-opacity-30 px-2 py-1 rounded">
                    ${artifact.category}
                </span>
            </div>
            <p class="text-sm text-green-300 mb-3 line-clamp-2">${artifact.description}</p>
            <div class="flex flex-wrap gap-1 mb-3">
                ${artifact.tags.map(tag => `
                    <span class="text-xs bg-green-900 bg-opacity-20 text-green-400 px-2 py-1 rounded">${tag}</span>
                `).join('')}
            </div>
            <div class="flex justify-between items-center text-xs text-green-600">
                <span>Extractions: ${extractionCount}</span>
                <button class="extract-btn bg-green-800 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors flex items-center"
                        data-id="${artifact.id}">
                    <i data-lucide="external-link" class="w-3 h-3 mr-1"></i>
                    Extract Data
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.favorite-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFavorite(artifact.id);
    });
    
    card.querySelector('.extract-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        extractArtifact(artifact);
    });
    
    return card;
}

// Load more artifacts
function loadMoreArtifacts() {
    renderArtifacts();
}

// Toggle dark mode
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
    }
    
    saveState();
    lucide.createIcons();
}

// Toggle favorites view
function toggleFavoritesView() {
    state.showFavorites = !state.showFavorites;
    updateFavoritesButton();
    filterArtifacts();
}

// Update favorites button appearance
function updateFavoritesButton() {
    const favoritesButton = document.getElementById('favorites-toggle');
    if (state.showFavorites) {
        favoritesButton.classList.add('bg-red-900', 'border-red-700');
        favoritesButton.innerHTML = '<i data-lucide="heart" class="w-5 h-5 fill-current"></i>';
    } else {
        favoritesButton.classList.remove('bg-red-900', 'border-red-700');
        favoritesButton.innerHTML = '<i data-lucide="heart" class="w-5 h-5"></i>';
    }
    lucide.createIcons();
}

// Toggle favorite status for an artifact
function toggleFavorite(artifactId) {
    if (state.favorites.has(artifactId)) {
        state.favorites.delete(artifactId);
        showToast('Removed from favorites', 'info');
    } else {
        state.favorites.add(artifactId);
        showToast('Added to favorites', 'success');
    }
    
    // Update UI
    const favoriteButton = document.querySelector(`.favorite-btn[data-id="${artifactId}"]`);
    if (favoriteButton) {
        const isFavorite = state.favorites.has(artifactId);
        favoriteButton.className = `favorite-btn p-1.5 bg-black bg-opacity-70 rounded-full ${isFavorite ? 'text-red-500' : 'text-white'}`;
        favoriteButton.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${isFavorite ? 'fill-current' : ''}"></i>`;
        lucide.createIcons();
    }
    
    saveState();
    
    // If we're in favorites view, update the list
    if (state.showFavorites) {
        filterArtifacts();
    }
}

// Extract artifact (open external link)
function extractArtifact(artifact) {
    // Increment extraction count
    state.extractionLogs[artifact.id] = (state.extractionLogs[artifact.id] || 0) + 1;
    
    // Add to history (limit to 5 items)
    state.history.unshift(artifact.id);
    if (state.history.length > 5) {
        state.history.pop();
    }
    
    // Save state
    saveState();
    
    // Show toast
    showToast('External Link Initiated', 'info');
    
    // Update extraction count in UI
    const extractionElement = document.querySelector(`.extract-btn[data-id="${artifact.id}"]`).parentElement.querySelector('span');
    if (extractionElement) {
        extractionElement.textContent = `Extractions: ${state.extractionLogs[artifact.id]}`;
    }
    
    // Open external link
    setTimeout(() => {
        window.open(artifact.external_link, '_blank', 'noopener,noreferrer');
    }, 1000);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgColor = 'bg-green-900';
    let icon = 'info';
    
    if (type === 'success') {
        bgColor = 'bg-green-800';
        icon = 'check-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-800';
        icon = 'alert-triangle';
    } else if (type === 'error') {
        bgColor = 'bg-red-800';
        icon = 'x-circle';
    }
    
    toast.className = `toast ${bgColor} border border-green-700 text-white p-3 rounded-lg shadow-lg flex items-center`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 mr-2"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Remove toast after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}