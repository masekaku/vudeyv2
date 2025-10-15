import { loadVideoData } from './video-data.js';

// Global State Management
const state = {
    videos: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    downloadStats: JSON.parse(localStorage.getItem('downloadStats')) || {},
    watchHistory: JSON.parse(localStorage.getItem('watchHistory')) || [],
    playbackProgress: JSON.parse(localStorage.getItem('playbackProgress')) || {},
    currentVideoId: null,
    currentVideoIndex: null,
    isDarkMode: localStorage.getItem('darkMode') !== 'false',
    isAudioEnabled: localStorage.getItem('audioEnabled') !== 'false',
    dataQuality: localStorage.getItem('dataQuality') || 'low',
    searchQuery: '',
    categoryFilter: '',
    riskFilter: '',
    sourceFilter: '',
    playbackRate: 1
};

// Audio Effects
const audioEffects = {
    click: new Howl({ src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='] }),
    beep: new Howl({ src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='] })
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize icons
    lucide.createIcons();
    
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
    
    // Load video data
    await loadVideoData();
    state.videos = window.videoData || [];
    
    // Apply saved theme
    document.documentElement.classList.toggle('dark', state.isDarkMode);
    updateThemeIcons();
    
    // Apply saved audio setting
    updateAudioIcons();
    
    // Apply saved data quality
    document.getElementById('dataQuality').value = state.dataQuality;
    
    // Render video grid
    renderVideoGrid();
    
    // Populate filter dropdowns
    populateFilters();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./scripts/service-worker.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    }
    
    // Check online status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Show initial notification
    showToast('Warning: Unauthorized Access Detected', 'warning');
});

// Render video grid based on current state
function renderVideoGrid() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    const filteredVideos = filterVideos();
    
    if (filteredVideos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8 sm:py-12">
                <i data-lucide="search-x" class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-500"></i>
                <p class="text-lg sm:text-xl">No classified data matches your search parameters</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    filteredVideos.forEach((video, index) => {
        const isFavorite = state.favorites.includes(video.id);
        const downloadCount = state.downloadStats[video.id] || 0;
        const progress = state.playbackProgress[video.id] || 0;
        
        const videoElement = document.createElement('div');
        videoElement.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 video-grid-item';
        videoElement.setAttribute('data-aos', 'fade-up');
        videoElement.setAttribute('data-aos-delay', (index % 3) * 100);
        
        // Risk level styling
        let riskClass = '';
        if (video.risk === 'Caution') riskClass = 'risk-caution';
        if (video.risk === 'High Alert') riskClass = 'risk-high-alert';
        if (video.risk === 'Critical') riskClass = 'risk-critical';
        
        videoElement.innerHTML = `
            <div class="relative">
                <div class="aspect-video bg-gray-700 flex items-center justify-center relative overflow-hidden ${state.dataQuality === 'low' ? 'data-quality-low' : 'data-quality-raw'}">
                    <i data-lucide="play" class="w-8 h-8 sm:w-12 sm:h-12 text-white opacity-70"></i>
                    <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                        ${video.duration}
                    </div>
                    ${progress > 0 ? `
                        <div class="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                            <div class="h-full bg-green-500" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                </div>
                <div class="absolute top-2 left-2 flex space-x-1">
                    <span class="px-2 py-1 bg-black bg-opacity-70 rounded text-xs">${video.risk}</span>
                    ${isFavorite ? '<span class="px-2 py-1 bg-red-500 bg-opacity-70 rounded text-xs"><i data-lucide="heart" class="w-3 h-3"></i></span>' : ''}
                </div>
            </div>
            <div class="p-3 sm:p-4 ${riskClass}">
                <h3 class="font-bold mb-2 line-clamp-2 text-sm sm:text-base">${highlightSearchTerms(video.title)}</h3>
                <div class="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
                    <span>${video.category}</span>
                    <span>${video.source}</span>
                </div>
                <p class="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-3">${video.description}</p>
                <div class="flex justify-between items-center text-xs">
                    <span>Views: ${video.views.toLocaleString()}</span>
                    <span>Extractions: ${downloadCount}</span>
                </div>
            </div>
        `;
        
        videoElement.addEventListener('click', () => playVideo(video.id));
        grid.appendChild(videoElement);
    });
    
    lucide.createIcons();
}

// Filter videos based on current search and filter state
function filterVideos() {
    return state.videos.filter(video => {
        const matchesSearch = !state.searchQuery || 
            video.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            video.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            video.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
        
        const matchesCategory = !state.categoryFilter || video.category === state.categoryFilter;
        const matchesRisk = !state.riskFilter || video.risk === state.riskFilter;
        const matchesSource = !state.sourceFilter || video.source === state.sourceFilter;
        
        return matchesSearch && matchesCategory && matchesRisk && matchesSource;
    });
}

// Populate filter dropdowns with unique values
function populateFilters() {
    const categories = [...new Set(state.videos.map(video => video.category))];
    const sources = [...new Set(state.videos.map(video => video.source))];
    
    const categoryFilter = document.getElementById('categoryFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    // Clear existing options (except first)
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    while (sourceFilter.children.length > 1) {
        sourceFilter.removeChild(sourceFilter.lastChild);
    }
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    sources.forEach(source => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        sourceFilter.appendChild(option);
    });
}

// Play a specific video
function playVideo(videoId) {
    const video = state.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Play audio effect if enabled
    if (state.isAudioEnabled) audioEffects.click.play();
    
    // Update state
    state.currentVideoId = videoId;
    state.currentVideoIndex = state.videos.findIndex(v => v.id === videoId);
    
    // Add to watch history (limit to 5)
    if (!state.watchHistory.includes(videoId)) {
        state.watchHistory.unshift(videoId);
        if (state.watchHistory.length > 5) state.watchHistory.pop();
        localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
    }
    
    // Show player section
    document.getElementById('playerSection').classList.remove('hidden');
    
    // Update player content
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoCategory').textContent = video.category;
    document.getElementById('videoRisk').textContent = video.risk;
    document.getElementById('videoSource').textContent = video.source;
    document.getElementById('videoDescription').textContent = video.description;
    
    // Update favorite button
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoriteIcon = favoriteBtn.querySelector('i');
    const isFavorite = state.favorites.includes(videoId);
    favoriteIcon.setAttribute('data-lucide', isFavorite ? 'heart' : 'heart');
    if (isFavorite) favoriteBtn.classList.add('text-red-500');
    else favoriteBtn.classList.remove('text-red-500');
    
    // Set up video player
    const videoElement = document.getElementById('player');
    videoElement.innerHTML = `<source src="${video.video}" type="video/mp4">`;
    
    // Initialize Plyr if not already initialized
    if (window.player) {
        window.player.destroy();
    }
    
    window.player = new Plyr(videoElement, {
        controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'settings',
            'pip',
            'fullscreen'
        ],
        settings: ['quality', 'speed'],
        speed: { selected: state.playbackRate, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
    });
    
    // Apply data quality filter
    applyDataQualityFilter();
    
    // Set up player events
    window.player.on('play', () => {
        document.getElementById('corruptionOverlay').classList.add('opacity-0');
    });
    
    window.player.on('pause', () => {
        document.getElementById('corruptionOverlay').classList.remove('opacity-0');
    });
    
    window.player.on('timeupdate', () => {
        if (window.player.currentTime > 0) {
            const progress = (window.player.currentTime / window.player.duration) * 100;
            state.playbackProgress[videoId] = progress;
            localStorage.setItem('playbackProgress', JSON.stringify(state.playbackProgress));
        }
    });
    
    window.player.on('ratechange', () => {
        state.playbackRate = window.player.speed;
        document.getElementById('playbackRateBtn').textContent = `Speed: ${state.playbackRate}x`;
    });
    
    // Scroll to player
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
    
    // Update icons
    lucide.createIcons();
}

// Apply data quality filter to video player
function applyDataQualityFilter() {
    const playerContainer = document.querySelector('.plyr__video-wrapper');
    if (state.dataQuality === 'low') {
        playerContainer.classList.add('data-quality-low');
        playerContainer.classList.remove('data-quality-raw');
    } else {
        playerContainer.classList.remove('data-quality-low');
        playerContainer.classList.add('data-quality-raw');
    }
}

// Highlight search terms in text
function highlightSearchTerms(text) {
    if (!state.searchQuery) return text;
    
    const regex = new RegExp(`(${state.searchQuery})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="flex items-center">
            <i data-lucide="${type === 'warning' ? 'alert-triangle' : 'info'}" class="mr-2 w-4 h-4 sm:w-5 sm:h-5"></i>
            <span class="text-sm sm:text-base">${message}</span>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Update online status indicator
function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offlineBanner');
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
        showToast('Connection lost. Operating in offline mode.', 'warning');
    } else {
        offlineBanner.classList.add('hidden');
    }
}

// Update theme icons based on current mode
function updateThemeIcons() {
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = themeToggle.querySelector('[data-lucide="moon"]');
    const sunIcon = themeToggle.querySelector('[data-lucide="sun"]');
    
    if (state.isDarkMode) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
    
    lucide.createIcons();
}

// Update audio icons based on current setting
function updateAudioIcons() {
    const audioToggle = document.getElementById('audioToggle');
    const volumeIcon = audioToggle.querySelector('[data-lucide="volume2"]');
    const volumeXIcon = audioToggle.querySelector('[data-lucide="volume-x"]');
    
    if (state.isAudioEnabled) {
        volumeIcon.classList.remove('hidden');
        volumeXIcon.classList.add('hidden');
    } else {
        volumeIcon.classList.add('hidden');
        volumeXIcon.classList.remove('hidden');
    }
    
    lucide.createIcons();
}

// Set up all event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        document.documentElement.classList.toggle('dark', state.isDarkMode);
        localStorage.setItem('darkMode', state.isDarkMode);
        updateThemeIcons();
        
        if (state.isAudioEnabled) audioEffects.beep.play();
    });
    
    // Audio toggle
    document.getElementById('audioToggle').addEventListener('click', () => {
        state.isAudioEnabled = !state.isAudioEnabled;
        localStorage.setItem('audioEnabled', state.isAudioEnabled);
        updateAudioIcons();
        
        // Play sound when toggling audio on
        if (state.isAudioEnabled) audioEffects.beep.play();
    });
    
    // Settings modal
    document.getElementById('settingsToggle').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('hidden');
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Data quality setting
    document.getElementById('dataQuality').addEventListener('change', (e) => {
        state.dataQuality = e.target.value;
        localStorage.setItem('dataQuality', state.dataQuality);
        applyDataQualityFilter();
        renderVideoGrid();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderVideoGrid();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        state.categoryFilter = e.target.value;
        renderVideoGrid();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    document.getElementById('riskFilter').addEventListener('change', (e) => {
        state.riskFilter = e.target.value;
        renderVideoGrid();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    document.getElementById('sourceFilter').addEventListener('change', (e) => {
        state.sourceFilter = e.target.value;
        renderVideoGrid();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', () => {
        if (!state.currentVideoId) return;
        
        const index = state.favorites.indexOf(state.currentVideoId);
        if (index === -1) {
            state.favorites.push(state.currentVideoId);
            showToast('Added to sensitive materials', 'info');
        } else {
            state.favorites.splice(index, 1);
            showToast('Removed from sensitive materials', 'info');
        }
        
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        
        // Update button and icon
        const favoriteBtn = document.getElementById('favoriteBtn');
        const favoriteIcon = favoriteBtn.querySelector('i');
        
        if (index === -1) {
            favoriteBtn.classList.add('text-red-500');
            favoriteIcon.setAttribute('data-lucide', 'heart');
        } else {
            favoriteBtn.classList.remove('text-red-500');
            favoriteIcon.setAttribute('data-lucide', 'heart');
        }
        
        lucide.createIcons();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (!state.currentVideoId) return;
        
        // Update download stats
        state.downloadStats[state.currentVideoId] = (state.downloadStats[state.currentVideoId] || 0) + 1;
        localStorage.setItem('downloadStats', JSON.stringify(state.downloadStats));
        
        showToast('Extraction logged. Data secured.', 'info');
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Navigation buttons
    document.getElementById('prevVideo').addEventListener('click', () => {
        if (state.currentVideoIndex === null || state.currentVideoIndex <= 0) return;
        
        const prevVideo = state.videos[state.currentVideoIndex - 1];
        playVideo(prevVideo.id);
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    document.getElementById('nextVideo').addEventListener('click', () => {
        if (state.currentVideoIndex === null || state.currentVideoIndex >= state.videos.length - 1) return;
        
        const nextVideo = state.videos[state.currentVideoIndex + 1];
        playVideo(nextVideo.id);
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Playback rate button
    document.getElementById('playbackRateBtn').addEventListener('click', () => {
        if (!window.player) return;
        
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(state.playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        
        state.playbackRate = rates[nextIndex];
        window.player.speed = state.playbackRate;
        document.getElementById('playbackRateBtn').textContent = `Speed: ${state.playbackRate}x`;
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Clear history button
    document.getElementById('clearHistory').addEventListener('click', () => {
        state.watchHistory = [];
        state.playbackProgress = {};
        localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
        localStorage.setItem('playbackProgress', JSON.stringify(state.playbackProgress));
        
        showToast('Watch history cleared', 'info');
        renderVideoGrid();
        
        if (state.isAudioEnabled) audioEffects.click.play();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Space bar to play/pause when player is focused
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            if (window.player) {
                if (window.player.playing) {
                    window.player.pause();
                } else {
                    window.player.play();
                }
            }
        }
        
        // Arrow keys for navigation
        if (e.code === 'ArrowLeft' && state.currentVideoIndex !== null && state.currentVideoIndex > 0) {
            e.preventDefault();
            const prevVideo = state.videos[state.currentVideoIndex - 1];
            playVideo(prevVideo.id);
        }
        
        if (e.code === 'ArrowRight' && state.currentVideoIndex !== null && state.currentVideoIndex < state.videos.length - 1) {
            e.preventDefault();
            const nextVideo = state.videos[state.currentVideoIndex + 1];
            playVideo(nextVideo.id);
        }
    });
}

// Make functions available globally for service worker
window.renderVideoGrid = renderVideoGrid;
window.populateFilters = populateFilters;