// Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const menuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// Fade-in on scroll
const fadeElements = document.querySelectorAll('.about, .portfolio-card, .price-card, .testimonial-card, .section-header');

fadeElements.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
});

fadeElements.forEach(el => observer.observe(el));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Load bio content dynamically from admin
const BIO_ADMIN_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://fotosxsofiaadmin.netlify.app';

const STATIC_CATEGORY_PAGES = {
  sports: 'sports.html',
  graduation: 'graduation.html',
  lovestory: 'lovestory.html',
  family: 'family.html',
};

function slugToLabel(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function getCategoryImage(category) {
  return category.imageUrl || 'hero.png';
}

function getCategoryPage(slug) {
  return STATIC_CATEGORY_PAGES[slug] || `gallery.html?category=${encodeURIComponent(slug)}`;
}

function createCategoryCard(category) {
  const href = getCategoryPage(category.slug);
  const image = getCategoryImage(category);
  const label = category.label || slugToLabel(category.slug);

  return `
    <div class="portfolio-slide">
      <a href="${href}" class="portfolio-card">
        <img src="${image}" alt="${label} photography" loading="lazy">
        <div class="portfolio-overlay">
          <span>${label}</span>
        </div>
      </a>
    </div>
  `;
}

function initPortfolioCarousel() {
  const track = document.getElementById('portfolioTrack');
  const prev = document.getElementById('portfolioPrev');
  const next = document.getElementById('portfolioNext');
  if (!track || !prev || !next) return;

  prev.addEventListener('click', () => {
    track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
  });
}
initPortfolioCarousel();

// Cache the last-known-good data in localStorage so repeat visits render the
// real content instantly instead of showing the static fallback while a fresh
// network request (and possible Netlify cold start) is in flight.
const CACHE_KEY_BIO = 'fxs_bio_cache_v1';
const CACHE_KEY_CATEGORIES = 'fxs_categories_cache_v1';

function renderPortfolioCategories(categories) {
  const track = document.getElementById('portfolioTrack');
  const fallback = document.getElementById('portfolioFallback');
  if (!track || !fallback || !categories || categories.length === 0) return;

  // Populate carousel (shown above 470px via CSS)
  track.innerHTML = categories.map(createCategoryCard).join('');

  // Populate grid (shown at 470px and below via CSS)
  fallback.innerHTML = categories.map(cat => {
    const href = getCategoryPage(cat.slug);
    const image = getCategoryImage(cat);
    const label = cat.label || slugToLabel(cat.slug);
    return `<a href="${href}" class="portfolio-card">
      <img src="${image}" alt="${label} photography" loading="lazy">
      <div class="portfolio-overlay"><span>${label}</span></div>
    </a>`;
  }).join('');
}

async function loadPortfolioCategories() {
  try {
    const res = await fetch(`${BIO_ADMIN_URL}/api/gallery-categories`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.categories || data.categories.length === 0) return;
    renderPortfolioCategories(data.categories);
    try { localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(data.categories)); } catch {}
  } catch {
    // Keep static/cached fallback on error
  }
}

function applyBio(bio) {
  const heading = document.getElementById('bioHeading');
  const p1 = document.getElementById('bioParagraph1');
  const p2 = document.getElementById('bioParagraph2');
  const portrait = document.getElementById('bioPortrait');
  const backImage = document.getElementById('bioBackImage');
  const hero = document.getElementById('home');

  if (heading && bio.heading) heading.textContent = bio.heading;
  if (p1 && bio.paragraph1) p1.textContent = bio.paragraph1;
  if (p2 && bio.paragraph2) p2.textContent = bio.paragraph2;
  if (portrait && bio.imageUrl) portrait.src = bio.imageUrl;
  if (backImage && bio.backImageUrl) backImage.src = bio.backImageUrl;
  if (hero && bio.heroImageUrl) {
    hero.style.backgroundImage =
      `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url('${bio.heroImageUrl}')`;
  }
}

async function loadBio() {
  try {
    const res = await fetch(`${BIO_ADMIN_URL}/api/bio`);
    if (!res.ok) return;
    const { bio } = await res.json();
    applyBio(bio);
    try { localStorage.setItem(CACHE_KEY_BIO, JSON.stringify(bio)); } catch {}
  } catch {
    // Keep static/cached fallback on error
  }
}

// Render from cache immediately (no network wait) if we have it, and only dim
// the sections that don't yet have real data while the fresh fetch is in flight.
const heroEl = document.getElementById('home');
const aboutEl = document.querySelector('.about');
const portfolioEl = document.getElementById('portfolio');

let hasCachedBio = false;
let hasCachedCategories = false;
try {
  const cachedBio = localStorage.getItem(CACHE_KEY_BIO);
  if (cachedBio) {
    applyBio(JSON.parse(cachedBio));
    hasCachedBio = true;
  }
} catch {}
try {
  const cachedCategories = localStorage.getItem(CACHE_KEY_CATEGORIES);
  if (cachedCategories) {
    renderPortfolioCategories(JSON.parse(cachedCategories));
    hasCachedCategories = true;
  }
} catch {}

if (!hasCachedBio) {
  if (heroEl) heroEl.classList.add('content-loading');
  if (aboutEl) aboutEl.classList.add('content-loading');
}
if (!hasCachedCategories && portfolioEl) portfolioEl.classList.add('content-loading');

Promise.allSettled([loadBio(), loadPortfolioCategories()]).then(() => {
  [heroEl, aboutEl, portfolioEl].forEach((el) => el && el.classList.remove('content-loading'));
});

