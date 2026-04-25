// fotosxsofia — Custom Booking Widget
const ADMIN_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://fotosxsofiaadmin.netlify.app';

const ZELLE_CONTACT = ''; // Will be set from API or hardcode Sofia's Zelle here once known

// ── Pricing section ────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  graduation:    { label: 'Graduation',    img: 'graduation.jpg'  },
  sports:        { label: 'Sports',        img: 'soccer.jpg'      },
  lovestory:     { label: 'Love Story',    img: 'lovestory.jpg'   },
  family:        { label: 'Family',        img: 'family.jpg'      },
  smallsessions: { label: 'Small Sessions',img: 'sofieabout.jpg'  },
};

async function loadPricing() {
  const tabsEl    = document.getElementById('pricesTabs');
  const panelsEl  = document.getElementById('pricesPanels');
  if (!tabsEl || !panelsEl) return;

  try {
    const res = await fetch(`${ADMIN_URL}/api/packages`);
    const { packages } = await res.json();
    if (!packages || packages.length === 0) return;

    // Group by category, preserving orderIndex sort
    const byCategory = {};
    for (const pkg of packages) {
      (byCategory[pkg.category] = byCategory[pkg.category] || []).push(pkg);
    }

    const categories = Object.keys(byCategory);

    // Render tabs
    tabsEl.innerHTML = categories.map((cat, i) => {
      const cfg = CATEGORY_CONFIG[cat] || { label: cat };
      return `<button class="prices-tab${i === 0 ? ' active' : ''}" data-cat="${cat}">${cfg.label}</button>`;
    }).join('');

    // Render panels
    panelsEl.innerHTML = categories.map((cat, i) => {
      const cfg  = CATEGORY_CONFIG[cat] || { label: cat, img: 'graduation.jpg', addons: '' };
      const pkgs = byCategory[cat];

      const cards = pkgs.map(pkg => `
        <div class="price-card${pkg.isFeatured ? ' featured' : ''}">
          <div class="price-card-image">
            <img src="${cfg.img}" alt="${pkg.name}" loading="lazy">
            <div class="price-card-overlay">
              <h3>${pkg.name}</h3>
              <span class="price-amount">${pkg.price ? '$' + pkg.price : '$—'}</span>
            </div>
          </div>
          <div class="price-details">
            ${pkg.description ? `<div class="price-detail-row"><span>${pkg.description}</span></div>` : ''}
            <a href="#booking" class="btn btn-small">Book</a>
          </div>
        </div>`).join('');

      return `
        <div class="prices-panel${i === 0 ? ' active' : ''}" id="prices-panel-${cat}">
          <div class="prices-grid">${cards}</div>
        </div>`;
    }).join('');

    // Attach tab handlers
    tabsEl.querySelectorAll('.prices-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.prices-tab').forEach(t => t.classList.remove('active'));
        panelsEl.querySelectorAll('.prices-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('prices-panel-' + tab.dataset.cat).classList.add('active');
      });
    });

  } catch (e) {
    console.warn('Could not load pricing:', e);
  }
}

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  selectedPackage: null,
  selectedDate: null,
  selectedSlotId: null,
  selectedTime: null,
  availableByDate: {},
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth() + 1,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function showStep(id) {
  document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById(id);
  if (step) {
    step.classList.add('active');
    step.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${padTwo(m)} ${ampm}`;
}

function getMonthName(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// ── Fetch availability ─────────────────────────────────────────────────────
async function fetchAvailability(year, month) {
  try {
    const res = await fetch(`${ADMIN_URL}/api/availability?year=${year}&month=${month}`);
    const data = await res.json();
    const byDate = {};
    (data.available || []).forEach(({ date, slots }) => {
      byDate[date] = slots;
    });
    return byDate;
  } catch (e) {
    console.warn('Could not fetch availability:', e);
    return {};
  }
}

// ── Render calendar ────────────────────────────────────────────────────────
async function renderCalendar() {
  const { calYear, calMonth } = state;
  const container = document.getElementById('bookingCalendar');
  if (!container) return;

  state.availableByDate = await fetchAvailability(calYear, calMonth);
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();

  let html = `
    <div class="bk-cal">
      <div class="bk-cal-header">
        <button class="bk-cal-nav" id="calPrev">‹</button>
        <span class="bk-cal-title">${getMonthName(calYear, calMonth)}</span>
        <button class="bk-cal-nav" id="calNext">›</button>
      </div>
      <div class="bk-cal-grid">
        <div class="bk-cal-day-name">Su</div>
        <div class="bk-cal-day-name">Mo</div>
        <div class="bk-cal-day-name">Tu</div>
        <div class="bk-cal-day-name">We</div>
        <div class="bk-cal-day-name">Th</div>
        <div class="bk-cal-day-name">Fr</div>
        <div class="bk-cal-day-name">Sa</div>
  `;

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="bk-cal-empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${padTwo(calMonth)}-${padTwo(day)}`;
    const hasSlots = !!state.availableByDate[dateStr];
    const isSelected = state.selectedDate === dateStr;
    const isPast = new Date(dateStr) < new Date(new Date().toDateString());
    let cls = 'bk-cal-day';
    if (isPast) cls += ' bk-cal-day--past';
    else if (isSelected) cls += ' bk-cal-day--selected';
    else if (hasSlots) cls += ' bk-cal-day--available';
    else cls += ' bk-cal-day--unavailable';
    const clickable = hasSlots && !isPast ? `data-date="${dateStr}"` : '';
    html += `<div class="${cls}" ${clickable}>${day}</div>`;
  }

  html += '</div></div>';
  container.innerHTML = html;

  document.getElementById('calPrev')?.addEventListener('click', () => {
    if (calMonth === 1) { state.calYear--; state.calMonth = 12; }
    else state.calMonth--;
    state.selectedDate = null;
    state.selectedSlotId = null;
    state.selectedTime = null;
    document.getElementById('datetimeNext').disabled = true;
    renderTimeSlots([]);
    renderCalendar();
  });

  document.getElementById('calNext')?.addEventListener('click', () => {
    if (calMonth === 12) { state.calYear++; state.calMonth = 1; }
    else state.calMonth++;
    state.selectedDate = null;
    state.selectedSlotId = null;
    state.selectedTime = null;
    document.getElementById('datetimeNext').disabled = true;
    renderTimeSlots([]);
    renderCalendar();
  });

  container.querySelectorAll('[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.date;
      state.selectedDate = date;
      state.selectedSlotId = null;
      state.selectedTime = null;
      document.getElementById('datetimeNext').disabled = true;
      renderCalendar();
      renderTimeSlots(state.availableByDate[date] || []);
    });
  });
}

