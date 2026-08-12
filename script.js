/* =========================================
   REFERÊNCIAS
========================================= */

const scenes = document.querySelectorAll(".scene");
const nextButton = document.getElementById("next");
const previousButton = document.getElementById("previous");
const restartButton = document.getElementById("restart");
const progressFill = document.getElementById("progressFill");
const sceneCurrent = document.getElementById("sceneCurrent");

const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderStatus = document.getElementById("loaderStatus");
const loaderSkip = document.getElementById("loaderSkip");

const music = document.getElementById("music");
const audioToggle = document.getElementById("audioToggle");
const volumeSlider = document.getElementById("volumeSlider");
const audioLabel = document.getElementById("audioLabel");

const themeToggle = document.getElementById("themeToggle");
const themePanel = document.getElementById("themePanel");
const colorPrimary = document.getElementById("colorPrimary");
const colorSecondary = document.getElementById("colorSecondary");
const themeReset = document.getElementById("themeReset");
const bgColor = document.getElementById("bgColor");
const depthSlider = document.getElementById("depthSlider");
const starsSlider = document.getElementById("starsSlider");
const motionSlider = document.getElementById("motionSlider");
const depthValue = document.getElementById("depthValue");
const starsValue = document.getElementById("starsValue");
const motionValue = document.getElementById("motionValue");
const cinematicTransition = document.getElementById("cinematicTransition");
const autoToggle = document.getElementById("autoToggle");
const autoProgress = document.getElementById("autoProgress");

const interactionHint = document.getElementById("interactionHint");

const particleCanvas = document.getElementById("particles");
const heartCanvas = document.getElementById("heartCanvas");
const transitionCanvas = document.getElementById("transitionCanvas");

const ctx = particleCanvas.getContext("2d");
const heartCtx = heartCanvas.getContext("2d");
const transitionCtx = transitionCanvas.getContext("2d");

const root = document.documentElement;

/* =========================================
   ESTADO
========================================= */

let currentScene = 0;
let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = width / 2;
let mouseY = height / 2;

let targetTiltX = 0, targetTiltY = 0;
let curTiltX = 0, curTiltY = 0;
let targetMx = 0, targetMy = 0;
let curMx = 0, curMy = 0;

let particles = [];
let heartParticles = [];

let rainTimer = null;

let audioStarted = false;
let audioEnabled = true;
let baseVolume = .55;
let audioAttempted = false;

let transitionRunning = false;
let autoMode = true;
let autoTimer = null;
let autoDeadline = 0;
const AUTO_TIMES = Array.from({ length: scenes.length }, () => 2000);

let particleColor = { r: 255, g: 180, b: 205 };
let heartColor = { r: 255, g: 105, b: 155 };

/* =========================================
   LOADING (com rede de segurança contra travamento)
========================================= */

let loading = 0;
let loadFinished = false;

const loadingInterval = setInterval(() => {

    loading += Math.random() * 12;
    if (loading > 100) loading = 100;

    loaderProgress.style.width = `${loading}%`;

    if (loading < 25) {
        loaderStatus.textContent = "desenhando o universo...";
    } else if (loading < 50) {
        loaderStatus.textContent = "preparando as estrelas...";
    } else if (loading < 75) {
        loaderStatus.textContent = "acendendo as luzes...";
    } else if (loading < 95) {
        loaderStatus.textContent = "afinando a trilha sonora...";
    } else {
        loaderStatus.textContent = "quase pronto...";
    }

    if (loading >= 100) {
        clearInterval(loadingInterval);
        setTimeout(finishLoading, 400);
    }

}, 160);

function finishLoading() {
    if (loadFinished) return;
    loadFinished = true;
    loader.classList.add("loaded");
}

// se por algum motivo o carregamento demorar, libera a experiência de qualquer forma
setTimeout(finishLoading, 1800);

// depois de um instante, oferece a opção de pular o carregamento
setTimeout(() => loaderSkip.classList.add("visible"), 700);
loader.addEventListener("click", () => {
    startAudio();
    if (loaderSkip.classList.contains("visible")) finishLoading();
});
loader.addEventListener("pointerdown", () => { startAudio(); }, { passive:true });

/* =========================================
   RESIZE
========================================= */

