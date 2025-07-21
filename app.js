// Timer variables
let timer;
let isRunning = false;
let seconds = 0;
let minutes = 0;
let hours = 0;

// DOM elements
const hoursDisplay = document.getElementById('hours');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const saveSessionBtn = document.getElementById('save-session');
const sessionNameInput = document.getElementById('session-name');
const themeToggle = document.querySelector('.theme-toggle');

// Local storage keys
const STORAGE_KEY = 'study_sessions';
const THEME_KEY = 'theme_preference';

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Load saved theme preference
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Timer functions
function updateDisplay() {
    hoursDisplay.textContent = hours.toString().padStart(2, '0');
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(() => {
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
                if (minutes === 60) {
                    minutes = 0;
                    hours++;
                }
            }
            updateDisplay();
        }, 1000);

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        saveSessionBtn.disabled = false;
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    seconds = 0;
    minutes = 0;
    hours = 0;
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    saveSessionBtn.disabled = true;
}

// Session management
function saveSession() {
    const sessionName = sessionNameInput.value.trim() || 'Unnamed Session';
    const duration = hours * 3600 + minutes * 60 + seconds;
    const session = {
        name: sessionName,
        duration,
        date: new Date().toISOString(),
    };

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

    sessionNameInput.value = '';
    resetTimer();
    updateStats();
    updateChart();
    fetchQuote();
}

// Stats and chart
function updateStats() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(session => 
        new Date(session.date).toDateString() === today
    );

    const totalSeconds = todaySessions.reduce((acc, session) => acc + session.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    document.getElementById('today-stats').innerHTML = `
        <p>Sessions today: ${todaySessions.length}</p>
        <p>Total time: ${hours}h ${minutes}m</p>
    `;
}

function updateChart() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    
    // Get last 7 days
    const days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
    }).reverse();

    const dailyDurations = days.map(day => {
        const daySessions = sessions.filter(session => 
            new Date(session.date).toDateString() === day
        );
        return daySessions.reduce((acc, session) => acc + session.duration / 3600, 0);
    });

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days.map(day => day.split(' ')[0]),
            datasets: [{
                label: 'Study Hours',
                data: dailyDurations,
                backgroundColor: '#6c63ff80',
                borderColor: '#6c63ff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

// Motivational quotes
async function fetchQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random?tags=inspirational,success');
        const data = await response.json();
        document.getElementById('quote').innerHTML = `
            <p>"${data.content}"</p>
            <small>- ${data.author}</small>
        `;
    } catch (error) {
        console.error('Error fetching quote:', error);
    }
}

// Download report
document.getElementById('download-report').addEventListener('click', () => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const report = sessions.map(session => {
        const date = new Date(session.date).toLocaleDateString();
        const hours = Math.floor(session.duration / 3600);
        const minutes = Math.floor((session.duration % 3600) / 60);
        return `${date},${session.name},${hours}h ${minutes}m`;
    }).join('\n');

    const blob = new Blob([`Date,Session,Duration\n${report}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
});

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
saveSessionBtn.addEventListener('click', saveSession);

// Initial setup
updateStats();
updateChart();
fetchQuote();