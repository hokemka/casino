// DOM элементы для игры Crash
const crashChartElement = document.getElementById('crash-chart');
const crashMultiplier = document.getElementById('crash-multiplier');
const crashBetInput = document.getElementById('crash-bet');
const crashAutoInput = document.getElementById('crash-auto');
const crashPlayBtn = document.getElementById('crash-play-btn');
const crashCashoutBtn = document.getElementById('crash-cashout-btn');
const crashHistory = document.querySelector('.history-values');

// Переменные игры
let crashGameActive = false;
let crashGameId = null;
let crashCurrentBet = 0;
let crashAutoValue = 0;
let crashCurrentMultiplier = 1.0;
let crashInterval = null;
let crashChart = null;
let crashHistoryValues = [];

// Инициализация игры Crash
function initCrashGame() {
    // Инициализируем график
    initCrashChart();
    
    // Загружаем историю игр
    loadCrashHistory();
    
    // Устанавливаем обработчики событий
    crashPlayBtn.addEventListener('click', startCrashGame);
    crashCashoutBtn.addEventListener('click', crashCashout);
}

// Инициализация графика для игры Crash
function initCrashChart() {
    const ctx = crashChartElement.getContext('2d');
    
    crashChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Множитель',
                data: [],
                borderColor: '#2481cc',
                borderWidth: 3,
                tension: 0.2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    min: 1,
                    ticks: {
                        color: '#999999'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            animation: false
        }
    });
}

// Загрузка истории игр Crash
async function loadCrashHistory() {
    try {
        // В реальном проекте здесь должен быть запрос к API
        // Для демонстрации генерируем случайные значения
        crashHistoryValues = [];
        
        for (let i = 0; i < 10; i++) {
            const random = Math.random();
            let value;
            
            if (random > 0.8) { // 20% шанс на высокое значение
                value = (1 + Math.random() * 5).toFixed(2);
            } else if (random > 0.4) { // 40% шанс на среднее значение
                value = (1 + Math.random() * 2).toFixed(2);
            } else { // 40% шанс на низкое значение
                value = (1 + Math.random()).toFixed(2);
            }
            
            crashHistoryValues.push(parseFloat(value));
        }
        
        // Отображаем историю
        updateCrashHistory();
    } catch (error) {
        console.error('Error loading crash history:', error);
    }
}

// Обновление отображения истории игр Crash
function updateCrashHistory() {
    // Очищаем контейнер истории
    crashHistory.innerHTML = '';
    
    // Добавляем значения из истории
    crashHistoryValues.forEach(value => {
        const valueEl = document.createElement('div');
        valueEl.className = 'history-value';
        
        // Определяем класс в зависимости от значения
        if (value < 2) {
            valueEl.classList.add('low');
        } else if (value < 5) {
            valueEl.classList.add('medium');
        } else {
            valueEl.classList.add('high');
        }
        
        valueEl.textContent = `${value}×`;
        crashHistory.appendChild(valueEl);
    });
}

// Запуск игры Crash
async function startCrashGame() {
    // Получаем ставку и значение автоматического вывода
    const betAmount = parseFloat(crashBetInput.value);
    const autoCashout = parseFloat(crashAutoInput.value);
    
    // Проверяем корректность ставки
    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Пожалуйста, введите корректную ставку.');
        return;
    }
    
    // Проверяем корректность автоматического вывода
    if (isNaN(autoCashout) || autoCashout < 1.1) {
        alert('Значение автоматического вывода должно быть не менее 1.1×.');
        return;
    }
    
    // Проверяем достаточно ли баланса
    if (betAmount > currentUser.balance) {
        alert('Недостаточно средств на балансе.');
        return;
    }
    
    try {
        // Сначала генерируем игру
        const genResponse = await fetch(`${API_URL}/api/games/crash/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id
            })
        });
        
        if (!genResponse.ok) {
            throw new Error('Failed to generate game');
        }
        
        const genData = await genResponse.json();
        crashGameId = genData.game_id;
        const crashPoint = genData.crash_point;
        
        console.log('Game generated, crash point:', crashPoint);
        
        // Затем размещаем ставку
        const betResponse = await fetch(`${API_URL}/api/games/crash/bet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                bet_amount: betAmount,
                auto_cashout: autoCashout,
                game_id: crashGameId
            })
        });
        
        if (!betResponse.ok) {
            throw new Error('Failed to place bet');
        }
        
        const betData = await betResponse.json();
        
        // Обновляем баланс пользователя
        currentUser.balance = betData.new_balance;
        updateUserDisplay();
        
        // Сохраняем текущую ставку и значение автоматического вывода
        crashCurrentBet = betAmount;
        crashAutoValue = autoCashout;
        
        // Активируем игру
        crashGameActive = true;
        crashCurrentMultiplier = 1.0;
        
        // Отключаем кнопку игры и ввод ставки
        crashPlayBtn.disabled = true;
        crashBetInput.disabled = true;
        crashAutoInput.disabled = true;
        
        // Включаем кнопку вывода
        crashCashoutBtn.disabled = false;
        
        // Сбрасываем график
        resetCrashChart();
        
        // Запускаем анимацию
        startCrashAnimation(crashPoint);
    } catch (error) {
        console.error('Error starting Crash game:', error);
        alert('Ошибка при запуске игры. Попробуйте позже.');
    }
}

