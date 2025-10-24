const API_URL = 'http://94.51.193.181:50000/api';
let currentUser = null;
let allGames = [];
let allGenres = [];
let allGameGenres = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadGames();
    loadGenres();
    loadGameGenres();
    setupHeader();
    setupEventListeners();
});

function setupEventListeners() {
    const addGameForm = document.getElementById('addGameForm');
    if (addGameForm) {
        addGameForm.addEventListener('submit', handleAddGame);
    }

    const editGameForm = document.getElementById('editGameForm');
    if (editGameForm) {
        editGameForm.addEventListener('submit', handleEditGame);
    }

    const addGenreForm = document.getElementById('addGenreForm');
    if (addGenreForm) {
        addGenreForm.addEventListener('submit', handleAddGenre);
    }

    const addGameGenreForm = document.getElementById('addGameGenreForm');
    if (addGameGenreForm) {
        addGameGenreForm.addEventListener('submit', handleAddGameGenre);
    }
}

function setupHeader() {
    const userData = localStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        const authOnly = document.querySelector('.auth-only');
        if (authOnly) {
            authOnly.style.display = 'flex';
        }
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = user.name || user.email;
        }
    }
}

function checkAdminAuth() {
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = '../AuthorizationRegistration/Authorization.html';
        return;
    }

    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'Admin') {
        alert('Доступ запрещен! Требуются права администратора.');
        window.location.href = '../GlavnaiPage/index.html';
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (sectionId === 'manageGames') {
        loadGames();
    } else if (sectionId === 'manageGenres') {
        loadGenres();
    } else if (sectionId === 'manageGameGenres') {
        loadGameGenres();
        populateGameAndGenreSelects();
    }
}

