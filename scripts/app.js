// Initialize Lucide icons
lucide.createIcons();

// Global State Management
const state = {
    // UI Settings
    darkMode: true,
    audioEnabled: true,
    videoQuality: 'low', // 'low' or 'raw'
    
    // Data Persistence
    favorites: [],
    downloadStats: {},
    watchHistory: [],
    playbackProgress: {},
    
    // App State
    currentVideoIndex: -1,
    displayedVideos: 0,
    allVideos: [],
    filteredVideos: [],
    
    // Audio
    clickSound: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load state from localStorage
    loadStateFromStorage();
    
    // Initialize audio
    initializeAudio();
    
    // Load video data
    loadVideoData();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize Plyr player
    initializePlayer();
    
    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true
        });
    }
    
    // Register service worker
    registerServiceWorker();
    
    // Check online status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

function loadStateFromStorage() {
    // Load UI settings
    state.darkMode = localStorage.getItem('darkMode') !== 'false';
    state.audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
    state.videoQuality = localStorage.getItem('videoQuality') || 'low';
    
    // Load data persistence
    state.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    state.downloadStats = JSON.parse(localStorage.getItem('downloadStats') || '{}');
    state.watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
    state.playbackProgress = JSON.parse(localStorage.getItem('playbackProgress') || '{}');
    
    // Update UI based on loaded state
    updateUIFromState();
}

function saveStateToStorage() {
    // Save UI settings
    localStorage.setItem('darkMode', state.darkMode);
    localStorage.setItem('audioEnabled', state.audioEnabled);
    localStorage.setItem('videoQuality', state.videoQuality);
    
    // Save data persistence
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    localStorage.setItem('downloadStats', JSON.stringify(state.downloadStats));
    localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
    localStorage.setItem('playbackProgress', JSON.stringify(state.playbackProgress));
}

function updateUIFromState() {
    // Update theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
        themeToggle.querySelector('span').textContent = 'Dark Mode';
    } else {
        document.documentElement.classList.remove('dark');
        themeToggle.querySelector('span').textContent = 'Light Mode';
    }
    
    // Update audio toggle
    const audioToggle = document.getElementById('audioToggle');
    if (state.audioEnabled) {
        audioToggle.querySelector('span').textContent = 'Audio: ON';
    } else {
        audioToggle.querySelector('span').textContent = 'Audio: OFF';
    }
    
    // Update quality toggle
    const qualityToggle = document.getElementById('qualityToggle');
    qualityToggle.querySelector('span').textContent = `Quality: ${state.videoQuality === 'low' ? 'Low Res' : 'Raw Feed'}`;
    
    // Apply quality filter to player if it exists
    const player = document.getElementById('player');
    if (player) {
        applyQualityFilter(player);
    }
}

function initializeAudio() {
    // Create click sound (using a simple beep as we don't have actual audio files)
    state.clickSound = new Howl({
        src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='],
        volume: 0.3,
        onplayerror: function() {
            // Fallback to HTML5 Audio API if Howler fails
            state.clickSound = {
                play: function() {
                    if (state.audioEnabled) {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.1);
                    }
                }
            };
        }
    });
}

function playClickSound() {
    if (state.audioEnabled && state.clickSound) {
        state.clickSound.play();
    }
}

function loadVideoData() {
    state.allVideos = videoData;
    state.filteredVideos = [...state.allVideos];
    renderVideoGrid();
}