function resizeCanvas() {

    width = window.innerWidth;
    height = window.innerHeight;

    const ratio = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.35 : 1.75);

    particleCanvas.width = width * ratio;
    particleCanvas.height = height * ratio;
    heartCanvas.width = width * ratio;
    heartCanvas.height = height * ratio;
    transitionCanvas.width = width * ratio;
    transitionCanvas.height = height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    heartCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    transitionCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

    createBackgroundParticles();
    createHeartParticles();

}

window.addEventListener("resize", resizeCanvas);

/* =========================================
   MOUSE / CURSOR / TILT 3D (com suavização)
========================================= */

document.addEventListener("mousemove", event => {

    mouseX = event.clientX;
    mouseY = event.clientY;

    updateCursor();

    const x = (event.clientX / width - .5);
    const y = (event.clientY / height - .5);

    targetMx = x * 25;
    targetMy = y * 25;
    targetTiltY = x * 10;
    targetTiltX = y * -10;

});

document.addEventListener("mouseover", event => {
    const cursor = document.querySelector(".cursor");
    if (!cursor) return;
    const interactive = event.target.closest("button, a, .heart-message, #touchLayer, input");
    cursor.classList.toggle("hover", !!interactive);
});

function updateCursor() {
    const cursor = document.querySelector(".cursor");
    if (!cursor) return;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
}

// giroscópio no celular também inclina levemente a cena
window.addEventListener("deviceorientation", event => {
    if (event.beta === null || event.gamma === null) return;
    targetTiltX = Math.max(-8, Math.min(8, (event.beta - 45) * .15));
    targetTiltY = Math.max(-8, Math.min(8, event.gamma * .15));
});

function updateTilt() {

    curTiltX += (targetTiltX - curTiltX) * .06;
    curTiltY += (targetTiltY - curTiltY) * .06;
    curMx += (targetMx - curMx) * .06;
    curMy += (targetMy - curMy) * .06;

    const activeScene = document.querySelector(".scene.active");
    if (!activeScene) return;

    activeScene.style.setProperty("--mx", `${curMx}px`);
    activeScene.style.setProperty("--my", `${curMy}px`);
    activeScene.style.setProperty("--tilt-x", `${curTiltX}deg`);
    activeScene.style.setProperty("--tilt-y", `${curTiltY}deg`);

}

/* =========================================
   PARTÍCULAS DE FUNDO
========================================= */

function createBackgroundParticles() {

    particles = [];
    const mobile = width < 700;
    const amount = mobile
        ? Math.min(105, Math.floor(width * height / 11000))
        : Math.min(220, Math.floor(width * height / 7500));

    for (let i = 0; i < amount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + .3,
            speed: Math.random() * .25 + .04,
            opacity: Math.random() * .6 + .1,
            phase: Math.random() * Math.PI * 2
        });
    }

}

