// 1. VERIFICACIÓN DE SESIÓN Y CARGA INICIAL
window.onload = () => {
    // Si no hay sesión, bloqueamos todo
    if (!sessionStorage.getItem('sessionActive')) {
        const denied = document.getElementById('denied-overlay');
        if(denied) denied.style.display = 'flex';
        return;
    }

    // Bienvenida personalizada
    const user = sessionStorage.getItem('arcadeUser') || "JUGADOR";
    const welcomeTitle = document.getElementById('welcome-user');
    if(welcomeTitle) welcomeTitle.innerText = `HOLA, ${user.toUpperCase()}`;

    // Quitar loader con efecto suave
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
        // Usamos la clase 'active' para disparar la animación de CSS
        if (chat.classList.contains('active')) {
            chat.classList.remove('active');
            setTimeout(() => { chat.style.display = 'none'; }, 300);
        } else {
            chat.style.display = 'flex';
            // Pequeño delay para que el navegador registre el display:flex antes de la animación
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

    let resp = "";
    if (op === 'juegos') {
        const sugerencias = [
            "Te recomiendo 'REBOTE', los efectos de partículas quedaron geniales.",
            "Si buscas un reto, el modo 'DODGE' ahora es más veloz.",
            "Probá 'JUMP', es ideal para superar récords."
        ];
        resp = sugerencias[Math.floor(Math.random() * sugerencias.length)];
    } 
    else if (op === 'error') {
        resp = "¡Entendido! Completá el formulario de **REPORTE** al final de la página para que pueda procesarlo.";
        setTimeout(() => {
            toggleChat();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }

    msgs.innerHTML += `<div class="bot-msg">🤖: ${resp}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
}

let touchX = null;
let touchY = null;

document.addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", () => {
    touchX = null;
    touchY = null;
});

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
    touchX = null;
    touchY = null;
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

function getInputX(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return (clientX - rect.left) * (canvas.width / rect.width);
}

// ================= CÓDIGO DE LOS JUEGOS =================

function startSnake() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let snake = [{x: 200, y: 140}, {x: 180, y: 140}], food = {x: 100, y: 100}, dx = 20, dy = 0, lastUpdate = 0;
    function handleSnakeTouch() {
    if (touchX === null) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (touchY < h * 0.3 && dy === 0) { dx = 0; dy = -20; } // arriba
    else if (touchY > h * 0.7 && dy === 0) { dx = 0; dy = 20; } // abajo
    else if (touchX < w * 0.5 && dx === 0) { dx = -20; dy = 0; } // izquierda
    else if (touchX >= w * 0.5 && dx === 0) { dx = 20; dy = 0; } // derecha
}
 

    function loop(time) {
        if (!gameActive) return;
        animationId = requestAnimationFrame(loop);
        handleSnakeTouch();
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
    let speedMax = 12, particles = [], bricks = [];
    const rows = 4, cols = 6;
    for(let c=0; c<cols; c++) {
        bricks[c] = [];
        for(let r=0; r<rows; r++) bricks[c][r] = { status: Math.random() > 0.8 ? 2 : 1, color: `hsl(${Math.random() * 360}, 70%, 60%)` };
    }
    function handleBouncingTouch() {
    if (touchX === null) return;

    const w = window.innerWidth;
    px = (touchX / w) * 400 - 40;

    // límites
    if (px < 0) px = 0;
    if (px > 320) px = 320;
}
    function loop() {
        if (!gameActive) return;
        handleBouncingTouch();
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(0, 0, 400, 300);
        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.07; ctx.fillStyle = p.c; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 2, 2); if(p.life <= 0) particles.splice(i, 1); });
        ctx.globalAlpha = 1;
        for(let c=0; c<cols; c++) {
            for(let r=0; r<rows; r++) {
                let b = bricks[c][r];
                if(b.status > 0) {
                    let rx = c * 65 + 10, ry = r * 25 + 40;
                    ctx.fillStyle = b.status > 1 ? "#fff" : b.color; ctx.fillRect(rx, ry, 60, 18);
                    if(bx > rx && bx < rx+60 && by > ry && by < ry+18) {
                        bdy *= -1.03; b.status--; globalScore += 15; createExplosion(bx, by, b.color);
                    }
                }
            }
        }
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#0ff"; ctx.fillRect(px, 280, 80, 10);
       bx += bdx;

// MÁS LENTO CUANDO BAJA
if (bdy > 0) {
    by += bdy * 0.75; // bajada más lenta
} else {
    by += bdy; // subida normal
}
        if(bx <= 0 || bx >= 400) { bdx *= -1; createExplosion(bx, by, "#fff"); }
        if(by <= 0) bdy *= -1;
        if(by > 275 && bx > px && bx < px+80) { bdx = ((bx - (px + 40)) / 40) * 8; bdy = -Math.abs(bdy) * 1.02; createExplosion(bx, 280, "#0ff"); }
        if(by > 300) gameOver(globalScore);
        animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
}

function startDodge() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let px = 180, obs = [], keys = {}, speedMultiplier = 1;
    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;
    function handleDodgeTouch() {
    if (touchX === null) return;

    const w = window.innerWidth;
    px = (touchX / w) * 400 - 10;
}
    window.gameInterval = setInterval(() => {
        if(!gameActive) return;
        let type = Math.random() > 0.8 ? 'GLITCH' : 'DATA'; 
        obs.push({ x: Math.random() * 370, y: -30, w: 25, h: 25, type: type, speed: (3 + Math.random() * 3) * speedMultiplier });
    }, 450);
    function loop() {
        if (!gameActive) return;
        handleDodgeTouch();
        if (keys["ArrowLeft"]) px -= 7; if (keys["ArrowRight"]) px += 7;
        if (px < 0) px = 0; if (px > 380) px = 380;
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#0ff"; ctx.beginPath(); ctx.moveTo(px+10, 270); ctx.lineTo(px, 290); ctx.lineTo(px+20, 290); ctx.fill();
        obs.forEach((o, i) => {
            o.y += o.speed;
            ctx.fillStyle = o.type === 'GLITCH' ? "#ff00ff" : "#fff";
            ctx.fillRect(o.x, o.y, o.w, o.h);
            if (o.y > 260 && o.y < 290 && o.x < px + 20 && o.x + o.w > px) gameOver(globalScore);
            if (o.y > 300) { obs.splice(i, 1); globalScore++; }
        });
        animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
}

function startJump() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let jx = 200, jy = 200, jv = 0, jSpeed = 0, keys = {}, plats = [];
    for(let i=0; i<6; i++) plats.push({x: Math.random()*340, y: i*55});
    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;
    function handleJumpTouch() {
    if (touchX === null) return;

    const w = window.innerWidth;

    if (touchX < w / 2) jSpeed -= 1.2;
    else jSpeed += 1.2;
}
    function loop() {
        if (!gameActive) return;
        handleJumpTouch();
        if (keys["ArrowLeft"]) jSpeed -= 0.8; if (keys["ArrowRight"]) jSpeed += 0.8;
        jSpeed *= 0.9; jx += jSpeed;
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

// INTERCEPTOR DE FORMULARIO
const reportForm = document.querySelector('#contact form');
if (reportForm) {
    reportForm.onsubmit = async (e) => {
        e.preventDefault(); 
        
        const btn = reportForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "ENVIANDO DATA...";
        btn.disabled = true;

        const formData = new FormData(reportForm);

        try {
            const response = await fetch(reportForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                document.getElementById('success-overlay').style.display = 'flex';
                reportForm.reset(); 
            } else {
                alert("ERROR DE SINCRONIZACIÓN: Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("SISTEMA OFFLINE: Revisa tu conexión.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}
