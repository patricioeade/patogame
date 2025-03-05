const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store players data
let players = [];
// Default max points to win
let maxPoints = 30;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send current players to new connections
    socket.emit('initialPlayers', players);
    // Send current max points to new connections
    socket.emit('maxPointsUpdated', maxPoints);

    // Handle player updates
    socket.on('updatePlayer', (data) => {
        const playerIndex = players.findIndex(p => p.id === data.id);
        if (playerIndex !== -1) {
            players[playerIndex] = data;
            io.emit('playersUpdated', players);

            // Check for winner
            if (data.points >= maxPoints) {
                io.emit('winner', data);
            }
        }
    });

    // Handle new player addition
    socket.on('addPlayer', (player) => {
        players.push(player);
        io.emit('playersUpdated', players);
    });

    // Handle player deletion
    socket.on('deletePlayer', (playerId) => {
        players = players.filter(p => p.id !== playerId);
        io.emit('playersUpdated', players);
    });

    // Handle points reset
    socket.on('resetPoints', () => {
        players = players.map(p => ({ ...p, points: 0 }));
        io.emit('playersUpdated', players);
    });

    // Handle max points update
    socket.on('updateMaxPoints', (points) => {
        maxPoints = points;
        io.emit('maxPointsUpdated', maxPoints);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the race page
app.get('/race', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'race.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});