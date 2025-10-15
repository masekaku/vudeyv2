// Minified video data (simulating the output of minify-data.js)
const minifiedVideos = [
    {
        id: 1, 
        t: "ANOMALOUS ENTITY SIGHTING", 
        d: "Footage recovered from a remote research facility showing an unidentified entity with unusual physical properties.", 
        cat: "anomalous", 
        tags: ["entity", "research", "containment"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
        rl: "high", 
        ds: "FACILITY 7",
        thumb: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=225&fit=crop"
    },
    {
        id: 2, 
        t: "UFO OVER METROPOLIS", 
        d: "Aerial footage of an unidentified flying object performing maneuvers that defy known physics.", 
        cat: "extraterrestrial", 
        tags: ["ufo", "aerial", "metropolis"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
        rl: "medium", 
        ds: "AIR TRAFFIC CONTROL",
        thumb: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=225&fit=crop"
    },
    {
        id: 3, 
        t: "PARANORMAL ACTIVITY DOCUMENTED", 
        d: "Security camera footage from an abandoned asylum showing unexplained phenomena.", 
        cat: "paranormal", 
        tags: ["ghost", "asylum", "security"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 
        rl: "medium", 
        ds: "PARANORMAL RESEARCH SOCIETY",
        thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop"
    },
    {
        id: 4, 
        t: "CRYPTID SIGHTING IN APPALACHIA", 
        d: "Trail camera footage of a large, unidentified creature moving through dense forest.", 
        cat: "cryptid", 
        tags: ["cryptid", "forest", "trailcam"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 
        rl: "low", 
        ds: "DEPARTMENT OF WILDLIFE",
        thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=225&fit=crop"
    },
    {
        id: 5, 
        t: "CLASSIFIED GOVERNMENT EXPERIMENT", 
        d: "Leaked footage of a controversial government experiment with unexpected results.", 
        cat: "government", 
        tags: ["experiment", "leaked", "controversial"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 
        rl: "high", 
        ds: "WHISTLEBLOWER",
        thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop"
    },
    {
        id: 6, 
        t: "ANCIENT ARTIFACT DISCOVERY", 
        d: "Archaeological dig uncovers an artifact with properties that challenge modern physics.", 
        cat: "anomalous", 
        tags: ["artifact", "archaeology", "ancient"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 
        rl: "medium", 
        ds: "INTERNATIONAL ARCHAEOLOGY TEAM",
        thumb: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=225&fit=crop"
    },
    {
        id: 7, 
        t: "ALIEN COMMUNICATION ATTEMPT", 
        d: "Recorded signals and corresponding visual phenomena suggesting attempted communication.", 
        cat: "extraterrestrial", 
        tags: ["communication", "signal", "contact"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", 
        rl: "high", 
        ds: "SETI PROGRAM",
        thumb: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=225&fit=crop"
    },
    {
        id: 8, 
        t: "HAUNTED LOCATION INVESTIGATION", 
        d: "Documentary team captures compelling evidence of paranormal activity.", 
        cat: "paranormal", 
        tags: ["haunting", "investigation", "documentary"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", 
        rl: "low", 
        ds: "INDEPENDENT RESEARCHERS",
        thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop"
    },
    {
        id: 9, 
        t: "LAKE MONSTER FOOTAGE", 
        d: "Amateur footage of a large creature moving through a lake, consistent with local legends.", 
        cat: "cryptid", 
        tags: ["lakemonster", "amateur", "legend"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", 
        rl: "low", 
        ds: "CIVILIAN",
        thumb: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=225&fit=crop"
    },
    {
        id: 10, 
        t: "BLACK PROJECT TEST FLIGHT", 
        d: "Covert recording of an advanced aircraft with capabilities beyond public technology.", 
        cat: "government", 
        tags: ["aircraft", "blackproject", "test"], 
        src: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 
        rl: "high", 
        ds: "INSIDER",
        thumb: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=225&fit=crop"
    }
];

// Reverse mapping to convert minified keys back to full keys
const keyMap = {
    'id': 'id',
    't': 'title',
    'd': 'description',
    'cat': 'category',
    'tags': 'tags',
    'src': 'source',
    'rl': 'riskLevel',
    'ds': 'dataSource',
    'thumb': 'thumbnail'
};

// Function to convert minified data to full format
function convertToFullFormat(minifiedData) {
    return minifiedData.map(video => {
        const fullVideo = {};
        for (const [shortKey, longKey] of Object.entries(keyMap)) {
            if (video.hasOwnProperty(shortKey)) {
                fullVideo[longKey] = video[shortKey];
            }
        }
        return fullVideo;
    });
}

// Export the video data
const videoData = convertToFullFormat(minifiedVideos);