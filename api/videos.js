export default function handler(req, res) {
  const videos = require('../assets/videos.json');
  res.status(200).json(videos);
}