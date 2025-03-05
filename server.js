const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store players data
let players = [];
// Default max points to win
let maxPoints = 30;

// Broadcast to all clients
const broadcast = (message) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send current players to new connections
    ws.send(JSON.stringify({ type: 'initialPlayers', data: players }));
    // Send current max points to new connections
    ws.send(JSON.stringify({ type: 'maxPointsUpdated', data: maxPoints }));

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);
            
            switch (msg.type) {
                case 'updatePlayer':
                    const playerIndex = players.findIndex(p => p.id === msg.data.id);
                    if (playerIndex !== -1) {
                        players[playerIndex] = msg.data;
                        broadcast(JSON.stringify({ type: 'playersUpdated', data: players }));
                        
                        // Check for winner
                        if (msg.data.points >= maxPoints) {
                            broadcast(JSON.stringify({ type: 'winner', data: msg.data }));
                        }
                    }
                    break;
                    
                case 'addPlayer':
                    players.push(msg.data);
                    broadcast(JSON.stringify({ type: 'playersUpdated', data: players }));
                    break;
                    
                case 'deletePlayer':
                    players = players.filter(p => p.id !== msg.data);
                    broadcast(JSON.stringify({ type: 'playersUpdated', data: players }));
                    break;
                    
                case 'resetPoints':
                    players = players.map(p => ({ ...p, points: 0 }));
                    broadcast(JSON.stringify({ type: 'playersUpdated', data: players }));
                    break;
                    
                case 'updateMaxPoints':
                    maxPoints = msg.data;
                    broadcast(JSON.stringify({ type: 'maxPointsUpdated', data: maxPoints }));
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
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

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});