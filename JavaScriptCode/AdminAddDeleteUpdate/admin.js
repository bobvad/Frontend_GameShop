 const API_URL = 'https://localhost:7083/api';
        let currentUser = null;
        let allGames = [];

        document.addEventListener('DOMContentLoaded', function() {
            checkAdminAuth();
            loadGames();
        });

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
            
            document.getElementById(sectionId).classList.add('active');
            event.target.classList.add('active');

            if (sectionId === 'manageGames') {
                loadGames();
            }
        }

        document.getElementById('addGameForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const gameData = new URLSearchParams();
            gameData.append('title', document.getElementById('gameTitle').value);
            gameData.append('description', document.getElementById('gameDescription').value);
            gameData.append('price', document.getElementById('gamePrice').value);
            gameData.append('releaseDate', document.getElementById('gameReleaseDate').value);
            gameData.append('developer', document.getElementById('gameDeveloper').value);
            gameData.append('publisher', document.getElementById('gamePublisher').value);
            gameData.append('ageRating', document.getElementById('gameAgeRating').value);

            try {
                const response = await fetch(`${API_URL}/GameController/AddGame`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: gameData
                });

                if (response.ok) {
                    const result = await response.json();
                    showMessage('addGameMessage', 'Игра успешно добавлена!', 'success');
                    document.getElementById('addGameForm').reset();
                    loadGames();
                } else {
                    showMessage('addGameMessage', 'Ошибка при добавлении игры', 'error');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showMessage('addGameMessage', 'Ошибка подключения к серверу', 'error');
            }
        });

        async function loadGames() {
            try {
                const response = await fetch(`${API_URL}/GameController/GetAllGames`);
                if (response.ok) {
                    allGames = await response.json();
                    displayGames(allGames);
                }
            } catch (error) {
                console.error('Ошибка загрузки игр:', error);
                showMessage('addGameMessage', 'Ошибка загрузки списка игр', 'error');
            }
        }

        function displayGames(games) {
            const gamesList = document.getElementById('gamesList');
            
            if (!games || games.length === 0) {
                gamesList.innerHTML = '<p style="text-align: center; color: #bdc3c7; grid-column: 1 / -1;">Игры не найдены</p>';
                return;
            }

            gamesList.innerHTML = games.map(game => `
                <div class="game-card">
                    <div class="game-title">${game.title || 'Без названия'}</div>
                    <div class="game-info">Разработчик: ${game.developer || 'Не указан'}</div>
                    <div class="game-info">Издатель: ${game.publisher || 'Не указан'}</div>
                    <div class="game-info">Рейтинг: ${game.ageRating || 'Не указан'}</div>
                    <div class="game-info">Цена: ₽${game.price || '0'}</div>
                    <div class="game-info">Дата выхода: ${new Date(game.releaseDate).toLocaleDateString()}</div>
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

            // Заполняем форму данными игры
            document.getElementById('editGameId').value = game.id;
            document.getElementById('editGameTitle').value = game.title || '';
            document.getElementById('editGameDescription').value = game.description || '';
            document.getElementById('editGamePrice').value = game.price || 0;
            
            // Форматируем дату для input type="date"
            const releaseDate = new Date(game.releaseDate);
            const formattedDate = releaseDate.toISOString().split('T')[0];
            document.getElementById('editGameReleaseDate').value = formattedDate;
            
            document.getElementById('editGameDeveloper').value = game.developer || '';
            document.getElementById('editGamePublisher').value = game.publisher || '';
            document.getElementById('editGameAgeRating').value = game.ageRating || '';

            // Показываем модальное окно
            document.getElementById('editGameModal').style.display = 'block';
        }

        function closeEditModal() {
            document.getElementById('editGameModal').style.display = 'none';
            document.getElementById('editGameMessage').innerHTML = '';
        }

        // Обработчик формы редактирования
        document.getElementById('editGameForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const gameId = document.getElementById('editGameId').value;
            const gameData = new URLSearchParams();
            gameData.append('id', gameId);
            gameData.append('title', document.getElementById('editGameTitle').value);
            gameData.append('description', document.getElementById('editGameDescription').value);
            gameData.append('price', document.getElementById('editGamePrice').value);
            gameData.append('releaseDate', document.getElementById('editGameReleaseDate').value);
            gameData.append('developer', document.getElementById('editGameDeveloper').value);
            gameData.append('publisher', document.getElementById('editGamePublisher').value);
            gameData.append('ageRating', document.getElementById('editGameAgeRating').value);

            try {
                const response = await fetch(`${API_URL}/GameController/UpdateGame`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: gameData
                });

                if (response.ok) {
                    const result = await response.json();
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
        });

        window.onclick = function(event) {
            const modal = document.getElementById('editGameModal');
            if (event.target === modal) {
                closeEditModal();
            }
        }

        function logout() {
            localStorage.removeItem('user');
            window.location.href = '../AuthorizationRegistration/Authorization.html';
        }

        function showMessage(containerId, message, type) {
            const container = document.getElementById(containerId);
            container.innerHTML = `<div class="message ${type}">${message}</div>`;
            
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }