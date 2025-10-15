const grid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loader = document.getElementById('loader');
const message = document.getElementById('message');
const filterCategory = document.getElementById('filterCategory');
const showFavoritesBtn = document.getElementById('showFavorites');
const toggleDarkBtn = document.getElementById('toggleDark');
const notifyBtn = document.getElementById('notifyBtn');

let allVideos = [];
let currentIndex = 0;
const perPage = 6;
let sortPopular = true;
let inFavoritesMode = false;
let categories = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let stats = JSON.parse(localStorage.getItem('videoStats')) || {};
let comments = JSON.parse(localStorage.getItem('videoComments')) || {};
let ratings = JSON.parse(localStorage.getItem('videoRatings')) || {};
let cachedVideos = JSON.parse(localStorage.getItem('cachedVideos')) || null;

// Loader helper
function showLoader(show) { loader.classList.toggle('hidden', !show); }
function showMessage(msg) { message.textContent = msg; message.classList.toggle('hidden', !msg); }

// Fetch & cache data
function fetchVideos() {
  if (cachedVideos) {
    allVideos = cachedVideos;
    afterFetch();
    return;
  }
  showLoader(true);
  fetch('assets/videos.json')
    .then(res => res.json())
    .then(data => {
      allVideos = data;
      localStorage.setItem('cachedVideos', JSON.stringify(data));
      afterFetch();
      showLoader(false);
    })
    .catch(err => {
      showLoader(false);
      showMessage('Gagal memuat data video. Silakan coba beberapa saat lagi.');
      console.error('Gagal memuat data video:', err);
    });
}
function afterFetch() {
  categories = [''].concat([...new Set(allVideos.map(v => v.category))]);
  filterCategory.innerHTML = categories.map(c =>
    `<option value="${c}">${c || 'Semua Kategori'}</option>`
  ).join('');
  renderVideos();
}

// Sort button
const sortBtn = document.createElement('button');
sortBtn.innerHTML = `Urutkan Berdasarkan Terpopuler 🔥 <span id="sortIcon">🔽</span>`;
sortBtn.className = "px-4 py-2 bg-yellow-300 border-2 border-black rounded-xl font-bold mb-4 transition hover:-translate-y-1 hover:shadow-lg flex items-center gap-2";
searchInput.parentElement.insertBefore(sortBtn, searchInput.nextSibling);

// Render video (support filter, search, favorites)
function renderVideos(search = '') {
  grid.innerHTML = '';
  showMessage('');
  currentIndex = 0;
  let list = allVideos;
  if (inFavoritesMode) {
    list = list.filter(v => favorites.includes(v.id));
  }
  if (filterCategory.value) {
    list = list.filter(v => v.category === filterCategory.value);
  }
  list = list.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
  if (list.length === 0) {
    showMessage('Video tidak ditemukan.');
    loadMoreBtn.classList.add('hidden');
    return;
  }
  if (sortPopular) {
    list.sort((a, b) => (getStats(b.id).downloads || 0) - (getStats(a.id).downloads || 0));
  }
  showNextBatch(list);
  loadMoreBtn.onclick = () => showNextBatch(list);
}
function showNextBatch(list) {
  const slice = list.slice(currentIndex, currentIndex + perPage);
  slice.forEach(v => grid.appendChild(createCard(v)));
  lucide.createIcons();
  AOS.refresh();
  currentIndex += perPage;
  loadMoreBtn.classList.toggle('hidden', currentIndex >= list.length);
}
function createCard(v) {
  const stat = getStats(v.id);
  const card = document.createElement('div');
  card.className = 'frame rounded-2xl bg-white dark:bg-gray-800 overflow-hidden flex flex-col transition-transform duration-300';
  card.setAttribute('data-aos', 'zoom-in-up');
  card.innerHTML = `
    <img src="${v.thumbnail}" alt="${v.title}" class="w-full h-48 object-cover rounded-t-2xl" loading="lazy">
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="font-bold text-lg mb-2">${v.title}</h3>
      <span class="text-xs text-gray-500 mb-1">${v.category}</span>
      <button class="btn-detail px-2 py-1 bg-blue-100 border-2 border-blue-400 rounded font-bold mb-2" data-id="${v.id}">Detail & Preview</button>
      <button class="btn-fav px-2 py-1 bg-yellow-100 border-2 border-yellow-400 rounded font-bold mb-2" data-id="${v.id}">${favorites.includes(v.id) ? '⭐ Favorit' : '☆ Favorit'}</button>
      <a href="${v.download}" target="_blank" class="btn-download inline-flex items-center justify-center gap-2 mt-auto" data-id="${v.id}">
        <i data-lucide="download"></i> Download
      </a>
      <p class="download-count mt-2">Diunduh ${stat.downloads || 0} kali, Ditonton ${stat.plays || 0} kali</p>
      <p class="mt-1 text-xs">Rating: ${getAvgRating(v.id).toFixed(1)} / 5 (${getRatingCount(v.id)} rating)</p>
    </div>
  `;
  card.querySelector('.btn-detail').onclick = () => openModal(v.id);
  card.querySelector('.btn-fav').onclick = (e) => toggleFavorite(v.id, e.target);
  card.querySelector('.btn-download').onclick = () => incrementStat(v.id, 'downloads');
  return card;
}

