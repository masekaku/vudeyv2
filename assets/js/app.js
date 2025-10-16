/* app.js - main logic for THE ARTIFACT VIDEY
   - loads artifacts.json
   - paginates (PAGE_SIZE)
   - real-time search
   - click tracking + history
   - offline detection + service worker registration
   - sitemap generation (client-side HTML sitemap)
*/

(function(cfg){
  const pageSize = cfg.PAGE_SIZE || 5;
  const field = cfg.FIELD_MAP;
  const artifactsEl = document.getElementById('artifacts');
  const searchInput = document.getElementById('search');
  const clearSearchBtn = document.getElementById('clear-search');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const paginationInfo = document.getElementById('pagination-info');
  const pageCounter = document.getElementById('page-counter');
  const resultsCount = document.getElementById('results-count');
  const toastEl = document.getElementById('toast');

  let artifacts = [];
  let filtered = [];
  let currentPage = 1;
  let totalPages = 1;

  // Helper: fetch JSON with timeout
  function fetchJSON(url, timeout = 7000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(()=>reject(new Error('Timeout')), timeout);
      fetch(url).then(r=>{
        clearTimeout(timer);
        if (!r.ok) return reject(new Error('Network error'));
        return r.json().then(json => resolve(json));
      }).catch(err=>{
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // Load artifacts
  async function loadArtifacts() {
    try {
      const data = await fetchJSON(cfg.ARTIFACTS_JSON);
      artifacts = Array.isArray(data) ? data : [];
      filtered = artifacts.slice();
      updatePagination();
      render();
      try { localStorage.setItem('artifacts_cache', JSON.stringify(artifacts)); } catch(e){}
    } catch (e) {
      try {
        const cached = localStorage.getItem('artifacts_cache');
        if (cached) {
          artifacts = JSON.parse(cached);
          filtered = artifacts.slice();
          updatePagination();
          render();
          showToast('Offline: showing cached artifacts');
        } else {
          artifactsEl.innerHTML = `<div class="card"><div class="card-body">No artifacts available offline.</div></div>`;
        }
      } catch (err) {
        artifactsEl.innerHTML = `<div class="card"><div class="card-body">Unable to load artifacts.</div></div>`;
      }
    }
  }

  // Render artifact cards for currentPage
  function render() {
    const start = (currentPage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    artifactsEl.innerHTML = '';
    if (!items.length) {
      artifactsEl.innerHTML = `<div class="card"><div class="card-body">No artifacts found.</div></div>`;
    } else {
      items.forEach(item => {
        const id = item[field.id];
        const title = item[field.title];
        const thumb = item[field.thumbnail];
        const link = item[field.link];
        const anchor = document.createElement('a');
        anchor.className = 'card';
        anchor.setAttribute('data-id', id);
        anchor.setAttribute('href', link);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        anchor.setAttribute('data-aos', 'fade-up');
        anchor.innerHTML = `
          <div class="thumb"><img loading="lazy" src="${thumb}" alt="${escapeHtml(title)}"></div>
          <div class="card-body">
            <div>
              <div class="card-title">${escapeHtml(title)}</div>
              <div class="card-meta">ID: ${escapeHtml(id)}</div>
            </div>
            <div class="card-action">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M15 3h6v6"></path><path stroke="currentColor" stroke-width="1.5" d="M10 14L21 3"></path><path stroke="currentColor" stroke-width="1.5" d="M21 21H3V3"></path></svg>
            </div>
          </div>
        `;
        anchor.addEventListener('click', function(evt){
          evt.preventDefault();
          handleArtifactClick(item);
        });
        artifactsEl.appendChild(anchor);
      });
    }
    updatePaginationUI();
    if (window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh();
    resultsCount.textContent = `${filtered.length} artifacts`;
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}

  // Click handling
  function handleArtifactClick(item) {
    try {
      const historyKey = cfg.LOCALSTORAGE_HISTORY_KEY || 'artifact_history';
      const clickKey = cfg.LOCALSTORAGE_CLICK_KEY || 'artifact_clicks';
      let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history = history.filter(h => h.i !== item.i);
      history.unshift({ i: item.i, t: item.t, l: item.l, ts: Date.now() });
      if (history.length > 5) history = history.slice(0,5);
      localStorage.setItem(historyKey, JSON.stringify(history));
      let clicks = JSON.parse(localStorage.getItem(clickKey) || '{}');
      clicks[item.i] = (clicks[item.i] || 0) + 1;
      localStorage.setItem(clickKey, JSON.stringify(clicks));
      window.trackEvent('artifact_click', {artifact_id: item.i, title: item.t});
    } catch(e){ /* ignore storage errors */ }

    showToast('External Link Initiated');

    const a = document.createElement('a');
    a.href = item.l;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Search
  function applySearch(query) {
    if (!query) {
      filtered = artifacts.slice();
    } else {
      const q = query.trim().toLowerCase();
      filtered = artifacts.filter(it => {
        const id = String(it[field.id] || '');
        const title = String(it[field.title] || '').toLowerCase();
        return id.includes(q) || title.includes(q);
      });
    }
    currentPage = 1;
    updatePagination();
    render();
  }

  // Pagination calculations
  function updatePagination() {
    totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
  }
  function updatePaginationUI() {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageCounter.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // Prev/Next handlers
  prevBtn.addEventListener('click', ()=> {
    if (currentPage > 1) { currentPage--; render(); window.trackEvent('pagination_prev',{page:currentPage}); }
  });
  nextBtn.addEventListener('click', ()=> {
    if (currentPage < totalPages) { currentPage++; render(); window.trackEvent('pagination_next',{page:currentPage}); }
  });

  // Search bindings
  searchInput.addEventListener('input', (e)=> applySearch(e.target.value));
  clearSearchBtn.addEventListener('click', ()=> { searchInput.value=''; applySearch(''); });

  // Toast display
  let toastTimer = null;
  function showToast(message, timeout=2200){
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastEl.setAttribute('aria-hidden','false');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> {
      toastEl.classList.remove('show');
      toastEl.setAttribute('aria-hidden','true');
    }, timeout);
  }

  // Service worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg=>{
        console.log('ServiceWorker registered', reg);
      }).catch(err=>{
        console.warn('SW registration failed', err);
      });
    });
  }

  // Offline detection
  function updateNetworkStatus(){
    if (!navigator.onLine) showToast('You are offline — using cached data if available');
  }
  window.addEventListener('offline', updateNetworkStatus);
  window.addEventListener('online', ()=> showToast('Back online'));

  // HTML Sitemap generation (client-side) - returns a DOM node
  window.generateHtmlSitemap = function() {
    const cont = document.createElement('div');
    cont.innerHTML = '<h3 style="color:var(--neon-green)">HTML Sitemap</h3>';
    const ul = document.createElement('ul');
    artifacts.forEach(it=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it[field.link] || '#';
      a.textContent = `${it[field.title]} (ID: ${it[field.id]})`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      li.appendChild(a);
      ul.appendChild(li);
    });
    cont.appendChild(ul);
    return cont;
  };

  // initialize
  loadArtifacts();

  // Auto-init Disqus + AOS once DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof window.loadDisqus === 'function') {
        window.loadDisqus();
      }
    } catch (e) { console.warn('Disqus init error', e); }

    if (window.AOS && typeof window.AOS.init === 'function') {
      window.AOS.init({ once: true, duration: 600, easing: 'ease-in-out' });
    }
  });

  // Expose small helpers for dev
  window.__ARTIFACTS = { getAll: ()=>artifacts, getFiltered: ()=>filtered };

})(window.APP_CONFIG || { PAGE_SIZE:5, ARTIFACTS_JSON:'/artifacts.json', FIELD_MAP:{id:'i',title:'t',thumbnail:'m',link:'l'} });