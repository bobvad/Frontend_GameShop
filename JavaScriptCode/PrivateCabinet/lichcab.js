const API_URL = 'http://192.168.0.9:5000/api';

function checkAuth() {
    const user = localStorage.getItem('user');
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');
    const guestContent = document.getElementById('guestContent');
    const authContent = document.getElementById('authContent');
    
    if (user) {
        authElements.forEach(el => el.style.display = 'block');
        guestElements.forEach(el => el.style.display = 'none');
        if (guestContent) guestContent.style.display = 'none';
        if (authContent) authContent.style.display = 'flex';
        
        try {
            const userData = JSON.parse(user);
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.login || userData.email || 'Пользователь';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        authElements.forEach(el => el.style.display = 'none');
        guestElements.forEach(el => el.style.display = 'block');
        if (guestContent) guestContent.style.display = 'block';
        if (authContent) authContent.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('purchasedGames');
    checkAuth();
    window.location.href = '/pages/Authorization.html';
}

async function loadUserData() {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
        return; 
    }

    try {
        const user = JSON.parse(userData);
        
        document.getElementById('userName').textContent = user.login || user.userName || 'Пользователь';
        document.getElementById('userEmail').textContent = user.email || 'Email не указан';
        
        if (user.dateTimeCreated) {
            const regDate = new Date(user.dateTimeCreated);
            document.getElementById('userRegistration').textContent = 
                `Зарегистрирован: ${regDate.toLocaleDateString('ru-RU')}`;
        }

        await loadUserStats(user.id);

    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

async function loadUserStats(userId) {
    try {
        const purchasesResponse = await fetch(`${API_URL}/PurchasesController/GetUserPurchases/${userId}`);
        if (purchasesResponse.ok) {
            const purchases = await purchasesResponse.json();
            document.getElementById('gamesBought').textContent = purchases.length;
            displayRecentPurchases(purchases);
        } else {
            document.getElementById('gamesBought').textContent = '0';
        }

        const cartResponse = await fetch(`${API_URL}/Carts/GetUserCart/${userId}`);
        if (cartResponse.ok) {
            const cartItems = await cartResponse.json();
            const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            document.getElementById('gamesInCart').textContent = totalItems;
            displayCartItems(cartItems);
        } else {
            document.getElementById('gamesInCart').textContent = '0';
        }

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        
        const purchasedGames = JSON.parse(localStorage.getItem('purchasedGames') || '[]');
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        
        document.getElementById('gamesBought').textContent = purchasedGames.length;
        document.getElementById('gamesInCart').textContent = cartItems.length;
        
        displayRecentPurchases(purchasedGames);
        displayCartItems(cartItems);
    }
}

function displayRecentPurchases(purchases) {
    const container = document.getElementById('recentPurchases');
    
    if (!container) return;
    
    if (!purchases || purchases.length === 0) {
        container.innerHTML = `
            <p style="color: var(--gray); text-align: center; padding: 20px;">
                У вас пока нет совершенных покупок. <a href="/pages/Catalog.html" style="color: var(--primary);">Перейти в каталог</a>
            </p>
        `;
        return;
    }
    
    const recentPurchases = purchases.slice(-3).reverse();
    
    container.innerHTML = `
        <div class="purchases-list">
            ${recentPurchases.map(purchase => `
                <div class="purchase-item">
                    <div class="purchase-game">${purchase.game?.title || purchase.title || 'Игра'}</div>
                    <div class="purchase-price">${purchase.game?.price || purchase.price || ''} руб.</div>
                    <div class="purchase-date">${new Date(purchase.purchaseDate).toLocaleDateString('ru-RU')}</div>
                </div>
            `).join('')}
        </div>
        ${purchases.length > 3 ? `
            <div style="text-align: center; margin-top: 15px;">
                <a href="/pages/MyPay/MyPurchases.html" style="color: var(--primary);">Показать все покупки (${purchases.length})</a>
            </div>
        ` : ''}
    `;
}

function displayCartItems(cartItems) {
    const container = document.getElementById('cartItems');
    
    if (!container) return;
    
    if (!cartItems || cartItems.length === 0) {
        container.innerHTML = `
            <p style="color: var(--gray); text-align: center; padding: 20px;">
                Корзина пуста. <a href="/pages/Catalog.html" style="color: var(--primary);">Добавить игры</a>
            </p>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="cart-list">
            ${cartItems.map(item => `
                <div class="cart-item">
                    <div class="cart-game-info">
                        <div class="cart-game-title">${item.game?.title || item.title || 'Игра'}</div>
                        <div class="cart-game-price">${item.game?.price || item.price || 0} руб.</div>
                        <div class="cart-game-quantity">Количество: ${item.quantity || 1}</div>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <a href="/pages/MyBug.html" class="btn-view-cart">Перейти в корзину (${cartItems.length})</a>
        </div>
    `;
}

async function removeFromCart(cartId) {
    if (!confirm('Вы уверены, что хотите удалить эту игру из корзины?')) {
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${API_URL}/Carts/RemoveFromCart/${cartId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadUserStats(user.id);
            showNotification('Игра удалена из корзины', 'success');
        } else {
            showNotification('Ошибка при удалении из корзины', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
        showNotification('Ошибка при удалении из корзины', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (localStorage.getItem('user')) {
        loadUserData();
    }
});