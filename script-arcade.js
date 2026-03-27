// ==================== 1. INICIO SESIÓN ====================
window.addEventListener("load", () => {
    const sessionActive = sessionStorage.getItem('sessionActive');
    const denied = document.getElementById('denied-overlay');
    const loader = document.getElementById("loader");

    if (!sessionActive) {
        document.body.classList.add("no-session");
        if(denied) denied.style.display = 'flex';
    } else {
        if(denied) denied.remove();
        document.body.classList.remove("no-session");

        const user = sessionStorage.getItem('arcadeUser') || "JUGADOR";
        const welcomeTitle = document.getElementById('welcome-user');
        if(welcomeTitle) welcomeTitle.innerText = `HOLA, ${user.toUpperCase()}`;
    }

    // LOGICA DEL LOADER (Corregida)
    if(loader){
        setTimeout(() => {
            loader.classList.add("hidden");
            setTimeout(() => {
                loader.style.display = "none";
            }, 500); 
        }, 1500);
    }
});

// ==================== 2. VARIABLES GLOBALES ====================
let currentGame = null, animationId = null, gameActive = false, globalScore = 0;
let touchDir = null;
let lives = 3;

// ==================== 3. CHAT ====================
function toggleChat() {
    const chat = document.getElementById('chat-container');
    if (!chat) return;
    if (chat.classList.contains('active')) {
        chat.classList.remove('active');
        setTimeout(() => chat.style.display='none',300);
    } else {
        chat.style.display='flex';
        setTimeout(() => chat.classList.add('active'),10);
    }
}

function openRandomGame() {
    const games = ['snake','pacman','breakout'];
    const randomGame = games[Math.floor(Math.random()*games.length)];
    const msgs = document.getElementById('chat-messages');
    if(msgs){
        msgs.innerHTML += `<div class="bot-msg">🤖: ¡Buena elección! Iniciando ${randomGame.toUpperCase()}...</div>`;
        msgs.scrollTop = msgs.scrollHeight;
    }
    setTimeout(()=>{ 
        if(document.getElementById('chat-container').classList.contains('active')) toggleChat();
        openWindow(randomGame);
    },800);
}

// ==================== 4. BLOQUEO DE FONDO ====================
function blockBackgroundInteraction(enable){
    const body=document.body;
    if(enable){
        body.classList.add("game-active");
        document.addEventListener("touchmove",preventScroll,{passive:false});
    } else {
        body.classList.remove("game-active");
        document.removeEventListener("touchmove",preventScroll);
    }
}
function preventScroll(e){
    if(document.getElementById("gameWindow")?.classList.contains("active")) e.preventDefault();
}

// ==================== 5. JOYSTICK ====================
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

if(joystickBase){
    joystickBase.addEventListener('touchmove', e=>{
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left+rect.width/2;
        const centerY = rect.top+rect.height/2;
        const deltaX = touch.clientX-centerX;
        const deltaY = touch.clientY-centerY;
        const dist = Math.min(40,Math.sqrt(deltaX**2+deltaY**2));
        const angle = Math.atan2(deltaY,deltaX);
        joystickStick.style.transform = `translate(calc(-50%+${Math.cos(angle)*dist}px), calc(-50%+${Math.sin(angle)*dist}px))`;
        if(Math.abs(deltaX)>Math.abs(deltaY)) touchDir=deltaX>0?"right":"left";
        else touchDir=deltaY>0?"down":"up";
    },{passive:false});
    joystickBase.addEventListener('touchend',()=>{
        joystickStick.style.transform = `translate(-50%,-50%)`;
        touchDir=null;
    });
}

// ==================== 6. CONTROL DE VENTANAS (CORREGIDO) ====================
function openWindow(game){
    stopGame();
    currentGame = game;
    touchDir = null;
    lives = 3;
    globalScore = 0;

    const win = document.getElementById("gameWindow");
    const title = document.getElementById("gameTitle");
    const overlay = document.getElementById("overlay");
    const btn = document.getElementById("startBtn");

    blockBackgroundInteraction(true);

    if(win){ 
        win.classList.remove("closing");
        win.classList.add("active");
    }
    
    if(title) title.innerText = `MÓDULO: ${game.toUpperCase()}`;
    if(overlay) overlay.style.display = "flex";
    if(btn) btn.style.display = "block";

    // Mostrar controles si es móvil
    const mobileControls = document.querySelector('.mobile-only');
    if(mobileControls && window.innerWidth < 900) {
        mobileControls.style.display = 'flex';
    }

    const openSound = document.getElementById("openSound");
    if(openSound){ 
        openSound.currentTime = 0; 
        openSound.play().catch(()=>{}); 
    }
    if(navigator.vibrate) navigator.vibrate(40);
}