function drawParticles(time) {

    ctx.clearRect(0, 0, width, height);

    const offsetX = (mouseX - width / 2) * .0007;
    const offsetY = (mouseY - height / 2) * .0007;

    for (const particle of particles) {

        particle.y -= particle.speed;
        if (particle.y < -5) particle.y = height + 5;

        const pulse = Math.sin(time * .001 + particle.phase) * .5 + .5;

        ctx.beginPath();
        ctx.arc(particle.x + offsetX * 20, particle.y + offsetY * 20, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor.r},${particleColor.g},${particleColor.b},${particle.opacity * (.45 + pulse * .55)})`;
        ctx.fill();

    }

}

/* =========================================
   CORAÇÃO INTERATIVO
========================================= */

function createHeartParticles() {

    heartParticles = [];
    const amount = width < 700 ? 420 : 950;

    for (let i = 0; i < amount; i++) {

        const t = Math.random() * Math.PI * 2;

        const heartX = 16 * Math.pow(Math.sin(t), 3);
        const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        heartParticles.push({
            baseX: heartX * 10 + (Math.random() - .5) * 20,
            baseY: heartY * 10 + (Math.random() - .5) * 20,
            x: width / 2,
            y: height / 2,
            size: Math.random() * 1.8 + .4,
            phase: Math.random() * Math.PI * 2
        });

    }

}

function drawHeart(time) {

    heartCtx.clearRect(0, 0, width, height);

    if (currentScene !== 3 && currentScene !== 6 && currentScene !== 7) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * .018;

    for (const particle of heartParticles) {

        const targetX = centerX + particle.baseX * scale;
        const targetY = centerY + particle.baseY * scale;

        const dx = targetX - mouseX;
        const dy = targetY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let repelX = 0, repelY = 0;

        if (distance < 200) {
            const force = (200 - distance) / 200;
            repelX = (dx / (distance || 1)) * force * 55;
            repelY = (dy / (distance || 1)) * force * 55;
        }

        particle.x += (targetX + repelX - particle.x) * .08;
        particle.y += (targetY + repelY - particle.y) * .08;

        const pulse = Math.sin(time * .002 + particle.phase) * .5 + .5;

        heartCtx.beginPath();
        heartCtx.arc(particle.x, particle.y, particle.size * (.7 + pulse * .5), 0, Math.PI * 2);
        heartCtx.fillStyle = `rgba(${heartColor.r},${Math.round(heartColor.g + pulse * 50)},${Math.round(heartColor.b + pulse * 40)},${.35 + pulse * .6})`;
        heartCtx.fill();

    }

}

/* =========================================
   LOOP DE ANIMAÇÃO ÚNICO
========================================= */

function animationLoop(time) {
    drawParticles(time);
    drawHeart(time);
    updateTilt();
    requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);

/* =========================================
   ÁUDIO — apenas a faixa enviada, com controle de volume
========================================= */

function startAudio() {

    if (!audioEnabled || !music) return;
    if (audioStarted && !music.paused) return;

    audioAttempted = true;
    music.muted = false;
    music.volume = Math.max(.001, baseVolume);

    // Não chamamos load() a cada tentativa: isso pode reiniciar o download no mobile.
    // O primeiro gesto do usuário é usado diretamente para liberar o áudio.
    const promise = music.play();

    if (promise && promise.then) {
        promise.then(() => {
            audioStarted = true;
            audioToggle.classList.add("playing");
            audioToggle.setAttribute("aria-label", "Desativar música");
            if (audioLabel) audioLabel.textContent = "desativar música";
            fadeMusic(Math.min(music.volume, baseVolume), baseVolume, 700);
        }).catch(() => {
            audioStarted = false;
            audioToggle.classList.remove("playing");
        });
    } else {
        audioStarted = true;
        audioToggle.classList.add("playing");
    }
}

music.addEventListener("canplay", () => {
    if (audioEnabled && !audioStarted && audioAttempted) startAudio();
});

music.addEventListener("error", () => {
    audioStarted = false;
    audioToggle.classList.remove("playing");
    audioToggle.setAttribute("aria-label", "Não foi possível carregar a música");
});

// Desktop pode iniciar automaticamente; no mobile o navegador exige gesto.
window.addEventListener("load", () => {
    try { music.volume = baseVolume; music.play().catch(() => {}); } catch (_) {}
});

const unlockAudio = event => {
    if (!event.isTrusted || !audioEnabled || audioStarted) return;
    startAudio();
};
document.addEventListener("pointerdown", unlockAudio, { capture:true, passive:true });
document.addEventListener("touchstart", unlockAudio, { capture:true, passive:true });
document.addEventListener("click", unlockAudio, { capture:true, passive:true });

function fadeMusic(from, to, duration) {

    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        music.volume = from + (to - from) * progress;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);

}

volumeSlider.addEventListener("input", () => {
    baseVolume = Number(volumeSlider.value) / 100;
    if (audioStarted && audioEnabled) {
        music.volume = currentScene === scenes.length - 1 ? baseVolume * .55 : baseVolume;
    }
    if (baseVolume === 0) {
        audioEnabled = false;
        audioToggle.classList.remove("playing");
    } else if (!audioEnabled) {
        audioEnabled = true;
        startAudio();
    }
});

audioToggle.addEventListener("click", () => {

    if (audioEnabled) {
        audioEnabled = false;
        fadeMusic(music.volume, 0, 500);
        audioToggle.classList.remove("playing");
        if (audioLabel) audioLabel.textContent = "ativar música";
    } else {
        audioEnabled = true;
        startAudio();
    }

});

/* pequenos efeitos sonoros sintetizados (nenhum arquivo extra é necessário) */

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function playClick() {
    if (!audioEnabled) return;
    try {
        const ac = getAudioCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(720, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(340, ac.currentTime + .12);
        gain.gain.setValueAtTime(.16, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .18);
        osc.connect(gain).connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + .2);
    } catch (e) {}
}

function playHeartbeat() {
    if (!audioEnabled) return;
    try {
        const ac = getAudioCtx();
        [0, .28].forEach(delay => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(85, ac.currentTime + delay);
            gain.gain.setValueAtTime(.0001, ac.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(.28, ac.currentTime + delay + .04);
            gain.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + delay + .3);
            osc.connect(gain).connect(ac.destination);
            osc.start(ac.currentTime + delay);
            osc.stop(ac.currentTime + delay + .32);
        });
    } catch (e) {}
}

/* =========================================
   TROCA DE CENA
========================================= */

function goToScene(index) {

    if (transitionRunning) return;

    if (index < 0) index = 0;
    if (index >= scenes.length) index = scenes.length - 1;
    if (index === currentScene) { scheduleAutoAdvance(); return; }

    clearAutoAdvance();
    startAudio();
    playClick();

    // A entrada na última etapa ganha uma sequência cinematográfica completa.
    if (index === scenes.length - 1 && currentScene !== index) {
        playCinematicTransition(() => {
            transitionCamera(currentScene, index);
            currentScene = index;
            scenes.forEach((scene, i) => scene.classList.toggle("active", i === currentScene));
            updateInterface();
            handleSceneEffects();
        });
        return;
    }

    transitionCamera(currentScene, index);
    currentScene = index;

    scenes.forEach((scene, i) => {
        scene.classList.toggle("active", i === currentScene);
    });

    updateInterface();
    handleSceneEffects();

}

/* =========================================================
   TRANSIÇÃO CINEMATOGRÁFICA FINAL / REINÍCIO
   ========================================================= */
function playCinematicTransition(onReveal) {
    if (!cinematicTransition) {
        onReveal?.();
        return;
    }

    transitionRunning = true;
    cinematicTransition.classList.remove("playing");
    // força o browser a reconstruir a animação para cada repetição
    void cinematicTransition.offsetWidth;
    cinematicTransition.classList.add("playing");

    window.setTimeout(() => {
        onReveal?.();
    }, 1300);

    window.setTimeout(() => {
        cinematicTransition.classList.remove("playing");
        transitionRunning = false;
    }, 2000);
}

/* =========================================
   INTERFACE
========================================= */

function updateInterface() {

    const total = scenes.length - 1;
    const progress = (currentScene / total) * 100;

    progressFill.style.width = `${progress}%`;
    sceneCurrent.textContent = String(currentScene).padStart(2, "0");

    if (currentScene > 0) interactionHint.classList.add("hidden");
    scheduleAutoAdvance();

}

/* =========================================
   MODO AUTOMÁTICO — cenas e animações
========================================= */
function clearAutoAdvance() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (autoProgress) autoProgress.classList.remove("running");
}

function scheduleAutoAdvance() {
    clearAutoAdvance();
    if (!autoMode || transitionRunning || currentScene >= scenes.length - 1) return;
    const duration = AUTO_TIMES[currentScene] || 7600;
    autoDeadline = Date.now() + duration;
    if (autoProgress) {
        autoProgress.style.setProperty("--auto-duration", `${duration}ms`);
        void autoProgress.offsetWidth;
        autoProgress.classList.add("running");
    }
    autoTimer = setTimeout(() => {
        autoTimer = null;
        if (autoMode && !transitionRunning) goToScene(currentScene + 1);
    }, duration);
}

function setAutoMode(enabled) {
    autoMode = !!enabled;
    document.documentElement.classList.toggle("auto-mode", autoMode);
    if (autoToggle) {
        autoToggle.classList.toggle("active", autoMode);
        autoToggle.setAttribute("aria-pressed", String(autoMode));
    }
    try { localStorage.setItem("eternal-auto", autoMode ? "1" : "0"); } catch (_) {}
    if (autoMode) scheduleAutoAdvance(); else clearAutoAdvance();
}

try { autoMode = localStorage.getItem("eternal-auto") !== "0"; } catch (_) {}
if (autoToggle) autoToggle.addEventListener("click", () => {
    playClick();
    setAutoMode(!autoMode);
});
setAutoMode(autoMode);

// Um pequeno toque/interação reinicia o relógio automático, mas não desativa a experiência.
document.addEventListener("pointerdown", () => {
    if (autoMode && !transitionRunning) scheduleAutoAdvance();
}, { passive:true });

/* =========================================
   TRANSIÇÃO CINEMATOGRÁFICA
========================================= */

function transitionCamera(from, to) {

    transitionRunning = true;
    transitionCanvas.style.opacity = "1";
    transitionCtx.clearRect(0, 0, width, height);

    const gradient = transitionCtx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * .7
    );

    gradient.addColorStop(0, `rgba(${heartColor.r},${heartColor.g},${heartColor.b},.15)`);
    gradient.addColorStop(1, "rgba(0,0,0,.95)");

    transitionCtx.fillStyle = gradient;
    transitionCtx.fillRect(0, 0, width, height);

    transitionCanvas.animate(
        [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }],
        { duration: 1200, easing: "cubic-bezier(.16,1,.3,1)" }
    ).onfinish = () => {
        transitionCanvas.style.opacity = "0";
        transitionRunning = false;
        scheduleAutoAdvance();
    };

}

/* =========================================
   EFEITOS POR CENA
========================================= */

function handleSceneEffects() {

    heartCanvas.style.opacity = (currentScene === 3 || currentScene === 6 || currentScene === 7) ? "1" : "0";

    stopRain();
    startRain(scenes[currentScene]);

    if (currentScene === 3) playHeartbeat();
    if (currentScene === 5) createTouchEffects();

    if (currentScene === 7) {
        playHeartbeat();
        setTimeout(playHeartbeat, 900);
    }

    if (currentScene === 8 && audioStarted) {
        fadeMusic(music.volume, baseVolume * .55, 1800);
    } else if (audioStarted && currentScene !== 8) {
        fadeMusic(music.volume, baseVolume, 1200);
    }

}

/* =========================================
   CHUVA TEMÁTICA (partículas de fundo por etapa)
========================================= */

const RAIN_THEMES = {
    stars:  { symbols: ["✦", "✧", "·", "⋆"], colors: ["#ffffff", "#ffe9c7", "var(--rose)"],           amount: [3200, 4600], size: [8, 18]  },
    dust:   { symbols: ["·", "•"],           colors: ["rgba(255,255,255,.55)", "rgba(255,255,255,.3)"], amount: [3800, 5200], size: [3, 7]   },
    sparks: { symbols: ["✦", "✧", "◦"],      colors: ["var(--rose)", "#ffffff"],                      amount: [2800, 4000], size: [6, 14]  },
    hearts: { symbols: ["♥", "♡"],           colors: ["var(--rose)", "var(--hot-pink)"],              amount: [3200, 4600], size: [10, 22] },
    notes:  { symbols: ["♪", "♫"],           colors: ["var(--rose)", "#c9a7ff"],                      amount: [3600, 5200], size: [12, 22] },
    gold:   { symbols: ["✦", "✧", "●"],      colors: ["#ffd24f", "var(--rose)", "#ffffff"],           amount: [2600, 3800], size: [8, 16]  }
};

function startRain(scene) {

    const type = scene.dataset.rain;
    const layer = scene.querySelector(".rain-layer");
    if (!layer || !type) return;

    if (type === "petals") {
        rainTimer = setInterval(() => spawnPetal(layer), 170);
        return;
    }

    const theme = RAIN_THEMES[type];
    if (!theme) return;

    rainTimer = setInterval(() => spawnRainItem(layer, theme), 260);

}

function stopRain() {
    if (rainTimer) {
        clearInterval(rainTimer);
        rainTimer = null;
    }
    document.querySelectorAll(".rain-layer").forEach(layer => layer.innerHTML = "");
}

function spawnRainItem(layer, theme) {

    const el = document.createElement("span");
    el.className = "rain-item";

    const symbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
    el.textContent = symbol;

    const size = theme.size[0] + Math.random() * (theme.size[1] - theme.size[0]);
    const duration = (theme.amount[0] + Math.random() * (theme.amount[1] - theme.amount[0])) / 1000;
    const drift = (Math.random() - .5) * 160;
    const spin = 120 + Math.random() * 360;
    const color = theme.colors[Math.floor(Math.random() * theme.colors.length)];

    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${size}px`;
    el.style.color = color;
    el.style.opacity = `${.25 + Math.random() * .55}`;
    el.style.setProperty("--drift", `${drift}px`);
    el.style.setProperty("--spin", `${spin}deg`);
    el.style.animationDuration = `${duration}s`;

    layer.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000 + 200);

}

function spawnPetal(layer) {

    const petal = document.createElement("span");
    petal.className = "petal";

    petal.style.left = `${Math.random() * 100}%`;
    petal.style.top = "-30px";
    petal.style.animationDuration = `${5 + Math.random() * 7}s`;
    petal.style.opacity = `${.3 + Math.random() * .7}`;
    petal.style.transform = `rotate(${Math.random() * 360}deg)`;

    layer.appendChild(petal);
    setTimeout(() => petal.remove(), 13000);

}

/* =========================================
   INTERAÇÃO / TOQUE
========================================= */

function createTouchEffects() {

    const layer = document.getElementById("touchLayer");
    if (!layer || layer.dataset.bound === "1") return;
    layer.dataset.bound = "1";

    const activate = event => {
        startAudio();
        playClick();
        createBurst(event.clientX, event.clientY);
    };

    layer.addEventListener("pointerdown", activate, { passive: true });

}

function createBurst(x, y) {

    const amount = 35;

    for (let i = 0; i < amount; i++) {

        const particle = document.createElement("span");
        const size = 2 + Math.random() * 4;

        particle.style.position = "fixed";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.borderRadius = "50%";
        particle.style.background = Math.random() > .2 ? "var(--rose)" : "#ffffff";
        particle.style.boxShadow = "0 0 15px var(--pink)";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "200";

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 170;
        const targetX = Math.cos(angle) * distance;
        const targetY = Math.sin(angle) * distance;

        particle.animate(
            [
                { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
                { transform: `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(0)`, opacity: 0 }
            ],
            { duration: 700 + Math.random() * 800, easing: "cubic-bezier(.16,1,.3,1)" }
        ).onfinish = () => particle.remove();

    }

}

/* =========================================
   PERSONALIZAÇÃO DE CORES
========================================= */

const DEFAULT_THEME = {
    primary: "#ffabc5",
    secondary: "#e45187",
    hot: "#ff4f91",
    wine: "#64152f",
    wineLight: "#9b2851"
};

function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3
        ? clean.split("").map(c => c + c).join("")
        : clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function mix(hexA, hexB, amount) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * amount);
    const g = Math.round(a.g + (b.g - a.g) * amount);
    const bl = Math.round(a.b + (b.b - a.b) * amount);
    return `rgb(${r},${g},${bl})`;
}

