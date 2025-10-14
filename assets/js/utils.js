export async function getVideosData() {
  const cacheKey = 'videos_cache';
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    return JSON.parse(cache);
  }
  const res = await fetch('/api/videos');
  const data = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}