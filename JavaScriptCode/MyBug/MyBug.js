const CART_API_URL = 'http://192.168.0.9:5000/api/Carts';
const PURCHASE_API_URL = 'http://192.168.0.9:5000/api/PurchasesController';

function checkAuth() {
    const user = localStorage.getItem('user');
    const authElements = document.querySelectorAll('.auth-only');
    const guestElements = document.querySelectorAll('.guest-only');
    
    if (user) {
        authElements.forEach(el => el.style.display = 'block');
        guestElements.forEach(el => el.style.display = 'none');
        
        try {
            const userData = JSON.parse(user);
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.login || userData.email || 'Пользователь';
            }
            loadCartFromServer(userData.id);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        
    } else {
        authElements.forEach(el => el.style.display = 'none');
        guestElements.forEach(el => el.style.display = 'block');
    }
}

async function loadCartFromServer(userId) {
    const cartContent = document.getElementById('cartContent');
    
    try {
        cartContent.innerHTML = `
            <div class="loading-cart">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Загрузка корзины...</span>
            </div>
        `;
        
        const response = await fetch(`${CART_API_URL}/GetUserCart/${userId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showEmptyCart();
                return;
            }
            throw new Error(`Ошибка: ${response.status}`);
        }
        
        const cartItems = await response.json();
        displayCartItems(cartItems);
        
    } catch (error) {
        cartContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки корзины</h3>
                <p>${error.message}</p>
                <button onclick="loadCartFromServer(${userId})" class="retry-btn">
                    <i class="fas fa-redo"></i>
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

function displayCartItems(cartItems) {
    const cartContent = document.getElementById('cartContent');
    
    if (!cartItems || cartItems.length === 0) {
        showEmptyCart();
        return;
    }
    
    const total = cartItems.reduce((sum, item) => {
        const itemTotal = (item.game?.price || 0) * (item.quantity || 1);
        return sum + itemTotal;
    }, 0);
    
    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    cartContent.innerHTML = `
        <div class="cart-items">
            ${cartItems.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.game?.title || 'Игра'}</div>
                        <div class="cart-item-developer">${item.game?.developer || 'Разработчик не указан'}</div>
                        <div class="cart-item-price">${item.game?.price || 0} руб.</div>
                        <div class="cart-item-total">Итого: ${((item.game?.price || 0) * (item.quantity || 1)).toFixed(2)} руб.</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-btn" data-cart-id="${item.id}">
                            <i class="fas fa-trash"></i>
                            Удалить
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="cart-summary">
            <div class="summary-row">
                <span>Количество товаров:</span>
                <span>${totalItems} шт.</span>
            </div>
            <div class="summary-row total">
                <span>Общая стоимость:</span>
                <span class="total-price">${total.toFixed(2)} руб.</span>
            </div>
        </div>
        
        <div class="cart-actions">
            <button class="clear-cart-btn" id="clearCartBtn">
                Очистить корзину
            </button>
            <button class="checkout-btn" id="checkoutBtn">
                Перейти к оплате
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="/Catalog/Catalog.html" class="continue-shopping">
                Продолжить покупки
            </a>
        </div>
    `;
    
    attachCartEventListeners();
}

function attachCartEventListeners() {
    
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartId = parseInt(this.getAttribute('data-cart-id'));
            updateCartQuantity(cartId, -1);
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartId = parseInt(this.getAttribute('data-cart-id'));
            updateCartQuantity(cartId, 1);
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartId = parseInt(this.getAttribute('data-cart-id'));
            removeFromCart(cartId);
        });
    });
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
}

async function checkout() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert('Пожалуйста, войдите в систему');
            return;
        }

        const cartResponse = await fetch(`${CART_API_URL}/GetUserCart/${user.id}`);
        const cartItems = await cartResponse.json();

        if (!cartItems || cartItems.length === 0) {
            alert('Корзина пуста');
            return;
        }

        const total = calculateTotal(cartItems);
        if (!confirm(`Купить ${cartItems.length} игр на сумму ${total} руб.?`)) {
            return;
        }

        for (const item of cartItems) {
            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('gameId', item.gameId);

            await fetch(`${PURCHASE_API_URL}/BuyGame`, {
                method: 'POST',
                body: formData
            });
        }

        await fetch(`${CART_API_URL}/ClearCart/${user.id}`, {
            method: 'DELETE'
        });

        alert('Покупка успешно завершена! Спасибо за покупку.');
        loadCartFromServer(user.id);
        
        setTimeout(() => {
            window.location.href = '/Cabinet/LichniiCabinet.html';
        }, 1500);

    } catch (error) {
        alert('Ошибка при оформлении заказа: ' + error.message);
    }
}

function calculateTotal(cartItems) {
    return cartItems.reduce((total, item) => {
        return total + ((item.game?.price || 0) * (item.quantity || 1));
    }, 0).toFixed(2);
}

function showEmptyCart() {
    const cartContent = document.getElementById('cartContent');
    cartContent.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h3>Корзина пуста</h3>
            <p>Добавьте игры из каталога, чтобы они появились здесь</p>
            <a href="/Catalog/Catalog.html" class="continue-shopping">
                <i class="fas fa-arrow-left"></i>
                Перейти в каталог
            </a>
        </div>
    `;
}

async function updateCartQuantity(cartId, change) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        const cartResponse = await fetch(`${CART_API_URL}/GetUserCart/${user.id}`);
        const cartItems = await cartResponse.json();
        
        const currentItem = cartItems.find(item => item.id === cartId);
        if (!currentItem) {
            alert('Элемент не найден в корзине');
            return;
        }
        
        const currentQuantity = currentItem.quantity || 1;
        const newQuantity = currentQuantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(cartId);
            return;
        }

        const formData = new FormData();
        formData.append('cartId', cartId);
        formData.append('quantity', newQuantity);

        const response = await fetch(`${CART_API_URL}/UpdateQuantity`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            loadCartFromServer(user.id);
        } else {
            const errorText = await response.text();
            alert('Ошибка при обновлении количества: ' + errorText);
        }
    } catch (error) {
        alert('Ошибка при обновлении количества: ' + error.message);
    }
}

async function removeFromCart(cartId) {
    if (!confirm('Вы уверены, что хотите удалить эту игру из корзины?')) {
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${CART_API_URL}/RemoveFromCart/${cartId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCartFromServer(user.id);
        } else {
            alert('Ошибка при удалении из корзины');
        }
    } catch (error) {
        alert('Ошибка при удалении из корзины: ' + error.message);
    }
}

async function clearCart() {
    if (!confirm('Вы уверены, что хотите очистить всю корзину?')) {
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${CART_API_URL}/ClearCart/${user.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCartFromServer(user.id);
        } else {
            alert('Ошибка при очистке корзины');
        }
    } catch (error) {
        alert('Ошибка при очистке корзины: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('user');
    checkAuth();
    window.location.href = '/GlavnaiPage/index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});