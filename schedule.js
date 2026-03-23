// ==========================================
// SCHEDULING TOOL — Arrivy-style + GoCanvas
// ==========================================

// --- GoCanvas Configuration ---
// Replace these URLs with your actual GoCanvas Web Form URLs
const GOCANVAS_CONFIG = {
    formUrls: {
        intake: '',   // e.g., 'https://www.gocanvas.com/apiv2/forms/your-intake-form-id'
        waiver: '',   // e.g., 'https://www.gocanvas.com/apiv2/forms/your-waiver-form-id'
        goals: '',    // e.g., 'https://www.gocanvas.com/apiv2/forms/your-goals-form-id'
        progress: '', // e.g., 'https://www.gocanvas.com/apiv2/forms/your-progress-form-id'
    },
    formTitles: {
        intake: 'Health & Intake Form',
        waiver: 'Liability Waiver',
        goals: 'Goals Assessment',
        progress: 'Progress Tracker',
    },
    formDescriptions: {
        intake: 'Provide your health history and current fitness level so we can design the safest, most effective program for you.',
        waiver: 'Review and sign the liability waiver before your first training session.',
        goals: 'Tell us about your fitness goals so we can create a personalized plan.',
        progress: 'Track your progress and measurements over time.',
    }
};

// --- Trainer Schedule Configuration ---
const SCHEDULE_CONFIG = {
    // Available days (0=Sun, 1=Mon, ..., 6=Sat)
    availableDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    // Time slots by period
    timeSlots: {
        morning: ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
        afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'],
        evening: ['4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'],
    },
    sessionDuration: 60, // minutes
    // Simulated booked slots (for demo). In production, fetch from backend.
    bookedSlots: {}
};

// --- State ---
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;
let bookingData = {};

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    initNavigation();
    initGoCanvas();
    loadUpcomingSessions();
});

// --- Navigation ---
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// --- Calendar ---
function initCalendar() {
    renderCalendar();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    document.getElementById('calendarMonth').textContent =
        `${monthNames[currentMonth]} ${currentYear}`;

    const container = document.getElementById('calendarDays');
    container.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.classList.add('cal-day', 'empty');
        container.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('cal-day');
        dayEl.textContent = d;

        const date = new Date(currentYear, currentMonth, d);
        const dayOfWeek = date.getDay();
        const isPast = date < today;

        if (isPast || !SCHEDULE_CONFIG.availableDays.includes(dayOfWeek)) {
            dayEl.classList.add('disabled');
        } else {
            dayEl.classList.add('has-slots');
            dayEl.addEventListener('click', () => selectDate(date, dayEl));
        }

        if (date.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        }

        if (selectedDate && date.getTime() === selectedDate.getTime()) {
            dayEl.classList.add('selected');
        }

        container.appendChild(dayEl);
    }
}

function selectDate(date, el) {
    selectedDate = date;

    // Update calendar selection
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');

    // Update summary
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateStr = date.toLocaleDateString('en-US', options);
    document.getElementById('summaryDate').textContent = dateStr;
    document.getElementById('selectedDateDisplay').textContent = dateStr;

    // Show time slots after a brief delay
    setTimeout(() => {
        showStep(2);
        renderTimeSlots();
    }, 200);
}

// --- Time Slots ---
function renderTimeSlots() {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const booked = SCHEDULE_CONFIG.bookedSlots[dateKey] || [];

    ['morning', 'afternoon', 'evening'].forEach(period => {
        const container = document.getElementById(period + 'Slots');
        container.innerHTML = '';

        const slots = SCHEDULE_CONFIG.timeSlots[period];
        if (!slots || slots.length === 0) {
            container.innerHTML = '<span class="no-slots">No slots available</span>';
            return;
        }

        slots.forEach(time => {
            const slot = document.createElement('button');
            slot.classList.add('time-slot');
            slot.textContent = time;

            if (booked.includes(time)) {
                slot.classList.add('unavailable');
                slot.disabled = true;
            } else {
                slot.addEventListener('click', () => selectTime(time, slot));
            }

            if (selectedTime === time) {
                slot.classList.add('selected');
            }

            container.appendChild(slot);
        });
    });
}

function selectTime(time, el) {
    selectedTime = time;

    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');

    document.getElementById('summaryTime').textContent = time;

    setTimeout(() => showStep(3), 200);
}

// --- Step Navigation ---
function showStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('.scheduler-step').forEach(s => s.classList.add('hidden'));

    // Show target step
    const stepId = stepNum === 5 ? 'stepSuccess' : 'step' + stepNum;
    document.getElementById(stepId).classList.remove('hidden');

    // Update step indicator
    document.querySelectorAll('.step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (sNum === stepNum) s.classList.add('active');
        else if (sNum < stepNum) s.classList.add('completed');
    });

    // Scroll to top of scheduler
    document.querySelector('.scheduler-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Back buttons
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('backToCalendar').addEventListener('click', () => showStep(1));
    document.getElementById('backToTime').addEventListener('click', () => showStep(2));
    document.getElementById('backToForm').addEventListener('click', () => showStep(3));

    // Booking form submit
    document.getElementById('bookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        bookingData = {
            name: form.name.value,
            phone: form.phone.value,
            email: form.email.value,
            program: form.program.value,
            notes: form.notes.value,
            isNewClient: form.isNewClient.checked,
            date: selectedDate,
            time: selectedTime,
        };
        showConfirmation();
        showStep(4);
    });

    // Confirm booking
    document.getElementById('confirmBooking').addEventListener('click', () => {
        confirmBooking();
    });

    // Book another
    document.getElementById('bookAnother').addEventListener('click', () => {
        resetScheduler();
    });
});

