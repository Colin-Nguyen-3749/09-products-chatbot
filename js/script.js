// Store conversation history for OpenAI API
let conversationHistory = [
    {
        role: 'system',
        content: 'You are a helpful assistant for a vacation rental website. Help users find the perfect rental for their needs.'
    }
];

// Main function to initialize the chat interface
function initChat() {
    // Get all required DOM elements
    const chatToggle = document.getElementById('chatToggle');
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const openIcon = document.querySelector('.open-icon');
    const closeIcon = document.querySelector('.close-icon');

    // Toggle chat visibility and swap icons
    chatToggle.addEventListener('click', function() {
        chatBox.classList.toggle('active');
        openIcon.style.display = chatBox.classList.contains('active') ? 'none' : 'block';
        closeIcon.style.display = chatBox.classList.contains('active') ? 'block' : 'none';
    });

    // Handle user input and process messages
    async function handleUserInput(e) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            userInput.value = '';

            // Display the user's message
            const userMessage = document.createElement('div');
            userMessage.classList.add('message', 'user');
            userMessage.textContent = message;
            chatMessages.appendChild(userMessage);

            // Add user message to conversation history
            conversationHistory.push({
                role: 'user',
                content: message
            });

            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('message', 'bot');
            typingIndicator.textContent = 'Typing...';
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Send conversation to OpenAI API
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: conversationHistory,
                        max_tokens: 500,
                        temperature: 0.7
                    })
                });

                // Check if the response is successful
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                // Get the AI response
                const data = await response.json();
                const aiMessage = data.choices[0].message.content;

                // Remove typing indicator
                chatMessages.removeChild(typingIndicator);

                // Display the AI's response
                const botMessage = document.createElement('div');
                botMessage.classList.add('message', 'bot');
                botMessage.textContent = aiMessage;
                chatMessages.appendChild(botMessage);

                // Add AI response to conversation history
                conversationHistory.push({
                    role: 'assistant',
                    content: aiMessage
                });

            } catch (error) {
                // Remove typing indicator and show error
                chatMessages.removeChild(typingIndicator);
                
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('message', 'bot');
                errorMessage.textContent = 'Sorry, I encountered an error. Please try again.';
                chatMessages.appendChild(errorMessage);
                
                console.error('Error calling OpenAI API:', error);
            }

            // Scroll to the latest message
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Listen for form submission
    document.getElementById('chatForm').addEventListener('submit', handleUserInput);
}

// Initialize the chat interface
initChat();
