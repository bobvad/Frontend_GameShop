const API_URL = 'http://192.168.0.9:5000/api/GameController';
const CART_API_URL = 'http://192.168.0.9:5000/api/Carts';
const GAME_GENRE_API_URL = 'http://192.168.0.9:5000/api/GameGenreController';
let allGames = [];

function checkAuth() {
    const user = localStorage.getItem('user');
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');
    
    if (user) {
        authElements.forEach(el => el.style.display = 'block');
        guestElements.forEach(el => el.style.display = 'none');
        
        const userData = JSON.parse(user);
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = userData.login || userData.email || 'Пользователь';
         }
         updateCartCounter(userData.id);
        } 
        else 
        {
         authElements.forEach(el => el.style.display = 'none');
         guestElements.forEach(el => el.style.display = 'block');
        }
}

function logout() {
    localStorage.removeItem('user');
    checkAuth();
    window.location.href = '../GlavnaiPage/index.html'; 
}

async function loadGamesData() {
    const response = await fetch(`${GAME_GENRE_API_URL}/GetAllGamesWithGenres`);
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    allGames = await response.json();
    console.log('Загруженные игры с жанрами:', allGames);
}

async function loadGames() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const gamesContainer = document.getElementById('gamesContainer');
    
    try {
        loadingIndicator.style.display = 'block';
        gamesContainer.innerHTML = '';
        
        await loadGamesData();
        
        console.log('Загруженные игры:', allGames);
        if (allGames.length > 0) {
            console.log('Структура первой игры:', allGames[0]);
            console.log('Доступные поля:', Object.keys(allGames[0]));
        }
        
        displayGames(allGames);
        
    } catch (error) {
        gamesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function getGameGenres(game) {
    if (game.genres && Array.isArray(game.genres)) {
        return game.genres;
    }
    
    return ['Жанр не указан'];
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-gamepad"></i>
                <h3>Игры не найдены</h3>
                <p>Попробуйте изменить поиск</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map(game => {
        console.log('Game data:', game);
        
        const title = game.title || 'Без названия';
        const price = game.price ? game.price + ' руб.' : 'Цена не указана';
        const description = game.description ? 
            (game.description.length > 150 ? game.description.substring(0, 150) + '...' : game.description) 
            : 'Описание отсутствует';
        const developer = game.developer || 'Не указан';
        const publisher = game.publisher || 'Не указан';
        const ageRating = game.ageRating || 'Не указан';
        const releaseDate = game.releaseDate ? 
            new Date(game.releaseDate).toLocaleDateString('ru-RU') : 
            'Не указана';
        const gameId = game.id; 

        const genres = getGameGenres(game);
        const genresHtml = genres.map(genre => 
            `<span class="genre-tag">${escapeHtml(genre)}</span>`
        ).join('');

        return `
        <div class="game-card">
            <div class="game-content">
                <h3 class="game-title">${escapeHtml(title)}</h3>
                <div class="game-price">${price}</div>
                
                <!-- Блок с жанрами -->
                <div class="game-genres">
                    <strong><i class="fas fa-tags"></i> Жанры:</strong>
                    <div class="genres-container">
                        ${genresHtml}
                    </div>
                </div>
                
                <p class="game-description">${escapeHtml(description)}</p>
                <div class="game-details">
                    <div><i class="fas fa-code"></i> Разработчик: ${escapeHtml(developer)}</div>
                    <div><i class="fas fa-building"></i> Издатель: ${escapeHtml(publisher)}</div>
                    <div><i class="fas fa-star"></i> Возрастной рейтинг: ${escapeHtml(ageRating)}</div>
                    <div><i class="fas fa-calendar"></i> Дата выхода: ${releaseDate}</div>
                </div>
                <button class="buy-button" onclick="addToCart(${gameId})">
                    <i class="fas fa-shopping-cart"></i> В корзину
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function searchGames() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayGames(allGames);
        return;
    }
    
    const filteredGames = allGames.filter(game => {
        const gameGenresList = getGameGenres(game);
        
        return (
            (game.title && game.title.toLowerCase().includes(searchTerm)) ||
            (game.developer && game.developer.toLowerCase().includes(searchTerm)) ||
            (game.publisher && game.publisher.toLowerCase().includes(searchTerm)) ||
            (game.description && game.description.toLowerCase().includes(searchTerm)) ||
            gameGenresList.some(genre => genre.toLowerCase().includes(searchTerm))
        );
    });
    
    displayGames(filteredGames);
}

async function addToCart(gameId) {
    const user = localStorage.getItem('user');
    if (!user) {
        alert('Пожалуйста, войдите в систему чтобы добавить игру в корзину');
        window.location.href = '../AuthorizationRegistration/Authorization.html';
        return;
    }

    if (!gameId || gameId === 'undefined') {
        console.error('GameId is undefined or invalid:', gameId);
        alert('Ошибка: ID игры не определен');
        return;
    }

    try {
        const userData = JSON.parse(user);
        console.log(`Добавление в корзину: UserId=${userData.id}, GameId=${gameId}`);
        
        const formData = new FormData();
        formData.append('userId', userData.id);
        formData.append('gameId', gameId);
        formData.append('quantity', '1');

        console.log('Отправка FormData...');

        const response = await fetch(`${CART_API_URL}/AddToCart`, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Успешно добавлено в корзину:', result);
            alert('Игра успешно добавлена в корзину!');
            updateCartCounter(userData.id);
        } else if (response.status === 409) {
            alert('Эта игра уже находится в вашей корзине!');
        } else {
            const errorText = await response.text();
            console.error('Ошибка сервера:', errorText);
            alert('Ошибка при добавлении в корзину: ' + errorText);
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        alert('Ошибка сети при добавлении в корзину: ' + error.message);
    }
}

function updateCartBadge(count) {
    let cartLink = document.querySelector('a[href="../MyBug/MyBug.html"]');
    if (!cartLink) return;
    
    let oldBadge = cartLink.querySelector('.cart-badge');
    if (oldBadge) oldBadge.remove();
    
  
}

async function updateCartCounter(userId) {
    try {
        const response = await fetch(`${CART_API_URL}/GetUserCart/${userId}`);
        if (response.ok) {
            const cartItems = await response.json();
            const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            updateCartBadge(totalItems);
        }
    } catch (error) {
        console.error('Ошибка при обновлении счетчика корзины:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadGames(); 
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchGames();
        });
    }
});