function applyTheme(primary, secondary, wine, wineLight) {

    const finalWine = wine || mix(secondary, "#000000", .55);
    const finalWineLight = wineLight || mix(secondary, "#000000", .18);

    root.style.setProperty("--rose", primary);
    root.style.setProperty("--hot-pink", secondary);
    root.style.setProperty("--pink", secondary);
    root.style.setProperty("--wine", finalWine);
    root.style.setProperty("--wine-light", finalWineLight);

    colorPrimary.value = primary;
    colorSecondary.value = secondary;

    refreshThemeColors();

}

function refreshThemeColors() {
    const styles = getComputedStyle(root);
    particleColor = hexOrRgbToRgb(styles.getPropertyValue("--rose").trim());
    heartColor = hexOrRgbToRgb(styles.getPropertyValue("--hot-pink").trim());
}

function hexOrRgbToRgb(value) {
    if (value.startsWith("#")) return hexToRgb(value);
    const match = value.match(/\d+/g);
    if (match && match.length >= 3) return { r: +match[0], g: +match[1], b: +match[2] };
    return { r: 255, g: 150, b: 190 };
}

document.querySelectorAll(".theme-swatch").forEach(swatch => {
    swatch.addEventListener("click", () => {
        playClick();
        applyTheme(swatch.dataset.primary, swatch.dataset.secondary, swatch.dataset.wine);
    });
});

