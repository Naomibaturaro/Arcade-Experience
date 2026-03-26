// 1. VERIFICACIÓN DE SESIÓN Y CARGA INICIAL
window.onload = () => {
    const sessionActive = sessionStorage.getItem('sessionActive');
    const denied = document.getElementById('denied-overlay');

    if (!sessionActive) {
        document.body.classList.add("no-session");
        if(denied) denied.style.display = 'flex';
        return; 
    } else {
        // SEGURIDAD EXTRA: Si hay sesión, borramos el overlay por completo
        if(denied) denied.remove(); 
        document.body.classList.remove("no-session");
    }
 
    const user = sessionStorage.getItem('arcadeUser') || "JUGADOR";
    const welcomeTitle = document.getElementById('welcome-user');
    
    // Usar backticks ` para que la variable funcione
    if(welcomeTitle) welcomeTitle.innerText = `HOLA, ${user.toUpperCase()}`;
    
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if(loader) {
            loader.style.opacity = "0";
            setTimeout(() => { loader.style.display = "none"; }, 500);
        }
    }, 1500);
};
// 2. VARIABLES DE ESTADO GLOBALES
let currentGame = null, animationId = null, gameActive = false, globalScore = 0;
let touchDir = null; // Unificamos touchDir para Joystick y Botones

// 3. LÓGICA DEL ASISTENTE / CHAT
function toggleChat() {
    const chat = document.getElementById('chat-container');
    if (!chat) return;
    if (chat.classList.contains('active')) {
        chat.classList.remove('active');
        setTimeout(() => { chat.style.display = 'none'; }, 300);
    } else {
        chat.style.display = 'flex';
        setTimeout(() => { chat.classList.add('active'); }, 10);
    }
}

function openRandomGame() {
    const games = ['snake', 'pacman', 'dodge', 'breakout'];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const msgs = document.getElementById('chat-messages');
    if(msgs) {
        msgs.innerHTML += `<div class="bot-msg">🤖: ¡Buena elección! Iniciando ${randomGame.toUpperCase()}...</div>`;
        msgs.scrollTop = msgs.scrollHeight;
    }
    setTimeout(() => { 
        if(document.getElementById('chat-container').classList.contains('active')) toggleChat();
        openWindow(randomGame); 
    }, 800);
}