// Запуск анимации Crash
function startCrashAnimation(crashPoint) {
    let startTime = Date.now();
    let lastUpdateTime = startTime;
    let elapsed = 0;
    const fps = 30; // Кадров в секунду
    const interval = 1000 / fps;
    
    const chartLabels = [];
    const chartData = [];
    
    // Функция обновления анимации
    const updateAnimation = () => {
        const currentTime = Date.now();
        const delta = currentTime - lastUpdateTime;
        
        if (delta > interval) {
            lastUpdateTime = currentTime;
            elapsed = (currentTime - startTime) / 1000;
            
            // Вычисляем текущий множитель
            // Используем экспоненциальную функцию для более реалистичного роста
            crashCurrentMultiplier = Math.pow(Math.E, 0.1 * elapsed);
            crashCurrentMultiplier = Math.round(crashCurrentMultiplier * 100) / 100;
            
            // Обновляем отображение множителя
            crashMultiplier.textContent = `${crashCurrentMultiplier.toFixed(2)}×`;
            
            // Обновляем график
            chartLabels.push(elapsed.toFixed(1));
            chartData.push(crashCurrentMultiplier);
            
            crashChart.data.labels = chartLabels;
            crashChart.data.datasets[0].data = chartData;
            crashChart.update('none');
            
            // Проверяем условие автоматического вывода
            if (crashCurrentMultiplier >= crashAutoValue && crashGameActive) {
                crashCashout();
            }
            
            // Проверяем условие завершения игры
            if (crashCurrentMultiplier >= crashPoint) {
                endCrashGame(false);
            }
        }
        
        if (crashGameActive) {
            requestAnimationFrame(updateAnimation);
        }
    };
    
    // Запускаем анимацию
    requestAnimationFrame(updateAnimation);
}

// Вывод средств в игре Crash
async function crashCashout() {
    if (!crashGameActive) return;
    
    try {
        // Отправляем запрос на сервер для вывода средств
        const response = await fetch(`${API_URL}/api/games/crash/cashout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                game_id: crashGameId,
                multiplier: crashCurrentMultiplier
            })
        });
        
        // Получаем ответ от сервера
        const data = await response.json();
        
        // Если успешно выведено
        if (data.success) {
            // Обновляем баланс
            currentUser.balance = data.new_balance;
            updateUserDisplay();
            
            // Показываем результат
            alert(`Успешно! Выигрыш: ${formatCurrency(data.win_amount)} USDT`);
        } else {
            alert(data.error || 'Не удалось вывести средства');
        }
        
        // Завершаем игру
        endCrashGame(true);
    } catch (error) {
        console.error('Error during cashout:', error);
        alert('Ошибка при выводе средств. Попробуйте позже.');
    }
}

// Завершение игры Crash
function endCrashGame(success) {
    // Останавливаем игру
    crashGameActive = false;
    
    // Отключаем кнопку вывода
    crashCashoutBtn.disabled = true;
    
    // Выделяем график красным, если обвал
    if (!success) {
        crashChart.data.datasets[0].borderColor = '#ff3b30';
        crashChart.update('none');
        
        // Показываем сообщение о проигрыше
        setTimeout(() => {
            alert('Обвал! Вы проиграли.');
        }, 500);
    }
    
    // Добавляем результат в историю
    crashHistoryValues.unshift(crashCurrentMultiplier);
    if (crashHistoryValues.length > 10) {
        crashHistoryValues.pop();
    }
    updateCrashHistory();
    
    // Сброс игры через 2 секунды
    setTimeout(resetCrashGame, 2000);
}

// Сброс графика Crash
function resetCrashChart() {
    crashChart.data.labels = [];
    crashChart.data.datasets[0].data = [];
    crashChart.data.datasets[0].borderColor = '#2481cc';
    crashChart.update('none');
    
    crashMultiplier.textContent = '1.00×';
}

// Полный сброс игры Crash
function resetCrashGame() {
    // Сбрасываем график
    resetCrashChart();
    
    // Включаем элементы управления
    crashPlayBtn.disabled = false;
    crashBetInput.disabled = false;
    crashAutoInput.disabled = false;
    
    // Отключаем кнопку вывода
    crashCashoutBtn.disabled = true;
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initCrashGame); 