function initGame(){
    const startBtn = document.getElementById("startBtn");
    const overlay = document.getElementById("overlay");
    const gameOverBox = document.querySelector(".gameover-box");

    if(startBtn) startBtn.style.display = "none";
    if(overlay) overlay.style.display = "none";
    if(gameOverBox) gameOverBox.style.display = "none";
    
    gameActive = true;
    globalScore = 0;
    
    // Resetear corazones visuales
    const lifeIcons = document.querySelectorAll('.life-icon');
    lifeIcons.forEach(icon => icon.classList.remove('lost'));

    // Lanzar juego
    if(currentGame === 'snake') startSnake();
    else if(currentGame === 'pacman') startPacMan();
    else if(currentGame === 'breakout') startBreakout();
    else if(currentGame === 'dodge') startDodge();
}
// --- RESETEAR VIDAS VISUALES AL INICIAR ---
    const lifeIcons = document.querySelectorAll('.life-icon');
    lifeIcons.forEach(icon => icon.classList.remove('lost'));
    if(currentGame==='snake') startSnake();
    else if(currentGame==='pacman') startPacMan();
    else if(currentGame==='breakout') startBreakout();
    else if(currentGame === 'dodge') startDodge();
}

function stopGame(){
    gameActive=false;
    if(animationId) cancelAnimationFrame(animationId);
    if(window.gameInterval) clearInterval(window.gameInterval);
    document.onkeydown=null;
}

function gameOver(score) {
    stopGame(); // Detenemos el juego

    lives--; // Restamos una vida

    // --- ACTUALIZAR VIDAS VISUALES ---
    const lifeIcons = document.querySelectorAll('.life-icon');
    // "Apagamos" el corazón correspondiente (el índice es lives porque restamos antes)
    if (lifeIcons[lives]) {
        lifeIcons[lives].classList.add('lost');
    }

    if (lives > 0) {
        // Reinicia juego automáticamente con vidas restantes tras una pausa
        setTimeout(() => {
            if (currentGame) initGame();
        }, 1000); // 1 segundo de pausa para que el jugador asimile la pérdida
        return;
    }

    // SI NO QUEDAN VIDAS (GAME OVER DEFINITIVO)
    gameActive = false;
    const fScore = document.getElementById("finalScore");
    const overlay = document.getElementById("overlay");
    if (fScore) fScore.innerText = "PUNTAJE: " + score;
    if (overlay) overlay.style.display = "flex";
}

function closeGameWindow(){
    const win=document.getElementById("gameWindow");
    if(win){
        win.classList.add("closing");
        setTimeout(()=>{
            win.classList.remove("active","closing");
            blockBackgroundInteraction(false);
            stopGame();
        },300);
    }
}

document.getElementById('contact-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const successOverlay = document.getElementById('success-overlay');
    const formData = new FormData(form);

    fetch(this.action, {
    method: "POST",
    body: formData,
    headers: { 'Accept': 'application/json' }
})
.then(response => {
    if (response.ok) {
        if(successOverlay) successOverlay.style.display = 'flex';
        this.reset(); // Usamos 'this' porque es el formulario
    } else {
        alert("Error en el servidor de envío.");
    }
})
    .catch(error => alert("Error al enviar: Asegúrate de haber confirmado tu mail en FormSubmit"));
});
// ==================== 7. FORMS =====================
// ==================== 8. JUEGOS ====================

