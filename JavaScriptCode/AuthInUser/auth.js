document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        if (user.role === 'Admin') {
            window.location.href = '/SecretAdmin/adminuprav.html';
        } else {
            window.location.href = '/Cabinet/LichniiCabinet.html';
        }
        return;
    }

    const API_URL = 'http://94.51.193.181:50000/api';
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');

        if (!login || !password) {
            messageDiv.innerHTML = '<p style="color: red;">Заполните все поля</p>';
            return;
        }

        try {
            messageDiv.innerHTML = '<p style="color: blue;">Выполняется вход...</p>';

            const response = await fetch(`${API_URL}/UserController/SingIn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `Login=${encodeURIComponent(login)}&Password=${encodeURIComponent(password)}`
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const user = await response.json();
                console.log('User data:', user);
                
                messageDiv.innerHTML = '<p style="color: green;">Успешный вход!</p>';
                
                localStorage.setItem('user', JSON.stringify(user));
                
                setTimeout(() => {
                    if (user.role === 'Admin') {
                        window.location.href = '/SecretAdmin/adminuprav.html';
                    } else {
                        window.location.href = '/Cabinet/LichniiCabinet.html';
                    }
                }, 1000);
                
            } else if (response.status === 403) {
                messageDiv.innerHTML = '<p style="color: red;">Неверный логин или пароль</p>';
            } else {
                messageDiv.innerHTML = `<p style="color: red;">Ошибка сервера: ${response.status}</p>`;
            }

        } catch (error) {
            console.error('Ошибка:', error);
            messageDiv.innerHTML = '<p style="color: red;">Ошибка подключения к серверу</p>';
        }
    });
});