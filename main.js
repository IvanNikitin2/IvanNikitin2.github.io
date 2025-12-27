// ===================================
// Guitar Lessons Website - Main JavaScript
// ===================================

// ===================================
// Configuration & Constants
// ===================================
const CONFIG = {
    DEFAULT_HOURS: 30,
    TYPING_SPEED: 60,
    TYPING_PAUSE: 800,
    INTRO_DELAY: 500,
    INTRO_FADE_DELAY: 1000,
    TOAST_DURATION: 3000,
    STORAGE_KEYS: {
        LESSONS: 'guitar_lessons',
        HOURS_REMAINING: 'hours_remaining',
        HOURS_COMPLETED: 'hours_completed',
        INTRO_SHOWN: 'intro_shown'
    }
};

const MOTIVATIONAL_QUOTES = [
    "Every chord brings you closer to your song",
    "Music is the shorthand of emotion",
    "The guitar is a small orchestra",
    "Practice makes progress, not perfection",
    "Your fingers are learning to dance",
    "One note at a time, one day at a time",
    "The journey of a thousand songs begins with a single chord",
    "Let the music flow through you",
    "Strum your heart out",
    "Today's practice is tomorrow's music"
];

const INTRO_TEXT = "Great New Year!\nYou are on a guitar lessons website";

// ===================================
// State Management
// ===================================
class AppState {
    constructor() {
        this.lessons = this.load(CONFIG.STORAGE_KEYS.LESSONS, []);
        this.hoursRemaining = this.load(CONFIG.STORAGE_KEYS.HOURS_REMAINING, CONFIG.DEFAULT_HOURS);
        this.hoursCompleted = this.load(CONFIG.STORAGE_KEYS.HOURS_COMPLETED, 0);
        this.introShown = this.load(CONFIG.STORAGE_KEYS.INTRO_SHOWN, false);
    }

    load(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.warn(`Failed to load ${key}:`, e);
            return defaultValue;
        }
    }

    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`Failed to save ${key}:`, e);
        }
    }

    addLesson(lesson) {
        this.lessons.unshift(lesson);
        this.save(CONFIG.STORAGE_KEYS.LESSONS, this.lessons);
        return lesson;
    }

    updateLessonNotes(lessonId, notes) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (lesson) {
            lesson.notes = notes;
            this.save(CONFIG.STORAGE_KEYS.LESSONS, this.lessons);
        }
    }

    updateHours(completed, remaining) {
        this.hoursCompleted = completed;
        this.hoursRemaining = remaining;
        this.save(CONFIG.STORAGE_KEYS.HOURS_COMPLETED, this.hoursCompleted);
        this.save(CONFIG.STORAGE_KEYS.HOURS_REMAINING, this.hoursRemaining);
    }

    markIntroShown() {
        this.introShown = true;
        this.save(CONFIG.STORAGE_KEYS.INTRO_SHOWN, true);
    }
}

// ===================================
// DOM Elements
// ===================================
const DOM = {
    // Intro
    intro: () => document.getElementById('intro'),
    typedText: () => document.getElementById('typed-text'),
    cursor: () => document.querySelector('.cursor'),
    
    // App
    app: () => document.getElementById('app'),
    greetingMessage: () => document.getElementById('greeting-message'),
    motivationalQuote: () => document.getElementById('motivational-quote'),
    
    // Progress
    hoursRemaining: () => document.getElementById('hours-remaining'),
    hoursCompleted: () => document.getElementById('hours-completed'),
    lessonsCount: () => document.getElementById('lessons-count'),
    progressCircle: () => document.getElementById('progress-circle'),
    requestHoursBtn: () => document.getElementById('request-hours-btn'),
    
    // Lesson Form
    lessonForm: () => document.getElementById('lesson-form'),
    lessonDate: () => document.getElementById('lesson-date'),
    startTime: () => document.getElementById('start-time'),
    endTime: () => document.getElementById('end-time'),
    lessonMessage: () => document.getElementById('lesson-message'),
    
    // History
    lessonHistory: () => document.getElementById('lesson-history'),
    emptyHistory: () => document.getElementById('empty-history'),
    
    // Modal
    hoursModal: () => document.getElementById('hours-modal'),
    closeHoursModal: () => document.getElementById('close-hours-modal'),
    hoursForm: () => document.getElementById('hours-form'),
    hoursRequested: () => document.getElementById('hours-requested'),
    hoursMessage: () => document.getElementById('hours-message'),
    
    // Toast
    toast: () => document.getElementById('toast'),
    toastMessage: () => document.getElementById('toast-message')
};

// ===================================
// Utilities
// ===================================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDuration(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes}m`;
    }
}

function getDurationInHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return totalMinutes / 60;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTimeOfDayGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
}

function getRandomQuote() {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===================================
// Typing Animation
// ===================================
class TypingAnimation {
    constructor(element, text, options = {}) {
        this.element = element;
        this.text = text;
        this.speed = options.speed || CONFIG.TYPING_SPEED;
        this.pauseDuration = options.pauseDuration || CONFIG.TYPING_PAUSE;
        this.onComplete = options.onComplete || (() => {});
    }

    async start() {
        const lines = this.text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            await this.typeLine(lines[i]);
            
            if (i < lines.length - 1) {
                await this.pause(this.pauseDuration);
                this.element.innerHTML += '<br>';
            }
        }
        
        await this.pause(this.pauseDuration);
        this.onComplete();
    }

    typeLine(line) {
        return new Promise(resolve => {
            let index = 0;
            const type = () => {
                if (index < line.length) {
                    this.element.innerHTML += line.charAt(index);
                    index++;
                    setTimeout(type, this.speed + Math.random() * 40);
                } else {
                    resolve();
                }
            };
            type();
        });
    }

    pause(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }
}

// ===================================
// UI Updates
// ===================================
function updateProgressUI(state) {
    const totalHours = state.hoursCompleted + state.hoursRemaining;
    const percentage = (state.hoursCompleted / totalHours) * 100;
    
    // Update text values
    DOM.hoursRemaining().textContent = state.hoursRemaining.toFixed(1);
    DOM.hoursCompleted().textContent = state.hoursCompleted.toFixed(1);
    DOM.lessonsCount().textContent = state.lessons.length;
    
    // Update progress ring
    const circumference = 2 * Math.PI * 52; // radius = 52
    const offset = circumference - (percentage / 100) * circumference;
    DOM.progressCircle().style.strokeDashoffset = offset;
}

function updateGreeting() {
    DOM.greetingMessage().textContent = getTimeOfDayGreeting();
    DOM.motivationalQuote().textContent = getRandomQuote();
}

function setDefaultFormValues() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    DOM.lessonDate().value = `${yyyy}-${mm}-${dd}`;
    DOM.lessonDate().min = `${yyyy}-${mm}-${dd}`;
    DOM.startTime().value = '10:00';
    DOM.endTime().value = '11:00';
}

