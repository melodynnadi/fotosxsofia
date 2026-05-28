// fotosxsofia — Dynamic Gallery Loader
const GALLERY_ADMIN_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://fotosxsofiaadmin.netlify.app';

function slugToLabel(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function getQueryCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get('category');
}

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  let category = grid.dataset.category;
  if (!category) {
    category = getQueryCategory();
    if (category) {
      grid.dataset.category = category;
      const title = document.getElementById('galleryTitle');
      if (title) title.textContent = slugToLabel(category);
      document.title = `${slugToLabel(category)} — fotosxsofia`;
    }
  }

  if (!category) return;

  try {
    const res = await fetch(`${GALLERY_ADMIN_URL}/api/photos?category=${encodeURIComponent(category)}`);
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
