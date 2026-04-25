// fotosxsofia — Dynamic Gallery Loader
const GALLERY_ADMIN_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://fotosxsofiaadmin.netlify.app';

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const category = grid.dataset.category;
  if (!category) return;

  try {
    const res = await fetch(`${GALLERY_ADMIN_URL}/api/photos?category=${category}`);
    if (!res.ok) return; // keep static fallback

    const { photos } = await res.json();
    if (!photos || photos.length === 0) return; // keep static fallback

    grid.innerHTML = photos.map(p => `
      <img src="${p.url}" alt="${p.caption || category + ' photo'}" loading="lazy">
    `).join('');
  } catch {
    // Keep the hardcoded static photos on error
  }
}

loadGallery();
