// This would be a Node.js script used in the build process
// to minify the video data by shortening keys

const fs = require('fs');
const path = require('path');

// Key mapping for minification
const keyMap = {
    'id': 'id',
    'title': 't',
    'description': 'd',
    'category': 'cat',
    'tags': 'tags',
    'source': 'src',
    'riskLevel': 'rl',
    'dataSource': 'ds',
    'thumbnail': 'thumb'
};

function minifyVideoData(originalData) {
    return originalData.map(video => {
        const minifiedVideo = {};
        for (const [longKey, shortKey] of Object.entries(keyMap)) {
            if (video.hasOwnProperty(longKey)) {
                minifiedVideo[shortKey] = video[longKey];
            }
        }
        return minifiedVideo;
    });
}

// In a real implementation, this would read from and write to files
// For demonstration purposes, we'll just show the concept
console.log('Minify Data Script - This would process videos.json and output minified data');