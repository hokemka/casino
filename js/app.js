// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Применение темы Telegram
document.body.classList.add(tg.colorScheme === 'dark' ? 'tg-theme-dark' : 'tg-theme-light');

// Основные переменные приложения
const API_URL = 'http://localhost:8080'; // Замените на реальный URL вашего API
let currentUser = {
    id: null,
    username: '',
    first_name: '',
    balance: 0
};

// DOM элементы
const welcomeMessageEl = document.getElementById('welcome-message');
const userPhotoEl = document.getElementById('user-photo');
const userNameEl = document.getElementById('user-name');
const userBalanceEl = document.getElementById('user-balance');
const depositBtn = document.getElementById('deposit-btn');
const depositModal = document.getElementById('deposit-modal');
const closeBtn = document.querySelector('.close-btn');
const depositForm = document.getElementById('deposit-form');
const gameTabs = document.querySelectorAll('.game-tab');
const games = document.querySelectorAll('.game');

// Получение параметров из URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || tg.initDataUnsafe?.user?.id;

// Инициализация приложения
async function initApp() {
    // Проверяем, что userId существует
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    // Устанавливаем userId в объект пользователя
    currentUser.id = userId;

    // Загружаем данные профиля пользователя
    await loadUserProfile();
    
    // Инициализируем обработчики событий
    initEventListeners();
    
    // Устанавливаем приветственное сообщение
    setWelcomeMessage();
    
    // Добавляем анимации при загрузке
    addInitialAnimations();
    
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
    
    const userName = currentUser.first_name || 'Гость';
    welcomeMessageEl.textContent = `${greeting}, ${userName}!`;
    
    // Добавляем анимацию к приветственному сообщению
    welcomeMessageEl.style.opacity = '0';
    setTimeout(() => {
        welcomeMessageEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        welcomeMessageEl.style.opacity = '1';
        welcomeMessageEl.style.transform = 'translateY(0)';
    }, 100);
}

// Добавление начальных анимаций элементам
function addInitialAnimations() {
    const elements = [
        document.querySelector('.game-nav'),
        document.querySelector('.game-container'),
        document.getElementById('profile-info')
    ];
    
    elements.forEach((element, index) => {
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 200 + (index * 150));
        }
    });
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load user profile');
        }
        
        const data = await response.json();
        
        // Обновляем данные пользователя
        currentUser = {
            id: data.user_id,
            username: data.username,
            first_name: data.first_name,
            balance: data.balance
        };
        
        // Обновляем отображение
        updateUserDisplay();
    } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Используем данные из Telegram, если доступны
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            currentUser.first_name = user.first_name;
            currentUser.username = user.username;
            
            // Обновляем отображение
            updateUserDisplay();
        }
    }
}

// Обновление отображения данных пользователя
function updateUserDisplay() {
    userNameEl.textContent = currentUser.first_name || 'Игрок';
    userBalanceEl.textContent = formatCurrency(currentUser.balance);
    
    // Если есть фото в Telegram, используем его
    if (tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.photo_url) {
        userPhotoEl.src = tg.initDataUnsafe.user.photo_url;
    }
}

// Форматирование валюты
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

// Переключение между играми
function switchGame(gameType) {
    // Убираем активный класс у всех вкладок и игр
    gameTabs.forEach(tab => tab.classList.remove('active'));
    games.forEach(game => {
        game.classList.remove('active');
        game.style.display = 'none';
    });
    
    // Добавляем активный класс нужной вкладке
    const activeTab = document.querySelector(`.game-tab[data-game="${gameType}"]`);
    activeTab.classList.add('active');
    
    // Анимированно показываем нужную игру
    const activeGame = document.getElementById(`${gameType}-game`);
    activeGame.style.opacity = '0';
    activeGame.style.transform = 'translateY(20px)';
    activeGame.style.display = 'block';
    
    setTimeout(() => {
        activeGame.classList.add('active');
        activeGame.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        activeGame.style.opacity = '1';
        activeGame.style.transform = 'translateY(0)';
    }, 50);
}

// Открытие модального окна пополнения
function openDepositModal() {
    depositModal.style.display = 'block';
    
    const modalContent = depositModal.querySelector('.modal-content');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
        modalContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
}

// Закрытие модального окна
function closeModal() {
    const modalContent = depositModal.querySelector('.modal-content');
    modalContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
        depositModal.style.display = 'none';
    }, 300);
    
    // Закрываем окно результата игры
    const minesResult = document.getElementById('mines-result');
    if (minesResult.style.display === 'block') {
        minesResult.style.opacity = '0';
        setTimeout(() => {
            minesResult.style.display = 'none';
        }, 300);
    }
}

// Обработка пополнения
async function handleDeposit(amount) {
    try {
        const response = await fetch(`${API_URL}/api/payment/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                amount: amount
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment');
        }
        
        const data = await response.json();
        
        // Открываем ссылку на оплату
        if (data.payment_url) {
            window.open(data.payment_url, '_blank');
            
            // Закрываем модальное окно
            closeModal();
            
            // Отправляем данные в родительское приложение Telegram
            tg.sendData(JSON.stringify({
                action: 'payment_created',
                payment_id: data.payment_id,
                amount: data.amount
            }));
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        alert('Ошибка при создании платежа. Попробуйте позже.');
    }
}

// Отправка сообщения в родительское приложение
function sendMessageToBot(message) {
    tg.sendData(JSON.stringify(message));
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Переключение между играми
    gameTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const gameType = tab.getAttribute('data-game');
            switchGame(gameType);
        });
    });
    
    // Открытие модального окна пополнения
    depositBtn.addEventListener('click', openDepositModal);
    
    // Закрытие модальных окон
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === depositModal) {
            closeModal();
        }
    });
    
    // Добавляем эффект ripple для кнопок
    const buttons = document.querySelectorAll('.btn-play, .btn-cashout, .btn-play-again, .btn-deposit-submit');
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
    
    // Обработка формы пополнения
    depositForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        
        if (isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, введите корректную сумму.');
            return;
        }
        
        handleDeposit(amount);
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp); 