colorPrimary.addEventListener("input", () => applyTheme(colorPrimary.value, colorSecondary.value));
colorSecondary.addEventListener("input", () => applyTheme(colorPrimary.value, colorSecondary.value));

themeReset.addEventListener("click", () => {
    playClick();
    applyTheme(DEFAULT_THEME.primary, DEFAULT_THEME.hot, DEFAULT_THEME.wine, DEFAULT_THEME.wineLight);
});

themeToggle.addEventListener("click", () => {
    themePanel.classList.toggle("open");
});

document.addEventListener("click", event => {
    if (!themePanel.classList.contains("open")) return;
    if (themePanel.contains(event.target) || themeToggle.contains(event.target)) return;
    themePanel.classList.remove("open");
});

refreshThemeColors();

/* =========================================
   PERSONALIZAÇÃO DO UNIVERSO / BACKGROUND
========================================= */
const DEFAULT_BACKGROUND = { color: "#050305", depth: 70, stars: 65, motion: 75 };

function applyBackgroundSettings() {
    if (!bgColor || !depthSlider || !starsSlider || !motionSlider) return;
    const depth = Number(depthSlider.value) / 100;
    const stars = Number(starsSlider.value) / 100;
    const motion = Number(motionSlider.value) / 100;

    root.style.setProperty("--transition-bg", bgColor.value);
    root.style.setProperty("--bg-depth", depth.toFixed(2));
    root.style.setProperty("--bg-stars", stars.toFixed(2));
    root.style.setProperty("--bg-motion", Math.max(.05, motion).toFixed(2));
    root.style.setProperty("--black", bgColor.value);

    if (depthValue) depthValue.textContent = depthSlider.value;
    if (starsValue) starsValue.textContent = starsSlider.value;
    if (motionValue) motionValue.textContent = motionSlider.value;

    try {
        localStorage.setItem("eternal-background", JSON.stringify({ color:bgColor.value, depth:Number(depthSlider.value), stars:Number(starsSlider.value), motion:Number(motionSlider.value) }));
    } catch (_) {}
}

