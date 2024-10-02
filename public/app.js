const socket = io();
// Theme Toggle
document.getElementById('lightMode').addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.remove('dark-mode');
    }
});

document.getElementById('darkMode').addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark-mode');
    }
});

let currentPage = 1; // Current page tracker
let currentTopic = ''; // Filtered topic tracker


// Subscribe to a topic
document.getElementById('subscribeBtn').addEventListener('click', () => {
    const topic = document.getElementById('topic').value;
    if (topic) {
        socket.emit('subscribe', topic);
        alert(`Subscribed to topic: ${topic}`);
        
        // Add the topic to the subscribed topics list
        const topicsList = document.getElementById('topics-list');
        const listItem = document.createElement('li');
        listItem.textContent = topic;

        // Add Unsubscribe button
        const unsubscribeBtn = document.createElement('button');
        unsubscribeBtn.textContent = 'Unsubscribe';
        unsubscribeBtn.classList.add('unsubscribe-btn');
        unsubscribeBtn.addEventListener('click', () => {
            // Unsubscribe from the topic
            socket.emit('unsubscribe', topic);
            listItem.remove(); // Remove the topic from the list
            alert(`Unsubscribed from topic: ${topic}`);
        });

        listItem.appendChild(unsubscribeBtn);
        topicsList.appendChild(listItem);
        
        // Clear the input field
        document.getElementById('topic').value = '';
    }
});

// Clear topic filter
document.getElementById('clearFilterBtn').addEventListener('click', () => {
    currentTopic = ''; // Clear the current topic filter
    currentPage = 1; // Reset to the first page
    fetchMessages(currentPage); // Fetch all messages
});

// Handle pagination controls
document.getElementById('nextBtn').addEventListener('click', () => {
    currentPage += 1;
    fetchMessages(currentPage, currentTopic);
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage -= 1;
        fetchMessages(currentPage, currentTopic);
    }
});

// Refresh messages manually
document.getElementById('refreshMessagesBtn').addEventListener('click', () => {
    fetchMessages(currentPage, currentTopic);
});

// Fetch messages for the current page and topic
function fetchMessages(page, topic = '') {
    let url = `/get-messages?page=${page}`;
    if (topic) {
        url += `&topic=${topic}`; // Append the topic filter to the query
    }

    fetch(url)
        .then(response => response.json())
        .then(messages => {
            const messageList = document.getElementById('messages');
            messageList.innerHTML = ''; // Clear only the message list

            messages.forEach(msg => {
                const listItem = document.createElement('li');
                listItem.textContent = `Topic: ${msg.topic} - Message: ${msg.message}`;
                messageList.appendChild(listItem);
            });

            document.getElementById('currentPage').textContent = `Page ${page}`;
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
}

// Filter by topic
document.getElementById('filterBtn').addEventListener('click', () => {
    const topic = document.getElementById('topicFilter').value;
    if (topic) {
        currentTopic = topic; // Set the current topic filter
        currentPage = 1; // Reset to the first page when filtering
        fetchMessages(currentPage, currentTopic); // Fetch filtered messages
    } else {
        alert('Please enter a topic to filter by');
    }
});

// Call fetchMessages initially to load the first page of messages
fetchMessages(currentPage);

// Receive MQTT messages in real-time and display them
socket.on('mqtt_message', (data) => {
    const realTimeMessageList = document.getElementById('realTimeMessages');
    const listItem = document.createElement('li');
    listItem.textContent = `Topic: ${data.topic} - Message: ${data.message}`;
    realTimeMessageList.appendChild(listItem);
});