// ── Render time slots ──────────────────────────────────────────────────────
function renderTimeSlots(slots) {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  if (slots.length === 0) {
    container.innerHTML = '<p class="time-slots-hint">No available times for this date.</p>';
    return;
  }
  container.innerHTML = slots.map(slot => `
    <button class="time-slot-btn ${state.selectedSlotId === slot.id ? 'selected' : ''}"
            data-slot-id="${slot.id}"
            data-time="${slot.startTime}">
      ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}
    </button>
  `).join('');

  container.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedSlotId = btn.dataset.slotId;
      state.selectedTime = btn.dataset.time;
      document.getElementById('datetimeNext').disabled = false;
      container.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// ── Submit booking ─────────────────────────────────────────────────────────
async function submitBooking(e) {
  e.preventDefault();
  const errEl = document.getElementById('bookingError');
  errEl.style.display = 'none';

  const btn = document.getElementById('submitBooking');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  const body = {
    name: document.getElementById('bkName').value.trim(),
    email: document.getElementById('bkEmail').value.trim(),
    phone: document.getElementById('bkPhone').value.trim(),
    packageType: state.selectedPackage,
    sessionDate: state.selectedDate,
    sessionTime: state.selectedTime,
    notes: document.getElementById('bkNotes').value.trim(),
  };

  try {
    const res = await fetch(`${ADMIN_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Submission failed. Please try again.');
    }

    showStep('step-success');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.textContent = 'Submit Booking Request';
    btn.disabled = false;
  }
}

// ── Load packages dynamically ──────────────────────────────────────────────
async function loadPackages() {
  const container = document.querySelector('.booking-packages');
  if (!container) return;

  try {
    const res = await fetch(`${ADMIN_URL}/api/packages`);
    const { packages } = await res.json();
    if (!packages || packages.length === 0) { attachPackageHandlers(); return; }

    container.innerHTML = packages.map(pkg =>
      `<button class="booking-pkg-btn" data-pkg="${pkg.slug}">
        ${pkg.name}${pkg.price ? ` — $${pkg.price}` : ''}
      </button>`
    ).join('');

    // Re-attach click handlers after dynamic render
    attachPackageHandlers();
  } catch {
    // Keep static fallback buttons and attach handlers
    attachPackageHandlers();
  }
}

function attachPackageHandlers() {
  document.querySelectorAll('.booking-pkg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedPackage = btn.dataset.pkg;
      document.querySelectorAll('.booking-pkg-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(() => {
        showStep('step-datetime');
        renderCalendar();
      }, 150);
    });
  });
}

// ── Contact form ───────────────────────────────────────────────────────────
async function handleContactForm(e) {
  e.preventDefault();
  const btn = document.getElementById('contactSubmitBtn');
  const status = document.getElementById('contactStatus');

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  btn.textContent = 'Sending…';
  btn.disabled = true;
  status.style.display = 'none';

  try {
    const res = await fetch(`${ADMIN_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });

    if (!res.ok) throw new Error('Failed to send');

    status.textContent = 'Message sent! Sofia will get back to you soon.';
    status.style.color = '#3a7d44';
    status.style.display = 'block';
    e.target.reset();
  } catch {
    status.textContent = 'Something went wrong. Please try again or email directly.';
    status.style.color = '#b83e3e';
    status.style.display = 'block';
  } finally {
    btn.textContent = 'Send Message';
    btn.disabled = false;
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set Zelle contact in the form
  const zelleEl = document.getElementById('zelleContact');
  if (zelleEl) zelleEl.textContent = ZELLE_CONTACT || 'Sofia\'s Zelle (contact for details)';

  // Load packages dynamically (falls back to static if API fails)
  loadPackages();

  // Load pricing section tabs and cards from API
  loadPricing();

  // Back buttons
  document.querySelectorAll('.booking-back-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(btn.dataset.back));
  });

  // Datetime next
  const datetimeNext = document.getElementById('datetimeNext');
  if (datetimeNext) {
    datetimeNext.addEventListener('click', () => showStep('step-info'));
  }

  // Booking form submission
  const form = document.getElementById('bookingInfoForm');
  if (form) form.addEventListener('submit', submitBooking);

  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContactForm);
});

// ── Dynamic testimonials ───────────────────────────────────────────────────
async function loadTestimonials() {
  const grid = document.getElementById('testimonialGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${ADMIN_URL}/api/testimonials`);
    const { testimonials } = await res.json();
    if (!testimonials || testimonials.length === 0) return; // keep fallback HTML

    grid.innerHTML = testimonials.map(t => {
      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.clientName)}&background=b8633e&color=fff`;
      return `
        <div class="testimonial-card">
          <div class="testimonial-avatar">
            <img src="${t.clientPhotoUrl || fallback}" alt="${t.clientName}" loading="lazy"
                 onerror="this.src='${fallback}'">
          </div>
          <h4>${t.clientName}</h4>
          <p>"${t.testimonialText}"</p>
        </div>
      `;
    }).join('');
  } catch {
    // Keep the hardcoded fallback on error
  }
}

loadTestimonials();
