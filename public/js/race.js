document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.IO server
    const socket = io();
    
    // DOM elements
    const raceTrack = document.getElementById('raceTrack');
    const winnerAlert = document.getElementById('winnerAlert');
    const winnerMessage = document.getElementById('winnerMessage');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerName = document.getElementById('winnerName');
    
    // Players array to store data locally
    let players = [];
    // Default max points to win (will be updated from server)
    let maxPoints = 30;
    // Track if there's currently a winner being displayed
    let currentWinner = null;
    
    // Calculate position based on points (percentage of track based on maxPoints)
    const calculatePosition = (points) => {
        const percentage = Math.min((points / maxPoints) * 100, 100);
        return `${percentage}%`;
    };
    
    // Render race track with players
    const renderRaceTrack = () => {
        raceTrack.innerHTML = '';
        
        players.forEach(player => {
            const raceLane = document.createElement('div');
            raceLane.className = 'race-lane';
            
            const runner = document.createElement('div');
            runner.className = 'runner';
            runner.id = `runner-${player.id}`;
            runner.style.left = calculatePosition(player.points);
            
            // Add winner class if player has reached maxPoints
            if (player.points >= maxPoints) {
                runner.classList.add('winner');
            }
            
            runner.innerHTML = `
                <img src="${player.avatar}" alt="${player.name}" style="border-color: ${player.color}">
                <span>${player.name} (${player.points} pts)</span>
            `;
            
            // Add finish line
            const finishLine = document.createElement('div');
            finishLine.className = 'finish-line';
            
            raceLane.appendChild(runner);
            raceLane.appendChild(finishLine);
            raceTrack.appendChild(raceLane);
        });
        
        // Check if we need to hide the winner display
        checkWinnerStatus();
    };
    
    // Check if there's still a winner and hide display if not
    const checkWinnerStatus = () => {
        const stillWinner = players.some(p => p.points >= maxPoints);
        
        // If there was a winner but no one has winning points anymore
        if (currentWinner && !stillWinner) {
            hideWinnerDisplay();
        }
    };
    
    // Hide winner celebration
    const hideWinnerDisplay = () => {
        winnerAlert.classList.add('d-none');
        winnerDisplay.classList.add('d-none');
        currentWinner = null;
        
        // Remove winner class from all runners
        document.querySelectorAll('.runner.winner').forEach(el => {
            el.classList.remove('winner');
        });
    };
    
    // Show winner celebration
    const celebrateWinner = (player) => {
        currentWinner = player.id;
        winnerMessage.textContent = `¡Felicidades a ${player.name} por ganar la carrera!`;
        winnerAlert.classList.remove('d-none');
        
        // Show large winner display
        winnerAvatar.src = player.avatar;
        winnerName.textContent = player.name;
        winnerDisplay.classList.remove('d-none');
        
        // Trigger confetti animation
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // Highlight the winner in the race track
        const winnerElement = document.getElementById(`runner-${player.id}`);
        if (winnerElement) {
            winnerElement.classList.add('winner');
        }
    };
    
    // Socket event handlers
    socket.on('initialPlayers', (data) => {
        players = data;
        renderRaceTrack();
        
        // Check if there's already a winner
        const winner = players.find(p => p.points >= maxPoints);
        if (winner) {
            celebrateWinner(winner);
        }
    });
    
    socket.on('playersUpdated', (data) => {
        players = data;
        renderRaceTrack();
    });
    
    socket.on('winner', (player) => {
        celebrateWinner(player);
    });
    
    socket.on('maxPointsUpdated', (points) => {
        maxPoints = points;
        renderRaceTrack();
    });
});