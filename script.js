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

async function loadBio() {
  try {
    const res = await fetch(`${BIO_ADMIN_URL}/api/bio`);
    if (!res.ok) return;
    const { bio } = await res.json();

    const heading = document.getElementById('bioHeading');
    const p1 = document.getElementById('bioParagraph1');
    const p2 = document.getElementById('bioParagraph2');
    const portrait = document.getElementById('bioPortrait');

    if (heading && bio.heading) heading.textContent = bio.heading;
    if (p1 && bio.paragraph1) p1.textContent = bio.paragraph1;
    if (p2 && bio.paragraph2) p2.textContent = bio.paragraph2;
    if (portrait && bio.imageUrl) portrait.src = bio.imageUrl;
  } catch {
    // Keep static fallback on error
  }
}

loadBio();

