// 1. VERIFICACIÓN DE SESIÓN Y CARGA INICIAL
window.onload = () => {
    if (!sessionStorage.getItem('sessionActive')) {
        const denied = document.getElementById('denied-overlay');
        if(denied) denied.style.display = 'flex';
        return;
    }

    const user = sessionStorage.getItem('arcadeUser') || "JUGADOR";
    const welcomeTitle = document.getElementById('welcome-user');
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
let touchX = null, touchY = null;

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

// Eventos de Touch
document.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
document.addEventListener("touchmove", (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
document.addEventListener("touchend", () => { touchX = null; touchY = null; });

/// 4. CONTROL DE VENTANAS Y MOTOR DE JUEGO
function openWindow(game) {
    stopGame(); 
    currentGame = game;
    const win = document.getElementById("gameWindow");
    const title = document.getElementById("gameTitle");
    const btn = document.getElementById("startBtn");
    const overlay = document.getElementById("overlay");
    const canvas = document.getElementById("gameCanvas");

    if(win) win.classList.add("active");
    if(title) title.innerText = `MÓDULO: ${game.toUpperCase()}`;
    if(overlay) overlay.style.display = "none";
    if(btn) btn.style.display = "block";
    
    if(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function stopGame() { 
    gameActive = false; 
    if (animationId) cancelAnimationFrame(animationId); 
    if (window.gameInterval) clearInterval(window.gameInterval);
    document.onkeydown = null; 
}

// ESTA FUNCIÓN DEBE ESTAR AFUERA
function restartCurrentGame() {
    const overlay = document.getElementById("overlay");
    if(overlay) overlay.style.display = "none";
    stopGame(); 
    initGame(); 
}

function initGame() {
    const btn = document.getElementById("startBtn");
    const overlay = document.getElementById("overlay");
    if(btn) btn.style.display = "none";
    if(overlay) overlay.style.display = "none";
    
    gameActive = true; 
    globalScore = 0;

    if(currentGame === 'snake') startSnake();
    else if(currentGame === 'breakout') startBreakout();
    else if(currentGame === 'dodge') startDodge();
    else if(currentGame === 'pacman') startPacMan();
}
// ================= JUEGOS CORREGIDOS =================

function startPacMan() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    const grid = 20;
    let score = 0;
    
    // El laberinto actual (5 filas x 20 columnas)
    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    // --- CÁLCULO DE CENTRADO ---
    // El laberinto mide: ancho = 20 * 20 (400) | alto = 5 * 20 (100)
    // El canvas mide: 400 x 300
    const offsetX = (canvas.width - (maze[0].length * grid)) / 2; // Será 0 porque ocupa todo el ancho
    const offsetY = (canvas.height - (maze.length * grid)) / 2;    // Será (300 - 100) / 2 = 100px de margen arriba

    let px = 20 + offsetX, py = 20 + offsetY; 
    let dir = {x:0, y:0}, speed = 2;

    const ghosts = [
        {x: 100 + offsetX, y: 20 + offsetY, color: "#f00", dx: speed, dy: 0},
        {x: 200 + offsetX, y: 60 + offsetY, color: "#0f0", dx: -speed, dy: 0}
    ];

    document.onkeydown = (e) => {
        if(e.key === "ArrowLeft") dir={x:-speed, y:0};
        else if(e.key === "ArrowRight") dir={x:speed, y:0};
        else if(e.key === "ArrowUp") dir={x:0, y:-speed};
        else if(e.key === "ArrowDown") dir={x:0, y:speed};
    };

    function loop() {
        if(!gameActive) return;
        
        // Movimiento con colisiones relativas al offsetY
        let nextX = px + dir.x;
        let nextY = py + dir.y;
        
        // Ajustamos el cálculo de colisión restando el offset
        let col = Math.floor((nextX - offsetX + grid/2) / grid);
        let row = Math.floor((nextY - offsetY + grid/2) / grid);

        if (maze[row] && maze[row][col] !== 1) {
            px = nextX; py = nextY;
            if(maze[row][col] === 2) { 
                maze[row][col] = 0; 
                score += 10; 
                globalScore = score; // Actualizamos la global
            }
        }

        ctx.fillStyle="#000"; ctx.fillRect(0,0,400,300);
        
        // Dibujar Maze con el Offset
        for(let r=0; r<maze.length; r++){
            for(let c=0; c<maze[r].length; c++){
                let x = c * grid + offsetX;
                let y = r * grid + offsetY;
                if(maze[r][c] === 1){ 
                    ctx.fillStyle="#00f"; 
                    ctx.fillRect(x, y, grid, grid); 
                }
                else if(maze[r][c] === 2){ 
                    ctx.fillStyle="#ff0"; 
                    ctx.beginPath(); 
                    ctx.arc(x + grid/2, y + grid/2, 3, 0, Math.PI*2); 
                    ctx.fill(); 
                }
            }
        }

        // Pacman
        ctx.fillStyle="#ff0"; 
        ctx.beginPath(); 
        ctx.arc(px + grid/2, py + grid/2, grid/2-2, 0, Math.PI*2); 
        ctx.fill();

        // Fantasmas
        ghosts.forEach(g => {
            g.x += g.dx; g.y += g.dy;
            let gCol = Math.floor((g.x - offsetX + grid/2) / grid);
            let gRow = Math.floor((g.y - offsetY + grid/2) / grid);
            
            if(!maze[gRow] || maze[gRow][gCol] === 1) { g.dx *= -1; g.dy *= -1; }

            ctx.fillStyle=g.color; 
            ctx.beginPath(); 
            ctx.arc(g.x + grid/2, g.y + grid/2, grid/2-2, 0, Math.PI*2); 
            ctx.fill();
            
            if(Math.abs(px - g.x) < 15 && Math.abs(py - g.y) < 15) gameOver(score);
        });

        animationId = requestAnimationFrame(loop);
    }
    loop();
}
function startBreakout() {
    const canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d");
    let paddleX=160, ballX=200, ballY=250, ballDX=3, ballDY=-3, score=0;
    const rows=3, cols=6, bricks=[];
    let keys = {};

    for(let c=0;c<cols;c++){
        bricks[c]=[];
        for(let r=0;r<rows;r++){ bricks[c][r]={x:0,y:0,status:1,color: `hsl(${c*40},70%,60%)`}; }
    }

    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;

    function loop() {
        if(!gameActive) return;
        if(keys.ArrowLeft && paddleX > 0) paddleX -= 6;
        if(keys.ArrowRight && paddleX < 320) paddleX += 6;

        ballX += ballDX; ballY += ballDY;
        if(ballX<0 || ballX>390) ballDX *= -1;
        if(ballY<0) ballDY *= -1;
        if(ballY>290) { gameOver(score); return; }

        if(ballY>275 && ballX>paddleX && ballX<paddleX+80) ballDY = -Math.abs(ballDY);

        ctx.fillStyle="#000"; ctx.fillRect(0,0,400,300);
        ctx.fillStyle="#0ff"; ctx.fillRect(paddleX,280,80,10);
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(ballX,ballY,6,0,Math.PI*2); ctx.fill();

        bricks.forEach((col, c) => col.forEach((b, r) => {
            if (b.status) {
                let bx=c*65+10, by=r*25+30;
                if(ballX>bx && ballX<bx+60 && ballY>by && ballY<by+20) { b.status=0; ballDY*=-1; score+=10; globalScore=score; }
                ctx.fillStyle = b.color; ctx.fillRect(bx, by, 60, 20);
            }
        }));

        animationId = requestAnimationFrame(loop);
    }
    loop();
}

function startSnake() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let snake = [{x: 200, y: 140}, {x: 180, y: 140}];
    let food = {x: 100, y: 100};
    let dx = 20, dy = 0, lastUpdate = 0;
    let changingDirection = false; // Bloqueo para evitar giros de 180 grados rápidos

    document.onkeydown = (e) => {
        if (changingDirection) return;
        changingDirection = true;
        
        if(e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
        else if(e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
        else if(e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
        else if(e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
    };

    function loop(time) {
        if (!gameActive) return;
        animationId = requestAnimationFrame(loop);
        
        // Control de velocidad (100ms es una velocidad arcade clásica)
        if (time - lastUpdate < 100) return;
        lastUpdate = time;
        changingDirection = false; // Desbloqueamos el giro en cada frame

        const head = {x: snake[0].x + dx, y: snake[0].y + dy};

        // Colisiones con paredes y cuerpo
        if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 300 || snake.some(s => s.x === head.x && s.y === head.y)) { 
            gameOver(globalScore); 
            return; 
        }
        
        snake.unshift(head);

        // Si come
        if (head.x === food.x && head.y === food.y) { 
            globalScore += 10; 
            // Cálculo exacto para que la comida SIEMPRE caiga en la rejilla de 20px
            food = {
                x: Math.floor(Math.random() * (canvas.width / 20)) * 20,
                y: Math.floor(Math.random() * (canvas.height / 20)) * 20
            }; 
        } else { 
            snake.pop(); 
        }

        // Renderizado
        ctx.clearRect(0, 0, 400, 300);
        
        // Dibujar comida (Neon Pink)
        ctx.fillStyle = "#f0f";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f0f";
        ctx.fillRect(food.x, food.y, 18, 18);
        
        // Dibujar serpiente (Neon Cyan)
        ctx.fillStyle = "#0ff";
        ctx.shadowColor = "#0ff";
        snake.forEach((s, index) => {
            // La cabeza brilla un poco más
            ctx.shadowBlur = index === 0 ? 15 : 5;
            ctx.fillRect(s.x, s.y, 18, 18);
        });
        
        // Limpiar sombras para no afectar otros elementos
        ctx.shadowBlur = 0;
    }
    loop(0);
}

function startDodge() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let px = 180, obs = [], keys = {};
    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;

    window.gameInterval = setInterval(() => {
        if(!gameActive) return;
        obs.push({ x: Math.random() * 370, y: -30, w: 25, h: 25, speed: 3 + Math.random() * 3 });
    }, 500);

    function loop() {
        if (!gameActive) return;
        if (keys["ArrowLeft"] && px > 0) px -= 7; if (keys["ArrowRight"] && px < 380) px += 7;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#0ff"; ctx.fillRect(px, 270, 20, 20);

        obs.forEach((o, i) => {
            o.y += o.speed;
            ctx.fillStyle = "#f00"; ctx.fillRect(o.x, o.y, o.w, o.h);
            if (o.y > 250 && o.y < 290 && o.x < px + 20 && o.x + o.w > px) gameOver(globalScore);
            if (o.y > 300) { obs.splice(i, 1); globalScore++; }
        });
        animationId = requestAnimationFrame(loop);
    }
    loop();
}
