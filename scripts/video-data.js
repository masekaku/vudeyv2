// Video data loader
export async function loadVideoData() {
    try {
        const response = await fetch('./data/videos.json');
        if (!response.ok) {
            throw new Error('Failed to load video data');
        }
        const data = await response.json();
        window.videoData = data.videos;
        console.log(`Loaded ${window.videoData.length} videos`);
    } catch (error) {
        console.error('Error loading video data:', error);
        // Fallback to minimal data
        window.videoData = [
            {
                id: "fallback",
                title: "SYSTEM ALERT: Data Connection Failed",
                category: "System",
                tags: ["system", "error", "fallback"],
                description: "Unable to load classified data archive. System operating in limited capacity.",
                source: "Internal System",
                risk: "Caution",
                duration: "00:00:30",
                thumbnail: "",
                video: "",
                date: new Date().toISOString().split('T')[0],
                views: 1
            }
        ];
    }
}

// Function to manually update video data (for debugging)
export function setVideoData(videos) {
    window.videoData = videos;
    if (window.renderVideoGrid) {
        window.renderVideoGrid();
    }
    if (window.populateFilters) {
        window.populateFilters();
    }
}