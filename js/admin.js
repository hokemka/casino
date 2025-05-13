// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Применение темы Telegram
document.body.classList.add(tg.colorScheme === 'dark' ? 'tg-theme-dark' : 'tg-theme-light');

// Основные переменные приложения
const API_URL = 'http://localhost:8080'; // Замените на реальный URL вашего API
let selectedUser = null;

// DOM элементы
const welcomeMessageEl = document.getElementById('welcome-message');
const totalUsersEl = document.getElementById('total-users');
const totalBetsEl = document.getElementById('total-bets');
const totalWinsEl = document.getElementById('total-wins');
const casinoProfitEl = document.getElementById('casino-profit');
const userSearchInput = document.getElementById('user-search');
const searchBtn = document.getElementById('search-btn');
const userListEl = document.getElementById('user-list');
const editUserNameEl = document.getElementById('edit-user-name');
const editUserIdEl = document.getElementById('edit-user-id');
const editUserBalanceEl = document.getElementById('edit-user-balance');
const balanceAmountInput = document.getElementById('balance-amount');
const addBalanceBtn = document.getElementById('add-balance');
const subtractBalanceBtn = document.getElementById('subtract-balance');
const setBalanceBtn = document.getElementById('set-balance');
const gamesStatsEl = document.getElementById('games-stats');

// Получение параметров из URL
const urlParams = new URLSearchParams(window.location.search);
const adminId = urlParams.get('admin_id');

// Инициализация приложения
async function initAdminApp() {
    // Проверяем, что adminId существует
    if (!adminId) {
        console.error('Admin ID not found');
        alert('Доступ запрещен: Не указан ID администратора');
        return;
    }

    // Устанавливаем приветственное сообщение
    setWelcomeMessage();

    // Добавляем начальные анимации
    addInitialAnimations();

    // Загружаем статистику
    await loadStats();
    
    // Инициализируем обработчики событий
    initEventListeners();
    
    // Уведомляем Telegram, что приложение готово
    tg.ready();
}

// Установка приветственного сообщения в зависимости от времени суток
function setWelcomeMessage() {
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Доброе утро';
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Добрый день';
    } else if (currentHour >= 18 && currentHour < 23) {
        greeting = 'Добрый вечер';
    } else {
        greeting = 'Доброй ночи';
    }
    
    // Получаем имя администратора из Telegram, если доступно
    let adminName = 'Администратор';
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        adminName = tg.initDataUnsafe.user.first_name || 'Администратор';
    }
    
    welcomeMessageEl.textContent = `${greeting}, ${adminName}!`;
}

// Добавление начальных анимаций элементам
function addInitialAnimations() {
    // Последовательно анимируем секции
    const sections = document.querySelectorAll('.admin-section');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 + (index * 200));
    });
    
    // Анимируем приветственное сообщение
    welcomeMessageEl.style.opacity = '0';
    setTimeout(() => {
        welcomeMessageEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        welcomeMessageEl.style.opacity = '1';
    }, 100);
}

