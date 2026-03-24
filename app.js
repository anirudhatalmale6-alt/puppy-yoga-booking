/* ========================================
   PAWS & FLOW — Puppy Yoga Studio
   Interactive booking demo
   ======================================== */

// ---- CONFIG ----
const CLASS_PRICE_ORIGINAL = 55;
const CLASS_PRICE = 41.25; // 25% discount
const CLASS_CAPACITY = 12;
const CLASS_TIMES = ['12:00 PM', '1:15 PM', '2:30 PM'];

// Classes happen on Saturdays (6) and Sundays (0)
const CLASS_DAYS = [0, 6]; // 0=Sunday, 6=Saturday

// Simulated bookings (random spots taken)
function getRandomSpotsTaken() {
  return Math.floor(Math.random() * (CLASS_CAPACITY - 2));
}

// ---- STATE ----
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedSlot = null;

// ---- NAV ----
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ---- SCROLL ANIMATIONS ----
const animElements = document.querySelectorAll('[data-anim]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay * 150);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

animElements.forEach(el => observer.observe(el));

// ---- CALENDAR ----
const calGrid = document.getElementById('calGrid');
const calMonth = document.getElementById('calMonth');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function renderCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  calMonth.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  calGrid.innerHTML = '';

  // Empty cells for days before month starts
  for (let i = 0; i < startDow; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    calGrid.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;

    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isClassDay = CLASS_DAYS.includes(date.getDay());

    if (isPast && !isToday) {
      el.classList.add('past');
    } else if (isClassDay) {
      el.classList.add('has-class');
      el.addEventListener('click', () => selectDate(date, el));
    }

    if (isToday) el.classList.add('today');

    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      el.classList.add('selected');
    }

    calGrid.appendChild(el);
  }
}

function selectDate(date, el) {
  selectedDate = date;
  selectedSlot = null;

  // Update calendar UI
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');

  // Show time slots
  renderSlots();

  // Hide booking form
  document.getElementById('bookingForm').style.display = 'none';
}

calPrev.addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});

calNext.addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});

renderCalendar();

// ---- TIME SLOTS ----
function renderSlots() {
  const slotsEl = document.getElementById('slots');
  const slotsGrid = document.getElementById('slotsGrid');
  const slotsTitle = document.getElementById('slotsTitle');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  slotsTitle.textContent = `${dayNames[selectedDate.getDay()]}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  slotsGrid.innerHTML = '';

  CLASS_TIMES.forEach(time => {
    const spotsTaken = getRandomSpotsTaken();
    const spotsLeft = CLASS_CAPACITY - spotsTaken;
    const isFull = spotsLeft <= 0;

    const card = document.createElement('div');
    card.className = `slot-card${isFull ? ' full' : ''}`;

    const spotsClass = spotsLeft <= 3 ? ' low' : '';

    card.innerHTML = `
      <div class="slot-card__time">${time}</div>
      <div class="slot-card__spots${spotsClass}">${isFull ? 'FULL' : `${spotsLeft} spots left`}</div>
      <div class="slot-card__price"><span class="slot-card__price-original">$${CLASS_PRICE_ORIGINAL}</span> $${CLASS_PRICE}</div>
    `;

    if (!isFull) {
      card.addEventListener('click', () => {
        selectedSlot = { time, spotsLeft };
        document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        showBookingForm();
      });
    }

    slotsGrid.appendChild(card);
  });

  slotsEl.style.display = 'block';
  slotsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- QUANTITY SELECTOR ----
let quantity = 1;
const qtyValue = document.getElementById('qtyValue');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const qtyTotal = document.getElementById('qtyTotal');
const qtyAvailable = document.getElementById('qtyAvailable');

function updateQuantityUI() {
  qtyValue.textContent = quantity;
  const total = (CLASS_PRICE * quantity).toFixed(2);
  qtyTotal.textContent = `$${total}`;
  document.getElementById('btnPrice').textContent = `$${total}`;

  // Update minus button state
  qtyMinus.disabled = quantity <= 1;

  // Update plus button state (can't exceed available spots)
  const maxSpots = selectedSlot ? selectedSlot.spotsLeft : CLASS_CAPACITY;
  qtyPlus.disabled = quantity >= maxSpots;

  qtyAvailable.textContent = `${maxSpots - quantity} more spots available`;
}

qtyMinus.addEventListener('click', () => {
  if (quantity > 1) {
    quantity--;
    updateQuantityUI();
  }
});

qtyPlus.addEventListener('click', () => {
  const maxSpots = selectedSlot ? selectedSlot.spotsLeft : CLASS_CAPACITY;
  if (quantity < maxSpots) {
    quantity++;
    updateQuantityUI();
  }
});

// ---- EMBEDDED WAIVER TOGGLE ----
document.getElementById('waiverToggle')?.addEventListener('click', function() {
  const body = document.getElementById('waiverBody');
  const waiver = this.closest('.embedded-waiver');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    waiver.classList.add('open');
  } else {
    body.style.display = 'none';
    waiver.classList.remove('open');
  }
});

// ---- BOOKING FORM ----
function showBookingForm() {
  const form = document.getElementById('bookingForm');
  const summary = document.getElementById('bookingSummary');
  const btnPrice = document.getElementById('btnPrice');

  // Reset quantity when new slot selected
  quantity = 1;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dateStr = `${dayNames[selectedDate.getDay()]}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  summary.innerHTML = `
    <div>
      <strong>Puppy Yoga Class</strong><br>
      ${dateStr} at ${selectedSlot.time}
    </div>
    <div style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--terracotta);">
      $${CLASS_PRICE} / person
    </div>
  `;

  updateQuantityUI();
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- APPLE PAY BUTTON ----
document.getElementById('applePayBtn')?.addEventListener('click', function() {
  // Validate required fields first
  const fname = document.getElementById('fname').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const waiver = document.getElementById('waiver').checked;

  if (!fname || !email || !phone || !waiver) {
    alert('Please fill in all required fields and accept the waiver before paying.');
    return;
  }

  // In production, this triggers the Apple Pay payment sheet via Stripe
  // For demo, show success
  showSuccessModal();
});

// ---- CHECKOUT (Card Payment) ----
document.getElementById('checkoutForm').addEventListener('submit', function(e) {
  e.preventDefault();

  showSuccessModal();
});

function showSuccessModal() {
  const fname = document.getElementById('fname').value;
  const email = document.getElementById('email').value;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayNames[selectedDate.getDay()]}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  const modal = document.getElementById('successModal');
  const details = document.getElementById('modalDetails');

  const totalAmount = (CLASS_PRICE * quantity).toFixed(2);

  details.innerHTML = `
    <div><span>Class</span> <strong>Puppy Yoga</strong></div>
    <div><span>Date</span> <strong>${dateStr}</strong></div>
    <div><span>Time</span> <strong>${selectedSlot.time}</strong></div>
    <div><span>Participants</span> <strong>${quantity}</strong></div>
    <div><span>Name</span> <strong>${fname}</strong></div>
    <div><span>Confirmation</span> <strong>#PY${Math.random().toString(36).substr(2, 6).toUpperCase()}</strong></div>
    <div><span>Amount</span> <strong>$${totalAmount}${quantity > 1 ? ` ($${CLASS_PRICE} x ${quantity})` : ''}</strong></div>
  `;

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  document.getElementById('bookingForm').style.display = 'none';
  document.getElementById('slots').style.display = 'none';
  document.getElementById('checkoutForm').reset();
  selectedDate = null;
  selectedSlot = null;
  renderCalendar();
  document.getElementById('classes').scrollIntoView({ behavior: 'smooth' });
}

