document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.IO server
    const socket = io();
    
    // DOM elements
    const playerForm = document.getElementById('playerForm');
    const playerNameInput = document.getElementById('playerName');
    const playerAvatarInput = document.getElementById('playerAvatar');
    const playersList = document.getElementById('playersList');
    const resetPointsBtn = document.getElementById('resetPoints');
    const deleteAllPlayersBtn = document.getElementById('deleteAllPlayers');
    // Fixed max points value
    
    // Players array to store data locally
    let players = [];
    // Default max points to win
    let maxPoints = 30;
    
    // Generate random color for player avatar border
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };
    
    // Render players list
    const renderPlayers = () => {
        playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'col-md-6 col-lg-4';
            playerCard.innerHTML = `
                <div class="player-card">
                    <div class="d-flex align-items-center">
                        <div class="player-info d-flex align-items-center flex-grow-1">
                            <img src="${player.avatar}" alt="${player.name}" class="player-avatar" style="border-color: ${player.color};" data-id="${player.id}">
                            <div class="ms-2">
                                <h5 class="mb-0">${player.name}</h5>
                                <div class="text-muted">Puntos: <span class="points-display">${player.points}</span></div>
                            </div>
                        </div>
                        <div class="ms-2 d-flex align-items-center">
                            <button class="btn btn-sm btn-danger remove-point-btn" data-id="${player.id}">-</button>
                            <button class="btn btn-sm btn-success ms-1 add-point-btn" data-id="${player.id}">+</button>
                        </div>
                    </div>
                </div>
            `;
            
            playersList.appendChild(playerCard);

            // Add long-press event listener for deletion
            const playerAvatar = playerCard.querySelector('.player-avatar');
            let pressTimer;

            playerAvatar.addEventListener('mousedown', function() {
                pressTimer = setTimeout(() => {
                    deletePlayer(this.dataset.id);
                }, 3000);
            });

            playerAvatar.addEventListener('mouseleave', function() {
                clearTimeout(pressTimer);
            });

            playerAvatar.addEventListener('mouseup', function() {
                clearTimeout(pressTimer);
            });

            // Add touch events for mobile devices
            playerAvatar.addEventListener('touchstart', function(e) {
                e.preventDefault();
                pressTimer = setTimeout(() => {
                    deletePlayer(this.dataset.id);
                }, 3000);
            });

            playerAvatar.addEventListener('touchend', function(e) {
                e.preventDefault();
                clearTimeout(pressTimer);
            });

            playerAvatar.addEventListener('touchmove', function(e) {
                clearTimeout(pressTimer);
            });
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.add-point-btn').forEach(btn => {
            btn.addEventListener('click', () => addPoint(btn.dataset.id));
        });
        
        document.querySelectorAll('.remove-point-btn').forEach(btn => {
            btn.addEventListener('click', () => removePoint(btn.dataset.id));
        });
        
        // Save to localStorage
        localStorage.setItem('players', JSON.stringify(players));
    };
    
    // Add a new player
    const addPlayer = (name, avatar) => {
        const newPlayer = {
            id: Date.now().toString(),
            name,
            avatar,
            color: getRandomColor(),
            points: 0
        };
        
        // Emit to server
        socket.emit('addPlayer', newPlayer);
    };
    
    // Delete a player
    const deletePlayer = (playerId) => {
        if (confirm('¿Estás seguro de eliminar este jugador?')) {
            socket.emit('deletePlayer', playerId);
        }
    };
    
    // Edit a player
    const editPlayer = (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        
        const newName = prompt('Nuevo nombre:', player.name);
        if (!newName) return;
        
        // Create a file input element for avatar selection
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        // When user clicks cancel on file dialog, keep the old avatar
        fileInput.onchange = function() {
            if (fileInput.files && fileInput.files[0]) {
                // User selected a file, read it
                const reader = new FileReader();
                reader.onload = function(event) {
                    player.name = newName;
                    player.avatar = event.target.result;
                    socket.emit('updatePlayer', player);
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                // No file selected, keep old avatar but update name
                player.name = newName;
                socket.emit('updatePlayer', player);
            }
        };
        
        // Trigger file selection dialog
        fileInput.click();
    };

    
    // Add a point to a player
    const addPoint = (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        
        player.points += 1;
        socket.emit('updatePlayer', player);
    };
    
    // Remove a point from a player
    const removePoint = (playerId) => {
        const player = players.find(p => p.id === playerId);
        if (!player || player.points <= 0) return;
        
        player.points -= 1;
        socket.emit('updatePlayer', player);
    };
    
    // Reset all points
    const resetPoints = () => {
        if (confirm('¿Estás seguro de resetear todos los puntajes?')) {
            socket.emit('resetPoints');
        }
    };
    
    // Delete all players
    const deleteAllPlayers = () => {
        if (confirm('¿Estás seguro de eliminar a todos los jugadores?')) {
            players.forEach(player => {
                socket.emit('deletePlayer', player.id);
            });
            players = [];
            renderPlayers();
        }
    };
    
    // Event listeners
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = playerNameInput.value.trim();
        const avatarFile = playerAvatarInput.files[0];
        
        if (name && avatarFile) {
            // Use FileReader to read the image file
            const reader = new FileReader();
            reader.onload = function(event) {
                const avatarDataUrl = event.target.result;
                addPlayer(name, avatarDataUrl);
                playerNameInput.value = '';
                playerAvatarInput.value = '';
            };
            reader.readAsDataURL(avatarFile);
        }
    });
    
    resetPointsBtn.addEventListener('click', resetPoints);
    
    // Add event listener for delete all players button
    deleteAllPlayersBtn.addEventListener('click', deleteAllPlayers);
    
    // Socket event handlers
    socket.on('initialPlayers', (data) => {
        players = data;
        renderPlayers();
        // Save initial state to localStorage
        localStorage.setItem('players', JSON.stringify(players));
    });

    socket.on('playersUpdated', (data) => {
        players = data;
        renderPlayers();
    });
    
    socket.on('winner', (player) => {
        alert(`¡${player.name} ha ganado la carrera!`);
    });
});