// Загрузка общей статистики
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats?admin_id=${adminId}`);
        
        if (!response.ok) {
            if (response.status === 403) {
                alert('Доступ запрещен: Недостаточно прав');
                return;
            }
            throw new Error('Failed to load stats');
        }
        
        const data = await response.json();
        
        // Обновляем отображение статистики
        updateStatsDisplay(data);
    } catch (error) {
        console.error('Error loading stats:', error);
        alert('Ошибка при загрузке статистики');
    }
}

// Обновление отображения статистики
function updateStatsDisplay(data) {
    // Обновляем общую статистику
    totalUsersEl.textContent = data.total_users;
    totalBetsEl.textContent = `${formatCurrency(data.total_bets_amount)} USDT`;
    totalWinsEl.textContent = `${formatCurrency(data.total_wins_amount)} USDT`;
    casinoProfitEl.textContent = `${formatCurrency(data.casino_profit)} USDT`;
    
    // Обновляем статистику по играм
    gamesStatsEl.innerHTML = '';
    
    for (const [gameType, stats] of Object.entries(data.games_stats)) {
        const gameStatItem = document.createElement('div');
        gameStatItem.className = 'game-stat-item';
        
        // Преобразуем название игры для отображения
        let gameName = gameType;
        if (gameType === 'mines') {
            gameName = 'Mines';
        } else if (gameType === 'crash_generated') {
            gameName = 'Crash (Сгенерировано)';
        } else if (gameType === 'crash') {
            gameName = 'Crash';
        }
        
        gameStatItem.innerHTML = `
            <div class="game-stat-header">
                <div class="game-name">${gameName}</div>
                <div class="game-count">${stats.count} игр</div>
            </div>
            <div class="game-details">
                <div class="game-detail-item">Ставки: <span>${formatCurrency(stats.bets_amount)} USDT</span></div>
                <div class="game-detail-item">Выигрыши: <span>${formatCurrency(stats.wins_amount)} USDT</span></div>
                <div class="game-detail-item">Прибыль: <span>${formatCurrency(stats.profit)} USDT</span></div>
            </div>
        `;
        
        gamesStatsEl.appendChild(gameStatItem);
    }
}

// Поиск пользователей
async function searchUsers(searchTerm) {
    try {
        const response = await fetch(`${API_URL}/api/admin/users?admin_id=${adminId}&search=${searchTerm}`);
        
        if (!response.ok) {
            if (response.status === 403) {
                alert('Доступ запрещен: Недостаточно прав');
                return;
            }
            throw new Error('Failed to search users');
        }
        
        const users = await response.json();
        
        // Обновляем список пользователей
        updateUserList(users);
    } catch (error) {
        console.error('Error searching users:', error);
        alert('Ошибка при поиске пользователей');
    }
}

// Обновление списка пользователей
function updateUserList(users) {
    userListEl.innerHTML = '';
    
    if (users.length === 0) {
        const noUsers = document.createElement('div');
        noUsers.className = 'user-item';
        noUsers.textContent = 'Пользователи не найдены';
        userListEl.appendChild(noUsers);
        return;
    }
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.setAttribute('data-user-id', user.user_id);
        
        userItem.innerHTML = `
            <div class="user-info-column">
                <div class="user-name">${user.first_name || 'Без имени'}</div>
                <div class="user-id">ID: ${user.user_id} ${user.username ? `(@${user.username})` : ''}</div>
            </div>
            <div class="user-balance">${formatCurrency(user.balance)} USDT</div>
        `;
        
        // Обработчик клика
        userItem.addEventListener('click', () => selectUser(user));
        
        userListEl.appendChild(userItem);
    });
}

// Выбор пользователя
function selectUser(user) {
    selectedUser = user;
    
    // Обновляем отображение выбранного пользователя
    editUserNameEl.textContent = user.first_name || 'Без имени';
    editUserIdEl.textContent = user.user_id;
    editUserBalanceEl.textContent = `${formatCurrency(user.balance)} USDT`;
    
    // Подсвечиваем выбранного пользователя
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        if (item.getAttribute('data-user-id') == user.user_id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Изменение баланса пользователя
async function updateUserBalance(operation) {
    // Проверяем, выбран ли пользователь
    if (!selectedUser) {
        alert('Сначала выберите пользователя');
        return;
    }
    
    // Получаем сумму
    const amount = parseFloat(balanceAmountInput.value);
    
    // Проверяем корректность суммы
    if (isNaN(amount) || amount < 0) {
        alert('Введите корректную сумму');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/admin/update_balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_id: adminId,
                user_id: selectedUser.user_id,
                amount: amount,
                operation: operation
            })
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                alert('Доступ запрещен: Недостаточно прав');
                return;
            }
            throw new Error('Failed to update balance');
        }
        
        const data = await response.json();
        
        // Обновляем баланс выбранного пользователя
        selectedUser.balance = data.new_balance;
        editUserBalanceEl.textContent = `${formatCurrency(data.new_balance)} USDT`;
        
        // Обновляем баланс в списке пользователей
        const userItem = document.querySelector(`.user-item[data-user-id="${selectedUser.user_id}"]`);
        if (userItem) {
            const balanceEl = userItem.querySelector('.user-balance');
            if (balanceEl) {
                balanceEl.textContent = `${formatCurrency(data.new_balance)} USDT`;
            }
        }
        
        // Сбрасываем поле ввода суммы
        balanceAmountInput.value = 0;
        
        // Показываем сообщение об успехе
        alert(`Баланс пользователя успешно изменен`);
    } catch (error) {
        console.error('Error updating balance:', error);
        alert('Ошибка при изменении баланса');
    }
}

// Форматирование валюты
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Поиск пользователей
    searchBtn.addEventListener('click', () => {
        const searchTerm = userSearchInput.value.trim();
        searchUsers(searchTerm);
    });
    
    // Поиск при нажатии Enter
    userSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = userSearchInput.value.trim();
            searchUsers(searchTerm);
        }
    });
    
    // Обработчики кнопок изменения баланса
    addBalanceBtn.addEventListener('click', () => updateUserBalance('add'));
    subtractBalanceBtn.addEventListener('click', () => updateUserBalance('subtract'));
    setBalanceBtn.addEventListener('click', () => updateUserBalance('set'));
    
    // Добавляем эффект ripple для кнопок
    const buttons = document.querySelectorAll('.operation-btn, .search-container button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Начальный поиск пользователей
    searchUsers('');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initAdminApp); 
