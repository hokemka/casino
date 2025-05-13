// DOM элементы для игры Mines
const minesGrid = document.querySelector('.mines-grid');
const minesBetInput = document.getElementById('mines-bet');
const minesPlayBtn = document.getElementById('mines-play-btn');
const minesOptions = document.querySelectorAll('.mines-option');
const minesResult = document.getElementById('mines-result');
const minesWinAmount = document.getElementById('mines-win-amount');
const minesPlayAgainBtns = document.querySelectorAll('.btn-play-again');

// Переменные игры
let minesGameActive = false;
let minesBombCount = 3; // Значение по умолчанию
let minesSelectedTiles = [];
let minesBombPositions = [];
let minesCurrentBet = 0;

// Инициализация игры Mines
function initMinesGame() {
    // Создаем сетку 5x5
    createMinesGrid();
    
    // Устанавливаем обработчики событий
    minesPlayBtn.addEventListener('click', startMinesGame);
    
    // Обработчики для выбора количества бомб
    minesOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Убираем активный класс у всех опций
            minesOptions.forEach(opt => opt.classList.remove('active'));
            
            // Добавляем активный класс выбранной опции
            option.classList.add('active');
            
            // Устанавливаем количество бомб
            minesBombCount = parseInt(option.getAttribute('data-mines'));
        });
    });
    
    // Обработчики для кнопок "Играть снова"
    minesPlayAgainBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            minesResult.style.display = 'none';
            resetMinesGame();
        });
    });
}

// Создание сетки для игры Mines
function createMinesGrid() {
    minesGrid.innerHTML = '';
    
    // Создаем 25 ячеек (5x5)
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'mines-tile';
        tile.setAttribute('data-index', i);
        
        // Обработчик клика по ячейке
        tile.addEventListener('click', () => handleMinesTileClick(i, tile));
        
        minesGrid.appendChild(tile);
    }
}

// Запуск игры Mines
async function startMinesGame() {
    // Получаем ставку
    const betAmount = parseFloat(minesBetInput.value);
    
    // Проверяем корректность ставки
    if (isNaN(betAmount) || betAmount <= 0) {
        alert('Пожалуйста, введите корректную ставку.');
        return;
    }
    
    // Проверяем достаточно ли баланса
    if (betAmount > currentUser.balance) {
        alert('Недостаточно средств на балансе.');
        return;
    }
    
    try {
        // Отправляем запрос на сервер для размещения ставки
        const response = await fetch(`${API_URL}/api/games/mines/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                bet_amount: betAmount,
                bombs_count: minesBombCount,
                selected_tiles: []
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to place bet');
        }
        
        const data = await response.json();
        
        // Обновляем баланс пользователя
        currentUser.balance = data.new_balance;
        updateUserDisplay();
        
        // Сохраняем текущую ставку
        minesCurrentBet = betAmount;
        
        // Активируем игру
        minesGameActive = true;
        minesSelectedTiles = [];
        
        // Отключаем кнопку игры и ввод ставки
        minesPlayBtn.disabled = true;
        minesBetInput.disabled = true;
        minesOptions.forEach(option => option.disabled = true);
        
        // Сбрасываем сетку
        resetMinesGrid();
    } catch (error) {
        console.error('Error starting Mines game:', error);
        alert('Ошибка при запуске игры. Попробуйте позже.');
    }
}

// Обработка клика по ячейке в игре Mines
async function handleMinesTileClick(index, tile) {
    // Проверяем, активна ли игра
    if (!minesGameActive || minesSelectedTiles.includes(index)) {
        return;
    }
    
    // Добавляем ячейку в выбранные
    minesSelectedTiles.push(index);
    
    try {
        // Отправляем запрос на сервер для проверки результата
        const response = await fetch(`${API_URL}/api/games/mines/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                bet_amount: minesCurrentBet,
                bombs_count: minesBombCount,
                selected_tiles: minesSelectedTiles
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to process move');
        }
        
        const data = await response.json();
        
        // Обновляем баланс пользователя
        currentUser.balance = data.new_balance;
        updateUserDisplay();
        
        if (data.hit_bomb) {
            // Игрок попал на бомбу
            minesBombPositions = data.bomb_positions;
            tile.classList.add('revealed', 'bomb');
            tile.innerHTML = '💣';
            
            // Показываем все бомбы
            revealAllMines();
            
            // Показываем результат игры
            showMinesResult(false, 0);
            
            // Завершаем игру
            endMinesGame();
        } else {
            // Игрок нашел алмаз
            tile.classList.add('revealed', 'diamond');
            tile.innerHTML = '💎';
            
            // Если все безопасные ячейки открыты, игрок выиграл
            if (minesSelectedTiles.length >= 25 - minesBombCount) {
                showMinesResult(true, data.win_amount);
                endMinesGame();
            }
        }
    } catch (error) {
        console.error('Error processing move:', error);
        alert('Ошибка при обработке хода. Попробуйте позже.');
    }
}

// Показ результата игры Mines
function showMinesResult(isWin, winAmount) {
    minesResult.style.display = 'block';
    
    // Скрываем оба контента
    document.querySelector('.result-content.win').style.display = 'none';
    document.querySelector('.result-content.lose').style.display = 'none';
    
    if (isWin) {
        document.querySelector('.result-content.win').style.display = 'block';
        minesWinAmount.textContent = formatCurrency(winAmount);
    } else {
        document.querySelector('.result-content.lose').style.display = 'block';
    }
}

// Открытие всех бомб
function revealAllMines() {
    minesBombPositions.forEach(index => {
        const tile = document.querySelector(`.mines-tile[data-index="${index}"]`);
        if (!tile.classList.contains('revealed')) {
            tile.classList.add('revealed', 'bomb');
            tile.innerHTML = '💣';
        }
    });
}

// Завершение игры Mines
function endMinesGame() {
    minesGameActive = false;
}

// Сброс игровой сетки Mines
function resetMinesGrid() {
    const tiles = document.querySelectorAll('.mines-tile');
    tiles.forEach(tile => {
        tile.classList.remove('revealed', 'diamond', 'bomb');
        tile.innerHTML = '';
    });
}

// Полный сброс игры Mines
function resetMinesGame() {
    minesGameActive = false;
    minesSelectedTiles = [];
    minesBombPositions = [];
    
    // Сбрасываем сетку
    resetMinesGrid();
    
    // Включаем элементы управления
    minesPlayBtn.disabled = false;
    minesBetInput.disabled = false;
    minesOptions.forEach(option => option.disabled = false);
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', initMinesGame); 
