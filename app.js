/* ========================================
   PAWS & FLOW — Puppy Yoga Studio
   Interactive booking demo
   ======================================== */

// ---- CONFIG ----
const API_BASE = 'https://api.puppyflowyoga.com:3125';
const CLASS_PRICE_ORIGINAL = 55;
const CLASS_PRICE = 41.25; // 25% discount
const CLASS_CAPACITY = 12;
const CLASS_TIMES = ['12:00 PM', '1:15 PM', '2:30 PM'];

// Classes happen on Saturdays (6) and Sundays (0)
const CLASS_DAYS = [0, 6]; // 0=Sunday, 6=Saturday

// Cache for real availability data from API
const availabilityCache = {};

// Fetch real availability from the API
async function fetchAvailability(dateStr) {
  if (availabilityCache[dateStr]) return availabilityCache[dateStr];
  try {
    const resp = await fetch(`${API_BASE}/api/availability?date=${dateStr}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    availabilityCache[dateStr] = data.slots;
    return data.slots;
  } catch (err) {
    console.error('Failed to fetch availability:', err);
    return null;
  }
}

// Format date as YYYY-MM-DD
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

const floatingCta = document.getElementById('floatingCta');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
  // Show floating Book Now after scrolling 400px
  if (floatingCta) {
    floatingCta.classList.toggle('visible', window.scrollY > 400);
  }
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
async function renderSlots() {
  const slotsEl = document.getElementById('slots');
  const slotsGrid = document.getElementById('slotsGrid');
  const slotsTitle = document.getElementById('slotsTitle');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  slotsTitle.textContent = `${dayNames[selectedDate.getDay()]}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  slotsGrid.innerHTML = '<p style="text-align:center;color:#7a6555;">Loading availability...</p>';

  const dateStr = formatDateISO(selectedDate);
  const slots = await fetchAvailability(dateStr);

  slotsGrid.innerHTML = '';

  CLASS_TIMES.forEach(time => {
    const apiSlot = slots ? slots.find(s => s.time === time) : null;
    const spotsLeft = apiSlot ? apiSlot.spotsLeft : CLASS_CAPACITY;
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

// ---- CHECKOUT (Stripe Redirect) ----
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const waiver = document.getElementById('waiver').checked;

  if (!fname || !lname || !email || !phone) {
    alert('Please fill in all required fields.');
    return;
  }
  if (!waiver) {
    alert('Please accept the waiver to continue.');
    return;
  }
  if (!selectedDate || !selectedSlot) {
    alert('Please select a date and time slot first.');
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn__text">Processing...</span>';

  try {
    const dateStr = formatDateISO(selectedDate);
    const resp = await fetch(`${API_BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateStr,
        time: selectedSlot.time,
        quantity,
        firstName: fname,
        lastName: lname,
        email,
        phone,
        waiverAccepted: true,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.error || 'Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      return;
    }

    // Redirect to Stripe Checkout
    window.location.href = data.sessionUrl;
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Unable to connect to the booking server. Please try again in a moment.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

function showSuccessModal(confirmationCode) {
  const modal = document.getElementById('successModal');
  const details = document.getElementById('modalDetails');

  details.innerHTML = `
    <div><span>Confirmation Code</span> <strong>${confirmationCode || ''}</strong></div>
    <div style="margin-top:10px;"><span>A confirmation email with your booking details has been sent.</span></div>
  `;

  modal.style.display = 'flex';
}

// Handle return from Stripe Checkout
(function handleBookingReturn() {
  const params = new URLSearchParams(window.location.search);
  const bookingStatus = params.get('booking');
  const code = params.get('code');

  if (bookingStatus === 'success' && code) {
    // Clean URL without reloading
    window.history.replaceState({}, '', window.location.pathname);
    // Show success modal after page loads
    setTimeout(() => showSuccessModal(code), 500);
  } else if (bookingStatus === 'cancelled') {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => {
      alert('Payment was cancelled. Your spots have not been reserved. You can try booking again.');
    }, 500);
  }
})();

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
// ---- QUICK BOOK (floating button) ----
function quickBook() {
  // Find next available class day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let nextClassDate = new Date(today);

  for (let i = 0; i < 14; i++) {
    if (CLASS_DAYS.includes(nextClassDate.getDay()) && nextClassDate >= today) {
      break;
    }
    nextClassDate.setDate(nextClassDate.getDate() + 1);
  }

  // Set the calendar to the right month
  currentMonth = nextClassDate.getMonth();
  currentYear = nextClassDate.getFullYear();
  selectedDate = nextClassDate;
  renderCalendar();

  // Highlight the selected date on calendar
  document.querySelectorAll('.cal-day').forEach(d => {
    if (d.textContent == nextClassDate.getDate() && d.classList.contains('has-class')) {
      d.classList.add('selected');
    }
  });

  // Render time slots and auto-select the first available one
  renderSlots();

  setTimeout(() => {
    const firstSlot = document.querySelector('.slot-card:not(.full)');
    if (firstSlot) {
      firstSlot.click();
    }
  }, 100);
}

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

// ---- COMPACT BOOKING WIDGET ----
(function() {
  const dateSelect = document.getElementById('classDateSelect');
  const timeSlotsRow = document.getElementById('timeSlotsRow');
  const qtyValueWidget = document.getElementById('qtyValueWidget');
  const qtyMinusWidget = document.getElementById('qtyMinusWidget');
  const qtyPlusWidget = document.getElementById('qtyPlusWidget');
  const widgetTotal = document.getElementById('widgetTotal');
  const addToBookBtn = document.getElementById('addToBookBtn');

  if (!dateSelect) return;

  let widgetQty = 1;
  let widgetSelectedTime = null;
  let widgetSpotsLeft = CLASS_CAPACITY;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate next 8 available class dates
  function getUpcomingClassDates(count) {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let d = new Date(today);

    while (dates.length < count) {
      if (CLASS_DAYS.includes(d.getDay()) && d >= today) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }

  const classDates = getUpcomingClassDates(8);

  // Populate date dropdown
  classDates.forEach((date, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${fullDayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()} | 60 min`;
    dateSelect.appendChild(opt);
  });

  // Render time pills with real availability
  async function renderTimePills() {
    timeSlotsRow.innerHTML = '<span style="color:#7a6555;font-size:13px;">Loading...</span>';
    widgetSelectedTime = null;

    const dateIdx = dateSelect.value;
    const date = classDates[dateIdx];
    const dateStr = formatDateISO(date);
    const slots = await fetchAvailability(dateStr);

    timeSlotsRow.innerHTML = '';

    CLASS_TIMES.forEach((time) => {
      const apiSlot = slots ? slots.find(s => s.time === time) : null;
      const spotsLeft = apiSlot ? apiSlot.spotsLeft : CLASS_CAPACITY;
      const isFull = spotsLeft <= 0;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'time-pill' + (isFull ? ' full' : '');
      pill.textContent = time;

      if (!isFull) {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.time-pill').forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
          widgetSelectedTime = time;
          widgetSpotsLeft = spotsLeft;
          widgetQty = 1;
          updateWidgetUI();
        });

        // Auto-select first available time
        if (!widgetSelectedTime) {
          pill.classList.add('selected');
          widgetSelectedTime = time;
          widgetSpotsLeft = spotsLeft;
        }
      }

      timeSlotsRow.appendChild(pill);
    });

    updateWidgetUI();
  }

  function updateWidgetUI() {
    qtyValueWidget.textContent = widgetQty;
    const total = (CLASS_PRICE * widgetQty).toFixed(2);
    widgetTotal.textContent = '$' + total;
    qtyMinusWidget.disabled = widgetQty <= 1;
    qtyPlusWidget.disabled = widgetQty >= widgetSpotsLeft;
  }

  qtyMinusWidget.addEventListener('click', () => {
    if (widgetQty > 1) { widgetQty--; updateWidgetUI(); }
  });

  qtyPlusWidget.addEventListener('click', () => {
    if (widgetQty < widgetSpotsLeft) { widgetQty++; updateWidgetUI(); }
  });

  dateSelect.addEventListener('change', () => {
    renderTimePills();
  });

  // "Book Now" button -> show the full booking form
  addToBookBtn.addEventListener('click', () => {
    if (!widgetSelectedTime) return;

    const dateIdx = dateSelect.value;
    const date = classDates[dateIdx];
    selectedDate = date;
    selectedSlot = { time: widgetSelectedTime, spotsLeft: widgetSpotsLeft };
    quantity = widgetQty;

    showBookingForm();
    updateQuantityUI();
  });

  // Initial render
  renderTimePills();
})();