// --- Confirmation ---
function showConfirmation() {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateStr = bookingData.date.toLocaleDateString('en-US', options);

    const programNames = {
        youth: 'Youth Athletic Development',
        personal: '1-on-1 Personal Training',
        transformation: 'Body Transformation',
        consultation: 'Free Consultation',
    };

    const details = document.getElementById('confirmDetails');
    details.innerHTML = `
        <div class="confirm-detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${dateStr}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Time</div>
            <div class="detail-value">${bookingData.time}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Session Type</div>
            <div class="detail-value">${programNames[bookingData.program] || bookingData.program}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Client</div>
            <div class="detail-value">${bookingData.name}</div>
        </div>
    `;

    const now = new Date();
    document.getElementById('statusTime1').textContent =
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function confirmBooking() {
    // Save to localStorage
    const sessions = JSON.parse(localStorage.getItem('jl_sessions') || '[]');
    const session = {
        id: Date.now(),
        ...bookingData,
        date: bookingData.date.toISOString(),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
    };
    sessions.push(session);
    localStorage.setItem('jl_sessions', JSON.stringify(sessions));

    // Show success
    showSuccessStep();
    showStep(5);
    loadUpcomingSessions();
}

function showSuccessStep() {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateStr = bookingData.date.toLocaleDateString('en-US', options);

    const programNames = {
        youth: 'Youth Athletic Development',
        personal: '1-on-1 Personal Training',
        transformation: 'Body Transformation',
        consultation: 'Free Consultation',
    };

    const details = document.getElementById('successDetails');
    details.innerHTML = `
        <div class="confirm-detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${dateStr}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Time</div>
            <div class="detail-value">${bookingData.time}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Session Type</div>
            <div class="detail-value">${programNames[bookingData.program] || bookingData.program}</div>
        </div>
        <div class="confirm-detail-item">
            <div class="detail-label">Client</div>
            <div class="detail-value">${bookingData.name}</div>
        </div>
    `;

    const now = new Date();
    document.getElementById('successTime1').textContent =
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Show GoCanvas followup for new clients
    const followup = document.getElementById('gocanvasFollowup');
    if (bookingData.isNewClient) {
        followup.classList.remove('hidden');
    } else {
        followup.classList.add('hidden');
    }
}

function resetScheduler() {
    selectedDate = null;
    selectedTime = null;
    bookingData = {};

    document.getElementById('bookingForm').reset();
    document.getElementById('summaryDate').textContent = 'Not selected';
    document.getElementById('summaryTime').textContent = 'Not selected';

    renderCalendar();
    showStep(1);
}

// --- Upcoming Sessions ---
function loadUpcomingSessions() {
    const container = document.getElementById('upcomingSessions');
    const sessions = JSON.parse(localStorage.getItem('jl_sessions') || '[]');

    // Filter future sessions
    const now = new Date();
    const upcoming = sessions.filter(s => new Date(s.date) >= now);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-calendar-plus"></i>
                <p>No upcoming sessions</p>
                <span>Book your first session to get started!</span>
            </div>
        `;
        return;
    }

    // Sort by date
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = upcoming.map(session => {
        const date = new Date(session.date);
        const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const statusClass = session.status === 'confirmed' ? 'confirmed' : 'pending';

        return `
            <div class="session-item">
                <div class="session-date-badge">
                    <span class="session-month">${monthShort}</span>
                    <span class="session-day">${day}</span>
                </div>
                <div class="session-info">
                    <h5>${session.time}</h5>
                    <span>${session.program || 'Training Session'}</span>
                </div>
                <span class="session-status ${statusClass}">${session.status}</span>
            </div>
        `;
    }).join('');
}

// --- GoCanvas Integration ---
function initGoCanvas() {
    // New client checkbox toggle
    const checkbox = document.getElementById('isNewClient');
    const linkSection = document.getElementById('gocanvasLink');

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            linkSection.classList.remove('hidden');
        } else {
            linkSection.classList.add('hidden');
        }
    });

    // GoCanvas form open button (in booking form)
    document.getElementById('openGoCanvasForm').addEventListener('click', (e) => {
        e.preventDefault();
        openGoCanvasModal('intake');
    });

    // Sidebar GoCanvas links
    document.querySelectorAll('.gocanvas-link-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const formType = link.dataset.form;
            openGoCanvasModal(formType);
        });
    });

    // Success page GoCanvas buttons
    ['gocanvasIntake', 'gocanvasWaiver', 'gocanvasGoals'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const type = id.replace('gocanvas', '').toLowerCase();
                openGoCanvasModal(type);
            });
        }
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeGoCanvasModal);
    document.getElementById('gocanvasModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeGoCanvasModal();
    });
}

function openGoCanvasModal(formType) {
    const modal = document.getElementById('gocanvasModal');
    const title = document.getElementById('modalTitle');
    const description = document.getElementById('modalDescription');
    const embed = document.getElementById('gocanvasEmbed');

    title.textContent = GOCANVAS_CONFIG.formTitles[formType] || 'GoCanvas Form';
    description.textContent = GOCANVAS_CONFIG.formDescriptions[formType] || 'Complete this form.';

    const formUrl = GOCANVAS_CONFIG.formUrls[formType];

    if (formUrl) {
        // Embed the GoCanvas form in an iframe
        embed.innerHTML = `<iframe src="${encodeURI(formUrl)}" style="width:100%;height:500px;border:none;border-radius:12px;" title="${GOCANVAS_CONFIG.formTitles[formType]}"></iframe>`;
    } else {
        embed.innerHTML = `
            <div class="embed-placeholder">
                <i class="fas fa-plug"></i>
                <h4>GoCanvas Form Integration</h4>
                <p>To connect your GoCanvas forms, add your Web Form URLs to the configuration in <strong>schedule.js</strong>.</p>
                <div class="embed-config">
                    <code>GOCANVAS_CONFIG.formUrls.${formType} = 'your-url-here'</code>
                </div>
            </div>
        `;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeGoCanvasModal() {
    const modal = document.getElementById('gocanvasModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}
