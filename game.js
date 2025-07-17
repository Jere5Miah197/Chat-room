// Game State
class FarkleGame {
    constructor() {
        this.players = new Map();
        this.currentPlayer = null;
        this.gameStarted = false;
        this.currentUser = null;
        this.dice = [];
        this.selectedDice = [];
        this.turnScore = 0;
        this.friends = new Set();
        this.friendRequests = new Map();
        this.gameWinner = null;
        this.winningScore = 10000;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Enter key support for inputs
        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinGame();
        });
        
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        document.getElementById('friend-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendFriendRequest();
        });
    }

    addPlayer(username) {
        if (this.players.has(username)) {
            return false;
        }
        
        this.players.set(username, {
            name: username,
            score: 0,
            isOnline: true
        });
        
        if (!this.currentPlayer) {
            this.currentPlayer = username;
            this.gameStarted = true;
        }
        
        return true;
    }

    removePlayer(username) {
        this.players.delete(username);
        if (this.currentPlayer === username) {
            this.nextTurn();
        }
    }

    rollDice() {
        this.dice = [];
        this.selectedDice = [];
        
        // Roll 6 dice
        for (let i = 0; i < 6; i++) {
            this.dice.push(Math.floor(Math.random() * 6) + 1);
        }
        
        this.updateDiceDisplay();
        this.calculatePossibleScore();
        
        // Check for farkle
        if (this.calculateScore(this.dice) === 0) {
            this.handleFarkle();
        } else {
            this.updateGameButtons();
        }
    }

    selectDie(index) {
        if (this.selectedDice.includes(index)) {
            // Deselect
            this.selectedDice = this.selectedDice.filter(i => i !== index);
        } else {
            // Select
            this.selectedDice.push(index);
        }
        
        this.updateDiceDisplay();
        this.calculateTurnScore();
        this.updateGameButtons();
    }

    calculateScore(dice) {
        const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 unused, 1-6 for die faces
        dice.forEach(die => counts[die]++);
        
        let score = 0;
        
        // Check for straight (1,2,3,4,5,6)
        if (counts.slice(1).every(count => count === 1)) {
            return 1500;
        }
        
        // Check for three pairs
        let pairs = 0;
        for (let i = 1; i <= 6; i++) {
            if (counts[i] === 2) pairs++;
        }
        if (pairs === 3) {
            return 1500;
        }
        
        // Score three of a kind and more
        for (let i = 1; i <= 6; i++) {
            if (counts[i] >= 3) {
                if (i === 1) {
                    score += 1000 * Math.floor(counts[i] / 3);
                } else {
                    score += i * 100 * Math.floor(counts[i] / 3);
                }
                counts[i] %= 3;
            }
        }
        
        // Score individual 1s and 5s
        score += counts[1] * 100;
        score += counts[5] * 50;
        
        return score;
    }

    calculateTurnScore() {
        const selectedDiceValues = this.selectedDice.map(index => this.dice[index]);
        this.turnScore = this.calculateScore(selectedDiceValues);
        document.getElementById('turn-score').textContent = this.turnScore;
    }

    calculatePossibleScore() {
        // Highlight dice that can score
        const diceElements = document.querySelectorAll('.die');
        diceElements.forEach((die, index) => {
            const value = this.dice[index];
            if (value === 1 || value === 5 || this.canFormSet(value, index)) {
                die.classList.add('scoring');
            } else {
                die.classList.remove('scoring');
            }
        });
    }

    canFormSet(value, excludeIndex) {
        let count = 0;
        this.dice.forEach((die, index) => {
            if (die === value && index !== excludeIndex) count++;
        });
        return count >= 2; // Can form a set of 3
    }

    bankPoints() {
        if (this.turnScore === 0) return;
        
        const player = this.players.get(this.currentPlayer);
        player.score += this.turnScore;
        
        this.addChatMessage(`${this.currentPlayer} banked ${this.turnScore} points! Total: ${player.score}`, 'system');
        
        // Check for winner
        if (player.score >= this.winningScore) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        this.turnScore = 0;
        this.nextTurn();
    }

    passTurn() {
        this.addChatMessage(`${this.currentPlayer} passed their turn`, 'system');
        this.turnScore = 0;
        this.nextTurn();
    }

    handleFarkle() {
        this.addChatMessage(`${this.currentPlayer} FARKLED! No scoring dice.`, 'system');
        this.turnScore = 0;
        
        // Disable all buttons except pass
        document.getElementById('roll-btn').disabled = true;
        document.getElementById('bank-btn').disabled = true;
        document.getElementById('pass-btn').disabled = false;
        
        setTimeout(() => {
            this.nextTurn();
        }, 2000);
    }

    nextTurn() {
        const playerNames = Array.from(this.players.keys());
        const currentIndex = playerNames.indexOf(this.currentPlayer);
        const nextIndex = (currentIndex + 1) % playerNames.length;
        
        this.currentPlayer = playerNames[nextIndex];
        this.dice = [];
        this.selectedDice = [];
        this.turnScore = 0;
        
        this.updateGameDisplay();
        this.updateDiceDisplay();
        this.updateGameButtons();
    }

    endGame(winner) {
        this.gameWinner = winner;
        this.gameStarted = false;
        
        this.addChatMessage(`🎉 ${winner} wins with ${this.players.get(winner).score} points! 🎉`, 'system');
        
        // Disable all game buttons
        document.getElementById('roll-btn').disabled = true;
        document.getElementById('bank-btn').disabled = true;
        document.getElementById('pass-btn').disabled = true;
    }

    updateGameDisplay() {
        document.getElementById('current-player').textContent = this.currentPlayer || 'Waiting...';
        document.getElementById('turn-score').textContent = this.turnScore;
        this.updateScoreboard();
    }

    updateScoreboard() {
        const scoresList = document.getElementById('scores-list');
        scoresList.innerHTML = '';
        
        // Sort players by score (descending)
        const sortedPlayers = Array.from(this.players.entries())
            .sort((a, b) => b[1].score - a[1].score);
        
        sortedPlayers.forEach(([name, player]) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            if (name === this.currentPlayer && this.gameStarted) {
                scoreItem.classList.add('current-turn');
            }
            
            if (name === this.gameWinner) {
                scoreItem.classList.add('winner');
            }
            
            scoreItem.innerHTML = `
                <span>${name}</span>
                <span class="player-score">${player.score}</span>
            `;
            
            scoresList.appendChild(scoreItem);
        });
    }

    updateDiceDisplay() {
        const container = document.getElementById('dice-container');
        container.innerHTML = '';
        
        if (this.dice.length === 0) {
            container.innerHTML = '<div style="color: #a0aec0; font-style: italic;">Click "Roll Dice" to start</div>';
            return;
        }
        
        this.dice.forEach((value, index) => {
            const die = document.createElement('div');
            die.className = 'die';
            die.textContent = value;
            die.onclick = () => {
                if (this.currentUser === this.currentPlayer) {
                    this.selectDie(index);
                }
            };
            
            if (this.selectedDice.includes(index)) {
                die.classList.add('selected');
            }
            
            container.appendChild(die);
        });
    }

    updateGameButtons() {
        const isCurrentPlayer = this.currentUser === this.currentPlayer;
        const hasSelectedDice = this.selectedDice.length > 0;
        const canRoll = this.dice.length === 0 || this.selectedDice.length === 6;
        
        document.getElementById('roll-btn').disabled = !isCurrentPlayer || !canRoll;
        document.getElementById('bank-btn').disabled = !isCurrentPlayer || this.turnScore === 0;
        document.getElementById('pass-btn').disabled = !isCurrentPlayer || this.dice.length === 0;
    }

    addChatMessage(message, type = 'system', author = null) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        if (type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.textContent = message;
        } else {
            messageDiv.className = `message ${type}`;
            if (author && type === 'other') {
                messageDiv.innerHTML = `<div class="message-author">${author}</div>${message}`;
            } else {
                messageDiv.textContent = message;
            }
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendFriendRequest(targetUser) {
        if (targetUser === this.currentUser) {
            this.addChatMessage('You cannot send a friend request to yourself!', 'system');
            return false;
        }
        
        if (!this.players.has(targetUser)) {
            this.addChatMessage(`User ${targetUser} not found in the game.`, 'system');
            return false;
        }
        
        if (this.friends.has(targetUser)) {
            this.addChatMessage(`${targetUser} is already your friend!`, 'system');
            return false;
        }
        
        const requestKey = `${this.currentUser}-${targetUser}`;
        if (this.friendRequests.has(requestKey)) {
            this.addChatMessage(`Friend request already sent to ${targetUser}!`, 'system');
            return false;
        }
        
        this.friendRequests.set(requestKey, {
            from: this.currentUser,
            to: targetUser,
            timestamp: Date.now()
        });
        
        this.addChatMessage(`Friend request sent to ${targetUser}!`, 'system');
        this.updateFriendsDisplay();
        return true;
    }

    acceptFriendRequest(fromUser) {
        const requestKey = `${fromUser}-${this.currentUser}`;
        if (this.friendRequests.has(requestKey)) {
            this.friendRequests.delete(requestKey);
            this.friends.add(fromUser);
            this.addChatMessage(`You are now friends with ${fromUser}!`, 'system');
            this.updateFriendsDisplay();
        }
    }

    declineFriendRequest(fromUser) {
        const requestKey = `${fromUser}-${this.currentUser}`;
        if (this.friendRequests.has(requestKey)) {
            this.friendRequests.delete(requestKey);
            this.addChatMessage(`Declined friend request from ${fromUser}`, 'system');
            this.updateFriendsDisplay();
        }
    }

    updateFriendsDisplay() {
        // Update friend requests
        const requestsList = document.getElementById('requests-list');
        const requestsSection = document.getElementById('friend-requests');
        
        const userRequests = Array.from(this.friendRequests.values())
            .filter(req => req.to === this.currentUser);
        
        if (userRequests.length > 0) {
            requestsSection.style.display = 'block';
            requestsList.innerHTML = userRequests.map(req => `
                <div class="friend-request">
                    <div>${req.from} wants to be your friend</div>
                    <div class="friend-request-actions">
                        <button class="accept-btn" onclick="game.acceptFriendRequest('${req.from}')">Accept</button>
                        <button class="decline-btn" onclick="game.declineFriendRequest('${req.from}')">Decline</button>
                    </div>
                </div>
            `).join('');
        } else {
            requestsSection.style.display = 'none';
        }
        
        // Update friends list
        const friendsDisplay = document.getElementById('friends-display');
        if (this.friends.size > 0) {
            friendsDisplay.innerHTML = Array.from(this.friends).join(', ');
        } else {
            friendsDisplay.textContent = 'No friends yet';
        }
    }
}

