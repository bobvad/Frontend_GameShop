document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://192.168.0.8:5000/api';

    document.getElementById('registerForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageDiv = document.getElementById('message');

        if (!email || !username || !password || !confirmPassword) {
            messageDiv.innerHTML = '<p style="color: red;">Заполните все поля</p>';
            return;
        }

        if (password !== confirmPassword) {
            messageDiv.innerHTML = '<p style="color: red;">Пароли не совпадают</p>';
            return;
        }

        try {
            messageDiv.innerHTML = '<p style="color: blue;">Регистрация...</p>';

            const response = await fetch(`${API_URL}/UserController/RegIn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `Login=${encodeURIComponent(username)}&Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const user = await response.json();
                console.log('User registered:', user);
                
                messageDiv.innerHTML = '<p style="color: green;">Регистрация успешна!</p>';
                
                localStorage.setItem('user', JSON.stringify(user));
                
                setTimeout(() => {
                    window.location.href = '/Cabinet/LichniiCabinet.html';
                }, 2000);
                
            } else if (response.status === 409) {
                const errorText = await response.text();
                messageDiv.innerHTML = `<p style="color: red;">${errorText || 'Пользователь с таким логином уже существует'}</p>`;
            } else if (response.status === 400) {
                messageDiv.innerHTML = '<p style="color: red;">Некорректные данные</p>';
            } else {
                messageDiv.innerHTML = `<p style="color: red;">Ошибка сервера: ${response.status}</p>`;
            }

        } catch (error) {
            console.error('Ошибка:', error);
            messageDiv.innerHTML = '<p style="color: red;">Ошибка подключения к серверу. Проверьте запущен ли сервер.</p>';
        }
    });
});