function loadBackgroundSettings() {
    let data = DEFAULT_BACKGROUND;
    try { data = { ...DEFAULT_BACKGROUND, ...(JSON.parse(localStorage.getItem("eternal-background") || "{}")) }; } catch (_) {}
    if (bgColor) bgColor.value = data.color;
    if (depthSlider) depthSlider.value = data.depth;
    if (starsSlider) starsSlider.value = data.stars;
    if (motionSlider) motionSlider.value = data.motion;
    applyBackgroundSettings();
}

[bgColor, depthSlider, starsSlider, motionSlider].filter(Boolean).forEach(control => control.addEventListener("input", applyBackgroundSettings));

themeReset.addEventListener("click", () => {
    if (bgColor) bgColor.value = DEFAULT_BACKGROUND.color;
    if (depthSlider) depthSlider.value = DEFAULT_BACKGROUND.depth;
    if (starsSlider) starsSlider.value = DEFAULT_BACKGROUND.stars;
    if (motionSlider) motionSlider.value = DEFAULT_BACKGROUND.motion;
    applyBackgroundSettings();
});

loadBackgroundSettings();

/* =========================================
   BOTÕES DE NAVEGAÇÃO
========================================= */

nextButton.addEventListener("click", () => goToScene(currentScene + 1));
previousButton.addEventListener("click", () => goToScene(currentScene - 1));

document.querySelectorAll("[data-next]").forEach(button => {
    button.addEventListener("click", () => {
        startAudio();
        goToScene(currentScene + 1);
    });
});

restartButton.addEventListener("click", () => {
    if (transitionRunning) return;
    playClick();
    playCinematicTransition(() => {
        currentScene = 0;
        scenes.forEach((scene, i) => scene.classList.toggle("active", i === 0));
        updateInterface();
        handleSceneEffects();
        startAudio();
    });
});

/* =========================================
   TECLADO
========================================= */

