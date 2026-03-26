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
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, 500); // <-- Faltaba cerrar bien esta función
        }, 1500);
    }
});

// FAILSAFE GLOBAL (Corregido el comparador !==)
setTimeout(() => {
    const loader = document.getElementById("loader");
    if(loader && loader.style.display !== "none"){
        loader.style.display = "none";
    }
}, 3000);

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

// ==================== 6. CONTROL DE VENTANAS ====================
function openWindow(game){
    stopGame();
    currentGame=game;
    touchDir=null;
    lives=3;
    globalScore=0;

    const win=document.getElementById("gameWindow");
    const title=document.getElementById("gameTitle");
    const overlay=document.getElementById("overlay");
    const btn=document.getElementById("startBtn");

    blockBackgroundInteraction(true);

    if(win){ 
        win.classList.remove("closing");
        win.classList.add("active");
    }
    if(title) title.innerText=`MÓDULO: ${game.toUpperCase()}`;
    if(overlay) overlay.style.display="none";
    if(btn) btn.style.display="block";

    const openSound=document.getElementById("openSound");
    if(openSound){ openSound.currentTime=0; openSound.play().catch(()=>{}); }
    if(navigator.vibrate) navigator.vibrate(40);
}

function initGame(){
    document.getElementById("startBtn").style.display="none";
    document.getElementById("overlay").style.display="none";
    gameActive=true;
    globalScore=0;

    if(currentGame==='snake') startSnake();
    else if(currentGame==='pacman') startPacMan();
    else if(currentGame==='breakout') startBreakout();
}

function stopGame(){
    gameActive=false;
    if(animationId) cancelAnimationFrame(animationId);
    if(window.gameInterval) clearInterval(window.gameInterval);
    document.onkeydown=null;
}

function gameOver(score){
    lives--;
    if(lives>0){
        // Reinicia juego automáticamente con vidas restantes
        initGame();
        return;
    }
    gameActive=false;
    const fScore=document.getElementById("finalScore");
    const overlay=document.getElementById("overlay");
    if(fScore) fScore.innerText="PUNTAJE: "+score;
    if(overlay) overlay.style.display="flex";
    stopGame();
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

// ==================== 7. JUEGOS ====================

// 7.1 Snake
function startSnake(){
    const canvas=document.getElementById('gameCanvas');
    const ctx=canvas.getContext('2d');
    let snake=[{x:200,y:140},{x:180,y:140}],food={x:100,y:100},dx=20,dy=0,lastUpdate=0;
    document.onkeydown=(e)=>{
        if(e.key==="ArrowUp"&&dy===0){dx=0;dy=-20;}
        if(e.key==="ArrowDown"&&dy===0){dx=0;dy=20;}
        if(e.key==="ArrowLeft"&&dx===0){dx=-20;dy=0;}
        if(e.key==="ArrowRight"&&dx===0){dx=20;dy=0;}
    };
    function loop(time){
        if(!gameActive) return;
        animationId=requestAnimationFrame(loop);
        if(time-lastUpdate<100) return;
        lastUpdate=time;
        // Joystick
        if(touchDir==="up"&&dy===0){dx=0;dy=-20;}
        if(touchDir==="down"&&dy===0){dx=0;dy=20;}
        if(touchDir==="left"&&dx===0){dx=-20;dy=0;}
        if(touchDir==="right"&&dx===0){dx=20;dy=0;}
        const head={x:snake[0].x+dx,y:snake[0].y+dy};
        if(head.x<0||head.x>=400||head.y<0||head.y>=300||snake.some(s=>s.x===head.x&&s.y===head.y)){
            gameOver(globalScore); return;
        }
        snake.unshift(head);
        if(head.x === food.x && head.y === food.y){
    globalScore += 10;
    // Genera comida alineada a la grilla de 20 dentro de los 400x300 del canvas
    food = {
        x: Math.floor(Math.random() * 20) * 20, 
        y: Math.floor(Math.random() * 15) * 20
    };
} else {
    snake.pop();
}

        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#f0f"; ctx.fillRect(food.x,food.y,18,18);
        ctx.fillStyle="#0ff"; snake.forEach(s=>ctx.fillRect(s.x,s.y,18,18));
    }
    loop(0);
}

// 7.2 Pac-Man con fantasmas
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

// 7.3 Breakout con bloques
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
// 7.4 Dodge
function startDodge() {
    const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    let px = 180, obs = [], keys = {}, speedMultiplier = 1;
    document.onkeydown = (e) => keys[e.key] = true;
    document.onkeyup = (e) => keys[e.key] = false;
    canvas.onmousemove = canvas.ontouchmove = (e) => px = getInputX(e, canvas) - 10;
    window.gameInterval = setInterval(() => {
        if(!gameActive) return;
        let type = Math.random() > 0.8 ? 'GLITCH' : 'DATA'; 
        obs.push({ x: Math.random() * 370, y: -30, w: 25, h: 25, type: type, speed: (3 + Math.random() * 3) * speedMultiplier });
    }, 450);
    function loop() {
        if (!gameActive) return;
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

// Añade esto al final de todo 
function getInputX(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return (clientX - rect.left) * (canvas.width / rect.width);
}