function renderVideoGrid() {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '';
    
    const videosToShow = state.filteredVideos.slice(0, state.displayedVideos + 5);
    
    videosToShow.forEach((video, index) => {
        if (index < state.displayedVideos) return; // Skip already displayed videos
        
        const videoElement = document.createElement('div');
        videoElement.className = `video-item bg-gray-800 rounded overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-300 ${getRiskClass(video.riskLevel)}`;
        videoElement.setAttribute('data-aos', 'fade-up');
        videoElement.setAttribute('data-video-id', video.id);
        
        videoElement.innerHTML = `
            <div class="relative pb-[56.25%]"> <!-- 16:9 aspect ratio -->
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail absolute inset-0 w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <i data-lucide="play" class="w-12 h-12 text-white"></i>
                </div>
                <div class="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                    ${video.riskLevel.toUpperCase()} RISK
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold mb-2 truncate">${video.title}</h3>
                <p class="text-xs text-gray-400 mb-2 line-clamp-2">${video.description}</p>
                <div class="flex justify-between items-center text-xs">
                    <span class="bg-gray-700 px-2 py-1 rounded">${video.category.toUpperCase()}</span>
                    <span>${state.downloadStats[video.id] || 0} EXTRACTIONS</span>
                </div>
            </div>
        `;
        
        videoElement.addEventListener('click', () => {
            playClickSound();
            playVideo(index);
        });
        
        videoGrid.appendChild(videoElement);
    });
    
    state.displayedVideos = videosToShow.length;
    
    // Update Load More button visibility
    const loadMoreBtn = document.getElementById('loadMore');
    if (state.displayedVideos >= state.filteredVideos.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
    
    // Initialize icons for new elements
    lucide.createIcons();
    
    // Show toast notification for first load
    if (state.displayedVideos === 5) {
        showToast("New Classified Data Acquired");
    }
}

function getRiskClass(riskLevel) {
    switch(riskLevel) {
        case 'high': return 'risk-high';
        case 'medium': return 'risk-medium';
        case 'low': return 'risk-low';
        default: return '';
    }
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        playClickSound();
        state.darkMode = !state.darkMode;
        saveStateToStorage();
        updateUIFromState();
    });
    
    // Audio toggle
    document.getElementById('audioToggle').addEventListener('click', () => {
        playClickSound();
        state.audioEnabled = !state.audioEnabled;
        saveStateToStorage();
        updateUIFromState();
    });
    
    // Quality toggle
    document.getElementById('qualityToggle').addEventListener('click', () => {
        playClickSound();
        state.videoQuality = state.videoQuality === 'low' ? 'raw' : 'low';
        saveStateToStorage();
        updateUIFromState();
        
        // Apply quality filter to current video if playing
        const player = document.getElementById('player');
        if (player) {
            applyQualityFilter(player);
        }
        
        showToast(`Video Quality: ${state.videoQuality === 'low' ? 'Low Res (Stable)' : 'Raw Feed (Unstable)'}`);
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterVideos();
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        filterVideos();
    });
    
    // Risk filter
    document.getElementById('riskFilter').addEventListener('change', (e) => {
        filterVideos();
    });
    
    // Load more button
    document.getElementById('loadMore').addEventListener('click', () => {
        playClickSound();
        renderVideoGrid();
        
        // Show ad after every 5 videos
        if (state.displayedVideos % 5 === 0) {
            showAdSlot();
        }
    });
    
    // Previous video button
    document.getElementById('prevVideo').addEventListener('click', () => {
        playClickSound();
        if (state.currentVideoIndex > 0) {
            playVideo(state.currentVideoIndex - 1);
        }
    });
    
    // Next video button
    document.getElementById('nextVideo').addEventListener('click', () => {
        playClickSound();
        if (state.currentVideoIndex < state.filteredVideos.length - 1) {
            playVideo(state.currentVideoIndex + 1);
        }
    });
    
    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', () => {
        playClickSound();
        toggleFavorite();
    });
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', () => {
        playClickSound();
        downloadVideo();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Space bar to play/pause
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            const player = document.getElementById('player');
            if (player) {
                if (player.paused) {
                    player.play();
                } else {
                    player.pause();
                }
            }
        }
        
        // Arrow keys for navigation
        if (e.code === 'ArrowLeft' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('prevVideo').click();
        }
        
        if (e.code === 'ArrowRight' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('nextVideo').click();
        }
    });
}

function filterVideos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const riskFilter = document.getElementById('riskFilter').value;
    
    state.filteredVideos = state.allVideos.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchTerm) || 
                             video.description.toLowerCase().includes(searchTerm) ||
                             video.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || video.category === categoryFilter;
        const matchesRisk = !riskFilter || video.riskLevel === riskFilter;
        
        return matchesSearch && matchesCategory && matchesRisk;
    });
    
    state.displayedVideos = 0;
    renderVideoGrid();
}

function initializePlayer() {
    // This would initialize the Plyr player in a real implementation
    // For this example, we'll use the native HTML5 video player
}

