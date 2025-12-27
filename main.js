// Simple Guitar Lessons Website
const INTRO = "С Новым Годом!\nТы на сайте уроков гитары";

// State
let hoursLeft = parseFloat(localStorage.getItem('hours') || 30);
let lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
let introShown = localStorage.getItem('introShown') === 'true';

// Elements
const $ = id => document.getElementById(id);

// Typing animation
function typeText(element, text, callback) {
    let i = 0;
    const lines = text.split('\n');
    let lineIndex = 0;
    let charIndex = 0;
    
    function type() {
        if (lineIndex < lines.length) {
            if (charIndex < lines[lineIndex].length) {
                element.textContent += lines[lineIndex][charIndex];
                charIndex++;
                setTimeout(type, 60);
            } else {
                lineIndex++;
                charIndex = 0;
                if (lineIndex < lines.length) {
                    element.innerHTML += '<br>';
                    setTimeout(type, 400);
                } else {
                    setTimeout(callback, 1000);
                }
            }
        }
    }
    type();
}

// Update UI
function updateUI() {
    $('hours-left').textContent = hoursLeft.toFixed(1);
    $('lessons-done').textContent = lessons.length;
    
    const history = $('history');
    if (lessons.length === 0) {
        history.innerHTML = '<p class="empty">Пока нет уроков. Запишись на первый!</p>';
    } else {
        history.innerHTML = lessons.map(l => `
            <div class="lesson-item">
                <strong>${new Date(l.date).toLocaleDateString('ru-RU')}</strong>
                <span>${l.duration}ч</span>
            </div>
        `).join('');
    }
}

// Save state
function save() {
    localStorage.setItem('hours', hoursLeft);
    localStorage.setItem('lessons', JSON.stringify(lessons));
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Set default date
    const today = new Date().toISOString().split('T')[0];
    $('date').value = today;
    $('date').min = today;
    $('start').value = '10:00';
    $('end').value = '11:00';
    
    updateUI();
    
    // Intro
    if (!introShown) {
        typeText($('typed'), INTRO, () => {
            $('intro').classList.add('fade-out');
            $('app').classList.remove('hidden');
            localStorage.setItem('introShown', 'true');
            setTimeout(() => $('intro').style.display = 'none', 500);
        });
    } else {
        $('intro').style.display = 'none';
        $('app').classList.remove('hidden');
    }
    
    // Form submit
    $('lesson-form').onsubmit = e => {
        e.preventDefault();
        const start = $('start').value.split(':').map(Number);
        const end = $('end').value.split(':').map(Number);
        const duration = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
        
        if (duration <= 0) return alert('Время окончания должно быть позже начала');
        if (duration > hoursLeft) return alert('Недостаточно часов');
        
        lessons.unshift({ date: $('date').value, duration: duration.toFixed(1) });
        hoursLeft -= duration;
        save();
        updateUI();
        $('message').value = '';
        alert('Заявка отправлена!');
    };
    
    // Modal
    $('add-hours-btn').onclick = () => $('modal').classList.remove('hidden');
    $('cancel-modal').onclick = () => $('modal').classList.add('hidden');
    $('confirm-hours').onclick = () => {
        const extra = parseInt($('extra-hours').value) || 0;
        hoursLeft += extra;
        save();
        updateUI();
        $('modal').classList.add('hidden');
        alert(`${extra} часов добавлено!`);
    };
});
