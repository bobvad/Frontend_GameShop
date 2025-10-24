const API_URL = 'http://192.168.0.8:5000/api';

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
                userNameDisplay.textContent = userData.login || userData.email;
            }
            loadUserPurchases(userData.id);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        authElements.forEach(el => el.style.display = 'none');
        guestElements.forEach(el => el.style.display = 'block');
    }
}

async function loadUserPurchases(userId) {
    const purchasesContainer = document.getElementById('purchasesContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyState = document.getElementById('emptyState');
    
    try {
        loadingIndicator.style.display = 'block';
        emptyState.style.display = 'none';
        purchasesContainer.innerHTML = '';
        
        const response = await fetch(`${API_URL}/PurchasesController/GetUserPurchases/${userId}`);
        
        if (response.ok) {
            const purchases = await response.json();
            
            if (purchases.length === 0) {
                showEmptyState();
            } else {
                displayPurchases(purchases);
            }
        } else if (response.status === 404) {
            showEmptyState();
        } else {
            throw new Error('Ошибка загрузки покупок');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        purchasesContainer.innerHTML = '<div class="error">Ошибка загрузки покупок</div>';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function displayPurchases(purchases) {
    const purchasesContainer = document.getElementById('purchasesContainer');
    
    purchasesContainer.innerHTML = purchases.map(purchase => `
        <div class="purchase-card">
            <div class="purchase-info">
                <h3 class="purchase-title">${purchase.gameName || 'Игра'}</h3>
                <div class="purchase-details">
                    <div class="purchase-detail">
                        <span>Дата покупки:</span>
                        <span>${new Date(purchase.purchaseDate).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="purchase-detail">
                        <span>Ключ активации:</span>
                        <span>${purchase.activationKey || 'Не указан'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showEmptyState() {
    const purchasesContainer = document.getElementById('purchasesContainer');
    const emptyState = document.getElementById('emptyState');
    
    purchasesContainer.innerHTML = '';
    emptyState.style.display = 'block';
}

function downloadGame(gameId) {
    alert(`Начинается загрузка игры с ID: ${gameId}`);
}

function playGame(gameId) {
    alert(`Запуск игры с ID: ${gameId}`);
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