// Statistik dan favorit
function getStats(id) { return stats[id] || {}; }
function incrementStat(id, key) {
  stats[id] = stats[id] || { downloads: 0, plays: 0 };
  stats[id][key] = (stats[id][key] || 0) + 1;
  localStorage.setItem('videoStats', JSON.stringify(stats));
  renderVideos(searchInput.value);
}
function toggleFavorite(id, btn) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(fid => fid !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  btn.textContent = favorites.includes(id) ? '⭐ Favorit' : '☆ Favorit';
  renderVideos(searchInput.value);
}

// Detail modal
const modal = document.getElementById('videoModal');
const closeModalBtn = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalStats = document.getElementById('modalStats');
const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalVideoPlayer = document.getElementById('modalVideoPlayer');
const modalRatingStars = document.getElementById('modalRatingStars');
const modalRatingAvg = document.getElementById('modalRatingAvg');
const modalComments = document.getElementById('modalComments');
const modalCommentForm = document.getElementById('modalCommentForm');
const modalCommentInput = document.getElementById('modalCommentInput');
let currentModalId = null;

function openModal(id) {
  const v = allVideos.find(vid => vid.id === id);
  if (!v) return;
  modalTitle.textContent = v.title;
  modalDesc.textContent = v.description + (v.category ? ` (${v.category})` : '');
  modalStats.textContent = `Diunduh ${getStats(id).downloads || 0} kali • Ditonton ${getStats(id).plays || 0} kali`;
  modalFavoriteBtn.textContent = favorites.includes(id) ? '⭐ Favorit' : '☆ Favorit';
  modalDownloadBtn.href = v.download;
  // Plyr.js player
  modalVideoPlayer.innerHTML = `<video id="plyrPlayer" controls playsinline poster="${v.thumbnail}" style="width:100%;"><source src="${v.download}" type="video/mp4"></video>`;
  setTimeout(() => { new Plyr('#plyrPlayer', { controls: ['play','progress','volume','fullscreen'] }); }, 100);
  incrementStat(id, 'plays');
  // Ratings
  renderRatingStars(id);
  modalRatingAvg.textContent = `(Rata-rata: ${getAvgRating(id).toFixed(1)})`;
  // Komentar
  showComments(id);
  currentModalId = id;
  modal.classList.remove('hidden');
  AOS.refresh();
}
closeModalBtn.onclick = () => { modal.classList.add('hidden'); };

// Favorit dari modal
modalFavoriteBtn.onclick = () => {
  if (!currentModalId) return;
  toggleFavorite(currentModalId, modalFavoriteBtn);
};

// Rating
function renderRatingStars(id) {
  const avg = getAvgRating(id);
  let stars = '';
  for (let i=1; i<=5; i++) {
    stars += `<span class="star ${avg < i-0.5 ? 'inactive' : ''}" data-rate="${i}">★</span>`;
  }
  modalRatingStars.innerHTML = stars;
  Array.from(modalRatingStars.querySelectorAll('.star')).forEach(star => {
    star.onclick = () => setRating(id, parseInt(star.dataset.rate));
  });
}
function getAvgRating(id) {
  const arr = ratings[id] || [];
  if (!arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}
function getRatingCount(id) { return (ratings[id]||[]).length; }
function setRating(id, rate) {
  ratings[id] = ratings[id] || [];
  ratings[id].push(rate);
  localStorage.setItem('videoRatings', JSON.stringify(ratings));
  renderRatingStars(id);
  modalRatingAvg.textContent = `(Rata-rata: ${getAvgRating(id).toFixed(1)})`;
  renderVideos(searchInput.value);
}

// Komentar
function showComments(id) {
  const arr = comments[id] || [];
  modalComments.innerHTML = arr.length ? arr.map(c=>`<div class="comment">${c}</div>`).join('') : '<div class="comment text-gray-400">Belum ada komentar</div>';
}
modalCommentForm.onsubmit = e => {
  e.preventDefault();
  if (!currentModalId) return;
  const txt = modalCommentInput.value.trim();
  if (!txt) return;
  comments[currentModalId] = comments[currentModalId] || [];
  comments[currentModalId].push(txt);
  localStorage.setItem('videoComments', JSON.stringify(comments));
  modalCommentInput.value = '';
  showComments(currentModalId);
};

// Dark mode
toggleDarkBtn.onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
};
if (localStorage.getItem('darkMode') === "true") document.body.classList.add('dark');

// Filter kategori
filterCategory.onchange = () => renderVideos(searchInput.value);
// Show favorites
showFavoritesBtn.onclick = () => {
  inFavoritesMode = !inFavoritesMode;
  showFavoritesBtn.textContent = inFavoritesMode ? 'Semua Video' : 'Favorit';
  renderVideos(searchInput.value);
};
// Sort
sortBtn.onclick = () => {
  sortPopular = !sortPopular;
  sortBtn.innerHTML = sortPopular
    ? `Urutkan Berdasarkan Terpopuler 🔥 <span id="sortIcon">🔽</span>`
    : `Urutkan Berdasarkan Terbaru 📅 <span id="sortIcon">🔼</span>`;
  renderVideos(searchInput.value);
};
// Pencarian
searchInput.oninput = e => renderVideos(e.target.value);

// Push Notification (simulasi)
notifyBtn.onclick = () => {
  alert('Notifikasi: Ada video baru di EduStream!');
};

fetchVideos();