// Global game instance
const game = new FarkleGame();

// Global functions for HTML onclick handlers
function joinGame() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    if (username.length > 20) {
        alert('Username must be 20 characters or less');
        return;
    }
    
    if (!game.addPlayer(username)) {
        alert('Username already taken. Please choose another.');
        return;
    }
    
    game.currentUser = username;
    
    // Show game section, hide login
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('player-info').style.display = 'flex';
    document.getElementById('current-user').textContent = username;
    
    game.updateGameDisplay();
    game.updateGameButtons();
    game.addChatMessage(`${username} joined the game!`, 'system');
}

function leaveGame() {
    if (confirm('Are you sure you want to leave the game?')) {
        game.removePlayer(game.currentUser);
        game.addChatMessage(`${game.currentUser} left the game`, 'system');
        
        // Reset to login screen
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('game-section').style.display = 'none';
        document.getElementById('player-info').style.display = 'none';
        document.getElementById('username-input').value = '';
        
        game.currentUser = null;
    }
}

function rollDice() {
    if (game.currentUser !== game.currentPlayer) return;
    
    // Add rolling animation
    const diceContainer = document.getElementById('dice-container');
    diceContainer.style.opacity = '0.5';
    
    setTimeout(() => {
        game.rollDice();
        diceContainer.style.opacity = '1';
        game.addChatMessage(`${game.currentUser} rolled: ${game.dice.join(', ')}`, 'system');
    }, 300);
}

function bankPoints() {
    if (game.currentUser !== game.currentPlayer) return;
    game.bankPoints();
}

function passTurn() {
    if (game.currentUser !== game.currentPlayer) return;
    game.passTurn();
}

function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || !game.currentUser) return;
    
    // Handle special commands
    if (message.startsWith('/roll') && game.currentUser === game.currentPlayer) {
        rollDice();
        chatInput.value = '';
        return;
    }
    
    game.addChatMessage(message, 'user');
    
    // Simulate other players seeing the message
    setTimeout(() => {
        game.addChatMessage(message, 'other', game.currentUser);
    }, 100);
    
    chatInput.value = '';
}

function sendFriendRequest() {
    const friendInput = document.getElementById('friend-input');
    const targetUser = friendInput.value.trim();
    
    if (!targetUser) return;
    
    if (game.sendFriendRequest(targetUser)) {
        friendInput.value = '';
    }
}

function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="system-message">Chat cleared</div>';
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game.updateGameDisplay();
});