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

// 3. LÓGICA DEL ASISTENTE / CHAT
function toggleChat() {
    const chat = document.getElementById('chat-container');
    if (chat) {
        if (chat.classList.contains('active')) {
            chat.classList.remove('active');
            setTimeout(() => { chat.style.display = 'none'; }, 300);
        } else {
            chat.style.display = 'flex';
            setTimeout(() => { chat.classList.add('active'); }, 10);
        }
    }
}

function openRandomGame() {
    const games = ['snake', 'bouncing', 'dodge', 'jump'];
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
    let resp = (op === 'juegos') ? "Probá 'JUMP', es ideal para superar récords." : "¡Entendido! Completá el formulario de reporte.";
    msgs.innerHTML += `<div class="bot-msg">🤖: ${resp}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

// 4. CONTROL DE VENTANAS Y MOTOR DE JUEGO
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
    window.ontouchstart = null;
    window.ontouchmove = null;
}

function initGame() {
    const btn = document.getElementById("startBtn");
    const overlay = document.getElementById("overlay");
    if(btn) btn.style.display = "none";
    if(overlay) overlay.style.display = "none";
    gameActive = true; 
    globalScore = 0;

    if(currentGame === 'snake') startSnake();
    else if(currentGame === 'bouncing') startBouncing();
    else if(currentGame === 'dodge') startDodge();
    else if(currentGame === 'jump') startJump();
}

function closeWindow() { 
    document.getElementById("gameWindow").classList.remove("active"); 
    stopGame(); 
}

function restartCurrentGame() { 
    stopGame(); 
    initGame(); 
}

function gameOver(score) {
    gameActive = false;
    const fScore = document.getElementById("finalScore");
    const overlay = document.getElementById("overlay");
    if(fScore) fScore.innerText = "PUNTAJE: " + score;
    if(overlay) overlay.style.display = "flex";
    stopGame();
}

// ================= CÓDIGO DE LOS JUEGOS (CONTROLES PANTALLA COMPLETA) =================

function startSnake() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let snake = [{x: 200, y: 140}, {x: 180, y: 140}], food = {x: 100, y: 100}, dx = 20, dy = 0, lastUpdate = 0;

    document.onkeydown = (e) => {
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
    };

    window.ontouchstart = (e) => {
        if (!gameActive) return;
        const touch = e.touches[0];
        const screenW = window.innerWidth, screenH = window.innerHeight;
        const x = touch.clientX, y = touch.clientY;
        const slope = screenH / screenW;

        if (y < x * slope && y < screenH - x * slope) { if (dy === 0) { dx = 0; dy = -20; } } 
        else if (y > x * slope && y > screenH - x * slope) { if (dy === 0) { dx = 0; dy = 20; } }
        else if (x < screenW / 2) { if (dx === 0) { dx = -20; dy = 0; } }
        else { if (dx === 0) { dx = 20; dy = 0; } }
    };

    function loop(time) {
        if (!gameActive) return;
        animationId = requestAnimationFrame(loop);
        if (time - lastUpdate < 85) return;
        lastUpdate = time;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 300 || snake.some(s => s.x === head.x && s.y === head.y)) { gameOver(globalScore); return; }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) { globalScore += 10; food = {x: Math.floor(Math.random()*19)*20, y: Math.floor(Math.random()*14)*20}; } else snake.pop();
        ctx.clearRect(0,0,400,300); ctx.fillStyle = "#f0f"; ctx.fillRect(food.x, food.y, 18, 18);
        ctx.fillStyle = "#0ff"; snake.forEach(s => ctx.fillRect(s.x, s.y, 18, 18));
    }
    animationId = requestAnimationFrame(loop);
}

function startBouncing() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let bx=200, by=200, bdx=6, bdy=-6, px=160;

    window.ontouchmove = (e) => {
        if (!gameActive) return;
        const touchX = e.touches[0].clientX;
        px = (touchX / window.innerWidth) * 400 - 40;
    };

    function loop() {
        if (!gameActive) return;
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#0ff"; ctx.fillRect(px, 280, 80, 10);
        bx += bdx; by += bdy;
        if(bx <= 0 || bx >= 400) bdx *= -1;
        if(by <= 0) bdy *= -1;
        if(by > 275 && bx > px && bx < px+80) { bdy = -Math.abs(bdy) * 1.02; }
        if(by > 300) gameOver(globalScore);
        animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
}

function startDodge() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let px = 180, obs = [];
    
    window.ontouchmove = (e) => {
        if (!gameActive) return;
        const touchX = e.touches[0].clientX;
        px = (touchX / window.innerWidth) * 400 - 10;
    };

    window.gameInterval = setInterval(() => {
        if(!gameActive) return;
        obs.push({ x: Math.random() * 370, y: -30, w: 25, h: 25, speed: 3 + Math.random() * 3 });
    }, 450);

    function loop() {
        if (!gameActive) return;
        if (px < 0) px = 0; if (px > 380) px = 380;
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#0ff"; ctx.fillRect(px, 270, 20, 20);
        obs.forEach((o, i) => {
            o.y += o.speed;
            ctx.fillStyle = "#fff"; ctx.fillRect(o.x, o.y, o.w, o.h);
            if (o.y > 260 && o.y < 290 && o.x < px + 20 && o.x + o.w > px) gameOver(globalScore);
            if (o.y > 300) { obs.splice(i, 1); globalScore++; }
        });
        animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
}

function startJump() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let jx = 200, jy = 200, jv = 0, jSpeed = 0, plats = [];
    for(let i=0; i<6; i++) plats.push({x: Math.random()*340, y: i*55});
    
    window.ontouchstart = (e) => {
        if (!gameActive) return;
        const tx = e.touches[0].clientX;
        const screenW = window.innerWidth;
        if (tx < screenW * 0.35) jSpeed = -8; 
        else if (tx > screenW * 0.65) jSpeed = 8; 
        else jSpeed = 0;
    };

    function loop() {
        if (!gameActive) return;
        jSpeed *= 0.92; jx += jSpeed;
        if (jx < -20) jx = 400; if (jx > 400) jx = -20;
        jv += 0.5; jy += jv;
        if (jy < 120) { 
            let diff = 120 - jy; jy = 120; globalScore++; 
            plats.forEach(p => { p.y += diff; if(p.y > 300) { p.y = 0; p.x = Math.random()*340; } });
        }
        if (jy > 300) { gameOver(globalScore); return; }
        ctx.clearRect(0,0,400,300);
        plats.forEach(p => {
            ctx.fillStyle = "#0ff"; ctx.fillRect(p.x, p.y, 60, 8);
            if (jv > 0 && jy+20 >= p.y && jy+20 <= p.y+12 && jx+20 > p.x && jx < p.x+60) jv = -13;
        });
        ctx.fillStyle = "#f0f"; ctx.beginPath(); ctx.arc(jx+10, jy+10, 10, 0, Math.PI*2); ctx.fill();
        animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
}

// 5. INTERCEPTOR DE FORMULARIO
const reportForm = document.querySelector('#contact form');
if (reportForm) {
    reportForm.onsubmit = async (e) => {
        e.preventDefault(); 
        const btn = reportForm.querySelector('button');
        btn.innerText = "ENVIANDO DATA...";
        btn.disabled = true;
        try {
            const response = await fetch(reportForm.action, {
                method: 'POST',
                body: new FormData(reportForm),
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                document.getElementById('success-overlay').style.display = 'flex';
                reportForm.reset(); 
            }
        } catch (error) {
            alert("SISTEMA OFFLINE.");
        } finally {
            btn.innerText = "ENVIAR DATA";
            btn.disabled = false;
        }
    };
}
