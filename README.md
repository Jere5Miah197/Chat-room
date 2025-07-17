


    
    
    Farkle Dice Game
    
        body {
            font-family: 'Press Start 2P', cursive;
            background-color: #1a1a1a;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        #game-container {
            text-align: center;
            background-color: #333;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
            max-width: 800px;
            width: 90%;
        }
        #login-screen, #game-screen {
            display: none;
        }
        #login-screen.active, #game-screen.active {
            display: block;
        }
        #dice-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }
        .die {
            width: 60px;
            height: 60px;
            background-color: #ffeb3b;
            border: 2px solid #000;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            cursor: pointer;
            user-select: none;
        }
        .die.selected {
            background-color: #fbc02d;
            border-color: #fff;
        }
        .die.faded {
            opacity: 0.5;
        }
        button {
            background-color: #ffeb3b;
            border: 2px solid #000;
            padding: 10px 20px;
            font-family: 'Press Start 2P', cursive;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
        }
        button:hover {
            background-color: #fbc02d;
        }
        #scorecard {
            margin: 20px 0;
            font-size: 14px;
        }
        #scorecard table {
            width: 100%;
            border-collapse: collapse;
        }
        #scorecard th, #scorecard td {
            border: 1px solid #fff;
            padding: 8px;
        }
        input[type="text"] {
            padding: 10px;
            font-size: 16px;
            font-family: 'Press Start 2P', cursive;
            text-transform: uppercase;
            margin: 10px;
        }
        .error {
            color: #ff4444;
            font-size: 12px;
        }
        @font-face {
            font-family: 'PressStart2P';
            src: url('https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2') format('woff2');
        }
    


    
        
            Farkle Dice Game
            Enter your 3 initials to play:
            
            
            Login
        
        
            Farkle Dice Game
            
            Roll the dice to start your turn!
            
            Current Turn Score: 0
            Roll Dice
            Bank Points
            
                Scorecard
                
                    
                        
                            Player
                            Banked Points
                        
                    
                    
                
            
        
    
    
        let playerInitials = '';
        let dice = [0, 0, 0, 0, 0, 0];
        let selectedDice = [false, false, false, false, false, false];
        let turnScore = 0;
        let bankedScore = 0;
        let gameOver = false;

<pre><code>    function login() {
        const input = document.getElementById(&#39;player-initials&#39;).value.toUpperCase();
        const error = document.getElementById(&#39;login-error&#39;);
        if (input.length === 3 &amp;&amp; /^[A-Z]{3}$/.test(input)) {
            playerInitials = input;
            document.getElementById(&#39;login-screen&#39;).classList.remove(&#39;active&#39;);
            document.getElementById(&#39;game-screen&#39;).classList.add(&#39;active&#39;);
            document.getElementById(&#39;player-name&#39;).textContent = `Player: ${playerInitials}`;
            bankedScore = 0; // Ensure bankedScore is reset
            updateScorecard(); // Initialize scorecard
        } else {
            error.textContent = &#39;Please enter exactly 3 letters.&#39;;
        }
    }

    function rollDice() {
        if (gameOver) return;
        const diceContainer = document.getElementById(&#39;dice-container&#39;);
        diceContainer.innerHTML = &#39;&#39;;
        turnScore = 0;
        selectedDice = [false, false, false, false, false, false];
        for (let i = 0; i &lt; 6; i++) {
            if (!selectedDice[i]) {
                dice[i] = Math.floor(Math.random() * 6) + 1;
            }
            const die = document.createElement(&#39;div&#39;);
            die.className = &#39;die&#39;;
            die.textContent = dice[i];
            die.onclick = () =&gt; selectDie(i);
            diceContainer.appendChild(die);
        }
        const score = calculateScore();
        document.getElementById(&#39;turn-score&#39;).textContent = turnScore;
        document.getElementById(&#39;game-status&#39;).textContent = score &gt; 0 ? &#39;Select scoring dice or bank points.&#39; : &#39;Farkle! No scoring dice. Click Roll to try again.&#39;;
        document.getElementById(&#39;roll-button&#39;).disabled = score === 0;
        document.getElementById(&#39;bank-button&#39;).disabled = score === 0 || (bankedScore === 0 &amp;&amp; turnScore &lt; 500);
    }

    function selectDie(index) {
        if (gameOver || selectedDice[index]) return;
        selectedDice[index] = true;
        const diceElements = document.getElementsByClassName(&#39;die&#39;);
        diceElements[index].classList.add(&#39;selected&#39;);
        turnScore = calculateScore();
        document.getElementById(&#39;turn-score&#39;).textContent = turnScore;
        document.getElementById(&#39;bank-button&#39;).disabled = bankedScore === 0 &amp;&amp; turnScore &lt; 500;
        document.getElementById(&#39;game-status&#39;).textContent = &#39;Select more dice or bank points.&#39;;
        if (selectedDice.every(val =&gt; val)) {
            document.getElementById(&#39;game-status&#39;).textContent = &#39;Hot Dice! Roll all dice again or bank points.&#39;;
        }
    }

    function calculateScore() {
        let score = 0;
        const counts = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i &lt; 6; i++) {
            if (selectedDice[i]) {
                counts[dice[i]]++;
            }
        }
        for (let i = 1; i &lt;= 6; i++) {
            if (counts[i] &gt;= 3) {
                score += i === 1 ? 1000 : i * 100;
                counts[i] -= 3;
            }
        }
        score += counts[1] * 100;
        score += counts[5] * 50;
        if (selectedDice.every((val, idx) =&gt; val || dice[idx] === 0)) {
            const rolledCounts = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i &lt; 6; i++) {
                if (!selectedDice[i]) {
                    rolledCounts[dice[i]]++;
                }
            }
            if (rolledCounts.slice(1).every(count =&gt; count === 0)) {
                return 0;
            }
        }
        return score;
    }

    function bankPoints() {
        if (gameOver || (bankedScore === 0 &amp;&amp; turnScore &lt; 500)) return;
        bankedScore += turnScore;
        updateScorecard();
        if (bankedScore &gt;= 10000) {
            gameOver = true;
            document.getElementById(&#39;game-status&#39;).textContent = `Game Over! ${playerInitials} wins with ${bankedScore} points!`;
            document.getElementById(&#39;roll-button&#39;).disabled = true;
            document.getElementById(&#39;bank-button&#39;).disabled = true;
            return;
        }
        dice = [0, 0, 0, 0, 0, 0];
        selectedDice = [false, false, false, false, false, false];
        turnScore = 0;
        document.getElementById(&#39;dice-container&#39;).innerHTML = &#39;&#39;;
        document.getElementById(&#39;turn-score&#39;).textContent = turnScore;
        document.getElementById(&#39;roll-button&#39;).disabled = false;
        document.getElementById(&#39;bank-button&#39;).disabled = true;
        document.getElementById(&#39;game-status&#39;).textContent = &#39;Roll the dice to start your turn!&#39;;
    }

    function updateScorecard() {
        const scorecardBody = document.getElementById(&#39;scorecard-body&#39;);
        scorecardBody.innerHTML = &#39;&#39;; // Clear existing content
        const row = document.createElement(&#39;tr&#39;);
        row.innerHTML = `
            &lt;td&gt;${playerInitials || &#39;N/A&#39;}&lt;/td&gt;
            &lt;td&gt;${bankedScore}&lt;/td&gt;
        `;
        scorecardBody.appendChild(row);
    }

    // Initialize scorecard on page load
    document.addEventListener(&#39;DOMContentLoaded&#39;, () =&gt; {
        updateScorecard();
    });
&lt;/script&gt;
</code></pre>
</body>
</html>
