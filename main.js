// Simple Guitar Lessons Website
const INTRO = "С Новым Годом!\nТы на сайте уроков гитары";

// Config for GitHub issues
const GITHUB_REPO = localStorage.getItem('githubRepo') || 'OWNER/REPO';
const GITHUB_TOKEN = localStorage.getItem('githubToken') || '';

// State
let totalHours = parseFloat(localStorage.getItem('totalHours') || 30);
let hoursLeft = parseFloat(localStorage.getItem('hours') || totalHours);
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

async function createIssue(title, body) {
    if (!GITHUB_TOKEN || GITHUB_REPO === 'OWNER/REPO') {
        console.warn('GitHub token or repo missing. Set localStorage.githubToken and localStorage.githubRepo.');
        return false;
    }
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${GITHUB_TOKEN}`
        },
        body: JSON.stringify({ title, body })
    });
    if (!res.ok) {
        console.error('Failed to create issue', await res.text());
        return false;
    }
    return true;
}

function showInfo(message) {
    $('info-message').textContent = message;
    $('info-modal').classList.remove('hidden');
}

function hideInfo() {
    $('info-modal').classList.add('hidden');
}

// Update UI
function updateUI() {
    const used = Math.max(0, totalHours - hoursLeft);
    $('hours-left').textContent = `${used.toFixed(1)} / ${totalHours.toFixed(0)}`;
    $('lessons-done').textContent = lessons.length;
    const usedPercent = totalHours > 0 ? Math.max(0, Math.min(100, (used / totalHours) * 100)) : 0;
    $('progress-fill').style.width = `${usedPercent}%`;
    
    const history = $('history');
    if (lessons.length === 0) {
        history.innerHTML = '<p class="empty">Пока нет уроков. Запишись на первый!</p>';
    } else {
        history.innerHTML = lessons.map(l => `
            <div class="lesson-item">
                <div>
                    <p class="lesson-date">${new Date(l.date).toLocaleDateString('ru-RU')}</p>
                    <p class="lesson-topic">${l.topic || 'Тема не указана'}</p>
                </div>
                <span class="lesson-duration">${l.duration}ч</span>
            </div>
        `).join('');
    }
}

// Save state
function save() {
    localStorage.setItem('hours', hoursLeft);
    localStorage.setItem('totalHours', totalHours);
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
    
    $('close-info').onclick = hideInfo;
    
    // Form submit
    $('lesson-form').onsubmit = async e => {
        e.preventDefault();
        const start = $('start').value.split(':').map(Number);
        const end = $('end').value.split(':').map(Number);
        const duration = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
        
        if (duration <= 0) return alert('Время окончания должно быть позже начала');
        if (duration > hoursLeft) return alert('Недостаточно часов');
        
        const topic = $('message').value.trim();
        lessons.unshift({ date: $('date').value, duration: duration.toFixed(1), topic });
        hoursLeft -= duration;
        save();
        updateUI();
        $('message').value = '';
        const issueBody = `Дата: ${$('date').value}\nВремя: ${$('start').value} - ${$('end').value}\nДлительность: ${duration.toFixed(1)} ч\nЗапрос: ${topic || 'без деталей'}`;
        const ok = await createIssue('Новый запрос на урок', issueBody);
        showInfo('Подожди, Иван ответит тебе в личку');
        if (!ok) alert('Не удалось создать задачу на GitHub. Проверь токен и репозиторий.');
    };
    
    // Modal
    $('add-hours-btn').onclick = () => $('modal').classList.remove('hidden');
    $('cancel-modal').onclick = () => $('modal').classList.add('hidden');
    $('confirm-hours').onclick = async () => {
        const extra = parseInt($('extra-hours').value) || 0;
        const issueBody = `Запрос на добавление часов: ${extra} ч`;
        const ok = await createIssue('Нужно добавить часы', issueBody);
        $('modal').classList.add('hidden');
        showInfo('Hours requested');
        if (!ok) alert('Не удалось создать задачу на GitHub. Проверь токен и репозиторий.');
    };

    // History toggle
    const historyBlock = $('history');
    $('toggle-history').onclick = () => {
        const collapsed = historyBlock.classList.toggle('collapsed');
        $('toggle-history').textContent = collapsed ? 'Показать' : 'Скрыть';
    };
});
