const img = document.createElement('img');
img.src = v.thumbnail;
img.loading = 'lazy';
img.alt = v.title;
img.onerror = () => { img.src = '/assets/placeholder.jpg'; };