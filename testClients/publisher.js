const mqtt = require('mqtt');

// Connect to the MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

// Topics to publish messages to (simulating different edge devices)
const topics = ['test/topic1', 'test/topic2', 'test/topic3', 'test/topic4', 'test/topic5'];

// Function to publish a message to a random topic every second
function publishMessage() {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const message = `Message to ${randomTopic} - ${new Date().toISOString()}`;

    // Publish the message
    client.publish(randomTopic, message, {}, (err) => {
        if (err) {
            console.error('Error publishing message:', err);
        } else {
            console.log(`Published to ${randomTopic}: ${message}`);
        }
    });
}

// Connect to the broker and start publishing messages
client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Publish a message every second to simulate real-time data from edge devices
    setInterval(publishMessage, 1000);
});

// Handle errors
client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});