function startSnake() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Ajustes iniciales
    let snake = [{ x: 200, y: 140 }, { x: 180, y: 140 }];
    let dx = 20, dy = 0;
    let lastUpdate = 0;
    
    // Generador de comida alineado a la grilla (400/20=20 columnas, 300/20=15 filas)
    function generateFood() {
        return {
            x: Math.floor(Math.random() * (canvas.width / 20)) * 20,
            y: Math.floor(Math.random() * (canvas.height / 20)) * 20
        };
    }
    
    let food = generateFood();

    document.onkeydown = (e) => {
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -20; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 20; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -20; dy = 0; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 20; dy = 0; }
    };

    function loop(time) {
        if (!gameActive) return;
        
        animationId = requestAnimationFrame(loop);

        // Control de velocidad (FPS): solo actualiza cada 100ms
        if (time - lastUpdate < 100) return;
        lastUpdate = time;

        // Soporte para Joystick
        if (touchDir === "up" && dy === 0) { dx = 0; dy = -20; }
        if (touchDir === "down" && dy === 0) { dx = 0; dy = 20; }
        if (touchDir === "left" && dx === 0) { dx = -20; dy = 0; }
        if (touchDir === "right" && dx === 0) { dx = 20; dy = 0; }

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // COLISIONES: Paredes o Cuerpo
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || 
            snake.some(s => s.x === head.x && s.y === head.y)) {
            gameOver(globalScore);
            return;
        }

        snake.unshift(head);

        // ¿Comió?
        if (head.x === food.x && head.y === food.y) {
            globalScore += 10;
            food = generateFood();
            // Evitar que la comida aparezca dentro del cuerpo de la serpiente
            while (snake.some(s => s.x === food.x && s.y === food.y)) {
                food = generateFood();
            }
        } else {
            snake.pop();
        }

        // Renderizado
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Comida (Rosa Neón)
        ctx.fillStyle = "#ff00ff"; 
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff00ff";
        ctx.fillRect(food.x + 2, food.y + 2, 16, 16);
        
        // Serpiente (Cian Neón)
        ctx.fillStyle = "#00ffff";
        ctx.shadowColor = "#00ffff";
        snake.forEach((s, index) => {
            // La cabeza brilla un poco más
            ctx.shadowBlur = index === 0 ? 15 : 5;
            ctx.fillRect(s.x + 1, s.y + 1, 18, 18);
        });
        ctx.shadowBlur = 0; // Limpiar brillo para el siguiente frame
    }
    
    animationId = requestAnimationFrame(loop);
}
// 8.2 Pac-Man con fantasmas
function startPacMan(){
    const canvas=document.getElementById('gameCanvas');
    const ctx=canvas.getContext('2d');
    const grid=20;
    const maze=[
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    const offsetY=100;
    let px=20,py=120,score=0,dir={x:0,y:0},speed=3;
    let ghosts=[
        {x:340,y:120,dx:-2,dy:0,color:"red"},
        {x:340,y:180,dx:0,dy:-2,color:"pink"},
        {x:40,y:180,dx:2,dy:0,color:"cyan"}
    ];

    document.onkeydown=(e)=>{
        if(e.key==="ArrowLeft") dir={x:-speed,y:0};
        if(e.key==="ArrowRight") dir={x:speed,y:0};
        if(e.key==="ArrowUp") dir={x:0,y:-speed};
        if(e.key==="ArrowDown") dir={x:0,y:speed};
    };

    function loop(){
        if(!gameActive) return;

        if(touchDir==="left") dir={x:-speed,y:0};
        if(touchDir==="right") dir={x:speed,y:0};
        if(touchDir==="up") dir={x:0,y:-speed};
        if(touchDir==="down") dir={x:0,y:speed};

        let nextX=px+dir.x,nextY=py+dir.y;
        let col=Math.floor((nextX+10)/grid),row=Math.floor((nextY-offsetY+10)/grid);
        if(maze[row]&&maze[row][col]!==1){ px=nextX; py=nextY; if(maze[row][col]===2){ maze[row][col]=0;score+=10;globalScore=score;} }

        // Fantasmas
        ghosts.forEach(g=>{
            g.x+=g.dx; g.y+=g.dy;
            let gCol=Math.floor((g.x+10)/grid),gRow=Math.floor((g.y-offsetY+10)/grid);
            if(maze[gRow]?.[gCol]===1) { g.dx*=-1; g.dy*=-1; }
            if(Math.abs(px-g.x)<15&&Math.abs(py-g.y)<15){ gameOver(globalScore);}
        });

        ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let r=0;r<maze.length;r++){
            for(let c=0;c<maze[r].length;c++){
                if(maze[r][c]===1){ ctx.fillStyle="#00f"; ctx.fillRect(c*grid,r*grid+offsetY,grid,grid); }
                if(maze[r][c]===2){ ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(c*grid+10,r*grid+offsetY+10,3,0,7); ctx.fill(); }
            }
        }
        ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(px+10,py+10,8,0,7); ctx.fill();
        ghosts.forEach(g=>{ctx.fillStyle=g.color; ctx.beginPath(); ctx.arc(g.x+10,g.y+10,8,0,7); ctx.fill();});
        animationId=requestAnimationFrame(loop);
    }
    loop();
}