function playVideo(index) {
    const video = state.filteredVideos[index];
    state.currentVideoIndex = index;
    
    // Show player section
    document.getElementById('playerSection').style.display = 'block';
    
    // Update video details
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent = video.description;
    document.getElementById('videoCategory').textContent = video.category.toUpperCase();
    document.getElementById('videoRisk').textContent = video.riskLevel.toUpperCase() + ' RISK';
    document.getElementById('videoSource').textContent = video.dataSource;
    
    // Update favorite button
    const favoriteBtn = document.getElementById('favoriteBtn');
    const isFavorite = state.favorites.includes(video.id);
    favoriteBtn.innerHTML = isFavorite ? 
        '<i data-lucide="heart" class="w-4 h-4 mr-2 fill-red-500"></i> <span>REMOVE FROM FAVORITES</span>' :
        '<i data-lucide="heart" class="w-4 h-4 mr-2"></i> <span>ADD TO FAVORITES</span>';
    
    // Set up video element
    const player = document.getElementById('player');
    player.src = video.source;
    player.poster = video.thumbnail;
    
    // Apply quality filter
    applyQualityFilter(player);
    
    // Set playback progress if available
    if (state.playbackProgress[video.id]) {
        player.currentTime = state.playbackProgress[video.id];
    }
    
    // Add to watch history
    addToWatchHistory(video.id);
    
    // Initialize icons
    lucide.createIcons();
    
    // Scroll to player
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
    
    // Show warning for high risk content
    if (video.riskLevel === 'high') {
        showToast("Warning: Unauthorized Access Detected");
    }
}

function applyQualityFilter(player) {
    player.classList.remove('quality-low', 'quality-raw');
    
    if (state.videoQuality === 'low') {
        player.classList.add('quality-low');
    } else {
        player.classList.add('quality-raw');
    }
}

function toggleFavorite() {
    const currentVideoId = state.filteredVideos[state.currentVideoIndex].id;
    const index = state.favorites.indexOf(currentVideoId);
    
    if (index === -1) {
        state.favorites.push(currentVideoId);
        showToast("Added to Sensitive Materials");
    } else {
        state.favorites.splice(index, 1);
        showToast("Removed from Sensitive Materials");
    }
    
    saveStateToStorage();
    
    // Update button
    const favoriteBtn = document.getElementById('favoriteBtn');
    const isFavorite = state.favorites.includes(currentVideoId);
    favoriteBtn.innerHTML = isFavorite ? 
        '<i data-lucide="heart" class="w-4 h-4 mr-2 fill-red-500"></i> <span>REMOVE FROM FAVORITES</span>' :
        '<i data-lucide="heart" class="w-4 h-4 mr-2"></i> <span>ADD TO FAVORITES</span>';
    
    lucide.createIcons();
}

function downloadVideo() {
    const currentVideoId = state.filteredVideos[state.currentVideoIndex].id;
    
    // Update download stats
    state.downloadStats[currentVideoId] = (state.downloadStats[currentVideoId] || 0) + 1;
    saveStateToStorage();
    
    showToast(`Data Extraction Logged: ${state.downloadStats[currentVideoId]} total extractions`);
    
    // In a real implementation, this would trigger an actual download
    // For this example, we'll just show a notification
}

function addToWatchHistory(videoId) {
    // Remove if already in history
    const index = state.watchHistory.indexOf(videoId);
    if (index !== -1) {
        state.watchHistory.splice(index, 1);
    }
    
    // Add to beginning
    state.watchHistory.unshift(videoId);
    
    // Keep only last 5
    if (state.watchHistory.length > 5) {
        state.watchHistory.pop();
    }
    
    saveStateToStorage();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showAdSlot() {
    // In a real implementation, this would load an actual ad
    // For this example, we'll just log to console
    console.log('Ad slot would be displayed here');
}

function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offlineBanner');
    if (!navigator.onLine) {
        offlineBanner.style.display = 'block';
        showToast("Offline Mode: Restricted Access");
    } else {
        offlineBanner.style.display = 'none';
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
}

// Save playback progress when video is paused or page is unloaded
window.addEventListener('beforeunload', () => {
    const player = document.getElementById('player');
    if (player && state.currentVideoIndex !== -1) {
        const currentVideoId = state.filteredVideos[state.currentVideoIndex].id;
        state.playbackProgress[currentVideoId] = player.currentTime;
        saveStateToStorage();
    }
});

document.getElementById('player')?.addEventListener('pause', () => {
    if (state.currentVideoIndex !== -1) {
        const player = document.getElementById('player');
        const currentVideoId = state.filteredVideos[state.currentVideoIndex].id;
        state.playbackProgress[currentVideoId] = player.currentTime;
        saveStateToStorage();
    }
});