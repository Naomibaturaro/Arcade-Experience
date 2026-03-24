// ===== LOADER =====
window.onload = () => {
    // Le damos un segundo extra para que la animación 3D del robot se luzca
    setTimeout(() => {
        const loader = document.getElementById("loader");
        loader.style.opacity = "0"; // Efecto de desvanecimiento
        setTimeout(() => { loader.style.display = "none"; }, 500);
    }, 1500);
};

// ===== MODO CLARO / OSCURO =====
function toggleMode() {
    document.body.classList.toggle("dark");
    // Cambiar el icono del sol/luna
    const btn = document.querySelector(".toggle");
    btn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

// ===== ELEMENTOS =====
const robotModal = document.getElementById('robot-modal');
const robotMsg = document.getElementById('robot-msg');
const loginFields = document.getElementById('login-fields');
const closeBtn = document.getElementById('close-robot');
const accessSound = document.getElementById("accessSound");

let pendingAction = null;

// ===== MOSTRAR ROBOT =====
function showRobot(action) {
    pendingAction = action;
    robotModal.style.display = 'flex';

    if (accessSound) {
        accessSound.currentTime = 0; // Reinicia el sonido si ya se estaba reproduciendo
        accessSound.play();
    }

    if (sessionStorage.getItem('sessionActive')) {
        const user = sessionStorage.getItem('arcadeUser') || "Usuario";
        robotMsg.innerHTML = `<span style="color:var(--primary)">SISTEMA:</span> Sesión activa detectada.<br>Acceso concedido, ${user}.`;
        loginFields.style.display = 'none';
        closeBtn.style.display = 'inline-block';

        if (pendingAction === 'arcade') {
            setTimeout(() => {
                window.location.href = 'index-arcade.html';
            }, 1200);
        }
    } else {
        robotMsg.innerHTML = `<span style="color:var(--primary)">SISTEMA:</span> Identificación requerida para acceder al núcleo.`;
        loginFields.style.display = 'block';
        closeBtn.style.display = 'none';
    }
}

// ===== LOGIN =====
function processLogin() {
    const userInput = document.getElementById('user-input');
    const user = userInput.value.trim();

    if (user.length > 2) {
        sessionStorage.setItem('sessionActive', 'true');
        sessionStorage.setItem('arcadeUser', user);

        robotMsg.innerHTML = `<span style="color:var(--primary)">SISTEMA:</span> Acceso aprobado. <br>Bienvenido, ${user}.`;
        loginFields.style.display = 'none';
        closeBtn.style.display = 'inline-block';

        if (pendingAction === 'arcade') {
            setTimeout(() => {
                window.location.href = 'index-arcade.html';
            }, 1500);
        }
    } else {
        robotMsg.innerHTML = `<span style="color:#ff0000">ERROR:</span> Nombre demasiado corto. Mínimo 3 caracteres.`;
        userInput.style.borderColor = "#ff0000";
    }
}

// ===== CERRAR ROBOT =====
function hideRobot() {
    robotModal.style.display = 'none';
    if (pendingAction === 'arcade') {
        window.location.href = 'index-arcade.html';
    }
}
// CONTROL DE ENVÍO DE FORMULARIO SIN RECARGAR
const contactForm = document.querySelector('#contact form');
if (contactForm) {
    contactForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "ENVIANDO...";
        btn.disabled = true;

        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                // AQUÍ SE ACTIVA EL CARTELITO QUE ESTILIZAMOS ARRIBA
                document.getElementById('success-overlay').style.display = 'flex';
                contactForm.reset(); 
            } else {
                alert("ERROR EN LA RED: Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}
