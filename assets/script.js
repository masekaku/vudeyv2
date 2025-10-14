const grid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Tambahkan tombol sort
const sortBtn = document.createElement('button');
sortBtn.innerHTML = `Urutkan Berdasarkan Terpopuler 🔥 <span id="sortIcon">🔽</span>`;
sortBtn.className = "px-4 py-2 bg-yellow-300 border-2 border-black rounded-xl font-bold mb-4 transition hover:-translate-y-1 hover:shadow-lg flex items-center gap-2";
grid.parentElement.insertBefore(sortBtn, grid);

let allVideos = [];
let currentIndex = 0;
const perPage = 6;
let sortPopular = true;

let downloadCounts = JSON.parse(localStorage.getItem('downloadCounts')) || {};

// Ambil data JSON
fetch('assets/videos.json')
  .then(res => res.json())
  .then(data => {
    allVideos = data;
    renderVideos();
  })
  .catch(err => console.error('Gagal memuat data video:', err));

function renderVideos(search = '') {
  grid.innerHTML = '';
  currentIndex = 0;

  let filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  if (sortPopular) {
    filtered.sort((a, b) => (downloadCounts[b.title] || 0) - (downloadCounts[a.title] || 0));
  }

  showNextBatch(filtered);

  loadMoreBtn.onclick = () => showNextBatch(filtered);
}

function showNextBatch(list) {
  const slice = list.slice(currentIndex, currentIndex + perPage);
  slice.forEach(v => {
    const count = downloadCounts[v.title] || 0;

    const card = document.createElement('div');
    card.className = 'frame rounded-2xl bg-white overflow-hidden flex flex-col transition-transform duration-300';
    card.setAttribute('data-aos', 'zoom-in-up');

    card.innerHTML = `
      <img src="${v.thumbnail}" alt="${v.title}" class="w-full h-48 object-cover">
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="font-bold text-lg mb-2">${v.title}</h3>
        <a href="${v.download}" target="_blank"
           class="btn-download inline-flex items-center justify-center gap-2 mt-auto"
           data-title="${v.title}">
          <i data-lucide="download"></i> Download
        </a>
        <p class="download-count" id="count-${slugify(v.title)}">
          Telah diunduh ${count} kali
        </p>
      </div>
    `;
    grid.appendChild(card);
  });

  lucide.createIcons();
  AOS.refresh();

  document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title');
      incrementDownloadCount(title);
    });
  });

  currentIndex += perPage;
  loadMoreBtn.classList.toggle('hidden', currentIndex >= list.length);
}

function incrementDownloadCount(title) {
  downloadCounts[title] = (downloadCounts[title] || 0) + 1;
  localStorage.setItem('downloadCounts', JSON.stringify(downloadCounts));

  const el = document.getElementById(`count-${slugify(title)}`);
  if (el) el.textContent = `Telah diunduh ${downloadCounts[title]} kali`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Event pencarian
searchInput.addEventListener('input', e => {
  renderVideos(e.target.value);
});

// Event sorting toggle
sortBtn.addEventListener('click', () => {
  sortPopular = !sortPopular;
  sortBtn.innerHTML = sortPopular
    ? `Urutkan Berdasarkan Terpopuler 🔥 <span id="sortIcon">🔽</span>`
    : `Urutkan Berdasarkan Terbaru 📅 <span id="sortIcon">🔼</span>`;
  renderVideos(searchInput.value);
});