function renderLessonHistory(state) {
    const container = DOM.lessonHistory();
    const emptyState = DOM.emptyHistory();
    
    // Remove existing lesson cards
    const existingCards = container.querySelectorAll('.lesson-card');
    existingCards.forEach(card => card.remove());
    
    if (state.lessons.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    state.lessons.forEach(lesson => {
        const card = createLessonCard(lesson, state);
        container.appendChild(card);
    });
}

function createLessonCard(lesson, state) {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.dataset.id = lesson.id;
    
    card.innerHTML = `
        <div class="lesson-card-header">
            <span class="lesson-date">${formatDate(lesson.date)}</span>
            <span class="lesson-duration">${formatDuration(lesson.startTime, lesson.endTime)}</span>
        </div>
        ${lesson.description ? `<p class="lesson-description">${escapeHtml(lesson.description)}</p>` : ''}
        <div class="lesson-notes">
            <span class="lesson-notes-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Practice notes
            </span>
            <textarea 
                class="lesson-notes-input" 
                placeholder="Add your reflections, things to practice, or feedback..."
                data-lesson-id="${lesson.id}"
            >${lesson.notes || ''}</textarea>
        </div>
    `;
    
    // Add debounced save for notes
    const notesInput = card.querySelector('.lesson-notes-input');
    notesInput.addEventListener('input', debounce((e) => {
        state.updateLessonNotes(lesson.id, e.target.value);
    }, 500));
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const toast = DOM.toast();
    DOM.toastMessage().textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// ===================================
// Modal Management
// ===================================
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===================================
// Event Handlers
// ===================================
function handleLessonSubmit(e, state) {
    e.preventDefault();
    
    const date = DOM.lessonDate().value;
    const startTime = DOM.startTime().value;
    const endTime = DOM.endTime().value;
    const message = DOM.lessonMessage().value.trim();
    
    // Validate time
    if (startTime >= endTime) {
        showToast('End time must be after start time');
        return;
    }
    
    // Calculate duration
    const durationHours = getDurationInHours(startTime, endTime);
    
    // Check if enough hours remain
    if (durationHours > state.hoursRemaining) {
        showToast(`Not enough hours remaining. You have ${state.hoursRemaining.toFixed(1)}h left.`);
        return;
    }
    
    // Create lesson
    const lesson = {
        id: generateId(),
        date,
        startTime,
        endTime,
        description: message,
        notes: '',
        createdAt: new Date().toISOString()
    };
    
    // Update state
    state.addLesson(lesson);
    state.updateHours(
        state.hoursCompleted + durationHours,
        state.hoursRemaining - durationHours
    );
    
    // Update UI
    updateProgressUI(state);
    renderLessonHistory(state);
    
    // Reset form
    DOM.lessonMessage().value = '';
    setDefaultFormValues();
    
    // Show confirmation
    showToast('Lesson request submitted!');
    
    // Scroll to history
    setTimeout(() => {
        DOM.lessonHistory().scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

function handleHoursRequest(e, state) {
    e.preventDefault();
    
    const hoursRequested = parseInt(DOM.hoursRequested().value, 10);
    const message = DOM.hoursMessage().value.trim();
    
    // In a real app, this would send a request to a backend
    // For now, we'll just add the hours directly
    state.updateHours(state.hoursCompleted, state.hoursRemaining + hoursRequested);
    
    // Update UI
    updateProgressUI(state);
    closeModal(DOM.hoursModal());
    
    // Reset form
    DOM.hoursRequested().value = '10';
    DOM.hoursMessage().value = '';
    
    showToast(`${hoursRequested} hours added to your account!`);
}

// ===================================
// Initialization
// ===================================
function initializeApp() {
    const state = new AppState();
    
    // Check if intro should be shown
    if (!state.introShown) {
        showIntro(state);
    } else {
        skipIntro();
    }
    
    // Set up greeting
    updateGreeting();
    
    // Set default form values
    setDefaultFormValues();
    
    // Update progress UI
    updateProgressUI(state);
    
    // Render lesson history
    renderLessonHistory(state);
    
    // Event Listeners
    setupEventListeners(state);
}

function showIntro(state) {
    const intro = DOM.intro();
    const app = DOM.app();
    const typedText = DOM.typedText();
    
    setTimeout(() => {
        const typing = new TypingAnimation(typedText, INTRO_TEXT, {
            onComplete: () => {
                setTimeout(() => {
                    intro.classList.add('fade-out');
                    app.classList.remove('hidden');
                    state.markIntroShown();
                    
                    setTimeout(() => {
                        intro.style.display = 'none';
                    }, 600);
                }, CONFIG.INTRO_FADE_DELAY);
            }
        });
        typing.start();
    }, CONFIG.INTRO_DELAY);
}

function skipIntro() {
    const intro = DOM.intro();
    const app = DOM.app();
    
    intro.style.display = 'none';
    app.classList.remove('hidden');
}

function setupEventListeners(state) {
    // Lesson form submission
    DOM.lessonForm().addEventListener('submit', (e) => handleLessonSubmit(e, state));
    
    // Hours request modal
    DOM.requestHoursBtn().addEventListener('click', () => openModal(DOM.hoursModal()));
    DOM.closeHoursModal().addEventListener('click', () => closeModal(DOM.hoursModal()));
    
    // Close modal on overlay click
    DOM.hoursModal().querySelector('.modal-overlay').addEventListener('click', () => {
        closeModal(DOM.hoursModal());
    });
    
    // Hours form submission
    DOM.hoursForm().addEventListener('submit', (e) => handleHoursRequest(e, state));
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.hoursModal().classList.contains('active')) {
            closeModal(DOM.hoursModal());
        }
    });
    
    // Update greeting periodically
    setInterval(updateGreeting, 60000 * 30); // Every 30 minutes
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);

// Add some sample lessons for demo (remove in production)
// Uncomment the following to add sample data:
/*
if (!localStorage.getItem(CONFIG.STORAGE_KEYS.LESSONS)) {
    const sampleLessons = [
        {
            id: 'sample1',
            date: '2024-12-20',
            startTime: '14:00',
            endTime: '15:00',
            description: 'Learned basic chord transitions: G, C, D',
            notes: 'Need to practice the G to C transition more smoothly.',
            createdAt: '2024-12-20T14:00:00Z'
        },
        {
            id: 'sample2',
            date: '2024-12-15',
            startTime: '10:00',
            endTime: '11:30',
            description: 'Introduction to fingerpicking patterns',
            notes: 'The Travis picking pattern is tricky but fun!',
            createdAt: '2024-12-15T10:00:00Z'
        }
    ];
    localStorage.setItem(CONFIG.STORAGE_KEYS.LESSONS, JSON.stringify(sampleLessons));
    localStorage.setItem(CONFIG.STORAGE_KEYS.HOURS_COMPLETED, JSON.stringify(2.5));
    localStorage.setItem(CONFIG.STORAGE_KEYS.HOURS_REMAINING, JSON.stringify(27.5));
}
*/