document.addEventListener("keydown", event => {

    if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goToScene(currentScene + 1);
    }

    if (event.key === "ArrowLeft") {
        goToScene(currentScene - 1);
    }

});

/* =========================================
   SWIPE MOBILE
========================================= */

let touchStartX = 0;
let touchStartY = 0;
let swipeBlocked = false;

document.addEventListener("touchstart", event => {
    const target = event.target.closest("button, input, #heartInteraction, #touchLayer");
    swipeBlocked = !!target;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", event => {
    if (swipeBlocked) {
        swipeBlocked = false;
        return;
    }

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
        if (diffX < 0) {
            goToScene(currentScene + 1);
        } else {
            goToScene(currentScene - 1);
        }
    }

}, { passive: true });

/* =========================================
   INICIALIZAÇÃO
========================================= */

resizeCanvas();
updateInterface();
handleSceneEffects();


/* =========================================================
   INTERAÇÕES 3D — CORAÇÃO / TOUCH / PERFORMANCE
   ========================================================= */

const heart3D = document.getElementById("heart3D");
const heartInteraction = document.getElementById("heartInteraction");

let heartRotX = -10;
let heartRotY = 0;
let heartPointerId = null;
let heartLastX = 0;
let heartLastY = 0;

function renderHeart3D() {
    if (!heart3D) return;
    heart3D.style.transform = `rotateX(${heartRotX}deg) rotateY(${heartRotY}deg) rotateZ(-45deg)`;
}

function beginHeartDrag(event) {
    if (!heartInteraction || currentScene !== 3) return;
    heartPointerId = event.pointerId;
    heartLastX = event.clientX;
    heartLastY = event.clientY;
    heartInteraction.classList.add("dragging");
    try { heartInteraction.setPointerCapture(event.pointerId); } catch (_) {}
}

function moveHeartDrag(event) {
    if (heartPointerId !== event.pointerId) return;
    const dx = event.clientX - heartLastX;
    const dy = event.clientY - heartLastY;
    heartLastX = event.clientX;
    heartLastY = event.clientY;
    heartRotY += dx * .55;
    heartRotX = Math.max(-35, Math.min(35, heartRotX - dy * .35));
    renderHeart3D();
}

function endHeartDrag(event) {
    if (heartPointerId !== event.pointerId) return;
    heartPointerId = null;
    heartInteraction.classList.remove("dragging");
    try { heartInteraction.releasePointerCapture(event.pointerId); } catch (_) {}
    playHeartbeat();
}

if (heartInteraction) {
    heartInteraction.addEventListener("pointerdown", beginHeartDrag);
    heartInteraction.addEventListener("pointermove", moveHeartDrag);
    heartInteraction.addEventListener("pointerup", endHeartDrag);
    heartInteraction.addEventListener("pointercancel", endHeartDrag);
}

renderHeart3D();

/* Navegação por swipe: não dispara quando o usuário está arrastando o coração ou um controle. */
let swipeTarget = null;
document.addEventListener("touchstart", event => {
    swipeTarget = event.target.closest("button, input, #heartInteraction, #touchLayer");
}, { passive: true });

document.addEventListener("touchend", event => {
    if (swipeTarget) {
        swipeTarget = null;
        return;
    }
}, { passive: true });

/* Inclinação com o celular: só usa movimento quando o dispositivo realmente fornece dados. */
window.addEventListener("deviceorientation", event => {
    if (event.beta == null || event.gamma == null) return;
    const x = Math.max(-1, Math.min(1, event.gamma / 45));
    const y = Math.max(-1, Math.min(1, (event.beta - 45) / 45));
    targetTiltY = x * 7;
    targetTiltX = y * -7;
}, { passive: true });

/* Volume fica persistente durante a experiência. */
try {
    const savedVolume = localStorage.getItem("eternal-volume");
    if (savedVolume !== null) {
        const value = Math.max(0, Math.min(100, Number(savedVolume)));
        if (Number.isFinite(value)) {
            volumeSlider.value = String(value);
            baseVolume = value / 100;
            if (baseVolume === 0) audioEnabled = false;
        }
    }
    volumeSlider.addEventListener("input", () => {
        localStorage.setItem("eternal-volume", volumeSlider.value);
    });
} catch (_) {}
