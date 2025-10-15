const API_URL = 'https://localhost:7083/api/GameController';
const CART_API_URL = 'https://localhost:7083/api/Carts'; 
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

async function loadGames() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const gamesContainer = document.getElementById('gamesContainer');
    
    try {
        loadingIndicator.style.display = 'block';
        gamesContainer.innerHTML = '';
        
        const response = await fetch(`${API_URL}/GetAllGames`);
        
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        
        allGames = await response.json();
        
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

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    
    if (games.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-gamepad"></i>
                <h3>Игры не найдены</h3>
                <p>Попробуйте изменить поиск</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="game-card">
            <div class="game-image">
                <i class="fas fa-gamepad"></i>
            </div>
            <div class="game-content">
                <h3 class="game-title">${game.title || 'Без названия'}</h3>
                <div class="game-price">${game.price ? game.price + ' руб.' : 'Цена не указана'}</div>
                <p class="game-description">${game.description ? game.description.substring(0, 500) + '...' : 'Описание отсутствует'}</p>
                <div class="game-details">
                    <div><i class="fas fa-code"></i> ${game.developer || 'Не указан'}</div>
                    <div><i class="fas fa-building"></i> ${game.publisher || 'Не указан'}</div>
                    <div><i class="fas fa-star"></i> ${game.age_rating || 'Не указан'}</div>
                    <div><i class="fas fa-calendar"></i> ${game.release_date ? new Date(game.release_date).toLocaleDateString('ru-RU') : 'Не указана'}</div>
                </div>
                <button class="buy-button" onclick="addToCart(${game.id || game.game_id})">
                    <i class="fas fa-shopping-cart"></i> В корзину
                </button>
            </div>
        </div>
    `).join('');
}

function searchGames() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayGames(allGames);
        return;
    }
    
    const filteredGames = allGames.filter(game => 
        (game.title && game.title.toLowerCase().includes(searchTerm)) ||
        (game.developer && game.developer.toLowerCase().includes(searchTerm)) ||
        (game.publisher && game.publisher.toLowerCase().includes(searchTerm)) ||
        (game.description && game.description.toLowerCase().includes(searchTerm))
    );
    
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
        
        const response = await fetch(`${CART_API_URL}/AddToCart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `userId=${userData.id}&gameId=${gameId}&quantity=1`
        });

        if (response.ok) {
            const result = await response.json();
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
        alert('Ошибка сети при добавлении в корзину');
    }
}

async function updateCartCounter(userId) {
    try {
        const response = await fetch(`${CART_API_URL}/GetUserCart/${userId}`);
        if (response.ok) {
            const cartItems = await response.json();
            updateCartBadge(cartItems.length);
        }
    } catch (error) {
        console.error('Ошибка обновления счетчика корзины:', error);
    }
}

function updateCartBadge(count) {
    let cartLink = document.querySelector('a[href="../MyBug/MyBug.html"]');
    if (!cartLink) return;
    
    let oldBadge = cartLink.querySelector('.cart-badge');
    if (oldBadge) oldBadge.remove();
    
    if (count > 0) {
        let badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.textContent = count;
        badge.style.cssText = `
            background: #ff4444;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 12px;
            margin-left: 5px;
            display: inline-block;
            min-width: 18px;
            text-align: center;
        `;
        cartLink.appendChild(badge);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadGames();
    
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchGames();
    }); 
});