// Close modal on overlay click
document.querySelector('.modal__overlay')?.addEventListener('click', closeModal);

// ---- CONTACT FORM ----
document.querySelector('.contact__form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Message sent! (Demo — will connect to real email in production)');
  this.reset();
});

// ---- POLICY MODALS ----
function toggleAllFaqs() {
  const faqList = document.querySelector('.faq__list');
  faqList.classList.add('faq--expanded');
}

function openPolicyModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeWaiverModal(id) {
  document.getElementById(id).style.display = 'none';
}

document.getElementById('openWaiverLink')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  openPolicyModal('waiverModal');
});

document.getElementById('openRefundLink')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  openPolicyModal('refundModal');
});

document.getElementById('openLateLink')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  openPolicyModal('lateModal');
});

// ---- EMAIL CAPTURE POPUP ----
const emailPopup = document.getElementById('emailPopup');
const emailPopupClose = document.getElementById('emailPopupClose');
const emailPopupForm = document.getElementById('emailPopupForm');
const emailPopupSuccess = document.getElementById('emailPopupSuccess');

function showEmailPopup() {
  // Don't show if already dismissed or subscribed
  if (localStorage.getItem('puppyYogaEmailDismissed')) return;
  emailPopup.style.display = 'flex';
}

function hideEmailPopup() {
  emailPopup.style.display = 'none';
  localStorage.setItem('puppyYogaEmailDismissed', '1');
}

// Show popup after 8 seconds on page
setTimeout(showEmailPopup, 8000);

// Also show on scroll past 40% of page (whichever comes first)
let popupScrollTriggered = false;
window.addEventListener('scroll', function onScrollPopup() {
  if (popupScrollTriggered) return;
  const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  if (scrollPercent > 0.4) {
    popupScrollTriggered = true;
    showEmailPopup();
  }
});

emailPopupClose.addEventListener('click', hideEmailPopup);
emailPopup.querySelector('.email-popup__overlay').addEventListener('click', hideEmailPopup);

emailPopupForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('popupEmail').value;
  // In production, this would POST to your backend/email service
  console.log('Email captured:', email);
  emailPopupForm.style.display = 'none';
  document.querySelector('.email-popup__text').style.display = 'none';
  emailPopupSuccess.style.display = 'block';
  // Auto-close after 2.5 seconds
  setTimeout(hideEmailPopup, 2500);
});

// ---- SMOOTH SCROLL for nav links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