function chatLogic(op) {
    const msgs = document.getElementById('chat-messages');
    if(!msgs) return;
    let resp = "";
    if (op === 'juegos') {
        const sugerencias = [
            "Te recomiendo 'REBOTE', los efectos de partículas quedaron geniales.",
            "Si buscas un reto, el modo 'DODGE' ahora es más veloz.",
            "Probá 'JUMP', es ideal para superar récords."
        ];
        resp = sugerencias[Math.floor(Math.random() * sugerencias.length)];
    } else if (op === 'error') {
        resp = "¡Entendido! Completá el formulario de **REPORTE** al final de la página.";
        setTimeout(() => {
            toggleChat();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }
    msgs.innerHTML += `<div class="bot-msg">🤖: ${resp}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

// 4. BLOQUEO DE INPUT Y JOYSTICK LOGIC
function blockBackgroundInteraction(enable){
    const body = document.body;
    if(enable){
        body.classList.add("game-active");
        document.addEventListener("touchmove", preventScroll, { passive: false });
    } else {
        body.classList.remove("game-active");
        document.removeEventListener("touchmove", preventScroll);
    }
}

function preventScroll(e){
    if(document.getElementById("gameWindow")?.classList.contains("active")) e.preventDefault();
}

// --- NUEVA LÓGICA DE JOYSTICK  ---
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

if (joystickBase) {
    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const dist = Math.min(40, Math.sqrt(deltaX**2 + deltaY**2));
        const angle = Math.atan2(deltaY, deltaX);

        joystickStick.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;

        // Mapeo a tu touchDir original para que los juegos lo entiendan
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            touchDir = deltaX > 0 ? "right" : "left";
        } else {
            touchDir = deltaY > 0 ? "down" : "up";
        }
    }, { passive: false });

    joystickBase.addEventListener('touchend', () => {
        joystickStick.style.transform = `translate(-50%, -50%)`;
        if(currentGame !== 'snake') touchDir = null;
    });
}

// 5. CONTROL DE VENTANAS
function openWindow(game) {
    stopGame(); 
    currentGame = game;
    touchDir = null; // Reset de dirección

    const win = document.getElementById("gameWindow");
    blockBackgroundInteraction(true);

    if(win){
        win.classList.remove("closing");
        win.classList.add("active");
    }

    const openSound = document.getElementById("openSound");
    if (openSound) { openSound.currentTime = 0; openSound.play().catch(()=>{}); }
    if (navigator.vibrate) navigator.vibrate(40);

    document.getElementById("gameTitle").innerText = `MÓDULO: ${game.toUpperCase()}`;
    document.getElementById("overlay").style.display = "none";
    document.getElementById("startBtn").style.display = "block";
}

function initGame() {
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    gameActive = true; 
    globalScore = 0;

    if(currentGame === 'snake') startSnake();
    else if(currentGame === 'breakout') startBreakout();
    else if(currentGame === 'dodge') startDodge();
    else if(currentGame === 'pacman') startPacMan();
}

function stopGame(){
    gameActive = false;
    if(animationId) cancelAnimationFrame(animationId);
    if(window.gameInterval) clearInterval(window.gameInterval);
    document.onkeydown = null;
}

function gameOver(score){
    document.getElementById("finalScore").innerText = "PUNTAJE: " + score;
    document.getElementById("overlay").style.display = "flex";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    stopGame();
}

function closeGameWindow() {
    const win = document.getElementById("gameWindow");
    if(win){
        win.classList.add("closing");
        setTimeout(() => {
            win.classList.remove("active", "closing");
            blockBackgroundInteraction(false);
            stopGame();
        }, 300);
    }
}
function restartCurrentGame() {
    document.getElementById("overlay").style.display = "none";
    stopGame();
    setTimeout(() => initGame(), 50);
}
// ================= JUEGOS =================

function startSnake() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let snake = [{x: 200, y: 140}, {x: 180, y: 140}], food = {x: 100, y: 100}, dx = 20, dy = 0, lastUpdate = 0;

    document.onkeydown = (e) => {
        if(e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
        else if(e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
        else if(e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
        else if(e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
    };

    function loop(time) {
        if (!gameActive) return;
        animationId = requestAnimationFrame(loop);
        
        // El joystick ahora llena touchDir, y esto lo detecta:
        if(touchDir === "up" && dy === 0){ dx=0; dy=-20; }
        if(touchDir === "down" && dy === 0){ dx=0; dy=20; }
        if(touchDir === "left" && dx === 0){ dx=-20; dy=0; }
        if(touchDir === "right" && dx === 0){ dx=20; dy=0; }

        if (time - lastUpdate < 100) return;
        lastUpdate = time;

        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 300 || snake.some(s => s.x === head.x && s.y === head.y)) { 
            gameOver(globalScore); return; 
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) { 
            globalScore += 10; 
            food = { x: Math.floor(Math.random()*20)*20, y: Math.floor(Math.random()*15)*20 };
        } else { snake.pop(); }

        ctx.clearRect(0, 0, 400, 300);
        ctx.fillStyle = "#f0f"; ctx.fillRect(food.x, food.y, 18, 18);
        ctx.fillStyle = "#0ff"; snake.forEach(s => ctx.fillRect(s.x, s.y, 18, 18));
    }
    loop(0);
}

function startPacMan() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    const grid = 20, maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    const offsetY = 100;
    let px = 20, py = 120, score = 0, dir = {x:0, y:0}, speed = 2;

    document.onkeydown = (e) => {
        if(e.key === "ArrowLeft") dir={x:-speed, y:0};
        else if(e.key === "ArrowRight") dir={x:speed, y:0};
        else if(e.key === "ArrowUp") dir={x:0, y:-speed};
        else if(e.key === "ArrowDown") dir={x:0, y:speed};
    };

    function loop() {
        if(!gameActive) return;
        
        // CONEXIÓN CON JOYSTICK
        if(touchDir === "left") dir={x:-speed, y:0};
        if(touchDir === "right") dir={x:speed, y:0};
        if(touchDir === "up") dir={x:0, y:-speed};
        if(touchDir === "down") dir={x:0, y:speed};

        let nextX = px + dir.x, nextY = py + dir.y;
        let col = Math.floor((nextX + 10) / grid), row = Math.floor((nextY - offsetY + 10) / grid);

        if (maze[row] && maze[row][col] !== 1) {
            px = nextX; py = nextY;
            if(maze[row][col] === 2) { maze[row][col] = 0; score += 10; globalScore = score; }
        }

        ctx.fillStyle="#000"; ctx.fillRect(0,0,400,300);
        for(let r=0; r<maze.length; r++) {
            for(let c=0; c<maze[r].length; c++) {
                if(maze[r][c] === 1) { ctx.fillStyle="#00f"; ctx.fillRect(c*20, r*20+offsetY, 20, 20); }
                else if(maze[r][c] === 2) { ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(c*20+10, r*20+offsetY+10, 3, 0, 7); ctx.fill(); }
            }
        }
        ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(px+10, py+10, 8, 0, 7); ctx.fill();
        animationId = requestAnimationFrame(loop);
    }
    loop();
}

function startBreakout() {
    const canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d");
    let paddleX=160, ballX=200, ballY=250, ballDX=3, ballDY=-3, score=0, keys = {};

    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;

    function loop() {
        if(!gameActive) return;
        
        // CONEXIÓN CON JOYSTICK + TECLADO
        if((keys.ArrowLeft || touchDir === "left") && paddleX > 0) paddleX -= 7;
        if((keys.ArrowRight || touchDir === "right") && paddleX < 320) paddleX += 7;

        ballX += ballDX; ballY += ballDY;
        if(ballX<0 || ballX>390) ballDX *= -1;
        if(ballY<0) ballDY *= -1;
        if(ballY>280 && ballX>paddleX && ballX<paddleX+80) ballDY = -Math.abs(ballDY);
        if(ballY>300) return gameOver(score);

        ctx.fillStyle="#000"; ctx.fillRect(0,0,400,300);
        ctx.fillStyle="#0ff"; ctx.fillRect(paddleX,280,80,10);
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(ballX,ballY,6,0,7); ctx.fill();
        animationId = requestAnimationFrame(loop);
    }
    loop();
}

function startDodge() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let px = 180, obs = [], keys = {};

    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;

    window.gameInterval = setInterval(() => {
        if(gameActive) obs.push({ x: Math.random()*370, y: -30, speed: 3+Math.random()*3 });
    }, 500);

    function loop() {
        if (!gameActive) return;

        // CONEXIÓN CON JOYSTICK + TECLADO
        if ((keys.ArrowLeft || touchDir === "left") && px > 0) px -= 7;
        if ((keys.ArrowRight || touchDir === "right") && px < 380) px += 7;

        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0,0,400,300);
        ctx.fillStyle = "#0ff"; ctx.fillRect(px, 270, 20, 20);

        obs.forEach((o, i) => {
            o.y += o.speed;
            ctx.fillStyle = "#f00"; ctx.fillRect(o.x, o.y, 25, 25);
            if (o.y > 250 && o.y < 290 && o.x < px+20 && o.x+25 > px) gameOver(globalScore);
            if (o.y > 300) { obs.splice(i, 1); globalScore++; }
        });
        animationId = requestAnimationFrame(loop);
    }
    loop();
}
