
        document.addEventListener('DOMContentLoaded', function() {
            const chatMessages = document.getElementById('chatMessages');
            const userInput = document.getElementById('userInput');
            const sendButton = document.getElementById('sendButton');
            
            const AI_API_URL = 'https://localhost:7083/api/MessagesController/SendMessage';
            
            function addMessage(text, isUser = false) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
                messageDiv.textContent = text;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            function showTypingIndicator() {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'typing-indicator';
                typingDiv.id = 'typingIndicator';
                
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'typing-dot';
                    typingDiv.appendChild(dot);
                }
                
                chatMessages.appendChild(typingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return typingDiv;
            }
            
            async function sendToAI(message) {
                try {
                    const response = await fetch(AI_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            UserId: 1, 
                            MessageText: message,
                            IsFromGuest: false
                        })
                    });
                    
                    const data = await response.json();
                    return data.messageText || "Не удалось получить ответ от ИИ";
                } catch (error) {
                    return "Ошибка соединения с ИИ-сервисом";
                }
            }
            
            async function handleSendMessage() {
                const message = userInput.value.trim();
                
                if (message) {
                    addMessage(message, true);
                    userInput.value = '';
                    
                    const typingIndicator = showTypingIndicator();
                    
                    try {
                        const aiResponse = await sendToAI(message);
                        chatMessages.removeChild(typingIndicator);
                        addMessage(aiResponse, false);
                    } catch (error) {
                        chatMessages.removeChild(typingIndicator);
                        addMessage("Произошла ошибка при обращении к ИИ", false);
                    }
                }
            }
            
            sendButton.addEventListener('click', handleSendMessage);
            
            userInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
            });
            
            document.getElementById('closeChat').addEventListener('click', function() {
                alert('Чат будет закрыт');
            });
        });