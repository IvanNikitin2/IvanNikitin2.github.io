const INTRO = "С Новым Годом!\nС этим сайтом ты можешь запросить у Вани обучение по гитаре!\nВыбери время и дату, подай заявку, и мы отправим запрос на почту Ване!";


const hasStoredState = localStorage.getItem('hours') !== null ||
    localStorage.getItem('totalHours') !== null ||
    localStorage.getItem('lessons') !== null;

let totalHours = parseFloat(localStorage.getItem('totalHours') || 30);
let hoursLeft = parseFloat(localStorage.getItem('hours') || totalHours);
let lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
let introShown = localStorage.getItem('introShown') === 'true';

const $ = id => document.getElementById(id);

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

function showInfo(message) {
    $('info-message').textContent = message;
    $('info-modal').classList.remove('hidden');
}

function hideInfo() {
    $('info-modal').classList.add('hidden');
}

const encode = data => Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');

function submitNetlifyForm(formName, data) {
    return fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': formName, ...data })
    });
}

function updateUI() {
    const used = Math.max(0, totalHours - hoursLeft);
    $('hours-left').textContent = `${used.toFixed(1)} / ${totalHours.toFixed(0)}`;
    $('lessons-done').textContent = lessons.length;
    const usedPercent = totalHours > 0 ? Math.max(0, Math.min(100, (used / totalHours) * 100)) : 0;
    $('progress-fill').style.width = `${usedPercent}%`;
    const addHoursBtn = $('add-hours-btn');
    const disableAdd = hoursLeft > 3;
    addHoursBtn.disabled = disableAdd;
    addHoursBtn.classList.toggle('disabled', disableAdd);
    const hint = $('hours-hint');
    if (disableAdd) {
        hint.textContent = 'У тебя пока есть доступные часы';
    } else {
        hint.textContent = '';
    }
    
    const history = $('history');
    if (lessons.length === 0) {
        history.innerHTML = '<p class="empty">Пока нет уроков. Запишись на первый!</p>';
    } else {
        history.innerHTML = lessons.map(l => `
            <div class="lesson-item">
                <div class="lesson-meta">
                    <p class="lesson-date">${new Date(l.date).toLocaleDateString('ru-RU')}</p>
                    <p class="lesson-topic">${l.topic || 'Тема не указана'}</p>
                </div>
                <span class="lesson-duration">${l.duration}ч</span>
            </div>
        `).join('');
    }
}

function save() {
    localStorage.setItem('hours', hoursLeft);
    localStorage.setItem('totalHours', totalHours);
    localStorage.setItem('lessons', JSON.stringify(lessons));
}

document.addEventListener('DOMContentLoaded', () => {
    if (!hasStoredState) {
        save();
    }
    const today = new Date().toISOString().split('T')[0];
    $('date').value = today;
    $('date').min = today;
    $('start').value = '10:00';
    $('end').value = '11:00';
    
    updateUI();
    
    if (!introShown) {
        const startButton = $('start-app');
        startButton.classList.add('hidden');
        const startApp = () => {
            $('intro').classList.add('fade-out');
            $('app').classList.remove('hidden');
            localStorage.setItem('introShown', 'true');
            setTimeout(() => $('intro').style.display = 'none', 500);
        };
        typeText($('typed'), INTRO, () => {
            const lines = INTRO.split('\n');
            $('typed').innerHTML = `<span class="intro-title">${lines[0]}</span><br><span class="intro-desc">${lines.slice(1).join('<br>')}</span>`;
            startButton.classList.remove('hidden');
        });
        startButton.onclick = startApp;
    } else {
        $('intro').style.display = 'none';
        $('app').classList.remove('hidden');
    }
    
    $('close-info').onclick = hideInfo;
    
    $('lesson-form').onsubmit = e => {
        e.preventDefault();
        const start = $('start').value.split(':').map(Number);
        const end = $('end').value.split(':').map(Number);
        const duration = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
        
        if (duration <= 0) return alert('Время окончания должно быть позже начала!');
        if (duration > hoursLeft) return alert('Недостаточно часов');
        
        const topic = $('message').value.trim();
        lessons.unshift({ date: $('date').value, duration: duration.toFixed(1), topic });
        hoursLeft = Math.max(0, hoursLeft - duration);
        save();
        updateUI();
        $('message').value = '';
        submitNetlifyForm('lesson-request', {
            date: $('date').value,
            start: $('start').value,
            end: $('end').value,
            duration: duration.toFixed(1),
            message: topic || 'без деталей'
        }).then(() => {
            showInfo('Ваня оповещен! Ожидай подтверждение в личных сообщениях!');
        }).catch(() => {
            alert('Хмм, что то сломалось, попробуй ещё раз!.');
        });
    };
    
    $('add-hours-btn').onclick = () => {
        if ($('add-hours-btn').disabled) return;
        $('modal').classList.remove('hidden');
    };
    $('cancel-modal').onclick = () => $('modal').classList.add('hidden');
    $('confirm-hours').onclick = () => {
        const extra = parseInt($('extra-hours').value) || 0;
        if (extra <= 0) return alert('Введите количество часов');
        submitNetlifyForm('hours-request', {
            amount: extra,
            note: 'Добавить часы'
        }).then(() => {
            showInfo('Ваня оповещен, запрос на пополнение будет просмотрен!');
        }).catch(() => {
            alert('Хмм, что то сломалось, попробуй ещё раз!');
        });
        $('modal').classList.add('hidden');
    };

    $('teacher-profile-btn').onclick = () => $('teacher-modal').classList.remove('hidden');
    $('close-teacher').onclick = () => $('teacher-modal').classList.add('hidden');
    $('teacher-modal').addEventListener('click', e => {
        if (e.target === $('teacher-modal')) $('teacher-modal').classList.add('hidden');
    });

    const historyBlock = $('history');
    $('toggle-history').onclick = () => {
        const collapsed = historyBlock.classList.toggle('collapsed');
        $('toggle-history').textContent = collapsed ? 'Показать' : 'Скрыть';
    };
});
