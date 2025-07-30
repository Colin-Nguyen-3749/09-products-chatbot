// Store conversation history for OpenAI API
let conversationHistory = [];

// Store rentals data
let rentalsData = [];

// Load rentals data from JSON file
async function loadRentalsData() {
    try {
        const response = await fetch('./rentals.json');
        const data = await response.json();
        rentalsData = data.rentals;
        
        // Initialize conversation with system message that includes rentals data
        conversationHistory = [
            {
                role: 'system',
                content: `You are a helpful vacation rental assistant. Your job is to guide users through a short conversation to find their perfect rental match.

Here are the available vacation rentals:

${rentalsData.map(rental => `
**${rental.name}**
- Location: ${rental.location}
- Description: ${rental.description}
- Rating: ${rental.avgRating}/5 stars
- Available: ${rental.availabilityDates.start} to ${rental.availabilityDates.end}
`).join('\n')}

CONVERSATION FLOW:
1. Greet the user warmly and ask 2-3 simple questions to understand their preferences:
   - What type of experience are they looking for? (quirky/fun, relaxing, adventurous, etc.)
   - What location or region appeals to them? (desert, mountains, city, etc.)
   - Any specific interests or themes they're drawn to?

2. After gathering their answers, recommend the TOP 2-3 rental matches that best fit their preferences.

3. Explain WHY each rental matches what they're looking for.

FORMATTING INSTRUCTIONS:
- Use line breaks to separate different thoughts or sections
- Use bullet points (•) or dashes (-) for lists
- Keep paragraphs short and easy to read
- Put rental names in bold when recommending them
- Use emojis sparingly to add personality

Keep your tone conversational, friendly, and helpful. Ask one question at a time to make it easy for users to respond.`
            }
        ];
    } catch (error) {
        console.error('Error loading rentals data:', error);
        // Fallback system message if rentals can't be loaded
        conversationHistory = [
            {
                role: 'system',
                content: 'You are a helpful assistant for a vacation rental website. Help users find the perfect rental for their needs.'
            }
        ];
    }
}

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
                // Send conversation to OpenAI API with adjusted parameters for better conversation
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: conversationHistory,
                        max_tokens: 600, // Increased for more detailed responses
                        temperature: 0.8, // Slightly higher for more natural conversation
                        presence_penalty: 0.1, // Encourage varied language
                        frequency_penalty: 0.1 // Reduce repetition
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

                // Display the AI's response with proper formatting
                const botMessage = document.createElement('div');
                botMessage.classList.add('message', 'bot');
                
                // Convert line breaks to HTML and preserve formatting
                const formattedMessage = aiMessage
                    .replace(/\n\n/g, '<br><br>') // Double line breaks become paragraph breaks
                    .replace(/\n/g, '<br>') // Single line breaks become line breaks
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold text formatting
                
                botMessage.innerHTML = formattedMessage;
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

// Initialize the application
async function init() {
    // Load rentals data first
    await loadRentalsData();
    // Then initialize the chat interface
    initChat();
}

// Start the application
init();