// 8.3 Breakout con bloques
function startBreakout(){
    const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
    let paddleX=160, ballX=200, ballY=250, ballDX=4, ballDY=-4, score=0;
    const rows=4,cols=6,bricks=[];
    for(let c=0;c<cols;c++){ bricks[c]=[]; for(let r=0;r<rows;r++) bricks[c][r]={status:1}; }

    document.onkeydown=e=>{ if(e.key==="ArrowLeft") paddleX-=7; if(e.key==="ArrowRight") paddleX+=7; };

    function loop(){
        if(!gameActive) return;
        ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#0ff"; ctx.fillRect(paddleX,280,80,10);
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(ballX,ballY,6,0,7); ctx.fill();

        ballX+=ballDX; ballY+=ballDY;
        if(ballX<=0||ballX>=canvas.width-6) ballDX*=-1;
        if(ballY<=0) ballDY*=-1;
        if(ballY>=280&&ballX>paddleX&&ballX<paddleX+80) ballDY=-Math.abs(ballDY);
        if(ballY>canvas.height){ gameOver(globalScore); return; }

        for(let c=0;c<cols;c++){
            for(let r=0;r<rows;r++){
                const b=bricks[c][r];
                if(b.status>0){
                    let rx=c*65+10,ry=r*25+40;
                    ctx.fillStyle="#f0f"; ctx.fillRect(rx,ry,60,18);
                    if(ballX>rx&&ballX<rx+60&&ballY>ry&&ballY<ry+18){ ballDY*=-1; b.status--; globalScore+=10;}
                }
            }
        }
        animationId=requestAnimationFrame(loop);
    }
    loop();
}
// 8.4 Dodge
function startDodge() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    let px = 180; 
    let obstacles = []; // Array que guardará los obstáculos actuales
    let speedMultiplier = 1;

    // 1. Limpiamos cualquier intervalo de generación previo
    if(window.gameInterval) clearInterval(window.gameInterval);

    // 2. Generador de obstáculos (aparecen cada 450ms)
    window.gameInterval = setInterval(() => {
        if(!gameActive) return;
        let type = Math.random() > 0.8 ? 'GLITCH' : 'DATA'; 
        obstacles.push({ 
            x: Math.random() * (canvas.width - 25), 
            y: -30, 
            w: 25, 
            h: 25, 
            type: type, 
            speed: (3 + Math.random() * 3) * speedMultiplier 
        });
    }, 450);

    function loop() {
        if (!gameActive) return;

        // Movimiento (Joystick + Teclado)
        if (touchDir === "left") px -= 9;
        if (touchDir === "right") px += 9;

        // Limites laterales
        if (px < 0) px = 0;
        if (px > canvas.width - 20) px = canvas.width - 20;

        // Fondo con rastro (estela)
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar Jugador
        ctx.fillStyle = "#0ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#0ff";
        ctx.beginPath();
        ctx.moveTo(px + 10, 270);
        ctx.lineTo(px, 290);
        ctx.lineTo(px + 20, 290);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Procesar Obstáculos
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let o = obstacles[i];
            o.y += o.speed;
            
            ctx.fillStyle = o.type === 'GLITCH' ? "#f0f" : "#fff";
            ctx.fillRect(o.x, o.y, o.w, o.h);

            // COLISIÓN DETECTADA
            if (o.y > 260 && o.y < 290 && o.x < px + 20 && o.x + o.w > px) {
                obstacles = []; // VACIAMOS los obstáculos para que no te maten al reaparecer
                gameOver(globalScore); // Llama a la función global que resta vida
                return; // Cortamos el loop actual
            }

            // Si sale de la pantalla, sumamos punto y borramos
            if (o.y > canvas.height) {
                obstacles.splice(i, 1);
                globalScore++;
            }
        }

        animationId = requestAnimationFrame(loop);
    }
    loop();
}
// Restart
function restartCurrentGame() {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";
    
    // Reseteamos valores antes de iniciar
    lives = 3; 
    globalScore = 0;
    
    initGame();
}
// NUEVO FAILSAFE
setTimeout(() => {
    const loader = document.getElementById("loader");
    // Si el loader sigue visible después de 5 segundos, lo forzamos a desaparecer
    if (loader && loader.style.display !== "none") {
        loader.classList.add("hidden");
        setTimeout(() => {
            loader.style.display = "none";
        }, 600);
        console.log("Sistema: Loader removido por seguridad.");
    }
}, 5000);
