const express = require('express');
const mqtt = require('mqtt');
const mysql = require('mysql2');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow requests from all origins
        methods: ["GET", "POST"]
    }
});

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Bu2006@', // Replace with your actual MySQL password
    database: 'mqtt_messages'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// MQTT Client Setup
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// Handle incoming messages from multiple topics
mqttClient.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`Received message on topic ${topic}: ${msg}`);

    // Store the message in MySQL
    const sql = 'INSERT INTO messages (topic, message) VALUES (?, ?)';
    db.query(sql, [topic, msg], (err) => {
        if (err) {
            console.error('MySQL insert error:', err);
        }
    });

    // Emit the message to the frontend using WebSockets
    io.emit('mqtt_message', { topic, message: msg });
});

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('Client connected via WebSocket');

    // Listen for subscription requests from the client
    socket.on('subscribe', (topic) => {
        mqttClient.subscribe(topic, (err) => {
            if (!err) {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    });
});

// Route to handle paginated messages
app.get('/get-messages', (req, res) => {
    const pageSize = 20; // Number of messages per page
    const page = req.query.page || 1; // Current page, defaults to 1
    const offset = (page - 1) * pageSize; // Calculate the offset for pagination
    const topic = req.query.topic || null; // Filter by topic, if provided

    let sql = 'SELECT * FROM messages WHERE 1=1'; // Default query to select all messages
    const queryParams = [];

    if (topic) {
        sql += ' AND topic = ?';
        queryParams.push(topic);
    }

    sql += ' ORDER BY received_at DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset); // Add pagination parameters

    // Execute the query
    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('MySQL query error:', err);
            res.status(500).send('Error fetching messages');
            return;
        }

        // Return the fetched results to the frontend
        res.json(results);
    });
});

// Start the server
const PORT = 3003;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