async function handleAddGame(e) {
    e.preventDefault();
    
    const title = document.getElementById('gameTitle').value.trim();
    const description = document.getElementById('gameDescription').value.trim();
    const priceInput = document.getElementById('gamePrice').value;
    const releaseDateInput = document.getElementById('gameReleaseDate').value;
    const developer = document.getElementById('gameDeveloper').value.trim();
    const publisher = document.getElementById('gamePublisher').value.trim();
    const ageRating = document.getElementById('gameAgeRating').value.trim();

    if (!title || !description || !priceInput || !releaseDateInput || !developer || !publisher || !ageRating) {
        showMessage('addGameMessage', 'Заполните все обязательные поля', 'error');
        return;
    }

    const price = parseFloat(priceInput);
    
    if (isNaN(price) || price < 0) {
        showMessage('addGameMessage', 'Введите корректную цену', 'error');
        return;
    }

    const releaseDate = new Date(releaseDateInput).toISOString().split('T')[0];

    const selectedDate = new Date(releaseDateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    if (selectedDate > today) {
        showMessage('addGameMessage', 'Дата выхода не может быть в будущем', 'error');
        return;
    }

    const gameData = new URLSearchParams();
    gameData.append('title', title);
    gameData.append('description', description);
    gameData.append('price', price);
    gameData.append('releaseDate', releaseDate); 
    gameData.append('developer', developer);
    gameData.append('publisher', publisher);
    gameData.append('ageRating', ageRating);

    console.log('Отправка данных:', Object.fromEntries(gameData));

    try {
        const response = await fetch(`${API_URL}/GameController/AddGame`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: gameData
        });

        const responseText = await response.text();
        let result;
        
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            result = { message: responseText };
        }

        if (response.ok) {
            showMessage('addGameMessage', 'Игра успешно добавлена!', 'success');
            document.getElementById('addGameForm').reset();
            loadGames(); 
        } else if (response.status === 409) {
            showMessage('addGameMessage', result.message || 'Игра с таким названием уже существует', 'error');
        } else if (response.status === 400) {
            showMessage('addGameMessage', result.message || 'Ошибка валидации данных', 'error');
        } else {
            console.error('Ошибка сервера:', response.status, result);
            showMessage('addGameMessage', result.message || `Ошибка сервера: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
        showMessage('addGameMessage', 'Ошибка подключения к серверу: ' + error.message, 'error');
    }
}

async function loadGames() {
    try {
        const response = await fetch(`${API_URL}/GameController/GetAllGames`);
        if (response.ok) {
            allGames = await response.json();
            displayGames(allGames);
        } else {
            showMessage('addGameMessage', 'Ошибка загрузки списка игр', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
        showMessage('addGameMessage', 'Ошибка подключения к серверу при загрузке игр', 'error');
    }
}

function displayGames(games) {
    const gamesList = document.getElementById('gamesList');
    if (!gamesList) return;
    
    if (!games || games.length === 0) {
        gamesList.innerHTML = '<p style="text-align: center; color: #bdc3c7; grid-column: 1 / -1;">Игры не найдены</p>';
        return;
    }

    gamesList.innerHTML = games.map(game => `
        <div class="game-card">
            <div class="game-title">${escapeHtml(game.title || 'Без названия')}</div>
            <div class="game-info">Разработчик: ${escapeHtml(game.developer || 'Не указан')}</div>
            <div class="game-info">Издатель: ${escapeHtml(game.publisher || 'Не указан')}</div>
            <div class="game-info">Рейтинг: ${escapeHtml(game.ageRating || 'Не указан')}</div>
            <div class="game-info">Цена: ₽${game.price || '0'}</div>
            <div class="game-info">Дата выхода: ${game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'Не указана'}</div>
            <div class="game-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteGame(${game.id})">Удалить</button>
                <button class="btn btn-sm btn-warning" onclick="editGame(${game.id})">Редактировать</button>
            </div>
        </div>
    `).join('');
}

async function deleteGame(gameId) {
    if (!confirm('Вы уверены, что хотите удалить эту игру?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/GameController/DeleteById?id=${gameId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('addGameMessage', 'Игра успешно удалена!', 'success');
            loadGames();
            loadGameGenres();
        } else {
            const error = await response.text();
            showMessage('addGameMessage', 'Ошибка при удалении игры: ' + error, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('addGameMessage', 'Ошибка подключения к серверу', 'error');
    }
}

function editGame(gameId) {
    const game = allGames.find(g => g.id === gameId);
    if (!game) {
        alert('Игра не найдена!');
        return;
    }

    document.getElementById('editGameId').value = game.id;
    document.getElementById('editGameTitle').value = game.title || '';
    document.getElementById('editGameDescription').value = game.description || '';
    document.getElementById('editGamePrice').value = game.price || 0;
    
    let releaseDate = '';
    if (game.releaseDate) {
        const date = new Date(game.releaseDate);
        releaseDate = date.toISOString().split('T')[0];
    }
    document.getElementById('editGameReleaseDate').value = releaseDate;
    
    document.getElementById('editGameDeveloper').value = game.developer || '';
    document.getElementById('editGamePublisher').value = game.publisher || '';
    document.getElementById('editGameAgeRating').value = game.ageRating || '';

    document.getElementById('editGameModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editGameModal').style.display = 'none';
    document.getElementById('editGameMessage').innerHTML = '';
}

async function handleEditGame(e) {
    e.preventDefault();

    const gameId = document.getElementById('editGameId').value;
    const priceInput = document.getElementById('editGamePrice').value;
    
    const price = parseFloat(priceInput);
    
    if (isNaN(price) || price < 0) {
        showMessage('editGameMessage', 'Введите корректную цену', 'error');
        return;
    }

    const gameData = new URLSearchParams();
    gameData.append('Id', gameId);
    gameData.append('Title', document.getElementById('editGameTitle').value);
    gameData.append('Description', document.getElementById('editGameDescription').value);
    gameData.append('Price', price); 
    gameData.append('ReleaseDate', document.getElementById('editGameReleaseDate').value);
    gameData.append('Developer', document.getElementById('editGameDeveloper').value);
    gameData.append('Publisher', document.getElementById('editGamePublisher').value);
    gameData.append('AgeRating', document.getElementById('editGameAgeRating').value);

    try {
        const response = await fetch(`${API_URL}/GameController/UpdateGame`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: gameData
        });

        if (response.ok) {
            showMessage('editGameMessage', 'Игра успешно обновлена!', 'success');
            
            setTimeout(() => {
                closeEditModal();
                loadGames();
            }, 1500);
        } else {
            const errorText = await response.text();
            showMessage('editGameMessage', 'Ошибка при обновлении игры: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('editGameMessage', 'Ошибка подключения к серверу', 'error');
    }
}

async function loadGenres() {
    try {
        const response = await fetch(`${API_URL}/GenresController/GetAll`);
        if (response.ok) {
            allGenres = await response.json();
            displayGenres(allGenres);
        } else {
            showMessage('addGenreMessage', 'Ошибка загрузки списка жанров', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки жанров:', error);
        showMessage('addGenreMessage', 'Ошибка подключения к серверу при загрузке жанров', 'error');
    }
}

function displayGenres(genres) {
    const genresList = document.getElementById('genresList');
    if (!genresList) return;
    
    if (!genres || genres.length === 0) {
        genresList.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Жанры не найдены</p>';
        return;
    }

    genresList.innerHTML = genres.map(genre => `
        <div class="genre-card">
            <div class="genre-name">${escapeHtml(genre.genreName || 'Без названия')}</div>
            <div class="genre-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteGenre(${genre.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

async function handleAddGenre(e) {
    e.preventDefault();
    
    const genreName = document.getElementById('genreName').value;
    if (!genreName) {
        showMessage('addGenreMessage', 'Введите название жанра', 'error');
        return;
    }

    const genreData = new URLSearchParams();
    genreData.append('genreName', genreName);

    try {
        const response = await fetch(`${API_URL}/GenresController/Add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: genreData
        });

        if (response.ok) {
            showMessage('addGenreMessage', 'Жанр успешно добавлен!', 'success');
            document.getElementById('addGenreForm').reset();
            loadGenres();
            populateGameAndGenreSelects();
        } else {
            const errorText = await response.text();
            showMessage('addGenreMessage', `Ошибка при добавлении жанра: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('addGenreMessage', 'Ошибка подключения к серверу', 'error');
    }
}

async function deleteGenre(genreId) {
    if (!confirm('Вы уверены, что хотите удалить этот жанр?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/GenresController/Delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${genreId}`
        });

        if (response.ok) {
            showMessage('addGenreMessage', 'Жанр успешно удален!', 'success');
            loadGenres();
            loadGameGenres();
            populateGameAndGenreSelects();
        } else {
            const error = await response.text();
            showMessage('addGenreMessage', 'Ошибка при удалении жанра: ' + error, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('addGenreMessage', 'Ошибка подключения к серверу', 'error');
    }
}

async function loadGameGenres() {
    try {
        const response = await fetch(`${API_URL}/GameGenreController/GetAllGamesWithGenres`);
        if (response.ok) {
            allGameGenres = await response.json();
            displayGameGenres(allGameGenres);
        } else {
            showMessage('addGameGenreMessage', 'Ошибка загрузки связей игр и жанров', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки связей:', error);
        showMessage('addGameGenreMessage', 'Ошибка подключения к серверу при загрузке связей', 'error');
    }
}

function displayGameGenres(gameGenres) {
    const gameGenresList = document.getElementById('gameGenresList');
    if (!gameGenresList) return;
    
    if (!gameGenres || gameGenres.length === 0) {
        gameGenresList.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Связи не найдены</p>';
        return;
    }

    gameGenresList.innerHTML = gameGenres.map(game => `
        <div class="game-genre-card">
            <div class="game-title">${escapeHtml(game.title || 'Без названия')}</div>
            <div class="game-genres">
                <strong>Жанры:</strong> 
                ${game.genres && game.genres.length > 0 
                    ? game.genres.map(genre => `<span class="genre-tag">${escapeHtml(genre)}</span>`).join('')
                    : '<span style="color: #bdc3c7;">Не назначены</span>'
                }
            </div>
            <div class="game-genre-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteGameGenres(${game.id})">Удалить все связи</button>
            </div>
        </div>
    `).join('');
}

function populateGameAndGenreSelects() {
    const gameSelect = document.getElementById('gameSelect');
    const genreSelect = document.getElementById('genreSelect');
    
    if (gameSelect) {
        gameSelect.innerHTML = '<option value="">Выберите игру</option>' +
            allGames.map(game => `<option value="${game.id}">${escapeHtml(game.title)}</option>`).join('');
    }
    
    if (genreSelect) {
        genreSelect.innerHTML = '<option value="">Выберите жанр</option>' +
            allGenres.map(genre => `<option value="${genre.id}">${escapeHtml(genre.genreName)}</option>`).join('');
    }
}

async function handleAddGameGenre(e) {
    e.preventDefault();
    
    const gameId = document.getElementById('gameSelect').value;
    const genreId = document.getElementById('genreSelect').value;

    if (!gameId || !genreId) {
        showMessage('addGameGenreMessage', 'Выберите игру и жанр', 'error');
        return;
    }

    const gameGenreData = new URLSearchParams();
    gameGenreData.append('gameId', gameId);
    gameGenreData.append('genreId', genreId);

    try {
        const response = await fetch(`${API_URL}/GameGenreController/AddGameGenre`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: gameGenreData
        });

        if (response.ok) {
            showMessage('addGameGenreMessage', 'Связь успешно добавлена!', 'success');
            document.getElementById('addGameGenreForm').reset();
            loadGameGenres();
        } else if (response.status === 400) {
            showMessage('addGameGenreMessage', 'Такая связь уже существует', 'error');
        } else {
            const errorText = await response.text();
            showMessage('addGameGenreMessage', `Ошибка при добавлении связи: ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('addGameGenreMessage', 'Ошибка подключения к серверу', 'error');
    }
}

async function deleteGameGenres(gameId) {
    if (!confirm('Вы уверены, что хотите удалить все связи этой игры с жанрами?')) {
        return;
    }

    try {
        const game = allGameGenres.find(g => g.id === gameId);
        if (game && game.genres && game.genres.length > 0) {
            for (const genreName of game.genres) {
                const genre = allGenres.find(g => g.genreName === genreName);
                if (genre) {
                    await fetch(`${API_URL}/GameGenreController/DeleteByGameAndGenre`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `gameId=${gameId}&genreId=${genre.id}`
                    });
                }
            }
            showMessage('addGameGenreMessage', 'Все связи игры удалены!', 'success');
            loadGameGenres();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('addGameGenreMessage', 'Ошибка при удалении связей', 'error');
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

function logoutToMain() {
    window.location.href = '../GlavnaiPage/index.html';
}

window.onclick = function(event) {
    const gameModal = document.getElementById('editGameModal');
    
    if (event.target === gameModal) {
        closeEditModal();
    }
}